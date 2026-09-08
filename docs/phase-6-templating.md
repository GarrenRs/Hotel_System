# Phase 6 — Generic Template & Demo Presentation Layer

## What Changed

Replaced the original real-hotel identity ("Hotel Bouteldja" / "Hotel HB") repo-wide with a fictional, professionally coherent brand (**Hôtel Najma** / **Najma Palace & Suites**), genericized the reservation-ID prefix, swapped brand-tied images for royalty-free stock, and added a demo-aware presentation layer (badge + env-driven login credentials).

### Brand identity — `config/hotel.ts`
- `name: "Hotel Najma"`, `fullName: "Najma Palace & Suites"`, `stars: 4`
- `location: "Algiers, Algeria"`, `address: "Corniche Ouest, Algiers, Algeria"`
- `phoneDisplay: "0550 00 42 24"`, `phone`/`whatsapp`: `+213550004224`
- `email`/`reservationsEmail`: `reservations@najmapalace.com`
- `checkIn: "14:00"`, `checkOut: "12:00"`
- socials: `instagram.com/najmapalace/`, `facebook.com/najmapalace/`
- `coordinates: { lat: 36.795, lng: 3.062 }` (Algiers Corniche area)
- `googleMapsUrl` / `googleMapsEmbedUrl` rewritten as **search-query URLs** (generic fictional place, no short-link/embed of a real establishment)

### Metadata & structured data — `app/layout.tsx`
- Title/description/keywords: dropped "Sidi Moussa", "Bouteldja", "hotel-hb.dz"; now Algiers/Najma headings incl. Arabic keyword `فندق نجمة الجزائر العاصمة`
- `metadataBase`, `openGraph.url`, twitter og/twitter kept fictional `https://najmapalace.com`
- jsonLd `addressLocality` → `Algiers`; `priceRange` now **derived** from `ROOM_TYPES_LIST` (`Math.min/max`) instead of a hardcoded string, so it stays synced with the rate card

### Reservation ID prefix (genericized)
- `HB-2026-` → `NP-2026-` (same format/shape) in:
  - `services/reservation/reservation.service.ts` (`generateReservationId()`)
  - `lib/seed.ts` (seed reservation candidates)
- Verified a live booking returns `NP-2026-XXXX`.

### Room rate card — `lib/constants.ts` (`ROOM_TYPES_LIST`)
New prices (distinct from the original rate card; jsonLd derives from these):
| Room | Old | New |
|---|---|---|
| STANDARD_DOUBLE | 16000 | **17500** |
| DELUXE_SUITE | 22000 | **24500** |
| EXECUTIVE_SUITE | 32000 | **34500** |
| FAMILY_SUITE | 38000 | **41500** |
| ROYAL_SUITE | 55000 | **59000** |

### Logger
- `lib/logger.ts` prefix `[Hotel HB]` → `[Hotel Najma]`.

### Demo presentation layer
- **`components/layout/DemoBadge.tsx`** (new, client): fixed bottom-start gold-on-dark pill "Live Demo — Orkestrix Systems", reads localized `common.demoBadge`.
  - Rendered in `app/(public)/layout.tsx` and `app/admin/(protected)/layout.tsx` (always visible on both fonts).
- **Login page restructured** — `app/admin/(auth)/login/page.tsx` is now a **server page** reading credentials via a new server-only module `lib/demo-access.ts` (which imports the single `env` from `@/lib/env` — one source of truth, no copy) and passing them as props to a new client child **`components/admin/AdminLoginCard.tsx`**.
  - The card shows a demo-credentials box (username/password surfaced on the login card) + generized footer via new localized keys `admin.demoAccess` and `admin.secureAccess`.
  - Lint cleanup in the move: removed the pre-existing `catch (err: any)` (→ `unknown`/`Error`) and the unused `KeyRound` import that had been flagged; removed the hardcoded "Hotel HB Administration Panel • Secure Access" line.
- **`app/layout.tsx`**, `Header.tsx`, `Hero.tsx`, `about/page.tsx`, `contact/page.tsx`, `page.tsx`, admin `protected/layout.tsx` alt/title attributes updated to `${HOTEL.name}`-driven text (e.g. "Hotel Najma Logo", "Najma Admin").

### Localized messages (ar + fr)
- `common.json`: `hotelName`/`stars`/`tagline` → Najma; footer `aboutTitle`/`rights` genericized (Alger, no Sidi Moussa/Bouteldja); added `common.demoBadge`.
- `home.json`: hero welcome/title, aboutShort subtitle/description/longDesc, testimonial subtitle, restaurant/wedding descriptions generized to Najma/Alger.
- `admin.json`: `loginSubtitle` → Hôtel Najma; added `admin.demoAccess` and `admin.secureAccess`.

### Internal identifiers (cookie / localStorage keys carrying the old initials)
- `components/providers/LanguageContext.tsx`: `hotel_hb_locale` → `hotel_demo_locale`
- `app/api/admin/login/route.ts` + `app/api/admin/logout/route.ts`: `hotel_hb_admin_token` → `hotel_demo_admin_token`

### Assets — `public/images/`
- **Logo** (`logo/logo.png`): authored a new gold monogram "NAJMA" SVG and rendered to PNG via sharp (1024×320, transparent, gold-on-dark-ready). No external license; original copyrighted material.
- **12 photos** replaced (same filenames/paths) with royalty-free stock via **Pexels API** + **Pixabay API** (keys passed via process env only, never written to repo), resized + converted to `.webp` with sharp. Source + license per image in the table below. User performs a **manual visual pass** afterward (no image model available here).
- `hero/hero-bg.svg` (generic gradient) left untouched.

#### Image source & license manifest

| File | Source (ID) | Photographer | License |
|---|---|---|---|
| `hero/hotel-entrance.webp` | Pexels 36644768 | Klaus Nenning | Pexels |
| `hero/hotel-lobby.webp` | Pexels 14011664 | Quang Nguyen Vinh | Pexels |
| `rooms/room-standard-double.webp` | Pixabay 4416515 | Engin_Akyurt | Pixabay |
| `rooms/room-standard-twin.webp` | Pixabay 1749602 | ManuelaJaeger | Pixabay |
| `restaurant/hotel-restaurant-main.webp` | Pexels 32568165 | Magda Ehlers | Pexels |
| `restaurant/hotel-restaurant-dining.webp` | Pixabay 646678 | AlexNut | Pixabay |
| `restaurant/hotel-restaurant-breakfast.webp` | Pixabay 1789965 | Michael_Luenen | Pixabay |
| `pool/hotel-pool.webp` | Pexels 10739637 | evan | Pexels |
| `pool/hotel-indoor-pool.webp` | Pixabay 3317766 | MrJayW | Pixabay |
| `gym/hotel-gym.webp` | Pixabay 828726 | scottwebb | Pixabay |
| `events/hotel-ballroom.webp` | Pexels 30311728 | Huy Nguyễn | Pexels |
| `conference/hotel-conference-room.webp` | Pixabay 2181916 | Pexels | Pixabay |

## Why

- Phase 6 was the **final planned phase** of the refactor: making the template a believable, brand-neutral demo instead of the original real hotel. A fictional brand ("Hôtel Najma") reads as a real property for prospects without claiming Bouteldja's real identity/contact data.
- Env-driven demo credentials + visible badge let a prospect try the demo without hunting for creds, and honestly labels the artifact as a demo (Orkestrix Systems).
- `priceRange` derived from the rate card removes the last hardcoded price from metadata so the two can't drift.

## How to Verify

1. `npm run dev` (port 3000; requires `ADMIN_USERNAME`/`ADMIN_PASSWORD`/`JWT_SECRET`/`CRON_SECRET` in env — see below).
2. **Public identity**: `/`, `/about`, `/contact`, `/rooms` render 200; page source contains "Najma" and **no** "Bouteldja"/"Sidi Moussa"/"hotel-hb.dz".
3. **jsonLd**: `/` contains `Najma Palace & Suites` and `17500 DZD - 59000 DZD` (derived priceRange) and no `hotel-hb.dz`.
4. **Badge**: `عرض تجريبي — Orkestrix Systems` (ar) visible on `/` and on `/admin/dashboard` (logged-in).
5. **Login**: `GET /admin/login` SSR HTML contains the demo username (`admin`) and password (`hotelhb2026password`); `POST /api/admin/login` with those returns 200/`success:true`; footer shows the localized `admin.secureAccess` text.
6. **Reservation prefix**: from a session, `POST /api/reservations` returns `201` with a `NP-2026-XXXX` id.
7. `npx tsc --noEmit` → **exit 0**. `npm run lint` → **0 errors** (7 pre-existing warnings only; the old login `no-explicit-any` error and `KeyRound` warning are gone).
8. **Zero-reference sweep**: `rg -i 'bouteldja|بوثلجة|sidi moussa|سيدي موسى|hotel[-_.]hb|hotelhb|551915712|213551915712|hotel\.bouteldja|HB-2026|Hotel HB|Hôtel HB|فندق HB|hotel-hb\.dz|maps\.app\.goo\.gl'` across `app components lib domain services repositories prisma messages public config middleware.ts` → **zero hits**. (Remaining: npm package name in `package.json`/`package-lock.json` and `.env.example` placeholders — intentionally allowed.)
9. **DB reset**: `prisma db execute` truncate → 0 rooms / 0 reservations.
10. **Manual visual pass** on the 12 replacement photos + new logo.

## Environment variables added or changed

- **No names added/removed.** `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, `DATABASE_URL`, `CRON_SECRET` unchanged.
- The values are currently **shell-injected** at dev-server start (`.env.local` holds only `DATABASE_URL`); nothing secret is written to the repo.
- `.env.example` placeholder literals (`hotelhb2026password`, `hotelhb-super-secret-jwt-key-2026`) are **intentionally retained** as the tracked human-readable reference (allowed single location per Phase 2 rule).

## Rollback

- Revert `config/hotel.ts` to the Bouteldja identity; restore old metadata/keywords/priceRange in `app/layout.tsx`; revert `HB-2026-` in both `reservation.service.ts` and `lib/seed.ts`; restore `ROOM_TYPES_LIST` prices in `lib/constants.ts`; revert `[Hotel HB]` in `lib/logger.ts`; delete `components/layout/DemoBadge.tsx`, `components/admin/AdminLoginCard.tsx`, `lib/demo-access.ts`; restore the original single-file login page and the `hotel_hb_admin_token`/`hotel_hb_locale` identifiers; restore the original `public/images/*` (the `WebP`/`PNG` originals were overwritten — re-download from the table above if needed, or restore from backup).
