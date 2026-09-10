# Architecture — Booking Flow & Availability (implemented)

> Current truth. Sources: `services/availability.ts`, `services/room/room.service.ts`,
> `services/reservation/reservation.service.ts`, `app/api/rooms/available/route.ts`,
> `app/api/reservations/route.ts`, `components/reservation/BookingForm.tsx`.

## The shared offer rule (`services/availability.ts`)

A single predicate `isOfferableForPeriod(room, arrivalDate, departureDate, today, conflicts)`
is the one source for “may this room be sold for this period”. In order:

1. Physical status must not be **MAINTENANCE**.
2. No **active** reservation overlaps the period — active = NEW/CONFIRMED/CHECKED_IN
   (`CONFLICTING_RESERVATION_STATUSES`); CANCELLED and CHECKED_OUT never block.
3. Either the arrival is in the **future** (`arrivalDate > today`), **or** the room is
   physically **AVAILABLE**.
   - Consequence: a room that is OCCUPIED/CLEANING *today* is not sold for a same-day
     start, but *is* sellable for a future start (ST-001 decision 1 / §E).

It is consumed by `GET /api/rooms/available`, the guest booking form, and re-checked
inside the booking transaction. The UI offer is advisory; the write path is
authoritative.

## Public availability endpoint

`GET /api/rooms/available?arrival=&departure=&roomType=` — public, no cookie. Returns
exactly the rooms passable by the offer rule for the requested period. Input is
validated as ISO dates (`YYYY-MM-DD`), with `departure > arrival` required; failures
return 400 with keys `validation.invalidDateFormat` / `validation.departureAfterArrival`.

## Booking form (client)

`BookingForm` is **date-aware**: when arrival / departure / room-type change it queries
`/api/rooms/available` and lists only sellable rooms; the guest-count input is clamped
to the room-type capacity once a room is chosen; choosing a different room type clears
the selected room. The submit succeeds with a confirmation screen showing the booking
reference (`reservationId`), room number, dates, and guests, with “copy reference” and
“book another room” actions.

## Creation flow — `POST /api/reservations` (public)

1. Body validated against the zod schema (400 + keyed errors otherwise).
2. `reservationService.createReservation` runs a **transaction**:
   - room must exist and its `roomType` must equal the requested room type (`RoomTypeMismatchError`);
   - `guests` must not exceed the room type's capacity from `ROOM_TYPES_LIST` (`CapacityExceededError`);
   - the room row is locked (`SELECT ... FOR UPDATE`, `lockRoomById`);
   - the offer rule is re-checked with a fresh, lock-protected conflict query;
   - on conflict → `ReservationConflictError` → 400 `errors.roomNotAvailable`.
3. `reservationId` `NP-2026-####` is allocated (pre-check + P2002 retry, max 5).
4. Insert with `status: NEW`. → 201.

Concurrent submissions for the same room/period are serialized by the row lock: exactly
one succeeds; the rest get a clean 400 (including contention timeouts P2028/P2034
mapped to the conflict error). No double-booking is possible.

## Room operational status (`PATCH /api/rooms/[id]`, admin)

The only manual room mutations are the operational edges from `ROOM_TRANSITIONS`:
`AVAILABLE→MAINTENANCE`, `CLEANING→AVAILABLE`, `CLEANING→MAINTENANCE`,
`MAINTENANCE→AVAILABLE`. **OCCUPIED is never admin-toggled** — it follows
CHECKED_IN/CHECKED_OUT. Transitions run in a transaction under the row lock; invalid
status values and illegal edges → 400 (`admin.errors.invalidRoomStatus` /
`admin.errors.invalidRoomTransition`). Setting MAINTENANCE returns the affected
CONFIRMED reservations as `warnings` (`{reservationId, customerName, arrivalDate,
departureDate}`); nothing is auto-cancelled.

## Known risks (carried, do not fix ad hoc)

- No rate limiting / spam protection on `POST /api/reservations`.
- Single-threaded front desk model: no walk-in booking, no admin room CRUD UI.
- `MAINTENANCE` warnings are advisory only (front-desk must rebook/rehouse the guests
  manually).