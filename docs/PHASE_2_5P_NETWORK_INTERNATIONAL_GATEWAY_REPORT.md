# Phase 2.5P Network International Gateway Report

## Scope

Updated the customer online wallet top-up flow for Network International / N-Genius Hosted Payment Page. The frontend never collects card details and does not apply any wallet credit locally.

## Checkout Redirect

When `POST /api/payments/intents` returns a `checkoutUrl`, `CustomerWalletTopUp` now redirects the browser to that URL with `window.location.assign`. The page shows a redirecting/pending state and does not display wallet-credit success before backend verification.

## Return And Cancel Pages

Added public SPA routes:

- `/payment/success`
- `/payment/cancel`
- `/payment/pending`

These pages explain that returning from checkout is not a wallet-credit trigger. When a `paymentId` query parameter and user token are available, the page calls `POST /api/payments/:id/sync-status` and displays the backend-confirmed latest status. It only says wallet credit is recorded when the backend returns a succeeded payment with `creditedAt`.

## API Changes

Added `syncPaymentStatus(token, paymentId)` in `src/api/payments.js`.

No frontend secret env variables were added. Network API key, outlet reference, webhook secret, and base URL remain backend-only configuration.

## Risk And Manual Deposit Compatibility

Phase 2.5N risk-limit errors remain handled in the top-up form. Manual deposit submission and receipt upload behavior were not changed.

## Security Notes

- No card number, CVV, or expiry fields were added.
- Checkout happens on the provider hosted page.
- Return/cancel pages do not mutate wallet balance locally.
- The frontend never receives Network API key, access token, outlet reference, or webhook secret.

## Tests And Checks Run

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `git diff --check`: passed.

## Limitations

- Return-page status refresh depends on the user still having a valid frontend auth token.
- No frontend webhook handling exists; webhooks are backend-only future work.
- Vite still reports the existing large chunk warning during production build.
