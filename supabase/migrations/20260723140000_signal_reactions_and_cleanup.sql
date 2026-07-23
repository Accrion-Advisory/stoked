-- =============================================================================
-- Plan A4: signal reactions (👍 like / ✓ acted) + automatic 14-day cleanup so
-- the signals table never grows unbounded.
-- =============================================================================

-- ---- REACTIONS --------------------------------------------------------------
create table public.signal_reactions (
  signal_id  uuid not null references public.signals(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('like', 'acted')),
  created_at timestamptz not null default now(),
  primary key (signal_id, user_id, kind)
);
create index signal_reactions_signal_idx on public.signal_reactions (signal_id);

alter table public.signal_reactions enable row level security;

-- Visible if you can see the underlying signal (i.e. a member of its group).
create policy "reactions readable to signal viewers"
  on public.signal_reactions for select to authenticated
  using (
    exists (
      select 1 from public.signals s
      where s.id = signal_reactions.signal_id and public.is_member(auth.uid(), s.group_id)
    )
  );

create policy "members react as themselves"
  on public.signal_reactions for insert to authenticated
  with check (
    auth.uid() = user_id and exists (
      select 1 from public.signals s
      where s.id = signal_reactions.signal_id and public.is_member(auth.uid(), s.group_id)
    )
  );

create policy "users remove own reactions"
  on public.signal_reactions for delete to authenticated
  using (auth.uid() = user_id);

-- ---- AUTO-CLEANUP (14 days) -------------------------------------------------
-- Daily pg_cron job deletes signals older than two weeks (reactions cascade).
create extension if not exists pg_cron;

select cron.schedule(
  'cleanup-old-signals',
  '17 3 * * *', -- 03:17 UTC daily
  $$ delete from public.signals where created_at < now() - interval '14 days' $$
);
