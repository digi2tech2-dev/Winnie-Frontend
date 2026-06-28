# Phase 2.5A Auth Integration Report

## Files changed

- `.env.example`
- `docs/PHASE_2_5A_AUTH_INTEGRATION_REPORT.md`
- `src/api/auth.js`
- `src/api/client.js`
- `src/api/errors.js`
- `src/api/me.js`
- `src/components/PublicBottomNav.jsx`
- `src/components/auth/ProtectedRoute.jsx`
- `src/context/AuthContext.jsx`
- `src/pages/public/Login.jsx`
- `src/pages/public/Register.jsx`
- `src/utils/authRoles.js`

## API client files added

- `src/api/client.js`: centralized `fetch` wrapper with `VITE_API_BASE_URL`, fallback `http://localhost:5000/api`, JSON bodies, FormData support, query params, bearer auth, backend envelope parsing, and normalized failures.
- `src/api/errors.js`: safe `ApiError` and user-facing auth error normalization for validation, invalid credentials, referral errors, email verification, pending approval, inactive/rejected users, 2FA, and network/server failures.
- `src/api/auth.js`: auth endpoint helpers for login, register, 2FA verification groundwork, local-only logout, and Google OAuth URL discovery.
- `src/api/me.js`: current-user helper for `GET /api/me`.

## Auth routes integrated

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/me`

Backend-inspected but not fully UI-integrated in this phase:

- `POST /api/auth/verify-2fa`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/auth/verify-email`
- `POST /api/auth/resend-verification`

## Token/session behavior

- JWT is stored in `localStorage` as `winnie-auth-token`.
- A normalized non-sensitive user cache is stored as `winnie-auth-user` for fast render only.
- App boot always refreshes the current user through `GET /api/me` before protected routes render.
- Legacy mock auth key `winnie-session` is cleared and never trusted.
- Logout clears token, cached user, legacy mock session, and the UI-only admin tools unlock key.
- No passwords or backend secrets are stored.

## Login behavior

- The active `/login` page submits email/password through `AuthContext.login`.
- Successful backend login stores the JWT and normalized user, then redirects by backend role.
- Backend errors are shown safely, including invalid credentials, email not verified, pending approval, rejected/inactive accounts, validation errors, network/server errors, and 2FA required.
- If the backend returns `requires2FA`, the frontend does not fake success and shows that 2FA verification UI remains to be built.

## Register behavior

- The active `/register` page submits to `POST /api/auth/register`.
- Frontend password validation now matches backend policy: at least 8 characters, one uppercase letter, one lowercase letter, and one number.
- Registration sends backend-supported fields only: `name`, `email`, `password`, `country`, `currency`, optional `phone`, and optional `inviteCode`.
- URL `inviteCode` or `referralCode` query params prefill the invite field.
- Invalid referral code and self-referral backend errors are surfaced clearly.
- Successful normal registration does not create a frontend session; it shows the email verification/admin approval state.
- Redirect after registration only happens if the backend returns an authenticated active session.

## Role normalization behavior

- `src/utils/authRoles.js` normalizes backend roles `ADMIN`, `SUPERVISOR`, and `CUSTOMER` to frontend route roles.
- `SUPERVISOR` may enter admin-style frontend routes but remains `supervisor`, not `admin`.
- `CUSTOMER` routes remain customer-only.
- Sub-agent fields are not used for role or permission inference.

## Protected route behavior

- Protected routes wait while auth is loading/current-user refresh is unresolved.
- Unauthenticated users are redirected to `/login` with the intended path preserved in location state.
- Role checks use normalized backend roles.
- Role mismatch redirects to the user role's default dashboard without relying on demo users.

## Google login status

- Fake Google user creation was removed from the active auth flow.
- The backend has Google OAuth routes, but the current frontend has no complete OAuth callback capture/2FA UI flow in this phase.
- Buttons now show "Google login is not configured in this frontend flow yet" instead of creating mock users.

## Remaining mock areas

Auth is now backend-backed, but non-auth modules intentionally remain mock/static for later phases:

- wallet
- deposits/top-ups/payments
- orders
- catalog/products/categories
- referrals/sub-agent dashboards
- notifications
- admin users/orders/products/groups/providers/payment methods/currencies/dashboard data

## Remaining auth limitations

- 2FA challenge UI is not implemented yet.
- Google OAuth callback handling is not implemented yet.
- Email verification and resend-verification screens are not implemented beyond backend status messaging.
- No refresh-token or backend logout endpoint exists in the inspected backend baseline.
- Admin tools PIN remains a UI-only gate and is not a security boundary.

## Verification results

- Lint result: `npm.cmd run lint` passed.
- Build result: `npm.cmd run build` passed. Vite reported a large chunk size warning.
- Diff check result: `git diff --check` passed. Git reported line-ending warnings only.
