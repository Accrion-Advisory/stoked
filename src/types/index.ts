export interface User {
  id: string
  name: string
  email: string
  avatar_url?: string
  created_at: string
}

export interface Group {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
  member_count?: number
}

export interface Membership {
  id: string
  user_id: string
  group_id: string
  joined_at: string
  is_visible: boolean
  user?: User
}

export interface Trade {
  id: string
  user_id: string
  group_id: string
  symbol: string
  exchange: 'NSE' | 'BSE'
  type: 'BUY' | 'SELL'
  quantity: number
  price: number
  date: string
  charges?: number
  notes?: string
  created_at: string
  user?: User
}

export interface Holding {
  symbol: string
  exchange: 'NSE' | 'BSE'
  quantity: number
  avg_price: number
  total_invested: number
  current_price?: number
  current_value?: number
  pnl?: number
  pnl_percent?: number
  first_buy_date: string
  trades: Trade[]
}

export interface WatchlistItem {
  id: string
  user_id: string
  group_id: string
  symbol: string
  exchange: 'NSE' | 'BSE'
  target_price?: number
  created_at: string
  user?: User
  current_price?: number
  change_percent?: number
}

export interface StockPrice {
  symbol: string
  price: number
  change: number
  change_percent: number
  previous_close: number
  open: number
  day_high: number
  day_low: number
  volume?: number
  market_cap?: number
  company_name: string
  last_updated: string
  is_market_open: boolean
}

export interface MemberPortfolio {
  user: User
  holdings: Holding[]
  total_invested: number
  current_value: number
  total_pnl: number
  total_pnl_percent: number
  xirr?: number
  trade_count: number
}

export interface GroupStats {
  total_value: number
  total_invested: number
  member_count: number
  avg_xirr: number
  top_performer?: MemberPortfolio
  most_held_stock?: string
  today_change?: number
}
