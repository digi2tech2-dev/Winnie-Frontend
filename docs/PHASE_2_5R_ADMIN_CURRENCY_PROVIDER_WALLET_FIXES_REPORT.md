# Phase 2.5R - Admin Currency / Provider / User Wallet Fixes

## Scope

Frontend changes are limited to registration currencies, provider quick-create UX, and admin user wallet/history access.

## Registration Currencies

- Registration now loads currencies from `GET /api/currencies/active`.
- The registration currency dropdown uses real active backend currencies only.
- The old hardcoded currency fallback list was removed.
- If active currencies cannot be loaded, the page shows a safe error and does not offer fake options.

## Provider Add Form

The add-provider modal now uses the quick-create shape:

- Provider name
- Provider code
- Base API URL
- Provider type / integration type
- Auth type
- Active checkbox

Auth type options:

- No authentication
- API Key
- Bearer Token
- Username and Password

Quick create does not ask for secrets. Edit mode keeps the existing advanced fields for credentials, sync interval, and supported features.

## Admin User Wallet Access

- User rows now include a visible `Wallet` action.
- The user details drawer includes a visible `Wallet & Transactions` action in the wallet section.
- New route:

```text
/admin/tools/users/:id/wallet
```

- The page shows user identity, wallet balance, credit limit, credit used, transaction history, loading/error states, empty state, and pagination.
- The page is read-only and has no balance mutation controls.

## Security Notes

- No provider secret is rendered in the provider list, modal, or wallet page.
- Registration does not hardcode or invent currencies.
- Admin wallet history does not create fake transactions or adjust balances.
- Payment, Network International, manual deposit, customer wallet top-up, and order flows were not changed.

## Verification

Checks run for this phase:

```text
npm.cmd run lint - passed
npm.cmd run build - passed
git diff --check - passed
```

Warnings observed: Vite reported an existing large chunk warning after build; Git emitted safe.directory and LF-to-CRLF working-copy warnings during diff check.
