# Phase 2.5V Final QA Bug Fixes Report

## Files Changed By This Phase

- `src/api/adminCurrencies.js`
- `src/api/adminProducts.js`
- `src/api/adminUsers.js`
- `src/components/ToastProvider.jsx`
- `src/pages/SettingsPage.jsx`
- `src/pages/admin/AdminBalanceRequestsPage.jsx`
- `src/pages/admin/AdminCurrenciesPage.jsx`
- `src/pages/customer/CustomerSettings.jsx`
- `src/pages/customer/CustomerWalletTopUp.jsx`
- `docs/PHASE_2_5V_FINAL_QA_BUG_FIXES_REPORT.md`

The frontend worktree already contained extensive in-progress UI changes. This phase did not remove any route, component, section, or feature and did not revert those changes.

## Currency User And Admin Behavior

- Customer settings load active currencies from the backend and update through `PATCH /api/me/currency`.
- Successful self-updates refresh the authenticated user before displaying success.
- The admin user currency helper now calls the dedicated `/admin/users/:id/currency` route and includes an audit reason.
- Existing admin user wallet controls continue to source selectable currencies from the active currencies endpoint.

## Currency Edit Behavior

- Existing currency edit UI now permits name and symbol edits.
- Market rate and active state remain visible and editable for existing currencies.
- Update payloads include name, symbol, market/platform rates, markup, and active state, then the page refetches.

## Product Price Fix

- The edited final price takes precedence over stale normalized base-price data.
- Product updates send matching `basePrice` and `finalPrice` values plus explicit manual/sync pricing state.
- Existing save behavior refetches the admin catalog after product and provider-link updates.
- Customer catalog and purchase modal continue to use backend product responses rather than local price substitution.

## Account Settings Alert Fix

- Starting a save clears prior toasts and prevents duplicate submissions.
- Preferences are persisted only after the async save succeeds.
- Currency success appears only after backend confirmation and current-user refresh.
- Unchanged currency now produces the normal settings-saved message instead of a misleading currency warning.
- Backend validation errors use the safe API error message and do not show success.

## Deposit Details Modal Fix

- The existing details modal is rendered through a document-body portal with a high stacking level.
- Header and action areas remain visible while the bounded body scrolls.
- Approve/reject controls use a sticky footer; receipt preview and confirmation layers remain above the details modal.
- Existing content and actions were preserved.

## Admin Customer Flow

- Existing `/admin/user/*` customer-facing routes and admin dashboard routes were preserved.
- Admin top-up no longer rejects the existing `/admin/user` base path.
- Backend authorization now supports admin self-service products, wallet, deposits, orders, and payments under normal ownership and balance rules.

## Security Notes

- Admin role and dashboard access remain unchanged.
- No admin wallet-adjustment controls were widened.
- No fake currency, price, payment, or transaction data was added.

## Tests And Checks

- Frontend lint: passed with `13` existing hook-dependency warnings outside this phase.
- Frontend production build: passed.
- Frontend diff check: passed.

## Limitations And Warnings

- The lint run reports unrelated existing React hook dependency warnings.
- Git reports existing `safe.directory` and LF-to-CRLF warnings.
- No Playwright dependency/browser is installed, so seeded desktop/mobile visual QA was not executed in this session.

## Completion Status

Implementation and automated verification are complete. Final production sign-off still requires the requested seeded browser checks for modal visibility and end-to-end customer/admin flows.
