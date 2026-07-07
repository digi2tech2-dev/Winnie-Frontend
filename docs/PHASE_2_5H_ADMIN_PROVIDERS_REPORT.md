# Phase 2.5H - Admin Providers / Suppliers Integration Report

## Files Changed

- `src/api/adminProviders.js`
- `src/api/adminProducts.js`
- `src/pages/admin/SuppliersManagementPage.jsx`
- `src/pages/admin/ProductsManagementPage.jsx`
- `src/components/admin/suppliers/ConnectionStatusBadge.jsx`
- `src/components/admin/suppliers/SupplierCard.jsx`
- `src/components/admin/suppliers/SupplierFormModal.jsx`
- `src/components/admin/suppliers/SupplierProductsModal.jsx`
- `src/components/admin/suppliers/SupplierSearchProducts.jsx`
- `src/components/admin/suppliers/SupplierToolsModal.jsx`
- `src/components/admin/products/ProductCard.jsx`
- `src/components/admin/products/ProductProviderLinkModal.jsx`
- `docs/PHASE_2_5H_ADMIN_PROVIDERS_REPORT.md`

## API Helpers Added/Updated

- Added `src/api/adminProviders.js`.
- Added provider helpers: `getAdminProviders`, `getAdminProvider`, `createAdminProvider`, `updateAdminProvider`, `toggleAdminProvider`, `deleteAdminProvider`, `testAdminProvider`, `getAdminProviderBalance`, `checkAdminProviderOrder`, `getAdminProviderProducts`, and `syncAdminProviderProducts`.
- Added provider adapters: `normalizeAdminProvider`, `normalizeAdminProviderProduct`, `normalizeProviderBalance`, `normalizeProviderConnectionTest`, `normalizeProviderOrderCheck`, and `normalizeProviderSyncResult`.
- Updated `src/api/adminProducts.js` with safe provider option helpers and product linking/sync helpers: `getAdminProductProviderOptions`, `getAdminProductProviderProductOptions`, `linkAdminProductProvider`, and `syncAdminProductProvider`.
- Updated product normalization to preserve safe provider linkage summaries.

## Backend Routes Used

- `GET /api/admin/providers`
- `POST /api/admin/providers`
- `GET /api/admin/providers/:id`
- `PATCH /api/admin/providers/:id`
- `DELETE /api/admin/providers/:id`
- `PATCH /api/admin/providers/:id/toggle`
- `GET /api/admin/providers/:id/balance`
- `POST /api/admin/providers/:id/test-connection`
- `GET /api/admin/providers/:id/check-order`
- `GET /api/admin/provider-products`
- `GET /api/admin/provider-products/:providerId`
- `POST /api/admin/catalog/sync/:providerId`
- `GET /api/admin/product-provider-options`
- `GET /api/admin/product-provider-options/:providerId/products`
- `PATCH /api/admin/products/:id/provider-link`
- `POST /api/admin/products/:id/provider-sync`

## Providers List Behavior

- Supplier management now loads real backend providers.
- The page shows safe provider summary fields: name, slug/code, active status, base URL, sync interval, supported features, created/updated timestamps, connection-test result, and backend provider product totals.
- Provider credentials are never rendered.
- The provider normalizer does not expose `apiToken`, `apiKey`, secrets, raw payloads, or raw provider responses to components.
- Loading, empty, and safe error states are handled.

## Create/Update Provider Behavior

- Create/update use exact inspected backend fields: `name`, `slug`, `baseUrl`, `apiToken`, `isActive`, `syncInterval`, and `supportedFeatures`.
- Credential fields are blank on edit.
- Blank credential values are omitted on update so the frontend does not clear existing credentials accidentally.
- Save buttons disable while saving and the list refetches after backend confirmation.

## Enable/Disable/Delete Behavior

- Enable/disable uses `PATCH /api/admin/providers/:id/toggle`.
- Archive/delete uses `DELETE /api/admin/providers/:id`.
- Both actions require confirmation and refetch after success.
- The frontend does not locally remove or toggle providers as source of truth.

## Test Connection Behavior

- Connection test uses `POST /api/admin/providers/:id/test-connection`.
- The frontend never calls external provider APIs directly.
- The UI shows only the backend-confirmed success/failure, message, latency, and timestamp.

## Provider Balance/Status Behavior

- Balance uses `GET /api/admin/providers/:id/balance`.
- The UI shows a safe numeric balance summary when extractable and never fakes balance.
- Provider order check uses `GET /api/admin/providers/:id/check-order`.
- The UI shows safe status fields only and does not display raw provider responses.

## Provider Products Behavior

- Provider product browsing uses cached backend provider products through `GET /api/admin/provider-products` and `GET /api/admin/provider-products/:providerId`.
- Search and pagination use backend query support.
- Product sync uses `POST /api/admin/catalog/sync/:providerId` with confirmation.
- The UI shows safe product fields: provider product id, name, quantity range, active state, price when returned to admin, and last sync timestamp.
- Raw payloads are not displayed.

## Product-Provider Link Behavior

- Products management now has a provider link modal.
- Provider picker uses `GET /api/admin/product-provider-options`.
- Provider product picker uses `GET /api/admin/product-provider-options/:providerId/products`.
- Linking uses `PATCH /api/admin/products/:id/provider-link` with exactly `providerId` and `providerProductId`.
- The product list refetches after backend-confirmed linking.
- Unlink is not connected because no inspected unlink route exists.

## Price/Metadata Sync Behavior

- Product provider price sync uses `POST /api/admin/products/:id/provider-sync`.
- Sync requires confirmation.
- The request sends no body, matching the inspected controller.
- Product data refetches after backend confirmation.
- The frontend does not calculate provider prices locally.

## Product Management Compatibility

- Existing manual product creation and editing remain in place.
- Product cards show safe provider linkage summary where returned.
- Provider linking is optional and does not make product creation require a provider.

## Features Intentionally Not Connected

- Direct external provider API calls from frontend.
- Provider credential display or credential status derived from unsafe token fields.
- Live provider products route `GET /api/admin/providers/:id/products`, because cached provider-products plus sync is safer for management UI.
- All-provider sync `POST /api/admin/catalog/sync`.
- Provider product publish/import as a new platform product from this phase UI.
- Provider product translated-name editing.
- Single provider-product price lookup.
- Unlinking product-provider links, because no inspected unlink route exists.
- Customer order processing changes.
- Currencies/payment settings/supervisor management.

## Mock Data Still Remaining

- `src/data/adminManagement.js` still contains supplier seed data for any legacy references, but `SuppliersManagementPage.jsx` no longer uses it as source of truth.
- `src/data/adminProducts.js` still contains product seed metadata used elsewhere.
- Existing unrelated admin dashboard mock analytics remain unchanged.

## Verification

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `git diff --check`: passed.

## Remaining Warnings

- `npm.cmd run build` reports the existing Vite chunk-size warning for large bundles.
- Git commands print an existing safe.directory warning for an unrelated configured path: `D:/projects/NodeJs/supplychain(2)/supplychain`.
- `git diff --check` may report Git line-ending normalization warnings for touched frontend files.
- The backend stores provider credentials in plaintext according to `BASELINE_ARCHITECTURE.md`; this phase only prevents frontend display/logging and does not change backend storage.

## Completion

Phase 2.5H is complete.
