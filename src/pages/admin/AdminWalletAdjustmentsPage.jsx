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
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

const pageSize = 20;

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

function getErrorMessage(error, fallback) {
  return error?.userMessage || error?.message || fallback;
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString("ar-EG-u-nu-latn", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
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

export default function AdminWalletAdjustmentsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [adjustments, setAdjustments] = useState([]);
  const [summary, setSummary] = useState({ totalAdded: 0, totalDeducted: 0, net: 0, count: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, pages: 1 });
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAdjustments = useCallback(async () => {
    if (!token) {
      setAdjustments([]);
      setError("يلزم تسجيل الدخول بحساب مدير.");
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
    } catch (requestError) {
      const message = getErrorMessage(requestError, "تعذر تحميل عمليات الشحن الإداري.");
      setAdjustments([]);
      setPagination({ page, limit: pageSize, total: 0, pages: 1 });
      setSummary({ totalAdded: 0, totalDeducted: 0, net: 0, count: 0 });
      setError(message);
      showToast({ type: "error", title: "لم يتم تحميل الشحن الإداري", message });
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, showToast, token]);

  useEffect(() => {
    void loadAdjustments();
  }, [loadAdjustments]);

  const activeFilters = useMemo(() => countActiveFilters(appliedFilters), [appliedFilters]);

  const updateFilter = (key, value) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({ ...draftFilters });
  };

  const resetFilters = () => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
  };

  return (
    <div dir="rtl" className="space-y-4">
      <Header loading={loading} onRefresh={loadAdjustments} />

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <SummaryCard icon={ArrowUpCircle} label="إجمالي الإضافات" value={formatAmount(summary.totalAdded)} tone="success" />
        <SummaryCard icon={ArrowDownCircle} label="إجمالي الخصومات" value={formatAmount(summary.totalDeducted)} tone="danger" />
        <SummaryCard icon={Calculator} label="صافي التعديلات" value={formatAmount(summary.net)} tone={summary.net < 0 ? "danger" : "success"} />
        <SummaryCard icon={ListChecks} label="عدد العمليات" value={Number(summary.count || 0).toLocaleString("ar-EG-u-nu-latn")} tone="default" />
      </section>

      <Filters
        activeCount={activeFilters}
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
            onClick={loadAdjustments}
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
              onClick={loadAdjustments}
              className="h-10 rounded-xl bg-rose-600 px-4 text-xs font-black text-white"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {loading ? (
          <LoadingTable />
        ) : adjustments.length ? (
          <AdjustmentsTable adjustments={adjustments} />
        ) : (
          <EmptyState
            icon={WalletCards}
            title="لا توجد عمليات شحن إداري"
            description="ستظهر هنا عمليات الإضافة والخصم اليدوية التي ينفذها الأدمن من صفحة محفظة المستخدم."
          />
        )}

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

  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
      <Icon className={`h-9 w-9 rounded-2xl p-2 ${tones[tone] || tones.default}`} />
      <p className="mt-3 text-[10px] font-black text-slate-400">{label}</p>
      <strong dir="ltr" className="mt-1 block break-words text-right text-xl font-black text-slate-950 dark:text-white">{value}</strong>
    </article>
  );
}

function Filters({ activeCount, filters, onApply, onChange, onReset }) {
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
      <form onSubmit={onApply} className="grid gap-2.5 p-4 lg:grid-cols-[minmax(220px,1fr)_120px_100px_130px_130px_120px_120px_140px]">
        <label className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
          <input
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="ابحث باسم المستخدم أو البريد أو السبب"
            className="h-11 w-full rounded-2xl bg-slate-50 pe-9 ps-3 text-[10px] font-black outline-none dark:bg-[#0B1220] dark:text-white"
          />
        </label>
        <select value={filters.type} onChange={(event) => onChange("type", event.target.value)} className="h-11 rounded-2xl bg-slate-50 px-3 text-[10px] font-black dark:bg-[#0B1220] dark:text-white">
          <option value="all">الكل</option>
          <option value="add">إضافة</option>
          <option value="deduct">خصم</option>
        </select>
        <input
          dir="ltr"
          value={filters.currency}
          onChange={(event) => onChange("currency", event.target.value.toUpperCase().slice(0, 3))}
          placeholder="EGP"
          className="h-11 rounded-2xl bg-slate-50 px-3 text-[10px] font-black outline-none dark:bg-[#0B1220] dark:text-white"
        />
        <input type="date" value={filters.dateFrom} onChange={(event) => onChange("dateFrom", event.target.value)} className="h-11 rounded-2xl bg-slate-50 px-3 text-[10px] font-black outline-none dark:bg-[#0B1220] dark:text-white" />
        <input type="date" value={filters.dateTo} onChange={(event) => onChange("dateTo", event.target.value)} className="h-11 rounded-2xl bg-slate-50 px-3 text-[10px] font-black outline-none dark:bg-[#0B1220] dark:text-white" />
        <input dir="ltr" type="number" min="0" step="0.01" value={filters.minAmount} onChange={(event) => onChange("minAmount", event.target.value)} placeholder="Min" className="h-11 rounded-2xl bg-slate-50 px-3 text-[10px] font-black outline-none dark:bg-[#0B1220] dark:text-white" />
        <input dir="ltr" type="number" min="0" step="0.01" value={filters.maxAmount} onChange={(event) => onChange("maxAmount", event.target.value)} placeholder="Max" className="h-11 rounded-2xl bg-slate-50 px-3 text-[10px] font-black outline-none dark:bg-[#0B1220] dark:text-white" />
        <select value={filters.sort} onChange={(event) => onChange("sort", event.target.value)} className="h-11 rounded-2xl bg-slate-50 px-3 text-[10px] font-black dark:bg-[#0B1220] dark:text-white">
          <option value="newest">الأحدث</option>
          <option value="oldest">الأقدم</option>
          <option value="amount_desc">الأعلى قيمة</option>
          <option value="amount_asc">الأقل قيمة</option>
        </select>
        <div className="grid grid-cols-2 gap-2 lg:col-span-full lg:flex lg:justify-end">
          <button type="submit" className="h-11 rounded-2xl bg-violet-600 px-5 text-[10px] font-black text-white">تصفية</button>
          <button type="button" onClick={onReset} className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-[10px] font-black text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            إعادة ضبط
          </button>
        </div>
      </form>
    </section>
  );
}

function AdjustmentsTable({ adjustments }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#111827]">
      <div className="hidden grid-cols-[1.05fr_1fr_1.2fr_0.75fr_0.9fr_0.65fr_0.9fr_0.9fr_1.45fr_1fr] gap-3 border-b border-slate-100 px-4 py-3 text-[9px] font-black text-slate-400 dark:border-white/10 xl:grid">
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
      <div className="divide-y divide-slate-100 dark:divide-white/10">
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
    <article className="grid gap-3 px-4 py-4 xl:grid-cols-[1.05fr_1fr_1.2fr_0.75fr_0.9fr_0.65fr_0.9fr_0.9fr_1.45fr_1fr] xl:items-center">
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
      <p className="mb-1 text-[9px] font-black text-slate-400 xl:hidden">{label}</p>
      <p dir={dir} className={`truncate text-xs ${strong ? "font-black" : "font-bold"} text-slate-700 dark:text-slate-200 ${dir === "ltr" ? "text-right" : ""} ${className}`}>
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
