import { AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  BellRing,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  Image as ImageIcon,
  Landmark,
  MessageCircle,
  PackageCheck,
  PackageOpen,
  Pencil,
  RefreshCw,
  TrendingUp,
  SlidersHorizontal,
  Truck,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import DateRangePicker from "../../components/admin/dashboard/DateRangePicker";
import {
  ActionIconButton,
  ConfirmFooter,
  DashboardPanel,
  EmptyStateInline,
  LowBalanceNotice,
  MetricCard,
  ModalShell,
  PanelHeading,
  StatusBadge,
} from "../../components/admin/dashboard/DashboardPieces";
import { useToast } from "../../components/ToastProvider";
import {
  analyticsDaily,
  arabicDateFormatter,
  compactDateFormatter,
  createInitialManualRequests,
  createInitialOrders,
  currencyFormatter,
  formatRangeLabel,
  getPresetRange,
  getPreviousRange,
  initialActivities,
  initialProducts,
  initialSuppliers,
  initialUsers,
  initialWallets,
  isWithinRange,
  numberFormatter,
  popularPaymentMethods,
  preciseCurrencyFormatter,
  statusLabels,
} from "../../data/adminDashboard";

const metricTones = {
  profit: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  balances: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  orders: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  users: "bg-cyan-500/12 text-cyan-700 dark:text-cyan-300",
  products: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300",
  pending: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  completed: "bg-teal-500/12 text-teal-700 dark:text-teal-300",
  manual: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  wallets: "bg-lime-500/12 text-lime-700 dark:text-lime-300",
};

function sumBy(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function aggregateAnalytics(range) {
  return analyticsDaily
    .filter((item) => isWithinRange(item.date, range))
    .reduce(
      (total, item) => ({
        revenue: total.revenue + item.revenue,
        profit: total.profit + item.profit,
        balances: total.balances + item.balances,
        orders: total.orders + item.orders,
        users: total.users + item.users,
        products: total.products + item.products,
        pendingOrders: total.pendingOrders + item.pendingOrders,
        completedOrders: total.completedOrders + item.completedOrders,
        manualPending: total.manualPending + item.manualPending,
        walletBalances: total.walletBalances + item.walletBalances,
      }),
      {
        revenue: 0,
        profit: 0,
        balances: 0,
        orders: 0,
        users: 0,
        products: 0,
        pendingOrders: 0,
        completedOrders: 0,
        manualPending: 0,
        walletBalances: 0,
      },
    );
}

function percentChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function parseLocalizedNumber(value) {
  const normalizedValue = String(value ?? "")
    .trim()
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٬,]/g, "")
    .replace(/٫/g, ".")
    .replace(/[^\d.-]/g, "");

  return Number(normalizedValue);
}

function filterRowsByRange(rows, range) {
  return rows.filter((item) => isWithinRange(item.date, range));
}

function chunkItems(items, size) {
  return items.reduce((groups, item, index) => {
    if (index % size === 0) {
      groups.push([]);
    }
    groups[groups.length - 1].push(item);
    return groups;
  }, []);
}

function createSalesChartData(range) {
  const items = analyticsDaily.filter((item) => isWithinRange(item.date, range));
  if (!items.length) return [];

  const maxPoints = 14;
  const groupSize = Math.max(1, Math.ceil(items.length / maxPoints));
  const groupedItems = chunkItems(items, groupSize);

  return groupedItems.map((group) => {
    const revenue = sumBy(group, (item) => item.revenue);
    const orders = sumBy(group, (item) => item.orders);
    const lastDay = group[group.length - 1]?.date || group[0].date;
    return {
      label: compactDateFormatter.format(lastDay),
      revenue,
      orders,
    };
  });
}

function formatActivityTime() {
  return "الآن";
}

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const [range, setRange] = useState(() => getPresetRange("last7"));
  const [orders, setOrders] = useState(createInitialOrders);
  const [manualRequests, setManualRequests] = useState(createInitialManualRequests);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [wallets, setWallets] = useState(initialWallets);
  const [products, setProducts] = useState(initialProducts);
  const [users, setUsers] = useState(initialUsers);
  const [activities, setActivities] = useState(initialActivities);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [modal, setModal] = useState(null);

  const previousRange = useMemo(() => getPreviousRange(range), [range]);
  const currentAnalytics = useMemo(() => aggregateAnalytics(range), [range]);
  const previousAnalytics = useMemo(() => aggregateAnalytics(previousRange), [previousRange]);
  const rangeOrders = useMemo(() => filterRowsByRange(orders, range), [orders, range]);
  const rangeManualRequests = useMemo(() => filterRowsByRange(manualRequests, range), [manualRequests, range]);
  const salesChartData = useMemo(() => createSalesChartData(range), [range]);

  const totals = useMemo(() => {
    const supplierTotal = sumBy(suppliers, (item) => item.balance);
    const walletTotal = sumBy(wallets, (item) => item.balance);
    const userWalletTotal = sumBy(users, (item) => item.balance);
    const completedOrdersTotal = sumBy(
      rangeOrders.filter((item) => item.status === "completed"),
      (item) => item.amount,
    );
    const pendingOrderCount = rangeOrders.filter((item) => item.status === "pending" || item.status === "reviewing").length;
    const completedOrderCount = rangeOrders.filter((item) => item.status === "completed").length;
    const pendingManualCount = rangeManualRequests.filter((item) => item.status === "pending").length;

    return {
      profit: currentAnalytics.profit + Math.round(completedOrdersTotal * 0.23),
      balances: currentAnalytics.balances + supplierTotal + walletTotal + userWalletTotal,
      orders: currentAnalytics.orders + rangeOrders.length,
      users: currentAnalytics.users + users.length,
      products: currentAnalytics.products + products.length,
      pendingOrders: currentAnalytics.pendingOrders + pendingOrderCount,
      completedOrders: currentAnalytics.completedOrders + completedOrderCount,
      manualPending: currentAnalytics.manualPending + pendingManualCount,
      walletBalances: currentAnalytics.walletBalances + walletTotal + userWalletTotal,
    };
  }, [currentAnalytics, products.length, rangeManualRequests, rangeOrders, suppliers, users, wallets]);

  const metrics = useMemo(
    () => [
      {
        id: "profit",
        label: "إجمالي الأرباح",
        value: currencyFormatter.format(totals.profit),
        change: percentChange(totals.profit, previousAnalytics.profit),
        icon: CircleDollarSign,
        tone: metricTones.profit,
      },
      {
        id: "balances",
        label: "إجمالي الأرصدة",
        value: currencyFormatter.format(totals.balances),
        change: percentChange(totals.balances, previousAnalytics.balances),
        icon: Landmark,
        tone: metricTones.balances,
      },
      {
        id: "orders",
        label: "إجمالي الطلبات",
        value: numberFormatter.format(totals.orders),
        change: percentChange(totals.orders, previousAnalytics.orders),
        icon: PackageOpen,
        tone: metricTones.orders,
      },
      {
        id: "users",
        label: "إجمالي المستخدمين",
        value: numberFormatter.format(totals.users),
        change: percentChange(totals.users, previousAnalytics.users),
        icon: Users,
        tone: metricTones.users,
      },
      {
        id: "products",
        label: "إجمالي المنتجات",
        value: numberFormatter.format(totals.products),
        change: percentChange(totals.products, previousAnalytics.products),
        icon: Boxes,
        tone: metricTones.products,
      },
      {
        id: "pending",
        label: "الطلبات المعلقة",
        value: numberFormatter.format(totals.pendingOrders),
        change: percentChange(totals.pendingOrders, previousAnalytics.pendingOrders),
        icon: Clock3,
        tone: metricTones.pending,
        inverse: true,
      },
      {
        id: "completed",
        label: "الطلبات المكتملة",
        value: numberFormatter.format(totals.completedOrders),
        change: percentChange(totals.completedOrders, previousAnalytics.completedOrders),
        icon: PackageCheck,
        tone: metricTones.completed,
      },
      {
        id: "manual",
        label: "طلبات إضافة الرصيد اليدوي المعلقة",
        value: numberFormatter.format(totals.manualPending),
        change: percentChange(totals.manualPending, previousAnalytics.manualPending),
        icon: Truck,
        tone: metricTones.manual,
        inverse: true,
      },
      {
        id: "wallets",
        label: "إجمالي أرصدة المحافظ",
        value: currencyFormatter.format(totals.walletBalances),
        change: percentChange(totals.walletBalances, previousAnalytics.walletBalances),
        icon: WalletCards,
        tone: metricTones.wallets,
      },
    ],
    [previousAnalytics, totals],
  );
  const metricColumns = useMemo(() => chunkItems(metrics, 2), [metrics]);

  const alerts = useMemo(() => {
    const lowSuppliers = suppliers.filter((item) => item.balance < item.threshold);
    const lowWallets = wallets.filter((item) => item.balance < item.threshold);
    const outOfStock = products.filter((item) => item.stock <= 0);
    const pendingOrders = rangeOrders.filter((item) => item.status === "pending" || item.status === "reviewing");
    const pendingManual = rangeManualRequests.filter((item) => item.status === "pending");

    return [
      pendingOrders.length
        ? { id: "orders", title: "طلبات تحتاج مراجعة", value: `${pendingOrders.length} طلب`, tone: "warning" }
        : null,
      outOfStock.length
        ? { id: "stock", title: "منتجات نفدت", value: outOfStock.map((item) => item.name).join("، "), tone: "danger" }
        : null,
      lowSuppliers.length
        ? { id: "suppliers", title: "أرصدة منخفضة للموردين", value: `${lowSuppliers.length} مورد`, tone: "warning" }
        : null,
      lowWallets.length
        ? { id: "wallets", title: "محافظ تحتاج شحن", value: `${lowWallets.length} محفظة`, tone: "warning" }
        : null,
      pendingManual.length
        ? { id: "manual", title: "طلبات إضافة رصيد يدوي معلقة", value: `${pendingManual.length} طلب`, tone: "danger" }
        : null,
      { id: "system", title: "أخطاء النظام", value: "لا توجد أخطاء حرجة", tone: "success" },
    ].filter(Boolean);
  }, [products, rangeManualRequests, rangeOrders, suppliers, wallets]);

  const addActivity = (title, detail, type = "success") => {
    setActivities((items) => [
      {
        id: `ac-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title,
        detail,
        type,
        time: formatActivityTime(),
      },
      ...items,
    ].slice(0, 10));
  };

  const notify = ({ title, message, type = "success" }) => {
    showToast({ title, message, type, duration: 3200 });
  };

  const updateOrderStatus = (order, status) => {
    setOrders((items) => items.map((item) => (item.id === order.id ? { ...item, status } : item)));
    addActivity(`${statusLabels[status] || status} الطلب ${order.id}`, order.product, status === "rejected" ? "warning" : "success");
    notify({
      title: "تم تحديث الطلب",
      message: `${order.id} أصبح ${statusLabels[status] || status}`,
      type: status === "rejected" ? "warning" : "success",
    });
    setModal(null);
  };

  const updateManualStatus = (request, status) => {
    setManualRequests((items) => items.map((item) => (item.id === request.id ? { ...item, status } : item)));
    addActivity(`${statusLabels[status] || status} طلب إضافة رصيد ${request.id}`, request.provider, status === "rejected" ? "warning" : "wallet");
    notify({
      title: "تم تحديث طلب إضافة الرصيد",
      message: `${request.user} - ${preciseCurrencyFormatter.format(request.amount)}`,
      type: status === "rejected" ? "warning" : "success",
    });
  };

  const openBalanceModal = (type, item, mode = "set") => setModal({ type, item, mode });

  const refreshDashboard = () => {
    setLastRefresh(new Date());
    addActivity("تحديث بيانات لوحة الإدارة", formatRangeLabel(range), "sync");
    notify({ title: "تم تحديث البيانات", message: "تمت مزامنة المؤشرات داخل الصفحة.", type: "info" });
  };

  const submitProviderBalance = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const balance = parseLocalizedNumber(formData.get("balance"));
    if (!Number.isFinite(balance) || balance < 0) return;

    setSuppliers((items) => items.map((item) => (item.id === modal.item.id ? { ...item, balance, lastUpdate: "الآن" } : item)));
    addActivity(`تعديل رصيد ${modal.item.name}`, preciseCurrencyFormatter.format(balance), "wallet");
    notify({ title: "تم تعديل رصيد المورد", message: modal.item.name, type: "success" });
    setModal(null);
  };

  const submitWalletAdjustment = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const amount = parseLocalizedNumber(formData.get("amount"));
    if (!Number.isFinite(amount) || amount <= 0) return;

    const direction = modal.mode === "add" ? 1 : -1;
    setWallets((items) =>
      items.map((item) =>
        item.id === modal.item.id
          ? {
              ...item,
              balance: Math.max(0, item.balance + amount * direction),
              lastTransaction: `${modal.mode === "add" ? "إضافة" : "خصم"} ${preciseCurrencyFormatter.format(amount)} الآن`,
            }
          : item,
      ),
    );
    addActivity(`${modal.mode === "add" ? "إضافة رصيد إلى" : "خصم رصيد من"} ${modal.item.name}`, preciseCurrencyFormatter.format(amount), "wallet");
    notify({ title: "تم تحديث المحفظة", message: modal.item.name, type: "success" });
    setModal(null);
  };

  const submitUserBalance = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const amount = parseLocalizedNumber(formData.get("amount"));
    if (!Number.isFinite(amount) || amount <= 0) return;

    const direction = modal.mode === "add" ? 1 : -1;
    setUsers((items) =>
      items.map((item) =>
        item.id === modal.item.id ? { ...item, balance: Math.max(0, item.balance + amount * direction) } : item,
      ),
    );
    addActivity(`${modal.mode === "add" ? "إضافة رصيد للمستخدم" : "خصم رصيد من المستخدم"}`, modal.item.name, "wallet");
    notify({ title: "تم تحديث رصيد المستخدم", message: modal.item.name, type: "success" });
    setModal(null);
  };

  const submitProductPrice = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const price = parseLocalizedNumber(formData.get("price"));
    if (!Number.isFinite(price) || price <= 0) return;

    setProducts((items) => items.map((item) => (item.id === modal.item.id ? { ...item, price } : item)));
    addActivity(`تعديل سعر ${modal.item.name}`, preciseCurrencyFormatter.format(price), "price");
    notify({ title: "تم تعديل السعر", message: modal.item.name, type: "success" });
    setModal(null);
  };

  const submitProductEdit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const stock = parseLocalizedNumber(formData.get("stock"));
    if (!name || !category || !Number.isFinite(stock) || stock < 0) return;

    setProducts((items) =>
      items.map((item) => (item.id === modal.item.id ? { ...item, name, category, stock } : item)),
    );
    addActivity(`تعديل المنتج ${name}`, category, "product");
    notify({ title: "تم تعديل المنتج", message: name, type: "success" });
    setModal(null);
  };

  const deleteProduct = (product) => {
    setProducts((items) => items.filter((item) => item.id !== product.id));
    addActivity(`حذف المنتج ${product.name}`, product.category, "warning");
    notify({ title: "تم حذف المنتج", message: product.name, type: "warning" });
    setModal(null);
  };

  const toggleProductStatus = (product) => {
    const nextStatus = product.status === "active" ? "paused" : "active";
    setProducts((items) => items.map((item) => (item.id === product.id ? { ...item, status: nextStatus } : item)));
    addActivity(`${nextStatus === "active" ? "تفعيل" : "إيقاف"} المنتج ${product.name}`, product.category, "product");
    notify({ title: nextStatus === "active" ? "تم تفعيل المنتج" : "تم إيقاف المنتج", message: product.name, type: "info" });
  };

  const submitMessage = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = String(formData.get("message") || "").trim();
    if (!message) return;

    addActivity("إرسال رسالة", modal.item.user || modal.item.name, "message");
    notify({ title: "تم إرسال الرسالة", message: modal.item.user || modal.item.name, type: "success" });
    setModal(null);
  };

  const submitNotification = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = String(formData.get("message") || "").trim();
    if (!message) return;

    const isBroadcast = modal.type === "broadcast";
    addActivity(isBroadcast ? "إرسال إشعار جماعي" : "إرسال إشعار", modal.item.name, "message");
    notify({ title: isBroadcast ? "تم إرسال الإشعار للكل" : "تم إرسال الإشعار", message: modal.item.name, type: "success" });
    setModal(null);
  };

  return (
    <div dir="rtl" className="admin-dashboard space-y-3">
      <section className="admin-dashboard-top">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Admin Command Center</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">لوحة الإدارة</h1>
          <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
            آخر تحديث {lastRefresh.toLocaleTimeString("ar-EG-u-nu-latn", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="admin-top-actions">
          <div className="admin-date-action-row">
            <DateRangePicker value={range} onChange={setRange} />
            <button type="button" onClick={refreshDashboard} className="admin-toolbar-button" title="تحديث البيانات">
              <RefreshCw className="h-4.5 w-4.5" />
              <span>تحديث</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setModal({ type: "broadcast", item: { name: "كل المستخدمين" } })}
            className="admin-broadcast-button"
            title="إرسال إشعار للكل"
          >
            <BellRing className="h-4 w-4" />
            <span>إرسال إشعار للكل</span>
          </button>
        </div>
      </section>

      <section className="admin-overview-grid">
        <div className="admin-metrics-columns">
          {metricColumns.map((column, columnIndex) => (
            <div key={`metric-column-${columnIndex}`} className="admin-metric-column">
              {column.map((metric) => (
                <MetricCard key={metric.id} metric={metric} rangeKey={range.key} />
              ))}
            </div>
          ))}
        </div>

        <OrdersPanel
          orders={rangeOrders.slice(0, 5)}
          onView={(order) => setModal({ type: "order", item: order })}
          onApprove={(order) => updateOrderStatus(order, "completed")}
          onReject={(order) => updateOrderStatus(order, "rejected")}
          onStatus={(order) => setModal({ type: "orderStatus", item: order })}
        />
      </section>

      <section className="grid gap-3">
        <ManualRequestsPanel
          requests={rangeManualRequests.slice(0, 5)}
          onViewImage={(request) => setModal({ type: "receipt", item: request })}
          onApprove={(request) => updateManualStatus(request, "approved")}
          onReject={(request) => updateManualStatus(request, "rejected")}
          onMessage={(request) => setModal({ type: "message", item: request })}
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <SupplierBalancesPanel suppliers={suppliers} onEdit={(supplier) => openBalanceModal("supplierBalance", supplier)} />
        <AlertsPanel alerts={alerts} />
      </section>

      <section className="admin-insights-grid">
        <ActiveUsersPanel users={users} onNotify={(user) => setModal({ type: "notify", item: user })} />
        <PaymentMethodsPanel methods={popularPaymentMethods} />
      </section>

      <SalesChartPanel data={salesChartData} />

      <AnimatePresence>{modal && renderModal()}</AnimatePresence>
    </div>
  );

  function renderModal() {
    if (modal.type === "order") {
      const order = modal.item;
      return (
        <ModalShell key="order" title={`مشاهدة الطلب ${order.id}`} onClose={() => setModal(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="العميل" value={order.customer} />
            <Detail label="المنتج" value={order.product} />
            <Detail label="المبلغ" value={preciseCurrencyFormatter.format(order.amount)} />
            <Detail label="التاريخ" value={arabicDateFormatter.format(order.date)} />
            <Detail label="طريقة الدفع" value={order.channel} />
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-500 dark:text-slate-400">الحالة</p>
              <StatusBadge status={order.status} />
            </div>
          </div>
          <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm font-bold leading-6 text-slate-600 dark:bg-white/8 dark:text-slate-300">{order.note}</p>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => updateOrderStatus(order, "completed")} className="admin-primary-button bg-emerald-600 hover:bg-emerald-700">
              اعتماد
            </button>
            <button type="button" onClick={() => updateOrderStatus(order, "rejected")} className="admin-primary-button bg-rose-600 hover:bg-rose-700">
              رفض
            </button>
          </div>
        </ModalShell>
      );
    }

    if (modal.type === "receipt") {
      const request = modal.item;
      return (
        <ModalShell key="receipt" title={`صورة التحويل ${request.id}`} onClose={() => setModal(null)}>
          <img src={request.receiptImage} alt={`إيصال تحويل ${request.id}`} className="h-auto w-full rounded-lg border border-slate-200 dark:border-white/10" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Detail label="المستخدم" value={request.user} />
            <Detail label="المورد" value={request.provider} />
            <Detail label="المبلغ" value={preciseCurrencyFormatter.format(request.amount)} />
          </div>
        </ModalShell>
      );
    }

    if (modal.type === "supplierBalance") {
      return (
        <ModalShell
          key="supplier"
          title={`تعديل رصيد ${modal.item.name}`}
          onClose={() => setModal(null)}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="admin-secondary-button">
                إلغاء
              </button>
              <button type="submit" form="supplier-balance-form" className="admin-primary-button bg-emerald-600 hover:bg-emerald-700">
                حفظ الرصيد
              </button>
            </div>
          }
        >
          <form id="supplier-balance-form" onSubmit={submitProviderBalance} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-black text-slate-500 dark:text-slate-400">الرصيد الحالي</span>
              <input name="balance" inputMode="decimal" min="0" defaultValue={modal.item.balance} className="admin-form-input" autoFocus />
            </label>
          </form>
        </ModalShell>
      );
    }

    if (modal.type === "walletAdjust") {
      return (
        <ModalShell
          key="wallet"
          title={`${modal.mode === "add" ? "إضافة رصيد" : "خصم رصيد"} - ${modal.item.name}`}
          onClose={() => setModal(null)}
          footer={<ConfirmFooter onCancel={() => setModal(null)} onConfirm={() => document.getElementById("wallet-adjust-form")?.requestSubmit()} confirmLabel={modal.mode === "add" ? "إضافة" : "خصم"} tone={modal.mode === "add" ? "success" : "warning"} />}
        >
          <form id="wallet-adjust-form" onSubmit={submitWalletAdjustment} className="space-y-3">
            <Detail label="الرصيد الحالي" value={preciseCurrencyFormatter.format(modal.item.balance)} />
            <label className="block">
              <span className="mb-1 block text-xs font-black text-slate-500 dark:text-slate-400">المبلغ</span>
              <input name="amount" type="number" min="0.01" step="0.01" className="admin-form-input" autoFocus />
            </label>
          </form>
        </ModalShell>
      );
    }

    if (modal.type === "userBalance") {
      return (
        <ModalShell
          key="user-balance"
          title={`${modal.mode === "add" ? "إضافة رصيد للمستخدم" : "خصم رصيد من المستخدم"} - ${modal.item.name}`}
          onClose={() => setModal(null)}
          footer={<ConfirmFooter onCancel={() => setModal(null)} onConfirm={() => document.getElementById("user-balance-form")?.requestSubmit()} confirmLabel={modal.mode === "add" ? "إضافة" : "خصم"} tone={modal.mode === "add" ? "success" : "warning"} />}
        >
          <form id="user-balance-form" onSubmit={submitUserBalance} className="space-y-3">
            <Detail label="الرصيد الحالي" value={preciseCurrencyFormatter.format(modal.item.balance)} />
            <label className="block">
              <span className="mb-1 block text-xs font-black text-slate-500 dark:text-slate-400">المبلغ</span>
              <input name="amount" type="number" min="0.01" step="0.01" className="admin-form-input" autoFocus />
            </label>
          </form>
        </ModalShell>
      );
    }

    if (modal.type === "productPrice") {
      return (
        <ModalShell
          key="product-price"
          title={`تعديل سعر ${modal.item.name}`}
          onClose={() => setModal(null)}
          footer={<ConfirmFooter onCancel={() => setModal(null)} onConfirm={() => document.getElementById("product-price-form")?.requestSubmit()} confirmLabel="حفظ السعر" />}
        >
          <form id="product-price-form" onSubmit={submitProductPrice} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-black text-slate-500 dark:text-slate-400">السعر</span>
              <input name="price" type="number" min="0.01" step="0.01" defaultValue={modal.item.price} className="admin-form-input" autoFocus />
            </label>
          </form>
        </ModalShell>
      );
    }

    if (modal.type === "productEdit") {
      return (
        <ModalShell
          key="product-edit"
          title={`تعديل المنتج ${modal.item.name}`}
          onClose={() => setModal(null)}
          footer={<ConfirmFooter onCancel={() => setModal(null)} onConfirm={() => document.getElementById("product-edit-form")?.requestSubmit()} confirmLabel="حفظ المنتج" />}
        >
          <form id="product-edit-form" onSubmit={submitProductEdit} className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-black text-slate-500 dark:text-slate-400">اسم المنتج</span>
              <input name="name" defaultValue={modal.item.name} className="admin-form-input" autoFocus />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-black text-slate-500 dark:text-slate-400">القسم</span>
              <input name="category" defaultValue={modal.item.category} className="admin-form-input" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-black text-slate-500 dark:text-slate-400">المخزون</span>
              <input name="stock" type="number" min="0" defaultValue={modal.item.stock} className="admin-form-input" />
            </label>
          </form>
        </ModalShell>
      );
    }

    if (modal.type === "deleteProduct") {
      return (
        <ModalShell
          key="delete-product"
          title="حذف المنتج"
          onClose={() => setModal(null)}
          footer={<ConfirmFooter onCancel={() => setModal(null)} onConfirm={() => deleteProduct(modal.item)} confirmLabel="حذف" tone="danger" />}
        >
          <p className="text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">
            سيتم حذف {modal.item.name} من لوحة العمليات الحالية.
          </p>
        </ModalShell>
      );
    }

    if (modal.type === "message") {
      return (
        <ModalShell
          key="message"
          title={`إرسال رسالة إلى ${modal.item.user}`}
          onClose={() => setModal(null)}
          footer={<ConfirmFooter onCancel={() => setModal(null)} onConfirm={() => document.getElementById("message-form")?.requestSubmit()} confirmLabel="إرسال" tone="info" />}
        >
          <form id="message-form" onSubmit={submitMessage}>
            <textarea name="message" rows="5" className="admin-form-textarea" defaultValue={`مرحباً ${modal.item.user}، تم استلام طلب إضافة الرصيد وسيتم تحديث حالته قريباً.`} autoFocus />
          </form>
        </ModalShell>
      );
    }

    if (modal.type === "notify") {
      return (
        <ModalShell
          key="notify"
          title={`إرسال إشعار إلى ${modal.item.name}`}
          onClose={() => setModal(null)}
          footer={<ConfirmFooter onCancel={() => setModal(null)} onConfirm={() => document.getElementById("notify-form")?.requestSubmit()} confirmLabel="إرسال" tone="info" />}
        >
          <form id="notify-form" onSubmit={submitNotification}>
            <textarea name="message" rows="5" className="admin-form-textarea" defaultValue="تم تحديث بيانات حسابك داخل Winnie Fun." autoFocus />
          </form>
        </ModalShell>
      );
    }

    if (modal.type === "broadcast") {
      return (
        <ModalShell
          key="broadcast"
          title="إرسال إشعار إلى كل المستخدمين"
          onClose={() => setModal(null)}
          footer={<ConfirmFooter onCancel={() => setModal(null)} onConfirm={() => document.getElementById("broadcast-form")?.requestSubmit()} confirmLabel="إرسال للكل" tone="info" />}
        >
          <form id="broadcast-form" onSubmit={submitNotification}>
            <textarea name="message" rows="5" className="admin-form-textarea" defaultValue="تم إضافة تحديث جديد داخل Winnie Fun. تفقد حسابك الآن." autoFocus />
          </form>
        </ModalShell>
      );
    }

    if (modal.type === "orderStatus") {
      return (
        <ModalShell
          key="order-status"
          title={`تعديل حالة ${modal.item.id}`}
          onClose={() => setModal(null)}
          footer={<ConfirmFooter onCancel={() => setModal(null)} onConfirm={() => document.getElementById("order-status-form")?.requestSubmit()} confirmLabel="تحديث الحالة" tone="info" />}
        >
          <form
            id="order-status-form"
            onSubmit={(event) => {
              event.preventDefault();
              const status = new FormData(event.currentTarget).get("status");
              updateOrderStatus(modal.item, status);
            }}
          >
            <select name="status" defaultValue={modal.item.status} className="admin-form-input">
              <option value="pending">معلق</option>
              <option value="reviewing">مراجعة</option>
              <option value="completed">مكتمل</option>
              <option value="rejected">مرفوض</option>
            </select>
          </form>
        </ModalShell>
      );
    }

    return null;
  }
}

function OrdersPanel({ orders, onView, onApprove, onReject, onStatus }) {
  return (
    <DashboardPanel className="admin-orders-panel">
      <PanelHeading
        icon={PackageOpen}
        title="آخر الطلبات"
        action={<span className="admin-orders-count">{numberFormatter.format(orders.length)} حديثة</span>}
      />
      {orders.length ? (
        <div className="admin-orders-list">
          {orders.map((order) => (
            <article key={order.id} className="admin-order-card">
              <div className="admin-order-orb">
                <PackageOpen className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p dir="ltr" className="truncate text-right text-xs font-black text-slate-400 dark:text-slate-500">{order.id}</p>
                    <h3 className="mt-0.5 truncate text-sm font-black text-slate-950 dark:text-white">{order.customer}</h3>
                  </div>
                  <p dir="ltr" className="shrink-0 text-sm font-black text-slate-950 dark:text-white">{preciseCurrencyFormatter.format(order.amount)}</p>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="admin-order-product">{order.product}</span>
                  <StatusBadge status={order.status} />
                  <span className="text-[11px] font-black text-slate-400 dark:text-slate-500">{compactDateFormatter.format(order.date)}</span>
                </div>
              </div>

              <div className="admin-order-actions">
                <ActionIconButton icon={Eye} label="مشاهدة" onClick={() => onView(order)} />
                <ActionIconButton icon={CheckCircle2} label="اعتماد" tone="success" onClick={() => onApprove(order)} disabled={order.status === "completed"} />
                <ActionIconButton icon={XCircle} label="رفض" tone="danger" onClick={() => onReject(order)} disabled={order.status === "rejected"} />
                <ActionIconButton icon={SlidersHorizontal} label="تعديل الحالة" tone="info" onClick={() => onStatus(order)} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyStateInline text="لا توجد طلبات ضمن الفترة المختارة" />
      )}
    </DashboardPanel>
  );
}

function ManualRequestsPanel({ requests, onViewImage, onApprove, onReject, onMessage }) {
  return (
    <DashboardPanel>
      <PanelHeading icon={Truck} title="طلبات إضافة الرصيد اليدوي" />
      <div className="admin-compact-list">
        {requests.length ? requests.map((request) => (
          <article key={request.id} className="admin-compact-row">
            <button type="button" onClick={() => onViewImage(request)} className="admin-manual-thumb overflow-hidden border border-slate-200 dark:border-white/10" title="مشاهدة الصورة">
              <img src={request.receiptImage} alt="" className="h-full w-full object-cover" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-black text-slate-950 dark:text-white">{request.user}</p>
                <StatusBadge status={request.status} />
              </div>
              <p className="mt-0.5 truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {request.provider} · {preciseCurrencyFormatter.format(request.amount)}
              </p>
            </div>
            <div className="admin-row-actions flex shrink-0 gap-1">
              <ActionIconButton icon={ImageIcon} label="مشاهدة الصورة" onClick={() => onViewImage(request)} />
              <ActionIconButton icon={CheckCircle2} label="اعتماد" tone="success" onClick={() => onApprove(request)} disabled={request.status === "approved"} />
              <ActionIconButton icon={XCircle} label="رفض" tone="danger" onClick={() => onReject(request)} disabled={request.status === "rejected"} />
              <ActionIconButton icon={MessageCircle} label="إرسال رسالة" tone="info" onClick={() => onMessage(request)} />
            </div>
          </article>
        )) : <EmptyStateInline text="لا توجد طلبات إضافة رصيد يدوي ضمن الفترة" />}
      </div>
    </DashboardPanel>
  );
}

function SupplierBalancesPanel({ suppliers, onEdit }) {
  return (
    <DashboardPanel>
      <PanelHeading icon={Landmark} title="أرصدة الموردين" />
      <div className="admin-provider-grid grid gap-2 sm:grid-cols-2">
        {suppliers.map((supplier) => {
          const low = supplier.balance < supplier.threshold;
          return (
            <article key={supplier.id} className={`admin-provider-card ${low ? "admin-low-card" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-slate-950 dark:text-white">{supplier.name}</p>
                  <p dir="ltr" className="admin-provider-amount mt-0.5 text-right font-black">{preciseCurrencyFormatter.format(supplier.balance)}</p>
                </div>
                <LowBalanceNotice show={low} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">{supplier.lastUpdate}</span>
                <div className="flex items-center gap-1">
                  <StatusBadge status={supplier.status} />
                  <ActionIconButton icon={Pencil} label="تعديل الرصيد" tone="info" onClick={() => onEdit(supplier)} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </DashboardPanel>
  );
}

function AlertsPanel({ alerts }) {
  const toneClasses = {
    success: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
    danger: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  };

  return (
    <DashboardPanel>
      <PanelHeading icon={AlertTriangle} title="التنبيهات" />
      <div className="admin-compact-list">
        {alerts.map((alert) => (
          <article key={alert.id} className="admin-alert-row">
            <span className={`admin-alert-icon grid shrink-0 place-items-center ${toneClasses[alert.tone] || toneClasses.warning}`}>
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-slate-950 dark:text-white">{alert.title}</p>
              <p className="mt-0.5 truncate text-xs font-bold text-slate-500 dark:text-slate-400">{alert.value}</p>
            </div>
          </article>
        ))}
      </div>
    </DashboardPanel>
  );
}

function ActiveUsersPanel({ users, onNotify }) {
  return (
    <DashboardPanel>
      <PanelHeading icon={Users} title="المستخدمون النشطون الأكثر تفاعلًا على الموقع" />
      <div className="admin-active-users-list">
        {users.map((user, index) => (
          <article key={user.id} className="admin-active-user-row">
            <span className="admin-user-rank">#{index + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-xs font-black text-slate-950 dark:text-white">{user.name}</p>
                <span dir="ltr" className="text-[10px] font-black text-emerald-600 dark:text-emerald-300">{user.score}%</span>
              </div>
              <p className="mt-0.5 truncate text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {numberFormatter.format(user.orders)} طلب · {numberFormatter.format(user.visits)} زيارة · {user.lastActivity}
              </p>
            </div>
            <ActionIconButton icon={BellRing} label="إرسال إشعار" tone="info" onClick={() => onNotify(user)} />
          </article>
        ))}
      </div>
    </DashboardPanel>
  );
}

function PaymentMethodsPanel({ methods }) {
  return (
    <DashboardPanel>
      <PanelHeading icon={WalletCards} title="طرق الدفع الأكثر استخدامًا" />
      <div className="admin-payment-list">
        {methods.map((method) => (
          <article key={method.id} className="admin-payment-row">
            <span className={`admin-payment-mark bg-gradient-to-br ${method.tone}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-xs font-black text-slate-950 dark:text-white">{method.name}</p>
                <span dir="ltr" className="text-[11px] font-black text-slate-500 dark:text-slate-400">{method.usage}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
                <span className={`block h-full rounded-full bg-gradient-to-r ${method.tone}`} style={{ width: `${method.usage}%` }} />
              </div>
              <p className="mt-1 truncate text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {numberFormatter.format(method.transactions)} عملية · {preciseCurrencyFormatter.format(method.volume)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </DashboardPanel>
  );
}

function SalesChartPanel({ data }) {
  const width = 420;
  const height = 118;
  const padding = 10;
  const maxRevenue = Math.max(...data.map((item) => item.revenue), 1);
  const points = data.map((item, index) => {
    const x = data.length === 1 ? width / 2 : padding + (index * (width - padding * 2)) / (data.length - 1);
    const y = height - padding - (item.revenue / maxRevenue) * (height - padding * 2);
    return { ...item, x, y };
  });
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : "";
  const totalRevenue = sumBy(data, (item) => item.revenue);
  const totalOrders = sumBy(data, (item) => item.orders);

  return (
    <DashboardPanel className="admin-sales-chart-panel">
      <PanelHeading
        icon={TrendingUp}
        title="مبيعات الفترة"
        action={<span className="admin-orders-count">{preciseCurrencyFormatter.format(totalRevenue)}</span>}
      />
      <div className="admin-sales-chart-shell">
        <div className="admin-sales-chart-meta">
          <span>{numberFormatter.format(totalOrders)} طلب</span>
          <span>{data[0]?.label} - {data[data.length - 1]?.label}</span>
        </div>
        <svg className="admin-sales-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="رسم بياني صغير للمبيعات">
          <defs>
            <linearGradient id="salesLineGradient" x1="0" x2="1" y1="0" y2="0">
              <stop stopColor="#F59E0B" />
              <stop offset="1" stopColor="#FBBF24" />
            </linearGradient>
            <linearGradient id="salesAreaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop stopColor="#F59E0B" stopOpacity="0.28" />
              <stop offset="1" stopColor="#FBBF24" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((line) => (
            <line
              key={line}
              x1={padding}
              x2={width - padding}
              y1={padding + line * (height - padding * 2)}
              y2={padding + line * (height - padding * 2)}
              className="admin-sales-grid-line"
            />
          ))}
          <path d={areaPath} fill="url(#salesAreaGradient)" />
          <path d={linePath} className="admin-sales-line" />
          {points.map((point, index) => (
            <circle key={`${point.label}-${index}`} cx={point.x} cy={point.y} r={index === points.length - 1 ? 4 : 2.8} className="admin-sales-dot" />
          ))}
        </svg>
      </div>
    </DashboardPanel>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-xs font-black text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
