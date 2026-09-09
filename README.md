# RLAP

Patient booking platform for diagnostics (radiology + lab). This is the skeleton monorepo — no
product features yet, just the wiring needed to run all three apps locally.

## Layout

```
/apps/web       Next.js 14 (App Router) — patient booking widget + admin portal, one app,
                role-gated by login                                       (http://localhost:3000)
/apps/api       Node/Express + TypeScript backend                         (http://localhost:4000)
/packages/db    Prisma schema + generated client, shared by apps/api
/packages/types Shared TypeScript types (cart, booking, screens, enums)
/docs           Spec docs
```

`apps/web` used to be two separate Next.js apps (patient widget + admin portal, deployed
separately). They're now one app so the whole frontend deploys as a single Vercel project — see
"Roles & login" below for how the two are kept apart at runtime. `apps/web` depends on
`@rlap/types` directly; `apps/api` depends on both `@rlap/types` and `@rlap/db`. Packages are
linked via pnpm workspaces (`workspace:*`), so changes to a package are picked up by its
consumers without publishing anything.

## Roles & login

There's one login at `/login` with two hardcoded accounts:

| Role    | Email               | Password     | Lands on          |
| ------- | -------------------- | ------------ | ------------------ |
| Admin   | admin@gmail.com       | admin@123    | `/admin/dashboard` |
| Patient | patient@gmail.com     | patient@123  | `/vijaya-diagnostics/book` |

`middleware.ts` enforces the split: an admin session can't reach the patient widget and vice
versa — each is redirected to their own home instead. The admin credentials aren't purely
cosmetic — they're checked against a real seeded `AdminUser` row via the API's existing admin
auth (`packages/db/seed.ts`'s `DEV_ADMIN_EMAIL`/`DEV_ADMIN_PASSWORD`, kept in sync with
`apps/web/lib/session.ts`), so the admin dashboard's data calls work exactly as before. The
patient side has no backing database check — it's a pure route gate in front of the existing
OTP-based booking flow, which is unchanged.

## Prerequisites

- Node.js >= 18.18
- pnpm (via `corepack enable` — this repo pins the version in `packageManager`)
- Docker (for local Postgres)

## Setup

```bash
# 1. Install dependencies for every workspace package
pnpm install

# 2. Start Postgres
docker compose up -d

# 3. Copy env files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
cp packages/db/.env.example packages/db/.env

# 4. Generate the Prisma client (needs DATABASE_URL from step 3)
pnpm db:generate
```

## Running everything

```bash
pnpm dev
```

This runs `dev` in every app under `/apps` in parallel:

- Web (patient widget + admin portal): http://localhost:3000
- API: http://localhost:4000 (try http://localhost:4000/api/health)

Run a single app instead with `pnpm --filter @rlap/web dev` (or `@rlap/api`).

## Other scripts

| Command                             | What it does                                         |
| ----------------------------------- | ---------------------------------------------------- |
| `pnpm build`                        | Builds all apps                                      |
| `pnpm lint`                         | Lints every workspace package                        |
| `pnpm typecheck`                    | Type-checks every workspace package                  |
| `pnpm format` / `pnpm format:check` | Prettier write / check across the repo               |
| `pnpm db:generate`                  | Regenerates the Prisma client in `packages/db`       |
| `pnpm db:migrate`                   | Runs `prisma migrate dev` against the local Postgres |
| `pnpm db:studio`                    | Opens Prisma Studio                                  |

## Tooling

- **Package manager**: pnpm workspaces (`pnpm-workspace.yaml`)
- **Language**: TypeScript everywhere, sharing a base config from `tsconfig.base.json`
- **ORM**: Prisma against PostgreSQL (`packages/db`)
- **Styling**: Tailwind CSS in both Next.js apps
- **Lint/format**: shared ESLint config (`.eslintrc.json`) + Prettier (`.prettierrc.json`), each
  app/package extends the root config
- **Local Postgres**: `docker-compose.yml` (user/pass/db all `rlap`, port 5432)

## Adding domain models

`packages/db/prisma/schema.prisma` currently has no models — add them there as features are
built, then run `pnpm db:migrate` and `pnpm db:generate`. Shared request/response and domain
types (cart, booking, screens, enums) belong in `packages/types/src`.
