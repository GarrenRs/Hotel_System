# PROJECT STATE — Hotel Management System

> **Read this file first in every session**, then `docs/architecture/` (current truth),
> then any OPEN study in `docs/studies/`, then only as needed the phase history in
> `docs/phases/`. See `docs/README.md` for how the docs are organized.

**Updated:** 2026-09-10 (Phase 10 — ST-001 + ST-002 lifecycle)

---

## 1. Current Status

Production template for a **single-tenant hotel management app** (Next.js App Router
+ Prisma + PostgreSQL/Supabase + TypeScript). One hotel, one front desk, one
persistent dataset: a guest books on the public site; an authenticated front-desk
employee manages it from the admin panel.

- **Phase 10 is IMPLEMENTED and Tier 1 verified**, but **not yet CLOSED** — it awaits
  the owner's Tier 2 walkthrough (see §8). No other implementation phase is open.
- The full reservation/room lifecycle (ST-001) and the customer-journey
  redesign (ST-002) are now current architecture: 5 reservation states, physical room
  states, row-locked transactional transitions, date-aware + capacity-aware booking.
- Deployed on **Vercel** (admin env vars + `DATABASE_URL` set).

## 2. Current Objective

**Phase 10 — Reservation & Customer Journey Lifecycle (ST-001 + ST-002)** —
IMPLEMENTED 2026-09-10; static checks (`tsc`, lint, production build) and a 28-scenario
live verification suite (`scripts/verify-st-001.ts`) all green.

The immediate next step is **Tier 2: the owner walks the system through the sections
listed in `docs/phases/phase-10-lifecycle.md`** and the ST-001/ST-002 docs. Only a
positive owner walkthrough moves Phase 10 from IMPLEMENTED to CLOSED.

## 3. Active / Closed Phase & Study

| Kind | ID | Name | Status |
|---|---|---|---|
| Study | **ST-001** | Reservation / Room / Stay Lifecycle Analysis | APPROVED (implemented in Phase 10, pending Phase 10 closure) |
| Study | **ST-002** | Customer Journey Redesign (guest-facing) | APPROVED (implemented in Phase 10, pending Phase 10 closure) |
| Phase | 10 | Phase 10 — Reservation & Customer Journey Lifecycle | IMPLEMENTED (Tier 1 verified) — **awaiting owner Tier 2** |
| Phase | 0–8 | Foundation, security, room management, operational line | CLOSED (see `docs/phases/README.md`) |

## 4. Active Studies (awaiting decision)

None open for design. ST-001 and ST-002 are **APPROVED and implemented in Phase 10** but
stay in that status (not CLOSED) until Phase 10 itself is closed after the owner's Tier 2
walkthrough — see `docs/phases/phase-10-lifecycle.md`. The architecture index
(`docs/architecture/README.md`) is the current truth for what now runs.

## 5. Current Architecture References

`docs/architecture/README.md` is the index of what is **true in the system now**
(implemented behavior only):

- `domain-model.md` — Prisma models, enums, layering
- `reservation-lifecycle.md` — 5-state reservation machine + room side effects
- `security-model.md` — lazy env validation, JWT admin, public/admin API split
- `availability-and-booking.md` — shared offer rule, `/api/rooms/available`,
  transactional booking + `SELECT FOR UPDATE`, room operational toggles

Operational: `docs/reference/deployment.md` (per-client rollout incl. `migrate deploy`),
`docs/reference/environment-notes.md`, `docs/reference/project-conventions.md` (binding rules).

## 6. Known Issues (unresolved, do not fix ad hoc)

Carried from `docs/archive/notes-journal.md` + audit reports; each is tracked, none is
authorized for fixing without its own phase/study:

- `POST /api/admin/login` — no rate-limiting / account lockout (pre-launch security review item).
- `POST /api/reservations` — no rate-limiting / spam protection.
- MAINTENANCE-triggered warnings are advisory only; rebooking/rehousing is manual.
- Early check-in / hold-expiry / no-show auto-cancel policies do not exist yet (a
  future operational study).
- `middleware.ts` → `proxy.ts` migration (Next middleware deprecation) — pending.
- `tsconfig.tsbuildinfo` not in `.gitignore`.
- No `npm run prisma:...` convenience scripts in `package.json`.
- Migration naming quirk: the deployed lifecycle migration is titled
  `20260910061244-phase-9-lifecycle` although the phase is registered as **Phase 10**
  (phase-9 was already claimed by the study-era analysis record). Keep the migration
  folder name as-is (immutable DB history); see `docs/phases/phase-10-lifecycle.md`.

## 7. Deferred Work (deliberately out of scope until listed in a study/phase)

- Multi-user admin roles & users table.
- Payments / invoices / deposits.
- Email/SMS notifications.
- Guest self-service lookup portal.
- Walk-in booking; room add/edit UI.
- Rate limiting / spam protection on the public booking + admin login endpoints.
- Early check-in / hold expiry / no-show policies.

## 8. Next Authorized Action

**Tier 2 owner walkthrough of Phase 10.** From a seeded database
(`npx tsx prisma/seed.ts`, or a fresh install per `docs/reference/deployment.md`),
verify the guest booking flow (date-aware form, capacity, reference + room number on
success) and the admin flows described in `docs/phases/phase-10-lifecycle.md` (§How to
verify, Tier 2). On a positive result — and only then — flip to CLOSED **at the same
moment, together**: Phase 10 (`docs/phases/phase-10-lifecycle.md`,
`docs/phases/README.md`), and studies ST-001/ST-002 (`docs/studies/README.md` +
their headers) + `docs/PROJECT_STATE.md` §3/§4. No new implementation may start
before that closure under the “one phase at a time” rule.

---

## Change Log

- **2026-09-10** — Phase 10 (ST-001 + ST-002) implemented and Tier 1 verified (tsc,
  lint, production build, 28/28 live scenarios incl. 15-parallel exactly-one-success).
  ST-001/ST-002 marked APPROVED (implemented in Phase 10, pending Phase 10 closure);
  Phase 10 marked IMPLEMENTED — awaiting owner Tier 2. §6 pruned of the issues Phase 10
  fixed (invalid-status 500, status-only availability, Room 401 contradiction,
  reservations-page copy, “45+ rooms” hero). Studies flip to CLOSED only when Phase 10
  itself is closed.
- **2026-09-08** — Added **ST-002** (Customer Journey Redesign) as an additional OPEN
  study in §3/§4; the ST-002 §4 entry was created without altering the ST-001 entry.
  No code changes.
- **2026-09-08** — Rewritten as the slim current-state entry as part of the
  Documentation Architecture Refactor. Phase tracker moved to `docs/phases/README.md`,
  global rules moved to `docs/reference/project-conventions.md`, unexpired open items
  condensed here from `docs/archive/notes-journal.md`, phase history preserved intact.
- 2026-XX — previous entries: see `docs/archive/notes-journal.md` change history and
  the phase docs under `docs/phases/`.