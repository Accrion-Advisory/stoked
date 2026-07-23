import { Trade } from '@/types'

// Newton-Raphson XIRR implementation
export function calculateXIRR(cashflows: { amount: number; date: Date }[]): number {
  if (cashflows.length < 2) return 0

  const DAYS_IN_YEAR = 365
  const MAX_ITERATIONS = 100
  const TOLERANCE = 1e-7

  function npv(rate: number): number {
    const firstDate = cashflows[0].date
    return cashflows.reduce((sum, cf) => {
      const days = (cf.date.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
      return sum + cf.amount / Math.pow(1 + rate, days / DAYS_IN_YEAR)
    }, 0)
  }

  function dnpv(rate: number): number {
    const firstDate = cashflows[0].date
    return cashflows.reduce((sum, cf) => {
      const days = (cf.date.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
      const t = days / DAYS_IN_YEAR
      return sum - (t * cf.amount) / Math.pow(1 + rate, t + 1)
    }, 0)
  }

  let rate = 0.1
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const npvValue = npv(rate)
    const dnpvValue = dnpv(rate)
    if (Math.abs(dnpvValue) < 1e-10) break
    let newRate = rate - npvValue / dnpvValue
    // Keep the discount base (1 + rate) positive — otherwise Math.pow of a
    // negative base to a fractional power returns NaN (this is what produced
    // "XIRR NaN%" on heavy-loss portfolios).
    if (!isFinite(newRate) || newRate <= -0.9999) newRate = -0.9999
    if (Math.abs(newRate - rate) < TOLERANCE) {
      rate = newRate
      break
    }
    rate = newRate
  }

  const result = rate * 100
  if (!isFinite(result)) return 0
  // An annualized return can't be worse than losing everything (-100%).
  return Math.max(result, -99.99)
}

export function calculatePortfolioXIRR(
  trades: Trade[],
  currentValue: number,
  today: Date = new Date()
): number {
  if (!trades.length) return 0

  const cashflows: { amount: number; date: Date }[] = []

  trades.forEach((trade) => {
    const date = new Date(trade.date)
    const amount = trade.quantity * trade.price + (trade.charges || 0)
    if (trade.type === 'BUY') {
      cashflows.push({ amount: -amount, date })
    } else {
      cashflows.push({ amount: amount, date })
    }
  })

  // Terminal value (current portfolio value) as positive cashflow today
  if (currentValue > 0) {
    cashflows.push({ amount: currentValue, date: today })
  }

  cashflows.sort((a, b) => a.date.getTime() - b.date.getTime())

  try {
    return calculateXIRR(cashflows)
  } catch {
    return 0
  }
}

export function calculateHoldings(trades: Trade[]): {
  symbol: string
  exchange: 'NSE' | 'BSE'
  quantity: number
  avg_price: number
  total_invested: number
  first_buy_date: string
  trades: Trade[]
}[] {
  const holdingsMap = new Map<string, {
    symbol: string
    exchange: 'NSE' | 'BSE'
    buyLots: { qty: number; price: number; date: string; charges: number }[]
    quantity: number
    total_invested: number
    first_buy_date: string
    trades: Trade[]
  }>()

  // Sort trades by date
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  sorted.forEach((trade) => {
    const key = `${trade.symbol}.${trade.exchange}`
    if (!holdingsMap.has(key)) {
      holdingsMap.set(key, {
        symbol: trade.symbol,
        exchange: trade.exchange,
        buyLots: [],
        quantity: 0,
        total_invested: 0,
        first_buy_date: trade.date,
        trades: [],
      })
    }
    const holding = holdingsMap.get(key)!
    holding.trades.push(trade)

    if (trade.type === 'BUY') {
      holding.buyLots.push({
        qty: trade.quantity,
        price: trade.price,
        date: trade.date,
        charges: trade.charges || 0,
      })
      holding.quantity += trade.quantity
      holding.total_invested += trade.quantity * trade.price + (trade.charges || 0)
    } else {
      // FIFO sell
      let qtyToSell = trade.quantity
      holding.quantity -= trade.quantity
      while (qtyToSell > 0 && holding.buyLots.length > 0) {
        const lot = holding.buyLots[0]
        if (lot.qty <= qtyToSell) {
          holding.total_invested -= lot.qty * lot.price
          qtyToSell -= lot.qty
          holding.buyLots.shift()
        } else {
          holding.total_invested -= qtyToSell * lot.price
          lot.qty -= qtyToSell
          qtyToSell = 0
        }
      }
    }
  })

  return Array.from(holdingsMap.values())
    .filter((h) => h.quantity > 0)
    .map((h) => ({
      symbol: h.symbol,
      exchange: h.exchange,
      quantity: h.quantity,
      // Average PURCHASE price (weighted, excluding brokerage/charges) — this is
      // the per-share price the user actually paid. Charges still live in
      // total_invested for cost-basis / P&L.
      avg_price: h.quantity > 0 ? h.buyLots.reduce((s, l) => s + l.qty * l.price, 0) / h.quantity : 0,
      total_invested: h.total_invested,
      first_buy_date: h.first_buy_date,
      trades: h.trades,
    }))
}
