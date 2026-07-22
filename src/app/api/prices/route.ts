import { NextRequest, NextResponse } from 'next/server'
import { fetchStockPrice } from '@/lib/prices'
import { priceKey } from '@/lib/portfolio'
import type { StockPrice } from '@/types'

// GET /api/prices?s=RELIANCE:NSE,ZOMATO:NSE
// Returns { "RELIANCE.NSE": StockPrice, ... }. Yahoo Finance is fetched here on
// the server (it has no CORS headers, so the browser can't call it directly).
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('s') ?? ''
  const pairs = raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const [symbol, exchange] = p.split(':')
      return { symbol, exchange: (exchange === 'BSE' ? 'BSE' : 'NSE') as 'NSE' | 'BSE' }
    })

  const out: Record<string, StockPrice> = {}
  await Promise.allSettled(
    pairs.map(async ({ symbol, exchange }) => {
      const price = await fetchStockPrice(symbol, exchange)
      if (price) out[priceKey(symbol, exchange)] = price
    })
  )

  return NextResponse.json(out, {
    headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' },
  })
}
