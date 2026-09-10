# Audit Report 1 — Customer Journey (Public Site)

Scope: every public page and shared component under `app/(public)/` and `components/`, read from source. Each item classified against a single standard: *does it deliver clear, direct value toward making a booking with zero confusion or dead ends?*

Classification keys used throughout:
- **Keep as-is** — serves the booking goal cleanly.
- **Needs work** — functional but has a friction/confusion point that slows or derails the guest.
- **Missing entirely** — something the journey logically expects but does not exist.
- **Candidate to remove-simplify** — present but adds noise/risk without clear booking value.

---

## 1. Page / component inventory

### Header (`components/layout/Header.tsx`)
Fixed top nav: Home, Rooms, Services dropdown (Restaurant/Pool/Gym/Wedding), Gallery, Contact, plus a persistent "Reserve Now" CTA to `/contact#booking` and the language switcher. Mobile drawer duplicates the same items. `Header.tsx:65-133` (desktop), `Header.tsx:161-222` (mobile).
- **Keep as-is.** One clear booking CTA, always visible, all paths lead to usable pages. Note for completeness: **About is not in the header**; it is reachable only via the footer (`lib/constants.ts:110-111` `NAV_ITEMS` includes `/about`) and the home "Explore more" link. Not a booking blocker.

### Footer (`components/layout/Footer.tsx`)
Brand block, quick links (all `NAV_ITEMS`), contact details, check-in/check-out times, socials. Links home, about, rooms, restaurant, pool, gym, wedding, gallery, contact. `Footer.tsx:56-72`.
- **Keep as-is.**

### Hero (`components/hotel/Hero.tsx`)
Full-screen crossfade of two images, star badge, headline, subtitle, two CTAs: "Book Now" → `/contact#booking` and "Explore rooms" → `/rooms`. `Hero.tsx:98-110`.
- **Keep as-is.** CTA hierarchy is unambiguous.

### Language switcher (`components/layout/LanguageSwitcher.tsx`)
AR/FR toggle persisted in `localStorage` (`hotel_demo_locale`). Default `ar`, RTL toggled via `document.documentElement.dir` (`components/providers/LanguageContext.tsx:53-86`). Missing keys render the raw key path (`LanguageContext.tsx:74-87`).
- **Keep as-is.** Locale switching is stable; verbatim key fallback is only visible if a key is mistyped (none observed in these screens).
- Minor note: `t()` is string-key based with no schema (`LanguageContext.tsx:74-87`); a typo would silently render `key.path` in UI. Low frequency, low impact.

### Home page (`app/(public)/page.tsx`)
Sections in order: Hero → embedded `BookingForm` (above the fold, `#booking`) → About short + lobby image → Luxurious amenities grid (6 cards) → Featured rooms (first 3 of `ROOM_TYPES_LIST`) → Gallery grid → Statistics band → Contact preview with map iframe → (Footer). `page.tsx:19-246`.
- **Keep as-is** overall: the site's single most conversion-focused page; the booking form is one scroll away.
- **Needs work (minor)** — Home stats band claims "45+ rooms" next to "10+ years", `12,000+ guests` (`page.tsx:180-197`). The actual demo inventory is 13 rooms per session (`lib/seed.ts:46-60`). Cosmetic marketing numbers, but a sharp prospect comparing "45+ rooms" against a bookable dropdown of 13 could notice; see Report 3 (flag only).
- **Needs work (minor)** — The home "Gallery" heading copies `common.hotelName` as its title (`page.tsx:170-173`) while the section is labeled "Gallery" in the eyebrow; wording is a cosmetic mismatch, not a dead end.

### Rooms showcase & Rooms page (`components/hotel/RoomCard.tsx`, `app/(public)/rooms/page.tsx`)
`RoomCard` shows image, price (formatted with locale separators), capacity, area, description and a **"Reserve" button** linking to `/contact?room={roomKey}#booking` (`RoomCard.tsx:66-70`).
- **Needs work — the single biggest guest-journey drop-off found.**
  - The `room` query parameter is **never read**: there is no `useSearchParams` anywhere in `app/` or `components/` (verified by search), and `contact/page.tsx:52-55` renders `<BookingForm />` with no arguments. Clicking "Reserve" on any room card therefore lands the guest on the contact page with the **default Deluxe Suite preselected** (default via `ROOM_TYPES_LIST[0]`, `lib/constants.ts:6`), regardless of which room they clicked. A guest who clicked "Royal Suite" will find themselves about to book a Deluxe Suite with no explanation.
  - Anchor `#booking` does resolve to the booking section on `/contact` (`contact/page.tsx:52`), so the scroll works; only the pre-selection is dead.
- **Keep as-is** for the rest of the card (price/attributes/photo are clear).

### Booking form (`components/reservation/BookingForm.tsx`)
- Structure: arrival/departure dates, guests, room type, live room dropdown (fetches `/api/rooms`, filters to `status === AVAILABLE` and the chosen type client-side), name/phone/email, notes, submit. Validation via react-hook-form + zod (`lib/validations/reservation.schema.ts`). `BookingForm.tsx:153-330`.
- **Keep as-is** — the form is complete, validates on the client, shows per-field errors, and posts to a real endpoint.

**Flow-level observations (all verified in code):**
- **Needs work** — Room availability shown in the dropdown is **status-based only** (`BookingForm.tsx:59-62` filters on `RoomStatus.AVAILABLE`); it knows nothing about dates. The server checks date overlap only at submit (`app/api/reservations/route.ts:111`, conflict in `services/reservation/reservation.service.ts:38-50` and `repositories/reservation/prisma.repository.ts:112-130`). Between dropdown and submit there is no date/availability signal, so a guest can select a room that is genuinely unavailable for their dates and only learn about it on submit — and seeded data makes this **reproducible in a fresh session**: room 501 (`ROYAL_SUITE`) stays `AVAILABLE` (`lib/seed.ts:59`) while it already holds a CONFIRMED future stay (`lib/seed.ts:158-169`).
- **Needs work** — The conflict check does **not exclude cancelled reservations** (`prisma.repository.ts:119-125` filters only roomId/sessionId/dates). Room 202 is seeded `AVAILABLE` (`lib/seed.ts:49`) but carries a CANCELLED stay at `-2..+5` (`lib/seed.ts:182-193`); a guest booking room 202 inside that window will hit "Room is not available for the selected dates." even though the blocking reservation is cancelled.
- **Needs work** — If `/api/rooms` fails (or returns empty) after the 5 retries (`BookingForm.tsx:13-14,63-72`), the room dropdown renders disabled with a bare `...` placeholder (`BookingForm.tsx:236-245`) and the only copy shown is the amber "no available rooms" line **only** in the `ready` state (`BookingForm.tsx:247-249`). In the `error` state there is **no explanatory message at all** — the guest sees a disabled list with no reason, a hard dead end.
- **Needs work (wording)** — On success the form shows the `contact.successMessage` string ("Your message has been sent successfully, our reception team will contact you soon" — `messages/ar/contact.json:14`), i.e. copy written for a *contact form* is displayed for a *booking*. It also shows the reservation ID (`BookingForm.tsx:131-136`). The guest did not send a message; they created a booking. The wording undercuts the event.
- **Needs work (wording)** — Form field labels reuse admin namespace keys: `admin.table.arrival`, `admin.table.departure`, `admin.table.guests`, `admin.table.roomType`, `admin.roomsSection.selectRoom`, `admin.details.notes` (`BookingForm.tsx:159,175,191,210,231,313`). They render correct Arabic/French text, but the "Select room" label doubles as the empty-option text in the dropdown (`BookingForm.tsx:238-240`), so the placeholder repeats the label. Cosmetic.
- **Needs work (minor)** — After a successful booking the guest cannot find that booking again: the success screen shows the ID and a "Book again" reset button (`BookingForm.tsx:137-142`) but there is no lookup path on the public side (see Report 2: admin can search by reservation ID).
- Success → button text: `common.reserveNow` — "Reserve now" on a screen that already says "success"; minor copy loop (clicking it just resets to the blank form).

### About page (`app/(public)/about/page.tsx`)
Title, tagline, short + long description, two trust cards, lobby image. `about/page.tsx:12-69`.
- **Keep as-is.** Informational only, no booking CTA needed; contributes brand trust.

### Service pages — Restaurant / Pool / Gym / Wedding (`app/(public)/restaurant|pool|gym|wedding/page.tsx`)
Each: subtitle eyebrow, `{Service} - Hotel Najma` title, one paragraph, one image.
- **Keep as-is** — thin but plausible marketing pages; the header's "Services" dropdown is the only nav entry point (plus footer).
- **Needs work (brand leak)** — All four images carry leftover placeholder alt text literally containing "HB": `alt="Restaurant HB"` (`restaurant/page.tsx:29`), `alt="Pool HB"` (`pool/page.tsx:36`), `alt="Gym HB"` (`gym/page.tsx:30`), `alt="Wedding Hall HB"` (`wedding/page.tsx:36`). Screen-reader users and anyone inspecting markup still see the old working brand.
- The restaurant page imports `Wine, Sparkles` unused; about imports `Star, HeartHandshake` unused (mirrors the known lint warnings; visible only to tooling, not guests).

### Gallery (`components/hotel/GalleryGrid.tsx`, `app/(public)/gallery/page.tsx`)
6-image grid with lightbox. Captions are **hardcoded in English** and several are mismatched with the image content, e.g. `room-standard-twin.webp` titled "Royal Suite Living Room", `hotel-restaurant-breakfast.webp` titled "Fitness Center", `hotel-conference-room.webp` titled "Wedding Hall Elegance" (`GalleryGrid.tsx:7-14`). Captions never localize (`GalleryGrid.tsx:38` uses `img.title` directly).
- **Needs work.** For an AR/FR site, hardcoded English captions are visible to all guests, and three of six captions describe the wrong scene — a genuine trust/confusion point for a prospect window-shopping the hotel.

### Contact page (`app/(public)/contact/page.tsx`)
Four info cards (address, phone, WhatsApp, email) + booking form + embedded Google Map iframe. `contact/page.tsx:25-68`. Map is a search-query embed URL (`config/hotel.ts`), no real coordinates.
- **Keep as-is.** This page effectively *is* the guest's booking terminal; the info cards and map support trust.

---

## 2. End-to-end booking flow trace

1. **Discovery.** Guest lands on `/`; hero CTA or header "Reserve Now" or home embedded form (`page.tsx:25-27`). No friction here.
2. **Ways into the form.** Three form entry points, all healthy: home embedded `#booking`, `/contact#booking`, header CTA. (RoomCard "Reserve" is the exception — dead `?room=` param, see above.)
3. **Availability.** Guest picks dates + guests + room type (`BookingForm.tsx:154-225`). Room dropdown lists status-AVAILABLE rooms only, per type, fetched live (`BookingForm.tsx:42-81`, `/api/rooms` filtered to `RoomStatus.AVAILABLE`). No date-aware availability display.
4. **Details.** Guest enters name/phone/email/notes.
5. **Submit.** POST `/api/reservations` validates (zod), verifies the room exists in session, matches type, and is `AVAILABLE` (`app/api/reservations/route.ts:64-110`), then calls `createReservation`, which throws on date overlap (`reservation.service.ts:38-50`). Reservations are created with status `NEW` (`repositories/reservation/prisma.repository.ts:20`).
6. **Confirmation.** Success screen shows a checkmark, the `contact.successMessage` copy (message-vs-booking wording mismatch), the `NP-2026-####` ID, and a reset button (`BookingForm.tsx:128-143`). Service allocates collision-free IDs `NP-2026-####` (`reservation.service.ts:20-23`).

**Stuck / drop-off points found, in order of severity:**
- RoomCard "Reserve" → wrong-room default preselection, silently (`RoomCard.tsx:68` + no `useSearchParams` anywhere).
- Choose an "available" room that is actually date-blocked → rejected only at submit; reproducible with seeded room 501 / cancelled room 202.
- `/api/rooms` failure → permanently disabled room dropdown with `...` and no explanation (`BookingForm.tsx:236-245`).
- Success copy describes a *message* being sent, not a booking (`contact.json:14`).
- Post-booking there is no public way to look the reservation up again.

---

## 3. Classification summary

| Item | Class |
| --- | --- |
| Header + reserve CTA + mobile drawer | Keep as-is |
| Footer (contact + check-in/out) | Keep as-is |
| Hero + CTAs | Keep as-is |
| Home page composition (hero → form → rooms → gallery) | Keep as-is |
| About page | Keep as-is |
| Restaurant / Pool / Gym / Wedding pages (content) | Keep as-is |
| Contact page + info cards + map | Keep as-is |
| Booking form core flow (validation, POST, ID display) | Keep as-is |
| RoomCard reserve pre-selection (`?room=` dead param) | Needs work |
| Date-aware availability before submit | Needs work (missing) |
| Cancelled reservations blocking rebooking | Needs work |
| Room-selector error state (no message) | Needs work |
| Booking success copy (message wording + no lookup) | Needs work |
| Gallery captions (hardcoded EN, mismatched) | Needs work |
| Service-page alt texts ("Restaurant HB" etc.) | Needs work |
| Home statistics (45+ rooms vs 13 seeded) | Needs work (minor, cosmetic) |
| About out of header nav | Candidate to remove-simplify (nav) or add — flag only |

No production dead ends (404s) found — every nav/footer/footer link resolves to a real route.