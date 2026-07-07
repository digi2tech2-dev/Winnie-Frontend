# Phase 2.5N Payment Risk Limits Report

## Files changed

- `src/api/adminSettings.js`
- `src/api/errors.js`
- `src/api/payments.js`
- `src/pages/admin/SettingsPage.jsx`
- `src/pages/customer/CustomerWalletTopUp.jsx`
- `docs/PHASE_2_5N_PAYMENT_RISK_LIMITS_REPORT.md`

## Settings key and shape

The admin UI reads and writes the backend `paymentRiskLimits` setting:

```json
{
  "enabled": true,
  "maxSingleAmount": 1000,
  "hourlyAmountLimit": 1000,
  "dailyAmountLimit": 1500,
  "hourlyAttemptLimit": 3,
  "dailyAttemptLimit": 5,
  "newAccountHours": 24,
  "newAccountSingleAmount": 100,
  "newAccountDailyAmount": 200,
  "action": "BLOCK_ONLINE_PAYMENT",
  "customerMessage": "Your online top-up limit has been reached. Please use manual deposit or contact support."
}
```

The frontend always sends `action: "BLOCK_ONLINE_PAYMENT"` and does not expose gateway secrets.

## Admin UI behavior

`SettingsPage.jsx` now includes a `Payment Risk Limits` section with:

- Enable online payment risk limits.
- Max single online top-up amount.
- Hourly amount limit.
- Daily amount limit.
- Hourly attempt limit.
- Daily attempt limit.
- New account age window in hours.
- New account max single amount.
- New account daily amount.
- Customer blocked message.

Amounts are labeled as USD equivalent because the backend enforces limits with platform currency conversion before gateway intent creation.

## Customer blocked behavior

`CustomerWalletTopUp.jsx` detects `PAYMENT_RISK_LIMIT_REACHED`, displays the backend-safe message, avoids showing payment success, does not retry automatically, and provides a link back to wallet payment methods so the customer can choose manual deposit.

## Manual deposit behavior

Manual deposit submission is unchanged. The frontend does not add risk checks to manual deposits and does not block receipt-based deposit requests.

## API helper behavior

- `adminSettings.js` adds `normalizePaymentRiskLimits`, `getPaymentRiskLimits`, and `updatePaymentRiskLimits`.
- `payments.js` adds `PAYMENT_RISK_LIMIT_REACHED_CODE` and `isPaymentRiskLimitError`.
- `errors.js` preserves backend `details` and maps risk-limit errors to a customer-friendly message.

## Checks run

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `git diff --check`: passed.

## Limitations

- The frontend does not enforce risk limits. It only configures settings and displays backend decisions.
- Manual deposit availability depends on existing configured manual payment methods.
- Payment gateway success/failure behavior remains backend-confirmed only.

## Remaining warnings

- The admin settings form saves the full normalized risk object through the existing key/value settings API.
- Customers only see manual deposit alternatives that are already active in backend payment settings.
- Vite build still prints the existing large chunk warning for `index-*.js`.
- Git prints the workspace `safe.directory` warning and LF-to-CRLF notices during diff checks.

## Completion status

Phase 2.5N frontend work is complete.
