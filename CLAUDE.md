# Zero Sum

Mobile-first web app to track money in "winner takes all" games (card games, pool/billiards) between friends. Players sit in a session, play many rounds, and the app keeps the running balance and a final settlement.

Core rule: each round has one winner. Every loser pays the winner `unitPrice × units left` (balls or cards still in hand). Example: pool, 5,000 VND per ball, A has 3 balls left, B has 2 → A pays 15,000, B pays 10,000, winner gets +25,000.

No login, no backend. Everything is stored on the client (localStorage) and works offline.

Full requirements live in `docs/spec.md`. Read it before starting any feature.

## Stack

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS
- Persistence: browser localStorage only (no backend/database in the MVP)
- Unit tests: Vitest (for pure logic in `lib/`)
- Hosting: Vercel (auto deploy from `main`, preview deploy per PR)
- CI: GitHub Actions (`.github/workflows/ci.yml`)

## Commands

- `npm run dev`: dev server
- `npm run lint`: ESLint
- `npm run typecheck`: type check (runs `next typegen` first, then `tsc --noEmit`)
- `npm test`: unit tests (Vitest)
- `npm run build`: production build

CI runs `npm ci`, lint, typecheck, test and build on every pull request and on pushes to `main`. A PR should be green before it is merged.

## Project layout

Follow the layout that `create-next-app` generated (check whether `src/` exists). Intended structure:

- `app/`: routes (`/`, `/new`, `/session/[id]`, `/session/[id]/round` and `/round/[roundId]`, `/session/[id]/summary`, `/session/[id]/settings`). Dynamic pages are a thin server component wrapping a client view in `<Suspense>` (required by `cacheComponents`)
- `components/`: UI and screen views (`*View.tsx`), shared primitives in `ui.tsx`
- `lib/types.ts`: domain types (single source of truth)
- `lib/settlement.ts`: pure money logic (round amounts, balances, minimal transfers)
- `lib/sessions.ts`: pure session/round/player mutations with validation (return `Result`)
- `lib/storage.ts`: the only module that touches localStorage (versioned, migratable, theme preference)
- `lib/store.ts`: client store (`useSyncExternalStore`) over storage; `lib/theme.ts`: light/dark/system
- `docs/`: specs and notes

## Language

- UI copy shown to users: Vietnamese
- Code, identifiers, comments, commit messages, PR text: English
- URLs stay ASCII

## Conventions

- Mobile-first, mobile only: design for ~390px width; touch targets at least 44px; no hover-only interactions
- Support light and dark mode (follow `prefers-color-scheme`, with a manual toggle); use Tailwind `dark:` variants or CSS variables, and keep the positive/negative balance colors readable in both modes
- Money is an integer number of VND (never floats); format with `Intl.NumberFormat("vi-VN")`
- All money logic is pure functions in `lib/settlement.ts` with unit tests; components never compute balances inline
- Balances are always derived from rounds, never stored. Each round stores a snapshot of `unitPrice`, so changing the price later does not rewrite history
- Every round is zero-sum: the sum of all balance changes is exactly 0. Tests must assert this
- Only `lib/storage.ts` reads/writes localStorage. The data has a `version` field and a migration path; corrupt or missing data must not crash the app
- localStorage does not exist on the server: read it after mount (effect or `useSyncExternalStore`) to avoid hydration mismatches
- Players who already appear in rounds are archived, never deleted
- Prefer server components; add `"use client"` only when interactivity requires it (most session screens will need it)
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)

## Rules

- Never commit to `main`. Work on `feat/*`, `fix/*` or `chore/*` branches and open a PR
- One PR = one concern. Keep diffs small and reviewable
- Do not add dependencies without asking first
- Do not invent business rules: if the spec is silent (e.g. rounding, special scoring), ask or leave a clear TODO in the spec
- Never commit secrets or `.env*` files; keep `.env.example` with variable names only
- Do not change the folder structure or tooling config unless the task requires it
- Ask before deleting files or running destructive commands

## Definition of done

Before saying a task is finished:

1. `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` all pass (CI runs the same)
2. The screen works at mobile width (390px) and does not break on desktop
   and looks right in both light and dark mode
3. No console errors or hydration warnings
4. Reloading the page keeps the data (persistence works)
5. Changes are committed on the feature branch with a clear message

## Workflow

1. Read `docs/spec.md` and this file
2. For any non-trivial task, propose a short plan and wait for approval
3. Implement step by step, committing after each working step
4. Run the checks above, then open a PR describing what changed and how to verify it

## Learned rules

Add a one-line rule here every time the AI repeats a mistake.

- (empty for now)
