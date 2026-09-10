# Audit Report 3 — External / Internal Balance

Based exclusively on the findings in `customer-journey.md` (Report 1) and `admin-panel.md` (Report 2). No new investigation.

---

## 1. Where the public side implies a capability the admin cannot fulfill

From Report 1 (guest-facing promises) crossed against Report 2 (what the panel can do):

- **Walk-ins.** The public side presents the hotel as fully operational and bookable (make a booking form prominent everywhere, `BookingForm` embedded on home + contact). Implicit expectation: a customer arriving without a booking can be checked in. Report 2 shows the admin has **no create-reservation path** — no "new booking" action and no admin POST endpoint (`app/api/admin/*` has only login/logout/stats). The only way a reservation enters the system is the guest submitting the public form.
- **"45+ rooms" on the home page** (`app/(public)/page.tsx:180-197`). The admin manages a fixed 13-room seed (`lib/seed.ts:46-60`) with no add/remove UI (Report 2). The number on the storefront has no administrative equivalent; the panel cannot represent 45+ rooms without code changes. False-precision claim relative to the actual inventory.
- **Booking success = "a real booking exists."** The public flow ends with a reservation ID and "our reception team will contact you" (`BookingForm` success, `contact.json`). The admin can see it (NEW) and confirm/cancel it — **that part is coherent**. The imbalance is elsewhere (section 2) and in the failure feedback: if the employee's confirm action is silently rejected (Report 2, no UI feedback on status-PATCH failure), the guest's implied promise ("someone will contact you") can be unmet without anyone at the desk being told why.
- **Room/service pages with amenities** (restaurant/pool/gym/wedding) imply the hotel fulfills those; the admin has no involvement — acceptable, these are informational and out of scope for the front-desk model.

## 2. Where the admin has data or capability the public never surfaces

Flag-only items (potential conversion value, **not** build recommendations):

- **Lookup by reservation ID.** The admin can search by `reservationId` (`repositories/reservation/prisma.repository.ts:43-51`), but the public side has no way for a guest to re-find their booking; the success screen shows the ID dead-ended (Report 1). The data and search already exist internally.
- **Status visibility.** The admin distinguishes NEW/PENDING/CONFIRMED/CANCELLED, but a guest has no view of their booking state after leaving the success screen (Report 1). Again, the internal capability is already there.
- **Specific room identity.** The admin operates on concrete room numbers/statuses (`rooms/page.tsx`); the public site markets rooms largely by type and hides room numbers and per-room status from the guest except in the live dropdown (`BookingForm.tsx:242-244`). Not a defect — a deliberate privacy boundary — but worth flagging that a transparent "room 501 Royal Suite" listing would reuse existing data.
- **Unused admin surface.** The admin occupies itself with status/room management that the public booking flow only ever creates, never reads — i.e. the entire admin exists to service exactly one guest action (submit a booking request). There is no public touch point that reflects an admin action back (no "your booking has been confirmed" view). This is a **coherence gap**, not just a privacy one.

## 3. What NOT to build now (scope-drag guardrail)

For a first real sales demo of one employee + one booking line:

- **Multi-user roles / a users table.** Report 2 confirms single implicit admin is the current shape; roles would not add demo value, they would add ceremony.
- **Payments / invoicing / deposits.** Nothing on either side references money flow; adding it widens the schema and the review surface.
- **Email or SMS delivery.** The success copy implies a human will contact the guest; automating notifications is a feature decision, not a demo necessity.
- **Guest self-service portal (lookup/cancel).** Section 2 flags the gap; building it now would consume the single most valuable slice of new scope.
- **Revenue / financial analytics.** The stats API is status counts only by design (Report 2); revenue charts would outgrow the demo's question.
- **Date-aware public availability calendar.** Report 1 shows the current form is status-based; a genuine availability engine is the "right" fix but a large one and can be deferred (the demo seed is small).
- **Real geolocation / OTA feeds / booking engines / channel manager.** Fictional brand uses search-query map embeds by design; aligning with real-world booking systems is beyond a demo.
- **Room add/edit screens, room plans.** Fixed 13-room seed is intentional; management of the physical plant is not a front-desk task.
- **Additional locales or a public language beyond AR/FR.** Not related to the booking line.

## 4. Verdict — is the balance coherent for a first real sales demo?

**Yes, the spine is coherent, with one named gap serious enough to address first.**

The closed loop that matters for a sales demo already works end to end:
guest books on the public side (`NP-2026-####` created as NEW) → one employee opens the dashboard → reads the request → confirms/cancels → flips room status. Every piece of that loop exists and was verified working in Phase 6 runs (public POST 201, dashboard 200, seeded 8 reservations + 13 rooms, admin list/detail/rooms all operational).

**The one gap serious enough to fix (or at minimum to be instantly honest about) before the first real demo is the admin's empty credential wall** (Report 2, Auth): `hotel_demo_admin_token` is set and never read, and every admin page/API only checks the public `demo_session_id` cookie that middleware issues to any site visitor. In plain terms: navigating to `/admin/dashboard` by URL is fully functional without any login, while the login card — generously displaying the real credentials on screen — promises "secure access." A prospect or even an attentive customer can observe this contradiction in one click. It is the difference between "a log-in screen" and "an accessible panel," and it poisons trust in a security-sensitive hospitality demo more than any single dead `?room=` link or `...` loading state does.

Secondary, still worth stating plainly but not blocking:
- RoomCard "Reserve" silently books the wrong (default) room type (`customer-journey.md`).
- Booked-request confirm can fail silently at the desk while the guest is told "we will contact you."
- Walk-in booking and guest post-booking lookup are both absent — acceptable boundaries now, but they are the first things a viewer will ask about.

Everything else in the three reports is polish or a deliberate, reasonable scope boundary.