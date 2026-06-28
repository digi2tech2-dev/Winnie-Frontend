import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Filter,
  PackageCheck,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { getCustomerOrders } from "../../api/orders";
import EmptyState from "../../components/EmptyState";
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
  dateTo: "",
  sort: "newest",
};

function openDatePicker(event) {
  const input = event.currentTarget;

  if (typeof input.showPicker !== "function") {
    input.focus();
    return;
  }

  try {
    input.showPicker();
  } catch {
    input.focus();
  }
}

function blockDateTyping(event) {
  if (["Tab", "Escape", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();

  if (event.key === "Enter" || event.key === " ") {
    openDatePicker(event);
  }
}

export default function CustomerOrders({ basePath = "/customer" }) {
  const { token } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          setError(requestError.userMessage || "Unable to load orders.");
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
    if (key === "sort") return value !== initialFilters.sort;
    return value !== initialFilters[key] && value !== "";
  }).length;

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-lg p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black">My orders</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Read-only backend order history.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 text-sm font-black text-slate-600 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300">
              <PackageCheck className="h-4 w-4 text-[#8B5CF6]" />
              {filteredOrders.length} of {pagination.total || orders.length}
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="interactive-ring inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 text-sm font-black text-slate-600 transition hover:border-[#C4B5FD] hover:bg-[#F5F3FF] dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300 dark:hover:bg-white/[0.075]"
            >
              <RotateCcw className="h-4 w-4" />
              Reset filters
              {activeFiltersCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#8B5CF6] px-1 text-[11px] text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#C4B5FD]/55 bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FCFF_48%,#F5F3FF_100%)] p-4 shadow-[0_18px_45px_rgba(124,58,237,0.10)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#0B1220_0%,#111827_100%)] dark:shadow-[0_0_22px_rgba(139,92,246,0.16)]">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-slate-200">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[linear-gradient(135deg,#38BDF8,#8B5CF6)] text-white shadow-[0_12px_28px_rgba(56,189,248,0.22)]">
            <SlidersHorizontal className="h-5 w-5" />
          </span>
          Search and filter orders
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="relative col-span-2">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8B5CF6] dark:text-slate-400" />
            <input
              type="search"
              value={filters.query}
              onChange={(event) => updateFilter("query", event.target.value)}
              placeholder="Search by order number, product, status, price..."
              className="h-12 w-full rounded-2xl border border-[#D8B4FE]/70 bg-white px-12 text-sm font-bold text-slate-950 shadow-[0_12px_28px_rgba(59,130,246,0.08)] outline-none transition placeholder:text-slate-400 focus:border-[#8B5CF6]/80 focus:ring-4 focus:ring-[#8B5CF6]/15 dark:border-white/10 dark:bg-white/[0.065] dark:text-white dark:shadow-none"
            />
          </label>

          <FilterSelect label="Status" value={filters.status} onChange={(value) => updateFilter("status", value)}>
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </FilterSelect>

          <DateRangeFilter
            from={filters.dateFrom}
            to={filters.dateTo}
            onChange={updateFilter}
          />

          <FilterSelect label="Sort" value={filters.sort} onChange={(value) => updateFilter("sort", value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="price-high">Highest price</option>
            <option value="price-low">Lowest price</option>
          </FilterSelect>
        </div>
      </section>

      {loading ? (
        <div className="glass-panel rounded-lg p-8 text-center text-sm font-black text-slate-500 dark:text-slate-400">
          Loading orders...
        </div>
      ) : error ? (
        <EmptyState icon={Search} title="Unable to load orders" description={error} />
      ) : filteredOrders.length > 0 ? (
        <section className="glass-panel overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-right text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Progress</th>
                  <th className="px-5 py-4">Action</th>
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
                        Details
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
          title="No matching orders"
          description="Change the search or filters to view loaded backend orders."
          actionLabel="Reset filters"
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
            Previous
          </button>
          <span className="text-sm font-black text-slate-500 dark:text-slate-400">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.pages}
            onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
            className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function DateRangeFilter({ from, to, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-400">
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-[linear-gradient(135deg,#22D3EE,#7C3AED,#EC4899)] text-white shadow-[0_10px_24px_rgba(124,58,237,0.28)]">
          <CalendarDays className="h-4 w-4" />
        </span>
        Date
      </span>
      <span className="grid grid-cols-2 gap-2 rounded-2xl border border-[#D8B4FE]/70 bg-white p-1.5 shadow-[0_12px_28px_rgba(124,58,237,0.10)] transition focus-within:border-[#8B5CF6]/80 focus-within:ring-4 focus-within:ring-[#8B5CF6]/15 dark:border-white/10 dark:bg-white/[0.065] dark:shadow-none">
        <span className="min-w-0">
          <span className="mb-1 block px-2 text-[10px] font-black text-[#8B5CF6] dark:text-[#C084FC]">From</span>
          <input
            type="date"
            value={from}
            onChange={(event) => onChange("dateFrom", event.target.value)}
            onPointerDown={openDatePicker}
            onFocus={openDatePicker}
            onKeyDown={blockDateTyping}
            onPaste={(event) => event.preventDefault()}
            inputMode="none"
            className="h-9 w-full rounded-xl border border-transparent bg-[#F8FCFF] px-2 text-xs font-black text-slate-900 outline-none transition hover:border-[#C4B5FD] focus:border-[#8B5CF6]/60 dark:bg-[#0B1220] dark:text-white"
            aria-label="Start date"
          />
        </span>
        <span className="min-w-0">
          <span className="mb-1 block px-2 text-[10px] font-black text-[#EC4899] dark:text-[#F0ABFC]">To</span>
          <input
            type="date"
            value={to}
            onChange={(event) => onChange("dateTo", event.target.value)}
            onPointerDown={openDatePicker}
            onFocus={openDatePicker}
            onKeyDown={blockDateTyping}
            onPaste={(event) => event.preventDefault()}
            inputMode="none"
            className="h-9 w-full rounded-xl border border-transparent bg-[#FDF7FF] px-2 text-xs font-black text-slate-900 outline-none transition hover:border-[#F0ABFC] focus:border-[#EC4899]/60 dark:bg-[#0B1220] dark:text-white"
            aria-label="End date"
          />
        </span>
      </span>
    </label>
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
