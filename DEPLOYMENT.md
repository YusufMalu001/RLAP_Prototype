# Deploying RLAP

This repo is a pnpm monorepo with three deployable pieces:

| App | What it is | Where it goes |
|---|---|---|
| `apps/api` | Express API — in-memory cart store + `setInterval` background sweepers | Render (or Railway/Fly) — needs a long-running process, **not** Vercel |
| `apps/web` | Patient-facing booking widget (Next.js) | Vercel |
| `apps/admin` | Internal ops dashboard (Next.js) | Vercel |

Deploy the API first — the two Next.js apps need its URL.

## 1. API → Render

A `render.yaml` blueprint is already in the repo root.

1. On [render.com](https://render.com), **New → Blueprint**, connect this GitHub repo. Render reads `render.yaml` automatically.
2. It will ask for three secret env vars it deliberately left blank (`sync: false` in the blueprint):
   - `DATABASE_URL` — your existing Neon Postgres connection string (from your local `.env`, or reuse the same one — it's already cloud-hosted, no migration needed)
   - `COOKIE_SECRET` — any long random string (don't reuse the local dev placeholder)
   - `GEMINI_API_KEY` — optional; leave blank and lab-test recommendations fall back to the rule-based recommender automatically
3. Deploy. Note the resulting URL, e.g. `https://rlap-api.onrender.com`.
4. Sanity check: `curl https://rlap-api.onrender.com/api/health` → `{"status":"ok",...}`.

**Free-tier caveat**: Render's free web services spin down after ~15 min idle and take ~30–60s to wake on the next request — the first booking request after a quiet period will be slow. Fine for a demo/prototype; upgrade the plan if that matters.

## 2. Web + Admin → Vercel

Create **two separate Vercel projects** from the same GitHub repo (Vercel's pnpm-monorepo support handles the shared `packages/*` automatically once Root Directory is set correctly — no extra config needed).

**Project 1 — web**
- Root Directory: `apps/web`
- Framework Preset: Next.js (auto-detected)
- Environment variable: `NEXT_PUBLIC_API_URL` = your Render API URL (e.g. `https://rlap-api.onrender.com`)

**Project 2 — admin**
- Root Directory: `apps/admin`
- Framework Preset: Next.js (auto-detected)
- Environment variable: `NEXT_PUBLIC_API_URL_ADMIN` = same Render API URL

Deploy both. Vercel gives each its own `*.vercel.app` URL (or attach a custom domain).

## 3. Known gaps to be aware of

- **Google OAuth / Stitch design-pull feature** (`apps/web/app/api/auth/*`, the now-unused `StitchAuthButton`): its redirect URI is hardcoded to `http://localhost:3000/api/auth/callback` in `.env.example`. This feature isn't wired into any current screen, so it's safe to ignore for this deploy — update `GOOGLE_OAUTH_REDIRECT_URI` and the Google Cloud Console redirect-URI allowlist first if you ever wire it up in production.
- **Admin session cookie**: already fixed to use `SameSite=None; Secure` in production so it survives the admin.vercel.app → api.onrender.com cross-site request — this only activates when `NODE_ENV=production` is set on the API (Render sets this by default for web services).
- **Slot-hold expiry / booking-reminder sweepers**: these rely on the API being a single, always-running process (true on Render). If you ever move to a platform that spins up multiple instances or serverless functions, they'd need to move to a shared store (Redis) and a real cron trigger instead of `setInterval`.
