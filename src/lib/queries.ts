import { createClient } from '@/lib/supabase/client'
import type {
  Connection,
  Group,
  Membership,
  Profile,
  Trade,
  WatchlistItem,
} from '@/types'

export interface AppData {
  profile: Profile | null
  profilesById: Record<string, Profile>
  groups: Group[]
  memberships: Membership[] // across all my groups (each with .user)
  trades: Trade[] // everything I'm allowed to see (mine + visible others)
  watchlist: WatchlistItem[] // everything I'm allowed to see
  connections: Connection[] // mine, annotated with direction + other party
}

const EMPTY: AppData = {
  profile: null,
  profilesById: {},
  groups: [],
  memberships: [],
  trades: [],
  watchlist: [],
  connections: [],
}

/**
 * Loads everything the signed-in user is permitted to see in a handful of
 * parallel queries. RLS does the access filtering — a bare `select` on trades /
 * watchlist already returns only rows the viewer may read.
 */
export async function loadAppData(): Promise<AppData> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return EMPTY

  // 1. My profile + my group ids (needed before we can list co-members).
  const [{ data: profile }, { data: myMemberships }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('memberships').select('group_id').eq('user_id', user.id),
  ])

  const groupIds = (myMemberships ?? []).map((m) => m.group_id)

  // 2. Everything else in parallel.
  const [groupsRes, membershipsRes, tradesRes, watchlistRes, connectionsRes] =
    await Promise.all([
      groupIds.length
        ? supabase.from('groups').select('*').in('id', groupIds)
        : Promise.resolve({ data: [] as Group[] }),
      groupIds.length
        ? supabase
            .from('memberships')
            .select('*, user:profiles(*)')
            .in('group_id', groupIds)
        : Promise.resolve({ data: [] as Membership[] }),
      supabase.from('trades').select('*, user:profiles(*)'),
      supabase.from('watchlist').select('*, user:profiles(*)'),
      supabase
        .from('connections')
        .select(
          '*, requester:profiles!connections_requester_id_fkey(*), addressee:profiles!connections_addressee_id_fkey(*)'
        ),
    ])

  const groups = (groupsRes.data ?? []) as Group[]
  const memberships = (membershipsRes.data ?? []) as Membership[]
  const trades = (tradesRes.data ?? []) as Trade[]
  const watchlist = (watchlistRes.data ?? []) as WatchlistItem[]

  // Annotate connections from the current user's perspective.
  const connections: Connection[] = ((connectionsRes.data ?? []) as any[]).map((c) => {
    const direction = c.requester_id === user.id ? 'outgoing' : 'incoming'
    const other = direction === 'outgoing' ? c.addressee : c.requester
    return { ...c, direction, other } as Connection
  })

  // Build a profile lookup from everything we fetched.
  const profilesById: Record<string, Profile> = {}
  if (profile) profilesById[profile.id] = profile as Profile
  for (const m of memberships) if (m.user) profilesById[m.user.id] = m.user
  for (const t of trades) if (t.user) profilesById[t.user.id] = t.user
  for (const w of watchlist) if (w.user) profilesById[w.user.id] = w.user
  for (const c of connections) if (c.other) profilesById[c.other.id] = c.other

  return {
    profile: (profile as Profile) ?? null,
    profilesById,
    groups,
    memberships,
    trades,
    watchlist,
    connections,
  }
}

// ---- Mutations --------------------------------------------------------------

export async function insertTrade(input: Omit<Trade, 'id' | 'created_at' | 'user'>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('trades').insert(input).select().single()
  if (error) throw error
  return data as Trade
}

export async function deleteTrade(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('trades').delete().eq('id', id)
  if (error) throw error
}

export type TradePatch = Partial<
  Pick<Trade, 'symbol' | 'exchange' | 'type' | 'quantity' | 'price' | 'date' | 'charges' | 'notes'>
>

export async function updateTrade(id: string, patch: TradePatch) {
  const supabase = createClient()
  const { error } = await supabase.from('trades').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteTrades(ids: string[]) {
  if (!ids.length) return
  const supabase = createClient()
  const { error } = await supabase.from('trades').delete().in('id', ids)
  if (error) throw error
}

export async function insertWatchlist(
  input: Omit<WatchlistItem, 'id' | 'created_at' | 'user'>
) {
  const supabase = createClient()
  const { data, error } = await supabase.from('watchlist').insert(input).select().single()
  if (error) throw error
  return data as WatchlistItem
}

export async function deleteWatchlist(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('watchlist').delete().eq('id', id)
  if (error) throw error
}

export async function createGroup(name: string): Promise<Group> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, created_by: user.id })
    .select()
    .single()
  if (error) throw error

  const { error: memErr } = await supabase
    .from('memberships')
    .insert({ group_id: group.id, user_id: user.id })
  if (memErr) throw memErr

  return group as Group
}

export async function groupPreview(code: string) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('group_preview', { p_code: code })
  if (error) throw error
  return (data?.[0] ?? null) as { id: string; name: string; member_count: number } | null
}

export async function joinGroup(code: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('join_group', { p_code: code })
  if (error) throw error
  return data as string // group id
}

export async function leaveGroup(groupId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase
    .from('memberships')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)
  if (error) throw error
}

export async function setGroupVisibility(groupId: string, isVisible: boolean) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase
    .from('memberships')
    .update({ is_visible: isVisible })
    .eq('group_id', groupId)
    .eq('user_id', user.id)
  if (error) throw error
}

export async function findProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.replace(/^@/, ''))
    .maybeSingle()
  return (data as Profile) ?? null
}

/**
 * Send a connection request. If the other person already sent ME a pending
 * request, accept that instead (the unordered-pair unique index guarantees a
 * single row per pair).
 */
export async function sendConnection(addresseeId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (addresseeId === user.id) throw new Error("You can't connect with yourself")

  const { error } = await supabase
    .from('connections')
    .insert({ requester_id: user.id, addressee_id: addresseeId })

  if (error) {
    // Unique violation → a row for this pair already exists. If it's an inbound
    // pending request, accept it.
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${addresseeId},addressee_id.eq.${addresseeId}`)
        .maybeSingle()
      if (existing && existing.addressee_id === user.id && existing.status === 'pending') {
        await acceptConnection(existing.id)
        return
      }
      return // already connected or request already outstanding
    }
    throw error
  }
}

export async function acceptConnection(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('connections')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function removeConnection(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('connections').delete().eq('id', id)
  if (error) throw error
}

// ---- Securities search ------------------------------------------------------

export interface Security {
  symbol: string
  exchange: 'NSE' | 'BSE'
  name: string
}

// Ranked NSE/BSE search over the full securities master (via the
// search_securities RPC). Returns [] on error so the UI can fall back.
export async function searchSecurities(q: string, limit = 20): Promise<Security[]> {
  const query = q.trim()
  if (!query) return []
  const supabase = createClient()
  const { data, error } = await supabase.rpc('search_securities', { q: query, lim: limit })
  if (error) return []
  return (data ?? []) as Security[]
}
