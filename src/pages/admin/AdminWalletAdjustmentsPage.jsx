import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  Filter,
  ListChecks,
  RefreshCw,
  Search,
  WalletCards,
} from "lucide-react";
import { getAdminWalletAdjustments } from "../../api/adminWalletAdjustments";
import { getPublicCurrencies } from "../../api/currencies";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const pageSize = 20;
const fallbackCurrencies = ["USD", "EGP", "AED"];
const missingSummaryLabel = "—";

const initialFilters = {
  currency: "",
  dateFrom: "",
  dateTo: "",
  maxAmount: "",
  minAmount: "",
  search: "",
  sort: "newest",
  type: "all",
};

const pageCopy = {
  ar: {
    allCurrencies: "كل العملات",
    failedToLoadAdjustments: "لم يتم تحميل الشحن الإداري",
    invalidCurrency: "يرجى اختيار عملة صحيحة من 3 حروف مثل USD أو EGP",
    loginRequired: "يلزم تسجيل الدخول بحساب مدير.",
    noAdjustmentsAfterSuccess: "لا توجد عمليات شحن إداري",
    retry: "إعادة المحاولة",
  },
  en: {
    allCurrencies: "All currencies",
    failedToLoadAdjustments: "Failed to load admin wallet adjustments",
    invalidCurrency: "Please choose a valid 3-letter currency code such as USD or EGP",
    loginRequired: "Please sign in with an admin account.",
    noAdjustmentsAfterSuccess: "No admin wallet adjustments found",
    retry: "Retry",
  },
};

function getPageCopy(language) {
  return pageCopy[language] || pageCopy.ar;
}

function getFriendlyRequestError(error, copy) {
  const rawMessage = `${error?.userMessage || error?.message || ""}`;
  const rawDetails = JSON.stringify(error?.details || error?.payload || {});
  if (/currency/i.test(rawMessage) || /currency/i.test(rawDetails) || /\^\[A-Z\]\{3\}/.test(rawMessage)) {
    return copy.invalidCurrency;
  }
  return rawMessage || copy.failedToLoadAdjustments;
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString("ar-EG-u-nu-latn", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function formatAmountWithCurrency(value, currency) {
  const amount = formatAmount(value);
  return currency ? `${amount} ${currency}` : amount;
}

function formatCurrencyTotals(totals = [], key) {
  if (!totals.length) return [formatAmount(0)];
  return totals.map((item) => formatAmountWithCurrency(item[key], item.currency));
}

function formatSingleSummaryValue(summary, key, currency) {
  if (!summary || summary[key] === undefined || summary[key] === null) return missingSummaryLabel;
  return formatAmountWithCurrency(summary[key], currency);
}

function formatGroupedSummaryValues(summary, key) {
  const totals = summary?.totalsByCurrency || [];
  if (!summary) return missingSummaryLabel;
  if (!totals.length) return [formatAmount(0)];
  return formatCurrencyTotals(totals, key);
}

function countActiveFilters(filters) {
  return [
    filters.search.trim(),
    filters.type !== "all",
    filters.currency.trim(),
    filters.dateFrom,
    filters.dateTo,
    filters.minAmount,
    filters.maxAmount,
    filters.sort !== "newest",
  ].filter(Boolean).length;
}

function buildQuery(filters, page) {
  return {
    currency: filters.currency,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    limit: pageSize,
    maxAmount: filters.maxAmount,
    minAmount: filters.minAmount,
    page,
    search: filters.search.trim(),
    sort: filters.sort,
    type: filters.type,
  };
}

function validateFilters(filters, copy) {
  const currency = String(filters.currency || "").trim().toUpperCase();
  if (currency && !/^[A-Z]{3}$/.test(currency)) return copy.invalidCurrency;

  const minAmount = filters.minAmount === "" ? null : Number(filters.minAmount);
  const maxAmount = filters.maxAmount === "" ? null : Number(filters.maxAmount);
  if ((minAmount !== null && !Number.isFinite(minAmount)) || (maxAmount !== null && !Number.isFinite(maxAmount))) {
    return copy.failedToLoadAdjustments;
  }
  if (minAmount !== null && maxAmount !== null && minAmount > maxAmount) {
    return copy.failedToLoadAdjustments;
  }

  return "";
}

export default function AdminWalletAdjustmentsPage() {
  const { token } = useAuth();
  const { language } = useLanguage();
  const { showToast } = useToast();
  const copy = getPageCopy(language);
  const [adjustments, setAdjustments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, pages: 1 });
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [currencyOptions, setCurrencyOptions] = useState(fallbackCurrencies);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRequestSucceeded, setLastRequestSucceeded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAdjustments = useCallback(async () => {
    if (!token) {
      setAdjustments([]);
      setError(copy.loginRequired);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await getAdminWalletAdjustments(token, buildQuery(appliedFilters, page));
      setAdjustments(result.adjustments);
      setPagination(result.pagination);
      setSummary(result.summary);
      setLastRequestSucceeded(true);
    } catch (requestError) {
      const message = getFriendlyRequestError(requestError, copy);
      setError(message);
      showToast({ type: "error", title: copy.failedToLoadAdjustments, message });
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, copy, page, showToast, token]);

  useEffect(() => {
    void loadAdjustments();
  }, [loadAdjustments, refreshKey]);

  useEffect(() => {
    let cancelled = false;

    const loadCurrencies = async () => {
      try {
        const result = await getPublicCurrencies();
        if (cancelled) return;
        const activeCodes = result.currencies
          .filter((currency) => currency.isActive && /^[A-Z]{3}$/.test(currency.code))
          .map((currency) => currency.code);
        setCurrencyOptions([...new Set([...fallbackCurrencies, ...activeCodes])].sort());
      } catch {
        if (!cancelled) setCurrencyOptions(fallbackCurrencies);
      }
    };

    void loadCurrencies();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeFilters = useMemo(() => countActiveFilters(appliedFilters), [appliedFilters]);
  const operationCount = summary?.count ?? pagination?.total ?? adjustments.length ?? 0;
  const summaryTotals = summary?.totalsByCurrency || [];
  const summaryCurrency = summary?.currency || appliedFilters.currency || "";
  const isGroupedSummary = summary?.mode === "grouped";
  const additionsLabel = isGroupedSummary
    ? formatGroupedSummaryValues(summary, "totalAdditions")
    : formatSingleSummaryValue(summary, "totalAdditions", summaryCurrency);
  const deductionsLabel = isGroupedSummary
    ? formatGroupedSummaryValues(summary, "totalDeductions")
    : formatSingleSummaryValue(summary, "totalDeductions", summaryCurrency);
  const netLabel = isGroupedSummary
    ? formatGroupedSummaryValues(summary, "net")
    : formatSingleSummaryValue(summary, "net", summaryCurrency);
  const netTone = isGroupedSummary
    ? (summaryTotals.some((item) => item.net < 0) ? "danger" : "success")
    : ((summary?.net || 0) < 0 ? "danger" : "success");

  const updateFilter = (key, value) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const refetchCurrentFilters = () => setRefreshKey((current) => current + 1);

  const applyFilters = (event) => {
    event.preventDefault();
    const validationMessage = validateFilters(draftFilters, copy);
    if (validationMessage) {
      setError(validationMessage);
      showToast({ type: "error", title: copy.failedToLoadAdjustments, message: validationMessage });
      return;
    }

    setPage(1);
    setAppliedFilters({ ...draftFilters });
    setRefreshKey((current) => current + 1);
  };

  const resetFilters = () => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
    setRefreshKey((current) => current + 1);
  };

  return (
    <div dir="rtl" className="space-y-4">
      <Header loading={loading} onRefresh={refetchCurrentFilters} />

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <SummaryCard icon={ArrowUpCircle} label="إجمالي الإضافات" value={additionsLabel} tone="success" />
        <SummaryCard icon={ArrowDownCircle} label="إجمالي الخصومات" value={deductionsLabel} tone="danger" />
        <SummaryCard icon={Calculator} label="صافي التعديلات" value={netLabel} tone={netTone} />
        <SummaryCard icon={ListChecks} label="عدد العمليات" value={Number(operationCount).toLocaleString("ar-EG-u-nu-latn")} tone="default" />
      </section>

      <Filters
        activeCount={activeFilters}
        allCurrenciesLabel={copy.allCurrencies}
        currencyOptions={currencyOptions}
        filters={draftFilters}
        onApply={applyFilters}
        onChange={updateFilter}
        onReset={resetFilters}
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-base font-black text-slate-950 dark:text-white">قائمة الشحن الإداري</h2>
            <p className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {pagination.total.toLocaleString("ar-EG-u-nu-latn")} عملية يدوية
            </p>
          </div>
          <button
            type="button"
            onClick={refetchCurrentFilters}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-700 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>

        {error && (
          <div className="flex flex-col gap-3 rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200 sm:flex-row sm:items-center">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={refetchCurrentFilters}
              className="h-10 rounded-xl bg-rose-600 px-4 text-xs font-black text-white"
            >
              {copy.retry}
            </button>
          </div>
        )}

        {loading ? (
          <LoadingTable />
        ) : adjustments.length ? (
          <AdjustmentsTable adjustments={adjustments} />
        ) : lastRequestSucceeded && !error ? (
          <EmptyState
            icon={WalletCards}
            title={copy.noAdjustmentsAfterSuccess}
            description="ستظهر هنا عمليات الإضافة والخصم اليدوية التي ينفذها الأدمن من صفحة محفظة المستخدم."
          />
        ) : null}

        {!loading && !error && pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 disabled:opacity-45 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
            >
              السابق
            </button>
            <span className="text-xs font-black text-slate-500 dark:text-slate-400">
              صفحة {pagination.page} من {pagination.pages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 disabled:opacity-45 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
            >
              التالي
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function Header({ loading, onRefresh }) {
  return (
    <section className="rounded-[26px] border border-violet-200/70 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#111827]">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-[18px] bg-violet-600 text-white">
          <WalletCards className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">الشحن الإداري</h1>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-500 dark:text-slate-300">
            كل عمليات الإضافة والخصم اليدوية التي تمت بواسطة الإدارة
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-[10px] font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-950"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>
    </section>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  const tones = {
    danger: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
    default: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  };
  const values = Array.isArray(value) ? value : [value];

  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
      <Icon className={`h-9 w-9 rounded-2xl p-2 ${tones[tone] || tones.default}`} />
      <p className="mt-3 text-[10px] font-black text-slate-400">{label}</p>
      <div dir="ltr" className="mt-1 space-y-1 text-right">
        {values.map((item, index) => (
          <strong key={`${item}-${index}`} className="block break-words text-lg font-black leading-6 text-slate-950 dark:text-white">
            {item}
          </strong>
        ))}
      </div>
    </article>
  );
}

function Filters({ activeCount, allCurrenciesLabel, currencyOptions, filters, onApply, onChange, onReset }) {
  return (
    <section className="rounded-[23px] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#111827]">
      <div className="flex min-h-14 items-center gap-2 border-b border-slate-100 px-4 dark:border-white/10">
        <Filter className="h-4 w-4 text-violet-500" />
        <b className="flex-1 text-sm text-slate-950 dark:text-white">الفلاتر</b>
        {activeCount > 0 && (
          <span className="rounded-full bg-violet-500/10 px-2 py-1 text-[10px] font-black text-violet-700 dark:text-violet-300">
            {activeCount} مفعلة
          </span>
        )}
      </div>
      <form onSubmit={onApply} className="grid w-full max-w-full grid-cols-1 gap-3 overflow-visible p-4 sm:[grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr))]">
        <label className="relative min-w-0 sm:col-span-2">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
          <input
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="ابحث باسم المستخدم أو البريد أو السبب"
            className="h-11 w-full min-w-0 rounded-2xl bg-slate-50 pe-9 ps-3 text-xs font-black outline-none dark:bg-[#0B1220] dark:text-white"
          />
        </label>
        <select value={filters.type} onChange={(event) => onChange("type", event.target.value)} className="h-11 min-w-0 rounded-2xl bg-slate-50 px-3 text-xs font-black dark:bg-[#0B1220] dark:text-white">
          <option value="all">الكل</option>
          <option value="credit">إضافة</option>
          <option value="debit">خصم</option>
        </select>
        <select
          dir="rtl"
          value={filters.currency}
          onChange={(event) => onChange("currency", event.target.value)}
          className="h-11 min-w-0 rounded-2xl bg-slate-50 px-3 text-xs font-black outline-none dark:bg-[#0B1220] dark:text-white"
        >
          <option value="">{allCurrenciesLabel}</option>
          {currencyOptions.map((code) => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>
        <input type="date" value={filters.dateFrom} onChange={(event) => onChange("dateFrom", event.target.value)} className="h-11 min-w-0 rounded-2xl bg-slate-50 px-3 text-xs font-black outline-none dark:bg-[#0B1220] dark:text-white" />
        <input type="date" value={filters.dateTo} onChange={(event) => onChange("dateTo", event.target.value)} className="h-11 min-w-0 rounded-2xl bg-slate-50 px-3 text-xs font-black outline-none dark:bg-[#0B1220] dark:text-white" />
        <input dir="ltr" type="number" min="0" step="0.01" value={filters.minAmount} onChange={(event) => onChange("minAmount", event.target.value)} placeholder="Min" className="h-11 min-w-0 rounded-2xl bg-slate-50 px-3 text-xs font-black outline-none dark:bg-[#0B1220] dark:text-white" />
        <input dir="ltr" type="number" min="0" step="0.01" value={filters.maxAmount} onChange={(event) => onChange("maxAmount", event.target.value)} placeholder="Max" className="h-11 min-w-0 rounded-2xl bg-slate-50 px-3 text-xs font-black outline-none dark:bg-[#0B1220] dark:text-white" />
        <select value={filters.sort} onChange={(event) => onChange("sort", event.target.value)} className="h-11 min-w-0 rounded-2xl bg-slate-50 px-3 text-xs font-black dark:bg-[#0B1220] dark:text-white">
          <option value="newest">الأحدث</option>
          <option value="oldest">الأقدم</option>
          <option value="amount_desc">الأعلى قيمة</option>
          <option value="amount_asc">الأقل قيمة</option>
        </select>
        <div className="grid grid-cols-2 gap-2 sm:col-span-full sm:flex sm:justify-end">
          <button type="submit" className="h-11 rounded-2xl bg-violet-600 px-5 text-xs font-black text-white">تصفية</button>
          <button type="button" onClick={onReset} className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            إعادة ضبط
          </button>
        </div>
      </form>
    </section>
  );
}

function AdjustmentsTable({ adjustments }) {
  return (
    <div className="rounded-[24px] border border-transparent bg-transparent lg:max-h-[68vh] lg:overflow-auto lg:border-slate-200 lg:bg-white lg:shadow-[0_14px_36px_rgba(15,23,42,0.06)] lg:dark:border-white/10 lg:dark:bg-[#111827] lg:dark:shadow-[0_18px_42px_rgba(0,0,0,0.22)]">
      <div className="sticky top-0 z-10 hidden grid-cols-[1.05fr_1fr_0.8fr_1fr_0.6fr_0.9fr_0.9fr_1fr] gap-3 border-b border-slate-200 bg-slate-50/95 px-5 py-4 text-[9px] font-black text-slate-500 backdrop-blur-xl dark:border-white/10 dark:bg-[#0B1220]/95 dark:text-slate-400 lg:grid lg:[&>*:nth-child(3)]:hidden lg:[&>*:nth-child(9)]:hidden xl:grid-cols-[1.05fr_1fr_1.2fr_0.75fr_0.9fr_0.65fr_0.9fr_0.9fr_1.45fr_1fr] xl:[&>*:nth-child(3)]:block xl:[&>*:nth-child(9)]:block">
        <span>التاريخ</span>
        <span>المستخدم</span>
        <span>البريد الإلكتروني</span>
        <span>نوع العملية</span>
        <span>المبلغ</span>
        <span>العملة</span>
        <span>الرصيد قبل</span>
        <span>الرصيد بعد</span>
        <span>السبب / الملاحظة</span>
        <span>الأدمن المسؤول</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:block lg:divide-y lg:divide-slate-100 lg:dark:divide-white/10">
        {adjustments.map((adjustment) => (
          <AdjustmentRow adjustment={adjustment} key={adjustment.id} />
        ))}
      </div>
    </div>
  );
}

function AdjustmentRow({ adjustment }) {
  const deduct = adjustment.action === "DEDUCT";
  const amountClass = deduct ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300";

  return (
    <article className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_18px_38px_rgba(76,29,149,0.10)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_16px_34px_rgba(0,0,0,0.22)] [&>*:nth-child(3)]:col-span-2 [&>*:nth-child(9)]:col-span-2 lg:grid-cols-[1.05fr_1fr_0.8fr_1fr_0.6fr_0.9fr_0.9fr_1fr] lg:items-center lg:rounded-none lg:border-0 lg:bg-transparent lg:px-5 lg:py-4 lg:shadow-none lg:hover:translate-y-0 lg:hover:bg-violet-50/55 lg:hover:shadow-none lg:dark:bg-transparent lg:dark:hover:bg-violet-400/[0.045] lg:[&>*:nth-child(3)]:hidden lg:[&>*:nth-child(9)]:hidden xl:grid-cols-[1.05fr_1fr_1.2fr_0.75fr_0.9fr_0.65fr_0.9fr_0.9fr_1.45fr_1fr] xl:[&>*:nth-child(3)]:col-span-1 xl:[&>*:nth-child(3)]:block xl:[&>*:nth-child(9)]:col-span-1 xl:[&>*:nth-child(9)]:block">
      <Cell label="التاريخ" value={adjustment.createdAtLabel} />
      <Cell label="المستخدم" value={adjustment.user.name || "-"} strong />
      <Cell label="البريد الإلكتروني" value={adjustment.user.email || adjustment.user.id || "-"} dir="ltr" />
      <div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${deduct ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>
          {deduct ? <ArrowDownCircle className="h-3.5 w-3.5" /> : <ArrowUpCircle className="h-3.5 w-3.5" />}
          {adjustment.actionLabel}
        </span>
      </div>
      <Cell className={amountClass} label="المبلغ" value={`${deduct ? "-" : "+"}${adjustment.amountLabel}`} dir="ltr" strong />
      <Cell label="العملة" value={adjustment.currency} dir="ltr" />
      <Cell label="الرصيد قبل" value={Number(adjustment.beforeBalance).toFixed(2)} dir="ltr" />
      <Cell label="الرصيد بعد" value={Number(adjustment.afterBalance).toFixed(2)} dir="ltr" />
      <Cell label="السبب / الملاحظة" value={adjustment.reason || "-"} />
      <Cell label="الأدمن المسؤول" value={adjustment.actor.name || adjustment.actor.email || adjustment.actor.id || "-"} />
    </article>
  );
}

function Cell({ className = "", dir, label, strong = false, value }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[9px] font-black text-slate-400 dark:text-slate-500 lg:hidden">{label}</p>
      <p dir={dir} title={String(value)} className={`break-words text-xs leading-5 lg:truncate ${strong ? "font-black" : "font-bold"} text-slate-700 dark:text-slate-200 ${dir === "ltr" ? "text-right" : ""} ${className}`}>
        {value}
      </p>
    </div>
  );
}

function LoadingTable() {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]" aria-busy="true">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="grid gap-3 border-b border-slate-100 py-4 last:border-b-0 dark:border-white/10 xl:grid-cols-10">
          {Array.from({ length: 10 }).map((__, itemIndex) => <SkeletonBlock key={itemIndex} className="h-8 rounded-xl" />)}
        </div>
      ))}
    </div>
  );
}
