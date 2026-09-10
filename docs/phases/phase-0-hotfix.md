> **Type:** Implementation Phase | **ID:** Phase 0 | **Status:** CLOSED | **Based On:** — | **Superseded By:** —

# Phase 0 — Hotfix (tsconfig `@/*` alias + .env.example tracked)

## What changed

- `tsconfig.json` — added the `@/*` path alias the whole codebase already imports with, mapped to the project root via `baseUrl: "."` and `paths: { "@/*": ["./*"] }`, on top of the standard Next.js App Router configuration (App Router includes, `next` typed-routes plugin, `jsx: react-jsx`, `moduleResolution: bundler`, incremental/noEmit for `next build`).
- `.gitignore` — the broad `.env*` pattern was replaced with explicit ignores for `.env`, `.env.local`, and `.env.*.local`, plus an un-ignore (`!.env.example`) so `.env.example` stays tracked as the reference template.

## Why

Without the alias every `@/...` import in the app was untyped, failing `tsc --noEmit` and `next build` on every file (pre-existing blockade, logged in `docs/archive/notes-journal.md`). And `.env*` silently excluded `.env.example` from version control, so the file relied on "intentional ambiguity" in `docs/archive/notes-journal.md` to exist. This hotfix unblocks Phase 2 type-checking and makes env-file tracking explicit.

## How to verify

1. Type/lint check (done):
   - `npx tsc --noEmit` — exits clean, all `@/` imports resolve against the project root.
   - `npm run lint` — no new errors.
2. Runtime check (done):
   - `npm run dev` — dev server starts (`Ready`) and serves the home page over HTTP.
3. Env tracking:
   - `git check-ignore .env` and `git check-ignore .env.local` report the files as ignored.
   - `git check-ignore .env.example` exits non-zero (not ignored), i.e. `.env.example` remains tracked.

## Environment variables added/changed

- None. `.env.example` content is unchanged; this phase only fixes whether it is tracked.

## Rollback

- Remove `baseUrl`/`paths` from `tsconfig.json` (reverts the alias resolution).
- Restore the `.gitignore` block to `# env files (can opt-in for committing if needed)\n.env*`.
- Delete `docs/phases/phase-0-hotfix.md`.