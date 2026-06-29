import { apiRequest } from "./client";
import {
  asArray,
  DEFAULT_CURRENCY,
  formatCurrency,
  formatDateTime,
  getItemId,
  humanizeToken,
  normalizePagination,
  toNumber,
} from "./adapters";

function compactPayload(payload = {}) {
  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) return acc;
    if (typeof value === "string" && value.trim() === "") return acc;
    acc[key] = typeof value === "string" ? value.trim() : value;
    return acc;
  }, {});
}

function normalizePerson(person = null) {
  if (!person) return null;
  const id = getItemId(person);

  return {
    ...person,
    id,
    _id: person._id ?? id,
    name: person.name || "Winnie user",
    referralCode: person.referralCode || "",
  };
}

export function buildReferralInviteLink(referralCode) {
  const code = String(referralCode || "").trim();
  if (!code) return "";

  if (typeof window === "undefined" || !window.location?.origin) {
    return `/register?inviteCode=${encodeURIComponent(code)}`;
  }

  const url = new URL("/register", window.location.origin);
  url.searchParams.set("inviteCode", code);
  return url.toString();
}

export function normalizeReferralCommission(commission = {}) {
  const id = getItemId(commission);
  const currency = String(commission.commissionCurrency || commission.currency || DEFAULT_CURRENCY).toUpperCase();
  const amount = toNumber(commission.commissionAmount ?? commission.amount, 0);
  const sourceCurrency = String(commission.sourceCurrency || DEFAULT_CURRENCY).toUpperCase();
  const sourceAmount = toNumber(commission.sourceAmount, 0);
  const status = String(commission.status || "SKIPPED").toUpperCase();
  const sourceType = String(commission.sourceType || commission.sourceSemanticType || "").toUpperCase();
  const createdAt = commission.createdAt || commission.creditedAt || null;

  return {
    ...commission,
    id,
    _id: commission._id ?? id,
    amount,
    amountLabel: formatCurrency(amount, currency),
    createdAt,
    createdAtLabel: formatDateTime(createdAt),
    creditedAt: commission.creditedAt || null,
    creditedAtLabel: commission.creditedAt ? formatDateTime(commission.creditedAt) : "",
    currency,
    invitedUser: normalizePerson(commission.invitedUserId || commission.invitedUser),
    percentage: toNumber(commission.commissionPercentage, 0),
    sourceAmount,
    sourceAmountLabel: sourceAmount ? formatCurrency(sourceAmount, sourceCurrency) : "",
    sourceCurrency,
    sourceSemanticType: commission.sourceSemanticType || "",
    sourceType,
    sourceTypeLabel: humanizeToken(sourceType || commission.sourceSemanticType, "Referral source"),
    status,
    statusLabel: humanizeToken(status, "Skipped"),
  };
}

function normalizeTotalCommission(item = {}) {
  const currency = String(item.currency || item._id || DEFAULT_CURRENCY).toUpperCase();
  const amount = toNumber(item.amount ?? item.total, 0);

  return {
    ...item,
    amount,
    amountLabel: formatCurrency(amount, currency),
    count: toNumber(item.count, 0),
    currency,
  };
}

export function normalizeReferralSummary(summary = {}) {
  const referralCode = String(summary.referralCode || "").trim();
  const referralLink = summary.referralLink || buildReferralInviteLink(referralCode);
  const totalCommission = asArray(summary.totalCommission).map(normalizeTotalCommission);

  return {
    ...summary,
    inviteLink: referralLink,
    invitedUsersCount: toNumber(summary.invitedUsersCount ?? summary.invitedCount, 0),
    inviter: normalizePerson(summary.inviter),
    recentCommissions: asArray(summary.recentCommissions).map(normalizeReferralCommission),
    referralCode,
    referralLink,
    settings: {
      ...(summary.settings || {}),
      depositCommissionPercentage: toNumber(summary.settings?.depositCommissionPercentage, 0),
      enabled: summary.settings?.enabled !== false,
    },
    totalCommission,
  };
}

export function normalizeReferralCodeValidation(result = {}) {
  return {
    ...result,
    inviter: normalizePerson(result.inviter),
    reason: result.reason || "",
    valid: result.valid === true,
  };
}

export async function getMyReferrals(token) {
  const response = await apiRequest("/me/referrals", { token });

  return {
    message: response.message,
    summary: normalizeReferralSummary(response.data || {}),
  };
}

export async function getMyReferralCommissions(token, query = {}) {
  const response = await apiRequest("/me/referrals/commissions", {
    token,
    query,
  });

  const commissions = asArray(response.data?.commissions || response.data).map(normalizeReferralCommission);

  return {
    commissions,
    message: response.message,
    pagination: normalizePagination(response.pagination, {
      page: query.page,
      limit: query.limit,
      total: commissions.length,
    }),
  };
}

export async function validateReferralCode(code, options = {}) {
  const response = await apiRequest("/referrals/validate-code", {
    method: "POST",
    body: compactPayload({
      inviteCode: code,
      email: options.email,
    }),
  });

  return {
    message: response.message,
    result: normalizeReferralCodeValidation(response.data || {}),
  };
}
