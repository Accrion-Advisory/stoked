import { StockPrice } from '@/types'
import { priceKey } from '@/lib/portfolio'

export type PriceMap = Record<string, StockPrice>
export type Pair = { symbol: string; exchange: 'NSE' | 'BSE' }

// How long a quote is considered fresh before we refetch it.
export const PRICE_TTL_MS = 5 * 60 * 1000

// App-level singleton cache (survives component unmounts / route changes) plus
// an in-flight map so the same symbol is never fetched twice concurrently.
const cache = new Map<string, { data: StockPrice; ts: number }>()
const inflight = new Map<string, Promise<unknown>>()

export function cachedPrices(): PriceMap {
  const out: PriceMap = {}
  for (const [k, v] of cache) out[k] = v.data
  return out
}

/**
 * Ensure quotes for `pairs` are loaded, hitting the network only for symbols
 * that are missing/stale (or all of them when `force`). Concurrent callers for
 * the same symbol share one request. Returns the merged cache snapshot.
 */
export async function fetchPrices(pairs: Pair[], force = false): Promise<PriceMap> {
  const now = Date.now()
  const stale: Pair[] = []
  for (const p of pairs) {
    const key = priceKey(p.symbol, p.exchange)
    const c = cache.get(key)
    if ((force || !c || now - c.ts > PRICE_TTL_MS) && !inflight.has(key)) stale.push(p)
  }

  if (stale.length) {
    const s = stale.map((p) => `${p.symbol}:${p.exchange}`).join(',')
    const promise = fetch(`/api/prices?s=${encodeURIComponent(s)}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: PriceMap) => {
        const t = Date.now()
        for (const [k, v] of Object.entries(data)) cache.set(k, { data: v, ts: t })
      })
      .catch(() => {})
      .finally(() => {
        for (const p of stale) inflight.delete(priceKey(p.symbol, p.exchange))
      })
    for (const p of stale) inflight.set(priceKey(p.symbol, p.exchange), promise)
  }

  // Wait on every in-flight request that covers a requested pair — including
  // ones kicked off by another caller.
  await Promise.all(
    pairs.map((p) => inflight.get(priceKey(p.symbol, p.exchange))).filter(Boolean)
  )
  return cachedPrices()
}
