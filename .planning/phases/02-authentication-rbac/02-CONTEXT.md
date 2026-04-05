# Phase 2: Authentication & RBAC - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff can log in with username and password, maintain a session across navigation, and see only the modules their role permits — all enforced server-side. User management, audit logs, and lookup configuration are Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Role structure
- 3 roles: **Admin**, **Operations**, **Finance**
- Admin has full access to all modules + can impersonate any other user for support/troubleshooting purposes
- Operations vs Finance module access: Claude's discretion — standard freight ops separation (Operations handles jobs/customers, Finance handles accounts/invoices)
- One role per user (Claude's discretion — single-role is simpler and sufficient for this team size)

### Session timeout UX
- Show a warning dialog 2 minutes before the 30-minute idle timeout expires
- Warning offers "Stay logged in" and "Log out" options
- If warning is ignored, silently redirect to `/login`
- Timeout value is fixed system-wide (Claude's discretion — configurable timeout adds complexity without clear need at this stage)
- What happens to unsaved work on expiry: Claude's discretion (redirect back to the page they were on post-login is the pragmatic approach)
- **"Remember me" checkbox** on login form — extends session to 7 days on a trusted device

### Password reset flow
- Both self-service (email-based) and admin override supported
- Self-service: "Forgot password" link on login page sends a reset email with a 1-hour expiry link
- Admin force-reset: Admin sets a temporary password; user is forced to change it on next login
- Password strength requirements: minimum 8 characters, at least 1 uppercase letter, at least 1 number

### Login form UX
- Split layout: branded left panel, login form on the right
- Left panel content: Claude's discretion — use teal/dark-navy brand colors with logo and appropriate brand elements
- Post-login redirect: always go to the Dashboard (regardless of role or intended URL)
- Login button loading state: spinner inside the button + button disabled ("Signing in...") — prevents double-submit

### Claude's Discretion
- Operations vs Finance module permission matrix specifics
- Whether one role per user or multi-role is implemented (prefer single-role)
- Exact idle timeout tracking mechanism (activity events)
- Redirect-after-login URL handling for expired sessions (return to intended page)
- Left panel branding design (logo, colors, layout)
- Temp file handling for password reset tokens

</decisions>

<specifics>
## Specific Ideas

- "Remember me" is explicitly requested — 7-day extended session on checkbox
- Admin impersonation is explicitly requested for support purposes
- Warning dialog before session expiry (not just silent redirect)
- Spinner-in-button loading state on login (not full-form overlay)

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-authentication-rbac*
*Context gathered: 2026-04-05*
