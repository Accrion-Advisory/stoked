'use client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react'
import type {
  Connection,
  Group,
  Membership,
  Profile,
  Trade,
  WatchlistItem,
} from '@/types'
import {
  DEV_GROUP,
  DEV_MEMBERSHIPS,
  DEV_TRADES,
  DEV_USERS,
  DEV_WATCHLIST,
} from '@/lib/dev-data'
import {
  AppData,
  loadAppData,
  insertTrade,
  deleteTrade as qDeleteTrade,
  deleteTrades as qDeleteTrades,
  updateTrade as qUpdateTrade,
  type TradePatch,
  insertWatchlist,
  deleteWatchlist as qDeleteWatchlist,
  createGroup as qCreateGroup,
  joinGroup as qJoinGroup,
  leaveGroup as qLeaveGroup,
  setGroupVisibility as qSetGroupVisibility,
  findProfileByUsername,
  sendConnection as qSendConnection,
  acceptConnection as qAcceptConnection,
  removeConnection as qRemoveConnection,
} from '@/lib/queries'
import { uniqueSymbols } from '@/lib/portfolio'
import { fetchPrices, cachedPrices, PRICE_TTL_MS, type PriceMap, type Pair } from '@/lib/price-store'

const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

interface AppContextValue extends AppData {
  loading: boolean
  isDevMode: boolean
  // Back-compat aliases used throughout the pages.
  user: Profile | null
  group: Group | null
  members: Profile[] // profiles whose portfolios I can see (incl. me)
  currentGroup: Group | null
  currentGroupId: string | null
  setCurrentGroupId: (id: string | null) => void
  prices: PriceMap
  // Load quotes for extra symbols on demand (e.g. the stock detail page).
  requestSymbols: (pairs: Pair[]) => void
  // Force-refresh quotes for everything in view (pull-to-refresh).
  refreshPrices: () => Promise<void>
  // Mutations
  addTrade: (t: Omit<Trade, 'id' | 'created_at' | 'user'>) => Promise<void>
  updateTrade: (id: string, patch: TradePatch) => Promise<void>
  removeTrade: (id: string) => Promise<void>
  removeTrades: (ids: string[]) => Promise<void>
  addWatchlist: (w: Omit<WatchlistItem, 'id' | 'created_at' | 'user'>) => Promise<void>
  removeWatchlist: (id: string) => Promise<void>
  createGroup: (name: string) => Promise<Group | null>
  joinGroup: (code: string) => Promise<string | null>
  leaveGroup: (groupId: string) => Promise<void>
  setGroupVisibility: (groupId: string, visible: boolean) => Promise<void>
  connectByUsername: (username: string) => Promise<{ ok: boolean; message: string }>
  acceptConnection: (id: string) => Promise<void>
  removeConnection: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const Ctx = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  return IS_DEV_MODE ? (
    <DevProvider>{children}</DevProvider>
  ) : (
    <LiveProvider>{children}</LiveProvider>
  )
}

// ---------------------------------------------------------------------------
// Shared price engine: lazily loads quotes for the symbols the user is looking
// at (held/watched + on-demand), dedupes/caches at the app level, and refreshes
// every 5 minutes — but only while the tab is visible.
// ---------------------------------------------------------------------------
function usePriceEngine(neededRows: Pair[]) {
  const [prices, setPrices] = useState<PriceMap>(() => cachedPrices())
  const extraRef = useRef<Map<string, Pair>>(new Map())

  const symbolsKey = useMemo(
    () => uniqueSymbols(neededRows).map((r) => `${r.symbol}:${r.exchange}`).sort().join(','),
    [neededRows]
  )

  const load = useCallback(
    async (force: boolean) => {
      const base: Pair[] = symbolsKey ? symbolsKey.split(',').map((s) => {
        const [symbol, exchange] = s.split(':')
        return { symbol, exchange: exchange as 'NSE' | 'BSE' }
      }) : []
      const pairs = [...base, ...extraRef.current.values()]
      if (!pairs.length) return
      const merged = await fetchPrices(pairs, force)
      setPrices({ ...merged })
    },
    [symbolsKey]
  )

  // Fetch when the set of symbols changes (and on mount).
  useEffect(() => { load(false) }, [load])

  // Refresh every 5 min, only while the tab is open; refresh on regaining focus.
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) load(true) }, PRICE_TTL_MS)
    const onVis = () => { if (!document.hidden) load(true) }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [load])

  const requestSymbols = useCallback((pairs: Pair[]) => {
    for (const p of pairs) {
      const k = `${p.symbol.toUpperCase()}.${p.exchange}`
      if (!extraRef.current.has(k)) extraRef.current.set(k, p)
    }
    fetchPrices(pairs).then((m) => setPrices({ ...m }))
  }, [])

  const refreshPrices = useCallback(() => load(true), [load])

  return { prices, requestSymbols, refreshPrices }
}

// ---------------------------------------------------------------------------
// LIVE (Supabase) provider
// ---------------------------------------------------------------------------
function LiveProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({
    profile: null,
    profilesById: {},
    groups: [],
    memberships: [],
    trades: [],
    watchlist: [],
    connections: [],
  })
  const [loading, setLoading] = useState(true)
  const [currentGroupId, setCurrentGroupIdState] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const d = await loadAppData()
    setData(d)
    setLoading(false)
    // Default the active group to the stored one, or the first group.
    setCurrentGroupIdState((prev) => {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('stoked_group') : null
      const candidate = prev ?? stored ?? d.groups[0]?.id ?? null
      return d.groups.some((g) => g.id === candidate) ? candidate : d.groups[0]?.id ?? null
    })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setCurrentGroupId = useCallback((id: string | null) => {
    setCurrentGroupIdState(id)
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem('stoked_group', id)
      else localStorage.removeItem('stoked_group')
    }
  }, [])

  const priceRows = useMemo(
    () => [...data.trades, ...data.watchlist],
    [data.trades, data.watchlist]
  )
  const { prices, requestSymbols, refreshPrices } = usePriceEngine(priceRows)

  const value = useLiveValue(data, loading, currentGroupId, setCurrentGroupId, prices, requestSymbols, refreshPrices, refresh)
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

function useLiveValue(
  data: AppData,
  loading: boolean,
  currentGroupId: string | null,
  setCurrentGroupId: (id: string | null) => void,
  prices: PriceMap,
  requestSymbols: (pairs: Pair[]) => void,
  refreshPrices: () => Promise<void>,
  refresh: () => Promise<void>
): AppContextValue {
  const currentGroup = data.groups.find((g) => g.id === currentGroupId) ?? null
  const members = Object.values(data.profilesById)

  const wrap = <A extends unknown[]>(fn: (...a: A) => Promise<unknown>) =>
    async (...a: A) => {
      await fn(...a)
      await refresh()
    }

  return {
    ...data,
    loading,
    isDevMode: false,
    user: data.profile,
    group: currentGroup,
    members,
    currentGroup,
    currentGroupId,
    setCurrentGroupId,
    prices,
    requestSymbols,
    refreshPrices,
    addTrade: wrap((t: Omit<Trade, 'id' | 'created_at' | 'user'>) => insertTrade(t)),
    updateTrade: wrap((id: string, patch: TradePatch) => qUpdateTrade(id, patch)),
    removeTrade: wrap((id: string) => qDeleteTrade(id)),
    removeTrades: wrap((ids: string[]) => qDeleteTrades(ids)),
    addWatchlist: wrap((w: Omit<WatchlistItem, 'id' | 'created_at' | 'user'>) =>
      insertWatchlist(w)
    ),
    removeWatchlist: wrap((id: string) => qDeleteWatchlist(id)),
    createGroup: async (name: string) => {
      const g = await qCreateGroup(name)
      await refresh()
      setCurrentGroupId(g.id)
      return g
    },
    joinGroup: async (code: string) => {
      const id = await qJoinGroup(code)
      await refresh()
      setCurrentGroupId(id)
      return id
    },
    leaveGroup: wrap((groupId: string) => qLeaveGroup(groupId)),
    setGroupVisibility: wrap((groupId: string, visible: boolean) =>
      qSetGroupVisibility(groupId, visible)
    ),
    connectByUsername: async (username: string) => {
      const profile = await findProfileByUsername(username)
      if (!profile) return { ok: false, message: `No user found for "${username}"` }
      if (profile.id === data.profile?.id)
        return { ok: false, message: "That's you!" }
      await qSendConnection(profile.id)
      await refresh()
      return { ok: true, message: `Request sent to ${profile.name}` }
    },
    acceptConnection: wrap((id: string) => qAcceptConnection(id)),
    removeConnection: wrap((id: string) => qRemoveConnection(id)),
    refresh,
  }
}

// ---------------------------------------------------------------------------
// DEV (mock data) provider — no Supabase required.
// ---------------------------------------------------------------------------
function DevProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [trades, setTrades] = useState<Trade[]>(DEV_TRADES)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(DEV_WATCHLIST)

  useEffect(() => {
    const stored = localStorage.getItem('stoked_dev_user')
    if (stored) setUserId(stored)
  }, [])

  const profile = DEV_USERS.find((u) => u.id === userId) ?? null
  const { prices, requestSymbols, refreshPrices } = usePriceEngine(useMemo(() => [...trades, ...watchlist], [trades, watchlist]))

  const profilesById = useMemo(() => {
    const m: Record<string, Profile> = {}
    for (const u of DEV_USERS) m[u.id] = u
    return m
  }, [])

  const noop = async () => {}

  const value: AppContextValue = {
    profile,
    profilesById,
    groups: [DEV_GROUP],
    memberships: DEV_MEMBERSHIPS,
    trades,
    watchlist,
    connections: [] as Connection[],
    loading: false,
    isDevMode: true,
    user: profile,
    group: DEV_GROUP,
    members: DEV_USERS,
    currentGroup: DEV_GROUP,
    currentGroupId: DEV_GROUP.id,
    setCurrentGroupId: () => {},
    prices,
    requestSymbols,
    refreshPrices,
    addTrade: async (t) => {
      setTrades((prev) => [
        ...prev,
        { ...t, id: `trade-${Date.now()}`, created_at: new Date().toISOString() },
      ])
    },
    updateTrade: async (id, patch) => setTrades((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    removeTrade: async (id) => setTrades((prev) => prev.filter((t) => t.id !== id)),
    removeTrades: async (ids) => setTrades((prev) => prev.filter((t) => !ids.includes(t.id))),
    addWatchlist: async (w) => {
      setWatchlist((prev) => [
        ...prev,
        { ...w, id: `watch-${Date.now()}`, created_at: new Date().toISOString() },
      ])
    },
    removeWatchlist: async (id) => setWatchlist((prev) => prev.filter((w) => w.id !== id)),
    createGroup: async () => DEV_GROUP,
    joinGroup: async () => DEV_GROUP.id,
    leaveGroup: noop,
    setGroupVisibility: noop,
    connectByUsername: async () => ({ ok: false, message: 'Connections need Supabase (disable dev mode).' }),
    acceptConnection: noop,
    removeConnection: noop,
    refresh: noop,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
