-- =============================================
-- STOKED — Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ---- USERS (mirrors auth.users) ----
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text,
  avatar_url text,
  created_at timestamptz default now()
);
alter table public.users enable row level security;
create policy "Users can read all users" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---- GROUPS ----
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text unique default encode(gen_random_bytes(8), 'hex'),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);
alter table public.groups enable row level security;
create policy "Members can read their groups" on public.groups for select
  using (exists (select 1 from public.memberships m where m.group_id = id and m.user_id = auth.uid()));
create policy "Authenticated users can create groups" on public.groups for insert
  with check (auth.uid() = created_by);

-- ---- MEMBERSHIPS ----
create table public.memberships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  joined_at timestamptz default now(),
  is_visible boolean default true,
  unique(user_id, group_id)
);
alter table public.memberships enable row level security;
create policy "Members can read memberships in their groups" on public.memberships for select
  using (exists (select 1 from public.memberships m where m.group_id = group_id and m.user_id = auth.uid()));
create policy "Users can join groups" on public.memberships for insert
  with check (auth.uid() = user_id);
create policy "Users can update own membership" on public.memberships for update
  using (auth.uid() = user_id);

-- ---- TRADES ----
create table public.trades (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  symbol text not null,
  exchange text not null default 'NSE' check (exchange in ('NSE', 'BSE')),
  type text not null check (type in ('BUY', 'SELL')),
  quantity numeric not null check (quantity > 0),
  price numeric not null check (price > 0),
  date date not null,
  charges numeric default 0,
  notes text,
  created_at timestamptz default now()
);
alter table public.trades enable row level security;
create policy "Group members can read all trades in group" on public.trades for select
  using (exists (select 1 from public.memberships m where m.group_id = group_id and m.user_id = auth.uid()));
create policy "Users can insert own trades" on public.trades for insert
  with check (auth.uid() = user_id);
create policy "Users can update own trades within 24h" on public.trades for update
  using (auth.uid() = user_id and created_at > now() - interval '24 hours');

-- ---- WATCHLIST ----
create table public.watchlist (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  symbol text not null,
  exchange text not null default 'NSE',
  target_price numeric,
  created_at timestamptz default now(),
  unique(user_id, group_id, symbol)
);
alter table public.watchlist enable row level security;
create policy "Group members can read watchlist" on public.watchlist for select
  using (exists (select 1 from public.memberships m where m.group_id = group_id and m.user_id = auth.uid()));
create policy "Users can manage own watchlist" on public.watchlist for all
  using (auth.uid() = user_id);

-- ---- INDEXES ----
create index on public.trades(group_id, user_id);
create index on public.trades(symbol);
create index on public.memberships(group_id);
create index on public.memberships(user_id);
create index on public.watchlist(group_id);
