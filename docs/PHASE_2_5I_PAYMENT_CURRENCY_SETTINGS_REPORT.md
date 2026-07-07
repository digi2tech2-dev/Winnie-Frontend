# Phase 2.5I Payment / Currency / Settings Integration Report

## Files changed

- `src/api/adminPaymentMethods.js`
- `src/api/paymentMethods.js`
- `src/api/adminCurrencies.js`
- `src/api/currencies.js`
- `src/api/adminSettings.js`
- `src/App.jsx`
- `src/components/DashboardSidebar.jsx`
- `src/components/admin/payments/PaymentGroupCard.jsx`
- `src/components/admin/payments/PaymentGroupFormModal.jsx`
- `src/components/admin/payments/PaymentMethodCard.jsx`
- `src/components/admin/payments/PaymentMethodFormModal.jsx`
- `src/pages/admin/PaymentMethodsPage.jsx`
- `src/pages/admin/AdminCurrenciesPage.jsx`
- `src/pages/admin/SettingsPage.jsx`
- `src/pages/WalletPage.jsx`
- `src/pages/customer/CustomerWalletTopUp.jsx`
- `src/pages/customer/CustomerSettings.jsx`
- `src/pages/SettingsPage.jsx`
- `src/pages/ProfilePage.jsx`
- `docs/PHASE_2_5I_PAYMENT_CURRENCY_SETTINGS_REPORT.md`

## API helpers added/updated

- Added `adminPaymentMethods.js` for settings-backed admin payment group/method list/create/update/toggle/delete.
- Added `paymentMethods.js` for public customer-safe payment settings and upload-path-safe adapters.
- Added `adminCurrencies.js` for admin currency list/create/update/status.
- Added `currencies.js` for public active currencies and normalized currency records.
- Added `adminSettings.js` for exact backend setting keys and managed setting updates.

## Backend routes used

- `GET /api/admin/settings`
- `GET /api/admin/settings/:key`
- `PATCH /api/admin/settings/:key`
- `GET /api/settings/payment`
- `POST /api/upload/payments`
- `GET /api/admin/currencies`
- `POST /api/admin/currencies`
- `PATCH /api/admin/currencies/:code`
- `PATCH /api/admin/currencies/:code/status`
- `GET /api/currencies/active`
- Existing top-up routes retained: `POST /api/me/deposits`, `POST /api/payments/intents`

## Admin payment methods behavior

- Admin payment groups/methods now load from backend `paymentGroups` setting.
- Create/update/toggle/delete are persisted by writing the full `paymentGroups` setting through `PATCH /api/admin/settings/paymentGroups`.
- Mutations refetch backend settings after success.
- Safe fields are whitelisted; secret-like/provider credential fields are not rendered or saved.
- Delete/toggle actions require confirmation.
- There are no standalone backend `/admin/payment-methods` CRUD routes, so the integration is settings-backed.

## Customer top-up payment method behavior

- Wallet payment methods now load from `GET /api/settings/payment`.
- Customer top-up detail fetches the selected backend method by id from the same safe public settings data.
- Manual deposits submit `requestedAmount`, `currency`, `paymentMethodId`, `receipt`, and `notes` to `POST /api/me/deposits`.
- Manual deposit receipt upload remains required because the inspected backend route requires `receipt`.
- No wallet balance is credited locally.

## Online payment method/gateway behavior

- Online/card top-ups still use `POST /api/payments/intents`.
- If a configured backend payment method includes one of the accepted gateway constants, the frontend sends it as `gateway`.
- The frontend does not call mock confirm/fail endpoints and does not mark payment success.
- Real gateway callbacks/webhooks remain unconnected.

## Admin currencies behavior

- Admin currencies now load from `GET /api/admin/currencies`.
- Create uses `POST /api/admin/currencies`.
- Rate/markup updates use `PATCH /api/admin/currencies/:code`.
- Active/inactive status uses `PATCH /api/admin/currencies/:code/status`.
- Delete is not connected because no backend delete route exists.
- Exchange/platform rates are displayed from backend data only.

## Customer/profile currency behavior

- Customer settings load active supported currencies from `GET /api/currencies/active`.
- Currency selection is read-only/informational because no safe self-service user currency update route exists.
- Profile displays the current backend user currency as a read-only field.
- No currency value is mutated locally as source of truth.

## Admin settings behavior

- Added `/admin/tools/settings`.
- Connected only inspected setting keys: `maintenanceMode`, `orderTimeoutMinutes`, `providerRetryLimit`, `maxWalletAdjustment`, `defaultPaginationLimit`, `paymentInstructions`, and `whatsappNumber`.
- Payment groups/country accounts are shown as read-only counts on the settings page; payment groups are managed on the payment methods page.
- Unknown/broad settings and secrets are not sent.

## Image/icon upload behavior

- Payment group/method icon selections use local object URL preview only.
- When saved, files upload through `POST /api/upload/payments` using field `image`.
- Only the backend-returned upload path is persisted in settings.
- Base64 images are not persisted.

## Features intentionally not connected

- Standalone payment method CRUD routes, because backend does not expose them.
- Currency delete, because backend does not expose it.
- Customer self-service currency update, because backend does not expose it.
- Real gateway success callbacks/webhooks.
- Mock payment confirm/fail from customer UI.
- Payment gateway/provider credentials or secret settings.
- Broad arbitrary settings editor.
- Country account structured management.

## Mock data still remaining

- Legacy/demo data remains in `src/data/paymentMethods.js`, `src/data/adminManagement.js`, and `src/data/adminExtended.js` for untouched surfaces.
- Connected wallet/top-up/payment-method/currency admin surfaces no longer use those seeds as source of truth.
- Some public/registration/home marketing surfaces still have static payment/currency labels and were intentionally left out of scope.

## Lint result

- `npm.cmd run lint`: passed.

## Build result

- `npm.cmd run build`: passed.
- Vite emitted the existing chunk-size warning for large chunks.

## Diff check result

- `git diff --check`: passed with exit code 0.
- Git printed existing environment/line-ending warnings: malformed `safe.directory` warning and LF-to-CRLF notices.

## Remaining warnings

- No backend payment-method resource exists; payment methods are settings-backed.
- No backend currency delete route exists.
- No backend current-user currency update route exists.
- Vite chunk-size warning remains.
- Git prints a malformed `safe.directory` warning in this workspace.

## Phase 2.5I completion

Phase 2.5I is complete for backend-supported routes and explicitly documents unsupported settings/payment/currency capabilities.
