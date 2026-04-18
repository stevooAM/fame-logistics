---
phase: 10-security-hardening-launch
plan: 02
subsystem: infra
tags: [nextjs, security-headers, csp, hsts, x-frame-options, content-security-policy]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Next.js frontend scaffold with next.config.js
provides:
  - CSP header on every Next.js response (dev-permissive, prod-strict)
  - HSTS header in production (max-age=31536000; includeSubDomains; preload)
  - X-Frame-Options: DENY on every response
  - X-Content-Type-Options: nosniff on every response
  - Referrer-Policy: strict-origin-when-cross-origin on every response
  - Permissions-Policy denying camera/microphone/geolocation/interest-cohort
  - X-Powered-By header removed (poweredByHeader: false)
affects: [deployment, production-launch]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Environment-branched CSP: isProd flag gates eval/ws permissions and HSTS injection"
    - "API origin derived from NEXT_PUBLIC_API_URL at config load time for connect-src"

key-files:
  created: []
  modified:
    - frontend/next.config.js

key-decisions:
  - "Dev CSP allows unsafe-eval and ws://localhost:* for Next.js HMR — prod removes both"
  - "HSTS pushed only in production — avoids locking localhost to HTTPS during development"
  - "output: standalone preserved — Docker build depends on it"
  - "script-src includes unsafe-inline in prod — Next.js inline script chunks require it until nonce support added"

patterns-established:
  - "Security headers centralised in next.config.js headers() hook — single place to audit/extend"

# Metrics
duration: 1min
completed: 2026-04-18
---

# Phase 10 Plan 02: Security Headers Summary

**Next.js responses hardened with CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, and Permissions-Policy via next.config.js headers() — dev keeps HMR working, prod is locked down**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-18T15:05:24Z
- **Completed:** 2026-04-18T15:06:41Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- All six security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) are now injected on every `/:path*` route
- CSP is environment-aware: dev allows `unsafe-eval` + `ws://localhost:*` for Next.js HMR; prod restricts to self + API origin with `upgrade-insecure-requests`
- HSTS (`max-age=31536000; includeSubDomains; preload`) is production-only — localhost is never forced to HTTPS during development
- `X-Powered-By` header suppressed via `poweredByHeader: false`
- `output: "standalone"` preserved — Docker build chain unaffected

## Task Commits

Each task was committed atomically:

1. **Task 1: Add security headers and remove X-Powered-By** - `cede2c4` (feat)

**Plan metadata:** _(this docs commit)_

## Files Created/Modified

- `frontend/next.config.js` — replaced minimal config with full security-headers implementation; environment-branched CSP, HSTS in prod, poweredByHeader: false

## Decisions Made

- `unsafe-inline` kept in `script-src` for production — Next.js emits inline script bootstrapping chunks that cannot be eliminated without nonce injection (deferred to later hardening pass if needed)
- HSTS omitted from dev to avoid HSTS preload poisoning localhost
- API origin parsed at config load time from `NEXT_PUBLIC_API_URL` env var; falls back to `http://localhost:8000` if unset or malformed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Security headers live and verified against both dev and production `NODE_ENV` branches
- Ready for 10-03 (next plan in Phase 10 security hardening)

---
*Phase: 10-security-hardening-launch*
*Completed: 2026-04-18*
