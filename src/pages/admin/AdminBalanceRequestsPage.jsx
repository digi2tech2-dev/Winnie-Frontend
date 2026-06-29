import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  Filter,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldX,
  WalletCards,
  X,
} from "lucide-react";
import { approveDeposit, getAdminDeposits, rejectDeposit } from "../../api/adminDeposits";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastProvider";
import { SkeletonBlock } from "../../components/Skeletons";
import EmptyState from "../../components/EmptyState";

const statusMeta = {
  PENDING: ["Pending", "bg-orange-500/10 text-orange-700 dark:text-orange-300"],
  APPROVED: ["Approved", "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"],
  REJECTED: ["Rejected", "bg-rose-500/10 text-rose-700 dark:text-rose-300"],
};

function getErrorMessage(error, fallback) {
  return error?.userMessage || error?.message || fallback;
}

function countByStatus(items, status) {
  return items.filter((item) => item.status === status).length;
}

export default function AdminBalanceRequestsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [applied, setApplied] = useState({ query: "", status: "all" });
  const [selected, setSelected] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [actionKey, setActionKey] = useState("");

  const loadRequests = useCallback(async () => {
    if (!token) {
      setRequests([]);
      setError("Admin session is required.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await getAdminDeposits(token, {
        page: 1,
        limit: 20,
        search: applied.query,
        status: applied.status === "all" ? undefined : applied.status,
      });
      setRequests(result.deposits);
      setPagination(result.pagination);
      setSummary(result.summary);
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Unable to load deposit requests.");
      setError(message);
      showToast({ type: "error", title: "Deposits not loaded", message });
    } finally {
      setLoading(false);
    }
  }, [applied, showToast, token]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const counts = useMemo(() => ({
    total: summary?.totalDeposits ?? pagination.total ?? requests.length,
    pending: summary?.pendingCount ?? countByStatus(requests, "PENDING"),
    approved: summary?.approvedCount ?? countByStatus(requests, "APPROVED"),
    rejected: countByStatus(requests, "REJECTED"),
  }), [pagination.total, requests, summary]);

  const requestReview = (request, action, adminNotes) => {
    setConfirmation({
      action,
      adminNotes,
      id: request.id,
      title: action === "approve" ? "Approve deposit request" : "Reject deposit request",
      message: `${action === "approve" ? "Approve" : "Reject"} ${request.amountLabel} for ${request.user?.name || "this user"}? Wallet credit is performed only by the backend.`,
      confirmLabel: action === "approve" ? "Approve deposit" : "Reject deposit",
      tone: action === "approve" ? "success" : "danger",
    });
  };

  const executeReview = async () => {
    if (!confirmation || !token) return;
    const key = `${confirmation.action}:${confirmation.id}`;
    setActionKey(key);

    try {
      const result = confirmation.action === "approve"
        ? await approveDeposit(token, confirmation.id, { adminNotes: confirmation.adminNotes })
        : await rejectDeposit(token, confirmation.id, { adminNotes: confirmation.adminNotes });

      showToast({
        type: confirmation.action === "approve" ? "success" : "warning",
        title: result.message || (confirmation.action === "approve" ? "Deposit approved" : "Deposit rejected"),
      });
      setConfirmation(null);
      setSelected(null);
      await loadRequests();
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Deposit review failed.");
      showToast({ type: "error", title: "Action failed", message });
    } finally {
      setActionKey("");
    }
  };

  return (
    <div dir="rtl" className="space-y-4">
      <Header onRefresh={loadRequests} refreshing={loading} />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat icon={ReceiptText} label="Total requests" value={counts.total} tone="violet" />
        <Stat icon={Clock3} label="Pending review" value={counts.pending} tone="sky" />
        <Stat icon={CheckCircle2} label="Approved" value={counts.approved} tone="emerald" />
        <Stat icon={ShieldX} label="Rejected loaded" value={counts.rejected} tone="rose" />
      </div>

      <section className="overflow-hidden rounded-[23px] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#111827]">
        <button onClick={() => setFiltersOpen((open) => !open)} className="flex h-14 w-full items-center gap-2 px-4 text-right">
          <Filter className="h-4 w-4 text-violet-500" />
          <b className="flex-1 text-xs dark:text-white">Filters</b>
          <ChevronDown className={`h-4 w-4 transition ${filtersOpen ? "rotate-180" : ""}`} />
        </button>
        <div className={`grid transition-[grid-template-rows] ${filtersOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setApplied({ query: query.trim(), status });
            }}
            className="overflow-hidden"
          >
            <div className="grid gap-2.5 border-t p-4 sm:grid-cols-[1fr_180px_auto] dark:border-white/10">
              <label className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by user name or email"
                  className="h-11 w-full rounded-2xl bg-slate-50 pe-9 ps-3 text-[10px] font-black dark:bg-[#0B1220] dark:text-white"
                />
              </label>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-2xl bg-slate-50 px-3 text-[10px] font-black dark:bg-[#0B1220] dark:text-white">
                <option value="all">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <button className="h-11 rounded-2xl bg-violet-600 px-5 text-[10px] font-black text-white">Filter</button>
            </div>
          </form>
        </div>
      </section>

      {error && (
        <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={index} className="h-64 rounded-[23px]" />)}
        </div>
      ) : requests.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {requests.map((request) => <RequestCard key={request.id} request={request} onDetails={() => setSelected(request)} />)}
        </div>
      ) : (
        <EmptyState icon={ReceiptText} title="No deposit requests found" description="Backend results will appear here when customers submit manual deposit requests." />
      )}

      <RequestDetails
        actionKey={actionKey}
        request={selected}
        onClose={() => setSelected(null)}
        onReview={requestReview}
      />

      {confirmation && (
        <ConfirmDialog
          busy={actionKey === `${confirmation.action}:${confirmation.id}`}
          confirmation={confirmation}
          onCancel={() => setConfirmation(null)}
          onConfirm={executeReview}
        />
      )}
    </div>
  );
}

function Header({ onRefresh, refreshing }) {
  return (
    <section className="flex items-center gap-3 rounded-[26px] border border-violet-200 bg-gradient-to-l from-white to-violet-50 p-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827,#17152A)]">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white"><WalletCards className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-black dark:text-white">Manual deposit review</h1>
        <p className="text-[9px] font-bold text-slate-400">Approve or reject backend deposit requests without local wallet mutation</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex h-10 items-center gap-2 rounded-2xl bg-violet-600 px-4 text-[10px] font-black text-white disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </section>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  const style = {
    emerald: "bg-emerald-500/10 text-emerald-600",
    rose: "bg-rose-500/10 text-rose-600",
    sky: "bg-sky-500/10 text-sky-600",
    violet: "bg-violet-500/10 text-violet-600",
  }[tone];
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
      <Icon className={`h-8 w-8 rounded-xl p-2 ${style}`} />
      <b className="mt-2 block text-2xl dark:text-white">{Number(value || 0).toLocaleString("ar-EG")}</b>
      <p className="text-[8px] font-black text-slate-400">{label}</p>
    </article>
  );
}

function Badge({ status }) {
  const meta = statusMeta[status] || statusMeta.PENDING;
  return <span className={`rounded-full px-2 py-1 text-[8px] font-black ${meta[1]}`}>{meta[0]}</span>;
}

function RequestCard({ request, onDetails }) {
  return (
    <article className="rounded-[23px] border border-slate-200 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#111827]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-black dark:text-white">{request.user?.name || "Unknown user"}</h2>
          <p dir="ltr" className="truncate text-right text-[8px] text-slate-400">{request.user?.email || request.user?.id || "-"}</p>
        </div>
        <Badge status={request.status} />
      </div>
      <p dir="ltr" className="mt-3 text-right text-xl font-black text-violet-700 dark:text-violet-300">{request.amountLabel}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Info label="Created" value={request.createdAtLabel} />
        <Info label="Payment method" value={request.paymentMethodId || "-"} />
        <Info label="USD amount" value={request.amountUsdLabel} />
        <Info label="Reviewed" value={request.reviewedAtLabel || "Not reviewed"} />
      </div>
      <button onClick={onDetails} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1 rounded-xl bg-violet-500/10 text-[9px] font-black text-violet-700 dark:text-violet-300">
        <Eye className="h-4 w-4" />
        Details
      </button>
    </article>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-2 dark:bg-[#0B1220]">
      <p className="text-[7px] font-black text-slate-400">{label}</p>
      <p className="mt-1 truncate text-[9px] font-black dark:text-white">{value}</p>
    </div>
  );
}

function RequestDetails({ actionKey, request, onClose, onReview }) {
  const [adminNotes, setAdminNotes] = useState("");
  const [receiptOpen, setReceiptOpen] = useState(false);

  useEffect(() => {
    setAdminNotes(request?.adminNotes || "");
    setReceiptOpen(false);
  }, [request]);

  if (!request) return null;

  const canReview = request.status === "PENDING";
  const busy = Boolean(actionKey);

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4">
      <section className="flex max-h-[92dvh] w-full max-w-[680px] flex-col rounded-t-[28px] bg-white sm:rounded-[28px] dark:bg-[#111827]">
        <header className="flex items-center gap-3 border-b p-4 dark:border-white/10">
          <ReceiptText className="h-5 w-5 text-violet-500" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-black dark:text-white">Deposit {request.id}</h2>
            <p className="truncate text-[8px] text-slate-400">{request.user?.name || "Unknown user"} - {request.user?.email || request.user?.id || "-"}</p>
          </div>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </header>
        <div className="overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2">
            <Info label="Requested amount" value={request.amountLabel} />
            <Info label="USD equivalent" value={request.amountUsdLabel} />
            <Info label="Currency" value={request.currency} />
            <Info label="Status" value={statusMeta[request.status]?.[0] || request.statusLabel} />
            <Info label="Payment method" value={request.paymentMethodId || "-"} />
            <Info label="Created" value={request.createdAtLabel} />
            <Info label="Reviewed at" value={request.reviewedAtLabel || "-"} />
            <Info label="Reviewed by" value={request.reviewedBy?.name || "-"} />
          </div>

          <section className="mt-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
            <h3 className="text-[11px] font-black dark:text-white">Customer notes and receipt</h3>
            <p className="mt-2 rounded-xl bg-slate-50 p-3 text-[9px] font-bold leading-5 text-slate-600 dark:bg-[#0B1220] dark:text-slate-300">
              {request.notes || "No customer notes."}
            </p>
            {request.receiptUrl ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <a
                  href={request.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 text-[10px] font-black text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300"
                >
                  <Eye className="h-4 w-4" />
                  Open receipt
                </a>
                <button
                  type="button"
                  onClick={() => setReceiptOpen(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-[10px] font-black text-slate-700 dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
                >
                  <ReceiptText className="h-4 w-4" />
                  Preview image
                </button>
              </div>
            ) : (
              <p className="mt-2 text-[9px] font-bold text-slate-400">No receipt URL returned by backend.</p>
            )}
          </section>

          <section className="mt-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
            <h3 className="text-[11px] font-black dark:text-white">Admin note</h3>
            <textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              disabled={!canReview || busy}
              placeholder="Optional note for approval or rejection"
              className="mt-2 min-h-24 w-full rounded-2xl bg-slate-50 p-3 text-[10px] font-bold outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-70 dark:bg-[#0B1220] dark:text-white"
            />
          </section>

          {canReview ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => onReview(request, "reject", adminNotes)}
                disabled={busy}
                className="h-11 rounded-xl bg-rose-500/10 text-[10px] font-black text-rose-700 disabled:opacity-60 dark:text-rose-300"
              >
                Reject request
              </button>
              <button
                onClick={() => onReview(request, "approve", adminNotes)}
                disabled={busy}
                className="h-11 rounded-xl bg-emerald-600 text-[10px] font-black text-white disabled:opacity-60"
              >
                Approve in backend
              </button>
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[9px] font-bold text-slate-500 dark:bg-[#0B1220] dark:text-slate-300">
              This request is already reviewed. Wallet state is shown only from backend data.
            </p>
          )}
        </div>
      </section>

      {receiptOpen && (
        <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/80 p-4" onClick={() => setReceiptOpen(false)}>
          <div className="max-h-[85vh] max-w-[720px] overflow-hidden rounded-[24px] bg-white p-2">
            <img src={request.receiptUrl} alt="Deposit receipt" className="max-h-[80vh] w-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmDialog({ busy, confirmation, onCancel, onConfirm }) {
  const danger = confirmation.tone === "danger";
  return (
    <div className="fixed inset-0 z-[160] grid place-items-center bg-slate-950/70 p-4">
      <section className="w-full max-w-[440px] rounded-[26px] bg-white p-5 text-center shadow-2xl dark:bg-[#111827]">
        <span className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl ${danger ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"}`}>
          {danger ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
        </span>
        <h2 className="mt-3 text-sm font-black dark:text-white">{confirmation.title}</h2>
        <p className="mt-2 text-xs font-bold leading-6 text-slate-500 dark:text-slate-300">{confirmation.message}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="h-11 rounded-xl border border-slate-200 text-[10px] font-black dark:border-white/10 dark:text-white">Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl text-[10px] font-black text-white disabled:opacity-60 ${danger ? "bg-rose-600" : "bg-emerald-600"}`}
          >
            {busy && <RefreshCw className="h-4 w-4 animate-spin" />}
            {busy ? "Working..." : confirmation.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
