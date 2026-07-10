import {
  Activity,
  AlertTriangle,
  Boxes,
  Clock3,
  DollarSign,
  ExternalLink,
  PackageCheck,
  PackageOpen,
  ReceiptText,
  RefreshCw,
  Server,
  TrendingUp,
  Truck,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboardData } from "../../api/adminDashboard";
import { approveDeposit, rejectDeposit } from "../../api/adminDeposits";
import { markAdminOrderManualSuccess, refundAdminOrder } from "../../api/adminOrders";
import { normalizeApiError } from "../../api/errors";
import {
  DashboardPanel,
  EmptyStateInline,
  MetricCard,
  PanelHeading,
} from "../../components/admin/dashboard/DashboardPieces";
import DateRangePicker from "../../components/admin/dashboard/DateRangePicker";
import { useToast } from "../../components/ToastProvider";
import {
  compactDateFormatter,
  getPresetRange,
  getRangeDays,
  numberFormatter,
  toDateInputValue,
} from "../../data/adminDashboard";
import { useAuth } from "../../context/AuthContext";

const orderStatusStyles = {
  pending: "border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-300",
  processing: "border-sky-500/25 bg-sky-500/12 text-sky-700 dark:text-sky-300",
  manual_review: "border-violet-500/25 bg-violet-500/12 text-violet-700 dark:text-violet-300",
  completed: "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  failed: "border-rose-500/25 bg-rose-500/12 text-rose-700 dark:text-rose-300",
  canceled: "border-slate-500/25 bg-slate-500/12 text-slate-700 dark:text-slate-300",
  partial: "border-orange-500/25 bg-orange-500/12 text-orange-700 dark:text-orange-300",
};

const orderStatusLabels = {
  pending: "قيد الانتظار",
  processing: "قيد التنفيذ",
  manual_review: "مراجعة يدوية",
  completed: "مكتمل",
  failed: "مرفوض",
  canceled: "ملغي",
  partial: "مكتمل جزئيًا",
};

const depositStatusStyles = {
  APPROVED: "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  PENDING: "border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-300",
  REJECTED: "border-rose-500/25 bg-rose-500/12 text-rose-700 dark:text-rose-300",
};

const depositStatusLabels = {
  APPROVED: "مقبول",
  PENDING: "قيد الانتظار",
  REJECTED: "مرفوض",
};

function formatCount(value) {
  if (value === null || value === undefined) return "غير متاح";
  return numberFormatter.format(value);
}

function buildMetrics(values = {}) {
  return [
    {
      accent: "admin-metric-card--orders",
      description: "كل الطلبات المسجلة داخل المنصة",
      icon: PackageOpen,
      id: "total-orders",
      label: "إجمالي الطلبات",
      rawValue: values.totalOrders,
      tone: "admin-metric-tone-orders",
    },
    {
      accent: "admin-metric-card--pending",
      description: "طلبات تحتاج متابعة من فريق التشغيل",
      icon: Clock3,
      id: "pending-orders",
      inverse: true,
      label: "طلبات قيد الانتظار أو التنفيذ",
      rawValue: values.pendingOrders,
      tone: "admin-metric-tone-pending",
    },
    {
      accent: "admin-metric-card--completed",
      description: "طلبات تم تنفيذها بنجاح",
      icon: PackageCheck,
      id: "completed-orders",
      label: "الطلبات المكتملة",
      rawValue: values.completedOrders,
      tone: "admin-metric-tone-completed",
    },
    {
      accent: "admin-metric-card--failed",
      description: "طلبات لم تكتمل وتحتاج مراجعة",
      icon: XCircle,
      id: "failed-orders",
      inverse: true,
      label: "الطلبات الفاشلة",
      rawValue: values.failedOrders,
      tone: "admin-metric-tone-failed",
    },
    {
      accent: "admin-metric-card--users",
      description: "كل الحسابات المسجلة في النظام",
      icon: Users,
      id: "total-users",
      label: "إجمالي المستخدمين",
      rawValue: values.totalUsers,
      tone: "admin-metric-tone-users",
    },
    {
      accent: "admin-metric-card--wallets",
      description: "إجمالي أرصدة العملاء الحالية كما هي مخزنة في قاعدة البيانات",
      icon: WalletCards,
      id: "total-wallet-balances",
      label: "إجمالي أرصدة المحافظ",
      rawValue: values.totalWalletBalances,
      valueLabel: values.totalWalletBalancesLabel,
      tone: "admin-metric-tone-wallets",
    },
    {
      accent: "admin-metric-card--review",
      description: "حسابات جديدة ما زالت بانتظار القرار",
      icon: AlertTriangle,
      id: "pending-users",
      inverse: true,
      label: "مستخدمون بانتظار المراجعة",
      rawValue: values.pendingUsers,
      tone: "admin-metric-tone-review",
    },
    {
      accent: "admin-metric-card--products",
      description: "المنتجات المتاحة للإدارة والبيع",
      icon: Boxes,
      id: "total-products",
      label: "إجمالي المنتجات",
      rawValue: values.totalProducts,
      tone: "admin-metric-tone-products",
    },
    {
      accent: "admin-metric-card--deposits",
      description: "إيداعات بانتظار الاعتماد أو الرفض",
      icon: Truck,
      id: "pending-deposits",
      inverse: true,
      label: "إيداعات قيد الانتظار",
      rawValue: values.pendingDeposits,
      tone: "admin-metric-tone-deposits",
    },
    {
      accent: "admin-metric-card--requests",
      description: "طلبات المجموعات والوكلاء المفتوحة",
      icon: Activity,
      id: "pending-requests",
      inverse: true,
      label: "طلبات المجموعات والوكلاء المعلقة",
      rawValue: values.pendingGroupRequests,
      tone: "admin-metric-tone-requests",
    },
  ].map((metric) => ({
    ...metric,
    change: null,
    unavailable: metric.rawValue === null || metric.rawValue === undefined,
    value: metric.valueLabel || formatCount(metric.rawValue),
  }));
}

function formatRefreshTime(value) {
  if (!value) return "لم تُحدّث بعد";
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const missingMetricLabel = "\u2014";

const dashboardUsdFormatter = new Intl.NumberFormat("ar-EG-u-nu-latn", {
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
  style: "currency",
});

function getSummaryValue(cards, key) {
  const value = cards?.[key]?.value;
  return value === null || value === undefined ? null : value;
}

function getSummaryChange(cards, key) {
  const value = cards?.[key]?.changePercent;
  return value === null || value === undefined ? null : value;
}

function formatSummaryValue(value, type = "count") {
  if (value === null || value === undefined) return missingMetricLabel;
  if (type === "currency") return dashboardUsdFormatter.format(Number(value) || 0);
  return numberFormatter.format(Number(value) || 0);
}

function buildPeriodMetrics(range, summary) {
  const cards = summary?.cards || {};
  const days = getRangeDays(range);

  return [
    {
      accent: "admin-metric-card--wallets",
      change: getSummaryChange(cards, "totalRevenueUsd"),
      description: "الإيرادات من الطلبات المكتملة داخل الفترة المحددة",
      icon: DollarSign,
      id: "period-revenue",
      label: "إجمالي الإيرادات (USD)",
      tone: "admin-metric-tone-wallets",
      unavailable: getSummaryValue(cards, "totalRevenueUsd") === null,
      value: formatSummaryValue(getSummaryValue(cards, "totalRevenueUsd"), "currency"),
    },
    {
      accent: "admin-metric-card--completed",
      change: getSummaryChange(cards, "netProfitUsd"),
      description: "الأرباح من الطلبات المكتملة داخل الفترة المحددة",
      icon: TrendingUp,
      id: "period-profit",
      label: "صافي الأرباح (USD)",
      tone: "admin-metric-tone-completed",
      unavailable: getSummaryValue(cards, "netProfitUsd") === null,
      value: formatSummaryValue(getSummaryValue(cards, "netProfitUsd"), "currency"),
    },
    {
      accent: "admin-metric-card--orders",
      change: getSummaryChange(cards, "completedOrders"),
      description: `طلبات مكتملة خلال ${numberFormatter.format(days)} يوم`,
      icon: PackageCheck,
      id: "period-completed-orders",
      label: "الطلبات المكتملة في الفترة",
      tone: "admin-metric-tone-orders",
      unavailable: getSummaryValue(cards, "completedOrders") === null,
      value: formatSummaryValue(getSummaryValue(cards, "completedOrders")),
    },
    {
      accent: "admin-metric-card--pending",
      change: getSummaryChange(cards, "followUpOrders"),
      description: "طلبات ما زالت تحتاج متابعة داخل نفس الفترة",
      icon: Clock3,
      id: "period-pending-orders",
      inverse: true,
      label: "طلبات قيد المتابعة",
      tone: "admin-metric-tone-pending",
      unavailable: getSummaryValue(cards, "followUpOrders") === null,
      value: formatSummaryValue(getSummaryValue(cards, "followUpOrders")),
    },
    {
      accent: "admin-metric-card--users",
      change: getSummaryChange(cards, "activeUsers"),
      description: "حسابات ونشاط مستخدمين مسجل داخل الفترة",
      icon: Users,
      id: "period-users",
      label: "نشاط المستخدمين",
      tone: "admin-metric-tone-users",
      unavailable: getSummaryValue(cards, "activeUsers") === null,
      value: formatSummaryValue(getSummaryValue(cards, "activeUsers")),
    },
    {
      accent: "admin-metric-card--products",
      change: getSummaryChange(cards, "productMovement"),
      description: "منتجات أضيفت أو تحركت داخل الفترة المحددة",
      icon: Boxes,
      id: "period-products",
      label: "حركة المنتجات",
      tone: "admin-metric-tone-products",
      unavailable: getSummaryValue(cards, "productMovement") === null,
      value: formatSummaryValue(getSummaryValue(cards, "productMovement")),
    },
    {
      accent: "admin-metric-card--deposits",
      change: getSummaryChange(cards, "pendingManualOperations"),
      description: "طلبات يدوية أو تحويلات تحتاج اعتمادًا",
      icon: Truck,
      id: "period-manual-pending",
      inverse: true,
      label: "عمليات يدوية معلقة",
      tone: "admin-metric-tone-deposits",
      unavailable: getSummaryValue(cards, "pendingManualOperations") === null,
      value: formatSummaryValue(getSummaryValue(cards, "pendingManualOperations")),
    },
    {
      accent: "admin-metric-card--requests",
      change: getSummaryChange(cards, "walletMovementUsd"),
      description: "حركة أرصدة المحافظ اليومية داخل الفترة",
      icon: WalletCards,
      id: "period-wallet-volume",
      label: "حركة المحافظ",
      tone: "admin-metric-tone-requests",
      unavailable: getSummaryValue(cards, "walletMovementUsd") === null,
      value: formatSummaryValue(getSummaryValue(cards, "walletMovementUsd"), "currency"),
    },
  ];
}

function getOperationalAlerts(metrics = {}, failures = []) {
  const items = [
    metrics.pendingOrders > 0
      ? { id: "orders", title: "طلبات تحتاج إلى متابعة", value: `${formatCount(metrics.pendingOrders)} قيد الانتظار أو التنفيذ`, tone: "warning" }
      : null,
    metrics.pendingDeposits > 0
      ? { id: "deposits", title: "إيداعات يدوية معلقة", value: `${formatCount(metrics.pendingDeposits)} طلبات`, tone: "danger" }
      : null,
    metrics.pendingUsers > 0
      ? { id: "users", title: "مستخدمون بانتظار الموافقة", value: `${formatCount(metrics.pendingUsers)} مستخدمين`, tone: "warning" }
      : null,
    metrics.pendingGroupRequests > 0
      ? { id: "group-requests", title: "طلبات مجموعات أو وكلاء معلقة", value: `${formatCount(metrics.pendingGroupRequests)} طلبات`, tone: "warning" }
      : null,
    failures.length
      ? { id: "partial", title: "بيانات لوحة التحكم غير مكتملة", value: `فشل ${numberFormatter.format(failures.length)} من الطلبات`, tone: "warning" }
      : null,
  ].filter(Boolean);

  if (items.length) return items;
  return [{ id: "clear", title: "لا توجد عمليات معلقة", value: "مؤشرات النظام الحالية سليمة.", tone: "success" }];
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [depositActionKey, setDepositActionKey] = useState("");
  const [selectedRange, setSelectedRange] = useState(() => getPresetRange("thisMonth"));

  const loadDashboard = useCallback(async ({ notify = false } = {}) => {
    if (!token) {
      setDashboard(null);
      setError("جلسة المدير غير متاحة.");
      setLoading(false);
      return;
    }

    setError("");
    setRefreshing(true);
    setDashboard((current) => (current ? { ...current, periodSummary: null, refreshedAt: null } : null));

    try {
      const result = await getAdminDashboardData(token, {
        from: toDateInputValue(selectedRange.start),
        to: toDateInputValue(selectedRange.end),
      });
      setDashboard(result);

      if (result.failures.length) {
        setError("تعذر تحميل بعض بيانات لوحة التحكم، وتظهر المؤشرات المتاحة حاليًا.");
      }

      if (notify) {
        showToast({
          title: result.failures.length ? "تم تحديث اللوحة جزئيًا" : "تم تحديث لوحة التحكم",
          message: result.failures.length ? "تعذر تحميل بعض مؤشرات النظام." : "تظهر الآن أحدث البيانات.",
          type: result.failures.length ? "warning" : "success",
        });
      }
    } catch (loadError) {
      const normalized = normalizeApiError(loadError, "تعذر تحميل بيانات لوحة التحكم.");
      setError(normalized.userMessage || normalized.message);
      if (notify) {
        showToast({
          title: "فشل تحديث لوحة التحكم",
          message: normalized.userMessage || normalized.message,
          type: "error",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRange, showToast, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const approvePurchaseOrder = useCallback(async (order) => {
    if (!token || !order?.id) return;
    const key = `approve:${order.id}`;
    setDepositActionKey(key);

    try {
      const result = await markAdminOrderManualSuccess(token, order.id);
      showToast({
        type: "success",
        title: result.message || "تم قبول طلب الشراء",
      });
      await loadDashboard();
    } catch (approveError) {
      const normalized = normalizeApiError(approveError, "فشل قبول طلب الشراء.");
      showToast({
        type: "error",
        title: "فشل قبول الطلب",
        message: normalized.userMessage || normalized.message,
      });
    } finally {
      setDepositActionKey("");
    }
  }, [loadDashboard, showToast, token]);

  const rejectPurchaseOrder = useCallback(async (order) => {
    if (!token || !order?.id) return;
    const key = `reject:${order.id}`;
    setDepositActionKey(key);

    try {
      const result = await refundAdminOrder(token, order.id);
      showToast({
        type: "success",
        title: result.message || "تم رفض طلب الشراء وإرجاع قيمته",
      });
      await loadDashboard();
    } catch (rejectError) {
      const normalized = normalizeApiError(rejectError, "فشل رفض طلب الشراء.");
      showToast({
        type: "error",
        title: "فشل رفض الطلب",
        message: normalized.userMessage || normalized.message,
      });
    } finally {
      setDepositActionKey("");
    }
  }, [loadDashboard, showToast, token]);

  const reviewManualDeposit = useCallback(async (deposit, action) => {
    if (!token || !deposit?.id) return;
    const key = `${action}-deposit:${deposit.id}`;
    setDepositActionKey(key);

    try {
      const handler = action === "approve" ? approveDeposit : rejectDeposit;
      const result = await handler(token, deposit.id);
      showToast({
        type: "success",
        title: result.message || (action === "approve" ? "تم قبول طلب إضافة الرصيد" : "تم رفض طلب إضافة الرصيد"),
      });
      await loadDashboard();
    } catch (reviewError) {
      const normalized = normalizeApiError(reviewError, "فشل تحديث طلب إضافة الرصيد.");
      showToast({
        type: "error",
        title: action === "approve" ? "فشل قبول الطلب" : "فشل رفض الطلب",
        message: normalized.userMessage || normalized.message,
      });
    } finally {
      setDepositActionKey("");
    }
  }, [loadDashboard, showToast, token]);

  const metrics = useMemo(() => buildMetrics(dashboard?.metrics || {}), [dashboard]);
  const periodMetrics = useMemo(
    () => buildPeriodMetrics(selectedRange, dashboard?.periodSummary),
    [dashboard?.periodSummary, selectedRange],
  );
  const alerts = useMemo(
    () => getOperationalAlerts(dashboard?.metrics || {}, dashboard?.failures || []),
    [dashboard],
  );

  return (
    <div dir="rtl" className="admin-dashboard space-y-3">
      <section className="admin-dashboard-top">
        <div className="admin-dashboard-hero-copy min-w-0">
          <p className="admin-dashboard-kicker">مركز إدارة المنصة</p>
          <h1>لوحة الإدارة</h1>
          <p className="admin-dashboard-refresh">
            آخر تحديث {formatRefreshTime(dashboard?.refreshedAt)}
          </p>
        </div>
        <div className="admin-top-actions">
          <span className="admin-dashboard-live-pill">
            <Activity className="h-4 w-4" />
            بيانات مباشرة
          </span>
          <button
            type="button"
            onClick={() => loadDashboard({ notify: true })}
            className="admin-toolbar-button"
            disabled={refreshing}
            title="تحديث البيانات"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "جار التحديث" : "تحديث"}</span>
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/12 px-4 py-3 text-sm font-bold text-amber-800 dark:text-amber-200">
          {error}
        </div>
      )}

      <DashboardPanel className="admin-period-panel">
        <PanelHeading
          icon={Activity}
          title="تحليلات الفترة"
          action={<DateRangePicker value={selectedRange} onChange={setSelectedRange} />}
        />
        <section className="admin-metrics-grid mt-3">
          {periodMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} rangeKey={selectedRange.key} />
          ))}
        </section>
      </DashboardPanel>

      {loading ? (
        <DashboardPanel>
          <PanelHeading icon={RefreshCw} title="جارٍ تحميل بيانات لوحة التحكم" />
          <EmptyStateInline text="جارٍ تحميل مؤشرات الإدارة..." />
        </DashboardPanel>
      ) : (
        <>
          <section className="admin-metrics-grid">
            {metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} rangeKey={dashboard?.refreshedAt || "live"} />
            ))}
          </section>

          <section className="admin-overview-grid">
            <RecentOrdersPanel
              actionKey={depositActionKey}
              onApprove={approvePurchaseOrder}
              onReject={rejectPurchaseOrder}
              orders={dashboard?.recentOrders || []}
            />
            <OperationalAlertsPanel alerts={alerts} />
          </section>

          <ManualDepositsPanel
            actionKey={depositActionKey}
            deposits={dashboard?.recentDeposits || []}
            onApprove={(deposit) => reviewManualDeposit(deposit, "approve")}
            onReject={(deposit) => reviewManualDeposit(deposit, "reject")}
          />

          <ProvidersBalancesPanel providers={dashboard?.providers || []} />
        </>
      )}
    </div>
  );
}

function ProvidersBalancesPanel({ providers }) {
  const sortedProviders = useMemo(
    () => [...providers].sort((left, right) => Number(right.isActive || right.active) - Number(left.isActive || left.active)),
    [providers],
  );

  return (
    <DashboardPanel>
      <PanelHeading
        icon={Server}
        title="أرصدة الموردين"
        action={<span className="rounded-full bg-teal-500/12 px-3 py-1 text-[11px] font-black text-teal-700 dark:text-teal-300">{numberFormatter.format(providers.length)} مورد</span>}
      />
      {sortedProviders.length ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sortedProviders.map((provider, index) => (
            <ProviderBalanceCard key={provider.id || provider.slug || provider.name} provider={provider} index={index} />
          ))}
        </div>
      ) : (
        <EmptyStateInline text="لا توجد موردون لعرض أرصدتهم." />
      )}
    </DashboardPanel>
  );
}

function ProviderBalanceCard({ provider, index }) {
  const active = provider.isActive !== false && provider.active !== false;
  const hasError = provider.balanceStatus === "error";
  const palette = [
    "from-teal-500/18 via-sky-500/10 to-violet-500/12 text-teal-700 dark:text-teal-200",
    "from-violet-500/18 via-fuchsia-500/10 to-sky-500/12 text-violet-700 dark:text-violet-200",
    "from-emerald-500/18 via-teal-500/10 to-cyan-500/12 text-emerald-700 dark:text-emerald-200",
    "from-amber-500/18 via-orange-500/10 to-rose-500/12 text-amber-700 dark:text-amber-200",
  ][index % 4];
  const statusClass = hasError
    ? "border-rose-500/25 bg-rose-500/12 text-rose-700 dark:text-rose-300"
    : active
      ? "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
      : "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-300";

  return (
    <article className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br ${palette} p-4 shadow-[0_16px_36px_rgba(15,23,42,0.07)] dark:border-white/10`}>
      <div className="pointer-events-none absolute -left-10 -top-12 h-28 w-28 rounded-full bg-white/40 blur-2xl dark:bg-white/5" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950 dark:text-white">{provider.name || provider.displayName || "مورد"}</p>
          <p dir="ltr" className="mt-1 truncate text-right text-[11px] font-bold text-slate-500 dark:text-slate-400">{provider.code || provider.slug || provider.id}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${statusClass}`}>
          {hasError ? "تعذر الرصيد" : active ? "نشط" : "غير نشط"}
        </span>
      </div>

      <div className="relative mt-4 rounded-xl border border-white/60 bg-white/70 px-3 py-3 text-right shadow-inner dark:border-white/10 dark:bg-slate-950/30">
        <p className="text-[11px] font-black text-slate-500 dark:text-slate-400">الرصيد الحالي</p>
        <p dir="ltr" className={`mt-1 text-right text-xl font-black ${hasError ? "text-rose-700 dark:text-rose-300" : "text-slate-950 dark:text-white"}`}>
          {provider.balanceLabel || "غير متاح"}
        </p>
        {provider.balanceError ? (
          <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-rose-700 dark:text-rose-300">{provider.balanceError}</p>
        ) : null}
      </div>
    </article>
  );
}

function RecentOrdersPanel({ actionKey, onApprove, onReject, orders }) {
  const [receiptOrder, setReceiptOrder] = useState(null);

  return (
    <>
      <DashboardPanel className="admin-orders-panel">
        <PanelHeading
          icon={PackageOpen}
          title="أحدث طلبات الشراء"
          action={<span className="admin-orders-count">{numberFormatter.format(orders.length)} طلب</span>}
        />
        {orders.length ? (
          <div className="admin-orders-list">
            {orders.map((order) => {
              const reviewable = ["pending", "processing", "manual_review"].includes(order.status);
              const busy = actionKey.endsWith(`:${order.id}`);
              const approving = actionKey === `approve:${order.id}`;
              const rejecting = actionKey === `reject:${order.id}`;

              return (
              <article key={order.id} className="admin-order-card">
                <div className="admin-order-orb">
                  <PackageOpen className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p dir="ltr" className="truncate text-right text-xs font-black text-slate-400 dark:text-slate-500">{order.displayId || order.id}</p>
                      <h3 className="mt-0.5 truncate text-sm font-black text-slate-950 dark:text-white">{order.username || order.userEmail || "عميل"}</h3>
                    </div>
                    <p dir="ltr" className="shrink-0 text-sm font-black text-slate-950 dark:text-white">{order.amountLabel}</p>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="admin-order-product">{order.product || "منتج"}</span>
                    <OrderStatusBadge status={order.status} label={order.statusLabel} />
                    <span className="text-[11px] font-black text-slate-400 dark:text-slate-500">
                      {order.createdAt ? compactDateFormatter.format(new Date(order.createdAt)) : order.createdAtLabel}
                    </span>
                  </div>
                </div>

                <div className="admin-order-actions">
                  <button
                    type="button"
                    onClick={() => setReceiptOrder(order)}
                    className="admin-action-icon-button grid shrink-0 place-items-center border border-sky-500/25 bg-sky-500/10 text-sky-700 transition hover:bg-sky-500/15 dark:text-sky-300"
                    aria-label="عرض إيصال طلب الشراء"
                    title="عرض الإيصال"
                  >
                    <ReceiptText className="admin-action-icon" />
                  </button>
                  {reviewable ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onApprove(order)}
                        disabled={busy}
                        className="admin-action-icon-button grid shrink-0 place-items-center border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-55 dark:text-emerald-300"
                        aria-label="قبول طلب الشراء"
                        title="قبول الطلب"
                      >
                        <PackageCheck className={`admin-action-icon ${approving ? "animate-pulse" : ""}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject(order)}
                        disabled={busy}
                        className="admin-action-icon-button grid shrink-0 place-items-center border border-rose-500/25 bg-rose-500/10 text-rose-700 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-55 dark:text-rose-300"
                        aria-label="رفض طلب الشراء"
                        title="رفض الطلب"
                      >
                        <XCircle className={`admin-action-icon ${rejecting ? "animate-pulse" : ""}`} />
                      </button>
                    </>
                  ) : null}
                  <Link
                    to="/admin/tools/orders"
                    className="admin-action-icon-button grid shrink-0 place-items-center border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                    aria-label="فتح صفحة طلبات الشراء"
                    title="فتح صفحة طلبات الشراء"
                  >
                    <ExternalLink className="admin-action-icon" />
                  </Link>
                </div>
              </article>
              );
            })}
          </div>
        ) : (
          <EmptyStateInline text="لا توجد طلبات شراء حتى الآن." />
        )}
      </DashboardPanel>

      {receiptOrder ? (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => event.target === event.currentTarget && setReceiptOrder(null)}
        >
          <section className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white p-4 shadow-2xl dark:bg-[#111827]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black text-violet-600 dark:text-violet-300">WINNIE FUN</p>
                <h3 className="mt-1 text-base font-black text-slate-950 dark:text-white">إيصال طلب الشراء</h3>
              </div>
              <button
                type="button"
                onClick={() => setReceiptOrder(null)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 dark:bg-white/10 dark:text-white"
                aria-label="إغلاق الإيصال"
                title="إغلاق"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="my-4 border-t border-dashed border-slate-200 dark:border-white/10" />
            <div className="grid grid-cols-2 gap-2">
              <ReceiptField label="رقم الطلب" value={receiptOrder.displayId || receiptOrder.id} dir="ltr" />
              <ReceiptField label="الحالة" value={orderStatusLabels[receiptOrder.status] || receiptOrder.statusLabel} />
              <ReceiptField label="العميل" value={receiptOrder.username || receiptOrder.userEmail || "-"} />
              <ReceiptField label="المنتج" value={receiptOrder.product || "-"} />
              <ReceiptField label="الكمية" value={numberFormatter.format(receiptOrder.quantity || 1)} />
              <ReceiptField label="الإجمالي" value={receiptOrder.amountLabel || "-"} dir="ltr" />
              <ReceiptField label="معرّف اللاعب/الحساب" value={receiptOrder.playerId || "-"} dir="ltr" />
              <ReceiptField label="التاريخ" value={receiptOrder.createdAtLabel || "-"} />
            </div>
            {receiptOrder.submittedFields?.length ? (
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/40">
                <p className="mb-2 text-[10px] font-black text-slate-400">بيانات الطلب</p>
                {receiptOrder.submittedFields.map((field) => (
                  <div key={field.key} className="flex items-start justify-between gap-3 py-1 text-xs">
                    <span className="font-bold text-slate-500 dark:text-slate-400">{field.label}</span>
                    <span dir="ltr" className="break-all text-right font-black text-slate-900 dark:text-white">{field.valueLabel}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}

function ReceiptField({ dir, label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/40">
      <p className="text-[9px] font-black text-slate-400">{label}</p>
      <p dir={dir} className="mt-1 break-words text-xs font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function ManualDepositsPanel({ actionKey, deposits, onApprove, onReject }) {
  const [receiptDeposit, setReceiptDeposit] = useState(null);

  return (
    <>
      <DashboardPanel className="admin-orders-panel">
        <PanelHeading
          icon={WalletCards}
          title="طلبات إضافة الرصيد اليدوي"
          action={
            <Link to="/admin/tools/balance-requests" className="admin-orders-count transition hover:text-violet-600 dark:hover:text-violet-300">
              عرض الكل
            </Link>
          }
        />
        {deposits.length ? (
          <div className="admin-orders-list mt-3">
            {deposits.map((deposit) => {
              const pending = deposit.status === "PENDING";
              const busy = actionKey.endsWith(`deposit:${deposit.id}`);
              const approving = actionKey === `approve-deposit:${deposit.id}`;
              const rejecting = actionKey === `reject-deposit:${deposit.id}`;

              return (
                <article key={deposit.id} className="admin-order-card">
                  <div className="admin-order-orb">
                    <WalletCards className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p dir="ltr" className="truncate text-right text-xs font-black text-slate-400 dark:text-slate-500">{deposit.id}</p>
                        <h3 className="mt-0.5 truncate text-sm font-black text-slate-950 dark:text-white">
                          {deposit.user?.name || deposit.user?.email || "عميل"}
                        </h3>
                      </div>
                      <p dir="ltr" className="shrink-0 text-sm font-black text-slate-950 dark:text-white">{deposit.amountLabel}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="admin-order-product">{deposit.paymentMethodId || "شحن يدوي"}</span>
                      <DepositStatusBadge status={deposit.status} label={deposit.statusLabel} />
                      <span className="text-[11px] font-black text-slate-400 dark:text-slate-500">
                        {deposit.createdAt ? compactDateFormatter.format(new Date(deposit.createdAt)) : deposit.createdAtLabel}
                      </span>
                    </div>
                  </div>
                  <div className="admin-order-actions">
                    {deposit.receiptUrl ? (
                      <button
                        type="button"
                        onClick={() => setReceiptDeposit(deposit)}
                        className="admin-action-icon-button grid shrink-0 place-items-center border border-sky-500/25 bg-sky-500/10 text-sky-700 transition hover:bg-sky-500/15 dark:text-sky-300"
                        aria-label="عرض إيصال إضافة الرصيد"
                        title="عرض الإيصال"
                      >
                        <ReceiptText className="admin-action-icon" />
                      </button>
                    ) : null}
                    {pending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onApprove(deposit)}
                          disabled={busy}
                          className="admin-action-icon-button grid shrink-0 place-items-center border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 transition hover:bg-emerald-500/15 disabled:opacity-50 dark:text-emerald-300"
                          aria-label="قبول طلب إضافة الرصيد"
                          title="قبول الطلب"
                        >
                          <PackageCheck className={`admin-action-icon ${approving ? "animate-pulse" : ""}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onReject(deposit)}
                          disabled={busy}
                          className="admin-action-icon-button grid shrink-0 place-items-center border border-rose-500/25 bg-rose-500/10 text-rose-700 transition hover:bg-rose-500/15 disabled:opacity-50 dark:text-rose-300"
                          aria-label="رفض طلب إضافة الرصيد"
                          title="رفض الطلب"
                        >
                          <XCircle className={`admin-action-icon ${rejecting ? "animate-pulse" : ""}`} />
                        </button>
                      </>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyStateInline text="لا توجد طلبات إضافة رصيد يدوي حتى الآن." />
        )}
      </DashboardPanel>

      {receiptDeposit ? (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => event.target === event.currentTarget && setReceiptDeposit(null)}
        >
          <section className="w-full max-w-[860px] overflow-hidden rounded-[24px] bg-white p-3 shadow-2xl dark:bg-[#111827]">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <h3 className="text-sm font-black text-slate-950 dark:text-white">إيصال طلب إضافة الرصيد</h3>
              <button
                type="button"
                onClick={() => setReceiptDeposit(null)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 dark:bg-white/10 dark:text-white"
                aria-label="إغلاق الإيصال"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <img src={receiptDeposit.receiptUrl} alt="إيصال طلب إضافة الرصيد" className="max-h-[78vh] w-full rounded-2xl object-contain" />
          </section>
        </div>
      ) : null}
    </>
  );
}

function DepositStatusBadge({ status, label }) {
  return (
    <span className={`admin-status-badge inline-flex items-center gap-1 rounded-md border font-black ${depositStatusStyles[status] || depositStatusStyles.PENDING}`}>
      <span className="admin-status-dot rounded-full bg-current" />
      {depositStatusLabels[status] || label || status}
    </span>
  );
}

function OrderStatusBadge({ status, label }) {
  return (
    <span className={`admin-status-badge inline-flex items-center gap-1 rounded-md border font-black ${orderStatusStyles[status] || orderStatusStyles.pending}`}>
      <span className="admin-status-dot rounded-full bg-current" />
      {orderStatusLabels[status] || label || status}
    </span>
  );
}

function OperationalAlertsPanel({ alerts }) {
  const toneClasses = {
    danger: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
    success: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  };

  return (
    <DashboardPanel>
      <PanelHeading icon={AlertTriangle} title="مؤشرات التشغيل" />
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

function PartialFailuresPanel({ failures }) {
  return (
    <DashboardPanel>
      <PanelHeading icon={AlertTriangle} title="تفاصيل التحميل الجزئي" />
      <div className="admin-compact-list">
        {failures.map((failure) => (
          <article key={failure.label} className="admin-alert-row">
            <span className="admin-alert-icon grid shrink-0 place-items-center bg-amber-500/12 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-slate-950 dark:text-white">{failure.label}</p>
              <p className="mt-0.5 truncate text-xs font-bold text-slate-500 dark:text-slate-400">{failure.message}</p>
            </div>
          </article>
        ))}
      </div>
    </DashboardPanel>
  );
}
