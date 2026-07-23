-- =============================================================================
-- Plan A: Group Signals — standardized BUY/SELL alerts broadcast to a group.
-- A signal is a structured record (stock + action + price + short note), not a
-- chat message. Delivered live via Realtime and via Web Push (fan-out from the
-- Next.js /api/signals route using the service role).
-- =============================================================================

-- ---- SIGNALS ----------------------------------------------------------------
create table public.signals (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  symbol     text not null,
  exchange   text not null default 'NSE' check (exchange in ('NSE', 'BSE')),
  action     text not null check (action in ('BUY', 'SELL')),
  price      numeric not null check (price > 0),
  note       text check (note is null or char_length(note) <= 140),
  created_at timestamptz not null default now()
);
create index signals_group_created_idx on public.signals (group_id, created_at desc);

alter table public.signals enable row level security;

create policy "group members can read signals"
  on public.signals for select to authenticated
  using (public.is_member(auth.uid(), group_id));

create policy "members can post signals"
  on public.signals for insert to authenticated
  with check (auth.uid() = author_id and public.is_member(auth.uid(), group_id));

create policy "authors can delete their signals"
  on public.signals for delete to authenticated
  using (auth.uid() = author_id);

-- ---- PUSH SUBSCRIPTIONS -----------------------------------------------------
-- One row per browser/device push endpoint. Keys are read server-side only
-- (service role) for fan-out; RLS keeps them scoped to the owner for the client.
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "users read own subscriptions"
  on public.push_subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "users insert own subscriptions"
  on public.push_subscriptions for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own subscriptions"
  on public.push_subscriptions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own subscriptions"
  on public.push_subscriptions for delete to authenticated using (auth.uid() = user_id);

-- ---- PER-GROUP SIGNAL MUTES -------------------------------------------------
create table public.signal_mutes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  group_id   uuid not null references public.groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, group_id)
);
alter table public.signal_mutes enable row level security;

create policy "users read own mutes"
  on public.signal_mutes for select to authenticated using (auth.uid() = user_id);
create policy "users insert own mutes"
  on public.signal_mutes for insert to authenticated with check (auth.uid() = user_id);
create policy "users delete own mutes"
  on public.signal_mutes for delete to authenticated using (auth.uid() = user_id);

-- ---- REALTIME ---------------------------------------------------------------
-- Broadcast INSERTs on signals to subscribed clients (RLS still applies).
alter publication supabase_realtime add table public.signals;
