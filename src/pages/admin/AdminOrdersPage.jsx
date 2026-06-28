import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClipboardList, Search, Sparkles } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import OrderCard from "../../components/admin/orders/OrderCard";
import OrderDetailsModal from "../../components/admin/orders/OrderDetailsModal";
import OrdersFilters from "../../components/admin/orders/OrdersFilters";
import OrdersStats from "../../components/admin/orders/OrdersStats";
import { adminOrdersSeed, orderStatusMeta } from "../../data/adminOrders";

const initialFilters = {
  query: "",
  status: "all",
  type: "all",
  datePreset: "all",
  dateFrom: "",
  dateTo: "",
  sort: "newest",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState(adminOrdersSeed);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadingTimerRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadingTimerRef.current = window.setTimeout(() => setIsLoading(false), 650);
    return () => window.clearTimeout(loadingTimerRef.current);
  }, []);

  const filteredOrders = useMemo(() => filterOrders(orders, appliedFilters), [appliedFilters, orders]);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || null;
  const activeFiltersCount = countActiveFilters(appliedFilters);

  const updateFilter = (key, value) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setAppliedFilters({ ...draftFilters });
    setIsLoading(true);
    window.clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = window.setTimeout(() => setIsLoading(false), 280);
  };

  const resetFilters = () => {
    setDraftFilters({ ...initialFilters });
    setAppliedFilters({ ...initialFilters });
    window.clearTimeout(loadingTimerRef.current);
    setIsLoading(false);
  };

  const closeDetails = useCallback(() => setSelectedOrderId(null), []);

  const saveStatus = async (orderId, nextStatus) => {
    await new Promise((resolve) => window.setTimeout(resolve, 520));
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order)));
    showToast({
      type: "success",
      title: "تم حفظ الحالة بنجاح",
      message: `تم تحديث الطلب ${orderId} إلى ${orderStatusMeta[nextStatus]?.label || nextStatus}.`,
    });
  };

  return (
    <div dir="rtl" className="space-y-4 sm:space-y-5">
      <section className="relative overflow-hidden rounded-[26px] border border-violet-200/70 bg-gradient-to-l from-white via-sky-50/80 to-violet-50/80 p-5 shadow-[0_18px_48px_rgba(124,58,237,0.09)] sm:p-6 dark:border-white/[0.08] dark:bg-[linear-gradient(135deg,#111827,#0D1324_58%,#17152A)] dark:shadow-[0_0_26px_rgba(139,92,246,0.14)]">
        <span className="pointer-events-none absolute -left-10 -top-14 h-36 w-36 rounded-full bg-violet-400/15 blur-3xl" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-16 right-1/3 h-32 w-32 rounded-full bg-sky-400/15 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] text-white shadow-[0_12px_28px_rgba(124,58,237,0.25)]">
            <ClipboardList className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-slate-950 sm:text-3xl dark:text-white">الطلبات</h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                تحديث مباشر
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm dark:text-[#9AA7BD]">إدارة الطلبات ومتابعة التنفيذ من مكان واحد.</p>
          </div>
          <Sparkles className="hidden h-6 w-6 text-violet-400/60 sm:block" />
        </div>
      </section>

      <OrdersStats orders={orders} />

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
            <p className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-[#8A94A7]">اضغط على التفاصيل لإدارة حالة الطلب</p>
          </div>
          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-600 shadow-sm dark:border-white/10 dark:bg-[#111827] dark:text-slate-300">
            {filteredOrders.length.toLocaleString("ar-EG")} من {orders.length.toLocaleString("ar-EG")}
          </span>
        </div>

        {isLoading ? (
          <OrdersLoadingState />
        ) : filteredOrders.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} onDetails={setSelectedOrderId} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="لا توجد طلبات مطابقة"
            description="جرّب تغيير كلمات البحث أو إعادة تعيين الفلاتر لعرض كل الطلبات."
            actionLabel="إعادة تعيين الفلاتر"
            onAction={resetFilters}
          />
        )}
      </section>

      <OrderDetailsModal order={selectedOrder} onClose={closeDetails} onSaveStatus={saveStatus} />
    </div>
  );
}

function OrdersLoadingState() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="جاري تحميل الطلبات" aria-busy="true">
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
    filters.sort !== "newest",
  ].filter(Boolean).length;
}

function filterOrders(orders, filters) {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase("ar");
  const dateBounds = getDateBounds(filters);

  return orders
    .filter((order) => {
      const searchableText = [
        order.id,
        order.requestId,
        order.playerId,
        order.userId,
        order.username,
        order.userEmail,
        order.supplier,
        order.product,
      ].join(" ").toLocaleLowerCase("ar");
      const orderTime = new Date(order.createdAt).getTime();

      return (
        (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
        (filters.status === "all" || order.status === filters.status) &&
        (filters.type === "all" || order.executionType === filters.type) &&
        (!dateBounds.from || orderTime >= dateBounds.from) &&
        (!dateBounds.to || orderTime <= dateBounds.to)
      );
    })
    .sort((first, second) => {
      const firstTime = new Date(first.createdAt).getTime();
      const secondTime = new Date(second.createdAt).getTime();
      return filters.sort === "oldest" ? firstTime - secondTime : secondTime - firstTime;
    });
}

function getDateBounds(filters) {
  if (filters.datePreset === "all") return {};

  if (filters.datePreset === "custom") {
    return {
      from: filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).getTime() : null,
      to: filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999`).getTime() : null,
    };
  }

  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filters.datePreset === "last7") start.setDate(start.getDate() - 6);
  if (filters.datePreset === "last30") start.setDate(start.getDate() - 29);
  if (filters.datePreset === "month") start = new Date(now.getFullYear(), now.getMonth(), 1);

  return { from: start.getTime(), to: endOfToday };
}
