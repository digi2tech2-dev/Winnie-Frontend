import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ClipboardList, RefreshCw, Search, Sparkles } from "lucide-react";
import {
  getAdminOrder,
  getAdminOrders,
  markAdminOrderManualSuccess,
  refundAdminOrder,
  retryAdminOrder,
  syncAdminOrder,
} from "../../api/adminOrders";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import OrderCard from "../../components/admin/orders/OrderCard";
import OrderDetailsModal from "../../components/admin/orders/OrderDetailsModal";
import OrdersFilters from "../../components/admin/orders/OrdersFilters";
import OrdersStats from "../../components/admin/orders/OrdersStats";
import { useAuth } from "../../context/AuthContext";

const pageSize = 20;

const initialFilters = {
  query: "",
  status: "all",
  type: "all",
  datePreset: "all",
  dateFrom: "",
  dateTo: "",
  userId: "",
  sort: "newest",
};

function getErrorMessage(error, fallback) {
  return error?.userMessage || error?.message || fallback;
}

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, pages: 1 });
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailsError, setDetailsError] = useState("");
  const [actionKey, setActionKey] = useState("");

  const loadOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setError("يلزم تسجيل الدخول بحساب مدير.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await getAdminOrders(token, {
        ...buildBackendQuery(appliedFilters),
        page,
        limit: pageSize,
      });
      setOrders(result.orders);
      setPagination(result.pagination);
    } catch (requestError) {
      const message = getErrorMessage(requestError, "تعذر تحميل الطلبات.");
      setOrders([]);
      setPagination({ page, limit: pageSize, total: 0, pages: 1 });
      setError(message);
      showToast({ type: "error", title: "لم يتم تحميل الطلبات", message });
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, page, showToast, token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!selectedOrderId || !token) return undefined;

    let cancelled = false;
    const fallback = orders.find((order) => order.id === selectedOrderId) || null;
    setSelectedOrder(fallback);
    setDetailsLoading(true);
    setDetailsError("");

    const loadDetails = async () => {
      try {
        const result = await getAdminOrder(token, selectedOrderId);
        if (!cancelled) setSelectedOrder(result.order);
      } catch (requestError) {
        if (!cancelled) {
          setDetailsError(getErrorMessage(requestError, "تعذر تحميل تفاصيل الطلب."));
        }
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    };

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [orders, selectedOrderId, token]);

  const visibleOrders = useMemo(
    () => filterLoadedOrders(orders, appliedFilters),
    [appliedFilters, orders],
  );
  const activeFiltersCount = countActiveFilters(appliedFilters);

  const updateFilter = (key, value) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({ ...draftFilters });
  };

  const resetFilters = () => {
    setDraftFilters({ ...initialFilters });
    setAppliedFilters({ ...initialFilters });
    setPage(1);
  };

  const closeDetails = useCallback(() => {
    if (actionKey) return;
    setSelectedOrderId(null);
    setSelectedOrder(null);
    setDetailsError("");
  }, [actionKey]);

  const executeOrderAction = async (orderId, action, payload = {}) => {
    if (!token || actionKey) return;
    const key = `${orderId}:${action}`;
    setActionKey(key);

    try {
      const handlers = {
        complete: markAdminOrderManualSuccess,
        refund: refundAdminOrder,
        retry: retryAdminOrder,
        sync: syncAdminOrder,
      };
      const handler = handlers[action];
      if (!handler) throw new Error("إجراء الطلب غير مدعوم.");

      const result = await handler(token, orderId, payload);
      setSelectedOrder(result.order);
      showToast({ type: "success", title: result.message || "تم تحديث الطلب" });
      await loadOrders();

      try {
        const details = await getAdminOrder(token, orderId);
        setSelectedOrder(details.order);
      } catch {
        // List refresh already succeeded; keep the backend-confirmed action result.
      }
    } catch (requestError) {
      const message = getErrorMessage(requestError, "فشل تنفيذ الإجراء على الطلب.");
      showToast({ type: "error", title: "فشل الإجراء", message });
    } finally {
      setActionKey("");
    }
  };

  return (
    <div dir="rtl" className="space-y-4 sm:space-y-5">
      <section className="relative overflow-hidden rounded-[26px] border border-violet-200/70 bg-gradient-to-l from-white via-sky-50/80 to-violet-50/80 p-5 shadow-[0_18px_48px_rgba(124,58,237,0.09)] sm:p-6 dark:border-white/[0.08] dark:bg-[linear-gradient(135deg,#111827,#0D1324_58%,#17152A)] dark:shadow-[0_0_26px_rgba(139,92,246,0.14)]">
        <div className="relative flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] text-white shadow-[0_12px_28px_rgba(124,58,237,0.25)]">
            <ClipboardList className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-slate-950 sm:text-3xl dark:text-white">إدارة الطلبات</h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                <i className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                متصل بالخادم
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm dark:text-[#9AA7BD]">
              متابعة طلبات العملاء الفعلية وإدارتها من الخادم.
            </p>
          </div>
          <button
            type="button"
            onClick={loadOrders}
            disabled={isLoading}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-violet-200 bg-white px-3 text-[10px] font-black text-violet-700 transition hover:bg-violet-50 disabled:opacity-60 dark:border-violet-400/20 dark:bg-white/[0.05] dark:text-violet-300"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            تحديث
          </button>
          <Sparkles className="hidden h-6 w-6 text-violet-400/60 sm:block" />
        </div>
      </section>

      <OrdersStats orders={orders} total={pagination.total} />

      <OrdersFilters
        filters={draftFilters}
        onChange={updateFilter}
        onApply={applyFilters}
        onReset={resetFilters}
        activeCount={activeFiltersCount}
      />

      <section aria-labelledby="orders-list-title">
        <div className="mb-3 flex items-end justify-between gap-3 px-1">
          <div>
            <h2 id="orders-list-title" className="text-base font-black text-slate-950 dark:text-white">قائمة الطلبات</h2>
            <p className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-[#8A94A7]">
              افتح التفاصيل لتنفيذ الإجراءات المعتمدة على الطلب.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-600 shadow-sm dark:border-white/10 dark:bg-[#111827] dark:text-slate-300">
            تم تحميل {visibleOrders.length.toLocaleString("ar-EG-u-nu-latn")} من {(pagination.total || orders.length).toLocaleString("ar-EG-u-nu-latn")}
          </span>
        </div>

        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <OrdersLoadingState />
        ) : visibleOrders.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleOrders.map((order) => (
              <OrderCard key={order.id} order={order} onDetails={setSelectedOrderId} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title={error ? "تعذر تحميل الطلبات" : "لا توجد طلبات"}
            description={error || "لا توجد طلبات مطابقة للفلاتر الحالية."}
            actionLabel="إعادة ضبط الفلاتر"
            onAction={resetFilters}
          />
        )}

        {!isLoading && !error && pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300"
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
              className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300"
            >
              التالي
            </button>
          </div>
        )}
      </section>

      <OrderDetailsModal
        actionKey={actionKey}
        detailsError={detailsError}
        isLoading={detailsLoading}
        onAction={executeOrderAction}
        onClose={closeDetails}
        order={selectedOrder}
      />
    </div>
  );
}

function OrdersLoadingState() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="جارٍ تحميل طلبات الإدارة" aria-busy="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <article key={index} className="rounded-[24px] border border-slate-200/80 bg-white p-4 dark:border-white/[0.08] dark:bg-[#111827]">
          <div className="flex justify-between gap-3">
            <div className="flex-1">
              <SkeletonBlock className="h-3 w-14" />
              <SkeletonBlock className="mt-2 h-5 w-32" />
            </div>
            <SkeletonBlock className="h-7 w-20 rounded-full" />
          </div>
          <SkeletonBlock className="mt-4 h-20 w-full rounded-2xl" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((__, itemIndex) => <SkeletonBlock key={itemIndex} className="h-12 rounded-xl" />)}
          </div>
          <SkeletonBlock className="mt-4 h-10 w-full rounded-2xl" />
        </article>
      ))}
    </div>
  );
}

function countActiveFilters(filters) {
  return [
    filters.query.trim() !== "",
    filters.status !== "all",
    filters.type !== "all",
    filters.datePreset !== "all",
    filters.userId.trim() !== "",
    filters.sort !== "newest",
  ].filter(Boolean).length;
}

function buildBackendQuery(filters) {
  const bounds = getDateBounds(filters);
  return {
    search: filters.query,
    status: filters.status,
    userId: filters.userId,
    from: bounds.from,
    to: bounds.to,
  };
}

function filterLoadedOrders(orders, filters) {
  return orders
    .filter((order) => filters.type === "all" || order.executionType === filters.type)
    .sort((first, second) => {
      const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
      const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;
      return filters.sort === "oldest" ? firstTime - secondTime : secondTime - firstTime;
    });
}

function getDateBounds(filters) {
  if (filters.datePreset === "all") return {};

  if (filters.dateFrom || filters.dateTo) {
    return {
      from: filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).toISOString() : undefined,
      to: filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999`).toISOString() : undefined,
    };
  }

  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filters.datePreset === "last7") start.setDate(start.getDate() - 6);
  if (filters.datePreset === "last30") start.setDate(start.getDate() - 29);
  if (filters.datePreset === "month" || filters.datePreset === "thisMonth") start = new Date(now.getFullYear(), now.getMonth(), 1);

  return { from: start.toISOString(), to: end.toISOString() };
}
