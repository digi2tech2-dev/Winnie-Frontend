# Phase 2.5L - Admin Dashboard Real Data Integration

## Files Changed

- `src/api/adminDashboard.js`
- `src/pages/admin/AdminDashboardPage.jsx`
- `src/components/admin/dashboard/DashboardPieces.jsx`
- `docs/PHASE_2_5L_ADMIN_DASHBOARD_REPORT.md`

## API Helpers Used/Added

- Added `getAdminDashboardData(token)` in `src/api/adminDashboard.js`.
- Reused existing helpers:
  - `getAdminOrders`
  - `getAdminUsers`
  - `getAdminDeposits`
  - `getAdminProducts`
  - `getAdminGroupRequests`
  - `getAdminProviders`
- Added a read-only call to existing `/admin/dashboard/stats` for operational order/user/product counts.

## Backend Routes Used

- `GET /api/admin/dashboard/stats`
- `GET /api/admin/orders`
- `GET /api/admin/users`
- `GET /api/admin/deposits`
- `GET /api/admin/products`
- `GET /api/admin/group-change-requests`
- `GET /api/admin/providers`

## Real Dashboard Metrics Connected

- Total orders
- Pending/processing orders
- Completed orders
- Failed orders
- Total users
- Pending users
- Total products
- Pending deposits
- Pending group/sub-agent requests
- Provider count

## Recent Orders Behavior

- Recent orders now come from `GET /api/admin/orders?page=1&limit=5`.
- Each row shows backend-normalized order id, customer, product, amount, status, and created date.
- The row action links to the connected admin orders page.
- No dashboard-local order approval/rejection/status mutation remains.

## Refresh/Loading/Error Behavior

- The refresh button refetches backend dashboard data.
- Initial loading and refresh-in-progress states are shown.
- The dashboard uses partial loading through settled requests, so successful counters remain visible if another request fails.
- Safe error messages are shown without stack traces.

## Metrics Intentionally Unavailable

- Revenue/profit cards and charts are not shown.
- Wallet total balances are not shown.
- Provider balance totals are not shown.
- Activity feed, notifications broadcast, and date-range analytics are not connected.

## Mock Data Removed/Remaining

- `AdminDashboardPage` no longer imports static dashboard arrays from `src/data/adminDashboard.js`.
- Static formatters from `src/data/adminDashboard.js` are still reused.
- The old mock sales chart, payment-method popularity, active-users feed, wallet/provider balance cards, and local mutation handlers were removed from this dashboard.

## Tests/Checks Run

- `npm.cmd run lint` - passed
- `npm.cmd run build` - passed
- `git diff --check` - passed

## Remaining Warnings

- Pending users follow the backend admin users route filtering behavior.
- Revenue/profit analytics are intentionally not displayed even though `/api/admin/dashboard/stats` returns financial fields.
- `npm.cmd run build` reported the existing Vite chunk-size warning for the main bundle.
- `git diff --check` reported Git environment/line-ending warnings only: a non-absolute `safe.directory` config entry and LF-to-CRLF normalization notices.

## Completion Status

- Phase 2.5L is complete.
