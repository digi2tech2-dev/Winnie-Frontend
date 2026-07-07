# Phase 2.5D Referrals And Group Requests Report

## Files Changed

- `src/api/referrals.js`
- `src/api/groupRequests.js`
- `src/pages/customer/CustomerSubAgent.jsx`
- `src/pages/ProfilePage.jsx`
- `src/App.jsx`
- `docs/PHASE_2_5D_REFERRALS_GROUP_REQUESTS_REPORT.md`

## API Helpers Added Or Updated

- Added `getMyReferrals`, `getMyReferralCommissions`, `validateReferralCode`, `normalizeReferralSummary`, `normalizeReferralCommission`, and `buildReferralInviteLink` in `src/api/referrals.js`.
- Added `getMyGroupRequests`, `getMyGroupRequest`, `createGroupRequest`, `createSubAgentRequest`, `cancelGroupRequest`, `normalizeGroupRequest`, and `normalizeGroupForRequest` in `src/api/groupRequests.js`.

All helpers use the existing frontend API client.

## Backend Routes Used

- `GET /api/me/referrals`
- `GET /api/me/referrals/commissions`
- `POST /api/referrals/validate-code`
- `GET /api/me/group-change-requests`
- `GET /api/me/group-change-requests/:id`
- `POST /api/me/group-change-requests`
- `POST /api/me/group-change-requests/:id/cancel`

No admin referral or group-request routes were connected.

## Referral Summary Behavior

- The customer sub-agent/referral page now loads the referral summary from `GET /api/me/referrals`.
- It displays the backend referral code, invite count, total credited commission, inviter summary when present, and backend commission settings.
- The frontend does not calculate referral earnings or create commission records.

## Referral Commission History Behavior

- Commission history loads from `GET /api/me/referrals/commissions`.
- It renders amount, currency, status, source type, source amount, invited user summary, and created/credited dates when returned.
- Pagination is supported with a load-more action when the backend returns more pages.
- Empty and error states are shown without inventing earnings.

## Invite Link Behavior

- If the backend returns `referralLink`, the frontend displays and copies it.
- If not, the frontend builds a safe link from `window.location.origin` using `/register?inviteCode=<code>`.
- Copying the link or code is UI-only and creates no backend side effects.
- The profile menu share action now fetches the backend referral summary and copies the real invite link for customer pages only.

## Withdraw UX Behavior

- The old withdraw-to-wallet UX was removed.
- The customer page now states that referral commissions are credited directly to the wallet after eligible successful backend wallet credits.
- No frontend wallet credit, withdrawal simulation, or referral commission calculation was added.

## Sub-Agent Request Behavior

- Sub-agent requests submit to `POST /api/me/group-change-requests` with `requestType: "SUB_AGENT"` and `reason`.
- The submit button is disabled while submitting.
- The UI prevents a duplicate pending sub-agent request when one is present in the backend request list.
- Success appears only after the backend creates the request.
- The request list and current user session are refetched after creation.
- Sub-agent status is presented as a customer/business review state, not as supervisor or admin permission.

## Group-Change Request Behavior

- Backend inspection confirmed that `GROUP_CHANGE` requests require `requestedGroupId`.
- Backend inspection also confirmed that `GET /api/groups` is admin-only.
- Because there is no customer-safe active group listing route, this phase does not invent local group IDs or call admin group APIs.
- The customer UI shows the current group when known and documents that group selection is unavailable until a customer-safe group list exists.

## Request List And Cancel Behavior

- Customer request status loads from `GET /api/me/group-change-requests`.
- The list renders request type, status, current group, requested group, approved group, reason, admin note, created date, and reviewed date where available.
- Pending own requests show a cancel action.
- Cancellation calls `POST /api/me/group-change-requests/:id/cancel`.
- The request list and current user session are refetched after backend-confirmed cancellation.

## Dashboard And Profile Small Integrations

- Profile invite sharing now uses backend referral summary and copies the real invite link on customer pages.
- The admin mirror route for the customer sub-agent page passes `basePath="/admin/user"` so the page stays informational and does not call customer mutation endpoints there.
- No new major dashboard sections were added because no visible referral/sub-agent dashboard card existed.

## Features Intentionally Not Connected

- Admin referral settings, relationship reports, commission reports, and group-request review pages.
- Group-request approval or rejection.
- Referral commission creation or reversal.
- Wallet credits or wallet ledger writes.
- Group selection through admin-only group APIs.
- Profile update mutations.
- Notification mutations.

## Remaining Mock Areas

- Admin sub-agent tooling still uses the existing admin mock/seed page and was intentionally not connected in this customer-side phase.
- Customer group-change creation is limited until a customer-safe group listing route exists.
- Existing local customer settings such as local currency preferences remain outside this phase.

## Lint Result

- `npm.cmd run lint`: passed.

## Build Result

- `npm.cmd run build`: passed.

## Diff Check Result

- `git diff --check`: passed.

## Remaining Warnings

- Vite reports that the generated `index` chunk is larger than 500 kB after minification.
- Git emits an existing safe-directory warning for an unrelated configured path in this environment.
- Git reports LF-to-CRLF normalization warnings for modified frontend source files.

## Completion Status

- Phase 2.5D implementation is complete.
