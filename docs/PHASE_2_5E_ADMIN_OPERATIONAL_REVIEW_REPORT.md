# Phase 2.5E Admin Operational Review Integration Report

## Files Changed

- `src/api/adapters.js`
- `src/api/adminUsers.js`
- `src/api/adminDeposits.js`
- `src/api/adminGroupRequests.js`
- `src/pages/admin/AdminUsersPage.jsx`
- `src/pages/admin/AdminBalanceRequestsPage.jsx`
- `src/pages/admin/AdminSubAgentsPage.jsx`
- `docs/PHASE_2_5E_ADMIN_OPERATIONAL_REVIEW_REPORT.md`

## API Helpers Added/Updated

- Added `getAdminUsers`, `approveUser`, `rejectUser`, `normalizeAdminUser`.
- Added `getAdminDeposits`, `approveDeposit`, `rejectDeposit`, `normalizeAdminDeposit`.
- Added `getAdminGroupRequests`, `getAdminGroupRequest`, `approveGroupRequest`, `rejectGroupRequest`, `normalizeAdminGroupRequest`, `getDefaultApprovedGroupId`.
- Added shared `compactObject` to `src/api/adapters.js`.

## Backend Routes Used

- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/approve`
- `PATCH /api/admin/users/:id/reject`
- `GET /api/admin/deposits`
- `PATCH /api/admin/deposits/:id/approve`
- `PATCH /api/admin/deposits/:id/reject`
- `GET /api/admin/group-change-requests`
- `GET /api/admin/group-change-requests/:id`
- `PATCH /api/admin/group-change-requests/:id/approve`
- `PATCH /api/admin/group-change-requests/:id/reject`

## Admin Users Behavior

- Loads users from the backend with status, email search, pagination, and backend-supported sorting.
- Shows user name, email, phone, country, currency, backend status, role, group, wallet snapshot, and sub-agent business status where available.
- Approves and rejects only pending users through backend routes.
- Does not store a rejection reason because the inspected backend reject route does not accept one.
- Removed local fake wallet, password, currency, group, and status mutation flows from this page surface.
- Refetches users after backend-confirmed approve/reject.

## Admin Deposits Behavior

- Loads deposit requests from `GET /api/admin/deposits` with status/search filters.
- Shows user summary, requested amount, currency, USD amount returned by backend, payment method id, notes, receipt URL/image preview, status, created time, reviewed time, and reviewer.
- Approves deposits through `PATCH /api/admin/deposits/:id/approve`.
- Rejects deposits through `PATCH /api/admin/deposits/:id/reject`.
- Sends only optional `adminNotes`; no frontend wallet credit or deposit credit calculation is performed.
- Refetches deposits after backend-confirmed review.

## Admin Group/Sub-Agent Request Behavior

- Loads group-change and sub-agent requests from `GET /api/admin/group-change-requests`.
- Supports `all`, `SUB_AGENT`, and `GROUP_CHANGE` request-type filters, plus status filters.
- Shows user summary, request type, status, current group, requested group, approved group, reason, admin note, reviewed timestamps, and sub-agent status.
- Approves requests through `PATCH /api/admin/group-change-requests/:id/approve`.
- Rejects requests through `PATCH /api/admin/group-change-requests/:id/reject`.
- For `GROUP_CHANGE`, approval sends the requested group id as `approvedGroupId` by default.
- For `SUB_AGENT`, approval sends no role or permission change and does not treat the user as a supervisor.
- Refetches requests after backend-confirmed review.

## Dashboard Counters Behavior

- Admin dashboard was not changed. It contains broader mocked operations for orders/products/providers and was intentionally left outside this phase.

## Confirmation/Duplicate Submit Behavior

- User, deposit, and group-request approve/reject actions show confirmation dialogs before calling the backend.
- Action buttons are disabled while a review request is in flight.
- Success toasts are shown only after the backend request resolves.
- Pages refetch after success instead of mutating reviewed state locally as the source of truth.

## Features Intentionally Not Connected

- Admin products and categories.
- Admin providers and suppliers.
- Admin orders.
- Currencies.
- Payment method settings.
- Supervisor management and permissions.
- Admin wallet adjustments.
- Referral relationship/commission admin reporting beyond the existing read-only sub-agent earnings tab.
- Dashboard analytics and operational cards.

## Remaining Mock Admin Areas

- Admin dashboard analytics, orders, manual request panel, provider balances, product cards, and activity feed.
- Products/categories management pages.
- Providers/suppliers management pages.
- Currencies page.
- Payment methods/settings pages.
- Supervisors management page.
- The sub-agent referral earnings tab remains seed-based read-only context.

## Lint Result

- `npm.cmd run lint` passed.

## Build Result

- `npm.cmd run build` passed.

## Diff Check Result

- `git diff --check` passed with exit code 0.

## Remaining Warnings

- Vite build reported the existing large chunk warning for chunks over 500 kB.
- Git printed line-ending normalization warnings that LF will be replaced by CRLF when Git touches edited files.
- Git printed an unrelated `safe.directory` warning for another configured path.

## Completion

Phase 2.5E is complete.
