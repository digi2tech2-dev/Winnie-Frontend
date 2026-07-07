# Phase 2.5F Admin Catalog / Products / Categories Integration Report

## Files Changed

- `src/api/adapters.js`
- `src/api/catalog.js`
- `src/api/adminCategories.js`
- `src/api/adminProducts.js`
- `src/pages/admin/ProductsManagementPage.jsx`
- `src/components/admin/products/BasicProductInfo.jsx`
- `src/components/admin/products/CategoryFormModal.jsx`
- `src/components/admin/products/ConfirmDialog.jsx`
- `src/components/admin/products/ExtraFieldsBuilder.jsx`
- `src/components/admin/products/ProductCard.jsx`
- `src/components/admin/products/ProductFormModal.jsx`
- `src/components/admin/products/ProductPricing.jsx`
- `src/components/admin/products/StatusBadge.jsx`
- `src/components/admin/products/SubCategoryCard.jsx`
- `docs/PHASE_2_5F_ADMIN_CATALOG_REPORT.md`

## API Helpers Added/Updated

- Added `src/api/adminCategories.js` with `getAdminCategories`, `createAdminCategory`, `updateAdminCategory`, `toggleAdminCategory`, `deleteAdminCategory`, `normalizeAdminCategory`, and `splitCategoryTree`.
- Added `src/api/adminProducts.js` with `getAdminProducts`, `getAdminProduct`, `createAdminProduct`, `updateAdminProduct`, `toggleAdminProduct`, `deleteAdminProduct`, `normalizeAdminProduct`, and `buildAdminCategoryLookup`.
- Added backend upload handling inside the admin category/product helpers using `POST /api/upload/categories` and `POST /api/upload/products`.
- Added `resolveBackendAssetUrl` in `src/api/adapters.js`.
- Updated `src/api/catalog.js` to resolve backend `/uploads/...` category/product image paths.

## Backend Routes Used

- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PATCH /api/admin/categories/:id`
- `PATCH /api/admin/categories/:id/toggle`
- `DELETE /api/admin/categories/:id`
- `POST /api/upload/categories`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `PATCH /api/admin/products/:id/toggle`
- `DELETE /api/admin/products/:id`
- `POST /api/upload/products`
- Existing customer compatibility routes: `GET /api/categories`, `GET /api/me/products`, `GET /api/me/products/:id`.

## Categories Behavior

- Admin categories now load from `GET /api/admin/categories`.
- Main and subcategories are split from backend `parentCategory`.
- Create/update/delete use backend routes and refetch after success.
- Parent category deletion deletes child categories through backend delete calls first, then deletes the parent.
- Main and subcategory cards show active/hidden state from backend `isActive`.
- Category saves use backend-confirmed success only; local arrays are not treated as source of truth.

## Products Behavior

- Admin products now load from `GET /api/admin/products` with `page=1&limit=200`.
- Create/update/delete/toggle use backend routes and refetch after success.
- Product active/deactivated state maps to backend `isActive`; the existing pause/resume control calls `PATCH /api/admin/products/:id/toggle`.
- Product delete uses the backend soft-delete route.
- Provider-linked product creation/sync was not connected.

## Product Form Mapping

- Frontend `nameAr` is sent to backend `name`; backend has no separate `nameEn`.
- `finalPrice` maps to backend `basePrice`.
- `min` and `max` map to backend `minQty` and `maxQty`.
- `subCategoryId` is preferred for backend `category`; otherwise `mainCategoryId` is sent.
- `description`, `image`, `displayOrder`, and `isActive` map directly to supported backend fields.
- New products use manual execution for this phase; existing provider-linked products can preserve their current execution type, but provider link fields are not submitted or managed.

## Dynamic/Order Fields Behavior

- Existing `ExtraFieldsBuilder` now validates backend-safe snake_case field keys, duplicate keys, select options, and numeric min/max bounds.
- Fields are sent as backend `orderFields` on create/update.
- Fields are also mirrored to backend `dynamicFields`; because the inspected create controller ignores `dynamicFields`, product create performs a backend-confirmed follow-up `PATCH /api/admin/products/:id` only when dynamic fields exist.
- Customer product lists can receive `dynamicFields`; product detail can receive `orderFields`.

## Image Upload Behavior

- Product/category forms keep local preview only for UX.
- If a file is selected, the frontend uploads it first through `POST /api/upload/products` or `POST /api/upload/categories`.
- The saved catalog payload uses the backend returned `data.path`.
- Empty images are not replaced with a fake `/logo.png` backend value.

## Filters/Pagination Behavior

- Backend admin product list currently supports `page` and `limit` in the inspected controller.
- Search, category, status, link type, and sort are applied client-side within the loaded page.
- The page requests up to the backend maximum of 200 products and shows a warning if backend total exceeds the loaded page size.
- Admin category routes do not expose pagination or search, so categories are loaded as returned.

## Customer Catalog Compatibility

- Public/customer category and product image paths now resolve backend upload URLs.
- Admin-created active categories appear through `GET /api/categories`.
- Admin-created active manual products appear through `GET /api/me/products`.
- Dynamic fields mirrored to `dynamicFields` are compatible with the existing customer purchase modal.

## Features Intentionally Not Connected

- Provider/supplier management.
- Provider product sync, publish-from-provider, provider linking, and provider price sync.
- Admin orders.
- Currencies.
- Payment settings.
- Supervisor management.
- Backend route aliases or backend changes.

## Mock Data Still Remaining

- `src/data/adminProducts.js` remains in the repository but is no longer imported by the admin products management page/components.
- Public home/best-selling fallback content and unrelated admin areas still have seed/mock data outside this phase.
- Provider/supplier admin pages remain outside this phase.

## Lint Result

- `npm.cmd run lint` passed.

## Build Result

- `npm.cmd run build` passed.

## Diff Check Result

- `git diff --check` passed.

## Remaining Warnings

- Vite build reported the existing large chunk warning for `index` over 500 kB.
- Git printed line-ending normalization warnings that LF will be replaced by CRLF when Git touches edited files.
- Git printed an unrelated configured `safe.directory` warning for another local path.

## Completion

Phase 2.5F is complete.
