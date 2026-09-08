# PROJECT STATE — Hotel Demo Template Refactor

> **Read this file first in every new session.** Then read every file under `/docs/` in numeric order (`phase-0-*`, `phase-1-*`, ...) before touching any code. This file is the single source of truth for what is done, what is pending, and why decisions were made. If this file and a `docs/phase-N-*.md` file ever disagree, trust the `docs/` file (it documents what was actually built) and update this file to match.

---

## 1. Project Goal (do not lose sight of this)

This codebase is the **production template** for a single-tenant hotel management app (Next.js + Prisma + PostgreSQL/Supabase):
- One hotel, one front desk, one persistent dataset — a guest books on the public site, an authenticated front-desk employee manages it from the admin panel.
- Prevents room double-booking via a real `Room` entity (not just a room-type category).
- Admin surface is genuinely gated (JWT); the public booking flow works for any visitor without login.
- Deploys per client by swapping env vars, `config/hotel.ts`, and `public/images/*` (see `docs/DEPLOYMENT.md`).
- **No demo layer remains:** no per-visitor session isolation, no auto-reset, no auto-seeding, no badge, no on-screen credentials. Data persists across restarts. The earlier public-demo behavior was preserved by the owner as a separate snapshot outside this repository's history (Phase 8).

---

## 2. Global Rules (binding for every phase, copied from the master prompt)

1. **Closed scope** — touch only files listed in the current phase. Anything else observed goes into `docs/notes.md` under "Observed but out of scope," never fixed silently.
2. **One phase at a time** — finish, document, stop, wait for explicit "proceed to Phase N+1" before continuing.
3. **Match existing architecture** — `domain/` → `repositories/` → `services/` → `app/api/` layering, `ApiResponse<T>` wrapper, naming conventions already used by `Reservation` must be mirrored exactly for any new entity (e.g. `Room`).
4. **No silent defaults for secrets** — missing env var = app throws a clear startup error, never a hardcoded fallback.
5. **Documentation is mandatory** — every phase produces exactly one `docs/phase-N-<name>.md` with sections: What changed / Why / How to verify / Environment variables added or changed / Rollback.
6. **Realism over placeholders** — all demo/seed content must read as a real, professionally run hotel. Never "Test", "Lorem", "Demo Room 1", "Client X".
7. **Stack constraints** — Next.js App Router + Prisma + PostgreSQL (Supabase) + TypeScript only. No new frameworks or state libraries.

---

## 3. Phase Tracker

| Phase | Name | Status | Doc file |
|---|---|---|---|
| 0 | Hotfix — `tsconfig.json` alias + `.gitignore` fix | ✅ DONE | `docs/phase-0-hotfix.md` |
| 1 | Database Foundation — Postgres + `Room` model + conflict logic | ✅ DONE | `docs/phase-1-database.md` |
| 2 | Security Hardening — remove hardcoded secret fallbacks | ✅ DONE | `docs/phase-2-security.md` |
| 3 | Isolated Demo Sessions — `sessionId` cookie, middleware, 24h cleanup | ✅ DONE | `docs/phase-3-sessions.md` |
| 4 | Realistic, Self-Renewing Seed Data | ✅ DONE | `docs/phase-4-seed.md` |
| 4b | Bugfixes — reservation ref uniqueness + first-load latency | ✅ DONE | `docs/phase-4b-bugfixes.md` |
| 4c | Bugfix — Edge runtime background seeding fix | ✅ DONE | `docs/phase-4c-edge-runtime-fix.md` |
| 5 | Room Management UI (admin grid + public booking flow) | ✅ DONE | `docs/phase-5-rooms-ui.md` |
| 6 | Generic Template & Demo Presentation Layer (branding, demo badge) | ✅ DONE | `docs/phase-6-templating.md` |
| 7 | Close the First Operational Line (guest ↔ front-desk: real admin auth, conflict fix, form/booking/caption fixes) | ✅ DONE | `docs/phase-7-close-operational-line.md` |
| 8 | Strip Demo Layer, Finalize Production Template (remove sessions, seeding, badge, credentials display) | ✅ DONE | `docs/phase-8-production-template.md` |

**Milestone note:** Phase 7 **closed the first operational line** — a guest's booking flows end-to-end through a genuinely authenticated front-desk employee: the public flow (`GET /api/rooms`, `POST /api/reservations`) works for anyone, and every admin page/API is now gated by the admin JWT; cancelled stays no longer block rooms; room-card links preselect the room type; failed confirms show feedback; booking/caption/alt copy is accurate and localized.

**Closing statement (Phase 8):** this codebase is now the **production template** — single-tenant, persistent data, no demo layer of any kind. It is structurally distinct from the earlier public demo, which the owner preserved in a separate snapshot outside this repository's history. All planned structural phases are complete; this is the last planned structural phase.

**Resume instruction:** find the first row still marked `⏳ PENDING` (or `🔜 NEXT`) and start there. Never skip ahead even if a later phase looks independent — check its task list for dependencies on earlier phases first. (There are no pending rows today; Phase 8 was the last planned structural phase. Further work is tracked only in `docs/notes.md`.)

---

## 4. Key Architectural Decisions Already Made (do not re-litigate these)

- **No multi-tenant architecture, no per-visitor isolation.** One shared dataset for one hotel. Data is persistent — there is no auto-reset and no cleanup cron. Phases 3–6 built a per-session demo (session cookie, 24h cleanup, background seeding) that Phase 8 removed in full when the codebase was converted to the production template.
- **Admin is a real JWT-gated surface.** The front desk authenticates via `POST /api/admin/login` (env credentials) and holds the `hotel_admin_token` JWT cookie. Admin pages are guarded in `middleware.ts` (Edge, `crypto.subtle`) and admin APIs in `lib/admin-auth.ts` (Node, `jsonwebtoken`) — both verify the same HS256 signature + `exp` (see the mirroring note in `docs/notes.md`).
- **Guest booking flow is cookie-free and public.** `GET /api/rooms` + `POST /api/reservations` work with no cookie at all — required so site visitors can browse rooms and submit a booking request. Everything else in the admin surface requires the JWT.
- **Data integrity** — real `Room` rows (13-room realistic seed, CLI-only) with `roomNumber` + `status`; `hasConflictingReservation` blocks overlapping non-cancelled stays (the Phase 7 CANCELLED-exclusion is a permanent part of the logic).
- **Postgres/Supabase only** — SQLite was removed entirely in Phase 1; do not reintroduce it even for "quick local testing."
- **`.env.example` is always tracked in git**; only real `.env`/`.env.local` files are ignored. `.env.example` holds `<placeholder>` values and per-variable instructions (no secrets).

---

## 5. Known Open Items Not Yet Assigned to a Phase

(from `docs/notes.md` — carry forward, do not forget, do not fix ad hoc)

- **RESOLVED in Phase 6** — `reservationId` prefix `HB-` (was hardcoded in `services/reservation/reservation.service.ts`, tied to the original real hotel's initials) is now `NP-2026-` (Najma). Brand identity fully genericized across config/layout/messages/images — see `docs/phase-6-templating.md`.
- **RESOLVED in Phase 4 (naming updated in Phase 8)** — `prisma/seed.ts` no longer contains the literal word "test" or fixed calendar dates; it is a thin CLI wrapper around the shared seed tool (`seedDatabase()` in `lib/seed.ts`, renamed from `seedDemoData(sessionId)` in Phase 8) with relative dates and realistic, brand-neutral content.
- **RESOLVED in Phase 4 (naming updated in Phase 8)** — `npx tsc --noEmit` no longer fails on `prisma/seed.ts:74` (the old seed always set `sessionId`; the Phase 8 seed has no `sessionId` at all). The command passes with zero errors.
- **RESOLVED in Phase 3** — `repositories/reservation/prisma.repository.ts` `findAll()` previously used an untyped `where: any`; the Phase 3 rewrite replaced it with `Prisma.ReservationWhereInput`.
- **RESOLVED in Phase 3** — the `npx tsc --noEmit` error at `app/api/reservations/route.ts:55` (all-optional object passed where `CreateReservationInput` is expected) was fixed via an explicit `as CreateReservationInput` cast.
- `npx tsc --noEmit` currently passes with zero errors. The pre-existing `prisma/seed.ts:74` error (missing `sessionId`) was resolved in Phase 4.
- No `prisma generate`/`migrate` npm scripts exist in `package.json` — minor convenience gap, not blocking; can be added opportunistically during Phase 2 or later without violating closed scope (it's a script addition, not a behavior change) — confirm with project owner before adding.
- `next build` with Turbopack needs `NODE_OPTIONS=--max-old-space-size=4096` on the current dev machine — environment note, not a code issue.

---

## 6. What To Do If This Session Is Interrupted

1. Do not assume anything from memory — re-read this file and every `docs/phase-*.md` file that exists on disk.
2. Run `git log --oneline` and `git status` to confirm which phase's changes are actually committed vs. only documented.
3. If a `docs/phase-N-*.md` file exists but its changes are not reflected in the working tree, treat that phase as **incomplete** regardless of what this table says, fix the table, and re-verify from that phase's "How to verify" section before continuing.
4. Never start a new phase without updating the Phase Tracker table above immediately upon completion.

---

## 7. Change Log for This File

- Created after Phase 0 and Phase 1 completion, at the point of approving Phase 2, to guard against context loss on session interruption.
- Updated after Phase 2 completion: marked Phase 2 ✅ DONE, Phase 3 🔜 NEXT (full details in `docs/phase-2-security.md`).
- Updated after Phase 3 completion: marked Phase 3 ✅ DONE, Phase 4 🔜 NEXT (full details in `docs/phase-3-sessions.md`); removed the two Phase 1 lint/type items that Phase 3 resolved; `npx tsc --noEmit` now has a single known error (`prisma/seed.ts:74`, Phase 4 scope).
- Updated after Phase 4 completion: marked Phase 4 ✅ DONE, Phase 5 🔜 NEXT (full details in `docs/phase-4-seed.md`); resolved the two seed-related open items; `npx tsc --noEmit` now passes with zero errors.
- Updated after Phase 4b completion: added Phase 4b ✅ DONE (bugfix phase between Phase 4 and Phase 5 — full details in `docs/phase-4b-bugfixes.md`). Phase 5 remains 🔜 NEXT.
- Updated after Phase 4c completion: added Phase 4c ✅ DONE (bugfix phase between Phase 4b and Phase 5 — full details in `docs/phase-4c-edge-runtime-fix.md`). Phase 5 remains 🔜 NEXT.
- Updated after Phase 5 completion: marked Phase 5 ✅ DONE (full details in `docs/phase-5-rooms-ui.md`). Phase 6 is the next (first `⏳ PENDING`) row.
- Updated after Phase 6 completion: marked Phase 6 ✅ DONE (full details in `docs/phase-6-templating.md`). The template refactor's planned phases are now complete. Remaining follow-ups (deployment/hosting, wiring the `/api/demo/cleanup` cron on the platform, admin rooms status-code polish, `middleware.ts` → `proxy.ts` migration, manual visual pass on the new images/logo) are tracked in `docs/notes.md`.
- Updated after Phase 7 completion: marked Phase 7 ✅ DONE (full details in `docs/phase-7-close-operational-line.md`). Milestone: **closes the first operational line (guest ↔ front-desk employee)** — admin auth is now enforced (JWT) while the public booking path stays open, cancelled stays no longer double-block, room-card links preselect, failed confirms are visible, and booking/caption/alt copy is accurate + localized.
- Updated after Phase 8 completion: marked Phase 8 ✅ DONE (full details in `docs/phase-8-production-template.md`). The codebase is now the **production template**: session isolation, per-visitor seeding, `/api/demo/*`, the demo badge, on-screen credentials, and `CRON_SECRET` are all removed; the admin JWT cookie was renamed `hotel_demo_admin_token` → `hotel_admin_token`; `config/hotel.ts` and `.env.example` now carry deployment instructions; `docs/DEPLOYMENT.md` documents the per-client checklist. Goal section, decisions, and open items updated to describe the persistent single-tenant system rather than the self-resetting demo. No pending phases remain — this was the last planned structural phase.

