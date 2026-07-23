import { createClient } from '@/lib/supabase/client'
import type {
  Connection,
  Group,
  Membership,
  Profile,
  ReactionKind,
  Signal,
  SignalInput,
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
  signals: Signal[] // recent signals across my groups (newest first)
  mutedGroups: string[] // group_ids I've muted signal push for
}

const EMPTY: AppData = {
  profile: null,
  profilesById: {},
  groups: [],
  memberships: [],
  trades: [],
  watchlist: [],
  connections: [],
  signals: [],
  mutedGroups: [],
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
  const [groupsRes, membershipsRes, tradesRes, watchlistRes, connectionsRes, signalsRes, mutesRes] =
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
      groupIds.length
        ? supabase.from('signals').select('*, author:profiles(*)').in('group_id', groupIds).order('created_at', { ascending: false }).limit(100)
        : Promise.resolve({ data: [] as Signal[] }),
      supabase.from('signal_mutes').select('group_id'),
    ])

  const groups = (groupsRes.data ?? []) as Group[]
  const memberships = (membershipsRes.data ?? []) as Membership[]
  const trades = (tradesRes.data ?? []) as Trade[]
  const watchlist = (watchlistRes.data ?? []) as WatchlistItem[]
  const signals = (signalsRes.data ?? []) as Signal[]
  const mutedGroups = ((mutesRes.data ?? []) as { group_id: string }[]).map((m) => m.group_id)

  // Reaction summary per signal.
  if (signals.length) {
    const { data: reactions } = await supabase
      .from('signal_reactions')
      .select('signal_id, user_id, kind')
      .in('signal_id', signals.map((s) => s.id))
    const byId = new Map(signals.map((s) => [s.id, s]))
    for (const s of signals) {
      s.like_count = 0; s.acted_count = 0; s.i_liked = false; s.i_acted = false
    }
    for (const r of (reactions ?? []) as { signal_id: string; user_id: string; kind: string }[]) {
      const s = byId.get(r.signal_id)
      if (!s) continue
      if (r.kind === 'like') { s.like_count = (s.like_count ?? 0) + 1; if (r.user_id === user.id) s.i_liked = true }
      else { s.acted_count = (s.acted_count ?? 0) + 1; if (r.user_id === user.id) s.i_acted = true }
    }
  }

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
  for (const s of signals) if (s.author) profilesById[s.author.id] = s.author

  return {
    profile: (profile as Profile) ?? null,
    profilesById,
    groups,
    memberships,
    trades,
    watchlist,
    connections,
    signals,
    mutedGroups,
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

// ---- Signals ----------------------------------------------------------------

// Posting goes through the API route so it can fan out Web Push to members.
export async function postSignal(input: SignalInput): Promise<Signal> {
  const res = await fetch('/api/signals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Could not post signal')
  return json.signal as Signal
}

export async function deleteSignal(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('signals').delete().eq('id', id)
  if (error) throw error
}

export async function setGroupSignalMute(groupId: string, muted: boolean) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (muted) {
    const { error } = await supabase
      .from('signal_mutes')
      .upsert({ user_id: user.id, group_id: groupId }, { onConflict: 'user_id,group_id' })
    if (error) throw error
  } else {
    const { error } = await supabase.from('signal_mutes').delete().eq('user_id', user.id).eq('group_id', groupId)
    if (error) throw error
  }
}

// Fetch a single signal (used to enrich a Realtime INSERT payload with author).
export async function fetchSignal(id: string): Promise<Signal | null> {
  const supabase = createClient()
  const { data } = await supabase.from('signals').select('*, author:profiles(*)').eq('id', id).maybeSingle()
  return (data as Signal) ?? null
}

export async function toggleReaction(signalId: string, kind: ReactionKind, on: boolean) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (on) {
    const { error } = await supabase
      .from('signal_reactions')
      .upsert({ signal_id: signalId, user_id: user.id, kind }, { onConflict: 'signal_id,user_id,kind' })
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('signal_reactions')
      .delete()
      .eq('signal_id', signalId)
      .eq('user_id', user.id)
      .eq('kind', kind)
    if (error) throw error
  }
}
