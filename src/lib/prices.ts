import { StockPrice } from '@/types'

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

const priceCache = new Map<string, { data: StockPrice; timestamp: number }>()

function isMarketOpen(): boolean {
  const now = new Date()
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const day = ist.getDay()
  const hours = ist.getHours()
  const minutes = ist.getMinutes()
  const timeInMinutes = hours * 60 + minutes
  // NSE: Mon-Fri, 9:15 AM - 3:30 PM IST
  return day >= 1 && day <= 5 && timeInMinutes >= 555 && timeInMinutes <= 930
}

export function toYahooSymbol(symbol: string, exchange: 'NSE' | 'BSE'): string {
  const suffix = exchange === 'BSE' ? '.BO' : '.NS'
  return `${symbol.toUpperCase()}${suffix}`
}

export async function fetchStockPrice(
  symbol: string,
  exchange: 'NSE' | 'BSE' = 'NSE'
): Promise<StockPrice | null> {
  const yahooSymbol = toYahooSymbol(symbol, exchange)
  const cacheKey = yahooSymbol
  const cached = priceCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    const url = `${YAHOO_BASE}/${yahooSymbol}?interval=1d&range=1d`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 900 },
    })

    if (!res.ok) return null

    const json = await res.json()
    const result = json?.chart?.result?.[0]
    if (!result) return null

    const meta = result.meta
    const price: StockPrice = {
      symbol,
      company_name: meta.shortName || meta.longName || symbol,
      price: meta.regularMarketPrice || meta.previousClose,
      change: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
      change_percent:
        (((meta.regularMarketPrice || 0) - (meta.previousClose || 0)) /
          (meta.previousClose || 1)) *
        100,
      previous_close: meta.previousClose || 0,
      open: meta.regularMarketOpen || 0,
      day_high: meta.regularMarketDayHigh || 0,
      day_low: meta.regularMarketDayLow || 0,
      volume: meta.regularMarketVolume,
      market_cap: meta.marketCap,
      last_updated: new Date().toISOString(),
      is_market_open: isMarketOpen(),
    }

    priceCache.set(cacheKey, { data: price, timestamp: Date.now() })
    return price
  } catch {
    return null
  }
}

export async function fetchMultiplePrices(
  stocks: { symbol: string; exchange: 'NSE' | 'BSE' }[]
): Promise<Map<string, StockPrice>> {
  const results = new Map<string, StockPrice>()

  await Promise.allSettled(
    stocks.map(async ({ symbol, exchange }) => {
      const price = await fetchStockPrice(symbol, exchange)
      if (price) results.set(symbol, price)
    })
  )

  return results
}

// Popular NSE stocks for autocomplete seed
export const POPULAR_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', exchange: 'NSE' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', exchange: 'NSE' },
  { symbol: 'INFY', name: 'Infosys Ltd', exchange: 'NSE' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', exchange: 'NSE' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', exchange: 'NSE' },
  { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', exchange: 'NSE' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', exchange: 'NSE' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', exchange: 'NSE' },
  { symbol: 'ITC', name: 'ITC Ltd', exchange: 'NSE' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', exchange: 'NSE' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', exchange: 'NSE' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', exchange: 'NSE' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', exchange: 'NSE' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', exchange: 'NSE' },
  { symbol: 'TITAN', name: 'Titan Company Ltd', exchange: 'NSE' },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd', exchange: 'NSE' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', exchange: 'NSE' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries', exchange: 'NSE' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd', exchange: 'NSE' },
  { symbol: 'PAYTM', name: 'One97 Communications Ltd', exchange: 'NSE' },
  { symbol: 'NYKAA', name: 'FSN E-Commerce Ventures Ltd', exchange: 'NSE' },
  { symbol: 'DMART', name: 'Avenue Supermarts Ltd', exchange: 'NSE' },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries Ltd', exchange: 'NSE' },
  { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd', exchange: 'NSE' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', exchange: 'NSE' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation', exchange: 'NSE' },
  { symbol: 'NTPC', name: 'NTPC Ltd', exchange: 'NSE' },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation of India', exchange: 'NSE' },
] as const
