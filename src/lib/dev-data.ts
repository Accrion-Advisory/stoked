import { User, Trade, Group, Membership, WatchlistItem } from '@/types'

export const DEV_USERS: User[] = [
  { id: 'dev-user-1', username: 'vikas', name: 'Vikas Sharma', email: 'vikas@stoked.dev', created_at: '2024-01-01T00:00:00Z' },
  { id: 'dev-user-2', username: 'rahul', name: 'Rahul Verma', email: 'rahul@stoked.dev', created_at: '2024-01-02T00:00:00Z' },
  { id: 'dev-user-3', username: 'sneha', name: 'Sneha Iyer', email: 'sneha@stoked.dev', created_at: '2024-01-03T00:00:00Z' },
]

export const DEV_GROUP: Group = {
  id: 'dev-group-1',
  name: 'Whitefield Gang',
  invite_code: 'whitefielddevinvite',
  created_by: 'dev-user-1',
  created_at: '2024-01-01T00:00:00Z',
  member_count: 3,
}

export const DEV_MEMBERSHIPS: Membership[] = DEV_USERS.map((u, i) => ({
  id: `membership-${i + 1}`,
  user_id: u.id,
  group_id: DEV_GROUP.id,
  joined_at: u.created_at,
  is_visible: true,
  user: u,
}))

export const DEV_TRADES: Trade[] = [
  // Vikas
  { id: 't1', user_id: 'dev-user-1', symbol: 'RELIANCE', exchange: 'NSE', type: 'BUY', quantity: 100, price: 2620.10, date: '2024-04-12', notes: 'Strong Q4 expectations', created_at: '2024-04-12T10:00:00Z' },
  { id: 't2', user_id: 'dev-user-1', symbol: 'RELIANCE', exchange: 'NSE', type: 'BUY', quantity: 50, price: 2701.50, date: '2024-05-02', notes: 'Adding on dip', created_at: '2024-05-02T10:00:00Z' },
  { id: 't3', user_id: 'dev-user-1', symbol: 'ZOMATO', exchange: 'NSE', type: 'BUY', quantity: 500, price: 182.10, date: '2024-03-15', created_at: '2024-03-15T10:00:00Z' },
  { id: 't4', user_id: 'dev-user-1', symbol: 'TCS', exchange: 'NSE', type: 'BUY', quantity: 20, price: 3754.20, date: '2024-02-01', notes: 'IT sector recovery play', created_at: '2024-02-01T10:00:00Z' },
  { id: 't5', user_id: 'dev-user-1', symbol: 'HDFCBANK', exchange: 'NSE', type: 'BUY', quantity: 80, price: 1520.00, date: '2024-01-20', created_at: '2024-01-20T10:00:00Z' },

  // Rahul
  { id: 't6', user_id: 'dev-user-2', symbol: 'HDFCBANK', exchange: 'NSE', type: 'BUY', quantity: 110, price: 1498.20, date: '2024-01-15', notes: 'Undervalued post merger', created_at: '2024-01-15T10:00:00Z' },
  { id: 't7', user_id: 'dev-user-2', symbol: 'INFY', exchange: 'NSE', type: 'BUY', quantity: 60, price: 1628.40, date: '2024-02-10', created_at: '2024-02-10T10:00:00Z' },
  { id: 't8', user_id: 'dev-user-2', symbol: 'RELIANCE', exchange: 'NSE', type: 'BUY', quantity: 80, price: 2701.50, date: '2024-05-02', notes: 'Retail + Jio momentum', created_at: '2024-05-02T10:00:00Z' },
  { id: 't9', user_id: 'dev-user-2', symbol: 'ZOMATO', exchange: 'NSE', type: 'BUY', quantity: 200, price: 174.00, date: '2024-04-01', created_at: '2024-04-01T10:00:00Z' },

  // Sneha
  { id: 't10', user_id: 'dev-user-3', symbol: 'TITAN', exchange: 'NSE', type: 'BUY', quantity: 30, price: 3512.20, date: '2024-03-01', notes: 'Jewelry demand strong', created_at: '2024-03-01T10:00:00Z' },
  { id: 't11', user_id: 'dev-user-3', symbol: 'ZOMATO', exchange: 'NSE', type: 'BUY', quantity: 300, price: 182.10, date: '2024-03-10', created_at: '2024-03-10T10:00:00Z' },
  { id: 't12', user_id: 'dev-user-3', symbol: 'PAYTM', exchange: 'NSE', type: 'BUY', quantity: 200, price: 398.45, date: '2024-02-20', notes: 'Recovery bet post RBI noise', created_at: '2024-02-20T10:00:00Z' },
  { id: 't13', user_id: 'dev-user-3', symbol: 'HDFCBANK', exchange: 'NSE', type: 'BUY', quantity: 10, price: 1610.00, date: '2024-04-05', created_at: '2024-04-05T10:00:00Z' },
]

export const DEV_WATCHLIST: WatchlistItem[] = [
  { id: 'w1', user_id: 'dev-user-1', symbol: 'TITAN', exchange: 'NSE', target_price: 3800, created_at: '2024-05-01T00:00:00Z', user: DEV_USERS[0] },
  { id: 'w2', user_id: 'dev-user-2', symbol: 'ZOMATO', exchange: 'NSE', target_price: 200, created_at: '2024-05-02T00:00:00Z', user: DEV_USERS[1] },
  { id: 'w3', user_id: 'dev-user-3', symbol: 'SIEMENS', exchange: 'NSE', target_price: 6500, created_at: '2024-05-03T00:00:00Z', user: DEV_USERS[2] },
]

export const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export function getDevUser(userId: string): User | undefined {
  return DEV_USERS.find((u) => u.id === userId)
}

export function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getAvatarColor(userId: string): string {
  const colors = ['#5B8CFF', '#21D07A', '#F6C453', '#FF5C7A', '#A78BFA', '#34D399']
  const idx = userId.charCodeAt(userId.length - 1) % colors.length
  return colors[idx]
}
