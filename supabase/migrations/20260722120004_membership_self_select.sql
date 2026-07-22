-- =============================================================================
-- Let users always read their OWN membership rows via a direct column check,
-- not only through the SECURITY DEFINER is_member() helper.
--
-- Two reasons:
--  1. Correctness — you should always be able to see the groups you belong to.
--  2. Robustness — `insert ... returning *` (supabase-js `.insert().select()`)
--     evaluates the SELECT policy against the just-inserted row. A STABLE
--     SECURITY DEFINER helper can miss that row under statement snapshot rules,
--     which would roll back the insert. A plain `user_id = auth.uid()` predicate
--     sees it immediately.
-- =============================================================================

drop policy if exists "members can read memberships of their groups" on public.memberships;

create policy "read own and co-member memberships"
  on public.memberships for select
  to authenticated
  using (user_id = auth.uid() or public.is_member(auth.uid(), group_id));
