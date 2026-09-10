> **Type:** Study | **ID:** ST-001 | **Status:** APPROVED (implemented in Phase 10, pending Phase 10 closure) | **Based On:** docs/audits/ | **Implementation Phase:** Phase 10 (ST-001 + ST-002 lifecycle)

# ST-001 — Reservation / Stay / Room Lifecycle: Design Analysis (no code changes)

> Design-only document. No file was modified while producing this analysis; no implementation happened.
> This document defines the target operating model and the migration plan (section L) to be executed
> only after explicit approval.

## Central decision

The correct model for a small/medium hotel is **three separated layers that never overlap**:

| Layer | Represents | Example |
|---|---|---|
| **Reservation** | Commitment/request for a future stay | "booking for guest Sara, confirmed, will arrive" |
| **Stay (derived, not an entity)** | Physical current occupation of the room | "Sara is staying in 401 right now" |
| **Room** | Physical state of the room (sellable now?) | "401 is dirty, being cleaned" |

A standalone **Stay entity is NOT needed today**: the current occupation is **derivable** — when a
reservation becomes `CHECKED_IN` it IS "the guest currently in the room", and two simultaneous stays
in one room are prevented by the conflict model. A separate entity becomes necessary only for:
walk-ins without a reservation, split billing, or a repeat-guest history file — none in scope today.
Same reasoning for a `Guest` entity: all guest data lives on the reservation; no repeat-customer file.

---

## A. Recommended Domain Model

```
Room ──< Reservation >── Guest (inline on Reservation; no separate entity)
 │
 └── RoomType (content class only: type id + capacity + price + image)
       ─ already exists in lib/constants.ts (ROOM_TYPES_LIST)
       ─ consumed by both the UI and the server (single source; no DB table yet)
```

- `Reservation`: carries `roomId` (the concrete physical room) + dates + guests + guest data + `status`.
- `Room`: carries `roomNumber` + `roomType` + `status` (physical-only, 4 values — see C).
- **No RoomType table, no Stay table, no Guest table in this phase** (reasons in J).
- `Reservation→Room` relation stays as today (`reservation.roomId → Room.id`); we only need to
  strengthen display (room number) and locking (FOR UPDATE).

---

## B. Reservation Lifecycle

**Final states (5 only):** `NEW` → `CONFIRMED` → `CHECKED_IN` → `CHECKED_OUT`, plus `CANCELLED` as a
terminal side path.

**`PENDING` is removed:** there is no distinct action that separates it from `NEW` ("awaiting payment"
= a not-yet-confirmed request). Existing DB rows containing PENDING are migrated `→ NEW`.

| Transition | From | Allowed by rules | Room side-effect | Auto/manual | Reversible |
|---|---|---|---|---|---|
| confirm | NEW → CONFIRMED | re-check availability (room physically `AVAILABLE` and no conflict) | none (the period is only reserved logically) | manual (button) | yes (CONFIRMED→NEW) |
| cancel | NEW or CONFIRMED → CANCELLED | before arrival | none | manual | no (terminal) |
| check-in | CONFIRMED → CHECKED_IN | `arrivalDate <= today`; room physically `AVAILABLE`; no conflict | **Room → `OCCUPIED`** (automatic, in service) | manual (button) | no (exceptional-error path out of scope for v1) |
| check-out | CHECKED_IN → CHECKED_OUT | — | **Room → `CLEANING`** (automatic) | manual (button) | no |
| (forbidden) | CHECKED_IN → CANCELLED, CHECKED_OUT → any, NEW → CHECKED_IN, CANCELLED → CONFIRMED | structural | — | — | — |

**Confirm semantics:** `NEW` blocks the same period (prevents explicit double-booking) but shows as
"proposal/pending"; front desk only gets one **Confirm** button plus a quick cancel.

---

## C. Room Lifecycle

**Decision:** keep `Room.status` as a **single field with 4 physical values**
(`AVAILABLE | OCCUPIED | CLEANING | MAINTENANCE`) — the same values as today; no schema change.
The two-field model (Occupancy vs Operational) was considered and **rejected as redundant**, not wrong:
"reserved / expected arrival" is **derivable** from reservations and shown as a derived badge rather
than a stored state. The two perceived contradictions dissolve because:

- "room sellable **today**" = `Room.status==AVAILABLE` **and** no active reservation overlapping the period;
- `OCCUPIED` is **never set manually**; it is set automatically at check-in and freed automatically at check-out.

| State | Meaning | From | To |
|---|---|---|---|
| AVAILABLE | clean, empty, sellable **now** | CLEANING (mark ready), MAINTENANCE (back to service) | OCCUPIED only via check-in (service), or CLEANING/MAINTENANCE manually |
| OCCUPIED | a guest physically inside | **only check-in (service)** | **only check-out → CLEANING (service)** |
| CLEANING | not sellable until cleaned (covers "needs cleaning" and "being cleaned") | OCCUPIED automatically at check-out, or AVAILABLE manually | AVAILABLE ("mark ready"), MAINTENANCE (exceptional) |
| MAINTENANCE | out of service; **never shown in the booking form** | AVAILABLE/CLEANING manually (never from OCCUPIED) | AVAILABLE ("back to service") |

`RESERVED` = **derived badge for display only** (an `AVAILABLE` room with a future `CONFIRMED`
reservation). Never stored.

---

## D. Source of Truth

| Fact | Source | Stored / derived | Why |
|---|---|---|---|
| Is the room clean, empty, sellable? | `Room.status` | stored | physical fact, not derivable |
| Is a guest currently staying (in-house)? | aggregation of `CHECKED_IN` reservations | **derived** | conflicts are prevented; 1:1 from the reservation |
| Is the room reserved for a future period? | overlapping `NEW/CONFIRMED` reservations | **derived** | never stored on Room — removes the target contradiction |
| Is the room available for [X, Y]? | availability function = (`Room.status == AVAILABLE`) and (no overlapping active reservation) | **derived** | one rule used by both the form and the server |
| Which room belongs to the reservation? | `Reservation.roomId → Room.roomNumber` | stored (key) | display join only |
| Room type | `Reservation.roomType` and `Room.roomType` | stored | kept in sync at creation (validation already exists) |
| Number of guests | `Reservation.guests` | stored | capacity-checked on the server |
| Stay period | `Reservation.arrivalDate/departureDate` | stored | ISO strings, comparable textually under conflict logic |
| Does the room need cleaning? | `Room.status == CLEANING` | stored (set automatically at check-out) | prevents re-selling before cleaning |
| Is the room under maintenance? | `Room.status == MAINTENANCE` | stored | excluded from the form and availability |

Golden rule: **`Room.status` never stores reservation-derived facts** (available/reserved/occupied in
the future) — only the current physical state.

---

## E. Availability Model

- **Single function:** `roomSellableForPeriod(roomId, arrival, departure)` = `room.status == AVAILABLE`
  **and** no `CANCELLED`/`CHECKED_OUT` reservation overlapping (`arrival < r.departure` and
  `r.arrival < departure`). The existing `hasConflictingReservation`
  (`repositories/reservation/prisma.repository.ts`) is reused; extend it to exclude `CHECKED_OUT`
  and support an optional `excludeReservationId`.
- **Where it runs:** in the **service layer** (`reservationService` / `roomService`), a single shared
  function called from: the guest form, confirm, check-in, and reservation creation. **No availability
  logic in the UI.**
- **One new endpoint:** `GET /api/rooms/available?arrival=&departure=&roomType=` (public, for the form)
  returns the rooms that satisfy both conditions. Read-only availability query, not bookings.
- **BookingForm:** re-fetch on date/type change and drop rooms that conflict (today's
  `BookingForm.tsx` filters only `status == AVAILABLE`). On success the server re-validates anyway.
- **Server always validates even with a sound UI:** at creation re-check `room.status == AVAILABLE` +
  conflict + capacity (partially present at `app/api/reservations/route.ts` already).
- **Race conditions:** wrap in `prisma.$transaction` + `SELECT … FOR UPDATE` on the room row inside
  create/confirm/check-in/check-out, with the conflict check executed inside the lock. Postgres
  supports this; an exclusion constraint is not required.
- **Guest-facing display — offerable rule (reconciled):** replaces the earlier blanket statement
  "a `MAINTENANCE` room is never offered; `CLEANING` is never offered for any period; `OCCUPIED`
  is never offered" — the `OCCUPIED` clause contradicted Final Review decision 1. The single
  authoritative rule is now:

  ```
  offerableForPeriod(room, [arrival, departure)) =
        room.status != MAINTENANCE
    AND no active reservation overlapping [arrival, departure)   // incl. NEW + CONFIRMED; excl. CANCELLED, CHECKED_OUT
    AND ( arrival > today OR room.status == AVAILABLE )          // arriving today requires clean & empty NOW
  ```

  Thus a currently `OCCUPIED`/`CLEANING` room may still be offered for a **future** non-conflicting
  period (consistent with Final Review decision 1), while a **same-day** arrival still requires the
  room to be `AVAILABLE` now. The "reserved for 2 days, available before and after" scenario requires
  no manual room-state change — the derived model covers it automatically.

---

## F. Front Desk Workflow

1. **New booking arrives:** shown as `NEW` in the list → press **Confirm** (single contextual button)
   → becomes `CONFIRMED`. Open details only when needed.
2. **Guest arrives:** find the `CONFIRMED` row → press **Check-in** → becomes `CHECKED_IN` and the
   room becomes `OCCUPIED` automatically.
3. **Guest leaves:** press **Check-out** on the `CHECKED_IN` row → becomes `CHECKED_OUT` and the room
   `CLEANING`.
4. **Cleaning (Rooms page):** the room shows `Cleaning` → press **Mark ready** → `AVAILABLE`.
5. **Fault:** press **Maintenance** in Rooms (not allowed on an `OCCUPIED` room); after repair
   **Back to service**.
6. **Cancellation:** NEW/CONFIRMED → **Cancel** button on the row (with confirmation).

**No duplication:** check-in/check-out/confirm/cancel live **only** in Reservations;
mark-ready/maintenance live **only** in Rooms.

---

## G. Page Responsibilities

| Page | The only actions | Read-only |
|---|---|---|
| BookingForm (public) | create a request only. Shows capacity per type, validates `guests`, shows rooms available for the chosen dates | — |
| Reservations List | **Confirm / Check-in / Check-out / Cancel** (one contextual button per state) + view + search/filters | room number, guest, dates, status (add room number instead of only type — join via `roomId`) |
| Reservation Details | the same single contextual button + Cancel + Delete | full details |
| Rooms | **Mark ready / Maintenance / Back to service** only | room number, type, status, **current guest + departure date** when `OCCUPIED` (derived from `CHECKED_IN`, read-only) |
| Dashboard | no actions | metrics in K |
| Rooms admin | replaced by restricted operational-state toggles (no manual `OCCUPIED`, no `AVAILABLE` while occupied) | — |

**Rooms never reimplements Reservations actions** and the reverse holds: check-out is triggered from
the reservation (it belongs to the guest), and its physical consequence (cleaning) shows up in Rooms
automatically.

---

## H. Minimal Actions

| Operation | Where | Who | Clicks | Automatic side-effects |
|---|---|---|---|---|
| Booking arrives | — | automatic (guest form) | 0 | NEW row |
| Confirm | Reservations | front desk | 1 | status → CONFIRMED (conflict re-checked) |
| Check-in | Reservations | front desk | 1 | status → CHECKED_IN + **Room → OCCUPIED** |
| Check-out | Reservations | front desk | 1 | status → CHECKED_OUT + **Room → CLEANING** |
| Mark ready | Rooms | housekeeping | 1 | Room → AVAILABLE |
| Maintenance / Back | Rooms | management | 1 | Room → MAINTENANCE / AVAILABLE |
| Cancel | Reservations + Details | front desk | 2 (confirm) | status → CANCELLED |

**7 buttons** fully control the lifecycle. No duplicated contextual buttons, no PENDING, no 5
always-on actions per row.

---

## I. API Design

**Decision:** keep `PATCH /api/reservations/[id]` with payload `{ status }`, backed by a **single
service method** `transitionReservation(id, toStatus)` that enforces the state machine and applies
side-effects inside a transaction. **No 4 separate endpoints** (confirm/check-in/check-out/…): each
transition is a single call behind one button, and separate endpoints multiply routing without any
functional gain (the current pattern must be replaced — see `reservations/page.tsx` which freely
mutates status).

- `POST /api/reservations` (public): create request; enforces validation (capacity, physical
  availability, conflict) with locking.
- `GET /api/rooms/available?arrival&departure&roomType` (public): sellable rooms for the period (form feed).
- `PATCH /api/reservations/[id] {status}` (admin): transition enforcing the table in B inside a transaction + lock.
- `PATCH /api/rooms/[id] {status}` (admin): restricted operational toggle (no manual `OCCUPIED`, no
  `AVAILABLE` while occupied, invalid status → **400** instead of 500 — fixes `rooms/[id]/route.ts`).
- `GET /api/admin/stats` (admin): expanded to feed the Dashboard in K (all derived, computed in the service).

Business rules live **only** in the service layer; React pages are a view model.

---

## J. Database Impact

| Change | Required? | Details |
|---|---|---|
| Status values (drop PENDING) | yes, data update | `UPDATE Reservation SET status='NEW' WHERE status='PENDING'`; status is a String, not a DB enum, so it is a simple row update |
| RoomType / Stay / Guest tables | **no** | deferred to a separate phase; `ROOM_TYPES_LIST` suffices and becomes a shared server source for capacity |
| `Room.roomNumber @unique` | optional, recommended | enforces unique room numbers |
| Transactional locking | no schema | in code (`prisma.$transaction` + FOR UPDATE) |
| Show room number | no schema | existing join |
| **No substantial schema change** | — | the new model builds on the current Room/Reservation tables |

---

## K. Dashboard Model

Minimal actionable board for a daily employee (all computed in `GET /api/admin/stats`):

| Metric | Source |
|---|---|
| Available rooms (ready) | `Room.status == AVAILABLE` |
| Occupied (guest staying) | `Room.status == OCCUPIED` (synced with CHECKED_IN) |
| Cleaning / Maintenance | Room counts |
| Reserved upcoming (derived) | rooms with a future `CONFIRMED` reservation |
| Today's arrivals | reservations `CONFIRMED` with `arrivalDate == today` |
| Today's departures | reservations `CHECKED_IN` with `departureDate == today` |
| Current guests | list of `CHECKED_IN` reservations (with room) |

`pendingCount` is removed; every number is computed in the service. No dashboard-only widgets.

---

## L. Migration Plan (to be executed only after approval)

1. **Machine definition:** update `domain/…/enums.ts` (drop PENDING, add CHECKED_IN/CHECKED_OUT) +
   `ReservationStatusTransitionMap` with the legal-transition table.
2. **Data update:** `PENDING→NEW`; update `seed.ts` with realistic CHECKED_IN/CHECKED_OUT samples
   (e.g. "Sara staying now").
3. **Server availability:** add `getAvailableRoomsForPeriod` to services/repositories +
   `GET /api/rooms/available`; update `BookingForm` to consume it with dates.
4. **Service transitions:** with transaction + row lock and side-effects (check-in → OCCUPIED,
   check-out → CLEANING, confirm → re-check).
5. **Admin UI:** one contextual button per state; show the room number; Rooms shows the current guest
   (read-only) and cleaning/maintenance toggles; replace the current free-form status select.
6. **Unified status architecture:** one file `lib/status.ts` = the single source of truth for labels /
   colors / icons + the transition table of each enum, consumed by `StatusBadge`, `constants`, and the
   admin pages (replaces duplicated `STATUS_CONFIG` / `ROOM_STATUS_CONFIG` / `StatusBadge`). Unknown
   status → explicit handling, **not** a silent fallback to NEW (`StatusBadge.tsx` today).
7. **Fix 400** in room PATCH and add capacity checks (guests ≤ capacity from `ROOM_TYPES_LIST`,
   imported server-side).
8. **i18n:** new keys for the statuses, actions, and dashboard labels in Arabic and French.
9. **Verification:** `tsc`, lint, and re-run the `curl` scenarios (create / conflict / confirm /
   check-in / check-out / regression) as done previously.

---

## M. Final Architecture Diagram

```
                 guest (public)                      Room (operational state)
                    │
                    ▼
              BookingForm                          Room.status == AVAILABLE
              (GET /api/rooms/available)           + no active reservation (derived)
                    │ POST
                    ▼
              Reservation  ──►  status: NEW        (roomId saved, no Room change)
                    │  Confirm (front desk, 1 button)
                    ▼
              Reservation: CONFIRMED               no Room change (period derived)
                    │  Check-in (button) →   arrivalDate <= today, room AVAILABLE, no conflict
                    ▼                               ║ Room.status → OCCUPIED (automatic)
              Reservation: CHECKED_IN  ────────────►║ (current guest == this reservation)
                    │  Check-out (button)           ║ Room.status → CLEANING (automatic)
                    ▼
              Reservation: CHECKED_OUT              ║ (not sellable until cleaned)
                    │  Rooms: "Mark ready" (button)
                    ▼                               ▼
                                            Room.status → AVAILABLE
                    │                              │
                    ▼                              ▼
              Availability (derived: AVAILABLE && no conflicting reservation) → sellable again
        CANCELLED: terminal path (NEW/CONFIRMED only), no Room effect
```

**The Reservation↔Room relationship at each stage:** the reservation drives (confirms the period,
sets OCCUPIED, sets CLEANING); the room only provides display state
(AVAILABLE / CLEANING / MAINTENANCE). **Neither stores the other's identity as contradictory data**;
`roomId` is only a query join.

---

## Summary of the core question

The ideal cycle = **5 reservation states** (NEW → CONFIRMED → CHECKED_IN → CHECKED_OUT + CANCELLED)
and **4 physical room states** (AVAILABLE / OCCUPIED / CLEANING / MAINTENANCE, with RESERVED derived)
and **one source of truth per fact** and **7 buttons** distributed to the right place
(guest-related actions in Reservations, operational ones in Rooms), with the service enforcing every
transition inside a transaction plus a room lock. Without Stay, without CRUD, without new screens.

---

## Final Architecture Review outcome (2026-09-08) — verdict: READY, contingent on 5 CHANGE decisions

A full architecture review was performed on this design. The verdict: this architecture is
**READY for implementation** *provided the following five CHANGE decisions are recorded as
part of the design* (they amend the analysis above):

1. **Confirm gate is period-only, not physical-availability.** `CONFIRMED = no conflicting
   reservation in period + room is not MAINTENANCE`. Physical `AVAILABLE` is **not** a
   confirm requirement — a room may already be `OCCUPIED` (earlier stay) and still accept a
   CONFIRMED reservation for a later period. (Fixes the "OCCUPIED room cannot be rebooked"
   scenario in the original analysis.)

   > Mechanics: the `offerableForPeriod` rule that makes this scenario reachable for guests
   > is defined in **§E — Availability Model** (authoritative).
2. **Drop the CONFIRMED → NEW transition.** Once confirmed, a reservation cannot revert to NEW.
3. **MAINTENANCE is non-blocking + warning-only.** Setting a room to MAINTENANCE returns a
   *warning* (list of affected CONFIRMED reservations/periods) but never auto-cancels or
   auto-reassigns anything. No reassignment logic in v1.
4. **Every room-state mutation starts with `SELECT … FOR UPDATE`** on the room row inside
   `prisma.$transaction`. This requires **PostgreSQL** (SQLite silently ignores row locks —
   the SQLite fallback is not acceptable).
5. **`hasConflictingReservation` excludes `CHECKED_OUT` too** (like it already excludes
   `CANCELLED`), so a checked-out stay never blocks the room for a new period.

Additional confirmed bounds (kept from the analysis):
- **NEW = "Option B"** — a NEW reservation holds its period; no expiry/timeout in v1.
- **Capacity validated only at CREATE** (not on every PATCH).
- **`Reservation.roomType` = historical snapshot** of what the guest booked; `Room.roomType`
  = physical truth of the room.

Implementation of ST-001 was **not** authorized as part of this review. See
`docs/PROJECT_STATE.md` §4 for the pending decision.