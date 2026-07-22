-- =============================================================================
-- STOKED — Functions & triggers
--
-- All helpers are SECURITY DEFINER so they run with the table owner's rights and
-- bypass RLS. This is deliberate: it lets the RLS policies in the next migration
-- call these helpers WITHOUT triggering recursive policy evaluation (the classic
-- "infinite recursion detected in policy for relation memberships" trap).
-- Every one pins search_path to public to prevent search_path hijacking.
-- =============================================================================

-- ---- Auto-create a profile row when a new auth user signs up ----------------
-- Generates a unique username from the email local-part.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username  text;
  final_username text;
  suffix         int := 0;
begin
  base_username := regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g');
  if base_username is null or base_username = '' then
    base_username := 'user';
  end if;

  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, email, name, username, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      base_username
    ),
    final_username,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- Visibility helpers -----------------------------------------------------

-- Is `uid` a member of group `gid`?
create or replace function public.is_member(uid uuid, gid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where user_id = uid and group_id = gid
  );
$$;

-- Do `a` and `b` share at least one group where `b` (the portfolio owner) has
-- left their membership visible?
create or replace function public.shares_visible_group(viewer uuid, owner uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships mv
    join public.memberships mo on mo.group_id = mv.group_id
    where mv.user_id = viewer
      and mo.user_id = owner
      and mo.is_visible
  );
$$;

-- Are `a` and `b` mutually connected (accepted)?
create or replace function public.are_connected(a uuid, b uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.connections c
    where c.status = 'accepted'
      and (
        (c.requester_id = a and c.addressee_id = b) or
        (c.requester_id = b and c.addressee_id = a)
      )
  );
$$;

-- Can the current user (auth.uid()) view `owner`'s portfolio?
-- True when it's their own, they're connected, or they share a visible group.
create or replace function public.can_view_portfolio(owner uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    owner = auth.uid()
    or public.are_connected(auth.uid(), owner)
    or public.shares_visible_group(auth.uid(), owner);
$$;

-- ---- Group join / preview ---------------------------------------------------

-- Look up minimal group info by invite code WITHOUT requiring membership, so the
-- /join/<code> page can show what you're about to join before you commit.
create or replace function public.group_preview(p_code text)
returns table (id uuid, name text, member_count bigint)
language sql
security definer
stable
set search_path = public
as $$
  select g.id, g.name, (select count(*) from public.memberships m where m.group_id = g.id)
  from public.groups g
  where g.invite_code = p_code;
$$;

-- Join a group by invite code. Idempotent (re-joining is a no-op). Returns the
-- group id so the caller can redirect straight into it.
create or replace function public.join_group(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  g_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id into g_id from public.groups where invite_code = p_code;
  if g_id is null then
    raise exception 'Invalid or expired invite code';
  end if;

  insert into public.memberships (user_id, group_id)
  values (auth.uid(), g_id)
  on conflict (user_id, group_id) do nothing;

  return g_id;
end;
$$;

-- ---- Grants -----------------------------------------------------------------
-- authenticated users may call the join/preview RPCs.
grant execute on function public.group_preview(text) to authenticated;
grant execute on function public.join_group(text) to authenticated;
