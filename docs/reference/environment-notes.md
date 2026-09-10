# Reference — Environment & Tooling Notes

> Current operational notes for this working copy / dev machine. Distilled from the
> archived working journal (`docs/archive/notes-journal.md`); keep this list current
> as a single source instead of re-accumulating a journal.

## Environment variables (local development)

- `.env.local` currently holds only `DATABASE_URL` — and it is **double-quoted**
  (`DATABASE_URL="postgresql://..."`), so when injecting manually, trim the quotes.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET` are **runtime credentials only**:
  `lib/env.ts` validates lazily on first (request-time) read and throws
  `Missing required environment variable: X` otherwise. **`next build` does NOT need
  them.** `npm run dev` / `next start` DO (the dev server must be started with them
  shell-injected, or the login route 500s). **No hardcoded fallbacks.**
- `.env.example` is tracked; real `.env`/`.env.local` are git-ignored.

## Prisma CLI / migrations

- **Prisma CLI reads `.env`, not `.env.local`; and tsx does not auto-load env files.**
  For `npx prisma ...` and `npx tsx prisma/seed.ts` / `scripts/*`, inject
  `DATABASE_URL` manually, e.g.:
  `$env:DATABASE_URL = (Get-Content .env.local | Where-Object {$_ -match '^DATABASE_URL='}) -replace '^DATABASE_URL=','' -replace '^"','' -replace '"$',''`
- The project **now has committed migration history** (baselined in Phase 10):
  `prisma/migrations/0_init/` + `prisma/migrations/20260910061244-phase-9-lifecycle/`
  (+ `migration_lock.toml`). Schema changes go through `migrate dev`, rollouts apply
  via `migrate deploy` (see `docs/reference/deployment.md`). `db push` is no longer the
  sync flow for fresh databases.
- `npx prisma db seed` / `npx tsx prisma/seed.ts` is a **full data replacement**
  (re-seeds everything). Run it before and after scenario verification to keep a
  pristine demo state.
- No `prisma generate`/`migrate` npm convenience scripts exist — can be added if approved.

## Verification (Phase 10)

- `scripts/verify-st-001.ts` — 28-scenario Tier 1 suite against a live dev server
  (state-machine edges, 15-parallel concurrency, `/api/rooms/available`, stats,
  auth regressions). Start the server with admin env injected, then run it. Soft
  expectations: `201s=1 400s=14` on the concurrency block.
- `npx tsc --noEmit` typechecks the project; the running `next dev` occasionally
  mangles `.next/dev/types/validator.ts` — delete `.next/dev/types` and re-run if tsc
  reports errors only inside `.next/`.

## PowerShell 5.1 gotchas (this machine)

- `Invoke-WebRequest -Headers @{Cookie=...}` silently drops the Cookie header — use
  `curl.exe` with `-b "-H Cookie:..."` style instead (or Node/tsx `fetch`, which sets
  `Cookie` fine).
- Inline JSON bodies get mangled by quoting — write the body to a temp file and use
  `curl.exe ... --data-binary @body.json`.
- **UTF-8 round-trips corrupt code:** PS 5.1 has no `-Encoding utf8NoBOM`
  (`utf8` writes a BOM) and `Get-Content -Raw` default-decodes as ANSI, which destroyed
  the accents in `lib/status.ts` once. **Never round-trip source files through
  PowerShell** — read/edit with the dedicated tools.
- `next build` with Turbopack needs `NODE_OPTIONS=--max-old-space-size=4096` to avoid OOM.

## Repository / tool facts

- Font loading: `fonts.googleapis.com` is unreachable from this machine — local
  `next build` fails only on the `next/font/google` fetch; builds fine on Vercel.
- `tsconfig.tsbuildinfo` is not in `.gitignore` (pending fix).
- Prisma update banner (5.22) is informational — ignore.
- This working copy is a git repo (single commit); the earlier "not a git repository"
  note in the archived journal is historical — the repo was later initialized.

## Session resume

Re-read `docs/PROJECT_STATE.md`, then `docs/architecture/`, then any OPEN study
(`docs/studies/`) before touching code. See `docs/README.md`.