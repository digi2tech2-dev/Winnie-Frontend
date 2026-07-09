# Phase 2.5I.1 Customer Currency Update Report

## Superseded behavior

Customer self-service currency changes are disabled. The earlier customer update flow documented here is no longer a supported product contract.

## Current contract

- `PATCH /api/me/currency` rejects every customer request with
  `CUSTOMER_CURRENCY_CHANGE_DISABLED`.
- `PATCH /api/users/me` rejects both `currency` and `walletCurrency`.
- Customer profile and settings screens display the assigned currency as read-only.
- Customer frontend code contains no currency mutation API call.
- Admin currency assignment remains available through
  `PATCH /api/admin/users/:id/currency`.
- Rejected requests do not change balances, credit fields, or wallet ledger entries.

The customer-facing message is:

> عملة الحساب يحددها المسؤول

## Verification

Backend coverage checks rejection, unchanged user/wallet state, no ledger entry, and profile payload aliases. Existing admin coverage verifies that an administrator can still change currency without changing wallet balance.
