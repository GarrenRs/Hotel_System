# Architecture — Domain Model (implemented)

> Current truth. Sources: `prisma/schema.prisma`, `domain/room/enums.ts`,
> `domain/reservation/enums.ts`, `domain/{room,reservation}/types.ts`, `lib/status.ts`.

## Persistence (`prisma/schema.prisma`)

```prisma
model Room {
  id           String        @id @default(uuid())
  roomNumber   String        @unique
  roomType     String
  status       String        @default("AVAILABLE") // AVAILABLE | OCCUPIED | CLEANING | MAINTENANCE
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  reservations Reservation[]
}

model Reservation {
  id            String    @id @default(uuid())
  reservationId String    @unique          // human-facing ref, e.g. NP-2026-1234
  customerName  String
  phone         String
  email         String
  arrivalDate   String                      // ISO date (YYYY-MM-DD)
  departureDate String                      // ISO date (YYYY-MM-DD)
  guests        Int
  roomType      String                      // booked room type (historical snapshot)
  status        String    @default("NEW")   // NEW | CONFIRMED | CHECKED_IN | CHECKED_OUT | CANCELLED
  notes         String?
  roomId        String?                     // FK → Room (onDelete: SetNull)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  room          Room?     @relation(fields: [roomId], references: [id], onDelete: SetNull)
}
```

- `roomNumber` is **unique** (ST-001 §B). `@id` remains the internal UUID;
  `reservationId` the unique human-facing booking reference.
- `status` fields are plain `String` columns; enum membership and transition legality
  are enforced in the TS layer (`lib/status.ts` edge tables), not by the database.
- `Reservation.roomType` is a **snapshot** of what the guest booked, kept even if the
  room's type later changes.

## Domain enums

| Enum | Values | Location |
|---|---|---|
| `ReservationStatus` | `NEW`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED` | `domain/reservation/enums.ts` |
| `RoomStatus` | `AVAILABLE`, `OCCUPIED`, `CLEANING`, `MAINTENANCE` | `domain/room/enums.ts` |
| `RoomType` | `DELUXE_SUITE`, `EXECUTIVE_SUITE`, `ROYAL_SUITE`, `STANDARD_DOUBLE`, `FAMILY_SUITE` | `domain/reservation/enums.ts` |

`lib/status.ts` is the single source of truth for the display config of each status
(`*_STATUS_UI`), the legal transition tables (`RESERVATION_TRANSITIONS`,
`ROOM_TRANSITIONS`), and their i18n keys — domain enums on their own carry no
presentation or transition data. Unknown status values have explicit handling.

## Layering (binding)

```
domain/        → types, enums, entities (pure, no I/O)
repositories/  → Prisma data access (one file per aggregate; tx-aware writes, row locks)
services/      → business logic (offer rule, conflict checks, ID allocation, transitions)
app/api/       → HTTP routes (parse/validate, call service, wrap in ApiResponse<T>)
```

Every API response uses `ApiResponse<T>`: `{ success, message, data, errors? }`. All
business-level failures are mapped to i18n keys by `lib/api-errors.ts`.

## What does NOT exist

- No `Stay`, `Guest`, or `RoomType` tables/entities (single `Room` + `Reservation`);
  no dedicated availability/capacity table (capacity lives in `ROOM_TYPES_LIST`).
- No multi-user roles, payments, or notifications.