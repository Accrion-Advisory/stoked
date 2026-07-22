-- =============================================================================
-- STOKED — Initial schema
-- Portfolio-centric model: each user owns ONE portfolio (trades + watchlist).
-- Visibility is layered on top via group memberships and mutual connections.
-- =============================================================================

-- gen_random_bytes / gen_random_uuid live in pgcrypto (available by default on
-- Supabase, but declare the dependency explicitly).
create extension if not exists pgcrypto;

-- ---- PROFILES (mirrors auth.users) ------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  username   text unique not null,           -- shareable handle for direct connect (/u/<username>)
  name       text not null,
  email      text,
  avatar_url text,
  created_at timestamptz not null default now()
);
comment on table public.profiles is 'Public-facing user profile, one row per auth user.';

-- ---- GROUPS -----------------------------------------------------------------
-- invite_code doubles as the secure, unguessable token embedded in the join
-- link (/join/<invite_code>). 12 random bytes = 96 bits of entropy.
create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique not null default encode(gen_random_bytes(12), 'hex'),
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---- MEMBERSHIPS ------------------------------------------------------------
-- is_visible lets a member stay in a group while hiding their portfolio from it.
create table public.memberships (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  group_id   uuid not null references public.groups(id) on delete cascade,
  is_visible boolean not null default true,
  joined_at  timestamptz not null default now(),
  unique (user_id, group_id)
);
create index memberships_group_id_idx on public.memberships (group_id);
create index memberships_user_id_idx on public.memberships (user_id);

-- ---- CONNECTIONS (mutual, Facebook-style) -----------------------------------
-- A single row per unordered pair. Once status = 'accepted', BOTH users can see
-- each other's portfolio.
create table public.connections (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  constraint connections_no_self check (requester_id <> addressee_id)
);
-- Enforce one connection per unordered pair (prevents A->B and B->A both existing).
create unique index connections_pair_uniq
  on public.connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index connections_addressee_idx on public.connections (addressee_id);
create index connections_requester_idx on public.connections (requester_id);

-- ---- TRADES (the portfolio) -------------------------------------------------
create table public.trades (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  symbol     text not null,
  exchange   text not null default 'NSE' check (exchange in ('NSE', 'BSE')),
  type       text not null check (type in ('BUY', 'SELL')),
  quantity   numeric not null check (quantity > 0),
  price      numeric not null check (price > 0),
  date       date not null,
  charges    numeric not null default 0,
  notes      text,
  created_at timestamptz not null default now()
);
create index trades_user_id_idx on public.trades (user_id);
create index trades_symbol_idx on public.trades (symbol);

-- ---- WATCHLIST --------------------------------------------------------------
create table public.watchlist (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  symbol       text not null,
  exchange     text not null default 'NSE' check (exchange in ('NSE', 'BSE')),
  target_price numeric,
  created_at   timestamptz not null default now(),
  unique (user_id, symbol, exchange)
);
create index watchlist_user_id_idx on public.watchlist (user_id);
