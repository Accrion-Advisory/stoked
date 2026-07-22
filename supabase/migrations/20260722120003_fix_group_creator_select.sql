-- =============================================================================
-- Fix: a group's creator must be able to SELECT the group immediately after
-- creating it — before their membership row exists.
--
-- Without this, `insert into groups (...) returning *` (PostgREST
-- `return=representation`, i.e. supabase-js `.insert().select()`) fails with
-- "new row violates row-level security policy": the row is inserted, but the
-- read-back is blocked because the old SELECT policy only allowed members and
-- the creator hasn't been added to memberships yet.
-- =============================================================================

drop policy if exists "members can read their groups" on public.groups;

create policy "members and creators can read groups"
  on public.groups for select
  to authenticated
  using (created_by = auth.uid() or public.is_member(auth.uid(), id));
