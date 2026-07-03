# Phase 2.5T - Admin User Wallet Controls & Group Assignment

## Scope

The existing admin user wallet page at `/admin/tools/users/:id/wallet` is now an operational wallet-control page.

## Frontend Files

- `src/api/adminWallet.js`
- `src/api/adminUsers.js`
- `src/api/adminGroups.js`
- `src/pages/admin/AdminUserWalletPage.jsx`
- `src/pages/admin/AdminUsersPage.jsx`

## Wallet Controls

The page now shows:

- Current wallet balance.
- Credit limit.
- Credit used.
- Ledger movement count.
- Available credit and available spend.
- Existing real transaction history.

Admin controls:

- `تعديل الرصيد`: amount, reason, add button, deduct button.
- `تعيين حد الدين / حد الائتمان`: new limit, reason, save button.
- `تغيير مجموعة التسعير`: active group dropdown, reason, save button.

Each action asks for confirmation, disables while saving, calls the backend, shows a toast, then reloads wallet and transaction data from the backend.

## Group Assignment

The page loads active groups from `/api/admin/groups` through `src/api/adminGroups.js`.

Only backend-returned active groups are shown. The frontend does not infer pricing, does not update local group state before backend confirmation, and documents that pricing changes apply to future orders only.

## User List Access

The visible user-list and user-drawer wallet action is now labeled `Wallet & Controls`, pointing to the enhanced wallet page.

## Security Notes

- The frontend never mutates wallet balance locally.
- Add/deduct calls backend wallet adjustment endpoints.
- Credit-limit updates do not create local fake transactions.
- Group assignment calls a backend admin route and does not change user role.
- No provider/payment secrets are requested or rendered.

## Tests/Checks

- Frontend lint run: `npm.cmd run lint` passed.
- Frontend build run: `npm.cmd run build` passed with the existing Vite large chunk warning.
- Frontend diff check: `git diff --check` passed.

## Limitations

- Group selection depends on the admin having access to `/api/admin/groups`.
- The UI does not expose exact balance setting, only add/deduct controls.

## Status

Implementation complete.
