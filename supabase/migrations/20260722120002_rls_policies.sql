-- =============================================================================
-- STOKED — Row Level Security
-- Enable RLS on every table and define access. Portfolio reads (trades,
-- watchlist) are gated by can_view_portfolio(); everything else is owner-scoped.
-- =============================================================================

alter table public.profiles    enable row level security;
alter table public.groups      enable row level security;
alter table public.memberships enable row level security;
alter table public.connections enable row level security;
alter table public.trades      enable row level security;
alter table public.watchlist   enable row level security;

-- ---- PROFILES ---------------------------------------------------------------
-- Any authenticated user can read profiles (needed to search/connect by handle
-- and to render member & connection names/avatars). Profiles hold no financial
-- data — the portfolio itself is protected on the trades/watchlist tables.
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---- GROUPS -----------------------------------------------------------------
-- Members can read groups they belong to. (Pre-join lookups go through the
-- SECURITY DEFINER group_preview/join_group RPCs, so no public read needed.)
create policy "members can read their groups"
  on public.groups for select
  to authenticated
  using (public.is_member(auth.uid(), id));

create policy "authenticated users can create groups"
  on public.groups for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "creators can update their groups"
  on public.groups for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy "creators can delete their groups"
  on public.groups for delete
  to authenticated
  using (auth.uid() = created_by);

-- ---- MEMBERSHIPS ------------------------------------------------------------
-- You can see the membership rows of any group you're in (to list members).
create policy "members can read memberships of their groups"
  on public.memberships for select
  to authenticated
  using (public.is_member(auth.uid(), group_id));

create policy "users can join groups themselves"
  on public.memberships for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own membership"
  on public.memberships for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can leave (delete their own membership)"
  on public.memberships for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---- CONNECTIONS ------------------------------------------------------------
-- Either party can see the connection row.
create policy "users can read their own connections"
  on public.connections for select
  to authenticated
  using (auth.uid() in (requester_id, addressee_id));

-- Only the requester creates the request.
create policy "users can send connection requests"
  on public.connections for insert
  to authenticated
  with check (auth.uid() = requester_id);

-- Only the addressee can respond (accept). Row stays scoped to the pair.
create policy "addressee can respond to a request"
  on public.connections for update
  to authenticated
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

-- Either party can remove the connection (decline / cancel / disconnect).
create policy "either party can delete a connection"
  on public.connections for delete
  to authenticated
  using (auth.uid() in (requester_id, addressee_id));

-- ---- TRADES (portfolio) -----------------------------------------------------
create policy "portfolios are readable by permitted viewers"
  on public.trades for select
  to authenticated
  using (public.can_view_portfolio(user_id));

create policy "users can insert their own trades"
  on public.trades for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own trades"
  on public.trades for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own trades"
  on public.trades for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---- WATCHLIST --------------------------------------------------------------
create policy "watchlists are readable by permitted viewers"
  on public.watchlist for select
  to authenticated
  using (public.can_view_portfolio(user_id));

create policy "users can manage their own watchlist (insert)"
  on public.watchlist for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can manage their own watchlist (update)"
  on public.watchlist for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can manage their own watchlist (delete)"
  on public.watchlist for delete
  to authenticated
  using (auth.uid() = user_id);
