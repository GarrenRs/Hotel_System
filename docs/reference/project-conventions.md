# Reference — Project Conventions (binding)

> These global rules govern every task/phase. Moved here from the former
> `docs/PROJECT_STATE.md` §2 to give conventions a stable home.

1. **Closed scope** — touch only files listed in the current phase/task. Anything
   else observed goes into a known-issues list (see `docs/PROJECT_STATE.md` §6) or a
   study/audit, never fixed silently.
2. **One phase at a time** — finish, document, stop, wait for explicit approval before
   starting the next.
3. **Match existing architecture** — `domain/` → `repositories/` → `services/` →
   `app/api/` layering, `ApiResponse<T>` wrapper, and the naming conventions already
   used by `Reservation` must be mirrored exactly for any new entity (e.g. `Room`).
4. **No silent defaults for secrets** — a missing env var makes the app throw a clear
   startup error; never a hardcoded fallback.
5. **Documentation is mandatory** — every implementation phase produces exactly one
   phase doc with: Type/ID/Status metadata, What changed / Why / How to verify /
   Environment variables added or changed / Rollback. Every design change begins as a
   study in `docs/studies/` with `Based On` links to its inputs.
6. **Realism over placeholders** — all content must read as a real, professionally run
   hotel. Never "Test", "Lorem", "Demo Room 1", "Client X".
7. **Stack constraints** — Next.js App Router + Prisma + PostgreSQL (Supabase) +
   TypeScript only. No new frameworks or state libraries. Postgres only — do not
   reintroduce SQLite.
8. **Current truth discipline** — `docs/architecture/` documents only what is actually
   implemented and verified. Unimplemented study designs never appear there as current.
9. **History is immutable** — phase numbering is historical and never renumbered;
   archived/historical docs are frozen (corrections are appended as notes, not edits).