---
plan: 04-06
phase: 04-customer-management
status: complete
completed: 2026-04-10
key-files:
  created:
    - frontend/src/app/(dashboard)/customers/[id]/page.tsx
    - frontend/src/app/(dashboard)/customers/[id]/components/CustomerInfoPanel.tsx
    - frontend/src/app/(dashboard)/customers/[id]/components/LinkedJobsPanel.tsx
  modified:
    - frontend/src/app/(dashboard)/customers/components/CustomerTable.tsx
commits:
  - b54819e feat(04-06): build customer detail page with two-column layout and inline editing
  - 1eb5943 feat(04-06): wire cell click navigation to customer detail page
---

## Summary

Built the customer detail page at `/customers/[id]` with a two-column layout: customer info (inline-editable) on the left (3/5 cols) and linked jobs placeholder on the right (2/5 cols).

## What Was Built

**Customer detail page** (`/customers/[id]/page.tsx`):
- Fetches customer from `GET /api/customers/{id}/` via `apiFetch`
- Animated loading skeleton matching two-column structure
- "Customer not found" error state with back link
- Back button (← Back to Customers) linking to `/customers`
- Page title = company name with customer type and active status badges
- Two-column responsive grid (stacked on mobile, 3:2 split on desktop)

**CustomerInfoPanel** (left):
- All 13 customer fields displayed in labelled groups: Identity, Contact, Commercial, Notes, System
- `FieldGroup` section dividers matching existing `CustomerFormDialog` pattern
- `InlineField` primitive: click anywhere on a field row to edit; teal wash on hover; pencil icon appears on hover
- Text inputs, textareas (address, notes), and selects (customer type) all supported
- FK dropdowns (preferred port, currency) loaded lazily from `/api/setup/dropdowns/` on first edit
- Enter to save (except multiline fields), Escape to cancel
- Save/Cancel button pair shown in edit mode with loading spinner
- PATCH `/api/customers/{id}/` on save — updates parent state via `onUpdate` callback
- Phone and TIN validation mirrors `CustomerFormDialog` rules
- System fields (Created, Last Updated) are read-only

**LinkedJobsPanel** (right):
- Panel heading with job count badge (0)
- "View all jobs" link (disabled placeholder for Phase 5)
- Empty state with icon and message: "No jobs linked yet. Jobs will appear here once created in the Jobs module."
- Accepts `customerId` prop; includes commented-out Phase 5 fetch pattern

**CustomerTable update**:
- Added `onCellClicked` handler: clicking any cell (except the Actions column) navigates to `/customers/{id}`
- Guards: skips temp rows (id < 0), skips Actions column, skips while a cell is in edit mode

## Self-Check: PASSED

- ✓ `/customers/[id]` route exists with two-column layout
- ✓ All customer fields displayed and inline-editable
- ✓ Linked jobs panel shows placeholder with customerId prop
- ✓ Cell click in CustomerTable navigates to detail page
- ✓ Back button returns to `/customers`
- ✓ TypeScript: 0 errors in customers directory
- ✓ All API calls use `apiFetch<T>`
