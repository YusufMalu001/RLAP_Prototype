# Deploying RLAP

This repo is a pnpm monorepo with two deployable pieces:

| App | What it is | Where it goes |
|---|---|---|
| `apps/api` | Express API — in-memory cart store + `setInterval` background sweepers | Render (or Railway/Fly) — needs a long-running process, **not** Vercel |
| `apps/web` | Patient booking widget **and** admin portal, one Next.js app, role-gated by login | Vercel — a single project |

`apps/web` used to be two separate Next.js apps (patient widget + admin portal) deployed as two
Vercel projects. They're now merged into one app — `/login` decides which half a visitor sees
(see README's "Roles & login"), so this is one deploy, not two.

Deploy the API first — the Next.js app needs its URL.

## 1. API → Render

A `render.yaml` blueprint is already in the repo root.

1. On [render.com](https://render.com), **New → Blueprint**, connect this GitHub repo. Render reads `render.yaml` automatically.
2. It will ask for three secret env vars it deliberately left blank (`sync: false` in the blueprint):
   - `DATABASE_URL` — your existing Neon Postgres connection string (from your local `.env`, or reuse the same one — it's already cloud-hosted, no migration needed)
   - `COOKIE_SECRET` — any long random string (don't reuse the local dev placeholder)
   - `GEMINI_API_KEY` — optional; leave blank and lab-test recommendations fall back to the rule-based recommender automatically
3. Deploy. Note the resulting URL, e.g. `https://rlap-api.onrender.com`.
4. Sanity check: `curl https://rlap-api.onrender.com/api/health` → `{"status":"ok",...}`.

**Free-tier caveat**: Render's free web services spin down after ~15 min idle and take ~30–60s to wake on the next request — the first request after a quiet period will be slow. Fine for a demo/prototype; upgrade the plan if that matters.

## 2. Web (patient + admin) → Vercel

One Vercel project, from this same GitHub repo.

- Root Directory: `apps/web`
- Framework Preset: Next.js (auto-detected)
- Environment variable: `NEXT_PUBLIC_API_URL` = your Render API URL (e.g. `https://rlap-api.onrender.com`)

Deploy. Vercel gives it a `*.vercel.app` URL (or attach a custom domain). Visit `/login` and sign in with either the admin or patient demo account (see README).

## 3. Known gaps to be aware of

- **Google OAuth / Stitch design-pull feature** (`apps/web/app/api/auth/*`, the now-unused `StitchAuthButton`): its redirect URI is hardcoded to `http://localhost:3000/api/auth/callback` in `.env.example`. This feature isn't wired into any current screen, so it's safe to ignore for this deploy — update `GOOGLE_OAUTH_REDIRECT_URI` and the Google Cloud Console redirect-URI allowlist first if you ever wire it up in production.
- **Admin session cookie**: already fixed to use `SameSite=None; Secure` in production so it survives the *.vercel.app → *.onrender.com cross-site request — this only activates when `NODE_ENV=production` is set on the API (Render sets this by default for web services). Note this is a *second*, separate cookie from the app's own `rlap_role` cookie — `rlap_role` gates which routes render in `apps/web` (same-origin, set by `apps/web`'s own `/api/session/login`), while this one authorizes the admin dashboard's actual data calls to `apps/api` directly.
- **RBAC is intentionally hardcoded, not a real auth system**: `apps/web/lib/session.ts` has exactly two accounts. The patient account is a pure route gate with no backend check; the admin account is checked against a real seeded `AdminUser` row (kept in sync in `packages/db/seed.ts`). If you ever need real patient accounts or more than one admin, this is the place to replace with a real identity provider.
- **Slot-hold expiry / booking-reminder sweepers**: these rely on the API being a single, always-running process (true on Render). If you ever move to a platform that spins up multiple instances or serverless functions, they'd need to move to a shared store (Redis) and a real cron trigger instead of `setInterval`.
