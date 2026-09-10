> **Type:** Implementation Phase | **ID:** Phase 4c | **Status:** CLOSED | **Based On:** Phase 4b observations | **Superseded By:** Phase 8

# Phase 4c — Edge Runtime Background Seeding Fix

Bugfix phase (between Phase 4b and Phase 5). Resolves the last open observation from Phase 4b — that `middleware.ts`'s fire-and-forget seeding is not guaranteed to complete on a serverless **Edge** deployment. No new features; the Phase 4b client-side bounded retries are kept unchanged as a safety net.

## What changed

- **`middleware.ts`** — the background self-fetch to `/api/demo/init` now runs inside `event.waitUntil(...)` instead of being a bare `void fetch(...).catch(...)`:
  - The middleware signature gains the platform-provided second argument: `middleware(request: NextRequest, event: NextFetchEvent)`.
  - The fetch promise is passed to `event.waitUntil(...)`, which tells the Edge runtime to keep this invocation alive until the promise settles (response sent to the visitor is unaffected).
  - Same request shape (POST + session cookie), same best-effort `.catch`, same matcher (init route already excluded, so no recursion). Cookie handling and first-request behavior are unchanged.

## Why

- **Runtime target, confirmed empirically for this project (Next.js 16.2.12):** the legacy `middleware.ts` file convention still compiles for the **Edge** runtime. Two independent pieces of evidence from this project's own dev server:
  1. A temporary runtime probe logging `process.versions?.node` printed **`N/A`** in middleware — the Edge sandbox ships no `process.versions`.
  2. Next's static analysis flagged the probe line with **"A Node.js API is used (process.versions …) which is not supported in the Edge Runtime."**
  (Note the `proxy` file convention would default to the Node runtime since v16.0.0, but this project intentionally keeps the deprecated `middleware.ts` convention per the Phase 3 spec, so Edge applies here.)
- **Why `event.waitUntil` rather than `after()`:** `next/server`'s `after()` is documented for Server Components, Server Functions, Route Handlers, and the **Proxy** file — not for the legacy middleware/Edge convention. On Edge, the correct, native, non-deprecated primitive for "finish background work after the response" is the **`NextFetchEvent.waitUntil(promise)`** primitive, present on the installed `NextFetchEvent` type (`node_modules/next/dist/server/web/spec-extension/fetch-event.d.ts`), used by Next's own docs as the canonical middleware background-fetch pattern, and backed by a documented platform guarantee: it *"extends the lifetime of a serverless invocation until all promises passed to waitUntil have settled."*
- **Both constraints are satisfied by construction:**
  1. **First response not blocked** — `waitUntil` is registered synchronously and the `NextResponse` is returned immediately; nothing is awaited (measured: see below).
  2. **Seeding guaranteed to complete** — the seeding promise is now *rooted* in the platform's invocation-lifetime mechanism rather than being un-tracked work. The platform keeps the function alive until the seed's fetch settles, so the failure mode Phase 4b flagged (platform tearing down un-awaited work when middleware returns) is removed.
- The Phase 4b client retries remain, so even a total seeding failure (e.g. DB down) still presents a clean, non-broken admin UI.

## How to verify

1. **Runtime evidence (done, dev server)** — see "Why" above; the probe also confirmed `event.waitUntil` is present on the runtime event object (`hasWaitUntil = true`). The probe line was removed before finalizing; the final `middleware.ts` triggers no Edge-runtime analysis warnings.
2. **First-load latency (done, dev server, warm Turbopack)** — fresh no-cookie visitor loads in **~250 ms** (on par with the Phase 4b baseline of 0.21–0.23s and the 0.19–0.32s cookie baseline). Seeding does not delay the response.
3. **Background completion (done, dev server)** — server log sequence after a fresh no-cookie visit:
   - `GET / 200 in 200ms` (response to the visitor first),
   - `[INFO] Demo session seeded | {"sessionId": …}` and `POST /api/demo/init 200 in 1506ms` **after** that response,
   - then `GET /api/reservations` (with that session's cookie) returns the full **8 seeded reservations** — the seed ran to completion post-response.
   - Honest limitation: local dev runs the Next server itself, so it cannot reproduce a serverless Edge teardown; the completion guarantee rests on the `waitUntil` contract documented by Next/Vercel for serverless Edge invocations, not on local observation.
4. **Schema/types/lint (done)** — `npx tsc --noEmit` exits 0. `npm run lint` reports only the two pre-existing `catch (err: any)` errors (login page:45, BookingForm:50) — no new errors or warnings from `middleware.ts`.
5. **Cleanup (done)** — demo database left at its pre-test state (0 rooms / 0 reservations); dev server stopped; probe and temp files removed.

## Environment variables added or changed

- None.

## Rollback

1. Revert `middleware.ts` to the Phase 4b form: signature `middleware(request: NextRequest)` and `void fetch(...).catch(...)` for the init self-fetch.
2. Delete `docs/phases/phase-4c-edge-runtime-fix.md` and revert the Phase Tracker/changelog in `docs/PROJECT_STATE.md` and the resolved entry in `docs/archive/notes-journal.md`.