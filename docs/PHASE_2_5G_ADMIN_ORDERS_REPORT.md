# Phase 2.5G - Admin Orders Integration Report

## Files Changed

- `src/api/adminOrders.js`
- `src/pages/admin/AdminOrdersPage.jsx`
- `src/components/admin/orders/OrderCard.jsx`
- `src/components/admin/orders/OrderDetailsModal.jsx`
- `src/components/admin/orders/OrdersFilters.jsx`
- `src/components/admin/orders/OrdersStats.jsx`
- `src/components/admin/orders/StatusBadge.jsx`
- `docs/PHASE_2_5G_ADMIN_ORDERS_REPORT.md`

## API Helpers Added/Updated

- Added `getAdminOrders(token, query)`.
- Added `getAdminOrder(token, id)`.
- Added `updateAdminOrderStatus(token, id, payload)`.
- Added `markAdminOrderManualSuccess(token, id)`.
- Added `markAdminOrderManualFail(token, id, payload)`.
- Added `refundAdminOrder(token, id, payload)`.
- Added `retryAdminOrder(token, id)`.
- Added `syncAdminOrder(token, id)`.
- Added admin order adapters: `normalizeAdminOrder`, `normalizeAdminOrderItem`, and `normalizeOrderStatus`.

## Backend Routes Used

Inspected backend mounting in `Backend/src/app.js` and admin order files under `Backend/src/modules/admin`.

- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `POST /api/admin/orders/:id/complete`
- `POST /api/admin/orders/:id/refund`
- `POST /api/admin/orders/:id/retry`
- `POST /api/admin/orders/:id/sync-status`
- `PATCH /api/admin/orders/:id/status`

## Admin Order List Behavior

- The admin orders page now loads real backend orders through `GET /api/admin/orders`.
- The list displays safe order, customer, product, provider, quantity, submitted-field, amount, status, and timestamp summaries.
- Seed/mock orders are no longer used as the source of truth after loading the backend list.
- Loading, empty, validation/server error, and refresh states are handled.

## Admin Order Details Behavior

- Opening an order fetches the latest backend detail through `GET /api/admin/orders/:id`.
- Details show safe order, customer, product, submitted fields, wallet/refund, provider status, retry/sync metadata, and timeline timestamps.
- Raw provider responses and internal JSON are not displayed.
- Provider credentials/secrets are not exposed.

## Status/Action Behavior

- Backend-confirmed actions are available only through inspected admin order routes.
- Manual complete calls `POST /api/admin/orders/:id/complete`.
- Fail/refund without a reason calls `POST /api/admin/orders/:id/refund`.
- Fail/refund with a reason calls `PATCH /api/admin/orders/:id/status` using `status: failed` and `rejectionReason`.
- Retry calls `POST /api/admin/orders/:id/retry`.
- Provider status sync calls `POST /api/admin/orders/:id/sync-status`.
- Sensitive actions require confirmation, disable while in flight, and refetch backend state after success.
- The frontend does not locally change order status as source of truth.

## Refund Behavior

- Refund is connected only to inspected backend admin order refund/status routes.
- The backend remains the source of truth for refund amount, wallet credit, ledger/idempotency behavior, and status.
- The frontend does not compute refund amounts or mutate wallet balances locally.
- Reason text is optional and only sent through the backend status endpoint when provided.

## Provider Sync/Retry Behavior

- Provider retry and sync are connected only through backend admin-safe order routes.
- The frontend does not call provider APIs directly.
- The frontend does not expose provider credentials.
- Sync is disabled when the backend order has no provider order id.
- Retry is enabled only for backend `FAILED` orders.

## Filters/Pagination Behavior

- Backend-supported filters wired: `status`, `search`, `userId`, `from`, `to`, `page`, and `limit`.
- Pagination uses the backend pagination envelope.
- Execution type and loaded-page sort are client-side only within the currently loaded page.
- Product filter is not connected because no inspected admin order product filter exists.
- Provider filter is not connected because the backend validation accepts `providerId`, but the inspected list service does not apply it.

## Dashboard Counters Behavior

- `AdminDashboardPage.jsx` was not changed.
- The orders page stat cards now use the backend list result and backend total where available.
- No analytics layer or dashboard order counters were added.

## Features Intentionally Not Connected

- Full provider/supplier management pages.
- Provider product sync/linking UI.
- Product/category management changes.
- Currencies/payment settings.
- Supervisor management.
- Product filter and provider filter on the admin orders page.
- Partial-refund amount entry, because the inspected refund route does not accept an admin amount/remains payload in the controller.
- Raw provider/internal JSON display.

## Mock Data Still Remaining

- `src/data/adminOrders.js` remains for metadata labels/options used by existing UI components.
- `AdminDashboardPage.jsx` still has its pre-existing mock dashboard analytics/order cards and was intentionally not connected in this phase.
- The admin orders page itself no longer uses `adminOrdersSeed` as order source of truth.

## Verification

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `git diff --check`: passed.

## Remaining Warnings

- `npm.cmd run build` reports the existing Vite chunk-size warning for large bundles.
- Git commands print an existing safe.directory warning for an unrelated configured path: `D:/projects/NodeJs/supplychain(2)/supplychain`.
- `git diff --check` passes but reports Git line-ending normalization warnings for touched JSX files.
- Backend provider status sync may return backend validation/business-rule errors for orders without provider details; the UI surfaces those as safe error toasts.

## Completion

Phase 2.5G is complete.
