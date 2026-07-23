-- =============================================================================
-- Securities master: the full NSE + BSE equity universe, used to power stock
-- search (add-trade, add-to-watchlist). Public reference data — no per-user
-- rows. Populated out-of-band by scripts/import-securities.mjs.
-- =============================================================================

create extension if not exists pg_trgm;

create table public.securities (
  symbol     text not null,
  exchange   text not null check (exchange in ('NSE', 'BSE')),
  name       text not null,
  updated_at timestamptz not null default now(),
  primary key (symbol, exchange)
);
comment on table public.securities is 'NSE/BSE tradable equity list for search. symbol = Yahoo ticker stem (RELIANCE -> RELIANCE.NS / RELIANCE.BO).';

-- Trigram indexes make substring ILIKE search fast across ~7k rows.
create index securities_symbol_trgm on public.securities using gin (symbol gin_trgm_ops);
create index securities_name_trgm on public.securities using gin (name gin_trgm_ops);

alter table public.securities enable row level security;
create policy "securities are readable by authenticated users"
  on public.securities for select to authenticated using (true);

-- Ranked search: exact symbol > symbol prefix > name/symbol prefix > substring;
-- NSE ranked above BSE for the same match (retail default), shorter symbols first.
create or replace function public.search_securities(q text, lim int default 20)
returns table (symbol text, exchange text, name text)
language sql
stable
security definer
set search_path = public
as $$
  select s.symbol, s.exchange, s.name
  from public.securities s
  where btrim(q) <> ''
    and (s.symbol ilike '%' || btrim(q) || '%' or s.name ilike '%' || btrim(q) || '%')
  order by
    (case
       when upper(s.symbol) = upper(btrim(q)) then 0
       when upper(s.symbol) like upper(btrim(q)) || '%' then 1
       when s.name ilike btrim(q) || '%' then 2
       when s.symbol ilike btrim(q) || '%' then 2
       else 3
     end),
    (case s.exchange when 'NSE' then 0 else 1 end),
    length(s.symbol),
    s.name
  limit greatest(1, least(coalesce(lim, 20), 50));
$$;

grant execute on function public.search_securities(text, int) to authenticated;
