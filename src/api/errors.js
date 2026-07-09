const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_ERROR_MESSAGE = "Cannot reach the server. Check your connection and try again.";

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message || DEFAULT_ERROR_MESSAGE);
    this.name = "ApiError";
    this.status = options.status || 0;
    this.code = options.code || "API_ERROR";
    this.details = options.details || null;
    this.fieldErrors = options.fieldErrors || {};
    this.support = options.support || null;
    this.userMessage = options.userMessage || message || DEFAULT_ERROR_MESSAGE;
    this.payload = options.payload || null;
  }
}

function textIncludes(text, values) {
  const haystack = String(text || "").toLowerCase();
  return values.some((value) => haystack.includes(value));
}

function normalizeFieldErrors(errors) {
  if (!Array.isArray(errors)) return {};

  return errors.reduce((acc, item) => {
    if (item?.field && item?.message) {
      acc[item.field] = item.message;
    }
    return acc;
  }, {});
}

function getFirstValidationMessage(errors) {
  if (!Array.isArray(errors)) return "";
  return errors.find((item) => item?.message)?.message || "";
}

function sanitizeBackendMessage(message) {
  const value = String(message || "").trim();
  if (!value || value.length > 240) return "";
  if (textIncludes(value, ["stack", "trace", "mongodb", "mongoose", "jwt secret"])) return "";
  return value;
}

export function getFriendlyAuthMessage({ status, code, message, errors } = {}) {
  const safeMessage = sanitizeBackendMessage(message);
  const normalizedCode = String(code || "").toUpperCase();

  if (normalizedCode === "VALIDATION_ERROR") {
    return getFirstValidationMessage(errors) || "Please check the highlighted fields and try again.";
  }

  if (normalizedCode === "PAYMENT_RISK_LIMIT_REACHED") {
    return safeMessage || "Online top-up is temporarily limited for your account. Please use manual deposit or contact support.";
  }

  if (normalizedCode === "IDENTITY_VERIFICATION_REQUIRED") {
    return safeMessage || "Please contact support to verify your identity before continuing.";
  }

  if (normalizedCode === "PAYMENT_CURRENCY_CONVERSION_UNAVAILABLE") {
    return safeMessage || "Online card payment is temporarily unavailable for this currency. Please try another currency or use manual deposit.";
  }

  if (normalizedCode === "NETWORK_PAYMENT_STATUS_FAILED" || normalizedCode === "PAYMENT_RECONCILIATION_FAILED") {
    return "Could not verify payment status yet. Please try again later or contact support.";
  }

  if (normalizedCode === "INVALID_REFERRAL_CODE" || textIncludes(safeMessage, ["invalid referral code"])) {
    return "Invalid referral code. Please check the code and try again.";
  }

  if (normalizedCode === "SELF_REFERRAL_NOT_ALLOWED" || textIncludes(safeMessage, ["refer themselves"])) {
    return "Self-referral is not allowed. Use a different invite code or leave it blank.";
  }

  if (textIncludes(safeMessage, ["verify your email", "email address before logging in", "verification link"])) {
    return "Please verify your email address before logging in. Check your inbox for the verification link.";
  }

  if (textIncludes(safeMessage, ["awaiting admin approval", "pending approval"])) {
    return "Your account is awaiting admin approval. Please check back later.";
  }

  if (textIncludes(safeMessage, ["account was rejected", "rejected by an administrator"])) {
    return "Your account was rejected by an administrator. Please contact support.";
  }

  if (textIncludes(safeMessage, ["not active", "inactive"])) {
    return "Your account is inactive. Please contact support.";
  }

  if (textIncludes(safeMessage, ["two-factor", "2fa"])) {
    return "Two-factor verification is required. This frontend does not include the 2FA verification screen yet.";
  }

  if (normalizedCode === "AUTHENTICATION_ERROR" && textIncludes(safeMessage, ["invalid email or password"])) {
    return "Invalid email or password.";
  }

  if (normalizedCode === "TOKEN_EXPIRED" || normalizedCode === "INVALID_TOKEN") {
    return "Your session has expired. Please log in again.";
  }

  if (status >= 500) {
    return "Server error. Please try again later.";
  }

  return safeMessage || DEFAULT_ERROR_MESSAGE;
}

export function createApiError({ response, payload }) {
  const status = response?.status || 0;
  const code = payload?.code || (status ? `HTTP_${status}` : "API_ERROR");
  const errors = payload?.errors;
  const details = payload?.details || errors || null;
  const support = payload?.support || null;
  const message = payload?.message || response?.statusText || DEFAULT_ERROR_MESSAGE;
  const fieldErrors = normalizeFieldErrors(errors);
  const userMessage = getFriendlyAuthMessage({ status, code, message, errors });

  return new ApiError(userMessage, {
    status,
    code,
    details,
    fieldErrors,
    support,
    payload,
    userMessage,
  });
}

export function normalizeApiError(error, fallbackMessage = DEFAULT_ERROR_MESSAGE) {
  if (error instanceof ApiError) return error;

  if (error?.name === "AbortError") {
    return new ApiError("Request cancelled.", {
      code: "REQUEST_CANCELLED",
      userMessage: "Request cancelled.",
    });
  }

  if (error instanceof TypeError) {
    return new ApiError(NETWORK_ERROR_MESSAGE, {
      code: "NETWORK_ERROR",
      userMessage: NETWORK_ERROR_MESSAGE,
    });
  }

  const message = sanitizeBackendMessage(error?.message) || fallbackMessage;
  return new ApiError(message, {
    code: error?.code || "UNKNOWN_ERROR",
    userMessage: message,
  });
}
