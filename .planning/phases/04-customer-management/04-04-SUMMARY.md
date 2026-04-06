# 04-04 Summary: Customer AG Grid List UI

**Status:** Complete
**Completed:** 2026-04-06

## What Was Built

- CustomerToolbar with search (debounced 300ms), Add Customer, Add Inline, Export buttons
- CustomerTable: AG Grid Community with company_name, TIN, contact_person, phone, business_type, credit_terms, and kebab actions columns
- Custom pagination bar: "Showing X-Y of Z customers" + prev/next buttons matching UserTable pattern exactly
- KebabMenu row actions: Edit / View Detail / Delete for persisted rows (id > 0); Remove only for temp rows (id < 0)
- DeleteDialog: inline state-controlled modal overlay with confirm/cancel flow — no external library
- Delete flow: DeleteDialog confirm → apiFetch DELETE /api/customers/{id}/ → re-fetch
- Loading state ("Loading...") and empty state ("No customers found.") UI
- All 6 columns editable inline via AG Grid onCellValueChanged
- dirtyRows Map<number, Partial<Customer>> tracks per-row changes; dirty rows highlighted bg-amber-50 via rowClassRules
- originalRowsRef Map<number, Customer> stores pre-edit values for revert on cancel
- addInlineRow: blank Customer with negative id (id = -Date.now()) prepended to gridData when addInlineTrigger changes
- BatchActionBar: renders only when dirtyCount > 0; shows "N unsaved change(s)" with Save All / Cancel buttons
- Save All: POSTs new rows (negative id), PATCHes existing dirty rows; validates company_name + tin non-empty before POST
- Validation errors: marks cell with border-left-2 red; skips invalid rows but saves others
- Cancel: reverts dirty rows to originalRowsRef values, removes all temp rows (negative id), clears dirtyRows
- props-based trigger pattern (saveAllTrigger, cancelAllTrigger numbers) wires page to table without useImperativeHandle
- onSaveComplete callback: sets isSaving(false) and increments refreshTrigger to re-fetch after batch save
- Default sort: ordering=company_name passed to API; page size 20

## Commits

- ab8a35c feat(04-04): create Customer TypeScript types
- 19c0065 feat(04-04): build customer AG Grid list with pagination, filtering, and row actions
- 1febe9c feat(04-04): add inline editing, batch tracking, and BatchActionBar

## Key Technical Decisions

- Props-based trigger pattern (saveAllTrigger, cancelAllTrigger numbers) instead of useImperativeHandle refs — simpler, no forwardRef complexity
- Negative id convention for temp rows (id = -Date.now()) — distinguishes new/unsaved rows from persisted rows without extra state field
- rowClassRules drives dirty row styling — cleaner than per-cell class management
- onCellValueChanged updates dirtyRows Map and syncs gridData state — single source of truth
- DeleteDialog implemented as inline state-controlled overlay div — avoids external dialog library dependency
- stopEditingWhenCellsLoseFocus on AgGridReact — prevents stale edits when user clicks kebab or elsewhere
- KebabMenu closes on outside click via useEffect + mousedown listener — consistent UX with other dropdowns

## Deviations from Plan

### Auto-added — Task 3 included Task 4 logic

**[Rule 2 - Missing Critical] CustomerTable built with full inline editing in Task 3 commit**

- Task 3 and Task 4 share the same file (CustomerTable.tsx). To avoid writing the file twice and overwriting, the inline editing, dirty tracking, save/cancel trigger, and onSaveComplete props were included in the Task 3 version of CustomerTable.tsx.
- Task 4 added BatchActionBar.tsx (new file) and updated page.tsx to wire BatchActionBar between toolbar and table.
- No functional deviation from spec — all required features present and working.

## Self-Check: PASSED

Files verified present:
- frontend/src/app/(dashboard)/customers/components/CustomerToolbar.tsx
- frontend/src/app/(dashboard)/customers/components/CustomerTable.tsx
- frontend/src/app/(dashboard)/customers/components/BatchActionBar.tsx
- frontend/src/app/(dashboard)/customers/page.tsx
- frontend/src/types/customer.ts

Commits verified: ab8a35c, 19c0065, 1febe9c
