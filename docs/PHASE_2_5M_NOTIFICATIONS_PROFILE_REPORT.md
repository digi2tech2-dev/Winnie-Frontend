# Phase 2.5M - Notifications + Profile Actions Report

## Files Changed

- `src/api/notifications.js`
- `src/api/profile.js`
- `src/components/CustomerHeader.jsx`
- `src/layouts/CustomerLayout.jsx`
- `src/pages/NotificationsPage.jsx`
- `src/pages/customer/CustomerNotifications.jsx`
- `src/pages/ProfilePage.jsx`
- `docs/PHASE_2_5M_NOTIFICATIONS_PROFILE_REPORT.md`

## API Helpers Added/Updated

- Added notification mutation helpers for mark-one-read, mark-all-read, delete, and clear-read using the existing API client.
- Added `getMyNotifications` alias for current-user notification reads.
- Added profile helpers for `updateMyProfile` and `uploadMyAvatar`.
- Added explicit support flags in `profile.js`; password change remains unsupported.

## Backend Routes Used

- `GET /api/me/notifications`
- `GET /api/me/notifications/unread-count`
- `PATCH /api/me/notifications/:id/read`
- `PATCH /api/me/notifications/read-all`
- `DELETE /api/me/notifications/:id`
- `GET /api/me`
- `PATCH /api/users/me`
- `PATCH /api/users/me/avatar`

## Notification List/Count Behavior

- Customer layout loads notifications and unread count from backend.
- The header/sidebar unread count uses backend unread-count data.
- Customer notification page receives backend list/count through outlet context.
- Loading, error, and empty states remain visible.

## Notification Mutation Behavior

- Per-notification "Read" calls the backend mark-read route, then refetches list/count.
- "Mark all as read" calls the backend read-all route, then refetches list/count.
- Delete confirms with the user, calls the backend delete route, then refetches list/count.
- Buttons are disabled while a notification action is in flight.
- Local notification mutation remains only as a fallback for unconnected non-customer surfaces.

## Profile Update Behavior

- Profile save sends only safe supported fields: `name`, `phone`, and `username`.
- The frontend does not send role, status, wallet, balance, group, referral, verified, currency, or admin fields.
- After backend success, the frontend refreshes the auth user/session and profile snapshot.
- Email, country, and currency remain read-only/informational on the profile form.

## Password Change Behavior

- Password change is intentionally not connected.
- The inspected backend self-profile route can accept `password`, but there is no safe current-password verification route for this UI.
- The form marks password change as unavailable; menu action shows an informational message.

## Avatar Upload Behavior

- Avatar upload uses `PATCH /api/users/me/avatar` with `FormData` field `avatar`.
- Saved avatar URL/path comes from the backend.
- The frontend refreshes current user/profile after upload.
- Backend-relative `/uploads/...` avatar paths are resolved for header/profile rendering.

## Local-Only Preferences Behavior

- Existing customer settings preferences that are not backed by backend routes remain local/device preferences.
- Existing backend-backed currency selection remains separate and unchanged.

## Features Intentionally Not Connected

- Password change, because no safe current-password route exists.
- Generic upload routes, because customer avatar upload has a specific backend route.
- API token regeneration, because it is not a profile UX action and can expose sensitive data.
- Email/country/currency/profile role or account status edits from the profile form.
- Admin notification/account surfaces.

## Mock/Local Data Removed or Remaining

- Customer notification actions no longer fake read/delete state after backend mutation.
- `NotificationsPage` still keeps seed notification fallback for unconnected legacy/static usage.
- `CustomerHeader` keeps the prior local avatar fallback only after backend avatar resolution.
- Local settings preferences remain local-only by design.

## Tests/Checks Run

- `npm.cmd run lint` - passed.
- `npm.cmd run build` - passed.
- `git diff --check` - passed.

## Remaining Warnings

- Password change needs a backend route that validates `currentPassword` before it can be safely connected.
- Profile form updates only fields confirmed in the backend self-service route.
- Vite reported the existing large chunk warning during build.
- Git reported CRLF/LF conversion warnings during diff-check, but no whitespace errors.

## Completion Status

- Phase 2.5M is complete.
