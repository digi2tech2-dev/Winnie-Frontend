import {
  Activity,
  AlertTriangle,
  Boxes,
  Clock3,
  ExternalLink,
  PackageCheck,
  PackageOpen,
  RefreshCw,
  Server,
  Truck,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboardData } from "../../api/adminDashboard";
import { normalizeApiError } from "../../api/errors";
import {
  DashboardPanel,
  EmptyStateInline,
  MetricCard,
  PanelHeading,
} from "../../components/admin/dashboard/DashboardPieces";
import { useToast } from "../../components/ToastProvider";
import {
  compactDateFormatter,
  numberFormatter,
} from "../../data/adminDashboard";
import { useAuth } from "../../context/AuthContext";

const metricTones = {
  completed: "bg-teal-500/12 text-teal-700 dark:text-teal-300",
  failed: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  orders: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  pending: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  products: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300",
  providers: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  requests: "bg-fuchsia-500/12 text-fuchsia-700 dark:text-fuchsia-300",
  users: "bg-cyan-500/12 text-cyan-700 dark:text-cyan-300",
};

const orderStatusStyles = {
  canceled: "border-slate-500/25 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  completed: "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  failed: "border-rose-500/25 bg-rose-500/12 text-rose-700 dark:text-rose-300",
  manual_review: "border-sky-500/25 bg-sky-500/12 text-sky-700 dark:text-sky-300",
  partial: "border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-300",
  pending: "border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-300",
  processing: "border-sky-500/25 bg-sky-500/12 text-sky-700 dark:text-sky-300",
};

const orderStatusLabels = {
  canceled: "Canceled",
  completed: "Completed",
  failed: "Failed",
  manual_review: "Manual review",
  partial: "Partial",
  pending: "Pending",
  processing: "Processing",
};

function formatCount(value) {
  if (value === null || value === undefined) return "Not available";
  return numberFormatter.format(value);
}

function chunkItems(items, size) {
  return items.reduce((groups, item, index) => {
    if (index % size === 0) groups.push([]);
    groups[groups.length - 1].push(item);
    return groups;
  }, []);
}

function buildMetrics(values = {}) {
  return [
    {
      icon: PackageOpen,
      id: "total-orders",
      label: "Total Orders",
      rawValue: values.totalOrders,
      tone: metricTones.orders,
    },
    {
      icon: Clock3,
      id: "pending-orders",
      inverse: true,
      label: "Pending / Processing Orders",
      rawValue: values.pendingOrders,
      tone: metricTones.pending,
    },
    {
      icon: PackageCheck,
      id: "completed-orders",
      label: "Completed Orders",
      rawValue: values.completedOrders,
      tone: metricTones.completed,
    },
    {
      icon: XCircle,
      id: "failed-orders",
      inverse: true,
      label: "Failed Orders",
      rawValue: values.failedOrders,
      tone: metricTones.failed,
    },
    {
      icon: Users,
      id: "total-users",
      label: "Total Users",
      rawValue: values.totalUsers,
      tone: metricTones.users,
    },
    {
      icon: AlertTriangle,
      id: "pending-users",
      inverse: true,
      label: "Pending Users",
      rawValue: values.pendingUsers,
      tone: metricTones.pending,
    },
    {
      icon: Boxes,
      id: "total-products",
      label: "Total Products",
      rawValue: values.totalProducts,
      tone: metricTones.products,
    },
    {
      icon: Truck,
      id: "pending-deposits",
      inverse: true,
      label: "Pending Deposits",
      rawValue: values.pendingDeposits,
      tone: metricTones.pending,
    },
    {
      icon: Activity,
      id: "pending-requests",
      inverse: true,
      label: "Pending Group/Sub-Agent Requests",
      rawValue: values.pendingGroupRequests,
      tone: metricTones.requests,
    },
    {
      icon: Server,
      id: "providers",
      label: "Providers",
      rawValue: values.providersCount,
      tone: metricTones.providers,
    },
  ].map((metric) => ({
    ...metric,
    change: null,
    unavailable: metric.rawValue === null || metric.rawValue === undefined,
    value: formatCount(metric.rawValue),
  }));
}

function formatRefreshTime(value) {
  if (!value) return "Not refreshed yet";
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getOperationalAlerts(metrics = {}, failures = []) {
  const items = [
    metrics.pendingOrders > 0
      ? { id: "orders", title: "Orders need attention", value: `${formatCount(metrics.pendingOrders)} pending/processing`, tone: "warning" }
      : null,
    metrics.pendingDeposits > 0
      ? { id: "deposits", title: "Manual deposits pending", value: `${formatCount(metrics.pendingDeposits)} requests`, tone: "danger" }
      : null,
    metrics.pendingUsers > 0
      ? { id: "users", title: "Users awaiting approval", value: `${formatCount(metrics.pendingUsers)} users`, tone: "warning" }
      : null,
    metrics.pendingGroupRequests > 0
      ? { id: "group-requests", title: "Group/sub-agent requests pending", value: `${formatCount(metrics.pendingGroupRequests)} requests`, tone: "warning" }
      : null,
    failures.length
      ? { id: "partial", title: "Partial dashboard data", value: `${numberFormatter.format(failures.length)} request(s) failed`, tone: "warning" }
      : null,
  ].filter(Boolean);

  if (items.length) return items;
  return [{ id: "clear", title: "No pending operational counters returned", value: "Current backend counters are clear.", tone: "success" }];
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async ({ notify = false } = {}) => {
    if (!token) {
      setDashboard(null);
      setError("Admin session is not available.");
      setLoading(false);
      return;
    }

    setError("");
    setRefreshing(true);

    try {
      const result = await getAdminDashboardData(token);
      setDashboard(result);

      if (result.failures.length) {
        setError("Some dashboard data could not be loaded. Available metrics are still shown.");
      }

      if (notify) {
        showToast({
          title: result.failures.length ? "Dashboard partially refreshed" : "Dashboard refreshed",
          message: result.failures.length ? "Some backend counters failed to load." : "Latest backend data is now shown.",
          type: result.failures.length ? "warning" : "success",
        });
      }
    } catch (loadError) {
      const normalized = normalizeApiError(loadError, "Unable to load dashboard data.");
      setError(normalized.userMessage || normalized.message);
      if (notify) {
        showToast({
          title: "Dashboard refresh failed",
          message: normalized.userMessage || normalized.message,
          type: "error",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const metrics = useMemo(() => buildMetrics(dashboard?.metrics || {}), [dashboard]);
  const metricColumns = useMemo(() => chunkItems(metrics, 2), [metrics]);
  const alerts = useMemo(
    () => getOperationalAlerts(dashboard?.metrics || {}, dashboard?.failures || []),
    [dashboard],
  );

  return (
    <div dir="rtl" className="admin-dashboard space-y-3">
      <section className="admin-dashboard-top">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Admin Command Center</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">لوحة الإدارة</h1>
          <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
            آخر تحديث {formatRefreshTime(dashboard?.refreshedAt)}
          </p>
        </div>
        <div className="admin-top-actions">
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

      {loading ? (
        <DashboardPanel>
          <PanelHeading icon={RefreshCw} title="Loading backend dashboard data" />
          <EmptyStateInline text="Fetching live admin counters..." />
        </DashboardPanel>
      ) : (
        <>
          <section className="admin-overview-grid">
            <div className="admin-metrics-columns">
              {metricColumns.map((column, columnIndex) => (
                <div key={`metric-column-${columnIndex}`} className="admin-metric-column">
                  {column.map((metric) => (
                    <MetricCard key={metric.id} metric={metric} rangeKey={dashboard?.refreshedAt || "live"} />
                  ))}
                </div>
              ))}
            </div>

            <RecentOrdersPanel orders={dashboard?.recentOrders || []} />
          </section>

          <section className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
            <OperationalAlertsPanel alerts={alerts} />
            <UnavailableMetricsPanel />
          </section>

          {dashboard?.failures?.length ? <PartialFailuresPanel failures={dashboard.failures} /> : null}
        </>
      )}
    </div>
  );
}

function RecentOrdersPanel({ orders }) {
  return (
    <DashboardPanel className="admin-orders-panel">
      <PanelHeading
        icon={PackageOpen}
        title="Recent Orders"
        action={<span className="admin-orders-count">{numberFormatter.format(orders.length)} latest</span>}
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
                    <p dir="ltr" className="truncate text-right text-xs font-black text-slate-400 dark:text-slate-500">{order.displayId || order.id}</p>
                    <h3 className="mt-0.5 truncate text-sm font-black text-slate-950 dark:text-white">{order.username || order.userEmail || "Customer"}</h3>
                  </div>
                  <p dir="ltr" className="shrink-0 text-sm font-black text-slate-950 dark:text-white">{order.amountLabel}</p>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="admin-order-product">{order.product}</span>
                  <OrderStatusBadge status={order.status} label={order.statusLabel} />
                  <span className="text-[11px] font-black text-slate-400 dark:text-slate-500">
                    {order.createdAt ? compactDateFormatter.format(new Date(order.createdAt)) : order.createdAtLabel}
                  </span>
                </div>
              </div>

              <div className="admin-order-actions">
                <Link
                  to="/admin/tools/orders"
                  className="admin-action-icon-button grid shrink-0 place-items-center border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  aria-label="Open orders page"
                  title="Open orders page"
                >
                  <ExternalLink className="admin-action-icon" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyStateInline text="No backend orders returned yet." />
      )}
    </DashboardPanel>
  );
}

function OrderStatusBadge({ status, label }) {
  return (
    <span className={`admin-status-badge inline-flex items-center gap-1 rounded-md border font-black ${orderStatusStyles[status] || orderStatusStyles.manual_review}`}>
      <span className="admin-status-dot rounded-full bg-current" />
      {label || orderStatusLabels[status] || status}
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
      <PanelHeading icon={AlertTriangle} title="Operational Counters" />
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

function UnavailableMetricsPanel() {
  return (
    <DashboardPanel>
      <PanelHeading icon={Activity} title="Unavailable Metrics" />
      <div className="space-y-2 text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">
        <p>Revenue, profit, wallet totals, provider balances, charts, and activity feed are not shown here.</p>
        <p>They need dedicated reliable backend analytics before this dashboard can display them.</p>
      </div>
    </DashboardPanel>
  );
}

function PartialFailuresPanel({ failures }) {
  return (
    <DashboardPanel>
      <PanelHeading icon={AlertTriangle} title="Partial Load Details" />
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
