> **Type:** Implementation Phase | **ID:** Phase 5 | **Status:** CLOSED | **Based On:** Phase 1 (Room model) | **Superseded By:** —

# Phase 5 — Room Management UI

## What changed

- **`app/api/rooms/route.ts` (new)** — `GET /api/rooms`: session-scoped room list (401 `"Session required."` without a `demo_session_id` cookie), with optional `?status=`, `?roomType=`, `?searchQuery=` filters, wrapped in the standard `ApiResponse<T>` shape. 500 fallback `"Failed to fetch rooms."` on unexpected errors.
- **`app/api/rooms/[id]/route.ts` (new)** — `PATCH /api/rooms/:id`: updates a room's status in the caller's session. Missing `status` → 400 `"Status parameter is required."`; invalid enum → 500 `"Invalid status: <value>"` (service-level validation); a `roomId` that does not belong to the session → 500 `"Room not found"`. Success → 200 `"Room status updated successfully."`. This is the endpoint behind the admin rooms grid's inline status buttons.
- **`app/api/reservations/route.ts`** — `POST /api/reservations` now resolves the previously-free `roomId` field:
  1. `roomService.getRoomById(sessionId, roomId)` → 400 `"Selected room not found."` if the room does not exist in this session.
  2. Room `roomType` must equal the requested `roomType` → 400 `"Selected room does not match the requested room type."`.
  3. Room `status` must be `AVAILABLE` → 400 `"Selected room is not currently available."`.
  4. Only then `createReservation` runs the Phase 1 `hasConflictingReservation` date-range check → 400 `"Room is not available for the selected dates."` on overlap.
- **`lib/validations/reservation.schema.ts`** — added required `roomId: z.string().min(1, { message: 'validation.roomIdRequired' })` to `reservationFormSchema`.
- **`lib/constants.ts`** — added `ROOM_STATUS_CONFIG` (mirrors `STATUS_CONFIG` shape: `labelKey` / `color` / `badgeBg` / `badgeText` / `icon`; AVAILABLE emerald, OCCUPIED blue, CLEANING amber, MAINTENANCE rose). `RoomStatus` already existed from Phase 1.
- **`app/admin/(protected)/rooms/page.tsx` (new)** — grid of room cards (room number, localized room-type title, color-coded status badge), per-status count chips (filter-style), and a bounded retry bootstrap (`BOOT_RETRY_ATTEMPTS=4`, 1200 ms) mirroring the reservations page. Clicking a card reveals an inline status-button group; status changes PATCH optimistically with `previousStatus` rollback on failure plus an error banner.
- **`app/admin/(protected)/layout.tsx`** — added nav entry `{ href: '/admin/rooms', label: t('admin.rooms'), icon: DoorOpen }` between reservations and settings.
- **`app/admin/(protected)/dashboard/page.tsx`** — additive occupancy card below the existing stats grid: dedicated `useEffect` fetches `/api/rooms`, counts `OCCUPIED`, renders `occupied / total`. Existing bootstrap preserved as-is.
- **`components/reservation/BookingForm.tsx`** — room selector listing only AVAILABLE rooms of the chosen type (live-fetched from `/api/rooms`). Bounded poller (5 attempts × 800 ms) hoisted as `async function poll()` inside `useEffect` keyed on `[selectedRoomType, refreshKey]` (keeps the React Compiler lint clean). `roomType` changes are tracked via `register('roomType', { onChange })` + local state (no `watch` — the installed react-hook-form version trips an incompatible-library lint). After a successful submit: `reset({ roomType, guests: 2, roomId: '' })` + `setRefreshKey(k => k + 1)` to refetch availability. Typed error handling (`err instanceof Error`).
- **Translations** (`messages/ar/*.json`, `messages/fr/*.json`): `admin.rooms`, `admin.roomsSubtitle`, `admin.occupancy`, `admin.occupancySubtitle`, `admin.roomsSection.{room,type,status,changeStatus,selectRoom,noAvailableRooms}`, `common.status.{available,occupied,cleaning,maintenance}`, `validation.roomIdRequired`.

## Why

Phases 1–3 built the first-class `Room` entity + session-scoped room repository/service and exposed reservations over the API, but a visitor could not choose an actual room and an admin could not manage rooms. Phase 5 wires that layer into the product: bookings become real-room bookings with double-booking protection at the `Room`-row level, and staff get a live, per-session room status panel. The dashboard occupancy figure and the rooms grid read the same session-scoped source of truth, so numbers remain consistent per visitor.

## How to verify (done, against the real Supabase demo DB; dev server on port 3000)

Follow the Phase 4 session flow: `GET /` with a fresh cookie (`demo_session_id`), let the background seed finish, then:

- `GET /api/rooms` (with cookie): 13 seeded rooms, exact seed statuses — 101 OCCUPIED, 102/103/104/201/301/303/401/501 AVAILABLE, 203 CLEANING, 302 OCCUPIED, 402 MAINTENANCE. Without a cookie: 401 `"Session required."`.
- `PATCH /api/rooms/:id` `{"status":"CLEANING"}` → 200 `"Room status updated successfully."`; follow-up `GET /api/rooms` shows it persisted (same `id`, `updatedAt` bumped). `{}` → 400 `"Status parameter is required."`. `{"status":"BOGUS"}` → 500 `"Invalid status: BOGUS"`.
- Isolation: a second session's rooms are unaffected by the first session's PATCH (same `roomNumber` shows its own seeded status); PATCHing the first session's room `id` from the second session → 500 `"Room not found"`; POSTing a reservation with the other session's `roomId` → 400 `"Selected room not found."`.
- Booking: POST a reservation for an AVAILABLE room with non-overlapping future dates → 201; an overlapping POST for the same room → 400 `"Room is not available for the selected dates."`; a non-overlapping POST for the same room later → 201 (conflict is date-range-based); POST against an OCCUPIED room → 400 `"Selected room is not currently available."`; a room whose type differs from the requested `roomType` → 400 mismatch; missing `roomId` → 400 `validation.roomIdRequired`; no session cookie → 401.
- Admin pages: `/admin/rooms` and `/admin/dashboard` render with cookie → 200, and their SSR HTML contains the localized headings (`admin.rooms` and subtitle on rooms, `admin.occupancy` + subtitle and the stats cards on dashboard). Occupancy and room-card numbers hydrate client-side from `/api/rooms` (fresh session shows `2 / 13` — 101 + 302 occupied).
- Static checks: `npx tsc --noEmit` exits 0; `npm run lint` introduces **no new** errors/warnings (only the two pre-existing `no-explicit-any` items in `login/page.tsx`). After the BookingForm rewrite the previous `BookingForm.tsx` `any` was also gone.
- Demo DB left at 0 rooms / 0 reservations (`TRUNCATE TABLE "Room" CASCADE;` verified via a Prisma count). Dev server stopped; port 3000 free.

Environment note for this verification run: the C: drive ran completely full mid-run (Turbopack `os error 112` wedged the dev server). Recovered by stopping the server and cleaning throwaway caches (`.next`, `npm cache clean --force`, `%TEMP%`, `node_modules/.cache`) — no source data affected. Dev-server restarts afterwards ran normally.

## Environment variables added or changed

None. Phase 5 uses only the existing `demo_session_id` cookie and existing sessions/rooms infra.

## Rollback

- Remove `app/api/rooms/route.ts`, `app/api/rooms/[id]/route.ts`, and `app/admin/(protected)/rooms/page.tsx`.
- Revert `app/api/reservations/route.ts` POST to its Phase 1 form (no room resolution/validation).
- Revert `lib/validations/reservation.schema.ts` (drop `roomId`), `lib/constants.ts` (drop `ROOM_STATUS_CONFIG`), `app/admin/(protected)/layout.tsx` (drop nav entry), `app/admin/(protected)/dashboard/page.tsx` (drop occupancy card), `components/reservation/BookingForm.tsx`.
- Remove the Phase 5 translation keys from `messages/ar/*.json` and `messages/fr/*.json`.
- No data migration is involved — schema untouched.