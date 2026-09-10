# Architecture — Current Truth

> **This folder describes the system as it is implemented and running TODAY.**
> It is NOT a roadmap or a proposal. Unimplemented designs live in `docs/studies/`
> and are promoted here only after they are implemented and verified (ST-001 and
> ST-002 were promoted here by Phase 10).

Sources: `phases/` (implementation history), `prisma/schema.prisma`,
`domain/`, `repositories/`, `services/`, `app/api/`, `middleware.ts`.

## Index

| Doc | Contents |
|---|---|
| `domain-model.md` | Prisma models, enums, layering |
| `reservation-lifecycle.md` | Implemented reservation statuses + transitions |
| `security-model.md` | Environment validation, JWT admin, public/admin split |
| `availability-and-booking.md` | Booking flow, availability checks, reservation-ID allocation |

## Key implemented decisions (do not re-litigate)

- **Single-tenant, one shared dataset.** No per-visitor isolation, no auto-reset,
  no auto-seeding, no demo layer (removed in Phase 8).
- **Real `Room` entity** — a booking references a specific room row. `roomNumber`,
  `roomType`, and a physical `status` are stored per room.
- **Admin is JWT-gated; guest flow is cookie-free and public.**
- **5-state reservation lifecycle, single authoritative transition path**
  (`transitionReservation`), reservation-driven room states (OCCUPIED/CLEANING).
- **Transactional booking with a row lock** (`SELECT ... FOR UPDATE`) — concurrent
  double-booking is impossible; contention surfaces as a clean 400.
- **Postgres only.** SQLite was removed in Phase 1; do not reintroduce it.
- **`ApiResponse<T>` envelope** on every API route: `{ success, message, data, errors? }`.
- **Periods are ISO date strings** (`arrivalDate`/`departureDate`), compared
  lexicographically for overlap.

## Boundary with studies

Anything marked "target / planned / would change the system" belongs to a study, not here.
ST-001 and ST-002 (reservation/room lifecycle + customer journey) were implemented in
Phase 10 and are current truth now; any future lifecycle design must start as a new study.