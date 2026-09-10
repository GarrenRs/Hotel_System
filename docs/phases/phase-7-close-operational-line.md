> **Type:** Implementation Phase | **ID:** Phase 7 | **Status:** CLOSED | **Based On:** audits/ (all three) | **Superseded By:** —

# Phase 7 — Close the First Operational Line (Guest ↔ Front-Desk Employee)

Closes the first real operating loop of the demo: a guest books through the public site, and a front-desk employee confirms/manages it in the admin panel — every step now behaving correctly, visibly, and securely. Seven ordered tasks, all drawn from the three audit reports in `docs/audits/`.

## What Changed

### Task 1 — Enforce real admin authentication (critical)
The admin token `hotel_demo_admin_token` (JWT, HS256, 1-day) was issued at login and deleted at logout but **never verified** — every admin page/API authorized only on the public `demo_session_id` cookie, so any visitor could hit admin endpoints.

- **`lib/session.ts`** — added shared `ADMIN_TOKEN_COOKIE = 'hotel_demo_admin_token'` (imported by both the middleware and the API helper; the file stays Edge-safe).
- **`lib/admin-auth.ts`** (new, Node runtime) — `isAdminAuthenticated(request)` verifies the cookie via `jwt.verify(token, env.JWT_SECRET)`; `requireAdminAuth(request)` returns a `401` `ApiResponse` when missing/invalid.
- **`middleware.ts`** (Edge runtime) — added a page-level guard that redirects `/admin/*` (except `/admin/login`) → `/admin/login` when the cookie fails an HMAC-SHA256 signature check (`crypto.subtle`) **and** the `exp` claim check, giving parity with `jsonwebtoken`. The pre-existing `demo_session_id` seeding logic is untouched. No Node-only imports (`jsonwebtoken`, `lib/env`) were introduced into the middleware.
- **API routes now require the admin token** (via `requireAdminAuth`): `GET /api/admin/stats`, `GET /api/reservations`, all of `GET/PATCH/DELETE /api/reservations/[id]`, `PATCH /api/rooms/[id]`.
- **Still public** (unchanged, `demo_session_id` only): `POST /api/reservations`, `GET /api/rooms`, `POST /api/admin/login`, `POST /api/admin/logout`.
- Login flow, on-screen demo-credentials box, and JWT issuance were **not changed**.

### Task 2 — CANCELLED reservations no longer block bookings
- **`repositories/reservation/prisma.repository.ts`** — `hasConflictingReservation` now adds `status: { not: ReservationStatus.CANCELLED }`, so a cancelled stay can no longer conflict with a new or confirming booking. PENDING/CONFIRMED still conflict.

### Task 3 — Dead `?room=` query parameter now preselects
`RoomCard` links `/contact?room={roomKey}#booking`, but nothing ever read the param, so the form always defaulted to Deluxe Suite.

- **`components/reservation/BookingForm.tsx`** — accepts optional `initialRoomType?`; a valid value becomes the default room-type (state + `useForm` `defaultValues`); otherwise falls back to `ROOM_TYPES_LIST[0].id` (Deluxe Suite, unchanged default).
- **`app/(public)/contact/page.tsx`** — extracted a client child `ContactBookingForm` that calls `useSearchParams`, maps the `room` key → id via `ROOM_TYPES_LIST`, and is wrapped in a `<Suspense>` fallback (build-safe for `useSearchParams`). An unknown/invalid key falls back to the default type.

### Task 4 — Status-PATCH failures are now visible
A failed status change on the admin panel was previously only `console.error`-logged; the UI stayed silent while the status did not change.

- **`app/admin/(protected)/reservations/page.tsx`** and **`.../reservations/[id]/page.tsx`** — new `statusError` state + a rose `AlertCircle` banner (mirroring the existing rooms-page pattern) rendered when a PATCH fails. A response of `Room is not available for the selected dates.` shows the conflict message; any other failure shows the generic one.
- **`messages/{ar,fr}/admin.json`** — new `admin.errors.updateFailed` and `admin.errors.confirmConflict`.

### Task 5 — Correct booking confirmation copy + visible room-fetch error
- Booking success screen was using `contact.successMessage` ("message sent"), the contact-form wording. **`BookingForm.tsx`** now shows the new localized **`contact.bookingConfirmedMessage`** (ar: "تم استلام طلب حجزكم بنجاح، سيتواصل معكم فريق الاستقبال لتأكيد التفاصيل في أقرب وقت." / fr: "Votre demande de réservation a bien été reçue. Notre équipe de réception vous contactera pour confirmer les détails."). The old key is left in place (user confirmed it only had this one usage; keeping the key avoids breaking any future contact-form reuse).
- When the room list fails to load (after retries), the disabled `...` select previously had zero explanation. **`BookingForm.tsx`** now shows a rose `AlertCircle` banner with the localized **`errors.roomsLoadFailed`** (ar/fr), distinct from the amber "no available rooms" empty state.

### Task 6 — Gallery captions accurate and localized
Three of six gallery captions were mismatched (e.g. a breakfast photo labeled "Fitness Center", the twin-room photo labeled "Royal Suite Living Room"), all hardcoded in English.

- **`components/hotel/GalleryGrid.tsx`** — the hardcoded `title` strings were replaced with `titleKey` values resolved through `t()` (`useLanguage`).
- **`messages/{ar,fr}/common.json`** — new `common.gallery.caption*` keys matching each image (lobby, twin room, restaurant dining, pool, breakfast, conference room).

### Task 7 — No more "HB" in public images' alt text
`restaurant/page.tsx`, `pool/page.tsx`, `gym/page.tsx`, `wedding/page.tsx` used alt texts like `"Restaurant HB"` — stale initials of the original real hotel.

- All four now import `HOTEL` from `@/config/hotel` and use `${HOTEL.name}`-driven alts (e.g. `${HOTEL.name} Restaurant`).

### Out-of-scope observations logged
Additional findings (message-key label reuse, `...` empty states, refresh button labeled "Save changes", etc.) were recorded in `docs/archive/notes-journal.md` under "Observed but out of scope" — not fixed here.

## Why

- **Task 1** — the audit's single most serious gap (`docs/audits/admin-panel.md`, `docs/audits/external-internal-balance.md`): without enforcement, "admin" meant nothing, so the employee half of the operational line was trusting a public cookie. Task 1 makes the demo behave like the real product while leaving the friction-free demo login intact.
- **Task 2** — a cancelled stay blocking the same room (or double-cancelling to free it up) was a false conflict and a dead end at the front desk.
- **Task 3** — the "Reserve" paths on room cards silently ignored the chosen room, so the public flow could hand the front desk the wrong room type.
- **Task 4** — a failed confirm with no feedback is the #1 confusing moment for a demoing prospect's staff; the banner mirrors the already-established rooms-page pattern.
- **Task 5/6** — wrong copy ("message sent") and wrong captions break the "real operating hotel" illusion the template must project.
- **Task 7** — stale "HB" alt text leaks the original client's initials, undone by Phase 6's genericization.

## How to Verify

Dev env: `npm run dev` with `ADMIN_USERNAME=admin`, `ADMIN_PASSWORD=hotelhb2026password`, `JWT_SECRET=...`, `CRON_SECRET=...` shell-injected. All checks below run against a single seed; admin calls use the `hotel_demo_admin_token` cookie.

1. **Auth (Task 1).**
   - With only `demo_session_id`: `GET /admin/dashboard` → **307 → `/admin/login`**; `GET /api/admin/stats` → **401**; `GET /api/reservations` → **401**; `GET/PATCH/DELETE /api/reservations/{id}` → **401**; `PATCH /api/rooms/{id}` → **401**; `GET /api/rooms` → **200**; `POST /api/reservations` → **201** (still public).
   - `POST /api/admin/login` → 200 + sets `hotel_demo_admin_token`; then `/admin/dashboard`, `/api/admin/stats`, `/api/reservations`, `PATCH /api/rooms/{id}` → **200**.
2. **Conflict logic (Task 2).** Public `POST /api/reservations` overlapping a seeded **CANCELLED** stay on room 202 → **201** (was 400); overlapping the seeded **CONFIRMED** stay on room 501 → **400** `Room is not available for the selected dates.`; `PATCH` a reservation → `CONFIRMED` while a PENDING/CONFIRMED overlap exists → **400**.
3. **Preselect (Task 3).** `/contact?room=` with each key in `ROOM_TYPES_LIST` (`deluxeSuite`, `executiveSuite`, `royalSuite`, `standardDouble`, `familySuite`) and an unknown key all → **200**; the room-type field defaults to the param value (valid) or Deluxe Suite (invalid/missing). Preselection is client-side.
4. **Banner (Task 4).** Trigger a failing confirm (see 2) in `/admin/reservations` and `/admin/reservations/{id}` → the rose banner shows the localized `admin.errors.confirmConflict`; a different failure shows `admin.errors.updateFailed`. Both pages render **200**.
5. **Booking copy (Task 5).** Public `POST /api/reservations` → **201** with `NP-2026-XXXX`; the success card now reads the booking-confirmed text, not "message sent". On a forced `/api/rooms` failure, the select area shows the localized `errors.roomsLoadFailed` banner (distinct from the amber empty state).
6. **Captions (Task 6).** Both `messages/{ar,fr}/common.json` parse as valid JSON; `/gallery` → **200**; each tile's hover overlay + alt resolve the Arabic/French caption (client-side `t()`).
7. **Alts (Task 7).** `rg -n "HB" "app/(public)"` → **zero matches**; `/restaurant`, `/pool`, `/gym`, `/wedding` → **200**.
8. **Regression.** Public pages `/`, `/about`, `/rooms`, `/restaurant`, `/pool`, `/gym`, `/wedding`, `/gallery`, `/contact` → **200**. Admin pages `/admin/dashboard`, `/admin/reservations`, `/admin/rooms`, `/admin/settings` → **200** with token. **Phase 3 session isolation**: a booking created in a fresh session (e.g. `NP-2026-6248`) is **absent** from another session's `/api/reservations`. **Phase 5 logic**: overlap checks behave as in 2.
9. `npx tsc --noEmit` → **exit 0**. `npm run lint` → **0 errors** (7 pre-existing warnings: about/Star & HeartHandshake, restaurant/Wine & Sparkles, reservations/StatusBadge + exhaustive-deps, settings/KeyRound — none introduced here).

## Environment variables added or changed

- **None.** `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, `DATABASE_URL`, `CRON_SECRET` unchanged. Values remain shell-injected at dev-server start (`.env.local` holds only `DATABASE_URL`).

## Rollback

- Task 1: remove `lib/admin-auth.ts`; drop the `ADMIN_TOKEN_COOKIE` export in `lib/session.ts`; revert `middleware.ts` to the session-seeding-only version; remove the `requireAdminAuth` guard and its import from the four API routes.
- Task 2: delete `status: { not: ReservationStatus.CANCELLED }` from `hasConflictingReservation`.
- Task 3: revert `BookingForm` to no props / `ROOM_TYPES_LIST[0]` default; restore the plain `<BookingForm />` in the contact page (drop the child component, `useSearchParams`, `Suspense`).
- Task 4: remove the `statusError` banner blocks + state from both reservations pages; drop `admin.errors.*` keys from `messages/{ar,fr}/admin.json`.
- Task 5: restore `contact.successMessage` in `BookingForm`; drop `contact.bookingConfirmedMessage` and `errors.roomsLoadFailed` keys.
- Task 6: restore the hardcoded English `title` array in `GalleryGrid.tsx`; drop `common.gallery.caption*` keys from both `common.json`.
- Task 7: restore the `... HB` alt literals and remove the `HOTEL` imports in the four subpages.