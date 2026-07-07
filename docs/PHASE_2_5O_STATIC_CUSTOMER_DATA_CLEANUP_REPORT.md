# Phase 2.5O - Static Customer Data Cleanup Report

## 1. Files changed

- `src/api/catalog.js`
- `src/components/HeaderSearchOverlay.jsx`
- `src/components/HeroSection.jsx`
- `src/components/LoginCard.jsx`
- `src/components/ProductCard.jsx`
- `src/components/ProductPurchaseModal.jsx`
- `src/components/PublicHeader.jsx`
- `src/components/RightSidebar.jsx`
- `src/components/FloatingScrollProgress.jsx` deleted
- `src/components/home/CustomerReviews.jsx`
- `src/components/home/HeroBanner.jsx`
- `src/components/home/HomeShowcase.jsx`
- `src/components/home/HomeSlide.jsx`
- `src/components/home/MobileBottomNav.jsx`
- `src/components/home/OffersSection.jsx`
- `src/components/home/PopularGames.jsx`
- `src/components/home/PromoBanners.jsx`
- `src/components/home/PubgPromoBanner.jsx`
- `src/components/home/QuickCategories.jsx`
- `src/components/home/RecentAdditionsSection.jsx`
- `src/components/home/TrustedPayments.jsx`
- `src/data/catalog.js`
- `src/data/homeContent.js` deleted
- `src/layouts/AdminLayout.jsx`
- `src/layouts/CustomerLayout.jsx`
- `src/layouts/PublicLayout.jsx`
- `src/pages/DashboardPage.jsx`
- `src/pages/HomePage.jsx`
- `src/pages/NotificationsPage.jsx`
- `src/pages/OrderDetailPage.jsx`
- `src/pages/OrderTrackingPage.jsx`
- `src/pages/OrdersPage.jsx`
- `src/pages/SupportPage.jsx`
- `src/pages/customer/CustomerBestSelling.jsx`
- `src/pages/customer/CustomerDashboard.jsx`
- `src/pages/public/About.jsx`
- `src/pages/public/PublicCategories.jsx`
- `src/pages/public/PublicCategoryProducts.jsx`
- `src/pages/public/PublicHome.jsx`
- `src/utils/purchaseReceipt.js`

## 2. Static sections removed

- Deals/offers cards, including the old fake discounted product cards.
- Customer reviews and fake review counters.
- Static recently added app/service cards.
- PUBG/static promo banner.
- Static home slider.
- Floating percentage scroll widget.
- Legacy fake orders, order details, order tracking, support tickets, chat messages, and notification fallbacks.
- Public About hardcoded reach/satisfaction statistics band.

## 3. Sections converted to backend data

- Public home now loads categories/products from `getPublicCatalog()`.
- Public categories now load categories from `getCategories()`.
- Public category products now load products from `getPublicCatalog()` and filter by the real category.
- Public header search now uses products returned by `getPublicCatalog()` only.
- Customer dashboard continues to use `getCustomerCatalog()`, `getWalletSummary()`, `getWalletTransactions()`, and `getCustomerOrders()`.
- Customer product listing uses backend customer products when authenticated and public catalog products before login.

## 4. Sections hidden due to missing backend support

- Deals/offers: hidden because there is no reliable backend offer/discount flag in the current frontend API contract.
- Reviews/testimonials: hidden because there is no backend reviews endpoint in the current frontend API contract.
- Recently added: hidden unless real backend items include a parseable timestamp.
- Static slider/promo/helper home sections: hidden because they were decorative and not backend-backed.
- Public About statistics: hidden because the values were not backend-backed analytics.

## 5. Remaining customer-facing static content, if any

- Brand/legal/company copy, logo assets, generic empty-state text, and payment method labels remain.
- These are not transactional product, offer, review, rating, price, discount, or analytics claims.
- Admin tools retain minimal admin-only placeholder exports in `src/data/catalog.js`; they are outside customer/public catalog surfaces.

## 6. Why each remaining static item is safe

- Brand and legal copy identifies the company and does not represent customer activity or product inventory.
- Empty-state text explains absence of loaded backend data without inventing records.
- Generic payment labels do not create fake prices, discounts, products, orders, ratings, or reviews.

## 7. Tests/checks run

- `npm.cmd run lint`
- `npm.cmd run build`
- Static searches for removed fake product/service/review/percentage strings.
- Manual code-route verification for `/customer/dashboard`, `/customer/best-selling`, `/customer/categories`, `/customer/categories/:categoryId`, `/`, `/categories`, `/categories/:categoryId`, `/best-selling`, `/dashboard`, and `/customer/products`.

## 8. Remaining warnings

- `/customer/products` is not a defined route in `src/App.jsx`; the active customer product surfaces are `/customer/best-selling`, `/customer/categories`, and `/customer/categories/:categoryId`.
- `/dashboard` is not a defined public route in `src/App.jsx`; the legacy `DashboardPage` was neutralized and the active dashboard is `/customer/dashboard`.
- `npm.cmd run build` completed with the existing Vite chunk-size warning for a chunk over 500 kB.
- Static search still finds numeric strings such as `42`/`68` in CSS gradient values; these are styling percentages, not customer data widgets.
- `git diff --check` passed; Git printed existing safe.directory and LF-to-CRLF working-copy warnings.

## 9. Completion status

- Phase 2.5O is complete.
