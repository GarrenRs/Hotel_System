> **Type:** Study | **ID:** ST-002 | **Status:** CLOSED (implemented — Phase 10) | **Based On:** docs/studies/ST-001-reservation-room-lifecycle.md, docs/audits/customer-journey.md | **Implementation Phase:** Phase 10 (ST-001 + ST-002 lifecycle)

# ST-002 — Customer Journey Redesign, Aligned with ST-001 Lifecycle (design-only, no code changes)

> Design-only document. No application file is modified, created, or deleted by this study.
> Its purpose: redesign the guest-facing experience so it is simple, fast, and honest about
> real availability, fully consistent with the **amended** ST-001 design (including the five
> "Final Architecture Review" CHANGE decisions). It deliberately adds nothing else.

> Guiding constraint (project owner): *the simplest, cleanest booking experience for the
> guest, and the simplest, non-duplicated, clearly-valuable admin experience — nothing more.*
> Every "hotel websites usually have it" temptation is named and rejected explicitly (§6).

---

## 0. Verification baseline (what the code says today, not what the audit assumed)

Re-derived from the current source (`app/(public)/`, `components/`, API routes), all verified:

| Audit-1 finding (pre-Phase 7) | Status today | Verified in |
|---|---|---|
| Dead `?room=` parameter on RoomCard "Reserve" | **FIXED** | `app/(public)/contact/page.tsx:13-19` reads `useSearchParams().get('room')`, resolves room `key → id` via `ROOM_TYPES_LIST`, passes `initialRoomType` inside a `Suspense`; `BookingForm.tsx:22-25` validates it before use |
| Cancelled stays still block a room (conflict excludes nothing) | **FIXED** | `repositories/reservation/prisma.repository.ts:120` `status: { not: CANCELLED }` |
| `/api/rooms` failure → disabled dropdown with `...` and no message | **FIXED** | `BookingForm.tsx:257-262` renders `errors.roomsLoadFailed` alert |
| Success copy says a *message* was sent | **FIXED** | `BookingForm.tsx:139` uses `contact.bookingConfirmedMessage` ("request received, reception will confirm") |
| Gallery captions hardcoded English + mismatched | **FIXED** | `components/hotel/GalleryGrid.tsx:8-15` uses `common.gallery.caption*` i18n keys |
| Service-page alt texts leak "HB" | **FIXED** | no `HB` residue in `app/(public)/` or `components/` |
| **Date-blind availability in the booking form** | **STILL OPEN** | `BookingForm.tsx:56-88` fetches `/api/rooms` and filters only `room.status === AVAILABLE`; dates are collected (`:170/:186`) but never used for availability |
| **No public way to find a booking again** | STILL OPEN (deliberately deferred) | see §2 decision |
| Home stats "45+ rooms" vs 13 seeded | STILL OPEN (cosmetic) | `app/(public)/page.tsx:182` |
| "About" not in the header | OPEN — decision below (§3) | `Header.tsx:64-133` |
| Public form reuses admin-namespaced labels (incl. "Select room" doubling as empty option) | STILL OPEN (cosmetic) | `BookingForm.tsx:166,182,198,217,238,326` |

Key public-side facts used throughout (§1, §5 grounded here):
- Pages: `/` (hero → `#booking` form → about-short → amenities → 3 featured `RoomCard`s → gallery → stats band → contact preview), `/rooms` (5 `RoomCard`s), `/contact` (`?room=` aware `BookingForm` + info cards + map), `/about`, `/gallery`, `/restaurant`, `/pool`, `/gym`, `/wedding`.
- Header nav (both breakpoints): **Home, Rooms, Services▾, Gallery, Contact** + a persistent **"Reserve Now"** CTA → `/contact#booking`. `components/layout/Header.tsx:64-145`. `NAV_ITEMS` in `lib/constants.ts:109-119` additionally carries `/about` (used by the footer).
- `BookingForm` flow: fetch `/api/rooms` (retry 5×800ms) → filter client-side → room `<select>` shows `Room {number} — {type}` (`:248-252`) → POST `/api/reservations` → success screen shows `reservationId` + `bookingConfirmedMessage`.
- Server create (`app/api/reservations/route.ts`): room exists → roomType matches → **`status === AVAILABLE` gate** (`:86`) → date-conflict (service) → insert `NEW`.
- Capacity: exists only in `ROOM_TYPES_LIST.capacity` (`lib/constants.ts:4-45`, 2/3/4/2/5); the guest form allows 1–10 guests regardless of type (`BookingForm.tsx:203`).

---

## 1. Customer journey inventory (current code)

| # | Step / page | Class | Reason (tied to value & ST-001) |
|---|---|---|---|
| 1 | Header (nav + persistent "Reserve Now" → `/contact#booking`) | **Keep as-is** | One booking CTA always visible; every nav path resolves. Under ST-001 nothing changes here. |
| 2 | Footer (all `NAV_ITEMS` + contact + check-in/out times) | **Keep as-is** | Reassurance + reachability. |
| 3 | Hero (two CTAs: Book Now, Explore rooms) | **Keep as-is** | Unambiguous decision entry. |
| 4 | Home `#booking` form (embedded `BookingForm`) | **Needs redesign** | The availability problem (§2) — the single most important guest-facing change. |
| 5 | Home stats band (`45+`, `12,000+`, `99%`, `10+`) | **Needs work** | `45+ rooms` contradicts the real 13-room inventory the date-aware form will now surface (§5 R8). Does not serve decision-making; can be made honest or dropped. |
| 6 | Featured rooms + `/rooms` page (`RoomCard`s) | **Keep as-is** | Marketing by *type* (price/capacity/photo) is what drives discovery; explicit availability is period-specific and belongs only in the form (§2). |
| 7 | `RoomCard` "Reserve" → `/contact?room={key}#booking` | **Keep as-is (works now)** | Verified: preselects the clicked type. Discovery→decision→booking in one hop. Keep the `?room=` contract. |
| 8 | `/contact` (info cards + form + map) | **Keep as-is** | It *is* the booking terminal; the stable single destination for every CTA. |
| 9 | `BookingForm` room `<select>` + empty/error states | **Needs redesign** | Must list only period-sellable rooms (ST-001 §E `GET /api/rooms/available`); clean empty-state message (no duplicate label, no bare `...`). |
| 10 | `BookingForm` guests input | **Needs work** | Must show the type's capacity and cap guests at it (matches ST-001 L7 capacity-at-create). Currently 1–10 with no type context. |
| 11 | `BookingForm` success screen (ID + `bookingConfirmedMessage` + reset button) | **Needs work (copy)** | Honest, booking-accurate copy; "Book another room" instead of the recurring "Reserve now" label; state what the guest should do next (keep the ID; reception will call — §2). |
| 12 | Success-screen public lookup | **Explicitly out of scope** | See §2 — rejected (deferred per `PROJECT_STATE.md` §7). |
| 13 | `/about` | **Keep as-is** | Trust; reachable via footer + home ("Explore more"). Not a booking blocker. |
| 14 | `/gallery` | **Keep as-is** | Trust; captions are now localized (verified). |
| 15 | `/restaurant`, `/pool`, `/gym`, `/wedding` | **Keep as-is** | Informational; no "HB" residue (verified). No booking role → no redesign. |
| 16 | Language switcher (AR/FR, RTL) | **Keep as-is** | Stable; persisted locale. |

**Nothing is removed.** Every public page serves discover → decide → reassure → book. A removal would remove guest value, not noise.

---

## 2. Guest-facing lifecycle alignment (with amended ST-001)

### 2.1 How rooms are shown as available

ST-001 §E defines the single availability rule: **`roomSellableForPeriod(roomId, arrival, departure)`** =
`Room.status` conditions **and** no overlapping active reservation (excluding `CANCELLED` and —
per Final Review decision 5 — `CHECKED_OUT`), executed **in the service layer**, exposed to the
form via **`GET /api/rooms/available?arrival=&departure=&roomType=`** (§E/I). The guest form must
consume that endpoint and **re-fetch whenever dates or type change** — not the current client-side
`status === AVAILABLE` filter (`BookingForm.tsx:66-68`). The server re-validates on submit
(unconditional, §I), so the UI and the DB can never disagree.

**Overlap flag → ST-001 §E (resolved in ST-001):** Final Review decision 1 noted that a room
currently `OCCUPIED` may still accept a reservation for a *later* period. The offer rule that
makes that scenario reachable for guests is **defined authoritatively in ST-001 §E — Availability
Model** (`offerableForPeriod`); ST-002 consumes it and does not define it. The consequences ST-002
relies on: MAINTENANCE rooms are never offered; OCCUPIED/CLEANING rooms may be offered for
**future** non-conflicting periods (decision 1's earlier-stay scenario); a **same-day** arrival
still requires the room to be `AVAILABLE` now.

### 2.2 What the guest sees at each reservation state

ST-001 §B keeps the guest journey to two visible moments; CHECKED_IN / CHECKED_OUT are
**back-of-house only** and are never exposed to guest-facing copy or UI.

| Reservation state | Guest-facing reality | Where |
|---|---|---|
| NEW (created) | **Immediately after submit:** success screen with reservation ID + "reception will contact you to confirm" | `BookingForm` success state |
| CONFIRMED | Guest does **not** see it (no portal — decision below). The desk confirms by phone; the success-screen promise is the honest contract | (no guest surface) |
| CHECKED_IN / CHECKED_OUT | Never exposed to the guest — operational only. A guest's run-of-the-mill questions are answered by the desk from ST-001's screens (§F/G) | — |
| CANCELLED | No guest surface; only arises if the desk rejects a request, communicated out-of-band | — |

### 2.3 Post-booking (explicit decision: lookup is DEFERRED)

**Decision — no guest lookup/status-check in this study's scope.**
Default is deferred per `PROJECT_STATE.md` §7 ("Guest self-service lookup portal") and the
audit's own verdict (`external-internal-balance.md` §3: the portal "would consume the single most
valuable slice of new scope"). Verified: the internal capability exists (admin search by
`reservationId`, `repositories/reservation/prisma.repository.ts:43-51`), but surfacing it to the
guest is a product decision, not a booking-flow necessity.

**Temptation named and rejected:** "hotels usually let you check your booking online."
Rejected because it adds an API route, a public page, a session/anonymity mechanism, and admin
exposure rules — none of which a small hotel's one front desk needs to complete the booking line.
The minimal in-scope substitute is **copy**: the success screen tells the guest to keep the
reservation ID and that reception will confirm by phone (a promise the desk can keep with the
existing NEW list + one Confirm button under ST-001).

**Confirmation content (in-scope copy changes, no new functionality):**
- reservation ID (exists, `reservationId`),
- the booked room type + concrete room number (exists: `Reservation.roomType` / `Room.roomNumber` join),
- dates + guest count (exist),
- "keep this ID — our reception team will call you to confirm" (copy-only);
- a reset control labeled **"Book another room"**, not the repeated "Reserve now" (`BookingForm.tsx:148`).

No email/SMS, no PDF, no QR. Those are named-and-rejected (§6).

---

## 3. Simplified navigation & page structure

**Proposal: keep the current public page set and header — the structure is already minimal.**
The only structural rework lives inside the booking form (a single component), because the guest's
"page structure" need is already met: *one persistent CTA → one booking terminal → one result.*

| Decision | One-sentence justification (guest value) |
|---|---|
| Keep Header = Home · Rooms · Services▾ · Gallery · Contact + "Reserve Now" | Every item leads to discovery or the single booking terminal; a leaner header would drop trust, not friction. |
| Keep `/contact` as the one booking terminal (do not merge into `/`) | A stable, predictable destination for every CTA keeps the decision→booking hop to one click. |
| **Do not add a dedicated availability/search page** | Dates are meaningless without a booking intent; forcing a separate search step adds a page that the form already performs. (Temptation named & rejected.) |
| Keep Rooms page marketing-per-type, no vacancy indicators | Vacancy is period-specific; showing it statically would re-create the dishonesty this study removes. (Temptation named & rejected.) |
| Keep `?room=` preset (works) | RoomCard → correct type preselected = Rooms→form in one hop; removing it would re-create the audit's worst drop-off. |
| About stays out of the header (footer + home link suffice) | No booking value in a sixth header item; discovery value already served from two existing surfaces. |
| No public page removed or merged | Each surviving page serves discover/decide/reassure; removing one removes guest value, not noise. §1 table 13–16. |

The audit's "candidate to remove-simplify" items on the public side reduce to: About-not-in-header
(kept as-is, above) and the cosmetic stats band (§1 #5) — neither warrants deleting a page.

---

## 4. Front desk / admin alignment check

Cross-checked against ST-001 §F (desk workflow), §G (page responsibilities), §H (actions), §I (API):
**no contradiction, and ST-002 introduces no new admin requirement — because it introduces no new
guest-entered data field.**

| Check | Result |
|---|---|
| ST-002 adds any new guest-field the desk must see/store? | **No.** The guest submits exactly today's fields (name/phone/email/guests/dates/roomType/roomId/notes). ST-001 §G already adds the room-number join; the desk already has phone for the "we'll call you" promise. |
| Desk can honor the guest promise ("reception will confirm")? | **Yes, under ST-001.** NEW list + one Confirm button (§F), with non-silent failure feedback (§I/§L5) so a rejected confirm is never invisible while the guest waits. |
| OCCUPIED-room rebooking (decision 1) needs a desk read? | ST-001 §G already lists "current guest + departure date" (derived) on OCCUPIED rooms — enough for the desk to reason about when the room frees. No addition. |
| Guest never sees CHECKED_IN/CHECKED_OUT — desk-only? | Confirmed: no public surface reflects operational states (there is no public status read at all — deferred §2.3). |
| Any new admin screen/column suggested by ST-002? | **None.** Flag-only: the walk-in/create path gap (`admin-panel.md`) remains **out of both studies' scope** (deferred, `PROJECT_STATE.md` §7) — ST-002 does not reopen it. |

---

## 5. Database / schema impact ledger — MANDATORY

### 5.1 ST-002 requirement → data consequence (incremental, exhaustive)

Every new guest-facing requirement this study introduces, traced to its exact data consequence.
The result is intentionally near-empty: **availability, presentation, and copy all derive from data
that already exists** (mirroring ST-001 §D's "source of truth" discipline — nothing is stored twice).

| Requirement (from this study) | Data needed | Already exists? | Schema action | Column/type | Nullable? | Default | Notes |
|---|---|---|---|---|---|---|---|
| R1 · Offer only period-sellable rooms, incl. same-day AVAILABILITY rule (§2.1) | `Room.status` + overlapping active reservations | yes → `Room.status`; active overlaps derivable from `Reservation.{roomId,arrivalDate,departureDate,status}` | `NONE (derived, no storage)` | — | — | — | Availability is a service function (`roomSellableForPeriod`, ST-001 §E), never a stored field. No new column. |
| R2 · `GET /api/rooms/available` feed for the form | same as R1 | yes | `NONE (derived, no storage)` | — | — | — | Code-only endpoint (ST-001 §I). Reads existing columns. |
| R3 · Show capacity per room type and cap `guests` at it | `ROOM_TYPES_LIST.capacity` | yes → `lib/constants.ts:4-45` (keys by `RoomType.id`) | `NONE (no storage)` | — | — | — | No `RoomType` table (ST-001 §A/J). Server imports `ROOM_TYPES_LIST` for the capacity check (ST-001 L7); the form shows the same constant. |
| R4 · Guest-visible loading/error/empty states for the room list | none (UI state) | — | `NONE (no storage)` | — | — | — | Presentation only (`BookingForm`). |
| R5 · Success screen shows reservation ID | `Reservation.reservationId` | yes → existing `@unique` column | `NO CHANGE (reuse existing field)` | `String` (existing) | no | — | Already returned by `POST /api/reservations`. |
| R6 · Success screen shows room type + room number | `Reservation.roomType` (snapshot), `Room.roomNumber` (join) | yes → both existing | `NO CHANGE (reuse existing fields)` | `String`/`String` (existing) | — | — | `roomId → room.roomNumber` join already exists (ST-001 §D/G). |
| R7 · "Reception will call you" promise | `Reservation.phone` | yes → existing column | `NO CHANGE (reuse existing field)` | `String` (existing) | no | — | The field the desk needs to fulfill the promise already exists. |
| R8 · Honest inventory statement (drop/derive "45+ rooms") | real room count | derivable → `count(Room)` | `NONE (derived, no storage)` | — | — | — | Fix = show the derived count or truthful copy at implementation; no column. |
| R9 · Room selector excludes MAINTENANCE and conflicts | same as R1 | yes | `NONE (derived, no storage)` | — | — | — | Subset of R1's rule. |

**No new column, no new table, no migrated seed value is introduced by ST-002.** Every
requirement is either `NONE (derived/UI)` or `NO CHANGE (reuse)`. This is the full and final answer;
nothing is silently assumed derivable — the derivations are named in the Notes column above.

### 5.2 Combined, de-duplicated schema-change list (ST-001 + ST-002)

ST-001's own impact (`ST-001 §J` + its Final Review addendum — after the review, **no review
decision adds a column**; decision 4 is code-only locking) is the whole list:

| # | Change | Type | Owner |
|---|---|---|---|
| 1 | `PENDING → NEW` status update on existing `Reservation` rows | data migration | ST-001 §B/J/L1 |
| 2 | (optional, recommended) `Room.roomNumber @unique` | schema (index constraint only) | ST-001 §J |
| 3 | Seed sample data: realistic `CHECKED_IN`/`CHECKED_OUT` rows; keep the "more bookings than room states" case (e.g. room with future CONFIRMED + current AVAILABLE) | seed update | ST-001 §L2 |
| 4 | Transaction + `SELECT … FOR UPDATE` on create/confirm/check-in/check-out (Postgres) | code, no schema | ST-001 §E/I, review d4 |
| 5 | `hasConflictingReservation` excludes `CHECKED_OUT` (adds to existing `CANCELLED` exclusion) | code, no schema | ST-001 review d5 |
| 6 | Availability function + `GET /api/rooms/available`; capacity check at CREATE (`ROOM_TYPES_LIST`); room-number join everywhere | code, no schema | ST-001 §E/I/J, review bounds |

**ST-002 contributes nothing to this list.** Combined list = ST-001's list exactly. Confirmed
explicitly: ST-002's requirements R1–R9 all *consume* items 4–6 (endpoint, service rule, capacity,
join) rather than adding to them. If ST-002 alone were implemented it would have **zero** schema
impact — it is pure presentation over ST-001's data model.

### 5.3 Overlap flag — fields both studies touch

Explicit call-outs where ST-002 reads fields ST-001 has claimed a meaning for (per the task mandate,
these are required call-outs, not footnotes):

- **`Room.status`** — ST-001 golden rule: *physical* state only, never reservation-derived facts
  (§C/§D). ST-002 only **reads** it (R1/R9) and never proposes writing to it. ✓ no conflict.
  Flag: the seed's room-401 shape (CONFIRMED reservations + `status: AVAILABLE`) is **consistent**
  under the amended model (an available-now room with future CONFIRMED stays is the normal
  derived-"RESERVED" case) — no backfill needed; keep as a valid seed example.
- **`Reservation.status`** — ST-001 §B owns the state machine (5 values, PENDING removed). ST-002
  only makes *guest-facing copy* conditional on the two guest-visible values (NEW / nothing else),
  and explicitly never exposes CHECKED_IN/CHECKED_OUT. ✓ no conflict.
- **`Reservation.arrivalDate/departureDate`** — ST-001: "a NEW reservation holds its period"
  (review bound, Option B). ST-002's offer rule leans on exactly that period semantics (R1). ✓.
- **`Reservation.roomId`/`Room.roomNumber`** — ST-001 §G shows the room number via the join.
  ST-002 surfaces the same number to the guest on the success screen (R6). ✓ reuse, no redefinition.
- **`Reservation.roomType` snapshot vs `Room.roomType` physical truth** (review bound) — ST-002
  shows the **snapshot** to the guest (what they booked) and capacity by type (constants).
  ✓ no redefinition.

### 5.4 Backfill / migration for seed data

- **No new column** → **no new backfill** from ST-002. The only data migration remains ST-001's
  `PENDING → NEW` (its §L1), which also covers any existing rows.
- Rooms/guests: the 13-room / 8-reservation seed already satisfies R5–R7 (it has IDs, phones, types).
  Only ST-001's §L2 seed update applies (adding in-house samples); ST-002 needs no seed change.

---

## 6. Minimal-scope guardrail — what this study does NOT add

Each of these is a real "hotel websites usually have it" temptation, named and **rejected**:

1. **Guest self-service portal / booking lookup / status check** — deferred (`PROJECT_STATE.md` §7);
   rejected because it would be the single largest scope slice for zero desk value. (In-scope
   substitute: honest success copy + the existing phone field.)
2. **New guest data fields** (second phone, ID/nationality, country, reference source, marketing
   consent) — rejected: nothing is stored that the desk does not act on to run the stay.
3. **Payment / deposit / OTA-engines / channel manager** — rejected (deferred list, §7 of
   `PROJECT_STATE.md`); nothing in the journey transacts money.
4. **Availability widget / vacancy calendar on the Rooms page or home** — rejected: dates belong in
   the booking form; a second availability surface duplicates the rule (§5.1 R1) for no value.
5. **New public pages** (availability search, dedicated booking-confirmation page, room detail
   pages) — rejected: the existing `/rooms` + `/contact` terminal already cover discovery→booking.
6. **Adding About (or any item) to the header** — rejected: no booking value; footer + home suffice.
7. **Email/SMS/PDF/QR confirmation or pre-arrival reminders** — rejected: automation is a feature
   decision; the honest in-scope promise is the desk calling on the existing `phone`.
8. **Removing any existing public page** — rejected: each serves discover/decide/reassure (§3).
9. **Any admin-panel redesign here** — rejected: that is ST-001's explicit remit (§F/G/H/I);
   ST-002 adds no admin work (§4).
10. **Redefining ST-001's availability semantics** — rejected: the `offerableForPeriod` rule is
    defined authoritatively in ST-001 §E; ST-002 only consumes it (§2.1) and does not re-specify it.

---

## Change log

- **2026-09-08** — Created as design study ST-002 (no code changes). Registers as the guest-facing
  companion to ST-001; adds zero schema impact (§5).