> **Type:** Reference (operational) | **Status:** CURRENT
> Moved from repo root `DEPLOYMENT.md` on 2026-09-08 (Documentation Architecture Refactor).

# Deployment Checklist — Hotel Management Template

Short, ordered checklist for handing a fresh client installation. Complete **every** step; each one is production-critical.

> This template is single-tenant: one hotel, one direct front desk, one database. There is no demo layer, no per-visitor session isolation, and no auto-reset — data is persistent and should be treated as real as soon as the first reservation is accepted.

## 1. Environment variables

Create `.env.local` (never commit it) with exactly these values:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Postgres (Supabase) pooled connection string — one **new Supabase project per client**, never reused |
| `ADMIN_USERNAME` | Real front-desk login username — not `admin` |
| `ADMIN_PASSWORD` | Strong, unique password — never the placeholder from the template |
| `JWT_SECRET` | Long random string (≥32 chars) that signs the admin login JWT |

`.env.example` is the committed reference — keep credentials there as `<placeholders>` only.

## 2. Database

1. Create a fresh Supabase project for the client; copy its pooled `DATABASE_URL`.
2. Apply the schema via the committed migration history:
   - `npx prisma generate`
   - `npx prisma migrate deploy` — applies `0_init` + the Phase 10 lifecycle
     migration (unique room numbers + reservation status backfill). `db push` is only
     for prototype throws now.
3. **Optional — realistic starter data**: run `npx prisma db seed` once to load the
   13-room / 9-reservation sample set (relative dates; exercises every lifecycle
   state). Only do this on a brand-new database, never on one holding real guest data.
   (Requires `DATABASE_URL` injected — see `environment-notes.md`.)

## 3. Branding

- `config/hotel.ts` — replace every value (name, address, phones, email, check-in/out, socials, map embed) with the client's real data. A comment block at the top of the file lists everything.
- `public/images/*` — replace all placeholder photography with the client's real images.

## 4. Pre-launch sweep

Check that no template residue remains (run from the project root):

```
rg -i "demo|session|orkestrix|hotelhb" --glob "!docs/**" --glob "!.next/**"
```

Expected: **zero matches** in production code. `docs/*` may still describe the removed demo phases historically — that is intentional.

- Confirm `/admin/login` renders **no credentials on screen**.
- Confirm admin APIs require the admin JWT cookie (`hotel_admin_token`) and the public
  booking flow (`GET /api/rooms`, `GET /api/rooms/available`, `POST /api/reservations`)
  works with **no cookie at all**.
- Run `npx tsc --noEmit` (clean), `npm run lint` (no new errors), and — against a running
  dev server with admin env injected — `npx tsx scripts/verify-st-001.ts` (28/28) before shipping.

## 5. After launch

- Reservations and room statuses persist across restarts — there is no reset mechanism. Anything deleted is gone.
- Single admin account; enabling multi-user roles is a future structural change (see `docs/archive/notes-journal.md`).