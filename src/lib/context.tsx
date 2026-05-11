'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/types'
import { DEV_USERS, DEV_GROUP, DEV_TRADES, DEV_WATCHLIST, DEV_MEMBERSHIPS } from '@/lib/dev-data'
import { Group, Trade, WatchlistItem, Membership } from '@/types'

interface AppContext {
  user: User | null
  group: Group | null
  trades: Trade[]
  watchlist: WatchlistItem[]
  memberships: Membership[]
  isDevMode: boolean
  addTrade: (trade: Omit<Trade, 'id' | 'created_at'>) => void
  addWatchlist: (item: Omit<WatchlistItem, 'id' | 'created_at'>) => void
}

const Ctx = createContext<AppContext | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [trades, setTrades] = useState<Trade[]>(DEV_TRADES)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(DEV_WATCHLIST)

  useEffect(() => {
    const stored = localStorage.getItem('stoked_dev_user')
    if (stored) setUserId(stored)
  }, [])

  const user = DEV_USERS.find((u) => u.id === userId) || null

  function addTrade(trade: Omit<Trade, 'id' | 'created_at'>) {
    const newTrade: Trade = {
      ...trade,
      id: `trade-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    setTrades((prev) => [...prev, newTrade])
  }

  function addWatchlist(item: Omit<WatchlistItem, 'id' | 'created_at'>) {
    const newItem: WatchlistItem = {
      ...item,
      id: `watch-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    setWatchlist((prev) => [...prev, newItem])
  }

  return (
    <Ctx.Provider
      value={{
        user,
        group: DEV_GROUP,
        trades,
        watchlist,
        memberships: DEV_MEMBERSHIPS,
        isDevMode: true,
        addTrade,
        addWatchlist,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
