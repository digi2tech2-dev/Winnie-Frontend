const GOOGLE_PROFILE_COMPLETION_PREFIX = "winnie-google-profile-completed:";

function getUserKey(user) {
  return String(user?.id || user?._id || user?.email || "").trim().toLowerCase();
}

function readBooleanParam(params, keys) {
  for (const key of keys) {
    if (!params.has(key)) continue;
    const value = String(params.get(key) || "").trim().toLowerCase();
    if (["1", "true", "yes", "required", "new"].includes(value)) return true;
    if (["0", "false", "no", "complete", "existing"].includes(value)) return false;
  }
  return null;
}

function readBooleanValue(value) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["1", "true", "yes", "required", "new"].includes(normalized)) return true;
  if (["0", "false", "no", "complete", "existing"].includes(normalized)) return false;
  return null;
}

export function isGoogleProfileCompleted(user) {
  const key = getUserKey(user);
  if (!key) return false;

  try {
    return localStorage.getItem(`${GOOGLE_PROFILE_COMPLETION_PREFIX}${key}`) === "1";
  } catch {
    return false;
  }
}

export function markGoogleProfileCompleted(user) {
  const key = getUserKey(user);
  if (!key) return;

  try {
    localStorage.setItem(`${GOOGLE_PROFILE_COMPLETION_PREFIX}${key}`, "1");
  } catch {
    // The saved backend profile remains the source of truth if storage is blocked.
  }
}

export function shouldCompleteGoogleProfile(user, params) {
  const explicitRequirement = readBooleanParam(params, [
    "needsProfileCompletion",
    "needsOnboarding",
    "onboardingRequired",
    "isNewUser",
    "newUser",
  ]);

  if (explicitRequirement !== null) return explicitRequirement;

  for (const value of [
    user?.needsProfileCompletion,
    user?.needsOnboarding,
    user?.onboardingRequired,
    user?.isNewUser,
    user?.newUser,
  ]) {
    const requirement = readBooleanValue(value);
    if (requirement !== null) return requirement;
  }

  return !isGoogleProfileCompleted(user);
}
