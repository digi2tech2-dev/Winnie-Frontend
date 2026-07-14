import { apiRequest, getApiBaseUrl } from "./client";

const DEFAULT_TIMEZONE = "Africa/Cairo";

function buildUrl(endpoint, query = {}) {
  const url = new URL(`${getApiBaseUrl()}/${String(endpoint).replace(/^\/+/, "")}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

async function parseDownloadError(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null);
    return payload?.message || payload?.error || "تعذر تحميل التقرير المالي.";
  }
  const text = await response.text().catch(() => "");
  return text || "تعذر تحميل التقرير المالي.";
}

async function downloadReportBlob(token, endpoint, { date, timezone = DEFAULT_TIMEZONE } = {}) {
  const response = await fetch(buildUrl(endpoint, { date, timezone }), {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(await parseDownloadError(response));
  }

  return response.blob();
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadDailyFinancialReport(token, { date, timezone = DEFAULT_TIMEZONE } = {}) {
  const blob = await downloadReportBlob(token, "/admin/reports/financial/daily", { date, timezone });
  saveBlob(blob, `financial-report-${date}.xlsx`);
}

export async function downloadClosedDailyFinancialReport(token, { date, timezone = DEFAULT_TIMEZONE } = {}) {
  const blob = await downloadReportBlob(token, "/admin/reports/financial/daily/closed-download", { date, timezone });
  saveBlob(blob, `financial-report-closed-${date}.xlsx`);
}

export async function getDailyFinancialCloseStatus(token, { date, timezone = DEFAULT_TIMEZONE } = {}) {
  const response = await apiRequest("/admin/reports/financial/daily/close", {
    query: { date, timezone },
    token,
  });
  return {
    closed: Boolean(response.data?.closed),
    close: response.data?.close || null,
    message: response.message,
  };
}

export async function closeDailyFinancialReport(token, { date, timezone = DEFAULT_TIMEZONE, providerManualBalances = [] } = {}) {
  const response = await apiRequest("/admin/reports/financial/daily/close", {
    body: { date, timezone, providerManualBalances },
    method: "POST",
    token,
  });
  return {
    close: response.data?.close || null,
    message: response.message,
  };
}

export { DEFAULT_TIMEZONE };
