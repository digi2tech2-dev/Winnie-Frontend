# Phase 2.5Q Network Webhook Reconciliation Report

## Scope

Frontend changes stay intentionally small. Webhook intake and wallet credit remain backend-only.

The return/cancel/pending pages keep the existing behavior: browser return is informational and never credits the wallet locally.

## Return Page Behavior

`PaymentReturnPage` still calls authenticated `POST /api/payments/:id/sync-status` when a `paymentId` query parameter and auth token are available.

The page only reports wallet credit when the backend returns a succeeded payment with `creditedAt`. It does not inspect webhook payloads and does not apply wallet balance changes locally.

## Admin Reconciliation Helper

Added `adminSyncPaymentStatus(token, paymentId)` in `src/api/payments.js`.

It calls:

`POST /api/admin/payments/:id/sync-status`

No Network API key, access token, outlet reference, webhook secret, or raw provider payload is exposed.

There is no existing admin payments page in the current frontend structure, so this phase adds the API helper and documents the UI hook as future work instead of building a large new admin screen.

## Tests And Checks Run

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `git diff --check`: passed.

## Limitations

- No admin payment reconciliation button was added because the app currently has payment-method settings pages, not a dedicated admin payments/reconciliation page.
- Reconciliation errors should be displayed with a safe message such as: `Could not verify payment status yet. Please try again later or contact support.`
