# Architecture — Reservation Lifecycle (implemented)

> Current truth. Sources: `services/reservation/reservation.service.ts`,
> `repositories/reservation/prisma.repository.ts`, `app/api/reservations/*`,
> `domain/reservation/enums.ts`, `lib/status.ts`.

## Implemented statuses

```
NEW ──────► CONFIRMED ──► CHECKED_IN ──► CHECKED_OUT (terminal)
  │            │
  └────────────┴────────► CANCELLED (terminal)
```

| From | Allowed transitions |
|---|---|
| NEW | CONFIRMED, CANCELLED |
| CONFIRMED | CHECKED_IN, CANCELLED |
| CHECKED_IN | CHECKED_OUT |
| CHECKED_OUT | — |
| CANCELLED | — |

- **NEW** — created by `POST /api/reservations`. Created stays carry `roomId` but never
  change the room row.
- **CONFIRMED** — reached only via `transitionReservation` with `{status: "CONFIRMED"}`;
  gate: room not under MAINTENANCE **and** no conflicting active reservation
  (`isConfirmable`). Physical `AVAILABLE` is not required (ST-001 decision 1).
- **CHECKED_IN** — arrival date must be ≤ today, the room must be physically
  `AVAILABLE`, and no conflicting reservation may overlap the period; on success the
  room becomes **OCCUPIED**.
- **CHECKED_OUT** — legal only from CHECKED_IN; on success the room becomes
  **CLEANING**. No arrival/availability gate.
- **CANCELLED** — terminal. CANCELLED stays never block a room
  (`CONFLICTING_RESERVATION_STATUSES` = NEW/CONFIRMED/CHECKED_IN).

> The edge table is the single source `RESERVATION_TRANSITIONS` in `lib/status.ts`;
> the transition label keys live next to it (`transitionLabelKey`).

## Transition path

Every status change goes through **one** method
(`reservationService.transitionReservation(id, status)`), inside a transaction that
first re-reads and row-locks the room (`SELECT ... FOR UPDATE`), then validates the
edge, applies the target gate, and performs the room side effect. `PATCH
/api/reservations/[id]` with `{status}` is the only mutating reservation endpoint
besides create/delete.

Transactional-contention errors (Prisma P2028/P2034 — e.g. many concurrent bookings
saturating the transaction pool) are converted to `ReservationConflictError` so the
guest always receives a clean 400 rather than a 500; the room lock guarantees only one
resolution wins.

## Stats (`GET /api/admin/stats`)

`AdminStats`: 5 room counters (`totalRooms`, `availableRooms`, `occupiedRooms`,
`cleaningRooms`, `maintenanceRooms`), 3 reservation counters (`reservedUpcoming`,
`todayArrivals`, `todayDepartures`), and `currentGuests[]` (`guestName`, `roomNumber`,
`arrivalDate`, `departureDate`) derived from CHECKED_IN reservations.

## Remaining known gaps (carried — do not fix ad hoc)

- CANCELLED/expired stays are never auto-freed beyond what the offer rule implies
  (they block nothing by status predicate; housekeeping/early check-in/hold-expiry is a
  future item).
- No rate limiting / spam protection on guest booking (see `docs/PROJECT_STATE.md` §6).