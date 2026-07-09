# Frontend to Backend Handoff

> Current contract update: customer account currency is read-only and may only
> be changed through admin controls. Normal email/password registration remains
> pending until email verification; successful verification activates the
> account immediately without a separate admin approval step.

## Arabic Summary

هذه المنصة هي واجهة أمامية لمنصة شحن محفظة وخدمات رقمية ومنتجات إلكترونية. المستخدم يسجل الدخول، يشحن رصيده بطرق دفع مختلفة منها Visa/Mastercard/Apple Pay، يشتري منتجات رقمية من أقسام متعددة، ويتابع الطلبات والمعاملات والإشعارات. توجد لوحة أدمن لإدارة المستخدمين، المجموعات، المنتجات، الموردين، طرق الدفع، طلبات الرصيد، الطلبات، العملات، المشرفين، وطلبات الوكيل الفرعي.

أهم وحدات الباك إند المطلوبة: المصادقة والمستخدمين، المحفظة والدفتر المالي، الدفع الإلكتروني وبوابات الدفع، نظام الدعوات والعمولات، مجموعات المستخدمين وطلبات تغيير المجموعة، المنتجات والأقسام، الطلبات، الموردين، الإشعارات، الإعدادات، وسجلات التدقيق. الواجهة الحالية تعتمد على بيانات وهمية و `localStorage/sessionStorage` ولا تحتوي على API حقيقي حتى الآن، لذلك يجب بناء عقود API مطابقة لاحتياجات الشاشات الحالية.

# 1. Executive Summary

This is a wallet-based digital services platform. Users can browse digital product categories, register or log in, charge wallet balance, buy products, track orders, manage profile/settings, view notifications, and use an invitation/sub-agent flow. Admin users can open a separate admin tools area to manage users, groups, products, suppliers, payment methods, balance requests, orders, currencies, supervisors, sub-agent requests, and dashboard operations.

**Main business flows confirmed from frontend:**

| Flow | Frontend behavior | Backend implication |
| --- | --- | --- |
| User registration/login | Login uses email/password against demo users. Register collects name, email, password, country, currency, phone, optional invite code. | Implement real auth, session/token, validation, optional referral code capture, email verification if required. |
| Wallet charging | Wallet page lists active wallet payment methods. Top-up page accepts amount and calculates payment method fee. | Implement wallet top-up creation, payment verification, ledger entries, and method availability. |
| Visa/payment gateway flow | Visa, Mastercard, Apple Pay are displayed as wallet top-up methods. There is no real gateway redirect/callback yet. | Backend must create payment sessions and credit wallet only after verified success. |
| Referral commission flow | Invite code appears in profile/sub-agent page and register form has optional invite code. Admin user drawer shows referral code/invites/earnings. | Implement referral relationship and deposit-based commission. Exact rate and event rules need confirmation. |
| Group/customer level flow | Groups have markup/status; users have group/rate; users can request sub-agent upgrade; admin can approve/reject and choose group/rate. | Implement group CRUD, group membership, group-change/sub-agent request workflow, and group pricing rules. |
| Product purchase/order flow | Public/customer product pages show catalog. Customer purchase modal asks account/player ID, quantity, package, creates local receipt and success modal. | Implement products/categories, dynamic order fields, wallet debit/hold, order lifecycle, status tracking. |
| Admin management flow | Admin tools manage users, groups, suppliers, products, payment methods, balance requests, orders, currencies, supervisors, sub-agent requests, dashboard stats. | Implement secured admin APIs, permissions, audit logs, and financial controls. |

**Confirmed from frontend:** no real backend is currently wired. Data comes from JS seed files, local component state, `localStorage`, and `sessionStorage`.

# 2. Frontend Tech Stack

| Area | Confirmed details |
| --- | --- |
| Framework/library | React 19 SPA with Vite 7. |
| Routing | `react-router-dom` v7.17, `BrowserRouter`, lazy pages, nested layouts in `src/App.jsx`. |
| Animation | `framer-motion`, page transitions. |
| State management | React Context and local component state. Contexts: `AuthContext`, `ThemeContext`, `LanguageContext`, `ToastProvider`, `FeedbackProvider`. No Redux/Zustand. |
| API client | None found. No `axios`, no `fetch`, no API service folder. |
| Forms | Native controlled React forms. No React Hook Form/Formik. |
| Validation | Inline component-level validation. Mostly required fields, email format, password match/length, numeric amount checks. |
| Styling/UI | Tailwind CSS utility classes in JSX, global `src/styles.css`, `lucide-react` icons. |
| Storage | `localStorage` for mock sessions, preferences, avatar, admin-managed payment data, sub-agent request, reviews; `sessionStorage` for admin tools unlock. |
| Environment variables | No custom `VITE_*` variables found. `import.meta.env.PROD` only used for service worker registration. |
| Build commands | `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`. |
| Service worker | `src/main.jsx` registers `/sw.js` only in production. |

Important package scripts from `package.json`:

```json
{
  "dev": "vite --host 127.0.0.1",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview --host 127.0.0.1"
}
```

# 3. Project Structure

| Folder/file | What it contains | Backend relevance |
| --- | --- | --- |
| `src/App.jsx` | Full route tree, protected role routes, admin tools gate, legacy redirects. | Source of required frontend routes and access-control expectations. |
| `src/main.jsx` | React root, providers, router, service worker registration. | Shows no API provider exists and no env API URL is configured. |
| `src/context/AuthContext.jsx` | Mock auth, localStorage session, Google mock login, logout. | Defines current user shape and role behavior that backend must replace. |
| `src/components/auth/ProtectedRoute.jsx` | Role guard for `admin` and `customer`. | Backend must enforce same access server-side. |
| `src/layouts/CustomerLayout.jsx` | Customer shell, nav, unread notifications, wallet display. | Needs wallet, notifications, profile data. |
| `src/layouts/AdminLayout.jsx` | Admin shell and admin/user split. | Needs admin role and notifications. |
| `src/components/DashboardSidebar.jsx` | Customer/admin navigation, admin tools PIN gate, logout, profile display. | PIN gate is UI-only; backend must not trust it. |
| `src/pages/public/*` | Public home/about/categories/login/register/forgot password/article pages. | Auth, public catalog, static content. |
| `src/pages/customer/*` | Dashboard, categories, product purchase, orders, wallet, top-up, transactions, profile, settings, notifications, sub-agent. | Main customer APIs. |
| `src/pages/admin/*` | Admin dashboard, users, orders, products, groups, suppliers, payment methods, balance requests, currencies, supervisors, sub-agents. | Admin APIs and permissions. |
| `src/components/admin/*` | Admin modals/forms/cards/filters for products, groups, payments, orders. | Request payload and validation shapes. |
| `src/data/*.js` | Seed/mock data for catalog, users, dashboard, admin entities, payment methods, products, orders. | Backend should return equivalent real data. |
| `src/utils/customerReviews.js` | Local review persistence in localStorage. | Review endpoints needed if reviews remain. |
| `src/utils/purchaseReceipt.js` | Local receipt/order id shape after purchase. | Suggested order receipt response shape. |

# 4. Routes & Pages Map

Current data source legend: API = real HTTP call, Mock = JS seed file, Local = component state or browser storage, Hardcoded = literal values.

| Route path | Page/component | Access | Purpose | Data needed from backend | Current data source | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | `PublicHome` | Public | Marketing/home and product highlights. | Public categories, featured products, public content. | Mock/hardcoded | Uses public catalog/navigation data. |
| `/about` | `About` | Public | Company/about content and supported payment methods. | Static CMS content, payment method display. | Hardcoded | Payment method names include VISA, Mastercard, Apple Pay, Google Pay, Wallets, Bank Transfer, Local Pay. |
| `/categories` | `PublicCategories` | Public | Public category listing. | Category list. | Mock | From `src/data/catalog.js`. |
| `/categories/:categoryId` | `PublicCategoryProducts` | Public | Public category product list and login-on-purchase. | Category details, products, availability/prices. | Mock | Purchase requires login. |
| `/best-selling` | `CustomerBestSelling` with `loginOnPurchase` | Public | Public best-selling products. | Featured products. | Mock | Purchase redirects to login. |
| `/login` | `Login` | Public | Email/password login. | Auth login endpoint. | Local mock auth | Accepted policy checkbox is UI-only. |
| `/register` | `Register` | Public | Account creation and optional invite code. | Register, Google auth, countries/currencies, referral validation, verification. | Local mock flow | Email registration does not create real user currently. |
| `/forgot-password` | `ForgotPassword` | Public | Password reset request. | Forgot password endpoint. | Local toast only | No email is sent. |
| `/{importantLinks.slug}` | `ImportantArticlePage` | Public | Footer/static articles. | CMS article content. | Mock | Slugs come from `src/data/importantLinks.js`. |
| `/500` | `ErrorPage` | Public | Error page. | None. | Hardcoded | Client route only. |
| `/customer` | Redirect | Customer | Redirect to dashboard. | Auth session. | Local | Protected by `role="customer"`. |
| `/customer/dashboard` | `CustomerDashboard` | Customer | User dashboard. | Wallet balance, orders, products, stats, notifications. | Mock | Shared customer dashboard. |
| `/customer/best-selling` | `CustomerBestSelling` | Customer | Best-selling product purchase. | Product list. | Mock | Can open purchase modal. |
| `/customer/categories` | `CustomerCategories` | Customer | Category listing. | Categories. | Mock |  |
| `/customer/categories/:categoryId` | `CustomerCategoryProducts` | Customer | Category products and purchase. | Products, category, dynamic fields, pricing. | Mock | Purchase modal local only. |
| `/customer/orders` | `CustomerOrders` | Customer | Order history, filters/search. | User orders, statuses, pagination/filtering. | Mock | Filters local. |
| `/customer/order/:id` | `CustomerOrderDetails` | Customer | Order detail/timeline. | Order by id, timeline, wallet debit/refund info. | Mock | Timeline implies wallet payment confirmation. |
| `/customer/wallet` | `CustomerWallet` -> `WalletPage` | Customer | Balance and payment methods. | Wallet balance, active wallet payment methods. | Hardcoded/mock/localStorage | Balance literal `1,250.00`. |
| `/customer/wallet/top-up/:methodId` | `CustomerWalletTopUp` | Customer | Top-up amount, fee calculation, submit. | Payment method, top-up/payment initiation. | Mock/local state | No gateway call yet. |
| `/customer/wallet/transactions` | `CustomerWalletTransactions` | Customer | Top-up transaction history. | Transactions list, totals, filters. | Hardcoded | Search local. |
| `/customer/notifications` | `CustomerNotifications` | Customer | Notification center. | Notifications, read/unread update. | Mock/localStorage | Read ids stored in localStorage. |
| `/customer/profile` | `CustomerProfile` | Customer | Profile, avatar, invite code, password modal. | User profile, avatar upload, password update, referral code. | Local/mock | Email read-only in edit panel. |
| `/customer/settings` | `CustomerSettings` | Customer | Language, currency, notifications, security preferences. | User preferences, notification settings, 2FA setting. | localStorage | No backend persistence. |
| `/customer/sub-agent` | `CustomerSubAgent` | Customer | Invite/sub-agent dashboard and request form. | Referral stats, active invited agents, request status, withdrawal. | Hardcoded/localStorage | Stores request in `winnie-sub-agent-request`. |
| `/customer/about` | `About` | Customer | About page inside customer shell. | Static CMS content. | Hardcoded |  |
| `/customer/{importantLinks.slug}` | `ImportantArticlePage` | Customer | Customer static article. | CMS article content. | Mock |  |
| `/admin` | Redirect | Admin | Redirect to `/admin/tools/dashboard`. | Auth session/admin role. | Local | Admin tools still require sessionStorage unlock. |
| `/admin/user/*` | Customer pages with basePath `/admin/user` | Admin | Admin acting in user-facing shell. | Same as customer pages but admin role. | Mock/local | Includes dashboard, wallet, orders, profile, settings, sub-agent. |
| `/admin/tools` | `AdminToolsGate` | Admin + UI PIN | Redirect to dashboard if unlocked. | Admin permissions. | sessionStorage | Gate checks `winnie-admin-tools-unlocked`. |
| `/admin/tools/dashboard` | `AdminDashboardPage` | Admin tools | Admin analytics and operations. | Dashboard stats, alerts, activities, recent orders, users, wallets, products. | Mock/local state | Many local admin actions. |
| `/admin/tools/users` | `AdminUsersPage` | Admin tools | User management. | Users, filters, wallet balances, group, referral, transactions, settings. | Mock/local state | Includes financial adjustments. |
| `/admin/tools/orders` | `AdminOrdersPage` | Admin tools | Order management. | Orders, filters, status updates. | Mock/local state | Status editable to manual_review/processing/completed/rejected. |
| `/admin/tools/products` | `ProductsManagementPage` | Admin tools | Categories/products/provider linkage. | Main categories, subcategories, products, providers, supplier products. | Mock/local state | File uploads use base64 preview only. |
| `/admin/tools/groups` | `GroupsManagementPage` | Admin tools | Group CRUD and member transfer. | Groups, members, group markup/status. | Mock/local state | Cannot delete group with members. |
| `/admin/tools/suppliers` | `SuppliersManagementPage` | Admin tools | Supplier API credentials, testing, sync, supplier catalog. | Suppliers, credentials, products, sync status. | Mock/local state | Credentials must be encrypted backend-side. |
| `/admin/tools/payment-methods` | `PaymentMethodsPage` | Admin tools | Payment groups/methods CRUD. | Payment groups, methods, active flags, fees. | Mock/localStorage | Customer wallet reads these localStorage values. |
| `/admin/tools/supervisors` | `AdminSupervisorsPage` | Admin tools | Supervisor assignment, permissions, activity logs. | Users, supervisors, permissions, logs. | Mock/local state | Permission names are UI data. |
| `/admin/tools/balance-requests` | `AdminBalanceRequestsPage` | Admin tools | Review/approve/reject top-up requests. | Balance requests, receipts, status transitions. | Mock/local state | Approval toast says add balance. |
| `/admin/tools/currencies` | `AdminCurrenciesPage` | Admin tools | Currency catalog/favorites/rates. | Currencies, rates, favorites. | Mock/local state | Rate is against 1 USD. |
| `/admin/tools/sub-agents` | `AdminSubAgentsPage` | Admin tools | Referral earnings and sub-agent requests. | Earnings, requests, groups, approval/rejection. | Mock/localStorage | Approval can cancel previous inviter. Needs confirmation. |
| `/admin/tools/notifications` | `AdminToolsPage` | Admin tools | Generic admin notification/tools page. | Notifications or admin tool table. | Mock | Currently generic table, not a full notification CRUD. |
| `/admin/dashboard`, `/admin/orders`, `/admin/wallet`, etc. | `LegacyAdminRedirect` | Admin | Legacy redirects to `/admin/tools/*` or `/admin/user/*`. | None. | Client redirect | Preserve backend/frontend route compatibility if deep links exist. |
| `*` | `ErrorPage 404` | Public | Not found. | None. | Hardcoded | Client route only. |

# 5. Auth & User Flow

## Confirmed From Frontend

**Login screen fields:**

| Field | Required | Frontend validation |
| --- | --- | --- |
| `email` | Yes | Required and simple email regex. |
| `password` | Yes | Required. |
| policy acceptance | UI checkbox | Checkbox defaults true and is shown as accepted terms/privacy. |

Login calls `login({ email, password })` from `AuthContext`, compares against `src/data/demoUsers.js`, and saves a safe user object into `localStorage` key `winnie-session`. On success:

- Admin users navigate to `/admin/user/dashboard`.
- Customer users navigate to a previous role-compatible route or `/customer/dashboard`.

**Register screen fields:**

| Step | Field | Required | Notes |
| --- | --- | --- | --- |
| Account | `name` | Yes | Trimmed. |
| Account | `email` | Yes | Email regex. |
| Account | `password` | Yes | Minimum 6 characters. |
| Account | `confirmPassword` | Yes | Must match `password`. |
| Account | policy acceptance | Yes | Must be accepted. |
| Details | `country` | Yes | Options include US, Egypt, Saudi Arabia, UAE, Kuwait, Qatar. |
| Details | `currency` | Yes | Options include USD, EGP, `$`, AED, KWD, QAR. Needs cleanup/confirmation because `$` appears as a currency value. |
| Details | `phone` | Optional | Numeric input only, max length 14. |
| Details | `inviteCode` | Optional | Referral/invitation code. |

Email registration currently shows a “verification link sent” style success state but does not create a user. Google signup calls `loginWithGoogle({ country, currency, phone, inviteCode })`, creates a mock customer user, and stores it locally.

**Forgot/reset password:** `/forgot-password` collects email and shows a toast. No API call or reset token screen exists.

**Google/social login:** Google button exists on login/register. Login page only shows an info toast. Register page mock-signs-in with a generated Google user.

**Token storage method:** no token exists. Current safe user is stored as JSON at `localStorage["winnie-session"]`.

**Logout behavior:** `logout()` removes `winnie-session` and `winnie-admin-tools-unlocked`, then navigates to `/`.

**Current safe user object shape from frontend:**

```ts
interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  tier?: string;
  avatar?: string;
  country?: string;
  currency?: string;
  phone?: string;
  inviteCode?: string;
}
```

## Required Backend Endpoints

| Method | Endpoint | Payload/query | Response shape | Notes |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/register` | `{ name, email, password, country, currency, phone?, inviteCode? }` | `{ user, accessToken, refreshToken? }` or verification status | Validate invite code if provided. |
| `POST` | `/auth/login` | `{ email, password }` | `{ user, accessToken, refreshToken? }` | User must include role and group/tier fields. |
| `GET` | `/auth/me` | Auth header/session | `{ user }` | Replace `winnie-session` trust with server auth. |
| `POST` | `/auth/logout` | Auth | `{ success: true }` | Invalidate refresh token/session if used. |
| `POST` | `/auth/google` | `{ idToken, country?, currency?, phone?, inviteCode? }` | `{ user, accessToken, refreshToken? }` | Only needed if Google auth remains. |
| `POST` | `/auth/forgot-password` | `{ email }` | `{ success: true }` | Same response even if email not found. |
| `POST` | `/auth/reset-password` | `{ token, password }` | `{ success: true }` | No frontend route yet. Needs confirmation. |
| `POST` | `/auth/verify-email` | `{ token }` | `{ success: true }` | Registration UI implies verification. |
| `PATCH` | `/me/profile` | `{ name, country, phone, currency? }` | `{ user }` | Email is read-only in UI. |
| `PATCH` | `/me/password` | `{ currentPassword, newPassword }` | `{ success: true }` | Matches profile password modal. |
| `POST` | `/me/avatar` | multipart/base64 | `{ avatarUrl }` | Frontend currently stores avatar as local base64. |

# 6. Roles, Permissions, and Access Control

## Confirmed From Frontend

| Role/permission concept | Where found | Behavior |
| --- | --- | --- |
| `customer` | `AuthContext`, `ProtectedRoute`, routes | Can access `/customer/*`. |
| `admin` | `AuthContext`, `ProtectedRoute`, routes | Can access `/admin/*`. |
| Admin tools unlock | `DashboardSidebar`, `App.AdminToolsGate` | UI-only PIN `1111`, stored in `sessionStorage["winnie-admin-tools-unlocked"]`. |
| Supervisor permissions | `src/data/adminExtended.js`, `AdminSupervisorsPage` | Permissions are assigned to supervisor users and logs are shown. They are not enforced in routing code. |
| User account switches | `AdminUsersPage` | Admin can toggle settings such as login/purchase/top-up/withdrawal suspension in local state. |

**Permission names found in frontend UI data:**

| Group | Permissions |
| --- | --- |
| Users | View users, Manage users, Verify accounts |
| Orders | View orders, Confirm orders |
| Products/groups | Manage groups, Manage products |
| Finance | Payments log, Manage balances, Wallets, Payment methods |
| Other | Manage suppliers, Customers, Confirm target requests, Activity logs, Manage WhatsApp settings |

## Backend Rules Needed

- Never trust `sessionStorage["winnie-admin-tools-unlocked"]` or PIN `1111`.
- Enforce `admin`/`customer` roles on every protected endpoint.
- If supervisors are real admin users, enforce assigned permission keys on each admin action.
- Enforce user status/settings server-side:
  - `loginSuspended` should block login.
  - `purchaseSuspended` should block order creation.
  - `topupSuspended` should block wallet top-up/deposit.
  - `withdrawalSuspended` should block referral/sub-agent withdrawals.
- Record audit logs for all admin financial changes and status changes.

# 7. User Groups / Customer Levels

## Confirmed From Frontend

Group and level logic appears in three places:

1. `AdminUsersPage` uses named user groups and rates.
2. `GroupsManagementPage` manages group records with markup/status/members.
3. `CustomerSubAgent` and `AdminSubAgentsPage` implement a user request to become a sub-agent or move to another group.

**User group names found:**

```ts
type UserGroupName =
  | "VIP"
  | "Silver"
  | "Gold"
  | "Reseller"
  | "Admin"
  | "Distributor"
  | "Retail";
```

**User group rates found in `adminUsers.js`:**

```ts
const userGroupRates = {
  VIP: 10,
  Silver: 3,
  Gold: 5,
  Reseller: 12,
  Admin: 0,
  Distributor: 15,
  Retail: 0
};
```

**Admin managed group shape found in `adminManagement.js`:**

```ts
interface AdminGroup {
  id: string;       // e.g. "grp-vip"
  name: string;     // e.g. "VIP customers"
  markup: number;   // percentage shown as "additional percentage"
  status: "active" | "inactive";
}
```

**Group member shape found:**

```ts
interface GroupMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  groupId: string;
}
```

**Sub-agent/group-change request shape found:**

```ts
interface SubAgentRequest {
  id: string;               // e.g. "SAR-..."
  userId: string;
  name: string;
  email: string;
  message: string;
  currentGroup: string;
  currentRate: number;
  invitedBy: string | null;
  status: "pending" | "approved" | "rejected";
  date: string;
  newGroup?: string;
  newRate?: number;
}
```

**UI actions:**

| Screen | User/admin action | Current behavior |
| --- | --- | --- |
| `/customer/sub-agent` | User submits request message | Requires message, stores one request in `localStorage["winnie-sub-agent-request"]`. |
| `/admin/tools/sub-agents` | Admin rejects request | Sets status to `rejected`. |
| `/admin/tools/sub-agents` | Admin accepts request | Opens group selection, sets `approved`, `newGroup`, `newRate`, clears `invitedBy`. |
| `/admin/tools/groups` | Admin adds/edits group | Fields: name, markup, status. |
| `/admin/tools/groups` | Admin deletes group | Blocked if group has members. |
| `/admin/tools/groups` | Admin transfers member | Select target group. |
| `/admin/tools/users` | Admin changes user group/rate | User drawer can update group, rate comes from `userGroupRates`. |

## Backend Endpoints Needed

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/groups` | Public/customer list of active groups if users can request groups. |
| `GET` | `/me/group` | Current user group, rate/markup, limits, permissions. |
| `POST` | `/me/group-change-requests` | User creates a group/sub-agent change request with message and optional requested group. |
| `GET` | `/me/group-change-requests/latest` | Show current request status in customer sub-agent page. |
| `GET` | `/admin/groups` | Admin group list with member counts. |
| `POST` | `/admin/groups` | Create group. |
| `PATCH` | `/admin/groups/:id` | Update name/markup/status. |
| `DELETE` | `/admin/groups/:id` | Delete if no members. |
| `PATCH` | `/admin/group-members/:memberId/group` | Transfer member to another group. |
| `GET` | `/admin/group-change-requests` | Admin list of requests. |
| `PATCH` | `/admin/group-change-requests/:id/approve` | Approve and set group/rate. |
| `PATCH` | `/admin/group-change-requests/:id/reject` | Reject with optional reason. |

## Needs Confirmation

- Does `markup` mean added product price percentage, discount percentage, commission percentage, or all of these in different contexts?
- Is a sub-agent request the same entity as a group-change request?
- Can users request any group, or only sub-agent/reseller/distributor groups?
- Does accepting a sub-agent request intentionally cancel the previous inviter/referral relationship? The frontend currently clears `invitedBy` on approval.
- Do group rates affect product prices, referral commission, top-up fees, purchase limits, or permissions?

# 8. Referral / Invitation System

## Confirmed From Frontend

| Feature | Where found | Current representation |
| --- | --- | --- |
| Referral/invite code display | `ProfilePage`, `CustomerSubAgent` | Hardcoded `WINNIE-333`. |
| Referral link | `CustomerSubAgent` | Hardcoded `https://winniefun.com/?ref=WINNIE-333`. |
| Copy/share | `ProfilePage`, `CustomerSubAgent` | Copies code/link to clipboard. |
| Referral input during registration | `Register` | Optional `inviteCode` field saved in Google mock user only. |
| Active invited agents | `CustomerSubAgent` | Hardcoded list with name, avatar, profit, status. |
| Referral/sub-agent profit | `CustomerSubAgent` | Sums hardcoded `profit`; withdraw to wallet only shows toast. |
| Admin invited users/referral fields | `AdminUsersPage` | User drawer shows `invitedBy`, `referralCode`, `referralInvites`, `referralEarnings`, invited accounts. |
| Admin referral earnings | `AdminSubAgentsPage` | Uses `agentEarningsSeed` with agent, invited, orders, revenue, earning. |
| Admin commission percentage setting | Not found as a dedicated setting | Group rates and sub-agent rates exist, but no clear referral percentage settings page. |

## Business Logic Required By Client Request

**Proposed backend requirement based on user request:** When User A invites User B using A's referral code, and User B successfully deposits/charges wallet balance, User A receives a commission calculated as an admin-controlled percentage of the successful deposit amount. Failed, rejected, canceled, or pending deposits must not generate commission.

This behavior is only partially represented in frontend UI. The frontend has referral code entry/display and referral earnings, but it does not currently calculate commission from deposits.

## Expected Backend Entities

```ts
interface ReferralRelationship {
  id: string;
  inviterUserId: string;
  invitedUserId: string;
  referralCode: string;
  registeredAt: string;
  status: "active" | "canceled" | "blocked";
}

interface ReferralCommission {
  id: string;
  inviterUserId: string;
  invitedUserId: string;
  depositId: string;
  walletTransactionId: string;
  percentage: number;
  depositAmount: number;
  commissionAmount: number;
  currency: string;
  status: "pending" | "credited" | "reversed";
  createdAt: string;
  creditedAt?: string;
}

interface ReferralSettings {
  id: string;
  depositCommissionPercentage: number;
  appliesTo: "every_deposit" | "first_deposit_only";
  enabled: boolean;
  minDepositAmount?: number;
  maxCommissionAmount?: number;
  updatedBy: string;
  updatedAt: string;
}
```

## Needed Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/me/referral` | Return user's referral code, link, stats, invited users summary. |
| `GET` | `/me/referral/commissions` | Commission history. |
| `POST` | `/me/referral/withdraw-to-wallet` | Move available referral/sub-agent profit into wallet if this remains a separate balance. |
| `POST` | `/referrals/validate-code` | Validate invite code during registration. |
| `GET` | `/admin/referral-settings` | Get current commission rules. |
| `PATCH` | `/admin/referral-settings` | Update commission percentage/rules. |
| `GET` | `/admin/referrals/relationships` | Admin list/filter referral relationships. |
| `GET` | `/admin/referrals/commissions` | Admin commission history and totals. |

## Anti-Abuse Rules

- User cannot refer themselves.
- Referral code must be unique.
- A new user can have at most one inviter unless an admin explicitly changes it.
- Do not create commissions for pending, failed, rejected, reversed, or duplicate deposits.
- Use idempotency on deposit/payment events to prevent duplicate commission credit.
- If a deposit is later reversed, create a reversing ledger entry for commission.
- Lock referral settings used at the time of commission calculation on the commission record.

# 9. Wallet, Balance, Deposits, and Transactions

## Confirmed From Frontend

| Area | Current behavior |
| --- | --- |
| Balance display | `WalletPage` shows hardcoded `1,250.00`; `CustomerLayout`/sidebar uses `catalog.walletBalance` such as `$24.60`. |
| Payment methods | `getPaymentMethods()` returns active wallet payment methods from localStorage admin settings or seed Visa/Mastercard/Apple Pay. |
| Top-up form | Amount input; fee calculated as `amount * method.fee / 100`; total = amount + fee. |
| Top-up submit | Validates amount > 0, then shows success toast/feedback modal and navigates to transactions. |
| Transactions | `CustomerWalletTransactions` shows hardcoded completed top-ups. |
| Admin balance requests | `AdminBalanceRequestsPage` shows pending/approved/processing/rejected requests and lets admin approve/reject with actual amount/currency. |
| Admin user balance adjustment | `AdminUsersPage` supports increase/decrease/set with amount and reason. |
| Receipt/file upload | Admin balance request seed has `receipt` image URL. No customer receipt upload form found in wallet top-up flow. |

## Wallet Actions and API Expectations

| Action | Frontend screen | Fields | Endpoint | Request payload | Response |
| --- | --- | --- | --- | --- | --- |
| Load wallet | `WalletPage`, layout/sidebar | None | `GET /me/wallet` | None | `{ balance, currency, availableBalance, pendingBalance }` |
| Load wallet methods | `WalletPage` | None | `GET /payment-methods?wallet=true` | Query only | `{ methods: PaymentMethod[] }` |
| Initiate card top-up | `CustomerWalletTopUp` | `amount`, `methodId` | `POST /payments/card/initiate` | `{ amount, currency, methodId, returnUrl? }` | `{ paymentId, status, redirectUrl? iframeUrl? clientSecret? }` |
| Manual top-up request | Future/manual methods | amount, method, receipt? | `POST /wallet/top-up-requests` | `{ amount, currency, methodId, receiptFile? }` | `{ request: Deposit }` |
| Transaction history | `CustomerWalletTransactions` | search/status/date/page | `GET /me/wallet/transactions` | Query params | `{ transactions, total, page }` |
| Admin approve balance request | `AdminBalanceRequestsPage` | actualAmount, currency | `PATCH /admin/balance-requests/:id/approve` | `{ actualAmount, currency }` | `{ request, walletTransaction }` |
| Admin reject balance request | `AdminBalanceRequestsPage` | optional reason | `PATCH /admin/balance-requests/:id/reject` | `{ reason? }` | `{ request }` |
| Admin adjust user balance | `AdminUsersPage` | mode, amount, reason | `POST /admin/users/:id/balance-adjustments` | `{ mode: "increase"|"decrease"|"set", amount, reason }` | `{ user, transaction }` |

## Recommended Ledger Types

Use a single immutable wallet ledger. Current frontend/business flows need:

```ts
type WalletTransactionType =
  | "DEPOSIT_PENDING"
  | "DEPOSIT_APPROVED"
  | "DEPOSIT_REJECTED"
  | "CARD_PAYMENT_INITIATED"
  | "CARD_PAYMENT_SUCCESS"
  | "CARD_PAYMENT_FAILED"
  | "ORDER_HOLD"
  | "ORDER_DEBIT"
  | "ORDER_REFUND"
  | "REFERRAL_COMMISSION"
  | "REFERRAL_WITHDRAWAL"
  | "ADMIN_ADJUSTMENT";
```

## Statuses

| Entity | Statuses from frontend/proposed |
| --- | --- |
| Balance request/deposit | `pending`, `processing`, `approved`, `rejected` |
| Customer top-up transaction | `Completed` in UI; backend should normalize to `completed` or `success`. |
| Payment | `initiated`, `pending`, `paid`, `failed`, `expired`, `canceled`, `verified` |
| Wallet transaction | `pending`, `completed`, `failed`, `reversed` |

# 10. Visa / Payment Gateway Integration

## Confirmed Frontend Payment Screens

| Screen/file | Behavior |
| --- | --- |
| `WalletPage` | Lists wallet payment methods. Seed methods are Visa, Mastercard, Apple Pay. |
| `CustomerWalletTopUp` | Shows selected method details, amount, fee, total, account/bank/owner info, submit button. |
| `PaymentMethodsPage` | Admin CRUD for payment groups and methods, including group currency, fee percentage, account, bank, owner, active flag. |
| `About` | Publicly mentions secure global payments and displays VISA/Mastercard/Apple Pay/Google Pay/Wallets/Bank Transfer/Local Pay. |

## What Is Missing In Frontend

- No card number/CVV form.
- No payment iframe.
- No redirect URL handling.
- No `/payment/success`, `/payment/failure`, `/payments/callback`, or `/payments/status` frontend route.
- No gateway-specific names or keys.
- No `VITE_*` payment environment variables.
- No frontend call to create a payment session.

## Generic Gateway-Ready Flow Required

1. User enters amount on `/customer/wallet/top-up/:methodId`.
2. Frontend calls backend to create payment.
3. Backend creates payment session/intention with selected gateway.
4. Backend returns `redirectUrl`, `iframeUrl`, `clientSecret`, or hosted checkout token.
5. Frontend redirects or opens gateway UI depending on gateway.
6. Gateway returns user to success/failure URL.
7. Backend verifies payment server-side using gateway API and webhook/callback signature.
8. Backend credits wallet only after verified successful payment.
9. Backend creates wallet transaction records.
10. Backend calculates referral commission only after wallet credit succeeds.
11. Frontend displays final status in wallet transactions or a payment status screen.

## Proposed Endpoints

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/payments/card/initiate` | Customer | Create gateway payment session for wallet top-up. |
| `GET` | `/payments/:paymentId/status` | Customer/admin | Poll payment/deposit status. |
| `POST` | `/payments/webhook/:gateway` | Gateway signed | Receive gateway server webhook. |
| `GET` | `/payments/return/:gateway` | Public/session | User browser return route after payment. |
| `GET` | `/payments/callback/:gateway` | Public/session | Gateway/browser callback if gateway requires GET. |

**Needs confirmation:** because frontend has no success/failure route, decide whether backend should redirect back to `/customer/wallet/transactions?paymentId=...&status=...` or a new frontend route should be added later.

## Backend Responsibilities

- Store payment records before redirecting to gateway.
- Verify every payment server-side; never trust only browser return parameters.
- Verify webhook signatures and timestamps.
- Make webhook/callback idempotent using gateway reference and idempotency key.
- Credit wallet atomically with payment verification.
- Create ledger entries for initiation, success, failure.
- Trigger referral commission only once and only after wallet credit.
- Expose payment status to frontend.

# 11. Products, Categories, and Pricing

## Confirmed Customer/Public Product Data

Public and customer category pages use `src/data/catalog.js`:

```ts
interface PublicCategory {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  tone?: string;
}

interface PublicProduct {
  name: string;
  price: string; // display label, e.g. "$9.99"
  icon: string;
  tone?: string;
  packages?: ProductPackage[]; // supported by modal even if not common in seed data
}

interface ProductPackage {
  id: string;
  label: string;
  price: string;
}
```

Customer category page supports:

- Category lookup by `categoryId`.
- Search by product name.
- Purchase modal.
- Public mode requiring login before purchase.

## Confirmed Admin Product Data

From `src/data/adminProducts.js`:

```ts
interface MainCategory {
  id: string;
  name: string;
  image: string;
  displayOrder: number;
  visible: boolean;
}

interface SubCategory {
  id: string;
  name: string;
  image: string;
  parentId: string;
  displayOrder: number;
}

interface AdminProduct {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  mainCategoryId: string;
  subCategoryId: string;
  displayOrder: number;
  image: string;
  linkType: "manual" | "automatic";
  providerId: string;
  providerProductId: string;
  supplierPrice: number;
  supplierMin: number;
  supplierMax: number;
  min: number;
  max: number;
  originalPrice: number;
  finalPrice: number;
  profitMargin: number;
  status: "available" | "unavailable";
  visible: boolean;
  paused: boolean;
  createdAt: string;
  extraFields: ProductExtraField[];
}

interface ProductExtraField {
  id: string;
  label: string;
  key: string;
  required: boolean;
  placeholder: string;
  type: "text" | "number" | "email" | "select" | "textarea";
  active?: boolean;
}
```

## Admin Product Form Validation

| Field/condition | Frontend validation |
| --- | --- |
| `nameAr`, `nameEn` | Required. |
| `mainCategoryId` | Required. |
| `linkType === "automatic"` | Requires `providerId` and `providerProductId`. |
| `finalPrice` | Must be `>= 0`. |
| Supplier sync | Selecting supplier product copies price/min/max and sets suggested final price. |

## Pricing and Groups

**Confirmed:** admin group records have `markup`, and user groups have rates. Product records have `supplierPrice`, `originalPrice`, `finalPrice`, and `profitMargin`.

**Needs confirmation:** exact pricing formula:

- Does group `markup` add to `finalPrice`, discount from `finalPrice`, or set commission?
- Does `userGroupRates` override group `markup`?
- Are prices stored in one base currency and converted using admin currencies?

## Required Product Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/categories` | Customer/public category list. |
| `GET` | `/categories/:id/products` | Products in a category. |
| `GET` | `/products/:id` | Product details, packages, dynamic fields. |
| `GET` | `/admin/categories/main` | Admin main categories. |
| `POST/PATCH/DELETE` | `/admin/categories/main/:id?` | Admin category CRUD. |
| `GET` | `/admin/categories/sub` | Admin subcategories. |
| `POST/PATCH/DELETE` | `/admin/categories/sub/:id?` | Admin subcategory CRUD. |
| `GET` | `/admin/products` | Admin product list with filters. |
| `POST` | `/admin/products` | Create product. |
| `PATCH` | `/admin/products/:id` | Update product. |
| `DELETE` | `/admin/products/:id` | Delete product. |
| `PATCH` | `/admin/products/:id/status` | Toggle visible/paused/status. |

# 12. Orders / Purchase Flow

## Confirmed Customer Flow

1. User browses category or best-selling products.
2. User opens `ProductPurchaseModal`.
3. User enters `accountId` or player/account ID.
4. User chooses package if product provides `packages`.
5. User chooses quantity between 1 and 999.
6. Frontend calculates total by parsing display price.
7. Submit creates local receipt with `createPurchaseReceipt`.
8. `PurchaseSuccessModal` displays order id, product, package, account, quantity, total, created date.
9. User can submit review with rating/text.

**Current gap:** there is no wallet balance check, no API call, no wallet debit, and no order persistence in purchase modal.

## Confirmed Customer Order Data

From `src/data/catalog.js` and order detail pages:

```ts
interface CustomerOrder {
  id: string;              // e.g. "#WF-9041"
  product: string;
  status: string;          // Arabic display labels in seed
  price: string;
  date: string;
  delivery: string;
  progress?: number;
}
```

Order detail timeline includes:

- Order created.
- Payment confirmed / wallet debit.
- Provider processing.
- Delivery/completion.

## Confirmed Admin Order Data

From `src/data/adminOrders.js`:

```ts
interface AdminOrder {
  id: string;
  requestId: string;
  supplier: string;
  product: string;
  price: number;
  currency: string;
  status:
    | "completed"
    | "incomplete"
    | "processing"
    | "pending"
    | "rejected"
    | "manual_review";
  executionType: "automatic" | "manual";
  createdAt: string;
  quantity: number;
  playerId: string;
  username: string;
  userEmail: string;
  userId: string;
  provider: string;
  providerOrderId: string;
  supplierSync: string;
  productImage: string;
  accountName: string;
  accountId: string;
  accountEmail: string;
  accountImage: string;
}
```

Admin status modal edits only:

```ts
type EditableAdminOrderStatus =
  | "manual_review"
  | "processing"
  | "completed"
  | "rejected";
```

## Required Backend Validations

- Product exists, visible, not paused, and status is `available`.
- Required product dynamic fields are present and valid.
- Quantity is within product `min`/`max` and modal range.
- User wallet balance is sufficient unless direct card payment for orders is added.
- User is not purchase-suspended.
- Group price and currency conversion are applied consistently.
- For automatic products, provider product mapping exists and provider is active.
- Wallet debit/hold and order creation are atomic.
- On provider/order failure, refund or release hold using ledger entry.

## Suggested Order Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/orders` | Create order and debit/hold wallet. |
| `GET` | `/me/orders` | Customer order history with filters. |
| `GET` | `/me/orders/:id` | Customer order detail/timeline. |
| `POST` | `/orders/:id/review` | Save purchase review. |
| `GET` | `/admin/orders` | Admin order list with filters. |
| `GET` | `/admin/orders/:id` | Admin detail. |
| `PATCH` | `/admin/orders/:id/status` | Manual status update. |
| `POST` | `/admin/orders/:id/retry` | Retry provider execution if supported. |
| `POST` | `/admin/orders/:id/refund` | Refund failed/rejected order. |

# 13. Admin Dashboard & Management

| Admin page | Route | Data needed | Actions available in UI | Backend endpoint/permission |
| --- | --- | --- | --- | --- |
| Dashboard | `/admin/tools/dashboard` | Metrics, analytics, alerts, recent orders, requests, suppliers, wallets, users, products, activities. | Change order/manual request status, edit provider balance, adjust wallet/user balance, edit products, send notifications, refresh. | `GET /admin/dashboard`, plus order/wallet/user/product/notification permissions. |
| Users | `/admin/tools/users` | Users, group/rate, wallet, debt limit, referral data, transactions, settings. | Filter/search/sort, view drawer, update group/debt, toggle settings, block/unblock, balance adjustment, send email/notification, logout sessions, reset password. | `admin.users.*`, `admin.wallet.adjust`, `admin.notifications.send`. |
| Orders | `/admin/tools/orders` | Orders with product/user/provider/account details. | Filter/search/date/status/type, open details, update status. | `admin.orders.view`, `admin.orders.update`. |
| Products | `/admin/tools/products` | Main/sub categories, products, providers, supplier products. | CRUD categories/products, image upload, link manual/automatic, extra fields, visibility/status/pause. | `admin.products.*`. |
| Groups | `/admin/tools/groups` | Groups, members, member counts. | Add/edit/delete groups, transfer members. | `admin.groups.*`. |
| Suppliers | `/admin/tools/suppliers` | Suppliers, credentials, connection status, balances, supplier catalog. | CRUD supplier, test connection, sync products, enable/disable, view catalog/tools. | `admin.suppliers.*`. |
| Payment methods | `/admin/tools/payment-methods` | Payment groups/methods, currencies. | CRUD groups/methods, active toggles, refresh. | `admin.payment_methods.*`. |
| Supervisors | `/admin/tools/supervisors` | Users, supervisors, permission groups, logs. | Add supervisor, edit permissions, view logs, remove supervisor. | `admin.supervisors.*`, `admin.audit.view`. |
| Balance requests | `/admin/tools/balance-requests` | Balance requests, receipts, users, amounts, method, execution. | Filter/search, view details, approve/reject, edit actual amount/currency. | `admin.wallet.deposits.approve`. |
| Currencies | `/admin/tools/currencies` | Currency catalog, favorite currencies, rates. | Add favorite, edit rate, delete non-USD, search. | `admin.currencies.*`. |
| Sub-agents | `/admin/tools/sub-agents` | Referral/sub-agent earnings, requests, groups/rates. | View earnings, accept/reject requests, choose new group/rate. | `admin.referrals.view`, `admin.group_requests.update`. |
| Notifications/tools | `/admin/tools/notifications` | Generic admin table from mock catalog. | Currently display-only generic page. | Needs confirmation if full notification composer is required here. |

# 14. Forms, Validation, and UI States

| Form/screen | Fields | Frontend validation | Success behavior | Backend validation needed |
| --- | --- | --- | --- | --- |
| Login | email, password | Required, email regex. | Store session, navigate by role. | Credentials, status, rate limit, suspended login. |
| Register | name, email, password, confirm, country, currency, phone, inviteCode | Required account fields, email regex, password length/match, policy required, numeric phone. | Email flow shows verification; Google flow logs in. | Unique email/phone, password strength, referral code, allowed country/currency. |
| Forgot password | email | Required/email implied. | Toast. | Token generation, email dispatch, anti-enumeration. |
| Profile edit | name, country, phone, email read-only | Minimal/no save handler. | No real save. | Validate profile fields and phone. |
| Password modal | current, new, repeat | All required, new length >= 6, match. | Toast after confirmation. | Current password, password policy, session invalidation. |
| Settings | language, currency, notification toggles, security toggles | None beyond controlled values. | Save localStorage. | Persist preferences, validate currency. |
| Wallet top-up | amount | Numeric decimal, > 0. | Toast/feedback, navigate transactions. | Min/max amount, method active, currency, fees, user top-up allowed. |
| Sub-agent request | message | Non-empty. | Store pending request locally. | One active request, allowed target group, status validation. |
| Product purchase | accountId, package, quantity | accountId required, quantity 1-999. | Local receipt and success modal. | Dynamic fields, wallet balance, product availability, quantity min/max. |
| Review | rating, text | Rating and text required. | Store local review. | User purchased product/order, one review policy, content validation. |
| Group form | name, markup, status | Name required; markup numeric. | Local save. | Unique name, markup range, status enum. |
| Payment group form | name, currency, description, image, active | Name required before save. | Local save. | Currency supported, image upload rules. |
| Payment method form | groupId, name, description, fee, account, bank, owner, image, active | Name required; fee numeric. | Local save. | Fee range, group active, secure sensitive fields. |
| Product form | names, category, image, link type, provider mapping, prices, extra fields, status | Names/category required; automatic requires provider/product; finalPrice >= 0. | Local save. | Product uniqueness, provider mapping, price/limits, dynamic field schema. |
| Supplier form | name, code, apiUrl, authType, credential, active, autoExecution | Minimal. | Local save/test/sync. | URL/auth validation, encrypted credential, provider test. |
| Admin order status | selectedStatus | Status select. | Local status update. | Allowed transitions, refund/debit effects. |
| Balance request approval | actualAmount, currency | Actual amount editable numeric. | Local approved/rejected. | Amount/currency, idempotent wallet credit. |
| User balance adjustment | mode, amount, reason | Amount/reason required in UI flow. | Local balance change. | Non-negative balance, admin permission, audit. |
| Supervisor form | user, permissions | User required, permissions selected. | Local assignment. | User role eligibility, permission keys. |

# 15. Data Models Expected by Frontend

Use actual field names where found. Fields marked `proposed` are backend additions needed for safe implementation.

```ts
interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin" | "supervisor"; // supervisor proposed if implemented as role
  avatar?: string;
  tier?: string;
  group?: string;
  groupRate?: number;
  country?: string;
  currency?: string;
  phone?: string;
  balance?: number;
  debtLimit?: number;
  status?: "active" | "blocked" | "disabled";
  invitedBy?: { id?: string; name: string } | null;
  referralCode?: string;
  referralInvites?: number;
  referralEarnings?: number;
  referralEarningGenerated?: number;
  settings?: {
    apiEnabled?: boolean;
    loginSuspended?: boolean;
    purchaseSuspended?: boolean;
    topupSuspended?: boolean;
    withdrawalSuspended?: boolean;
  };
  createdAt?: string;
  lastLoginAt?: string;
}

interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}

interface Group {
  id: string;
  name: string;
  markup: number;
  status: "active" | "inactive";
  memberCount?: number;
}

interface GroupChangeRequest {
  id: string;
  userId: string;
  name: string;
  email: string;
  message: string;
  currentGroup: string;
  currentRate: number;
  requestedGroup?: string;
  newGroup?: string;
  newRate?: number;
  invitedBy?: string | null;
  status: "pending" | "approved" | "rejected";
  date: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

interface ReferralStats {
  referralCode: string;
  referralLink: string;
  invitedCount: number;
  activeAgents?: number;
  totalEarnings: number;
  availableEarnings: number;
  currency: string;
}

interface ReferralCommission {
  id: string;
  inviterUserId: string;
  invitedUserId: string;
  depositId: string;
  percentage: number;
  depositAmount: number;
  commissionAmount: number;
  currency: string;
  status: "pending" | "credited" | "reversed";
  createdAt: string;
}

interface Wallet {
  userId: string;
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
}

interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTransactionType;
  amount: number;
  currency: string;
  before?: number;
  after?: number;
  status: "pending" | "completed" | "failed" | "reversed";
  description?: string;
  referenceType?: "deposit" | "payment" | "order" | "referral" | "admin_adjustment";
  referenceId?: string;
  idempotencyKey?: string;
  actor?: string;
  reason?: string;
  createdAt: string;
}

interface Deposit {
  id: string;
  userId: string;
  amount: number;
  actualAmount?: number;
  currency: string;
  status: "pending" | "processing" | "approved" | "rejected";
  paymentMethod: string;
  execution: "manual" | "automatic";
  receipt?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface Payment {
  id: string;
  userId: string;
  gateway: string;
  methodId: string;
  amount: number;
  fee: number;
  total: number;
  currency: string;
  status: "initiated" | "pending" | "paid" | "failed" | "expired" | "canceled" | "verified";
  gatewayReference?: string;
  redirectUrl?: string;
  returnUrl?: string;
  createdAt: string;
  verifiedAt?: string;
}

interface PaymentGroup {
  id: string;
  name: string;
  currency: string;
  description: string;
  image: string;
  active: boolean;
}

interface PaymentMethod {
  id: string;
  groupId: string;
  title?: string;       // customer shape
  name?: string;        // admin shape
  description: string;
  fee: number;
  account: string;
  bank: string;
  owner: string;
  image: string;
  active?: boolean;
  walletMethod?: boolean;
}

interface Category {
  id: string;
  name?: string;
  title?: string;
  image?: string;
  subtitle?: string;
  icon?: string;
  displayOrder?: number;
  visible?: boolean;
  parentId?: string;
}

interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  mainCategoryId: string;
  subCategoryId?: string;
  image: string;
  linkType: "manual" | "automatic";
  providerId?: string;
  providerProductId?: string;
  min: number;
  max: number;
  originalPrice: number;
  finalPrice: number;
  profitMargin: number;
  status: "available" | "unavailable";
  visible: boolean;
  paused: boolean;
  extraFields: ProductExtraField[];
  packages?: ProductPackage[];
}

interface Order {
  id: string;
  userId: string;
  productId: string;
  product: string;
  quantity: number;
  price: number;
  currency: string;
  total: number;
  status: "pending" | "manual_review" | "processing" | "completed" | "rejected" | "incomplete" | "cancelled";
  executionType: "automatic" | "manual";
  accountId?: string;
  playerId?: string;
  dynamicFields?: Record<string, string | number>;
  provider?: string;
  providerOrderId?: string;
  supplierSync?: string;
  createdAt: string;
  completedAt?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "orders" | "wallet" | "offers" | "account" | string;
  level?: "info" | "success" | "warning" | "error";
  time?: string;
  unread: boolean;
  createdAt?: string;
}

interface AdminSettings {
  referral?: ReferralSettings;
  payment?: {
    enabledGateways: string[];
    defaultCurrency: string;
  };
  currencies?: {
    code: string;
    rate: number;
    symbol: string;
  }[];
}
```

# 16. API Contract

## Existing API Calls Found In Frontend

| Method | Endpoint | Auth required? | Used by | Request | Response | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| None | None | N/A | N/A | N/A | N/A | No `fetch`, `axios`, or API client was found in `src`. Current data is mock/local only. |

## Browser Storage Contracts Currently Used

| Storage key | Storage type | Used by | Shape/purpose |
| --- | --- | --- | --- |
| `winnie-session` | localStorage | `AuthContext` | Safe user object. |
| `winnie-admin-tools-unlocked` | sessionStorage | `App`, `DashboardSidebar`, `AuthContext` | `"true"` when admin tools UI is unlocked. |
| `winnie-admin-payment-methods` | localStorage | `PaymentMethodsPage`, `paymentMethods.js` | Admin payment method array. |
| `winnie-admin-payment-groups` | localStorage | `PaymentMethodsPage`, `paymentMethods.js` | Admin payment group array. |
| `winnie-sub-agent-request` | localStorage | `CustomerSubAgent`, `AdminSubAgentsPage` | Latest locally submitted sub-agent request. |
| `winnie-user-preferences` | localStorage | `SettingsPage` | Language/currency/notification/security preferences. |
| `winnie-notification-read-ids` | localStorage | Layouts/notifications | Array of read notification ids. |
| `winnie-profile-avatar` | localStorage | Profile/layout/header/reviews | Avatar URL/base64. |
| `winnie-customer-reviews` | localStorage | `customerReviews.js` | Review list. |
| `winnie-theme` | localStorage | `ThemeContext` | `"light"` or `"dark"`. |
| `winnie-language` | localStorage | `LanguageContext` | `"ar"` or `"en"`. |

## Proposed API Contract

| Method | Endpoint | Auth | Role/permission | Used by frontend file/component | Request body | Query params | Response shape | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST` | `/auth/register` | No | Public | `Register.jsx` | `{ name,email,password,country,currency,phone?,inviteCode? }` | None | `{ user?, verificationRequired?, accessToken? }` | Capture referral code. |
| `POST` | `/auth/login` | No | Public | `Login.jsx` | `{ email,password }` | None | `{ user, accessToken, refreshToken? }` | Enforce suspended login. |
| `GET` | `/auth/me` | Yes | Any | `AuthContext` replacement | None | None | `{ user }` | Hydrate session. |
| `POST` | `/auth/logout` | Yes | Any | `DashboardSidebar` | None | None | `{ success: true }` | Clear server session. |
| `POST` | `/auth/forgot-password` | No | Public | `ForgotPassword.jsx` | `{ email }` | None | `{ success: true }` | Anti-enumeration. |
| `PATCH` | `/me/profile` | Yes | Customer/admin | `ProfilePage.jsx` | `{ name,country,phone,currency? }` | None | `{ user }` | Email remains read-only. |
| `PATCH` | `/me/password` | Yes | Customer/admin | `ProfilePage.jsx` | `{ currentPassword,newPassword }` | None | `{ success: true }` |  |
| `GET` | `/me/wallet` | Yes | Customer/admin-user | `WalletPage`, layouts | None | None | `{ wallet }` |  |
| `GET` | `/me/wallet/transactions` | Yes | Customer/admin-user | `CustomerWalletTransactions.jsx` | None | `search,status,date,page,limit` | `{ transactions,total,page }` |  |
| `GET` | `/payment-methods` | Optional/Yes | Public/customer | `WalletPage`, `paymentMethods.js` | None | `wallet=true,currency?` | `{ methods, groups? }` | Only active methods for customer. |
| `POST` | `/payments/card/initiate` | Yes | Customer | `CustomerWalletTopUp.jsx` | `{ amount,currency,methodId,returnUrl? }` | None | `{ paymentId,status,redirectUrl?,iframeUrl?,clientSecret? }` | Card wallet top-up. |
| `GET` | `/payments/:paymentId/status` | Yes | Owner/admin | Top-up status future | None | None | `{ payment, deposit?, walletTransaction? }` |  |
| `POST` | `/payments/webhook/:gateway` | Gateway | Signed gateway | Gateway only | Gateway payload | None | `{ received: true }` | Verify signature. |
| `GET` | `/payments/return/:gateway` | Public/session | Public | Browser return | None | gateway params | Redirect | Needs frontend route decision. |
| `POST` | `/wallet/top-up-requests` | Yes | Customer | Manual deposit future/admin balance requests | multipart/JSON | None | `{ request }` | For non-card/manual methods. |
| `GET` | `/admin/balance-requests` | Yes | `admin.wallet.deposits.view` | `AdminBalanceRequestsPage.jsx` | None | `search,status,page,limit` | `{ requests,total }` |  |
| `PATCH` | `/admin/balance-requests/:id/approve` | Yes | `admin.wallet.deposits.approve` | `AdminBalanceRequestsPage.jsx` | `{ actualAmount,currency }` | None | `{ request,walletTransaction }` | Idempotent credit. |
| `PATCH` | `/admin/balance-requests/:id/reject` | Yes | `admin.wallet.deposits.approve` | `AdminBalanceRequestsPage.jsx` | `{ reason? }` | None | `{ request }` |  |
| `GET` | `/groups` | Yes | Customer/admin | `CustomerSubAgent`, group UI | None | `active?` | `{ groups }` |  |
| `GET` | `/me/group` | Yes | Customer | Group widgets future | None | None | `{ group, rate, permissions? }` |  |
| `POST` | `/me/group-change-requests` | Yes | Customer | `CustomerSubAgent.jsx` | `{ message, requestedGroup? }` | None | `{ request }` | One pending request. |
| `GET` | `/admin/group-change-requests` | Yes | `admin.groups.requests.view` | `AdminSubAgentsPage.jsx` | None | `status,search,page` | `{ requests,total }` |  |
| `PATCH` | `/admin/group-change-requests/:id/approve` | Yes | `admin.groups.requests.update` | `AdminSubAgentsPage.jsx` | `{ newGroup,newRate }` | None | `{ request,user }` |  |
| `PATCH` | `/admin/group-change-requests/:id/reject` | Yes | `admin.groups.requests.update` | `AdminSubAgentsPage.jsx` | `{ reason? }` | None | `{ request }` |  |
| `GET` | `/me/referral` | Yes | Customer | `ProfilePage`, `CustomerSubAgent` | None | None | `{ stats, invitedUsers }` |  |
| `GET` | `/me/referral/commissions` | Yes | Customer | Referral dashboard future | None | `page,status` | `{ commissions,total }` |  |
| `POST` | `/me/referral/withdraw-to-wallet` | Yes | Customer | `CustomerSubAgent` | `{ amount? }` | None | `{ wallet, transaction }` | If referral balance separate. |
| `GET` | `/admin/referral-settings` | Yes | `admin.referrals.settings` | Admin referral settings future | None | None | `{ settings }` | Not currently in UI. |
| `PATCH` | `/admin/referral-settings` | Yes | `admin.referrals.settings` | Admin referral settings future | `{ depositCommissionPercentage, appliesTo, enabled }` | None | `{ settings }` | Needed by business rule. |
| `GET` | `/categories` | Optional | Public/customer | Category pages | None | `visible=true` | `{ categories }` |  |
| `GET` | `/categories/:id/products` | Optional | Public/customer | Category product pages | None | `search,page,limit` | `{ category, products,total }` | Customer price may be group-aware. |
| `GET` | `/products/:id` | Optional | Public/customer | Purchase modal future | None | None | `{ product }` | Includes dynamic fields/packages. |
| `POST` | `/orders` | Yes | Customer | `ProductPurchaseModal.jsx` | `{ productId, packageId?, quantity, accountId, fields }` | None | `{ order, wallet }` | Atomic wallet hold/debit. |
| `GET` | `/me/orders` | Yes | Customer | `CustomerOrders.jsx` | None | `search,status,delivery,date,sort,page` | `{ orders,total }` |  |
| `GET` | `/me/orders/:id` | Yes | Owner/admin | `CustomerOrderDetails.jsx` | None | None | `{ order,timeline }` |  |
| `POST` | `/orders/:id/review` | Yes | Owner | `PurchaseSuccessModal.jsx` | `{ rating,message }` | None | `{ review }` |  |
| `GET` | `/admin/users` | Yes | `admin.users.view` | `AdminUsersPage.jsx` | None | `search,group,currency,status,sort,page` | `{ users,total }` |  |
| `GET` | `/admin/users/:id` | Yes | `admin.users.view` | `AdminUsersPage.jsx` | None | None | `{ user, transactions, invitedUsers }` | Drawer details. |
| `PATCH` | `/admin/users/:id` | Yes | `admin.users.update` | `AdminUsersPage.jsx` | partial user/group/settings | None | `{ user }` |  |
| `POST` | `/admin/users/:id/balance-adjustments` | Yes | `admin.wallet.adjust` | `AdminUsersPage.jsx`, dashboard | `{ mode,amount,reason }` | None | `{ user,transaction }` | Audit required. |
| `POST` | `/admin/users/:id/notifications` | Yes | `admin.notifications.send` | `AdminUsersPage.jsx` | `{ title,message }` | None | `{ notification }` |  |
| `POST` | `/admin/users/:id/logout-sessions` | Yes | `admin.users.security` | `AdminUsersPage.jsx` | None | None | `{ success: true }` |  |
| `GET` | `/admin/orders` | Yes | `admin.orders.view` | `AdminOrdersPage.jsx` | None | `search,status,type,dateFrom,dateTo,sort,page` | `{ orders,total }` |  |
| `PATCH` | `/admin/orders/:id/status` | Yes | `admin.orders.update` | `OrderDetailsModal.jsx` | `{ status, reason? }` | None | `{ order,walletTransaction? }` | Refund if rejected after debit. |
| `GET` | `/admin/products` | Yes | `admin.products.view` | `ProductsManagementPage.jsx` | None | `search,category,status,linkType,sort,page` | `{ products,total }` |  |
| `POST` | `/admin/products` | Yes | `admin.products.update` | Product form | `AdminProduct` | None | `{ product }` |  |
| `PATCH` | `/admin/products/:id` | Yes | `admin.products.update` | Product form | partial product | None | `{ product }` |  |
| `DELETE` | `/admin/products/:id` | Yes | `admin.products.delete` | Product cards | None | None | `{ success:true }` |  |
| `GET` | `/admin/payment-groups` | Yes | `admin.payment_methods.view` | `PaymentMethodsPage.jsx` | None | None | `{ groups }` |  |
| `POST/PATCH/DELETE` | `/admin/payment-groups/:id?` | Yes | `admin.payment_methods.update` | Payment group form | group payload | None | `{ group }` or `{ success }` | Prevent delete with methods. |
| `GET` | `/admin/payment-methods` | Yes | `admin.payment_methods.view` | `PaymentMethodsPage.jsx` | None | `groupId?` | `{ methods }` |  |
| `POST/PATCH/DELETE` | `/admin/payment-methods/:id?` | Yes | `admin.payment_methods.update` | Payment method form | method payload | None | `{ method }` or `{ success }` |  |
| `GET` | `/admin/suppliers` | Yes | `admin.suppliers.view` | `SuppliersManagementPage.jsx` | None | None | `{ suppliers }` |  |
| `POST/PATCH/DELETE` | `/admin/suppliers/:id?` | Yes | `admin.suppliers.update` | Supplier form | supplier payload | None | `{ supplier }` or `{ success }` | Encrypt credentials. |
| `POST` | `/admin/suppliers/:id/test` | Yes | `admin.suppliers.update` | Supplier tools | None | None | `{ connection,status }` |  |
| `POST` | `/admin/suppliers/:id/sync` | Yes | `admin.suppliers.update` | Supplier tools | None | None | `{ synced,lastSync,products }` |  |
| `GET` | `/admin/currencies` | Yes | `admin.currencies.view` | `AdminCurrenciesPage.jsx` | None | `search?` | `{ currencies,favorites }` |  |
| `PATCH` | `/admin/currencies/:code` | Yes | `admin.currencies.update` | Currency edit | `{ rate,favorite? }` | None | `{ currency }` |  |
| `GET` | `/admin/supervisors` | Yes | `admin.supervisors.view` | `AdminSupervisorsPage.jsx` | None | None | `{ supervisors,permissionGroups }` |  |
| `POST/PATCH/DELETE` | `/admin/supervisors/:id?` | Yes | `admin.supervisors.update` | Supervisor modals | `{ userId,permissions,status? }` | None | `{ supervisor }` or `{ success }` |  |
| `GET` | `/admin/audit-logs` | Yes | `admin.audit.view` | Supervisor logs/dashboard | None | `actorId,module,status,page` | `{ logs,total }` |  |
| `GET` | `/notifications` | Yes | Customer/admin | `NotificationsPage.jsx` | None | `type,unread,page` | `{ notifications,total }` |  |
| `PATCH` | `/notifications/read-all` | Yes | Customer/admin | Layout/notifications | None | None | `{ success:true }` |  |

# 17. Environment Variables

## Frontend Env Variables Found

| Variable | Used by | Meaning |
| --- | --- | --- |
| `import.meta.env.PROD` | `src/main.jsx` | Registers service worker in production. |

No custom `VITE_API_URL`, gateway key, or auth env variable was found.

## Suggested Frontend Env Variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL. |
| `VITE_APP_BASE_URL` | Public frontend URL for payment return/referral links. |
| `VITE_PAYMENT_RETURN_BASE_URL` | Optional explicit return URL base if different. |
| `VITE_ENABLE_GOOGLE_AUTH` | Feature flag if social login is added. |

## Suggested Backend Env Variables

| Category | Variables |
| --- | --- |
| Auth/JWT | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `PASSWORD_RESET_TTL` |
| Database | `MONGODB_URI`, `DATABASE_NAME` |
| App URLs | `API_BASE_URL`, `FRONTEND_BASE_URL`, `CORS_ORIGINS` |
| Payment gateways | `PAYMENT_GATEWAY_DEFAULT`, `VISA_GATEWAY_API_KEY`, `VISA_GATEWAY_SECRET`, `MASTERCARD_GATEWAY_*`, `APPLE_PAY_*`, `PAYMENT_WEBHOOK_SECRET_*` |
| Referral | `DEFAULT_REFERRAL_DEPOSIT_COMMISSION_PERCENT`, `REFERRAL_FIRST_DEPOSIT_ONLY` |
| Uploads | `UPLOAD_PROVIDER`, `UPLOAD_MAX_SIZE_MB`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` |
| Providers/suppliers | `SUPPLIER_SYNC_CRON`, provider API base URLs/keys if not stored encrypted in DB. |
| Email/SMS/OTP | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMS_PROVIDER_KEY`, `OTP_TTL` |
| Security | `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `ENCRYPTION_KEY`, `AUDIT_LOG_RETENTION_DAYS` |

# 18. Backend Architecture Recommendations

Assume Node.js / Express / MongoDB unless the backend team chooses otherwise. Keep modules simple and aligned with frontend pages.

```txt
src/
  modules/
    auth/
    users/
    groups/
    group-change-requests/
    wallet/
    payments/
    referrals/
    products/
    categories/
    orders/
    suppliers/
    payment-methods/
    currencies/
    supervisors/
    notifications/
    settings/
    admin-dashboard/
    audit-logs/
  shared/
    auth/
    validation/
    errors/
    pagination/
    uploads/
    database/
    idempotency/
```

| Module | Responsibility | Main models/services | Main endpoints |
| --- | --- | --- | --- |
| `auth` | Register, login, session, password reset, social auth. | User, tokens, password hashing, email verification. | `/auth/*` |
| `users` | Customer/admin user profiles, settings, balances summary. | User service, profile service. | `/me/*`, `/admin/users/*` |
| `groups` | Customer levels, markup/rates, membership transfer. | Group, user group mapping. | `/groups`, `/admin/groups/*` |
| `group-change-requests` | Sub-agent/group request workflow. | GroupChangeRequest. | `/me/group-change-requests`, `/admin/group-change-requests` |
| `wallet` | Wallet balances and immutable ledger. | Wallet, WalletTransaction, atomic balance updates. | `/me/wallet`, `/admin/balance-requests`, adjustments |
| `payments` | Card/gateway top-ups, webhooks, verification. | Payment, Deposit, gateway adapters. | `/payments/*` |
| `referrals` | Referral codes, relationships, deposit commissions. | ReferralRelationship, ReferralCommission, ReferralSettings. | `/me/referral`, `/admin/referrals/*` |
| `products` | Product CRUD, pricing, dynamic fields, provider mapping. | Product, pricing service. | `/products`, `/admin/products` |
| `categories` | Main/sub categories. | Category. | `/categories`, `/admin/categories/*` |
| `orders` | Purchase, wallet debit/hold, provider execution, history. | Order, order timeline, provider job. | `/orders`, `/me/orders`, `/admin/orders` |
| `suppliers` | Supplier credentials, connection test, product sync. | Supplier, SupplierProduct. | `/admin/suppliers/*` |
| `payment-methods` | Admin payment groups/methods and public active methods. | PaymentGroup, PaymentMethod. | `/payment-methods`, `/admin/payment-*` |
| `currencies` | Exchange rates and favorites. | Currency. | `/admin/currencies` |
| `supervisors` | Admin supervisor permissions. | Supervisor, Permission. | `/admin/supervisors` |
| `notifications` | User/admin notifications, read state, broadcast. | Notification, NotificationRead. | `/notifications`, `/admin/notifications` |
| `settings` | App-wide settings such as referral and payment configuration. | AppSettings. | `/admin/settings/*` |
| `admin-dashboard` | Aggregates dashboard cards/charts/lists. | Read-only aggregation services. | `/admin/dashboard` |
| `audit-logs` | Record admin/security/financial events. | AuditLog. | `/admin/audit-logs` |

# 19. Database Models Proposal

These schemas are backend proposals based on frontend requirements.

```ts
User {
  _id,
  name,
  email unique,
  phone unique sparse,
  passwordHash,
  role enum ["customer","admin","supervisor"],
  status enum ["active","blocked","disabled"],
  country,
  currency,
  groupId index,
  groupName,
  groupRate,
  referralCode unique,
  referredByUserId index nullable,
  avatarUrl,
  balanceSnapshot, // optional read cache only
  debtLimit,
  settings: {
    apiEnabled,
    loginSuspended,
    purchaseSuspended,
    topupSuspended,
    withdrawalSuspended,
    orderUpdates,
    walletAlerts,
    dailyOffers,
    twoFactor,
    loginAlerts,
    securePayments
  },
  emailVerifiedAt,
  lastLoginAt,
  createdAt,
  updatedAt
}

Group {
  _id,
  name unique,
  markup,
  rate,
  status enum ["active","inactive"],
  createdAt,
  updatedAt
}

GroupChangeRequest {
  _id,
  userId index,
  currentGroup,
  currentRate,
  requestedGroup,
  message,
  status enum ["pending","approved","rejected"],
  newGroup,
  newRate,
  reviewedBy,
  reviewedAt,
  rejectionReason,
  createdAt,
  updatedAt
}

Wallet {
  _id,
  userId unique,
  balance,
  availableBalance,
  pendingBalance,
  currency,
  version,
  updatedAt
}

WalletTransaction {
  _id,
  userId index,
  type index,
  amount,
  currency,
  balanceBefore,
  balanceAfter,
  status index,
  referenceType,
  referenceId index,
  idempotencyKey unique sparse,
  actorUserId,
  reason,
  metadata,
  createdAt index
}

Deposit {
  _id,
  userId index,
  paymentId index sparse,
  paymentMethodId,
  amount,
  actualAmount,
  currency,
  fee,
  total,
  status index,
  execution enum ["manual","automatic"],
  receiptUrl,
  reviewedBy,
  reviewedAt,
  rejectionReason,
  createdAt index
}

Payment {
  _id,
  userId index,
  depositId index,
  gateway index,
  methodId,
  amount,
  fee,
  total,
  currency,
  status index,
  gatewayReference unique sparse,
  idempotencyKey unique,
  redirectUrl,
  returnUrl,
  rawWebhookRefs,
  verifiedAt,
  createdAt index,
  updatedAt
}

ReferralRelationship {
  _id,
  inviterUserId index,
  invitedUserId unique,
  referralCode index,
  status enum ["active","canceled","blocked"],
  registeredAt,
  canceledAt,
  cancelReason
}

ReferralCommission {
  _id,
  inviterUserId index,
  invitedUserId index,
  depositId index,
  walletTransactionId,
  percentage,
  depositAmount,
  commissionAmount,
  currency,
  status index,
  idempotencyKey unique,
  creditedAt,
  createdAt index
}

ReferralSettings {
  _id,
  enabled,
  depositCommissionPercentage,
  appliesTo enum ["every_deposit","first_deposit_only"],
  minDepositAmount,
  maxCommissionAmount,
  updatedBy,
  updatedAt
}

Category {
  _id,
  type enum ["main","sub"],
  parentId index nullable,
  name,
  title,
  subtitle,
  image,
  icon,
  displayOrder,
  visible,
  createdAt,
  updatedAt
}

Product {
  _id,
  nameAr,
  nameEn,
  slug unique,
  description,
  mainCategoryId index,
  subCategoryId index,
  displayOrder,
  image,
  linkType enum ["manual","automatic"],
  providerId,
  providerProductId,
  supplierPrice,
  supplierMin,
  supplierMax,
  min,
  max,
  originalPrice,
  finalPrice,
  profitMargin,
  status index,
  visible index,
  paused index,
  extraFields,
  packages,
  createdAt,
  updatedAt
}

Order {
  _id,
  orderNumber unique,
  userId index,
  productId index,
  productSnapshot,
  quantity,
  unitPrice,
  total,
  currency,
  status index,
  executionType,
  accountId,
  playerId,
  dynamicFields,
  providerId,
  providerOrderId unique sparse,
  supplierSync,
  walletTransactionIds,
  idempotencyKey unique,
  createdAt index,
  updatedAt,
  completedAt
}

Supplier {
  _id,
  name,
  code unique,
  apiUrl,
  authType enum ["apiKey","token"],
  encryptedCredential,
  active,
  autoExecution,
  connection enum ["connected","failed","testing","unknown"],
  balance,
  email,
  synced,
  lastSync,
  createdAt,
  updatedAt
}

PaymentGroup {
  _id,
  name,
  currency,
  description,
  image,
  active,
  createdAt,
  updatedAt
}

PaymentMethod {
  _id,
  groupId index,
  name,
  description,
  fee,
  account,
  bank,
  owner,
  image,
  active,
  walletMethod,
  gatewayCode,
  createdAt,
  updatedAt
}

Notification {
  _id,
  userId index nullable,
  audience,
  title,
  message,
  type index,
  level,
  readByUserIds,
  createdBy,
  createdAt index
}

AppSettings {
  _id,
  key unique,
  value,
  updatedBy,
  updatedAt
}

AuditLog {
  _id,
  actorUserId index,
  actorRole,
  action index,
  module index,
  targetType,
  targetId index,
  status,
  before,
  after,
  ip,
  userAgent,
  createdAt index
}
```

Important indexes:

- `User.email` unique.
- `User.phone` unique sparse if phone is required/validated.
- `User.referralCode` unique.
- `ReferralRelationship.invitedUserId` unique.
- `Payment.gatewayReference` unique sparse.
- `Payment.idempotencyKey` unique.
- `WalletTransaction.idempotencyKey` unique sparse.
- `Order.orderNumber` unique.
- `Order.providerOrderId` unique sparse.
- Status/date indexes for `Order`, `Deposit`, `Payment`, `WalletTransaction`, `ReferralCommission`.
- `userId`, `groupId`, `categoryId`, `supplierId` indexes for frequent admin filters.

# 20. Critical Business Rules

- User cannot spend more than wallet available balance.
- Wallet must only be credited after manual deposit approval or verified successful payment.
- Card payment browser returns must not credit wallet unless server-side verification succeeds.
- Payment webhooks/callbacks must be idempotent.
- Wallet ledger must be append-only; never silently mutate financial history.
- Admin balance adjustments must require reason and be audit logged.
- Referral commission must only be created after successful wallet credit.
- Referral commission percentage is controlled by admin settings.
- Referral commission must be calculated from successful deposit amount, not failed/pending deposit.
- User cannot refer themselves.
- Referral code must be unique.
- Duplicate commission for the same deposit must be prevented.
- If a deposit/payment is reversed, related commission must be reversed or marked for recovery.
- Group change/sub-agent request should require admin approval if the current UI flow remains.
- Pricing may differ by group if the client confirms group markup/rates affect pricing.
- Product purchase must block unavailable, hidden, or paused products.
- Order creation and wallet debit/hold must be atomic.
- Orders should refund or release wallet hold on failure/rejection when user was charged.
- Admin-only actions must be enforced by backend permissions, not only hidden in UI.
- Admin tools PIN `1111` is not security and must not grant backend access.
- Supplier credentials must be encrypted and never returned in full to the frontend.
- File uploads such as receipts/images must be validated, scanned where possible, and stored outside the database when large.
- Currency conversion must use the rate locked at the transaction/order time.
- Every admin financial action should create an audit log entry.

# 21. Security Requirements

- Hash passwords with bcrypt/argon2; never store plaintext or frontend-style hashes.
- Use secure JWT/session strategy with short-lived access tokens and refresh token rotation or secure server sessions.
- Enforce role and permission checks on every protected endpoint.
- Validate and sanitize all input with shared schemas.
- Rate limit login, registration, forgot password, payment initiation, and referral validation.
- Verify payment webhook signatures and reject stale/replayed webhooks.
- Use idempotency keys for payment initiation, payment webhooks, wallet credits, order creation, and referral commission.
- Make wallet balance updates atomic with database transactions or optimistic concurrency.
- Prevent duplicate payment crediting by unique gateway references and payment status transitions.
- Prevent duplicate referral commission by unique `(depositId, inviterUserId)` or idempotency key.
- Restrict file uploads by MIME type, extension, size, and image dimensions where relevant.
- Store supplier credentials and payment secrets encrypted at rest.
- Do not expose full payment credentials, supplier credentials, or webhook secrets to frontend.
- Add audit logs for admin login, permission changes, user blocking, balance adjustment, deposit approval/rejection, order status changes, product price changes, payment method changes, and referral setting changes.
- Use CORS allowlist, security headers, and CSRF protection if cookie sessions are used.

# 22. Open Questions / Needs Confirmation

- Which payment gateways will be used for Visa/Mastercard/Apple Pay?
- Should card payment be wallet top-up only, or can it pay orders directly?
- Which frontend return route should be used after card payment? Current frontend has no payment success/failure page.
- What is the exact referral commission percentage and where should admin manage it?
- Does referral commission apply to every deposit or only the first successful deposit?
- Does referral commission apply to manual deposits, card deposits, or both?
- Can referral percentage differ by group/customer level?
- Does accepting a sub-agent request cancel the old inviter/referral relationship? Frontend currently implies yes.
- Can a user request any group or only specific groups such as Reseller/Distributor/Sub-agent?
- Does admin manually approve all group changes?
- Does group affect product price, permissions, limits, commission, or all of these?
- What is the exact meaning of group `markup` versus user group `rate`?
- Required currencies and base currency.
- Required countries and whether phone country codes must be validated.
- Required languages; UI supports Arabic/English preference.
- Required notifications: in-app only, email, SMS, WhatsApp, push?
- Required provider/supplier integrations and their API contracts.
- Should unavailable products be visible but disabled, or hidden completely?
- What is the order failure/refund policy for automatic provider failures?
- Are receipts/invoices/legal tax documents required?
- Are admin supervisors separate role accounts or permission overlays on admin users?
- Should admin tools PIN remain in the product, or be removed once real backend permissions exist?
- Should Google auth be implemented now or kept as a placeholder?

# 23. Backend Build Checklist

1. Setup project structure
   - Initialize Node.js/Express/MongoDB project.
   - Add config/env validation.
   - Add request validation, error handling, logging, pagination helpers.
   - Add auth middleware and permission middleware.

2. Auth/users
   - Implement register/login/logout/me.
   - Add password hashing and reset flow.
   - Add email verification if required.
   - Add user profile, avatar, preferences, and security settings.
   - Seed initial admin securely.

3. Groups
   - Create group schema and admin CRUD.
   - Implement user group membership and rates/markup.
   - Implement member transfer.
   - Confirm and implement group pricing/permission rules.

4. Wallet ledger
   - Create wallet and immutable transaction models.
   - Implement balance reads and transaction history.
   - Implement admin balance adjustments with audit logs.
   - Add atomic balance update utilities and idempotency.

5. Manual deposits
   - Implement top-up request model.
   - Add receipt upload if manual methods require it.
   - Implement admin approve/reject with wallet credit/rejection ledger.
   - Add filters/statuses for admin balance request page.

6. Card payments
   - Implement payment model and gateway adapter interface.
   - Add card payment initiation endpoint.
   - Add gateway webhook/return/callback handlers.
   - Verify payment server-side before wallet credit.
   - Add payment status endpoint.

7. Referral system
   - Generate unique referral codes for users.
   - Capture invite code during registration.
   - Create referral relationships.
   - Add admin referral settings.
   - On successful deposit wallet credit, calculate and credit commission once.
   - Add referral stats, commission history, withdrawal-to-wallet if separate balance.

8. Products/categories
   - Implement main/sub categories.
   - Implement product CRUD with dynamic fields, packages, visibility, paused/status.
   - Implement group-aware pricing after rules are confirmed.
   - Add supplier product linkage for automatic products.

9. Orders
   - Implement order creation with wallet hold/debit.
   - Validate dynamic fields and product availability.
   - Integrate automatic provider execution where available.
   - Implement order history/detail/timeline.
   - Implement admin status update and refund/retry rules.

10. Admin dashboard APIs
   - Add aggregate metrics endpoint.
   - Add recent orders/requests/users/products/suppliers/activity feeds.
   - Add dashboard actions through the underlying modules, not special bypass logic.

11. Notifications
   - Implement in-app notifications and read state.
   - Add user notification and broadcast endpoints.
   - Add email/SMS/WhatsApp later if confirmed.

12. Security/audit logs
   - Implement audit log model and helper.
   - Log every admin financial/security/product/payment setting action.
   - Add rate limits, CORS, upload restrictions, webhook signature checks.

13. Testing
   - Unit test wallet ledger and referral commission idempotency.
   - Integration test auth, deposits, card payment webhook, orders, refunds.
   - Permission tests for admin/supervisor endpoints.

14. Deployment
   - Configure production env vars.
   - Configure database indexes and migrations/seeders.
   - Configure file storage and payment webhook URLs.
   - Add monitoring, error tracking, and backup strategy.

# 24. File References

| File path | Why it matters | Backend feature |
| --- | --- | --- |
| `package.json` | Confirms Vite/React stack and scripts. | Build/deploy coordination. |
| `src/main.jsx` | Shows providers, router, service worker, no API provider. | App bootstrap/env. |
| `src/App.jsx` | Complete route map, protected routes, admin tools gate, legacy redirects. | Routing/access control/API scope. |
| `src/context/AuthContext.jsx` | Mock login/register session behavior and user shape. | Auth/user session. |
| `src/components/auth/ProtectedRoute.jsx` | Role guard logic. | Backend role enforcement. |
| `src/data/demoUsers.js` | Demo admin/customer users and safe user fields. | Initial auth seed/user model. |
| `src/pages/public/Login.jsx` | Login fields and validation. | `/auth/login`. |
| `src/pages/public/Register.jsx` | Registration fields, country/currency/phone/invite code, Google mock flow. | `/auth/register`, referrals, social auth. |
| `src/pages/public/ForgotPassword.jsx` | Forgot password UI. | `/auth/forgot-password`. |
| `src/layouts/CustomerLayout.jsx` | Customer shell, wallet balance, notifications read state. | Wallet/notifications/profile. |
| `src/layouts/AdminLayout.jsx` | Admin shell and admin/user path split. | Admin access and notifications. |
| `src/components/DashboardSidebar.jsx` | Admin tools PIN, nav items, logout, profile/id copy. | Admin permissions/security note. |
| `src/data/navigation.js` | Customer/admin navigation items. | Route modules and page visibility. |
| `src/data/catalog.js` | Public/customer categories, product groups, orders, notifications, wallet data. | Catalog/orders/notifications/wallet response shapes. |
| `src/pages/WalletPage.jsx` | Wallet balance and payment method list. | Wallet and payment methods. |
| `src/data/paymentMethods.js` | Payment method seeds, storage keys, wallet method filtering. | Payment method admin/customer API. |
| `src/pages/customer/CustomerWalletTopUp.jsx` | Top-up amount/fee form and current mock success flow. | Wallet top-up/card payment initiation. |
| `src/pages/customer/CustomerWalletTransactions.jsx` | Transaction list/search/summary shape. | Wallet transactions API. |
| `src/pages/customer/CustomerSubAgent.jsx` | Invite code/link, invited agents, profit, sub-agent request. | Referrals/group-change requests. |
| `src/pages/ProfilePage.jsx` | Profile edit, password modal, avatar, invite code. | Profile/password/avatar/referral. |
| `src/pages/SettingsPage.jsx` | Preferences shape stored locally. | User settings/preferences. |
| `src/components/ProductPurchaseModal.jsx` | Purchase fields, quantity validation, local receipt creation. | Order creation/dynamic fields/wallet debit. |
| `src/components/PurchaseSuccessModal.jsx` | Receipt display and review form. | Order receipt/reviews. |
| `src/utils/purchaseReceipt.js` | Local order receipt object. | Order response shape. |
| `src/utils/customerReviews.js` | Local review persistence shape. | Reviews API. |
| `src/data/adminUsers.js` | User groups/rates/currencies and admin user seed shapes. | Users/groups/referrals/wallet admin. |
| `src/pages/admin/AdminUsersPage.jsx` | User filters, drawer, referral fields, settings, balance adjustments. | Admin users/wallet/referral/security. |
| `src/data/adminManagement.js` | Payment groups/methods, group seeds, suppliers, supplier catalog. | Payments/groups/suppliers. |
| `src/pages/admin/GroupsManagementPage.jsx` | Group CRUD and member transfer behavior. | Groups/members. |
| `src/components/admin/groups/GroupFormModal.jsx` | Group form fields and validation. | Group API payload. |
| `src/pages/admin/PaymentMethodsPage.jsx` | Payment group/method CRUD and localStorage persistence. | Payment methods API. |
| `src/components/admin/payments/PaymentGroupFormModal.jsx` | Payment group fields. | Payment group payload. |
| `src/components/admin/payments/PaymentMethodFormModal.jsx` | Payment method fields. | Payment method payload. |
| `src/data/adminExtended.js` | Balance requests, sub-agent requests, earnings, supervisors, permissions, currencies. | Deposits/referrals/supervisors/currencies. |
| `src/pages/admin/AdminBalanceRequestsPage.jsx` | Admin approve/reject balance request workflow. | Manual deposits/wallet credit. |
| `src/pages/admin/AdminSubAgentsPage.jsx` | Referral earnings and sub-agent approval/rejection. | Referrals/group-change workflow. |
| `src/pages/admin/AdminSupervisorsPage.jsx` | Supervisor permissions/logs UI. | Permissions/audit logs. |
| `src/pages/admin/AdminCurrenciesPage.jsx` | Currency catalog/rate management. | Currency rates. |
| `src/data/adminProducts.js` | Admin product/category/provider/supplier product shapes. | Products/categories/providers. |
| `src/pages/admin/ProductsManagementPage.jsx` | Product/category CRUD and filters. | Product admin APIs. |
| `src/components/admin/products/ProductFormModal.jsx` | Product form validation/save behavior. | Product payload validation. |
| `src/components/admin/products/ProductPricing.jsx` | Manual/automatic pricing/provider linkage. | Provider integration/pricing. |
| `src/components/admin/products/ProductExtraFields.jsx` | Dynamic product field schema. | Order dynamic fields. |
| `src/data/adminOrders.js` | Admin order shape/status metadata. | Orders API/status enums. |
| `src/pages/admin/AdminOrdersPage.jsx` | Admin order filters and status update. | Admin orders API. |
| `src/components/admin/orders/OrderDetailsModal.jsx` | Admin order details and editable status list. | Order status transitions. |
| `src/pages/admin/SuppliersManagementPage.jsx` | Supplier CRUD/test/sync/tools. | Supplier integrations. |
| `src/data/adminDashboard.js` | Dashboard analytics, activities, actions seed data. | Admin dashboard aggregates/actions. |
| `src/pages/admin/AdminDashboardPage.jsx` | Admin dashboard operations. | Admin dashboard and audit-heavy actions. |
