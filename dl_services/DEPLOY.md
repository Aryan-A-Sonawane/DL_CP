# Deploying the DL inference service

The Next.js app (on Vercel) calls this service **server-side** after each Excel
upload to blend trained-model scores (70% DL + 30% JS). Vercel itself can't run
this Python/torch process, so it must be hosted separately and the app pointed
at it via the `DL_SERVICE_URL` env var. If `DL_SERVICE_URL` is unset/unreachable,
the app falls back to JS heuristics automatically (the dashboard still works).

Everything needed is in this folder + committed checkpoints, built by the
`Dockerfile` (CPU-only torch).

## Option A — Render (simplest, uses render.yaml at repo root)

1. Render → **New → Blueprint** → select the `DL_CP` GitHub repo → **Apply**.
   It reads `render.yaml`, builds `dl_services/Dockerfile`, and deploys.
2. When live, copy the URL (e.g. `https://dl-cp-models.onrender.com`).
3. Verify: open `<url>/health` → `{"status":"ok","models":["resilience","failure","role"]}`.
4. On **Vercel** → project → Settings → Environment Variables, add
   `DL_SERVICE_URL = <url>` (Production), then **Redeploy**.

> Free plan spins down after ~15 min idle; the first upload after idle may
> cold-start (~30–60s) and fall back to JS for that one call. Hit `/health`
> first to warm it, or use the `starter` plan to stay always-on.

## Option B — Railway

1. Railway → **New Project → Deploy from GitHub repo** → pick `DL_CP`.
2. In the service settings set **Root Directory = `dl_services`** (it then uses
   the Dockerfile automatically). Railway injects `$PORT`.
3. Generate a public domain, then set `DL_SERVICE_URL` on Vercel as above.

## Option C — Fly.io

```bash
cd dl_services
fly launch --no-deploy        # creates fly.toml; choose 512MB+ RAM
fly deploy
fly status                    # grab the https URL
```
Then set `DL_SERVICE_URL` on Vercel.

## Local

```bash
cd dl_services
python -m venv .venv && ./.venv/Scripts/python -m pip install -r requirements.txt
uvicorn main:app --port 8000
# health: http://localhost:8000/health
```

## Notes
- `/analyze` is an open, stateless inference endpoint (no DB, no PII). If you want
  to lock it down, add a shared-secret header check here and send it from
  `lib/engine/runAnalysis.ts`.
- Memory: torch CPU needs ~400–500 MB resident — pick a 512 MB+ instance.
