# Audits — Findings Reports

Audit reports record findings about the existing system: gaps, inconsistencies,
and risks observed before a planned implementation phase or at a project
checkpoint. They do not propose solutions — they describe what was found.

Each audit carries its dispositions below (what it fed into). When a finding is
fully addressed in a phase, the audit still stands as the original record of
what was found.

## Audit Registry

| File | Title | Performed | Fed Into | Key Findings |
|---|---|---|---|---|
| `customer-journey.md` | Customer Journey Audit | Pre-Phase 7 | Phase 7 (directly addressed most items) | BookingForm missing min-date; refresh button label; loading states; hero copy; gallery captions |
| `admin-panel.md` | Admin Panel Audit | Pre-Phase 7 | Phase 7 (Task 1: admin auth; rest into notes) | Admin pages/API completely unguarded; rooms PATCH returns 500; message-key reuse |
| `external-internal-balance.md` | External/Internal Balance Audit | Pre-Phase 7 | Phase 7 (conflict logic, audit trail visibility) | Audit-trail imbalance; public rooms vs admin rooms mismatch; cancellation double-block |

## What an audit is NOT

- Not a design proposal. Proposals go into `docs/studies/`.
- Not an implementation plan. Plans go into `docs/phases/` (phase docs).
- Not current architecture. Current truth goes into `docs/architecture/`.