# Phase 2.5M.1 - Secure Password Change Report

## Files Changed

- `src/api/profile.js`
- `src/pages/ProfilePage.jsx`
- `docs/PHASE_2_5M1_PASSWORD_CHANGE_REPORT.md`

## Route Added

- Frontend now calls `PATCH /api/me/password`.

## Request Shape

```json
{
  "currentPassword": "...",
  "newPassword": "..."
}
```

`confirmPassword` is used only for local UI validation and is not sent to the backend.

## Response Shape

```json
{
  "success": true,
  "message": "Password updated successfully."
}
```

## Validation Behavior

- Current password, new password, and confirm password are required in the modal.
- New password must be at least 8 characters and include uppercase, lowercase, and a number.
- Confirm password must match the new password.
- New password must differ from current password.
- Backend errors are shown safely through the existing error normalizer.

## Security Behavior

- Passwords are not stored in localStorage or sessionStorage.
- Password payloads are sent only to `PATCH /api/me/password`.
- Password fields clear after backend-confirmed success.
- Profile save remains limited to name, phone, and username.

## Frontend Behavior

- The existing profile password modal is now connected.
- The profile form and menu open the password modal.
- Submit is disabled while the backend request is pending.
- Success is shown only after backend confirmation.

## Tests/Checks Run

- `npm.cmd run lint` - passed.
- `npm.cmd run build` - passed.
- `git diff --check` - passed.

## Remaining Warnings

- Existing JWT sessions remain active after password change because the backend has no session revocation model.
- Vite reported the existing large chunk warning during build.
- Git reported LF/CRLF conversion warnings during diff-check, but no whitespace errors.

## Completion Status

- Phase 2.5M.1 frontend work is complete.
