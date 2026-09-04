# RLAP

Patient booking platform for diagnostics (radiology + lab). This is the skeleton monorepo — no
product features yet, just the wiring needed to run all three apps locally.

## Layout

```
/apps/web       Next.js 14 (App Router) — patient-facing booking widget   (http://localhost:3000)
/apps/admin     Next.js 14 (App Router) — admin portal                    (http://localhost:3001)
/apps/api       Node/Express + TypeScript backend                         (http://localhost:4000)
/packages/db    Prisma schema + generated client, shared by apps/api
/packages/types Shared TypeScript types (cart, booking, screens, enums)
/docs           Spec docs
```

`apps/web` and `apps/admin` depend on `@rlap/types` directly. `apps/api` depends on both
`@rlap/types` and `@rlap/db`. Packages are linked via pnpm workspaces (`workspace:*`), so changes
to a package are picked up by its consumers without publishing anything.

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
cp apps/admin/.env.local.example apps/admin/.env.local
cp packages/db/.env.example packages/db/.env

# 4. Generate the Prisma client (needs DATABASE_URL from step 3)
pnpm db:generate
```

## Running everything

```bash
pnpm dev
```

This runs `dev` in every app under `/apps` in parallel:

- Web: http://localhost:3000
- Admin: http://localhost:3001
- API: http://localhost:4000 (try http://localhost:4000/api/health)

Run a single app instead with `pnpm --filter @rlap/web dev` (or `@rlap/admin` / `@rlap/api`).

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
