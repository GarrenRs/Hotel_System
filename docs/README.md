# Documentation System

This folder is the project's documentation system, reorganized from a flat phase
history into a small, searchable, non-duplicated structure. Its job is to let any
agent (or human) quickly answer three questions:

1. What is the system doing **right now**?   → `PROJECT_STATE.md` + `architecture/`
2. What is being **proposed/designed** next?  → `studies/`
3. What was **done and why** (history)?       → `phases/`, `audits/`, `archive/`

## Lifecycle pipeline

```
AUDIT → STUDY → (APPROVAL) → IMPLEMENTATION PHASE → VERIFICATION → CLOSURE
```

- **Audits** record *findings* about the existing system (problems, gaps).
- **Studies** turn those findings into a *design* (problem, alternatives, decision, trade-offs).
- An **implementation phase** is only created once a study is approved, and its doc
  references that study (`Based On:`).
- Until a study is implemented and verified, its design is NOT part of current truth.

## Folder map

| Location | Contents | Read as |
|---|---|---|
| `PROJECT_STATE.md` | Current status, active study/phase, known issues, next authorized action | **Current truth — read first** |
| `audits/` | Findings reports (pre-change). `audits/README.md` has their dispositions | Historical + still-valid findings |
| `studies/` | Design analyses (problem → recommended model → decisions). Cannot enter `architecture/` until implemented | Designs awaiting/undergoing implementation |
| `phases/` | Numbered implementation records (0–8, 10), each tagged with a status header | Historical execution record |
| `architecture/` | What is **true in the running system now** (implemented only) | Current truth |
| `reference/` | Operational info used constantly: deployment checklist, environment gotchas, project conventions | Current truth (operational) |
| `archive/` | Frozen records: the pre-refactor working journal. Not current truth | History only |

## Reading order for a new session

1. `PROJECT_STATE.md` — current status and next authorized action.
2. `architecture/` — what the system does today (implemented behavior).
3. `studies/` — any OPEN study about to be implemented.
4. `phases/` — only as needed for detail/history behind the architecture.

## Rules

- Each doc has one clear purpose and one home. If a fact needs two homes, put it in
  the authoritative one and link from the other.
- Every phase/study/audit carries a metadata header (Type / Status / Based On /
  Supersedes / Superseded By / Implementation Phase).
- Historical docs stay frozen; a correction adds a note — do not rewrite history.
- The phase numbering (0–8, 10) is historical and never renumbered.
- `archive/` content is historical and must not be read as current architecture.
- New observations: current operational gotchas → `reference/environment-notes.md`;
  new findings about the system → `audits/` or an OPEN study; decisions to change
  the system → a study, never a silent code change.

## Change log

- **2026-09-10** — Owner Tier 2 walkthrough confirmed Phase 10; Phase 10 and studies
  ST-001/ST-002 flipped to **CLOSED** together (phase doc, `phases/README.md`,
  `studies/README.md`, both study headers, `PROJECT_STATE.md` §3/§4). Repo pushed to
  git main (`b9fdba4`) for the field trial.
- **2026-09-10** — Phase 10 (ST-001 + ST-002) implemented and Tier 1 verified; ST-001/ST-002
  flipped to APPROVED (implemented in Phase 10, pending Phase 10 closure), Phase 10 registered
  in `phases/README.md` as IMPLEMENTED (awaiting owner Tier 2), `architecture/*` rewritten to
  the 5-state lifecycle + shared offer rule, `PROJECT_STATE.md` §6 pruned of the fixed issues,
  `environment-notes.md` and `deployment.md` updated for migrations + lazy env.
- **2026-09-08** — Documentation Architecture Refactor:
  - Flattened root into `audits/ studies/ phases/ architecture/ reference/ archive/`.
  - `phase-9-lifecycle-analysis.md` → `studies/ST-001-reservation-room-lifecycle.md`
    (design study, not an implemented phase).
  - `DEPLOYMENT.md` → `reference/deployment.md`.
  - `notes.md` → `archive/notes-journal.md` (verbatim); actionable parts distilled
    into `reference/environment-notes.md` and `PROJECT_STATE.md`.
  - `architecture/*` created by distilling **implemented** behavior only.
  - See the refactor result in the conversation that performed it.