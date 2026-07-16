import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  CircleDollarSign,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../api/adapters";
import { getCustomerOrders } from "../../api/orders";
import EmptyState from "../../components/EmptyState";
import DateFilterPicker from "../../components/DateFilterPicker";
import { useAuth } from "../../context/AuthContext";
import { toDateInputValue } from "../../data/adminDashboard";

const pageSize = 20;

const statusClasses = {
  COMPLETED: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  PROCESSING: "bg-blue-500/12 text-blue-700 dark:text-blue-300",
  PENDING: "bg-amber-500/14 text-amber-700 dark:text-amber-300",
  MANUAL_REVIEW: "bg-amber-500/14 text-amber-700 dark:text-amber-300",
  CANCELED: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  CANCELLED: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  FAILED: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  PARTIAL: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
};

const statusDotClasses = {
  COMPLETED: "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]",
  PROCESSING: "bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]",
  PENDING: "bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.12)]",
  MANUAL_REVIEW: "bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.12)]",
  CANCELED: "bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]",
  CANCELLED: "bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]",
  FAILED: "bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.12)]",
  PARTIAL: "bg-violet-500 shadow-[0_0_0_4px_rgba(139,92,246,0.12)]",
};

const createInitialFilters = () => {
  const todayValue = toDateInputValue(new Date());

  return {
    query: "",
    status: "all",
    dateFrom: todayValue,
    datePreset: "today",
    dateTo: todayValue,
    sort: "newest",
  };
};

const translatedStatusLabel = (t, order) =>
  t(`statuses.${order.status}`, { defaultValue: order.statusLabel });

export default function CustomerOrders({ basePath = "/customer" }) {
  const { token } = useAuth();
  const { t } = useTranslation("orders");
  const [defaultFilters] = useState(createInitialFilters);
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    const loadOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getCustomerOrders(token, { page, limit: pageSize });
        if (!cancelled) {
          setOrders(result.orders);
          setPagination(result.pagination);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.userMessage || t("list.loadError"));
          setOrders([]);
          setPagination({ page, limit: pageSize, total: 0, pages: 1 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, [page, t, token]);

  const statusOptions = useMemo(
    () => Array.from(new Set(orders.map((order) => order.status).filter(Boolean))),
    [orders],
  );

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const filteredOrders = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    const fromTime = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).getTime() : null;
    const toTime = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`).getTime() : null;

    return orders
      .filter((order) => {
        const orderTime = order.date ? new Date(order.date).getTime() : 0;
        const searchable = [
          order.displayId,
          order.id,
          order.productName,
          translatedStatusLabel(t, order),
          order.price,
          order.dateLabel,
          `${order.progress}%`,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = !query || searchable.includes(query);
        const matchesStatus = filters.status === "all" || order.status === filters.status;
        const matchesDateRange =
          (fromTime === null || orderTime >= fromTime) &&
          (toTime === null || orderTime <= toTime);

        return matchesSearch && matchesStatus && matchesDateRange;
      })
      .sort((first, second) => {
        const firstDate = first.date ? new Date(first.date).getTime() : 0;
        const secondDate = second.date ? new Date(second.date).getTime() : 0;
        if (filters.sort === "oldest") return firstDate - secondDate;
        if (filters.sort === "price-high") return second.amount - first.amount;
        if (filters.sort === "price-low") return first.amount - second.amount;
        return secondDate - firstDate;
      });
  }, [filters, orders, t]);

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "datePreset") return false;
    if (key === "sort") return value !== defaultFilters.sort;
    return value !== defaultFilters[key] && value !== "";
  }).length;

  const totalAmountLabel = useMemo(() => {
    const totalsByCurrency = filteredOrders.reduce((totals, order) => {
      const currency = order.currency || "USD";
      totals[currency] = (totals[currency] || 0) + order.amount;
      return totals;
    }, {});

    const totals = Object.entries(totalsByCurrency);
    if (!totals.length) return formatCurrency(0, orders[0]?.currency || "USD");

    return totals
      .map(([currency, amount]) => formatCurrency(amount, currency))
      .join(" + ");
  }, [filteredOrders, orders]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="relative overflow-hidden rounded-[24px] border border-violet-200/80 bg-[radial-gradient(circle_at_12%_0%,rgba(125,211,252,0.34),transparent_38%),radial-gradient(circle_at_92%_16%,rgba(244,114,182,0.24),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,243,255,0.96)_52%,rgba(236,254,255,0.94))] p-4 shadow-[0_20px_55px_rgba(109,40,217,0.13)] sm:rounded-[32px] sm:p-6 dark:border-violet-300/15 dark:bg-[radial-gradient(circle_at_10%_0%,rgba(56,189,248,0.16),transparent_36%),radial-gradient(circle_at_94%_10%,rgba(236,72,153,0.14),transparent_32%),linear-gradient(135deg,rgba(17,24,39,0.98),rgba(30,20,58,0.97)_55%,rgba(8,47,73,0.94))] dark:shadow-[0_24px_65px_rgba(0,0,0,0.34)]">
        <span className="pointer-events-none absolute -left-10 -top-14 h-36 w-36 rounded-full border border-white/50 bg-white/20 blur-sm dark:border-white/5 dark:bg-cyan-300/5" />
        <span className="pointer-events-none absolute -bottom-16 right-1/3 h-36 w-36 rounded-full bg-violet-400/10 blur-3xl dark:bg-fuchsia-400/10" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <span className="mb-2 block h-1 w-12 rounded-full bg-gradient-to-l from-cyan-400 via-violet-500 to-fuchsia-500 shadow-[0_0_16px_rgba(139,92,246,0.42)]" />
            <h1 className="bg-gradient-to-l from-slate-950 via-violet-800 to-sky-700 bg-clip-text text-2xl font-black text-transparent sm:text-3xl dark:from-white dark:via-violet-200 dark:to-cyan-200">
              {t("list.title")}
            </h1>
            <p className="mt-2 text-xs font-bold leading-6 text-slate-600 sm:text-sm dark:text-slate-300">{t("list.description")}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <span className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-2xl border border-emerald-300/70 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(209,250,229,0.88))] px-3 text-xs font-black shadow-[0_10px_25px_rgba(16,185,129,0.13)] sm:px-4 sm:text-sm dark:border-emerald-300/20 dark:bg-[linear-gradient(135deg,rgba(6,78,59,0.42),rgba(6,95,70,0.22))] dark:shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white shadow-[0_7px_16px_rgba(16,185,129,0.28)]">
                <CircleDollarSign className="h-4 w-4" />
              </span>
              <span className="truncate text-emerald-800 dark:text-emerald-200">
                {t("list.totalAmount")}: <bdi dir="ltr">{totalAmountLabel}</bdi>
              </span>
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="interactive-ring inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-2xl border border-violet-200/80 bg-white/75 px-3 text-xs font-black text-violet-700 shadow-[0_10px_24px_rgba(124,58,237,0.09)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white sm:px-4 sm:text-sm dark:border-white/10 dark:bg-white/[0.065] dark:text-violet-200 dark:hover:bg-white/[0.1]"
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              {t("list.resetFilters")}
              {activeFiltersCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#8B5CF6] px-1 text-[11px] text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="customer-orders-filters overflow-visible rounded-[18px] border border-[#C4B5FD]/55 bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FCFF_48%,#F5F3FF_100%)] shadow-[0_12px_30px_rgba(124,58,237,0.08)] sm:rounded-[24px] sm:shadow-[0_18px_45px_rgba(124,58,237,0.10)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#0B1220_0%,#111827_100%)] dark:shadow-[0_0_22px_rgba(139,92,246,0.16)]">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className="flex min-h-11 w-full items-center gap-1.5 px-3 text-right text-xs font-black text-slate-900 transition hover:bg-violet-50/50 sm:min-h-16 sm:gap-2 sm:px-4 sm:text-sm dark:text-slate-200 dark:hover:bg-white/[0.04]"
          aria-expanded={filtersOpen}
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[linear-gradient(135deg,#38BDF8,#8B5CF6)] text-white shadow-[0_8px_18px_rgba(56,189,248,0.18)] sm:h-9 sm:w-9 sm:rounded-2xl sm:shadow-[0_12px_28px_rgba(56,189,248,0.22)]">
            <SlidersHorizontal className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
          </span>
          <span className="flex-1">{t("list.searchFilter")}</span>
          {activeFiltersCount > 0 ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-violet-500 px-1.5 text-[10px] text-white">
              {activeFiltersCount}
            </span>
          ) : null}
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
        </button>

        <div className={`grid transition-[grid-template-rows] duration-300 ${filtersOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className={filtersOpen ? "overflow-visible" : "overflow-hidden"}>
        <div className="grid grid-cols-2 gap-2 border-t border-violet-100/80 p-2.5 sm:gap-3 sm:p-4 dark:border-white/10">
          <label className="relative col-span-2">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B5CF6] sm:right-4 sm:h-5 sm:w-5 dark:text-slate-400" />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => updateFilter("query", event.target.value)}
              placeholder={t("list.searchPlaceholder")}
              className="h-9 w-full rounded-xl border border-[#D8B4FE]/70 bg-white px-9 text-[11px] font-bold text-slate-950 shadow-[0_8px_18px_rgba(59,130,246,0.06)] outline-none transition placeholder:text-slate-400 focus:border-[#8B5CF6]/80 focus:ring-2 focus:ring-[#8B5CF6]/15 sm:h-12 sm:rounded-2xl sm:px-12 sm:text-sm sm:shadow-[0_12px_28px_rgba(59,130,246,0.08)] sm:focus:ring-4 dark:border-white/10 dark:bg-white/[0.065] dark:text-white dark:shadow-none"
            />
          </label>

          <FilterSelect label={t("list.status")} value={filters.status} onChange={(value) => updateFilter("status", value)}>
            <option value="all">{t("list.allStatuses")}</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {t(`statuses.${status}`, { defaultValue: status })}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label={t("list.sort")} value={filters.sort} onChange={(value) => updateFilter("sort", value)}>
            <option value="newest">{t("list.newest")}</option>
            <option value="oldest">{t("list.oldest")}</option>
            <option value="price-high">{t("list.highestPrice")}</option>
            <option value="price-low">{t("list.lowestPrice")}</option>
          </FilterSelect>

          <div className="col-span-2">
            <DateRangeFilter
              from={filters.dateFrom}
              preset={filters.datePreset}
              to={filters.dateTo}
              onChange={updateFilter}
            />
          </div>
        </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="glass-panel rounded-lg p-8 text-center text-sm font-black text-slate-500 dark:text-slate-400">
          {t("list.loading")}
        </div>
      ) : error ? (
        <EmptyState icon={Search} title={t("list.loadError")} description={error} />
      ) : filteredOrders.length > 0 ? (
        <section>
          <div className="grid gap-3 md:hidden">
            {filteredOrders.map((order) => (
              <article
                key={order.id}
                className="relative min-w-0 overflow-hidden rounded-[22px] border border-violet-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96)_55%,rgba(245,243,255,0.98))] p-4 shadow-[0_12px_32px_rgba(76,29,149,0.09)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(17,24,39,0.98))] dark:shadow-[0_14px_34px_rgba(0,0,0,0.24)]"
              >
                <span className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full bg-violet-400/10 blur-2xl" />

                <div className="relative flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span dir="ltr" className="text-[13px] font-black tracking-wide text-violet-700 dark:text-violet-300">
                        {order.displayId}
                      </span>
                      <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-black ${statusClasses[order.status] || "bg-slate-500/12 text-slate-600 dark:text-slate-300"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDotClasses[order.status] || "bg-slate-400"}`} />
                        {translatedStatusLabel(t, order)}
                      </span>
                    </div>
                    <h2 className="mt-2 break-words text-sm font-black leading-6 text-slate-950 dark:text-white">
                      {order.productName}
                    </h2>
                  </div>
                  <strong dir="ltr" className="shrink-0 rounded-xl bg-slate-950 px-2.5 py-2 text-[11px] font-black text-white shadow-lg shadow-slate-900/10 dark:bg-white dark:text-slate-950">
                    {order.price}
                  </strong>
                </div>

                <div className="relative mt-3 flex items-center justify-between gap-3 border-t border-slate-200/80 pt-3 dark:border-white/10">
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                    <span className="truncate">{order.dateLabel}</span>
                  </span>
                  <span className="shrink-0 text-[11px] font-black text-slate-500 dark:text-slate-400">
                    {order.progress}%
                  </span>
                </div>

                <div className="relative mt-2 flex items-center gap-3">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <span
                      className="block h-full rounded-full bg-[linear-gradient(90deg,#7C3AED,#38BDF8)] shadow-[0_0_10px_rgba(124,58,237,0.45)]"
                      style={{ width: `${order.progress}%` }}
                    />
                  </span>
                  <Link
                    to={`${basePath}/order/${order.id}`}
                    className="interactive-ring inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-violet-600 px-3 text-[11px] font-black text-white shadow-[0_8px_18px_rgba(124,58,237,0.24)] transition hover:bg-violet-700"
                  >
                    {t("list.details")}
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="glass-panel hidden overflow-hidden rounded-lg md:block">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-right text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">{t("list.order")}</th>
                  <th className="px-5 py-4">{t("list.product")}</th>
                  <th className="px-5 py-4">{t("list.status")}</th>
                  <th className="px-5 py-4">{t("list.price")}</th>
                  <th className="px-5 py-4">{t("list.date")}</th>
                  <th className="px-5 py-4">{t("list.progress")}</th>
                  <th className="px-5 py-4">{t("list.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.045]">
                    <td className="px-5 py-4 font-black">{order.displayId}</td>
                    <td className="px-5 py-4 font-semibold">{order.productName}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-md px-2.5 py-1 text-xs font-black ${statusClasses[order.status] || "bg-slate-500/12 text-slate-600 dark:text-slate-300"}`}>
                        {translatedStatusLabel(t, order)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-black">{order.price}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{order.dateLabel}</td>
                    <td className="px-5 py-4">
                      <div className="flex min-w-[130px] items-center gap-2">
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                          <span className="block h-full rounded-full bg-[linear-gradient(90deg,#7C3AED,#38BDF8)]" style={{ width: `${order.progress}%` }} />
                        </span>
                        <span className="w-10 text-right text-xs font-black text-slate-500 dark:text-slate-400">{order.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link to={`${basePath}/order/${order.id}`} className="font-black text-pulse">
                        {t("list.details")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </section>
      ) : (
        <EmptyState
          icon={Search}
          title={t("list.emptyTitle")}
          description={t("list.emptyDescription")}
          actionLabel={t("list.resetFilters")}
          onAction={resetFilters}
        />
      )}

      {!loading && !error && pagination.pages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300"
          >
            {t("common:actions.previous")}
          </button>
          <span className="text-sm font-black text-slate-500 dark:text-slate-400">
            {t("common:pagination.pageOf", { page: pagination.page, pages: pagination.pages })}
          </span>
          <button
            type="button"
            disabled={page >= pagination.pages}
            onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
            className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300"
          >
            {t("common:actions.next")}
          </button>
        </div>
      )}
    </div>
  );
}

function DateRangeFilter({ from, preset, to, onChange }) {
  return (
    <DateFilterPicker
      className="customer-orders-date-filter"
      from={from}
      preset={preset}
      to={to}
      onChange={(range) => {
        onChange("dateFrom", range.dateFrom);
        onChange("datePreset", range.datePreset);
        onChange("dateTo", range.dateTo);
      }}
    />
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-[9px] font-black text-slate-700 sm:mb-1.5 sm:gap-1.5 sm:text-xs dark:text-slate-400">
        <span className="grid h-4 w-4 place-items-center rounded-md bg-[#EDE9FE] text-[#8B5CF6] sm:h-5 sm:w-5 sm:rounded-lg dark:bg-transparent">
          <Filter className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
        </span>
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-xl border border-[#D8B4FE]/70 bg-white px-2 text-[10px] font-black text-slate-900 shadow-[0_8px_16px_rgba(124,58,237,0.06)] outline-none transition focus:border-[#8B5CF6]/80 focus:ring-2 focus:ring-[#8B5CF6]/15 sm:h-12 sm:rounded-2xl sm:px-3 sm:text-sm sm:shadow-[0_12px_26px_rgba(124,58,237,0.08)] sm:focus:ring-4 dark:border-white/10 dark:bg-white/[0.065] dark:text-white dark:shadow-none"
      >
        {children}
      </select>
    </label>
  );
}
