import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  adminSyncPaymentStatus,
  getAdminPayment,
  getAdminPayments,
} from "../../api/adminPayments";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

const pageSize = 20;

const initialFilters = {
  search: "",
  status: "all",
  gateway: "all",
  credited: "all",
  dateFrom: "",
  dateTo: "",
  userId: "",
};

const statusStyles = {
  INITIATED: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  PENDING: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  REQUIRES_ACTION: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  SUCCEEDED: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  FAILED: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  CANCELED: "bg-slate-500/12 text-slate-600 dark:text-slate-300",
  EXPIRED: "bg-orange-500/12 text-orange-700 dark:text-orange-300",
};

function getErrorMessage(error, fallback) {
  return error?.userMessage || error?.message || fallback;
}

function countBy(payments, predicate) {
  return payments.filter(predicate).length;
}

function shortValue(value, length = 10) {
  const text = String(value || "");
  if (!text) return "-";
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function buildBackendQuery(filters) {
  return {
    dateFrom: filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).toISOString() : undefined,
    dateTo: filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999`).toISOString() : undefined,
    gateway: filters.gateway,
    credited: filters.credited,
    status: filters.status,
    userId: filters.userId,
  };
}

function filterLoadedPayments(payments, filters) {
  const query = filters.search.trim().toLowerCase();
  if (!query) return payments;

  return payments.filter((payment) => [
    payment.id,
    payment.gatewayPaymentId,
    payment.gatewayReference,
    payment.userName,
    payment.userEmail,
    payment.userId,
  ].some((value) => String(value || "").toLowerCase().includes(query)));
}

function countActiveFilters(filters) {
  return [
    filters.search.trim(),
    filters.status !== "all",
    filters.gateway !== "all",
    filters.credited !== "all",
    filters.dateFrom,
    filters.dateTo,
    filters.userId.trim(),
  ].filter(Boolean).length;
}

export default function AdminPaymentsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, pages: 1 });
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [actionKey, setActionKey] = useState("");

  const loadPayments = useCallback(async () => {
    if (!token) {
      setPayments([]);
      setError("Admin session is required.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getAdminPayments(token, {
        ...buildBackendQuery(appliedFilters),
        page,
        limit: pageSize,
      });
      setPayments(result.payments);
      setPagination(result.pagination);
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Unable to load payments.");
      setPayments([]);
      setPagination({ page, limit: pageSize, total: 0, pages: 1 });
      setError(message);
      showToast({ type: "error", title: "Payments not loaded", message });
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, showToast, token]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    if (!selectedPaymentId || !token) return undefined;

    let cancelled = false;
    const fallback = payments.find((payment) => payment.id === selectedPaymentId) || null;
    setSelectedPayment(fallback);
    setDetailsLoading(true);
    setDetailsError("");

    const loadDetails = async () => {
      try {
        const result = await getAdminPayment(token, selectedPaymentId);
        if (!cancelled) setSelectedPayment(result.payment);
      } catch (requestError) {
        if (!cancelled) {
          setDetailsError(getErrorMessage(requestError, "Unable to load payment details."));
        }
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    };

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [payments, selectedPaymentId, token]);

  const visiblePayments = useMemo(
    () => filterLoadedPayments(payments, appliedFilters),
    [appliedFilters, payments],
  );
  const stats = useMemo(() => ({
    failed: countBy(visiblePayments, (payment) => ["FAILED", "CANCELED", "EXPIRED"].includes(payment.status)),
    pending: countBy(visiblePayments, (payment) => ["INITIATED", "PENDING", "REQUIRES_ACTION"].includes(payment.status)),
    succeeded: countBy(visiblePayments, (payment) => payment.status === "SUCCEEDED"),
    total: pagination.total || visiblePayments.length,
  }), [pagination.total, visiblePayments]);
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
    setSelectedPaymentId(null);
    setSelectedPayment(null);
    setDetailsError("");
  }, [actionKey]);

  const syncPayment = async (paymentId) => {
    if (!token || actionKey) return;
    const key = `${paymentId}:sync`;
    setActionKey(key);

    try {
      const result = await adminSyncPaymentStatus(token, paymentId);
      setSelectedPayment(result.payment);
      showToast({
        type: result.payment?.status === "SUCCEEDED" ? "success" : "info",
        title: result.message || "Payment reconciled",
        message: result.providerStatus ? `Provider status: ${result.providerStatus}` : "",
      });
      await loadPayments();

      try {
        const details = await getAdminPayment(token, paymentId);
        setSelectedPayment(details.payment);
      } catch {
        // The sync result is already backend-confirmed.
      }
    } catch (requestError) {
      const message = getErrorMessage(
        requestError,
        "Could not verify payment status yet. Please try again later or contact support.",
      );
      showToast({ type: "error", title: "Reconciliation failed", message });
    } finally {
      setActionKey("");
    }
  };

  return (
    <div dir="rtl" className="space-y-4 sm:space-y-5">
      <Header onRefresh={loadPayments} refreshing={loading} />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat icon={ReceiptText} label="Visible payments" value={stats.total} tone="violet" />
        <Stat icon={Clock3} label="Pending action" value={stats.pending} tone="amber" />
        <Stat icon={CheckCircle2} label="Succeeded" value={stats.succeeded} tone="emerald" />
        <Stat icon={AlertTriangle} label="Failed / canceled" value={stats.failed} tone="rose" />
      </div>

      <Filters
        activeCount={activeFiltersCount}
        filters={draftFilters}
        onApply={applyFilters}
        onChange={updateFilter}
        onReset={resetFilters}
      />

      <section aria-labelledby="payments-list-title">
        <div className="mb-3 flex items-end justify-between gap-3 px-1">
          <div>
            <h2 id="payments-list-title" className="text-base font-black text-slate-950 dark:text-white">Payments list</h2>
            <p className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-[#8A94A7]">
              {visiblePayments.length.toLocaleString("ar-EG")} loaded / {(pagination.total || payments.length).toLocaleString("ar-EG")}
            </p>
          </div>
          <button
            type="button"
            onClick={loadPayments}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-violet-200 bg-white px-3 text-[10px] font-black text-violet-700 transition hover:bg-violet-50 disabled:opacity-60 dark:border-violet-400/20 dark:bg-white/[0.05] dark:text-violet-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <PaymentsLoadingState />
        ) : visiblePayments.length > 0 ? (
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#111827]">
            <div className="hidden grid-cols-[1fr_1.2fr_0.9fr_0.9fr_1fr_1fr_0.8fr_0.8fr] gap-3 border-b border-slate-100 px-4 py-3 text-[10px] font-black uppercase tracking-wide text-slate-400 dark:border-white/10 lg:grid">
              <span>Payment</span>
              <span>User</span>
              <span>Gateway</span>
              <span>Status</span>
              <span>Requested</span>
              <span>Gateway charge</span>
              <span>Credited</span>
              <span>Actions</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/10">
              {visiblePayments.map((payment) => (
                <PaymentRow
                  actionKey={actionKey}
                  key={payment.id}
                  onDetails={setSelectedPaymentId}
                  onSync={syncPayment}
                  payment={payment}
                />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title={error ? "Unable to load payments" : "No payments found"}
            description={error || "No backend payments matched the current filters."}
            actionLabel="Reset filters"
            onAction={resetFilters}
          />
        )}

        {!loading && !error && pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300"
            >
              Previous
            </button>
            <span className="text-xs font-black text-slate-500 dark:text-slate-400">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300"
            >
              Next
            </button>
          </div>
        )}
      </section>

      <PaymentDetailsPanel
        actionKey={actionKey}
        error={detailsError}
        loading={detailsLoading}
        onClose={closeDetails}
        onSync={syncPayment}
        payment={selectedPayment}
      />
    </div>
  );
}

function Header({ onRefresh, refreshing }) {
  return (
    <section className="relative overflow-hidden rounded-[26px] border border-violet-200/70 bg-gradient-to-l from-white via-sky-50/80 to-violet-50/80 p-5 shadow-[0_18px_48px_rgba(124,58,237,0.09)] sm:p-6 dark:border-white/[0.08] dark:bg-[linear-gradient(135deg,#111827,#0D1324_58%,#17152A)] dark:shadow-[0_0_26px_rgba(139,92,246,0.14)]">
      <div className="relative flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] text-white shadow-[0_12px_28px_rgba(124,58,237,0.25)]">
          <ReceiptText className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-slate-950 sm:text-3xl dark:text-white">Admin payments</h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
              <i className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Backend connected
            </span>
          </div>
          <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm dark:text-[#9AA7BD]">
            Online wallet top-up payments and provider reconciliation.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="hidden h-10 items-center gap-2 rounded-2xl border border-violet-200 bg-white px-3 text-[10px] font-black text-violet-700 transition hover:bg-violet-50 disabled:opacity-60 dark:border-violet-400/20 dark:bg-white/[0.05] dark:text-violet-300 sm:inline-flex"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
    </section>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  const tones = {
    amber: "from-amber-500/12 to-orange-500/8 text-amber-700 dark:text-amber-300",
    emerald: "from-emerald-500/12 to-teal-500/8 text-emerald-700 dark:text-emerald-300",
    rose: "from-rose-500/12 to-pink-500/8 text-rose-700 dark:text-rose-300",
    violet: "from-violet-500/12 to-sky-500/8 text-violet-700 dark:text-violet-300",
  };

  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111827]">
      <div className={`mb-3 inline-grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${tones[tone] || tones.violet}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
        {Number(value || 0).toLocaleString("ar-EG-u-nu-latn")}
      </p>
    </article>
  );
}

function Filters({ activeCount, filters, onApply, onChange, onReset }) {
  return (
    <section className="overflow-hidden rounded-[23px] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#111827]">
      <div className="flex min-h-14 items-center gap-2 border-b border-slate-100 px-4 dark:border-white/10">
        <SlidersHorizontal className="h-4 w-4 text-violet-500" />
        <b className="flex-1 text-xs dark:text-white">Filters</b>
        {activeCount > 0 && (
          <span className="rounded-full bg-violet-500/10 px-2 py-1 text-[10px] font-black text-violet-700 dark:text-violet-300">
            {activeCount} active
          </span>
        )}
      </div>
      <form onSubmit={onApply} className="grid gap-2.5 p-4 lg:grid-cols-[1fr_150px_180px_130px_140px_140px_auto]">
        <label className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
          <input
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="Search payment or user"
            className="h-11 w-full rounded-2xl bg-slate-50 pe-9 ps-3 text-[10px] font-black dark:bg-[#0B1220] dark:text-white"
          />
        </label>
        <select value={filters.status} onChange={(event) => onChange("status", event.target.value)} className="h-11 rounded-2xl bg-slate-50 px-3 text-[10px] font-black dark:bg-[#0B1220] dark:text-white">
          <option value="all">All status</option>
          <option value="INITIATED">Initiated</option>
          <option value="PENDING">Pending</option>
          <option value="REQUIRES_ACTION">Requires action</option>
          <option value="SUCCEEDED">Succeeded</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELED">Canceled</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <select value={filters.gateway} onChange={(event) => onChange("gateway", event.target.value)} className="h-11 rounded-2xl bg-slate-50 px-3 text-[10px] font-black dark:bg-[#0B1220] dark:text-white">
          <option value="all">All gateways</option>
          <option value="NETWORK_INTERNATIONAL">Network International</option>
          <option value="MOCK">Mock</option>
          <option value="ZIINA">Ziina</option>
          <option value="TAP">Tap</option>
        </select>
        <select value={filters.credited} onChange={(event) => onChange("credited", event.target.value)} className="h-11 rounded-2xl bg-slate-50 px-3 text-[10px] font-black dark:bg-[#0B1220] dark:text-white">
          <option value="all">All credit</option>
          <option value="true">Credited</option>
          <option value="false">Not credited</option>
        </select>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(event) => onChange("dateFrom", event.target.value)}
          className="h-11 rounded-2xl bg-slate-50 px-3 text-[10px] font-black dark:bg-[#0B1220] dark:text-white"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(event) => onChange("dateTo", event.target.value)}
          className="h-11 rounded-2xl bg-slate-50 px-3 text-[10px] font-black dark:bg-[#0B1220] dark:text-white"
        />
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-none">
          <button type="submit" className="h-11 rounded-2xl bg-violet-600 px-5 text-[10px] font-black text-white">Filter</button>
          <button type="button" onClick={onReset} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-[10px] font-black text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            Reset
          </button>
        </div>
      </form>
    </section>
  );
}

function PaymentRow({ actionKey, onDetails, onSync, payment }) {
  const syncing = actionKey === `${payment.id}:sync`;

  return (
    <article className="grid gap-3 px-4 py-4 lg:grid-cols-[1fr_1.2fr_0.9fr_0.9fr_1fr_1fr_0.8fr_0.8fr] lg:items-center">
      <div className="min-w-0">
        <p className="font-mono text-xs font-black text-slate-950 dark:text-white">{payment.displayId}</p>
        <p className="mt-1 text-[10px] font-bold text-slate-400">{payment.createdAtLabel}</p>
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-black text-slate-800 dark:text-white">{payment.userName}</p>
        <p className="truncate text-[10px] font-bold text-slate-400">{payment.userEmail || shortValue(payment.userId, 12)}</p>
      </div>
      <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600 dark:bg-white/10 dark:text-slate-300">
        {payment.gatewayLabel}
      </span>
      <StatusBadge status={payment.status} label={payment.statusLabel} />
      <div>
        <p className="text-xs font-black text-slate-950 dark:text-white">{payment.requestedAmountLabel}</p>
        <p className="text-[10px] font-bold text-slate-400">Requested</p>
      </div>
      <div>
        <p className="text-xs font-black text-slate-950 dark:text-white">{payment.gatewayAmountLabel}</p>
        <p className="text-[10px] font-bold text-slate-400">{payment.exchangeRateSource || "Gateway"}</p>
      </div>
      <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-black ${payment.credited ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "bg-slate-500/10 text-slate-500 dark:text-slate-300"}`}>
        {payment.credited ? "Credited" : "Not credited"}
      </span>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onDetails(payment.id)}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
        >
          <Eye className="h-3.5 w-3.5" />
          Details
        </button>
        {payment.canSync && (
          <button
            type="button"
            onClick={() => onSync(payment.id)}
            disabled={Boolean(actionKey)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-3 text-[10px] font-black text-white disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            Sync
          </button>
        )}
      </div>
    </article>
  );
}

function StatusBadge({ label, status }) {
  return (
    <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-black ${statusStyles[status] || statusStyles.PENDING}`}>
      {label}
    </span>
  );
}

function PaymentDetailsPanel({ actionKey, error, loading, onClose, onSync, payment }) {
  if (!payment) return null;
  const syncing = actionKey === `${payment.id}:sync`;

  return (
    <div className="fixed inset-0 z-[140] bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true">
      <section className="ms-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0B1220]">
        <header className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-600 text-white">
            <ReceiptText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-black text-slate-950 dark:text-white">{payment.displayId}</h3>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{payment.userName} · {payment.createdAtLabel}</p>
          </div>
          {payment.canSync && (
            <button
              type="button"
              onClick={() => onSync(payment.id)}
              disabled={Boolean(actionKey)}
              className="inline-flex h-10 items-center gap-2 rounded-2xl bg-violet-600 px-3 text-[10px] font-black text-white disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              Reconcile
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(actionKey)}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            aria-label="Close payment details"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => <SkeletonBlock key={index} className="h-24 rounded-2xl" />)}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <DetailCard label="Status" value={payment.statusLabel} helper={payment.status} icon={ShieldCheck} />
            <DetailCard label="Requested" value={payment.requestedAmountLabel} helper={payment.requestedCurrency} icon={ReceiptText} />
            <DetailCard label="Gateway charge" value={payment.gatewayAmountLabel} helper={payment.gatewayCurrency || payment.gatewayLabel} icon={RefreshCw} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-[22px] border border-slate-200 p-4 dark:border-white/10">
              <h4 className="text-sm font-black text-slate-950 dark:text-white">Payment summary</h4>
              <DetailList
                items={[
                  ["Gateway", payment.gatewayLabel],
                  ["Method", payment.method],
                  ["Purpose", payment.purpose],
                  ["Total amount", payment.totalAmountLabel],
                  ["Fee", payment.feeAmountLabel],
                  ["Exchange rate", payment.exchangeRate || "-"],
                  ["Exchange source", payment.exchangeRateSource || "-"],
                  ["Credited", payment.credited ? payment.creditedAtLabel : "Not credited"],
                  ["Wallet transaction", shortValue(payment.walletTransactionId, 18)],
                ]}
              />
            </section>

            <section className="rounded-[22px] border border-slate-200 p-4 dark:border-white/10">
              <h4 className="text-sm font-black text-slate-950 dark:text-white">Customer</h4>
              <DetailList
                items={[
                  ["Name", payment.userName],
                  ["Email", payment.userEmail || "-"],
                  ["Phone", payment.user?.phone || "-"],
                  ["User ID", shortValue(payment.userId, 22)],
                ]}
              />
            </section>
          </div>

          <section className="mt-4 rounded-[22px] border border-slate-200 p-4 dark:border-white/10">
            <h4 className="text-sm font-black text-slate-950 dark:text-white">Gateway references</h4>
            <DetailList
              items={[
                ["Gateway payment ID", shortValue(payment.gatewayPaymentId, 36)],
                ["Gateway reference", shortValue(payment.gatewayReference, 36)],
                ["Created", payment.createdAtLabel],
                ["Updated", payment.updatedAtLabel],
                ["Succeeded", payment.succeededAtLabel],
                ["Failed", payment.failedAtLabel],
                ["Canceled", payment.canceledAtLabel],
              ]}
            />
          </section>

          {payment.risk?.hasRiskSnapshot && (
            <section className="mt-4 rounded-[22px] border border-slate-200 p-4 dark:border-white/10">
              <h4 className="text-sm font-black text-slate-950 dark:text-white">Risk snapshot</h4>
              <DetailList
                items={[
                  ["Base equivalent", payment.risk.amountBaseCurrencyLabel],
                  ["Base currency", payment.risk.baseCurrency || "-"],
                  ["Evaluated", payment.risk.evaluatedAtLabel],
                ]}
              />
            </section>
          )}

          <section className="mt-4 rounded-[22px] border border-slate-200 p-4 dark:border-white/10">
            <h4 className="text-sm font-black text-slate-950 dark:text-white">Webhook events</h4>
            {payment.webhookEvents.length > 0 ? (
              <div className="mt-3 space-y-2">
                {payment.webhookEvents.map((event) => (
                  <div key={event.id || event.dedupeKey} className="rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.04]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-violet-500/10 px-2 py-1 text-[10px] font-black text-violet-700 dark:text-violet-300">{event.processingStatusLabel}</span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{event.providerStatusLabel}</span>
                      <span className="text-[10px] font-bold text-slate-400">{event.receivedAtLabel}</span>
                    </div>
                    {event.errorMessage && (
                      <p className="mt-2 text-[10px] font-bold text-rose-600 dark:text-rose-300">{event.errorCode}: {event.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
                No webhook events recorded for this payment.
              </p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function DetailCard({ helper, icon: Icon, label, value }) {
  return (
    <article className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <Icon className="h-4 w-4 text-violet-500" />
      <p className="mt-3 text-[10px] font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-base font-black text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">{helper}</p>
    </article>
  );
}

function DetailList({ items }) {
  return (
    <dl className="mt-3 space-y-2">
      {items.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 dark:bg-white/[0.04]">
          <dt className="text-[10px] font-black uppercase text-slate-400">{label}</dt>
          <dd className="min-w-0 break-words text-left text-xs font-black text-slate-700 dark:text-slate-200">{value || "-"}</dd>
        </div>
      ))}
    </dl>
  );
}

function PaymentsLoadingState() {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]" aria-label="Loading admin payments" aria-busy="true">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="grid gap-3 border-b border-slate-100 py-4 last:border-b-0 dark:border-white/10 lg:grid-cols-[1fr_1.2fr_0.9fr_0.9fr_1fr_1fr_0.8fr_0.8fr]">
          {Array.from({ length: 8 }).map((__, itemIndex) => <SkeletonBlock key={itemIndex} className="h-8 rounded-xl" />)}
        </div>
      ))}
    </div>
  );
}
