# Phase 2.5S Admin Payments & Reconciliation Page Report

## Scope

Phase 2.5S adds an admin payments page for real backend wallet top-up payments and safe reconciliation actions.

## Frontend route/page

- Route: `/admin/tools/payments`
- Legacy redirect: `/admin/payments` to `/admin/tools/payments`
- Sidebar item: `المدفوعات`
- Page: `src/pages/admin/AdminPaymentsPage.jsx`

## API helpers

`src/api/adminPayments.js` adds:

- `getAdminPayments(token, params)`
- `getAdminPayment(token, paymentId)`
- `adminSyncPaymentStatus(token, paymentId)`
- `normalizeAdminPayment()`
- `normalizePaymentGatewayCharge()`
- `normalizePaymentUserSummary()`

## UI behavior

The page shows:

- payment list and pagination
- status, gateway, credited, date, and local search filters
- requested amount/currency
- gateway charge/currency when returned by backend
- status and credited badges
- safe payment detail panel
- safe webhook event summaries when returned
- Sync/Reconcile action for pending Network payments

The frontend never credits wallet balances, never trusts browser return state, and never displays provider secrets or raw provider payloads.

## Verification

- `npm.cmd run lint` passed.
- `npm.cmd run build` passed with the existing Vite large main-bundle warning.
- `git diff --check` passed with Git line-ending/safe.directory warnings only.

## Limitations

- Search is local to the currently loaded backend page unless a future backend search filter is added.
- The page is a focused reconciliation workspace, not a settlement dashboard.
