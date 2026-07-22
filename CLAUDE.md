# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> The `@AGENTS.md` line above is load-bearing: this repo pins **Next.js 16** with breaking
> changes from older versions. Before writing any Next.js code, read the relevant guide in
> `node_modules/next/dist/docs/` — do not rely on training-data recall of App Router APIs.
> Two changes that have already bitten us: the `middleware` convention is **renamed to `proxy`**
> (`src/proxy.ts`, Node.js runtime), and `cookies()` is **async**.

## What this is

STOKED is a mobile-first PWA for private investing circles of Indian retail investors on the
NSE/BSE. A user has **one portfolio** (their trades) which they share two ways: with **groups**
(join by invite code / secure link) and with **individuals** via **mutual, Facebook-style
connections** (I request → you accept → we both see each other's portfolios). The UI is
constrained to a `max-width: 430px` phone column (set in `globals.css` on `body`).

## Commands

```bash
npm run dev      # dev server on http://localhost:3000
npm run build    # production build (runs tsc; the reliable pre-flight check)
npm run start    # serve production build
npm run lint     # eslint (flat config) — slow; build's tsc pass is the faster signal

# Supabase (CLI via npx; migrations live in supabase/migrations/)
npx supabase link --project-ref <ref>     # one-time, needs SUPABASE_ACCESS_TOKEN + db password
npx supabase db push                      # apply migrations to the linked remote project
```

There is **no test framework** configured — do not assume `npm test` exists. Verify by building
and, for auth/proxy, by `npm run start` + curling routes.

## DEV_MODE split

Keyed off `NEXT_PUBLIC_DEV_MODE`:

- **`true`** — no Supabase, no auth. Mock fixtures from `src/lib/dev-data.ts`; "login" picks a
  profile at `/auth/dev-login` (writes `stoked_dev_user` to localStorage). Added trades/watchlist
  live in React state only. Good for UI work offline.
- **`false`** (production) — real email/password auth + Supabase.

`src/lib/context.tsx` branches at the top into `DevProvider` vs `LiveProvider`, both exposing the
**same `useApp()` shape**, so pages never branch on the mode. When adding context fields, wire
them in **both** providers.

## Architecture / data flow

- **Auth:** email/password via Supabase (`src/app/auth/actions.ts` server actions →
  `signInWithPassword` / `signUp`). Pages: `/auth/login`, `/auth/signup`, `/auth/verify-email`,
  and `/auth/confirm` (email-link OTP). `src/proxy.ts` refreshes the session
  (`src/lib/supabase/session.ts`) and gates routes — unauthenticated users hitting anything
  outside `/auth/*` get redirected to `/auth/login?next=…` (the `next` param preserves invite
  links through login). In DEV_MODE the proxy is a pass-through.
- **Route group `src/app/(app)/`:** all authenticated sections (`dashboard`, `portfolio`,
  `trade`, `watchlist`, `group`, `stock`, `connections`, `join/[code]`) share ONE layout that
  mounts `AppProvider` + `BottomNav` once via `AppChrome` (which shows a spinner until the
  initial load finishes). Route groups don't change URLs. Do not add per-section layouts that
  re-wrap `AppProvider`.
- **Data layer:** `src/lib/queries.ts` — `loadAppData()` fetches everything the user may see in a
  few parallel queries (RLS does the filtering: a bare `select` on `trades` returns own + visible
  others). Mutations (`insertTrade`, `createGroup`, `joinGroup`, `sendConnection`, …) are thin
  wrappers; `LiveProvider` calls them then `refresh()`s.
- **Derived state (never stored):** `src/lib/xirr.ts` — `calculateHoldings` (FIFO lot matching on
  SELLs) and `calculatePortfolioXIRR` (hand-rolled Newton-Raphson; the `xirr` npm dep is unused).
  `src/lib/portfolio.ts` — `buildMemberPortfolio(user, trades, prices)` is the single source of
  truth for value/P&L/XIRR used by every screen. Do not reintroduce mock multipliers.
- **Live prices:** `src/lib/prices.ts` hits Yahoo Finance server-side (no CORS from browser).
  Client code fetches through the `GET /api/prices?s=SYM:NSE,…` route handler; the context loads
  prices for all held/watched symbols and exposes a `prices` map keyed `SYMBOL.EXCHANGE`.

## Database (`supabase/migrations/`)

The migrations folder is the source of truth (the old loose `supabase-schema.sql` was removed).
Three ordered files: `_initial_schema` (tables), `_functions` (triggers + helpers), `_rls_policies`.

- Tables: `profiles` (mirrors `auth.users`, has a shareable `username`), `groups`
  (`invite_code` = unguessable 96-bit token, doubles as the `/join/<code>` link), `memberships`
  (`is_visible` hides your portfolio from a group), `connections` (mutual; one row per unordered
  pair, `pending`→`accepted`), `trades`, `watchlist`. **Trades/watchlist are user-owned — no
  `group_id`.**
- **Visibility is RLS.** Portfolio reads go through `can_view_portfolio(owner)` = own OR
  connected OR shares a visible group. All visibility helpers are `SECURITY DEFINER` with a
  pinned `search_path` — this is deliberate, to let policies call them **without** recursive
  policy evaluation (the classic memberships-policy infinite-recursion trap). `join_group` /
  `group_preview` are `SECURITY DEFINER` RPCs so users can preview/join by code without a broad
  read grant on `groups`.
- New auth users get a `profiles` row + generated unique username via the `handle_new_user`
  trigger.

## UI conventions

- Path alias `@/*` → `src/*`. Most pages are `'use client'` reading `useApp()`.
- **Styling:** design tokens are CSS custom properties in `globals.css` (`--green`,
  `--text-secondary`, …), duplicated as Tailwind theme colors in `tailwind.config.ts`. In
  practice pages use **heavy inline `style={{…}}`** with `var(--token)`, not utility classes —
  match that. Shared class helpers (`.btn-primary`, `.input`, `.chip`, `.card`, `.spinner`,
  `.live-dot`, `.mb-nav`) live in `globals.css`. Dark-only; font is Satoshi.
- Primitives: `src/components/ui` (`Avatar`, `PnlBadge`), `src/components/layout`
  (`BottomNav`, `AppChrome`), `src/components/group` (`GroupCreateJoin`, `EmptyGroup`).
- INR/number formatting goes through `src/lib/utils.ts` (`formatCurrency` compact Cr/L/k,
  `formatPercent`, `timeAgo`) — don't reimplement.
- `useSearchParams` must sit under a `<Suspense>` boundary in this Next version (see login/signup/
  connections for the Inner+Suspense pattern).

## Gotchas

- `next.config.ts` is empty despite `next-pwa` being a dependency — PWA is manifest/meta only.
- `dev-data.ts` also exports UI helpers (`getInitials`, `getAvatarColor`) used by `Avatar`.
- Trade owners can freely edit/delete their own trades (no 24h lock).
