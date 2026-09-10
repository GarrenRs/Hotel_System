> **Type:** Implementation Phase | **ID:** Phase 10 | **Status:** IMPLEMENTED — Tier 1 verified; **awaiting owner Tier 2 verification** (do not mark CLOSED until the owner walks it through) | **Based On:** ST-001 (Reservation / Room / Stay Lifecycle), ST-002 (Customer Journey Redesign) | **Supersedes:** — | **Implementation Phase (studies):** this phase

# Phase 10 — Reservation & Customer Journey Lifecycle (ST-001 + ST-002)

## What changed

ST-001 and ST-002 (both approved "exactly as written", incl. the five ST-001 Final-Review
decisions and the ST-001↔ST-002 reconciliation) were implemented as one coherent phase:
the reservation/room lifecycle went from 2+1 statuses to the 5-state machine, room
transitions became reservation-driven under row locks, the public booking form became
date-aware and capacity-aware, and new availability + stats endpoints were added.

### Task 1 — Schema & migration history

- `prisma/schema.prisma` — `roomNumber String @unique` on `Room` (ST-001 §B).
- **First committed migration history** — the database previously had none (created via
  `db push`), so a `0_init` baseline was generated from the empty schema
  (`npx prisma migrate diff --from-empty --to-schema-datamodel ... --script`, applied via
  `npx prisma migrate resolve --applied 0_init`, then `migrate deploy`).
  `prisma/migrations/20260910061244-phase-9-lifecycle/migration.sql` applies the unique
  constraint and backfills `UPDATE Reservation SET status='NEW' WHERE status='PENDING'` (ST-001 decision: drop PENDING).
- `prisma migrate deploy` + `prisma generate` succeeded; verified 0 PENDING remain, the
  unique constraint exists, and the `_prisma_migrations` table tracks both migrations.
- **Migration name quirk (historical, kept):** the lifecycle migration was named
  "phase-9-lifecycle" during implementation because the phase number was assumed to be 9
  at the time; the study registry had already reserved the name "phase-9" for the old
  analysis record (converted to ST-001), so this phase is registered as **Phase 10** and
  the deployed migration keeps its original folder name unchanged.

### Task 2 — Domain & single source of truth

- `domain/reservation/enums.ts` — `ReservationStatus` now `NEW | CONFIRMED | CHECKED_IN | CHECKED_OUT | CANCELLED` (PENDING removed).
- `domain/reservation/types.ts` — `CreateReservationInput`, `UpdateReservationStatusInput`,
  `ReservationFilterInput`, `ApiResponse<T>`, `CurrentGuestInfo`, `AdminStats`.
- `domain/reservation/entities.ts` / `domain/room/entities.ts` — entities carry
  `roomNumber`; rooms add read-only `currentGuestName` / `currentGuestDeparture`
  (from the CHECKED_IN reservation join) for the admin UI.
- `lib/status.ts` (new) — **single source of truth**: `RESERVATION_STATUS_UI`,
  `ROOM_STATUS_UI`, `UNKNOWN_STATUS_UI`, `RESERVATION_TRANSITIONS`, `ROOM_TRANSITIONS`,
  `TRANSITION_LABEL_KEYS`, `transitionLabelKey()`. Unknown status → explicit unknown
  handling, not silent fallback.
- `lib/constants.ts` — removed `STATUS_CONFIG` / `ROOM_STATUS_CONFIG`; keeps
  `ROOM_TYPES_LIST` + `NAV_ITEMS`.

### Task 3 — Services (business rules)

- `services/availability.ts` (new) — `isoToday()`, `periodsOverlap()`,
  `CONFLICTING_RESERVATION_STATUSES` (NEW/CONFIRMED/CHECKED_IN — CANCELLED and
  CHECKED_OUT never block), `isOfferableForPeriod()`, `isConfirmable()`.
  - **Offer rule (ST-001 §E + decision 1):** a room is sellable for [arrival, departure)
    iff its physical status is not MAINTENANCE, no active reservation overlaps the
    period, and either the arrival is in the future (`arrival > today`) **or** the room
    is physically AVAILABLE (a same-day OCCUPIED/CLEANING room that is free later is NOT
    sold for a same-day start; a future-start period may use it).
  - **Confirm gate (decision 1):** period-only — the room must not be MAINTENANCE and
    must have no conflicting active reservation. Physical AVAILABLE is not required to
    confirm (matches ST-001 §E reconciliation).
- `services/reservation/reservation.service.ts` — rewritten.
  - Typed errors: `ReservationConflictError`, `ReservationNotFoundError`,
    `InvalidTransitionError`, `CheckInBeforeArrivalError`, `RoomNotReadyForCheckInError`,
    `RoomNotFoundError`, `RoomTypeMismatchError`, `CapacityExceededError`.
  - `createReservation` — **transactional**: `lockRoomById` (`SELECT ... FOR UPDATE` on
    the room row, decision 4), re-checks the offer rule, capacity vs `ROOM_TYPES_LIST`
    capacity, room type match; `NP-2026-####` allocation with P2002 retry (max 5).
    Transaction-contention errors (**P2028/P2034**, e.g. pool saturation under 15
    concurrent bookings) are mapped to `ReservationConflictError` → the guest sees a
    clean 400, never a 500.
  - `transitionReservation(id, status)` — the **single authoritative transition path**
    (decision: one method): validates against `RESERVATION_TRANSITIONS`, then gates:
    - **CONFIRMED** — `isConfirmable` (MAINTENANCE/conflict → 400).
    - **CHECKED_IN** — `arrival <= today` first, then room must be physically
      `AVAILABLE`, then no conflict; **room → OCCUPIED**.
    - **CHECKED_OUT** — **room → CLEANING** (no arrival/availability gate; legal only from CHECKED_IN).
    - **CANCELLED** — terminal; new/cancelled stays never touched a room row, so no side effect.
  - Room transitions are **reservation-driven only**: `PATCH /api/rooms/[id]` is
    restricted to the operational set (decision 2/5); it never touches an OCCUPIED room.
- `services/room/room.service.ts` — rewritten.
  - `getAvailableRoomsForPeriod` — powers `GET /api/rooms/available` and the guest form;
    MAINTENANCE + period conflicts removed via `findBlockingReservations`; the write path
    re-validates (offer is advisory only).
  - `updateRoomOperationalStatus` — legal edges from `ROOM_TRANSITIONS`
    (AVAILABLE→MAINTENANCE, CLEANING→AVAILABLE/MAINTENANCE, MAINTENANCE→AVAILABLE;
    OCCUPIED untouched). Transactions with row lock. Setting MAINTENANCE returns
    `warnings` (affected CONFIRMED stays via `findUpcomingConfirmedForRoom`); it
    **never auto-cancels** reservations.
- `services/admin/admin.service.ts` — `getDashboardStats` composing room counts +
  reservation stats (`reservedUpcoming`, `todayArrivals`, `todayDepartures`,
  `currentGuests`) into `AdminStats`.

### Task 4 — Repositories

- `repositories/{room,reservation}/{interface,prisma.repository,index}.ts` — rewritten
  with transaction support on every write, `lockRoomById` (raw `SELECT ... FOR UPDATE`),
  room listing joined to the in-house CHECKED_IN reservation (current guest), reservation
  lists joined to `roomNumber`, `getAdminReservationStats`, `hasConflictingReservation`
  (excludes CANCELLED + CHECKED_OUT), `findBlockingReservations`,
  `findUpcomingConfirmedForRoom`, `reservationIdExists`.

### Task 5 — API routes & errors

- `lib/api-errors.ts` (new) — `toErrorResponse(error, scope)` maps typed errors to
  HTTP status + **i18n key** (never presentation strings):
  guest scope `400 validation.guestsCapacity` / `400 errors.roomNotAvailable` /
  `400 errors.roomTypeMismatch` / `404 errors.roomNotFound`; admin scope
  `admin.errors.{reservationNotFound, roomNotFound, invalidTransition,
  checkInBeforeArrival, checkInRoomNotReady, conflict, invalidRoomStatus,
  invalidRoomTransition}`; fallback `500 errors.serverError`. Fixed the known **500 →
  400** bug on invalid room status.
- `app/api/rooms/available/route.ts` (new, public) — iso-date validation
  (`validation.invalidDateFormat`, `validation.departureAfterArrival`) + offer rule.
- `app/api/reservations/route.ts` — GET admin-only; POST public (zod `safeParse`, 201).
- `app/api/reservations/[id]/route.ts` — GET/PATCH/DELETE via the service (PATCH body
  validated by `adminReservationStatusSchema`).
- `app/api/rooms/[id]/route.ts` — PATCH → `updateRoomOperationalStatus`, returns
  `{ room, warnings }`.
- `app/api/admin/stats/route.ts` — GET → `adminService.getDashboardStats`.
- `lib/validations/reservation.schema.ts` — `ISO_DATE_PATTERN`, superRefine for
  `departureAfterArrival` and `arrivalPast` (via `isoToday`).

### Task 6 — Admin UI

- `components/admin/StatusBadge.tsx` — rewritten with `kind` + `reservationStatusUi` /
  `roomStatusUi` from `lib/status`; unknown status → `common.status.unknown`.
- Dashboard (`app/admin/(protected)/dashboard/page.tsx`) — §K cards: 5 room counters
  (total/available/occupied/cleaning/maintenance) + 3 reservation counters
  (reservedUpcoming/todayArrivals/todayDepartures) + current-guest table + recent
  reservations preview.
- Reservations list — status filter (`Object.values(ReservationStatus)`), StatusBadge,
  room-number column, view-only (no list deletion), refresh via `admin.actions.refresh`,
  subtitle `admin.reservationsSubtitle`.
- Reservation detail — contextual transition buttons derived from
  `RESERVATION_TRANSITIONS` + `transitionLabelKey(current, target)`, delete lives only
  here (admin.actions keys), room number + guests shown, errors via `t(key)`.
- Rooms page — room-status counts from `ROOM_STATUS_UI`, contextual transitions from
  `ROOM_TRANSITIONS`, current guest shown on OCCUPIED, maintenance warnings rendered,
  `admin.roomsSection.*` copy.

### Task 7 — Public UI (ST-002)

- `components/reservation/BookingForm.tsx` — rewritten, **date-aware**: on arrival /
  departure / room-type change it calls `GET /api/rooms/available` and lists only rooms
  the offer rule can sell; guests clamped to the room-type capacity on selection;
  success screen shows `reservationId` + `roomNumber` + dates + guests with options to
  copy the reference and book another room. No new/missing public pages.
- `components/hotel/StatsBand.tsx` (new) — fetches `GET /api/rooms`, fixes the
  "45+ rooms" copy (seed supplies 13); wired into `app/(public)/page.tsx`.

### Task 8 — i18n (ar + fr)

- `common.json` — `status.{new,confirmed,checkedIn,checkedOut,cancelled,unknown,available,occupied,cleaning,maintenance}` (PENDING removed).
- `admin.json` — `reservationsSubtitle`, `stats.*`, `table.{guest,roomNumber}`,
  `details.noTransitions`, `actions.{refresh,confirm,checkIn,checkOut,markReady,maintenance,backToService}`,
  `roomsSection.{currentGuest,maintenanceWarnings,noActions}`, `errors.*` (invalidTransition,
  checkInBeforeArrival, checkInRoomNotReady, conflict, invalidRoomStatus,
  invalidRoomTransition, roomNotFound, reservationNotFound, …).
- `contact.json` — arrival/departure/guests/room-type labels + capacity/hints +
  `noAvailableRooms`, `bookAnotherRoom`, `keepReservationId`, `roomNumberLabel`.
- `validation.json` — `guestsCapacity`, `departureAfterArrival`, `arrivalPast`, `invalidDateFormat`.
- `errors.json` — `roomNotAvailable`, `roomTypeMismatch`, `roomNotFound`.

### Task 9 — Seed redesign

`lib/seed.ts` + `prisma/seed.ts` — 13 rooms, 9 reservations exercising **every** lifecycle
state (CHECKED_OUT ×2, CHECKED_IN ×2 with one departing today = `todayDepartures` 1,
CONFIRMED ×3 incl. two non-overlapping on 401, NEW ×1, CANCELLED ×1; 101/302 OCCUPIED,
203 CLEANING, 402 MAINTENANCE). Full replacement, CLI-only.

### Task 10 — Env behavior

- `lib/env.ts` — now **lazy**: validation runs on first property access (request time),
  not module import. `next build` no longer requires `ADMIN_USERNAME` /
  `ADMIN_PASSWORD` / `JWT_SECRET` to be present (they are runtime credentials); they
  still throw clear `Missing required environment variable: X` errors at request time
  when absent. `.env.example` unchanged (four vars).

## Why

Closed-scope bookings, unenforceable room state, and the physical-status booking gate
made the system manage *requests*, not *stays*: two simultaneous submissions for the
same room could both be accepted, an OCCUPIED-today room could be sold for a future
period, capacity was unenforced, admin toggling OCCUPIED/CLEANING by hand contradicted
reality, invalid statuses produced a 500, and the admin UX translated internal statuses
instead of i18n keys. ST-001 + ST-002 (approved with the recorded final-review decisions)
define the target: one authoritative 5-state machine, reservation-driven room
transitions under row locks, a single transactional write path, a date/capacity-aware
guest form, and honest copy in ar + fr.

## Decisions recorded (from the studies — binding)

1. Offer = period rule (not "physical AVAILABLE only"); CONFIRMED gate is period-only.
2. One status field, 4 physical room values; OCCUPIED is never admin-toggled.
3. Single `transitionReservation(id, status)` enforcing the machine.
4. `SELECT ... FOR UPDATE` row lock on the room for every booking/transition.
5. MAINTENANCE toggle returns warnings; never auto-cancels.

## How to verify (Tier 1 — executed green)

1. **Static** — `npx tsc --noEmit` exit 0; `npm run lint` = 0 errors (residual warnings
   are the pre-existing baseline + a react-hook-form `watch()` advisory);
   `npm run build` exits 0 with **no** admin env vars present (lazy env proof).
2. **Migration** — `npx prisma migrate deploy` is a no-op (00_init +
   20260910061244-phase-9-lifecycle applied); `npx prisma generate` passes.
3. **Live scenarios** — `npx tsx prisma/seed.ts`, start `npm run dev` with
   `ADMIN_USERNAME`/`ADMIN_PASSWORD`/`JWT_SECRET` injected, then
   `npx tsx scripts/verify-st-001.ts` → **28/28 PASS**, including:
   - all legal transitions; every illegal one (`NEW→CHECKED_IN`, `CHECKED_OUT` without
     check-in, `CHECKED_IN→CANCELLED`, `CANCELLED→CONFIRMED`, check-in before arrival,
     check-in on CLEANING/MAINTENANCE room) → 400 with the mapped key;
   - **15 parallel bookings for the same room/period → exactly 1×201 + 14×400**
     (no double-booking; P2028/P2034 handled as clean 400s);
   - `/api/rooms/available` respects OCCUPIED/CLEANING same-day, period conflicts
     (401), MAINTENANCE never offered, and validation errors;
   - seed invariants on stats (13 rooms, 2/1/1 occupied/cleaning/maintenance,
     currentGuests 2, todayDepartures 1) and unauthenticated admin API → 401.
4. **Restore** — `npx tsx prisma/seed.ts` again after any scenario run.
5. **Tier 2 (owner)** — walk the admin flows + guest form per the ST-001/ST-002 docs;
   see the phase report. Do not mark this phase CLOSED until the owner confirms.

## Environment variables added/changed

- **Added:** none.
- **Changed (behavior):** `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET` are now
  validated lazily at runtime (build passes without them). Still required at request
  time — no silent defaults.
- **Unchanged:** `DATABASE_URL` (Prisma CLI still needs it injected; see
  `docs/reference/environment-notes.md`).

## Rollback

- **Schema/data:** `npx prisma migrate resolve --rolled-back 20260910061244-phase-9-lifecycle`,
  delete the migration folder + the `0_init` baseline traces, then `prisma db push` back to
  the pre-phase schema (remove `roomNumber @unique`, restore PENDING or re-map NEW→PENDING).
- **Code:** revert `services/reservation` + `services/room` to the Phase 8 two-file
  versions, delete `services/availability.ts` + `lib/api-errors.ts` + `lib/status.ts`
  changes, restore `STATUS_CONFIG`/`ROOM_STATUS_CONFIG`, restore PENDING everywhere
  (domain/enums/types, repositories, filters, i18n), revert `BookingForm`/`StatusBadge`/
  dashboard/rooms/detail pages, restore `config`-style STATUS mappings, and re-add the
  Phase-8 booking gate (`room.status === AVAILABLE`). The old public BookingForm, the
  non-lazy `lib/env.ts`, and the `migrate deploy` docs can be restored from the repo
  history.
- Delete `docs/phases/phase-10-lifecycle.md`, revert `docs/architecture/*`,
  `docs/PROJECT_STATE.md`, `docs/studies/README.md`, and the ST-001/ST-002 header
  flips if the phase is rolled back.