# Phase 2.5P.1 Network Currency Conversion Report

## Scope

Updated the customer online wallet top-up experience to display backend-returned Network gateway charge details before redirecting to the hosted checkout page.

The frontend does not calculate exchange rates, collect card data, expose Network secrets, or credit the wallet from browser return pages.

## Display Behavior

When `POST /api/payments/intents` returns gateway charge fields, `CustomerWalletTopUp` shows:

- Requested amount, for example `100.00 EGP`.
- Secure checkout charge, for example `7.34 AED`.

The page uses only backend response fields:

- `requestedAmount`
- `requestedCurrency`
- `gatewayAmount`
- `gatewayCurrency`
- `exchangeRate`

No Network API key, access token, outlet reference, webhook secret, base URL, or raw provider payload is rendered.

## Submit And Redirect

The submit flow still calls the backend payment intent endpoint, shows loading/pending state, and redirects with `window.location.assign(checkoutUrl)` when a checkout URL is returned.

When a gateway charge is present, the redirect toast/message includes both the requested amount and secure checkout charge so the customer sees the currency difference before leaving the app.

The frontend never shows wallet-credit success before backend verification.

## Error Handling

Added handling for `PAYMENT_CURRENCY_CONVERSION_UNAVAILABLE`.

The customer sees a friendly message suggesting another currency or manual deposit. Risk-limit handling from Phase 2.5N remains unchanged, and manual deposit stays available.

## Return Page

Return/cancel pages keep the Phase 2.5P behavior: a browser return is informational only. When possible, the page calls authenticated backend status sync and only reports wallet credit when the backend returns a succeeded payment with `creditedAt`.

## Tests And Checks Run

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `git diff --check`: passed.

## Limitations

- The frontend depends on backend-provided conversion data and does not preview conversion before submit.
- Return-page status refresh depends on the user still having a valid frontend auth token.
- Vite still reports the existing large chunk warning during production build.
