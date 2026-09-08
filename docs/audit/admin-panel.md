# Audit Report 2 — Admin Panel (Front-Desk Employee Experience)

Scope: `app/admin/**`, `components/admin/*`, the admin-facing API routes, and the auth/session architecture. Each item judged against a single standard: *can one front-desk employee complete real tasks without leaving the panel, guessing, or fighting the UI?*

Classification keys:
- **Keep as-is** — task completeable, no confusion.
- **Needs work** — functional but has a friction/wording/logic problem.
- **Missing entirely** — the task has no way to be done anywhere in the panel.
- **Candidate to remove-simplify** — present but adds little to the single-employee job and risks confusing.

---

## 1. Screen / action inventory

### Auth
- **Login page** `app/admin/(auth)/login/page.tsx` (server) + `components/admin/AdminLoginCard.tsx` (client). Displays the working demo credentials from `lib/demo-access.ts` — which reads straight from `env.ADMIN_USERNAME/ADMIN_PASSWORD` (`lib/demo-access.ts:3-6`) — inside a dashed "Demo access" box, plus a "secure access" line (`AdminLoginCard.tsx:124-147`).
- **Login API** `app/api/admin/login/route.ts`: zod-validates, compares against the two env values (`login/route.ts:25-29`), signs a JWT `{username, role: 'ADMIN'}` with `JWT_SECRET` (`login/route.ts:40`) and sets cookie `hotel_demo_admin_token` (`login/route.ts:49-55`).
- **Logout API** `app/api/admin/logout/route.ts`: deletes the cookie.
- **Auth architecture readiness — the key finding of this report:**

  The admin token is **written but never read**. Searching the codebase for `hotel_demo_admin_token` finds only the `set` in `login/route.ts:49` and the `delete` in `logout/route.ts:11`; there is **no `jwt.verify` or cookie check anywhere** in the application code. Consequences, all verifiable:
  1. `middleware.ts` gates nothing about admin: it only creates the generic `demo_session_id` cookie (`middleware.ts:7-39`) and its matcher excludes only `api/demo/init`, `api/demo/cleanup`, and static assets (`middleware.ts:43-45`). Every `/admin/*` page and every `/api/admin/*` route passes through untouched.
  2. Every API route authorizes purely on the presence of `demo_session_id` (`getDemoSessionId`, `lib/session.ts:5-7`) — e.g. `/api/admin/stats` (`route.ts:9-11`), `/api/reservations` (`route.ts:12-14`), `/api/rooms` (`route.ts:12-14`). That cookie is set automatically by middleware for **any visitor of the public site** (`middleware.ts:13-40`).
  3. Therefore `/admin/login` is cosmetically a credential wall but functionally the entire admin surface is browsable and fully operative for anyone who navigates to `/admin/dashboard`, `/admin/reservations`, `/admin/rooms`, or calls the APIs directly. The "secure access" claim on the login card (`admin.json` `secureAccess`: "لوحة الإدارة • وصول آمن") describes behavior the code does not enforce.
  4. Extensibility to multi-user roles, honestly assessed: the design is a single implicit admin. `lib/env.ts:1-7` hard-codes exactly two credential variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) and a `JWT_SECRET`; `login/route.ts:29` compares one hard-coded pair; the JWT payload carries `role: 'ADMIN'` (`login/route.ts:40`) but no code path ever inspects that role. There is no users table in `prisma/schema.prisma` (demo data is session-scoped rooms/reservations only). Moving to roles would require a user model plus a real verification layer; today the role field is descriptive dead weight.

### Dashboard `app/admin/(protected)/dashboard/page.tsx`
Boot-retry on `/api/admin/stats` + `/api/reservations` + `/api/rooms` (`dashboard/page.tsx:25-96`) to survive the background seed. Shows: 5 status-count cards (total/new/pending/confirmed/cancelled), room occupancy count, and a 5-row recent reservations table with per-row view links. `dashboard/page.tsx:100-249`.
- **Keep as-is.** An employee gets a true, live picture instantly; links go to working screens.
- **Needs work (wording)** — The "Refresh" control has no copy in the heading area; the header's primary action is a label-less arrow button linking to reservations (`dashboard/page.tsx:112-118`) — clear enough.

### Reservations list `app/admin/(protected)/reservations/page.tsx`
Search input + status filter + room-type filter + full table. Per-row: inline status `<select>` that PATCHes immediately (`reservations/page.tsx:256-268` → `handleStatusUpdate` `:101-117`), view link, delete with `confirm()` (`:119-136`).
- **Keep as-is** for task completion: search/filter/status/delete are all performed inside the panel.
- **Needs work** — Empty and loading states both render a literal `...` in the single table row with no explanatory text (`reservations/page.tsx:225-236`) — an employee seeing `...` cannot tell "loading" from "no reservations" from "failed".
- **Needs work** — Status `PATCH` failure is silent: `result.success` is checked but on failure nothing is shown, the row keeps its stale value, and the error is only `console.error`'d (`reservations/page.tsx:107-116`). A rejected status change (e.g. the conflict guard in `services/reservation/reservation.service.ts:91-106`) leaves the employee without feedback.
- **Needs work (wording)** — The page subtitle renders `admin.loginSubtitle` ("Hotel Najma - reserved for management access", `reservations/page.tsx:147`), which belongs on the login card; and the Refresh button is labeled `admin.actions.save` = "Save changes" (`reservations/page.tsx:150-156`), implying a save action for a refresh control.
- Small: `confirm()` uses the browser dialog (`:120`), localized string is fine.

### Reservation detail `app/admin/(protected)/reservations/[id]/page.tsx`
Full customer/phone/email/room/arrival/departure grid, notes block, four status buttons that PATCH on click, delete button, back link. `reservations/[id]/page.tsx:98-234`.
- **Keep as-is.** This is the panel's strongest screen: an employee can triage a booking with one click.
- **Needs work** — Same silent-failure on status PATCH (`:44-57`); loading state is a bare `...` (`:75-81`); the "not found" state is handled properly with `errors.reservationNotFound` (`:83-96`).

### Rooms grid `app/admin/(protected)/rooms/page.tsx`
Status-count cards, collapsible room cards (13 rooms), per-room status buttons (Available/Occupied/Cleaning/Maintenance) with optimistic update + rollback on failure and an error banner (`rooms/page.tsx:77-112,169-242`).
- **Keep as-is.** Occupancy is visible in one screen; a status flip is one click with visible confirmation or rollback.
- **Needs work (minor)** — Empty state again renders `...` (`rooms/page.tsx:245-248`).
- **Note (logic)** — The "occupied" count shown on the dashboard (`dashboard/page.tsx:98,186`) and the room grid statuses do not derive from reservations; rooms only change status when an employee flips them. In a fresh session two seeded rooms are `OCCUPIED` (`lib/seed.ts:47,55`) matching two in-house stays, so the numbers line up on arrival and only drift if the employee changes a status independently of a check-in/check-out.

### Settings `app/admin/(protected)/settings/page.tsx`
Pure information card: hotel name, location, "SQLite ORM (Prisma Repository Pattern)", "Next.js 15 Production Engine" (`settings/page.tsx:22-54`). No editable values, no persistence.
- **Candidate to remove-simplify.** In the single-employee model this screen does no work; it shows static stack details better left out of a demo. It is the admin equivalent of the public service pages — harmless, but adds a nav item with a fixed, non-configurable payload.

### Admin API surface (`app/api/admin/*`, plus the shared ones)
- `/api/admin/login` (POST) — see Auth.
- `/api/admin/logout` (POST) — deletes the unused cookie.
- `/api/admin/stats` (GET) — reservation counts per status only (`stats/route.ts:19`, `repositories/reservation/prisma.repository.ts:96-110`). No revenue, no occupancy-by-date, no arrivals/departures list.
- `/api/reservations` (GET/POST, `route.ts`), `/api/reservations/[id]` (GET/PATCH/DELETE), `/api/rooms` (GET), `/api/rooms/[id]` (PATCH) — all require only `demo_session_id` (see Auth).
- Known behavior worth noting: `PATCH /api/rooms/[id]` returns **500** for an invalid status string or a non-owned room (`rooms/[id]/route.ts:45-53` catch-all; `room.service.ts:24-31` throws a plain `Error("Invalid status…")`), not 400/404 — recorded in `docs/notes.md` as a deferred polish item. The rooms UI never triggers it (buttons send valid statuses), so impact is low.

---

## 2. Can the single front-desk employee complete real tasks?

Walk-through of the closed loop this demo is supposed to support (guest books on the public side → employee exists on a stay from the panel):

- Read incoming demand: dashboard shows NEW/PENDING counts live (`dashboard/page.tsx:124-176`), list is searchable/filterable. **Yes.**
- Confirm a booking: inline select (list) or one-click buttons (detail). **Yes.**
- Handle a date conflict on confirm: the service blocks it and the API returns 400 (`reservations/[id]/route.ts:92-100`), but the UI shows nothing on failure (silent) — the employee is left to guess why the change didn't stick. **Task in principle, feedback missing.**
- Cancel a booking: status button; delete: confirm dialog. **Yes.**
- Flip room status: one click, optimistic UI with rollback. **Yes.**
- Search a guest/reservation: by name, phone, email, or reservation ID (`repositories/reservation/prisma.repository.ts:43-51`). **Yes.**
- Walk-in booking: **No path exists.** The panel has no "new reservation" action and no POST-create endpoint for admin use — creation only exists on the public form (`app/api/reservations/route.ts:52-120`). A front-desk employee serving a walk-in guest has nothing to use inside the panel.
- Room inventory management: rooms are fixed at 13 per session (`lib/seed.ts:46-60`); there is no add/edit/remove room UI and no `POST /api/rooms` route. Status-only control. **Not possible.**
- Understand why an action failed: mostly **not possible** (silent PATCH failures, `...` states).
- Leave the panel: the only exit is Logout (`protected/layout.tsx:78-84`), which deletes a cookie that was never enforced.

## 3. Classification summary

| Item | Class |
| --- | --- |
| Login credential wall (flow, demo-credentials box) | Needs work (see auth finding) |
| Auth enforcement (JWT set, never verified; APIs keyed to public session cookie) | Needs work (critical) |
| Dashboard (stats, occupancy, recent) | Keep as-is |
| Reservations list (search/filter/inline status/delete) | Keep as-is |
| Reservation detail (status buttons, notes) | Keep as-is |
| Rooms grid (status flips, rollback, error banner) | Keep as-is |
| Status-change failure feedback (list + detail) | Needs work |
| `...` empty/loading states (list + detail + rooms) | Needs work |
| Refresh labeled "Save changes"; reservations subtitle = login subtitle | Needs work (wording) |
| Walk-in / direct-create reservation in admin | Missing entirely |
| Add/edit/delete rooms | Missing entirely |
| Occupancy/revenue/arrivals in stats API | Missing entirely (revenue/arrivals-date) |
| Settings screen (static stack info) | Candidate to remove-simplify |
| Multi-user role support | Missing entirely (single implicit admin; honest note: not scoped today) |