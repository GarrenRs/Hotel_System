> **Type:** Implementation Phase | **ID:** Phase 3 | **Status:** CLOSED | **Superseded By:** Phase 8

# Phase 3 — Isolated Demo Sessions

Cookie-based `sessionId` scoping, middleware session bootstrap, and a secret-protected 24h cleanup endpoint.

## What changed

- **`middleware.ts` (new, project root)** — If the visitor has no `demo_session_id` cookie, it generates a UUID, best-effort-fires a self-request to `POST /api/demo/init` (carrying the new session), and sets the cookie `httpOnly`, `sameSite: lax`, `secure` in production, `maxAge: 3600`, `path: /`. Existing sessions pass through untouched. Initialization failure never blocks the visitor.
- **`lib/session.ts` (new)** — Single source for the cookie name (`DEMO_SESSION_COOKIE = 'demo_session_id'`) and `getDemoSessionId(request)`.
- **`app/api/demo/init/route.ts` (new)** — Phase 4 seeding hook placeholder. Reads the session cookie (400 if missing), logs `Demo session initialized (Phase 4 seeding hook — no rows created yet)`, and returns `ApiResponse` with the `sessionId`. Creates zero rows today.
- **`app/api/demo/cleanup/route.ts` (new)** — Requires the `x-cron-secret` request header to equal `CRON_SECRET` (else 401). Deletes all `Reservation` rows with `updatedAt < now() - 24h`, then all `Room` rows with the same criterion (reservations cleared before rooms to respect FK `onDelete: SetNull`), and returns the deletion counts + cutoff timestamp. Time-based (24h) so recent, active session rows are never touched.
- **Repository scoping** — Every method in `repositories/reservation/` and `repositories/room/` now takes `sessionId` as an explicit parameter and filters/asserts on it:
  - `findAll(sessionId, filter?)` uses a `Prisma.ReservationWhereInput` (also fixes the pre-existing `where: any` lint error).
  - `findById(sessionId, id)` returns rows only for that session.
  - `updateStatus` / `delete` assert ownership (`assertOwned`) before mutating.
  - `getStats(sessionId)` and `hasConflictingReservation({ ... , sessionId })` are session-scoped.
- **Service layering** — `reservationService` and `roomService` expose no `sessionId` defaults; the API route layer reads the cookie via `getDemoSessionId` and passes it down explicitly. A client-supplied `sessionId` is never trusted from the request body.
- **Routes** — `app/api/reservations/route.ts`, `app/api/reservations/[id]/route.ts`, and `app/api/admin/stats/route.ts` read `getDemoSessionId(request)` and return 401 `Session required.` when absent.

## Why

The template is a single shared demo instance for all prospects. Per-session isolation guarantees one visitor can never see or mutate another visitor's reservations or rooms (zero cross-visitor interference), without any login requirement. The self-resetting 24h cleanup keeps the demo database from accumulating stale sessions on a schedule (Vercel Cron recommended), and the `x-cron-secret` header prevents anyone from triggering cleanup manually.

## How to verify

Prerequisites: all `REQUIRED_ENV_VARS` set (incl. `CRON_SECRET`), dev server running against the real `DATABASE_URL`.

1. **Session creation / cookie**: first request to the app returns a `demo_session_id` cookie (`HttpOnly; SameSite=lax; Max-Age=3600`). A second visitor gets a different UUID. A fresh request without a cookie (expired/missing) gets a new session and never errors.
2. **Visitor isolation (reservations)**: with two cookie jars A and B, POST a reservation for each (`/api/reservations`), then verify:
   - A's `GET /api/reservations` list contains only A's reservation; B's list contains only B's.
   - `GET /api/reservations/<A-id>` with B's cookie → 404; with A's cookie → 200.
   - `DELETE`/status updates of A's reservation fail under B's cookie.
3. **Visitor isolation (rooms)**: insert one `Room` per session (e.g. via seed or SQL), then confirm `roomService.getAllRooms(sessionId)` returns only that session's rows and `getRoomById` cross-session returns `null`. (No `/api/rooms/*` routes exist until Phase 5, so this is exercised at the service/repository layer.)
4. **Cleanup authorization**: `POST /api/demo/cleanup` without the `x-cron-secret` header, and with a wrong value, both return 401.
5. **Stale-only cleanup**: insert a `Room` and `Reservation` row with `updatedAt` artificially older than 24h (e.g. `now() - interval '2 days'`) under a throwaway session, plus recent rows for an active session. Run cleanups with the correct header → 200, `deletedReservations` and `deletedRooms` equal the count of stale rows only; recent/active session rows remain untouched.

> **DB-backed verification performed (2026-09-07):** executed end-to-end against the project's actual demo database (Supabase via `.env.local`), after `npx prisma db push`. Two simulated sessions (A and B) confirmed mutual data invisibility at both the API and the room-service level; a throwaway session with an artificially-old room + reservation was the *only* data removed by a correctly-authenticated cleanup call (exactly 1 reservation + 1 room), while A/B sessions' recent rows survived untouched; unauthorized cleanup calls returned 401. After verification all test rows were deleted and the database was left in its pre-test state. No credentials or connection strings were written anywhere in the repository; only `.env.local` (git-ignored) holds the real `DATABASE_URL`.

## Environment variables added or changed

- **`CRON_SECRET`** (required, new) — shared secret the cleanup endpoint validates via the `x-cron-secret` header. Added to `REQUIRED_ENV_VARS` in `lib/env.ts` (app fails loudly at startup if unset) and to `.env.example` as `CRON_SECRET="change-me-to-a-long-random-secret"`.
- **Session cookie** — `demo_session_id` (not an env var; httpOnly, 1h `maxAge`).

Scheduling the cleanup is intentionally left unwired. Recommended: a Vercel Cron definition in `vercel.json` hitting `POST /api/demo/cleanup` hourly with the `x-cron-secret` header (env var in Vercel). Alternative: Make.com webhook schedule. Neither was added during Phase 3 to keep the change contained.

## Rollback

1. Delete `middleware.ts`, `app/api/demo/init/`, `app/api/demo/cleanup/`, and `lib/session.ts`.
2. Restore pre-Phase-3 `repositories/reservation/*`, `repositories/room/*`, `services/reservation/*`, `services/room/*` (unscoped signatures), and the three routes' original bodies (no `getDemoSessionId`, no 401 on missing session).
3. Remove `CRON_SECRET` from `REQUIRED_ENV_VARS` in `lib/env.ts` and the `.env.example` line.
4. The `"Session"` and app code no longer reference the cookie; existing `sessionId` columns on `Room`/`Reservation` remain in the database (benign).