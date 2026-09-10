# Phases — Implementation History

This folder contains the numbered implementation phase records (0–8, 10). The
numbering is **historical and immutable** — do not renumber or re-sequence.

Each file carries a metadata header with its status. Phases that describe
functionality later removed by Phase 8 (demo sessions, per-visitor seeding,
the demo badge) are marked `Superseded By: Phase 8` — the design decisions
and rationale are preserved for traceability.

## Phase Registry

| Phase | Name | Status | Based On | Notes |
|---|---|---|---|---|
| 0 | Hotfix — tsconfig `@/*` alias + `.env.example` tracked | CLOSED | — | Foundation blocker |
| 1 | Database Foundation — Postgres + Room model + conflict logic | CLOSED | — | Added Room schema + `hasConflictingReservation` |
| 2 | Security Hardening — env validation, no silent secret fallbacks | CLOSED | Phase 1 | `lib/env.ts` startup guard |
| 3 | Isolated Demo Sessions — cookie, middleware, cleanup | CLOSED (SUPERSEDED) | — | Removed entirely in Phase 8 |
| 4 | Realistic, Self-Renewing Seed Data | CLOSED (SUPERSEDED) | — | Removed in Phase 8; seed tool simplified |
| 4b | Bugfixes — reservation ref uniqueness + first-load latency | CLOSED (SUPERSEDED) | Phase 4 | Fixups removed in Phase 8 |
| 4c | Edge Runtime Background Seeding Fix | CLOSED (SUPERSEDED) | Phase 4b | Fixups removed in Phase 8 |
| 5 | Room Management UI (admin grid + public booking flow) | CLOSED | Phase 1 | Rooms API + BookingForm |
| 6 | Generic Template & Presentation Layer (branding, demo badge) | CLOSED (PARTIAL) | — | Branding/design kept; demo badge removed in Phase 8 |
| 7 | Close the First Operational Line (guest ↔ front-desk) | CLOSED | audits/ | JWT auth, conflict fix, copy accuracy |
| 8 | Strip Demo Layer, Finalize Production Template | CLOSED | Phase 7 | Last planned structural phase |
| 10 | Reservation & Customer Journey Lifecycle (ST-001 + ST-002) | CLOSED | ST-001, ST-002 | 5-state lifecycle, row locks, date-aware booking |

**Status codes:** CLOSED (implemented, complete), CLOSED (SUPERSEDED) — content
describes functionality no longer in the running system (useful for historical
traceability only). Phase 10 was registered IMPLEMENTED (Tier 1 verified) pending the
owner's Tier 2 verification and became CLOSED on 2026-09-10 (project convention
"one phase at a time").

## Phase status verification rule

If a phase doc exists on disk but its changes are not reflected in the working
tree, treat that phase as **incomplete** regardless of the status above, fix the
table, and re-verify from the phase's "How to verify" section.

## Phase numbering

Never renumber historical phases. New work is always a new phase ID or a study
(`docs/studies/`). The numbering (0–8, plus 10 for the ST-001/ST-002 lifecycle
phase) was established during the project's implementation and is preserved for
traceability.