# Phase 1 — Database Foundation (Postgres + Room model + conflict logic)

## What changed

- `prisma/schema.prisma` — datasource provider switched from `sqlite` to `postgresql`; added `Room` model (id, roomNumber, roomType, status defaulting to `AVAILABLE`, sessionId, timestamps, `@@index([sessionId])`, relation to reservations); `Reservation` gained nullable `roomId` (relation to `Room` with `onDelete: SetNull`), required `sessionId`, and `@@index([sessionId])`. All pre-existing `Reservation` fields untouched.
- `domain/room/enums.ts` — new `RoomStatus` enum (`AVAILABLE | OCCUPIED | CLEANING | MAINTENANCE`), mirroring `domain/reservation/enums.ts`.
- `domain/room/entities.ts` — new `RoomEntity` interface.
- `domain/room/types.ts` — new `CreateRoomInput`, `UpdateRoomStatusInput`, `RoomFilterInput`, `RoomStats`; re-exports the shared `ApiResponse<T>`.
- `repositories/room/interface.ts`, `repositories/room/prisma.repository.ts`, `repositories/room/index.ts` — new repository layer mirroring `repositories/reservation/`.
- `services/room/room.service.ts` — new `RoomService` mirroring `services/reservation/reservation.service.ts`.
- `domain/reservation/entities.ts` — `ReservationEntity` now includes optional `roomId` and required `sessionId`.
- `domain/reservation/types.ts` — `CreateReservationInput` now includes optional `roomId` and `sessionId`.
- `repositories/reservation/interface.ts` — added `hasConflictingReservation(input)` contract to `IReservationRepository`.
- `repositories/reservation/prisma.repository.ts` — `create()` writes `roomId`/`sessionId` when provided; implemented `hasConflictingReservation()` (overlap query `arrivalDate < existing.departureDate AND departureDate > existing.arrivalDate`, scoped by `roomId`, optional `sessionId`, optional self-exclusion).
- `services/reservation/reservation.service.ts` — added `ReservationConflictError`; `createReservation()` runs the conflict check whenever a `roomId` is provided; `updateReservationStatus()` re-checks for conflicts (excluding the reservation itself) before moving a status to `CONFIRMED`.
- `app/api/reservations/route.ts`, `app/api/reservations/[id]/route.ts` — catch `ReservationConflictError` and return a 400 `ApiResponse` (success false + errors array) instead of an unhandled 500.
- `prisma/dev.db` — deleted (SQLite database removed from the repo).
- `.gitignore` — added `*.db`.
- `.env.example` — `DATABASE_URL` replaced with a Supabase Postgres placeholder connection string.

## Why

SQLite cannot support the isolated demo sessions planned for later phases, and reservations previously carried no room identity or booking-conflict prevention. This phase introduces a real Postgres-backed `Room` entity, wires reservations to rooms and sessions, and enforces double-booking prevention at the data layer so overlapping stays for the same room are impossible regardless of which code path calls the repository.

## How to verify

1. Schema validity (done, no DB needed):
   - `npx prisma validate` — reports `The schema is valid`.
   - `npx prisma generate` — regenerates the client for the new models.
2. Apply against a real Postgres/Supabase instance (requires real credentials — cannot be executed locally in this repo):
   - `npx prisma migrate dev --name add_room_and_session` (or `npx prisma db push`) then `npx prisma migrate deploy` for the pooler.
3. Conflict-prevention runtime check (needs a live DB):
   - POST two reservations to `app/api/reservations` with the same `roomId` and overlapping dates → the second request returns HTTP `400` with `{ success: false }` and the conflict message in `errors`, not a 500.
   - PATCH a reservation with an overlapping room/dates to `CONFIRMED` → HTTP `400` with the same response shape.
4. Type/lint check (done):
   - Phase 1 files pass `tsc --noEmit` and `eslint` (0 new errors). The full app cannot yet be typechecked because the repo has no `tsconfig.json` — pre-existing, see `docs/notes.md`.

## Environment variables added/changed

- `DATABASE_URL` — now expected in Postgres format, e.g. a Supabase pooled string:
  `postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`

## Rollback

- Restore the previous `prisma/schema.prisma` (SQLite provider, `Reservation` only) and point `DATABASE_URL` back to `file:./dev.db`.
- Delete the new layers: `domain/room/`, `repositories/room/`, `services/room/`.
- Revert to pre-phase content: `domain/reservation/{entities,types}.ts`, `repositories/reservation/{interface,prisma.repository}.ts`, `services/reservation/reservation.service.ts`, `app/api/reservations/route.ts`, `app/api/reservations/[id]/route.ts`.
- Remove `*.db` from `.gitignore`.
- Re-create `prisma/dev.db` if needed (e.g. `npx prisma db push && npx prisma db seed`).