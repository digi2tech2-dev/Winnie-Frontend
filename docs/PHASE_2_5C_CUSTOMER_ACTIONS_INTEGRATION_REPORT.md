# Phase 2.5C Customer Actions Integration Report

## Files Changed

- `src/api/orders.js`
- `src/api/deposits.js`
- `src/api/payments.js`
- `src/hooks/useCustomerPurchase.jsx`
- `src/components/ProductPurchaseModal.jsx`
- `src/components/PurchaseSuccessModal.jsx`
- `src/components/ProductCard.jsx`
- `src/pages/customer/CustomerCategoryProducts.jsx`
- `src/pages/customer/CustomerBestSelling.jsx`
- `src/pages/customer/CustomerDashboard.jsx`
- `src/pages/customer/CustomerWalletTopUp.jsx`
- `docs/PHASE_2_5C_CUSTOMER_ACTIONS_INTEGRATION_REPORT.md`

## API Helpers Added Or Updated

- Added `createCustomerOrder`, `buildCustomerOrderPayload`, and `normalizeCreatedOrder` in `src/api/orders.js`.
- Added `createDepositRequest`, `getCustomerDeposits`, and `normalizeDeposit` in `src/api/deposits.js`.
- Added `createPaymentIntent`, `getPaymentStatus`, `getCustomerPayments`, and `normalizePaymentIntent` in `src/api/payments.js`.

All helpers use the existing API client and response-envelope handling.

## Backend Routes Used

- `POST /api/orders` for customer order creation.
- `POST /api/me/deposits` for customer manual deposit requests.
- `POST /api/payments/intents` for online wallet top-up payment intent creation.
- Existing read refreshes continue to use wallet and transaction read APIs.

`POST /api/orders` was selected for order creation because the backend route is customer-authorized, supports idempotency, validates dynamic order fields, and performs server-side wallet debit and order creation.

## Product Purchase And Order Behavior

- Customer catalog purchase buttons now open the real purchase modal.
- The purchase modal submits backend product IDs and backend dynamic order fields.
- Quantity and required dynamic fields are validated in the UI before submit where the product metadata provides them.
- Backend remains the source of truth for price, balance, product availability, quantity limits, and order creation.
- The UI shows loading state while submitting and displays safe backend error messages.
- Success is shown only after the backend returns a created order.
- Wallet and order data are refreshed after successful dashboard purchases where that read state is already present.

## Purchase Success Behavior

- `PurchaseSuccessModal` now displays backend-created order data.
- It can show order number, backend ID, status, product name, quantity, total, submitted fields, and creation time when returned.
- It includes an order-details action when a backend order ID is available.
- Fake transaction IDs and frontend-only success receipts were removed.

## Manual Deposit Behavior

- Manual top-up submits `requestedAmount`, `currency`, `paymentMethodId`, optional `notes`, and the selected receipt file as multipart `FormData`.
- The request is sent to `POST /api/me/deposits`.
- Success copy clearly says the deposit request was submitted for admin review and the wallet balance changes only after approval.
- The form is cleared after successful backend creation.
- The frontend does not credit the wallet locally.

## Online Payment Intent Behavior

- Online/card-style top-up now creates a payment intent through `POST /api/payments/intents`.
- The frontend sends amount, currency, return URL, and cancel URL.
- If a checkout URL is returned, the UI shows an action to open it.
- Pending or action-required responses are presented as created payment intents, not completed wallet credits.
- The frontend does not call mock confirm or mock fail from normal customer UI.
- The frontend does not mark payments as succeeded from browser state.

## Wallet Refresh Behavior

- After connected top-up actions, the frontend refetches current user, wallet summary, and wallet transactions where available.
- After connected dashboard purchases, the frontend refetches wallet summary, wallet transactions, and customer orders.
- No wallet balance is calculated or credited locally after write actions.

## Duplicate Submit Prevention

- Purchase submit buttons are disabled while an order request is in progress.
- Wallet top-up submit buttons are disabled while deposit or payment intent creation is in progress.
- Order and payment-intent requests include an idempotency key where the backend supports it.

## Features Intentionally Not Connected

- Admin pages and admin actions.
- Referral actions and referral commission calculation.
- Group-change and sub-agent request actions.
- Notification mutations.
- Profile updates.
- Real payment gateway callbacks or webhook handling.
- Payment mock-confirm and mock-fail flows in normal customer UI.

## Remaining Mock Areas

- Backend payment gateways remain mock/provider-placeholder based until real gateway integration is completed server-side.
- Existing local/static promotional products are not treated as backend-orderable products.
- Local payment method display data may still exist for UI presentation, but it is not used to credit wallets or confirm payment success.

## Lint Result

- `npm.cmd run lint`: passed.

## Build Result

- `npm.cmd run build`: passed.

## Diff Check Result

- `git diff --check`: passed.

## Remaining Warnings

- Vite reports that the generated `index` chunk is larger than 500 kB after minification.
- Git emits an existing safe-directory warning for an unrelated configured path in this environment.
- Git reports LF-to-CRLF normalization warnings for modified frontend source files.

## Completion Status

- Phase 2.5C implementation is complete.
