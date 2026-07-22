import { Holding, MemberPortfolio, StockPrice, Trade, User } from '@/types'
import { calculateHoldings, calculatePortfolioXIRR } from '@/lib/xirr'

export type PriceMap = Record<string, StockPrice>

function priceKey(symbol: string, exchange: string) {
  return `${symbol.toUpperCase()}.${exchange}`
}

/** Attach live price → current value / P&L onto a bare holding. */
export function enrichHolding(h: Holding, prices: PriceMap): Holding {
  const price = prices[priceKey(h.symbol, h.exchange)] ?? prices[h.symbol.toUpperCase()]
  if (!price) {
    // No live price yet — fall back to cost basis so the UI stays sane.
    return { ...h, current_price: h.avg_price, current_value: h.total_invested, pnl: 0, pnl_percent: 0 }
  }
  const current_value = h.quantity * price.price
  const pnl = current_value - h.total_invested
  return {
    ...h,
    current_price: price.price,
    current_value,
    pnl,
    pnl_percent: h.total_invested > 0 ? (pnl / h.total_invested) * 100 : 0,
  }
}

/**
 * Roll a user's trades + live prices into a full portfolio summary. This is the
 * single source of truth used by the dashboard, group leaderboard, and the
 * individual portfolio pages so every screen agrees on the numbers.
 */
export function buildMemberPortfolio(user: User, trades: Trade[], prices: PriceMap): MemberPortfolio {
  const holdings = calculateHoldings(trades).map((h) => enrichHolding(h as Holding, prices))
  const total_invested = holdings.reduce((s, h) => s + h.total_invested, 0)
  const current_value = holdings.reduce((s, h) => s + (h.current_value ?? 0), 0)
  const total_pnl = current_value - total_invested
  return {
    user,
    holdings,
    total_invested,
    current_value,
    total_pnl,
    total_pnl_percent: total_invested > 0 ? (total_pnl / total_invested) * 100 : 0,
    xirr: calculatePortfolioXIRR(trades, current_value),
    trade_count: trades.length,
  }
}

/** Unique {symbol, exchange} pairs across a set of trades/watchlist rows. */
export function uniqueSymbols(
  rows: { symbol: string; exchange: 'NSE' | 'BSE' }[]
): { symbol: string; exchange: 'NSE' | 'BSE' }[] {
  const seen = new Set<string>()
  const out: { symbol: string; exchange: 'NSE' | 'BSE' }[] = []
  for (const r of rows) {
    const k = priceKey(r.symbol, r.exchange)
    if (!seen.has(k)) {
      seen.add(k)
      out.push({ symbol: r.symbol, exchange: r.exchange })
    }
  }
  return out
}

export { priceKey }
