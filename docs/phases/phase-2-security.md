> **Type:** Implementation Phase | **ID:** Phase 2 | **Status:** CLOSED | **Based On:** Phase 1 | **Superseded By:** —

# Phase 2 — Security Hardening (env validation, no silent secret fallbacks)

## What changed

- `lib/env.ts` — new startup-check utility. Declares `REQUIRED_ENV_VARS` (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, `DATABASE_URL`), reads `process.env` once at module-import time, and exports the validated `env` map. If any required variable is `undefined` it throws `Missing required environment variable: X` (first missing in declaration order) instead of silently continuing.
- `app/api/admin/login/route.ts` — removed the three hardcoded fallback literals the old code fell back to (a default `admin` username, and the placeholder password / JWT secret that used to ship in `.env.example`); reads `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `JWT_SECRET` from the validated `env` instead of inline `process.env` fallbacks.
- `app/admin/(auth)/login/page.tsx` — removed the `useForm` `defaultValues` that pre-filled the login form with hardcoded `admin` credentials; the form now starts blank.
- `.env.example` — unchanged. It remains the single allowed location for the placeholder literals (per the Phase 2 grep criterion: zero references outside `.env.example`).
- `docs/archive/notes-journal.md` — updated the stale "Phase 2 removes them" bullet about `.env.example` and logged new out-of-scope observations (see Rollback / notes).

## Why

Global Rule 4 ("no silent defaults for secrets"): a system that ships the real admin password and JWT signing secret in source, and only overrides them if env vars happen to be set, is insecure regardless of how `!important` the fallback "template" is dressed. Anyone with the code can generate admin JWTs or log in as the hotel admin. This phase makes all four variables mandatory: if any is undefined the app fails loudly with a clear message in the required form (`Missing required environment variable: X`), never a silent fallback or an unrelated crash. The login form's pre-filled credentials were removed because they baked the same literal password into the shipped client bundle.

## How to verify

1. Runtime, env unset (done):
   - Unset `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, `DATABASE_URL`, start with `npm run dev`, then `POST /api/admin/login` with the old hardcoded credentials.
   - Result: HTTP `500` and the dev log shows `Error: Missing required environment variable: ADMIN_USERNAME` thrown at module load from `lib/env.ts` — i.e. it fails with the clear error, not a silent fallback or an unrelated crash. (The dev server itself starts fine because the check lives in the login route module; the failure is surfaced the moment the route is exercised.)
2. Runtime, env set (done):
   - Set all four variables (e.g. the `.env.example` values) and start with `npm run dev`.
   - `POST /api/admin/login` with correct credentials → HTTP `200`, `{"success":true,"message":"Login successful.","data":{"username":"admin"}}`, and the `hotel_hb_admin_token` cookie is set (`HttpOnly`, `SameSite=lax`, 1-day `Max-Age`).
   - `POST /api/admin/login` with a wrong password → HTTP `401`, `{"success":false,"message":"Invalid credentials.","data":null,"errors":["Invalid username or password."]}` — identical response shape to pre-phase behavior.
3. Grep for old literals (done):
   - `rg -n --no-ignore --glob '!node_modules/**' '<old-placeholder-password>|<old-placeholder-jwt-secret>' .` (substituting the two placeholder values formerly shipped in `.env.example`) → zero matches. The literals now exist only in `.env.example`. No other hardcoded secrets (`secret`, `api[_-]?key`, etc.) remain in app/lib/services/domain/repositories/prisma, and no other fallback pattern (`|| '<value>'`) remains in source files.
4. Type/lint (done):
   - `npx tsc --noEmit` and `npm run lint` were executed. No new errors from this phase's changes (all errors/warnings reported are outside the changed lines — pre-existing, see `docs/archive/notes-journal.md`).

## Environment variables added/changed

- No variable names were added, removed, or renamed. Semantics changed: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, and `DATABASE_URL` are now **mandatory** — if any is unset, authentication refuses to run and throws `Missing required environment variable: X`. `DATABASE_URL` was already effectively mandatory (Prisma `env("DATABASE_URL")`); it is now enforced by the same validator.

## Rollback

- Revert `app/api/admin/login/route.ts` to the inline fallback reads, re-adding the fallback literal for each of `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `JWT_SECRET` (values as documented in `.env.example`).
- Restore the `defaultValues` block in `app/admin/(auth)/login/page.tsx` (or revert the whole file).
- Delete `lib/env.ts`.
- Restore the `docs/archive/notes-journal.md` bullets touched by this phase.
- Delete `docs/phases/phase-2-security.md` and revert the Phase tracker in `docs/PROJECT_STATE.md`.