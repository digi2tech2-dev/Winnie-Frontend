const ANTI_SCAM_CONFIRMATION_KEY = "winnie-anti-scam-confirmed";

export function getAntiScamConfirmation() {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(ANTI_SCAM_CONFIRMATION_KEY);
    return value || null;
  } catch {
    return null;
  }
}

export function rememberAntiScamConfirmation(timestamp = new Date().toISOString()) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(ANTI_SCAM_CONFIRMATION_KEY, timestamp);
  } catch {
    // The flow remains usable when storage is blocked or unavailable.
  }
}
