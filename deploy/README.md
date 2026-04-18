# Deploying Fame FMS

This directory has ready-to-use configs for three production hosting options.
Pick ONE for the backend; the frontend always goes on Vercel.

| Option | Backend config | Postgres | Redis | Complexity |
|--------|----------------|----------|-------|------------|
| A. Railway (recommended default) | `railway.toml` | Railway plugin | Railway plugin | Low |
| B. Render | `render.yaml` | Render database | Render redis | Low |
| C. VPS (Ubuntu + Nginx) | `nginx.example.conf` + `Procfile` | Self-managed | Self-managed | High |

---

## Required env vars (applies to all options)

| Var | Value example | Notes |
|-----|---------------|-------|
| `DJANGO_DEBUG` | `False` | MUST be False in prod |
| `DJANGO_SECRET_KEY` | 50+ random chars | `python -c "import secrets; print(secrets.token_urlsafe(64))"` |
| `DJANGO_ALLOWED_HOSTS` | `api.famelogistics.com` | Comma-separated |
| `DJANGO_ADMIN_ENABLED` | `False` | Keep admin off in prod |
| `CSRF_TRUSTED_ORIGINS` | `https://app.famelogistics.com` | Frontend origin(s) |
| `CORS_ALLOWED_ORIGINS` | `https://app.famelogistics.com` | Frontend origin(s) |
| `DATABASE_URL` | injected by platform | Railway/Render set this automatically |
| `REDIS_URL` | injected by platform | Railway/Render set this automatically |

**Frontend (Vercel) env vars:**
- `NEXT_PUBLIC_API_URL` = `https://api.famelogistics.com/api`

---

## Option A: Railway

1. `npm i -g @railway/cli && railway login`
2. From repo root: `railway init` (create a new project, link it to this repo).
3. In the Railway dashboard: **+ New → Database → Postgres**, then **+ New → Database → Redis**. Railway injects `DATABASE_URL` and `REDIS_URL`.
4. Set required env vars in Railway **Variables** (see table above).
5. Railway auto-detects `deploy/railway.toml` and deploys using `backend/Dockerfile`.
6. Attach your custom domain via **Settings → Domains**.
7. Seed 197 customers: `railway run python manage.py seed_customers`

## Option B: Render

1. Push the repo to GitHub.
2. In Render: **New → Blueprint** → select the repo → Render reads `deploy/render.yaml` automatically.
3. Fill in the `sync: false` env vars (`DJANGO_ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS`).
4. Attach custom domain in the web service settings.
5. Seed 197 customers via the Render Shell: `python manage.py seed_customers`

## Option C: VPS (Ubuntu + Nginx + Let's Encrypt)

1. Provision Ubuntu 22.04, install Docker + docker-compose.
2. `git clone` the repo into `/opt/fame-fms`.
3. Copy `.env.example` → `.env` and fill in production values.
4. `docker compose up -d --build`
5. Install Nginx: `apt install nginx certbot python3-certbot-nginx`
6. Copy `deploy/nginx.example.conf` → `/etc/nginx/sites-available/fame-fms.conf`; edit server_name; enable site.
7. Issue Let's Encrypt: `certbot --nginx -d api.famelogistics.com`
8. `systemctl reload nginx`
9. Seed customers: `docker compose exec backend python manage.py seed_customers`

---

## Frontend (Vercel) — same for all backend options

1. `npm i -g vercel && vercel login`
2. From `frontend/`: `vercel link`
3. Set `NEXT_PUBLIC_API_URL` in Vercel project env (all environments).
4. `vercel --prod` to ship.
5. Attach custom domain via Vercel → Project → Domains.

---

## Post-deploy verification (runs in plan 10-07)

- [ ] SSL Labs scan → A grade on both the frontend and the API host
- [ ] securityheaders.com scan → A grade
- [ ] Lighthouse on dashboard over throttled 3G → <2s
- [ ] End-to-end smoke test: login → create customer → create job → approve → invoice → report
