# Architecture — Security Model (implemented)

> Current truth. Sources: `lib/env.ts`, `app/api/admin/login/route.ts`,
> `middleware.ts`, `lib/admin-auth.ts`, `lib/session.ts`, `domain/reservation/types.ts`.

## Environment validation (`lib/env.ts`)

Required variables: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, `DATABASE_URL`.

Validation is **lazy**: the first actual read of a variable (request time, never at
`next build`) triggers the check; a missing variable throws
`Missing required environment variable: X` with no silent default or hardcoded
fallback. Because the check is lazy, `next build` does not need the admin credentials
present — they are runtime credentials only. `.env.example` is tracked with
`<placeholder>` values; real `.env`/`.env.local` are ignored.

## The admin JWT

- **Login:** `POST /api/admin/login` (public, zod-validated body) verifies the env
  credentials, signs an HS256 JWT carrying the admin identity + `exp` (1-day), and sets
  it in the `hotel_admin_token` HttpOnly cookie.
- **Cookie name:** `ADMIN_TOKEN_COOKIE = 'hotel_admin_token'` (`lib/session.ts`).
- **Pages guard:** `middleware.ts` (Edge runtime) redirects every `/admin/*` path
  except `/admin/login` to `/admin/login` when the token fails `crypto.subtle` HMAC
  verification + `exp` check.
- **API guard:** `lib/admin-auth.ts` `requireAdminAuth(request)` (Node runtime,
  `jsonwebtoken`) protects the admin APIs and returns `401` otherwise.

> The middleware (`crypto.subtle`) and `lib/admin-auth.ts` (`jsonwebtoken`) verify the
> same HS256 signature + `exp` — a deliberate mirror. Keep both in sync.

## Public vs admin surface

| Flow | Endpoint(s) | Auth |
|---|---|---|
| Public (any visitor, no cookie) | `GET /api/rooms`, `GET /api/rooms/available`, `POST /api/reservations` | — |
| Admin login/logout | `POST /api/admin/login`, `POST /api/admin/logout` | credentials / cookie |
| Admin data APIs | `GET /api/reservations`, `GET/PATCH/DELETE /api/reservations/[id]`, `GET /api/admin/stats`, `PATCH /api/rooms/[id]` | `requireAdminAuth` |

## Known risks (carried, do not fix ad hoc)

- No rate limiting / account lockout on the admin login endpoint.
- No rate limiting / spam protection on `POST /api/reservations`.
- Single admin account only (multi-user roles deferred).
- `middleware.ts` is deprecated by Next’s migration to `proxy.ts` — pending.