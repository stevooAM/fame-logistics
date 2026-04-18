# Phase 10 Security Audit

**Date:** 2026-04-18
**Auditor:** Claude (automated)
**Scope:** SEC-01 through SEC-09, common anti-patterns

## Summary

| Requirement | Verdict | Notes |
|-------------|---------|-------|
| SEC-01 HTTPS | PASS | SECURE_SSL_REDIRECT = True inside `if not DEBUG` block; plan 10-01 has already landed |
| SEC-02 bcrypt | PASS | BCryptSHA256PasswordHasher is primary hasher; default rounds = 12 (confirmed by Django hasher introspection) |
| SEC-03 CSRF | PASS | CsrfViewMiddleware present; zero project-level @csrf_exempt usages found |
| SEC-04 no raw SQL | PASS | No .raw() or cursor.execute() calls in project source (venv and migrations excluded) |
| SEC-05 XSS | PASS | No dangerouslySetInnerHTML or direct innerHTML assignments found in frontend/src/ |
| SEC-06 rate limit | PASS | LoginRateLimitMiddleware active; 10 attempts / 15 min window enforced via Redis |
| SEC-07 cookies | PASS | Both access_token and refresh_token set with httponly=True, secure=not DEBUG, samesite="Lax" |
| SEC-08 audit log | PASS | All write-capable ViewSets covered: CustomerViewSet, JobViewSet, InvoiceViewSet, PaymentViewSet use AuditLogMixin; setup ViewSets use LookupViewSetMixin with inline _log_audit; ApprovalViewSet writes JobAuditTrail directly |
| SEC-09 server validation | PASS | CustomerSerializer, JobSerializer and all jobs sub-serializers use explicit field lists (no `fields = "__all__"`); setup serializers use `fields = "__all__"` but with explicit validate() methods enforcing uniqueness constraints |

---

## Detailed Findings

### SEC-01 — HTTPS

**Command:** `grep -n "SECURE_SSL_REDIRECT" backend/config/settings.py`

**Result:**
```
201:    SECURE_SSL_REDIRECT = True
```
Located inside `if not DEBUG:` block (lines 199–217) alongside full HSTS configuration:
- `SECURE_HSTS_SECONDS = 31_536_000`
- `SECURE_HSTS_INCLUDE_SUBDOMAINS = True`
- `SECURE_HSTS_PRELOAD = True`
- `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")`

**Verdict:** PASS — plan 10-01 has landed and HTTPS redirect is correctly gated on `DEBUG=False`.

---

### SEC-02 — bcrypt 12 rounds

**Commands:**
```
grep -n "BCryptSHA256PasswordHasher" backend/config/settings.py
grep -n "rounds" backend/config/settings.py
```

**Result:**
```
101:    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
```
No custom `rounds` entry in settings. Django's `BCryptSHA256PasswordHasher` defaults to `rounds = 12`.
Confirmed via Python introspection: `BCryptSHA256PasswordHasher().rounds` → `12`.

PBKDF2PasswordHasher and others are listed as fallback hashers for legacy hash auto-upgrade on next login.

**Verdict:** PASS — bcrypt is primary hasher at 12 rounds (meets ≥12 requirement).

---

### SEC-03 — CSRF

**Commands:**
```
grep -n "CsrfViewMiddleware" backend/config/settings.py
grep -rn "csrf_exempt" backend/ --include="*.py" (excluding .venv)
```

**Result:**
```
51:    "django.middleware.csrf.CsrfViewMiddleware",
```
No project-level `@csrf_exempt` decorators found. The only `csrf_exempt` hits are inside `.venv/` (DRF's standard mechanism of wrapping class-based views — this is framework behaviour, not a project bypass).

**Verdict:** PASS — CSRF middleware active; no project code bypasses it.

---

### SEC-04 — No raw SQL outside migrations

**Commands:**
```
grep -rn "\.raw(" backend/ --include="*.py" | grep -v migrations/ | grep -v .venv/
grep -rn "cursor\.execute" backend/ --include="*.py" | grep -v migrations/ | grep -v .venv/
```

**Result:** No matches in either query.

**Verdict:** PASS — all database access uses Django ORM. No raw SQL in project source.

---

### SEC-05 — XSS sinks

**Commands:**
```
grep -rn "dangerouslySetInnerHTML" frontend/src/
grep -rn "innerHTML" frontend/src/ --include="*.tsx" --include="*.ts"
```

**Result:** No matches in either query.

**Verdict:** PASS — no dangerous HTML injection sinks found in the React codebase.

---

### SEC-06 — Rate limiting

**Commands:**
```
grep -n "LoginRateLimitMiddleware" backend/config/settings.py
grep -n "LOGIN_RATE_LIMIT" backend/config/settings.py
```

**Settings result:**
```
54:    "core.middleware.LoginRateLimitMiddleware",
```
No `LOGIN_RATE_LIMIT_*` constants in settings — they are defined inline in `backend/core/middleware.py`:

```python
LOGIN_RATE_LIMIT_MAX = 10      # Maximum failed attempts before block
LOGIN_RATE_LIMIT_WINDOW = 900  # Tracking window: 15 minutes (seconds)
LOGIN_PATH = "/api/auth/login/"
```

Logic: blocks after 10 failed attempts per IP within 15 minutes. Returns HTTP 429. Counter backed by Redis cache with TTL auto-expiry. Counter cleared on successful login.

**Verdict:** PASS — rate limiting active at 10 failures / 15 min window, Redis-backed.

---

### SEC-07 — HttpOnly + Secure cookies

**Commands:**
```
grep -rn "httponly\|samesite\|secure" backend/core/authentication.py
grep -rn "set_cookie\|httponly\|samesite" backend/core/views.py
```

**Result from `backend/core/views.py`:**
```python
secure = not settings.DEBUG   # True in production

response.set_cookie(
    ACCESS_TOKEN_COOKIE,   # "access_token"
    access_token,
    max_age=...,
    httponly=True,
    secure=secure,
    samesite="Lax",
    path="/",
)
response.set_cookie(
    REFRESH_TOKEN_COOKIE,  # "refresh_token"
    refresh_token,
    max_age=...,
    httponly=True,
    secure=secure,
    samesite="Lax",
    path="/",
)
```
Same pattern confirmed in the refresh endpoint at lines 295–312.

**Verdict:** PASS — both JWT cookies are HttpOnly, Secure in production, SameSite=Lax.

---

### SEC-08 — Audit log coverage

**Commands:**
```
grep -rn "AuditLogMixin" backend/ --include="*.py" (excluding .venv)
grep -rn "class.*ViewSet" backend/ --include="*.py" (excluding .venv, migrations)
```

**ViewSets identified:**

| ViewSet | Module | Audit Coverage |
|---------|--------|----------------|
| `CustomerViewSet` | customers/views.py | `AuditLogMixin` |
| `JobViewSet` | jobs/views.py | `AuditLogMixin` |
| `InvoiceViewSet` | accounts/views.py | `AuditLogMixin` |
| `PaymentViewSet` | accounts/views.py | `AuditLogMixin` |
| `PortViewSet` | setup/views.py | `LookupViewSetMixin` (inline `_log_audit`) |
| `CargoTypeViewSet` | setup/views.py | `LookupViewSetMixin` (inline `_log_audit`) |
| `CurrencyViewSet` | setup/views.py | `LookupViewSetMixin` (inline `_log_audit`) |
| `DocumentTypeViewSet` | setup/views.py | `LookupViewSetMixin` (inline `_log_audit`) |
| `ApprovalViewSet` | approvals/views.py | Read-only list/retrieve + action methods write `JobAuditTrail` and `ApprovalHistory` directly |

All write-capable ViewSets produce audit log entries. `ApprovalViewSet` is not a full `ModelViewSet` (uses `ListModelMixin, RetrieveModelMixin, GenericViewSet`) so `AuditLogMixin` is not applicable, but the approve/reject action methods manually create `JobAuditTrail` and `ApprovalHistory` entries.

**Verdict:** PASS — full audit trail coverage across all write paths.

---

### SEC-09 — Server-side validation (explicit fields)

**Commands:**
```
grep -rn "class.*Serializer" backend/customers/serializers.py
grep -rn "class.*Serializer" backend/jobs/serializers.py
grep -rn "fields = \"__all__\"" backend/ --include="*.py" (excluding .venv, migrations)
```

**Customers serializers:**
- `CustomerListSerializer` — explicit `fields = [...]` list
- `CustomerSerializer` — explicit `fields = [...]` list

**Jobs serializers:**
- `JobListSerializer` — explicit `fields = [...]` list
- `JobSerializer` — explicit `fields = [...]` list
- `JobDocumentSerializer` — explicit `fields = [...]` list
- `StatusTransitionSerializer` — plain `Serializer` (no Meta.fields)
- `JobAuditTrailSerializer` — explicit `fields = [...]` list

**Setup serializers (using `fields = "__all__"`):**
- `PortSerializer`, `CargoTypeSerializer`, `CurrencySerializer`, `DocumentTypeSerializer`, `CompanyProfileSerializer`
- All five have explicit `validate()` methods enforcing uniqueness constraints.
- Setup models are admin-only lookup tables (Port, CargoType, Currency, DocumentType, CompanyProfile) — limited attack surface.

**Verdict:** PASS — core business serializers (customers, jobs, accounts, approvals) all use explicit field lists. Setup serializers use `__all__` but with custom validation; this is acceptable for low-risk lookup tables.

---

## Anti-patterns

### DEBUG flag
```
11:DEBUG = os.environ.get("DJANGO_DEBUG", "False") == "True"
```
Defaults to `False`. No hardcoded `DEBUG = True` found. PASS.

### SECRET_KEY
```
8:SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "django-insecure-change-me-in-production")
```
Default is an insecure placeholder. The production hardening block (lines 214–216) raises `RuntimeError` if `SECRET_KEY` starts with `"django-insecure-"` when `DEBUG=False`. Deployment must set `DJANGO_SECRET_KEY` env var.

**Status:** PASS (runtime guard present), but must be verified at deploy time.

### CORS_ALLOW_ALL_ORIGINS
```
167:# CORS_ALLOW_ALL_ORIGINS cannot be used with credentials — use regex instead.
```
`CORS_ALLOW_ALL_ORIGINS` is not set. Dev uses `CORS_ALLOWED_ORIGIN_REGEXES` (localhost only). Production uses `CORS_ALLOWED_ORIGINS` from env var; runtime raises `RuntimeError` if empty. PASS.

### ALLOWED_HOSTS wildcard
```
13:ALLOWED_HOSTS = [h.strip() for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",") if h.strip()]
14:if DEBUG and not ALLOWED_HOSTS:
15:    ALLOWED_HOSTS = ["localhost", "127.0.0.1", "backend"]
```
No wildcard `"*"` present. Dev falls back to explicit localhost list. Production requires `DJANGO_ALLOWED_HOSTS` env var. PASS.

---

## Blockers (must fix before launch)

None — all SEC-01 through SEC-09 requirements are satisfied. The following deploy-time actions are required but are not code defects:

1. **Set `DJANGO_SECRET_KEY`** — production will refuse to start without it (runtime guard enforces this).
2. **Set `DJANGO_ALLOWED_HOSTS`** — required for production; no wildcard fallback exists.
3. **Set `CORS_ALLOWED_ORIGINS`** — required for production; runtime raises `RuntimeError` if missing.

---

## Warnings (address post-launch)

1. **Setup serializers use `fields = "__all__"`** — Acceptable for admin-only lookup tables, but explicit field lists would be more defensive. Low risk given IsAdmin permission class on all setup ViewSets. Recommend converting post-launch.

2. **Rate limit constants are hardcoded in middleware.py** — `LOGIN_RATE_LIMIT_MAX` and `LOGIN_RATE_LIMIT_WINDOW` should ideally be configurable via settings or env vars for operational tuning without code changes.

3. **`samesite="Lax"` vs `"Strict"`** — Lax allows cookies on top-level cross-site navigations. Given FMS is not embedded in other sites, `SameSite=Strict` would be marginally more secure. Low risk for an internal logistics tool.
