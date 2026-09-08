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
2. Apply the Prisma schema to that database:
   - `npx prisma generate`
   - `npx prisma db push` (the project has no committed migration files; `db push` is the current schema-sync flow)
3. **Optional — realistic starter data**: run `npx prisma db seed` once to load the 13-room / 8-reservation sample set (relative dates). Only do this on a brand-new database, never on one holding real guest data.

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
- Confirm admin APIs require the admin JWT cookie (`hotel_admin_token`) and the public booking flow (`GET /api/rooms`, `POST /api/reservations`) works with **no cookie at all**.
- Run `npx tsc --noEmit` (clean) and `npm run lint` (no new errors) before shipping.

## 5. After launch

- Reservations and room statuses persist across restarts — there is no reset mechanism. Anything deleted is gone.
- Single admin account; enabling multi-user roles is a future structural change (see `docs/notes.md`).