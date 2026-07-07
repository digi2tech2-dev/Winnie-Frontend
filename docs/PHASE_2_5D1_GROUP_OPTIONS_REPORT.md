# Phase 2.5D.1 Group Options Report

## Files Changed

- `src/api/groupRequests.js`
- `src/pages/customer/CustomerSubAgent.jsx`
- `docs/PHASE_2_5D1_GROUP_OPTIONS_REPORT.md`

## Route Added

- Backend route used: `GET /api/me/group-change-requests/options`

## API Helper Added

- Added `getGroupChangeOptions`.
- Added `normalizeGroupChangeOptions`.
- Added `normalizeGroupChangeOption`.

## Frontend Behavior

- The customer sub-agent/referral page now loads active group-change options from the backend.
- The group-change card displays the current group when available.
- The customer can select a non-current target group and submit a `GROUP_CHANGE` request with a reason.
- The existing `createGroupRequest` helper submits `requestType`, `requestedGroupId`, and `reason` to `POST /api/me/group-change-requests`.
- Duplicate pending `GROUP_CHANGE` submissions are blocked from the backend request list state.
- Successful creation refetches referral/request/options data and does not mutate the user's group locally.

## Backend Security And Safety Behavior

- The frontend uses only the customer-safe options endpoint.
- It does not call admin group APIs.
- It does not use hardcoded group IDs or localStorage request state.
- It blocks current-group selection because the backend marks `isCurrent`.

## Tests And Checks Run

- `npm.cmd run lint` - passed.
- `npm.cmd run build` - passed.
- `git diff --check` - passed.

## Remaining Warnings

- Vite build reports the existing large chunk warning for the main bundle.
- `git diff --check` printed existing Git warnings for `safe.directory` configuration and LF-to-CRLF normalization.

## Completion Status

- Phase 2.5D.1 frontend work is complete.
