> **Type:** Implementation Phase | **ID:** Phase 4b | **Status:** CLOSED | **Based On:** Phase 4 observations | **Superseded By:** Phase 8

# Phase 4b — Bugfixes: Reservation Reference Uniqueness + First-Load Latency

Bugfix phase (between Phase 4 and Phase 5). Two targeted fixes resolving the two observations logged at the end of Phase 4. No new features.

## What changed

1. **`services/reservation/reservation.service.ts`** — `createReservation` no longer generates a `reservationId` blindly. It now:
   - allocates the ID via a new `allocateReservationId()` helper that checks `repo.reservationIdExists(candidate)` and regenerates on collision, capped at `MAX_RESERVATION_ID_ATTEMPTS = 5`;
   - wraps the insert and catches `Prisma.PrismaClientKnownRequestError` with `code === 'P2002'` (the only unique column on `Reservation` besides `id` is `reservationId`, so this code path is unambiguous) and retries with a fresh ID;
   - logs each internal collision/re-generate at `INFO` for visibility;
   - on exhaustion, throws `Error('Could not allocate a unique reservation reference. Please try again.')`, which the existing route catch turns into a clean `ApiResponse` 500 (never an unhandled error).
   - The public format `HB-2026-XXXX` and all other `createReservation` behavior are unchanged.
2. **`repositories/reservation/interface.ts` + `repositories/reservation/prisma.repository.ts`** — added `reservationIdExists(reservationId: string): Promise<boolean>` (`findUnique` by `reservationId`), keeping the check inside the repository layer per the existing `domain → repositories → services` layering.
3. **`middleware.ts`** — the self-fetch to `/api/demo/init` is now fire-and-forget: the cookie is set and the request is allowed through immediately without awaiting seeding (`void fetch(...).catch(...)`, same best-effort semantics). The matcher already excluded `/api/demo/init`, so the background request does not recurse.
4. **Client-side first-load handling** (admin only — the public pages fetch no session data at first render, they render from static constants):
   - `app/admin/(protected)/dashboard/page.tsx` — initial fetch now retries up to 4 times at 1.2s spacing and keeps `loading` (the `...` placeholders) visible until the seeded data appears or attempts are exhausted, instead of flashing a zero/empty dashboard while the brand-new session is still seeding.
   - `app/admin/(protected)/reservations/page.tsx` — added a separate bootstrap effect with the same bounded retry that owns the initial mount fetch; the existing filter/search effect is unchanged but skips its own mount-run (`didBootstrap` ref) to avoid double-fetching.
   - No new state-management library or spinner system; just the existing `useState`/`useEffect` patterns.
5. **`lib/seed.ts`** — `seedDemoData` sped up so the background seed window is near-invisible:
   - rooms created in one `createMany` (13 rows) with their statuses inline (the 4 non-AVAILABLE statuses are now set at creation, replacing the old room-by-room create + 4 `update`s);
   - room IDs mapped afterwards with a single `findMany` (still needed so reservations can link `roomId`);
   - reservations created in one `createMany` (8 rows) instead of 8 sequential creates;
   - `reservationId` dedup against existing rows is preserved.
   - Same idempotency and identical output data (13 rooms, 8 reservations, statuses `CONFIRMED×6/PENDING×1/CANCELLED×1`, relative dates).

## Why

- **Issue 1 (functional bug, higher priority):** `reservationId` is `@unique` globally, but the service generated a random 4-digit suffix with no collision check, so two concurrent visitors on the shared demo DB could hit a genuine `P2002` unique-constraint failure (a 500 for an otherwise valid booking). The Phase 4 seed already handled this for its own writes; the real booking path did not. The fix mirrors the seed's approach, adds the P2002 safety net for the check-then-insert race, and keeps the retry internally contained so the failure mode degrades to a clean `ApiResponse`.
- **Issue 2:** Phase 3/4 middleware blocked the very first request of a brand-new session until seeding completed — measured 5.1–5.2s vs 0.2–0.3s with a cookie. Making the seeding non-blocking plus batching the seed inserts (≈26 round trips → ~6) shrinks the first-load to baseline and the unstyled "no data" gap to well under a second, with the admin pages' bounded retry covering the remaining race instead of flashing an empty hotel.

## How to verify

1. **Schema/types/lint (done)** — `npx tsc --noEmit` exits 0. `npm run lint` reports only the two pre-existing `catch (err: any)` errors (login page:45, BookingForm:50) — no new errors or warnings.
2. **Issue 1 — concurrent booking burst (done)** — against a running dev server, 200 simultaneous `POST /api/reservations` (fresh seeded session, room-less public-book path): **200/200 HTTP 201, 200 unique `reservationId`s, 0 failures**. The server log recorded the internal handling: 2× `Reservation ID collision detected, regenerating` (exists-check) and 2× `Reservation ID collision on insert, retrying` (P2002), all transparent to the client.
3. **Issue 2 — first-load before/after (done, dev server, warm Turbopack)**:
   - Before fix: fresh no-cookie page load **5.15–5.23s** vs cookie baseline 0.19–0.32s; `/api/demo/init` POST itself (the awaited unit) **4.26–4.86s**.
   - After fix: fresh no-cookie page load **0.21–0.23s** (≈ baseline). The middleware-set session showed its seeded **8 reservations at t+1.0s**, and `/api/admin/stats` returned `{total: 8, newCount: 0, pendingCount: 1, confirmedCount: 6, cancelledCount: 1}`. Seed function itself now completes in roughly a half second per session (createMany), down from ~4.5s.
   - No permanent empty state: the bounded retries exit into the normal empty state only if seeding genuinely failed.
4. **CLI seed (done)** — `npx prisma db seed` still exits 0 and produces the fixed `local-dev-seed-session` with 13 rooms / 8 reservations (requires `DATABASE_URL` set inline from `.env.local`; see notes).
5. **Cleanup (done)** — all verification rows were cleared; the demo database was left at its pre-test state (0 rooms / 0 reservations).

## Environment variables added or changed

- None. (The CLI seed still needs `DATABASE_URL` in the process environment — Next loads `.env.local` for the app, but `tsx`/the Prisma CLI do not.)

## Rollback

1. Revert `services/reservation/reservation.service.ts` to the single-shot `HB-2026-${random}` generation (pre-existing code).
2. Remove `reservationIdExists` from `repositories/reservation/interface.ts` and `repositories/reservation/prisma.repository.ts`.
3. Restore `middleware.ts` to the awaited `/api/demo/init` fetch (blocking).
4. Revert the bootstrap retries in `app/admin/(protected)/dashboard/page.tsx` and `app/admin/(protected)/reservations/page.tsx`.
5. Restore `lib/seed.ts` room create + status-update transactions and sequential reservation creates.
6. Delete `docs/phases/phase-4b-bugfixes.md` and revert the Phase Tracker/changelog in `docs/PROJECT_STATE.md` and the resolved entries in `docs/archive/notes-journal.md`.