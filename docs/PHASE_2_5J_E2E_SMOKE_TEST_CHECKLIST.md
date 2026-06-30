# Phase 2.5J E2E Smoke Test Checklist

## 1. Prerequisites

- Use a development database. Do not run smoke testing against production data.
- Backend `.env` includes:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `PROVIDER_CREDENTIALS_KEY` if provider features will be tested
  - `PAYMENTS_ENABLED=true`
  - `PAYMENT_ALLOWED_GATEWAYS=MOCK` if testing the optional mock-card payment intent
- Frontend `.env` includes:
  - `VITE_API_BASE_URL=http://localhost:5000/api` or the matching backend API URL
- Start backend and frontend:

```bash
cd Backend
npm run dev
```

```bash
cd Frontend
npm run dev
```

## 2. Seed command

Run once, or rerun any time. The seed is idempotent.

```bash
cd Backend
npm run seed:smoke
```

## 3. Test accounts

Default development credentials, unless overridden by env vars:

- Admin: `smoke.admin@example.com` / `SmokeAdmin123!`
- Active customer: `smoke.customer@example.com` / `SmokeCustomer123!`
- Pending customer: `smoke.pending@example.com` / `SmokePending123!`

Override variables:

- `SMOKE_ADMIN_EMAIL`, `SMOKE_ADMIN_PASSWORD`, `SMOKE_ADMIN_NAME`
- `SMOKE_CUSTOMER_EMAIL`, `SMOKE_CUSTOMER_PASSWORD`, `SMOKE_CUSTOMER_NAME`
- `SMOKE_PENDING_CUSTOMER_EMAIL`, `SMOKE_PENDING_CUSTOMER_PASSWORD`, `SMOKE_PENDING_CUSTOMER_NAME`

## 4. Admin flow

1. Log in as the smoke admin.
   - Expected: admin dashboard opens and authenticated admin routes load.
2. Open the users page.
   - Expected: active smoke customer and pending smoke customer are visible.
3. Approve the pending smoke customer.
   - Expected: backend confirms approval and the user status changes to `ACTIVE`.
4. Open currencies.
   - Expected: `USD` and `EGP` are listed and active.
5. Open payment methods.
   - Expected: `Smoke Payment Methods` group appears with `Smoke Vodafone Cash`.
6. Open products/categories.
   - Expected: `Smoke Games`, `Smoke Test Products`, and `Smoke Test Manual Product` appear.
7. Open admin orders.
   - Expected: the page loads, even if there are no orders yet.

## 5. Customer wallet and order flow

1. Log in as the active smoke customer.
   - Expected: customer routes open; pending users should not be used for this flow.
2. Open customer settings and change currency between `EGP` and `USD`.
   - Expected: save calls `PATCH /api/me/currency`, then the current user/session refreshes.
3. Switch currency back to `EGP` for the manual deposit test.
   - Expected: wallet/top-up uses the active backend currency.
4. Open wallet/top-up and choose `Smoke Vodafone Cash`.
   - Expected: account details, instructions, min/max, and receipt requirement come from backend payment settings.
5. Submit a manual deposit with a test receipt file. For the seeded 10 USD product and default 50 EGP platform rate, use at least `500 EGP` if the wallet currency is `EGP`.
   - Expected: deposit is created as pending; wallet balance does not change yet.
6. Log back in as admin and open manual deposit review.
   - Expected: the pending customer deposit is visible.
7. Approve the deposit.
   - Expected: backend approves the deposit and credits the customer wallet through wallet ledger logic.
8. Log back in as the customer and open wallet/transactions.
   - Expected: wallet balance and transaction history reflect the backend-approved deposit.
9. Open catalog and find `Smoke Test Manual Product`.
   - Expected: product is visible to the customer.
10. Open the product detail and submit an order with `player_id`.
    - Expected: order is created only if wallet balance is sufficient.
11. Open customer orders.
    - Expected: the new manual order appears.
12. Log in as admin and open admin orders.
    - Expected: the new order appears in list/details.
13. Complete or refund the manual order only when safe for the test data.
    - Expected: backend action confirms status and wallet changes, if any, come from backend logic.

## 6. Online payment intent check

1. If `PAYMENT_ALLOWED_GATEWAYS` includes `MOCK`, choose `Smoke Mock Card`.
   - Expected: frontend creates a backend payment intent.
2. Do not call mock confirm or mock fail from the customer UI.
   - Expected: wallet is not credited by intent creation alone.

## 7. Referral, sub-agent, and group-change flow

1. Log in as the active customer and open referral/settings surfaces.
   - Expected: referral code or referral summary loads from backend.
2. Submit a sub-agent request.
   - Expected: request appears as pending for the customer.
3. Submit a group-change request to `Silver`, `Gold`, or `Sub Agent` if available.
   - Expected: backend accepts only active group options.
4. Log in as admin and open group/sub-agent request review.
   - Expected: pending requests are visible.
5. Approve or reject a request.
   - Expected: backend confirms the decision and customer request/status data updates after refresh.

## 8. Optional provider flow

Only run this section if safe provider env vars are configured:

- `SMOKE_PROVIDER_NAME`
- `SMOKE_PROVIDER_BASE_URL`
- `SMOKE_PROVIDER_API_TOKEN`
- `PROVIDER_CREDENTIALS_KEY`

Steps:

1. Run `npm run seed:smoke`.
   - Expected: provider is created/updated without printing the token.
2. Open admin providers/suppliers.
   - Expected: provider appears with credential status booleans only.
3. Test provider connection only against a safe dev provider.
   - Expected: backend returns success or a redacted failure message.
4. Sync provider products only if the provider API is safe to call.
   - Expected: provider product list updates without exposing credentials.
5. Link or sync the smoke product only if the provider product is safe for testing.
   - Expected: backend-confirmed linking/sync behavior is reflected after refetch.

## 9. Expected results summary

- Admin and active customer can log in.
- Pending customer can be approved by admin.
- Customer top-up uses backend payment settings.
- Manual deposit stays pending until admin approval.
- Wallet balance changes only after backend approval.
- Seeded category/product are visible in admin and customer surfaces.
- Manual product order captures `player_id`.
- Admin order actions are backend-confirmed.
- Currency update uses `PATCH /api/me/currency`.
- Referral/group/sub-agent requests use real backend request workflows.

## 10. Troubleshooting

- No active group: rerun `npm run seed:smoke`; confirm groups are active in admin.
- Pending customer cannot log in or buy: approve the account first, or use the active smoke customer.
- Payment method missing: confirm `GET /api/settings/payment` returns `Smoke Payment Methods`.
- Receipt required: manual deposits require a file field named `receipt`.
- Insufficient wallet balance: submit and approve a manual deposit before ordering.
- Product not visible: confirm product, main category, and subcategory are active.
- Currency unsupported or inactive: confirm `GET /api/currencies/active` returns the selected currency.
- Provider credentials key missing: set `PROVIDER_CREDENTIALS_KEY` before provider seed/actions.
- API URL mismatch: confirm `VITE_API_BASE_URL` points to the backend `/api` base.
- CORS issue: confirm backend `ALLOWED_ORIGINS` allows the Vite origin.

## 11. Rollback and cleanup notes

- Do not use delete-all commands against shared databases.
- The smoke seed is idempotent and can be rerun safely.
- Disable or edit smoke records through the admin UI if needed.
- Prefer a dedicated local or QA database for smoke testing.
