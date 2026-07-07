# Phase 2.5I.1 Customer Currency Update Report

## Files changed

- `src/api/currencies.js`
- `src/pages/customer/CustomerSettings.jsx`
- `src/pages/ProfilePage.jsx`
- `src/pages/SettingsPage.jsx`
- `docs/PHASE_2_5I1_CUSTOMER_CURRENCY_UPDATE_REPORT.md`

## Route added

- Backend route consumed: `PATCH /api/me/currency`

## Request/response shape

Request:

```json
{
  "currency": "EGP"
}
```

Response:

```json
{
  "success": true,
  "message": "Currency updated.",
  "data": {
    "user": {},
    "currency": "EGP"
  }
}
```

## Validation behavior

The UI loads active currencies from `GET /api/currencies/active`, allows selecting only those codes, disables save while loading/submitting, and relies on backend validation for final acceptance.

## Frontend behavior

- Added `updateMyCurrency(currency, token)` in `src/api/currencies.js`.
- Customer settings now submits currency changes to `PATCH /api/me/currency`.
- After backend success, the auth context refetches the current user/session.
- The UI does not locally persist currency as source of truth.
- Save is disabled when the selected currency matches the current backend user currency.

## Tests/checks run

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `git diff --check`: passed.

## Remaining warnings

- Profile remains a read-only display surface and links users to settings conceptually through helper copy.
- Exchange-rate editing and admin currency behavior remain unchanged.
- Vite printed the existing large chunk-size warning.
- Git printed the existing malformed `safe.directory` warning and LF-to-CRLF notices.

## Completion status

Phase 2.5I.1 frontend implementation is complete.
