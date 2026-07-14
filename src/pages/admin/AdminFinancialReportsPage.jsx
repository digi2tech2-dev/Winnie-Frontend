import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  LockKeyhole,
  RefreshCw,
  Save,
  WalletCards,
} from "lucide-react";
import {
  DEFAULT_TIMEZONE,
  closeDailyFinancialReport,
  downloadClosedDailyFinancialReport,
  downloadDailyFinancialReport,
  getDailyFinancialCloseStatus,
} from "../../api/adminFinancialReports";
import { getAdminProviders } from "../../api/adminProviders";
import { normalizeApiError } from "../../api/errors";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

const timezoneOptions = [
  "Africa/Cairo",
  "Asia/Dubai",
  "UTC",
  "Europe/Istanbul",
  "Asia/Riyadh",
];

function todayInputValue() {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
  }).format(new Date());
}

function formatDateTime(value) {
  if (!value) return "غير متاح";
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getCloseActor(close) {
  const actor = close?.closedBy;
  if (!actor) return "غير متاح";
  return actor.name || actor.email || actor.id || "مدير";
}

export default function AdminFinancialReportsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [date, setDate] = useState(todayInputValue);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [status, setStatus] = useState({ closed: false, close: null });
  const [providers, setProviders] = useState([]);
  const [manualBalances, setManualBalances] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");

  const providerManualBalances = useMemo(
    () =>
      Object.entries(manualBalances)
        .map(([providerId, values]) => ({
          providerId,
          balance: values.balance,
          currency: values.currency || "USD",
          note: values.note,
        }))
        .filter((item) => String(item.balance || "").trim() !== ""),
    [manualBalances],
  );

  const loadStatus = useCallback(async () => {
    if (!token || !date) return;
    setLoadingStatus(true);
    setError("");
    try {
      const result = await getDailyFinancialCloseStatus(token, { date, timezone });
      setStatus(result);
    } catch (requestError) {
      const normalized = normalizeApiError(requestError, "تعذر تحميل حالة تقفيل اليوم.");
      setError(normalized.userMessage || normalized.message);
      setStatus({ closed: false, close: null });
    } finally {
      setLoadingStatus(false);
    }
  }, [date, timezone, token]);

  const loadProviders = useCallback(async () => {
    if (!token) return;
    setLoadingProviders(true);
    try {
      const result = await getAdminProviders(token, { includeInactive: true });
      setProviders(result.providers);
      setManualBalances((current) => {
        const next = { ...current };
        result.providers.forEach((provider) => {
          if (!next[provider.id]) next[provider.id] = { balance: "", currency: "USD", note: "" };
        });
        return next;
      });
    } catch {
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  }, [token]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const runAction = async (key, callback, successTitle) => {
    if (!token || action) return;
    setAction(key);
    setError("");
    try {
      await callback();
      showToast({ type: "success", title: successTitle });
    } catch (requestError) {
      const normalized = normalizeApiError(requestError, "تعذر تنفيذ العملية.");
      const message = normalized.userMessage || normalized.message;
      setError(message);
      showToast({ type: "error", title: "تعذرت العملية", message });
    } finally {
      setAction("");
    }
  };

  const handleDownload = () =>
    runAction(
      "download",
      () => downloadDailyFinancialReport(token, { date, timezone }),
      "تم تجهيز ملف تقرير Excel",
    );

  const handleDownloadClosed = () =>
    runAction(
      "download-closed",
      () => downloadClosedDailyFinancialReport(token, { date, timezone }),
      "تم تحميل تقرير التقفيل",
    );

  const handleCloseDay = () => {
    const confirmed = window.confirm(
      "هل أنت متأكد من تقفيل هذا اليوم؟ سيتم حفظ أرصدة المستخدمين والموردين كسجل محاسبي لهذا التاريخ.",
    );
    if (!confirmed) return;

    runAction(
      "close",
      async () => {
        await closeDailyFinancialReport(token, {
          date,
          timezone,
          providerManualBalances,
        });
        await loadStatus();
      },
      "تم تقفيل اليوم المالي",
    );
  };

  const updateManualBalance = (providerId, key, value) => {
    setManualBalances((current) => ({
      ...current,
      [providerId]: {
        balance: "",
        currency: "USD",
        note: "",
        ...(current[providerId] || {}),
        [key]: value,
      },
    }));
  };

  return (
    <div dir="rtl" className="space-y-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111827]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase text-violet-600 dark:text-violet-300">Daily Financial Report</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">تقرير اليوم المالي</h1>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500 dark:text-slate-400">
              تحميل التقرير متاح في أي وقت. تقفيل اليوم يحفظ لقطة أرصدة المستخدمين والموردين كسجل محاسبي قابل لإعادة التحميل.
            </p>
          </div>
          <span className={`inline-flex w-fit items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black ${status.closed ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/12 text-amber-700 dark:text-amber-300"}`}>
            {status.closed ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {status.closed ? "تم تقفيل اليوم" : "اليوم غير مقفل"}
          </span>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#111827]">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black text-slate-500 dark:text-slate-300">تاريخ التقرير / Report Date</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-950 dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-500 dark:text-slate-300">المنطقة الزمنية / Timezone</span>
              <select
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-950 dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              >
                {timezoneOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton
              disabled={!date || Boolean(action)}
              icon={Download}
              loading={action === "download"}
              onClick={handleDownload}
            >
              تحميل تقرير Excel
            </ActionButton>
            <ActionButton
              disabled={!date || status.closed || Boolean(action)}
              icon={LockKeyhole}
              loading={action === "close"}
              onClick={handleCloseDay}
              tone="dark"
            >
              تقفيل اليوم
            </ActionButton>
            <button
              type="button"
              onClick={loadStatus}
              disabled={loadingStatus}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
            >
              <RefreshCw className={`h-4 w-4 ${loadingStatus ? "animate-spin" : ""}`} />
              تحديث الحالة
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
            لا تجمع أرقام بوابات الدفع مع حركات المحفظة كدخلين منفصلين. المحفظة هي دفتر الأستاذ الداخلي، وبوابات الدفع للمطابقة الخارجية.
          </div>
        </div>

        <CloseStatusCard
          action={action}
          close={status.close}
          loading={loadingStatus}
          onDownload={handleDownloadClosed}
        />
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#111827]">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
            <WalletCards className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-black text-slate-950 dark:text-white">أرصدة الموردين / Provider Balances</h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">اختياري: أدخل أرصدة يدوية للموردين الذين لا يدعمون جلب الرصيد عبر API قبل تقفيل اليوم.</p>
          </div>
        </div>

        {loadingProviders ? (
          <div className="rounded-2xl border border-slate-200 p-4 text-center text-xs font-black text-slate-500 dark:border-white/10">
            جارٍ تحميل الموردين...
          </div>
        ) : providers.length ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
            <div className="hidden grid-cols-[1.2fr_140px_120px_1fr] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-[10px] font-black text-slate-500 dark:border-white/10 dark:bg-[#0B1220] lg:grid">
              <span>المورد</span>
              <span>الرصيد اليدوي</span>
              <span>العملة</span>
              <span>ملاحظة</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/10">
              {providers.map((provider) => (
                <div key={provider.id} className="grid gap-2 px-4 py-3 lg:grid-cols-[1.2fr_140px_120px_1fr] lg:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900 dark:text-white">{provider.name}</p>
                    <p dir="ltr" className="truncate text-right text-[10px] font-bold text-slate-400">{provider.slug || provider.id}</p>
                  </div>
                  <input
                    inputMode="decimal"
                    value={manualBalances[provider.id]?.balance || ""}
                    onChange={(event) => updateManualBalance(provider.id, "balance", event.target.value)}
                    placeholder="0.00"
                    className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-black dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
                  />
                  <input
                    value={manualBalances[provider.id]?.currency || "USD"}
                    onChange={(event) => updateManualBalance(provider.id, "currency", event.target.value.toUpperCase().slice(0, 3))}
                    className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-black uppercase dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
                  />
                  <input
                    value={manualBalances[provider.id]?.note || ""}
                    onChange={(event) => updateManualBalance(provider.id, "note", event.target.value)}
                    placeholder="Manual balance before day close"
                    className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 p-4 text-center text-xs font-black text-slate-500 dark:border-white/10">
            لا يوجد موردون متاحون.
          </div>
        )}
      </section>
    </div>
  );
}

function ActionButton({ children, disabled, icon: Icon, loading, onClick, tone = "violet" }) {
  const className = tone === "dark"
    ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
    : "bg-violet-600 text-white";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

function CloseStatusCard({ action, close, loading, onDownload }) {
  const closed = Boolean(close);
  return (
    <aside className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#111827]">
      <div className="mb-4 flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-2xl ${closed ? "bg-emerald-500/12 text-emerald-600" : "bg-slate-500/10 text-slate-500"}`}>
          {closed ? <Save className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
        </span>
        <div>
          <h2 className="text-base font-black text-slate-950 dark:text-white">حالة التقفيل</h2>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{loading ? "جارٍ التحقق..." : closed ? "Day Closed" : "غير مقفل"}</p>
        </div>
      </div>

      {closed ? (
        <div className="space-y-3">
          <InfoRow label="تم التقفيل بواسطة" value={getCloseActor(close)} />
          <InfoRow label="وقت التقفيل" value={formatDateTime(close.closedAt)} />
          <InfoRow label="إصدار التقرير" value={close.reportVersion || 1} />
          <button
            type="button"
            onClick={onDownload}
            disabled={Boolean(action)}
            className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-xs font-black text-white disabled:opacity-50"
          >
            {action === "download-closed" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            تحميل تقرير التقفيل
          </button>
        </div>
      ) : (
        <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-500 dark:border-white/10 dark:bg-[#0B1220] dark:text-slate-300">
          عند التقفيل سيتم حفظ أرصدة المستخدمين وأرصدة الموردين المتاحة أو اليدوية. يمكن تنزيل التقرير الحالي بدون تقفيل، لكنه سيعرض الأرصدة الحالية وقت التصدير.
        </p>
      )}
    </aside>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-[#0B1220]">
      <p className="text-[10px] font-black text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
