# Phase 2.5U - Product Automatic Provider Linking Report

## Files Changed

- `src/api/adminProducts.js`
- `src/components/admin/products/ProductFormModal.jsx`
- `src/components/admin/products/ProductPricing.jsx`
- `src/pages/admin/ProductsManagementPage.jsx`
- `docs/PHASE_2_5U_PRODUCT_AUTOMATIC_PROVIDER_LINKING_REPORT.md`

## Backend Routes Used

- `GET /api/admin/product-provider-options`
- `GET /api/admin/product-provider-options/:providerId/products`
- `PATCH /api/admin/products/:id/provider-link`
- `POST /api/admin/products/:id/provider-sync` remains used by the existing sync action.

The frontend never calls provider APIs directly.

## Provider Dropdown Behavior

The product create/edit pricing tab now enables the existing link mode buttons:

- manual link
- automatic link

When automatic mode is selected, the form loads active provider options from the backend, displays provider name/code, and shows a credential warning when the backend reports `credentialConfigured === false`.

## Provider Products Loading Behavior

After a provider is selected, the form loads provider products through the backend provider product option route. The UI supports search, loading state, error state, empty state, and selection from a safe list.

The selected provider product summary shows name, external id, quantity limits, and admin-safe provider price/currency when available from the backend response.

## Frontend Save / Edit Behavior

Product save now runs in two steps for automatic mode:

1. create or update the product using the normal admin product route
2. call `PATCH /api/admin/products/:id/provider-link` with automatic mode and selected provider product

Success is shown only after both steps succeed. If product save succeeds but provider link fails, the UI warns:

`Product was saved, but provider link failed. Open edit and try linking again.`

Edit mode preselects automatic mode for linked products, keeps the current provider product visible, and allows changing provider/product.

## Manual vs Automatic Behavior

Manual mode keeps the existing manual product fields and does not require provider selection.

When editing a linked product and switching to manual mode, the form asks for confirmation before clearing the provider link. Confirmed manual mode calls the backend provider-link route with manual unlink mode after the product save.

Automatic mode requires:

- provider selected
- provider product selected

The form sends optional sync flags:

- `syncPrice`
- `syncLimits`
- `syncName`

## API Helpers

`src/api/adminProducts.js` now includes / aliases:

- `getAdminProductProviderOptions`
- `getAdminProductProviderProductOptions`
- `linkAdminProductProvider`
- `unlinkAdminProductProvider`
- `syncAdminProductProvider`
- `getProviderLinkOptions`
- `getProviderProducts`
- `linkProductToProvider`
- `unlinkProductProvider`
- `syncProductWithProvider`

## Security Notes

- Provider credentials are not stored in frontend state.
- Provider credentials are not displayed in the product form.
- Provider products are loaded only from backend admin routes.
- The normal product payload no longer sets `executionType` from local automatic UI state; automatic fulfillment is backend-confirmed by provider-link.
- Manual product purchase behavior is left unchanged.

## Checks Run

- `npm.cmd run lint` - passed
- `npm.cmd run build` - passed
- `git diff --check` - passed

## Limitations

- The UI exposes existing sync flags but does not introduce a new provider field-mapping builder.
- Provider product pagination is loaded as the first 100 matching products in the create/edit modal; the existing standalone provider-link modal remains available.
- The production build reports an existing chunk-size warning for the main bundle.

## Completion Status

Phase 2.5U frontend work is complete.
