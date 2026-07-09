import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Filter,
  PackageCheck,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCustomerOrders } from "../../api/orders";
import EmptyState from "../../components/EmptyState";
import DateFilterPicker from "../../components/DateFilterPicker";
import { useAuth } from "../../context/AuthContext";

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

const initialFilters = {
  query: "",
  status: "all",
  dateFrom: "",
  datePreset: "all",
  dateTo: "",
  sort: "newest",
};

export default function CustomerOrders({ basePath = "/customer" }) {
  const { token } = useAuth();
  const { t } = useTranslation("orders");
  const [filters, setFilters] = useState(initialFilters);
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
  }, [page, token]);

  const statusOptions = useMemo(
    () => Array.from(new Set(orders.map((order) => order.status).filter(Boolean))),
    [orders],
  );

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
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
          order.statusLabel,
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
  }, [filters, orders]);

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "datePreset") return false;
    if (key === "sort") return value !== initialFilters.sort;
    return value !== initialFilters[key] && value !== "";
  }).length;

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-lg p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black">{t("list.title")}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{t("list.description")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 text-sm font-black text-slate-600 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300">
              <PackageCheck className="h-4 w-4 text-[#8B5CF6]" />
              {t("list.count", { shown: filteredOrders.length, total: pagination.total || orders.length })}
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="interactive-ring inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 text-sm font-black text-slate-600 transition hover:border-[#C4B5FD] hover:bg-[#F5F3FF] dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300 dark:hover:bg-white/[0.075]"
            >
              <RotateCcw className="h-4 w-4" />
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

      <section className="overflow-visible rounded-[24px] border border-[#C4B5FD]/55 bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FCFF_48%,#F5F3FF_100%)] shadow-[0_18px_45px_rgba(124,58,237,0.10)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#0B1220_0%,#111827_100%)] dark:shadow-[0_0_22px_rgba(139,92,246,0.16)]">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className="flex min-h-16 w-full items-center gap-2 px-4 text-right text-sm font-black text-slate-900 transition hover:bg-violet-50/50 dark:text-slate-200 dark:hover:bg-white/[0.04]"
          aria-expanded={filtersOpen}
        >
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[linear-gradient(135deg,#38BDF8,#8B5CF6)] text-white shadow-[0_12px_28px_rgba(56,189,248,0.22)]">
            <SlidersHorizontal className="h-5 w-5" />
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
        <div className="grid grid-cols-2 gap-3 border-t border-violet-100/80 p-4 dark:border-white/10">
          <label className="relative col-span-2">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8B5CF6] dark:text-slate-400" />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => updateFilter("query", event.target.value)}
              placeholder={t("list.searchPlaceholder")}
              className="h-12 w-full rounded-2xl border border-[#D8B4FE]/70 bg-white px-12 text-sm font-bold text-slate-950 shadow-[0_12px_28px_rgba(59,130,246,0.08)] outline-none transition placeholder:text-slate-400 focus:border-[#8B5CF6]/80 focus:ring-4 focus:ring-[#8B5CF6]/15 dark:border-white/10 dark:bg-white/[0.065] dark:text-white dark:shadow-none"
            />
          </label>

          <FilterSelect label={t("list.status")} value={filters.status} onChange={(value) => updateFilter("status", value)}>
            <option value="all">{t("list.allStatuses")}</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </FilterSelect>

          <DateRangeFilter
            from={filters.dateFrom}
            preset={filters.datePreset}
            to={filters.dateTo}
            onChange={updateFilter}
          />

          <FilterSelect label={t("list.sort")} value={filters.sort} onChange={(value) => updateFilter("sort", value)}>
            <option value="newest">{t("list.newest")}</option>
            <option value="oldest">{t("list.oldest")}</option>
            <option value="price-high">{t("list.highestPrice")}</option>
            <option value="price-low">{t("list.lowestPrice")}</option>
          </FilterSelect>
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
        <section className="glass-panel overflow-hidden rounded-lg">
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
                        {order.statusLabel}
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
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-400">
        <span className="grid h-5 w-5 place-items-center rounded-lg bg-[#EDE9FE] text-[#8B5CF6] dark:bg-transparent">
          <Filter className="h-3.5 w-3.5" />
        </span>
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-[#D8B4FE]/70 bg-white px-3 text-sm font-black text-slate-900 shadow-[0_12px_26px_rgba(124,58,237,0.08)] outline-none transition focus:border-[#8B5CF6]/80 focus:ring-4 focus:ring-[#8B5CF6]/15 dark:border-white/10 dark:bg-white/[0.065] dark:text-white dark:shadow-none"
      >
        {children}
      </select>
    </label>
  );
}
