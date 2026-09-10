# Studies — Design & Analysis Registry

This folder holds design analyses: a study is created when a problem (from an
audit, from current limitations, or from a product requirement) needs a concrete
design before implementation can be authorized.

A study moves through this lifecycle:

```
OPEN → (design + review) → APPROVED → (implementation phase created) → CLOSED
```

A study that is not implemented does **not** become current architecture. Its
design is recorded here; promote it to `architecture/` only after implementation
and verification.

## Study Registry

| ID | Title | Status | Phase |
|---|---|---|---|
| ST-001 | Reservation / Room / Stay Lifecycle Analysis | APPROVED (implemented in Phase 10, pending Phase 10 closure) | Phase 10 |
| ST-002 | Customer Journey Redesign (guest-facing) | APPROVED (implemented in Phase 10, pending Phase 10 closure) | Phase 10 |

**Status codes:** OPEN (design in progress or awaiting authorization), APPROVED
(design authorized for implementation), REJECTED, SUPERSEDED (by a later study),
CLOSED (implemented — see the linked phase).

## ST-001 summary

**`ST-001-reservation-room-lifecycle.md`** — reservation/room lifecycle redesign:
5 reservation states (NEW → CONFIRMED → CHECKED_IN → CHECKED_OUT + CANCELLED),
4 physical room states (AVAILABLE/OCCUPIED/CLEANING/MAINTENANCE, RESERVED
derived), new `GET /api/rooms/available`, `PATCH /api/reservations/[id] {status}`
endpoint, `SELECT FOR UPDATE` concurrency, check-in/check-out flows.

Based on all three audit reports (`docs/audits/`). A Final Architecture Review
was performed (verdict: READY, contingent on the five CHANGE decisions recorded
in §4 of the study file). **Implemented in Phase 10** together with ST-002; see
`docs/phases/phase-10-lifecycle.md` and the updated `docs/architecture/*`.

## ST-002 summary

**`ST-002-customer-journey-redesign.md`** — guest-facing companion to ST-001:
period-correct availability in the booking form (consumes the shared offer rule /
`GET /api/rooms/available`), honest guest-facing lifecycle copy (NEW at submit;
CHECKED_IN/CHECKED_OUT back-of-house only), guest booking lookup deferred, no
public page added or removed, and zero schema changes. **Implemented in Phase 10**.