import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Filter,
  HandCoins,
  RefreshCw,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  XCircle,
} from "lucide-react";
import {
  approveGroupRequest,
  getAdminGroupRequests,
  getDefaultApprovedGroupId,
  rejectGroupRequest,
} from "../../api/adminGroupRequests";
import { GROUP_REQUEST_STATUS, GROUP_REQUEST_TYPES } from "../../api/groupRequests";
import { useAuth } from "../../context/AuthContext";
import { agentEarningsSeed } from "../../data/adminExtended";
import { useToast } from "../../components/ToastProvider";
import { SkeletonBlock } from "../../components/Skeletons";
import EmptyState from "../../components/EmptyState";

const requestTypeOptions = [
  { value: "all", label: "All request types" },
  { value: GROUP_REQUEST_TYPES.SUB_AGENT, label: "Sub-agent" },
  { value: GROUP_REQUEST_TYPES.GROUP_CHANGE, label: "Group change" },
];

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: GROUP_REQUEST_STATUS.PENDING, label: "Pending" },
  { value: GROUP_REQUEST_STATUS.APPROVED, label: "Approved" },
  { value: GROUP_REQUEST_STATUS.REJECTED, label: "Rejected" },
  { value: GROUP_REQUEST_STATUS.CANCELED, label: "Canceled" },
];

const statusMeta = {
  APPROVED: ["Approved", "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"],
  CANCELED: ["Canceled", "bg-slate-500/10 text-slate-600 dark:text-slate-300"],
  PENDING: ["Pending", "bg-orange-500/10 text-orange-700 dark:text-orange-300"],
  REJECTED: ["Rejected", "bg-rose-500/10 text-rose-700 dark:text-rose-300"],
};

function getErrorMessage(error, fallback) {
  return error?.userMessage || error?.message || fallback;
}

function countBy(items, predicate) {
  return items.filter(predicate).length;
}

export default function AdminSubAgentsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestType, setRequestType] = useState("all");
  const [status, setStatus] = useState(GROUP_REQUEST_STATUS.PENDING);
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
      const result = await getAdminGroupRequests(token, {
        page: 1,
        limit: 20,
        requestType: requestType === "all" ? undefined : requestType,
        status: status === "all" ? undefined : status,
      });
      setRequests(result.requests);
      setPagination(result.pagination);
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Unable to load group requests.");
      setError(message);
      showToast({ type: "error", title: "Requests not loaded", message });
    } finally {
      setLoading(false);
    }
  }, [requestType, showToast, status, token]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const stats = useMemo(() => ({
    total: pagination.total || requests.length,
    pending: countBy(requests, (request) => request.status === GROUP_REQUEST_STATUS.PENDING),
    subAgent: countBy(requests, (request) => request.requestType === GROUP_REQUEST_TYPES.SUB_AGENT),
    groupChange: countBy(requests, (request) => request.requestType === GROUP_REQUEST_TYPES.GROUP_CHANGE),
  }), [pagination.total, requests]);

  const requestReview = (request, action, adminNote) => {
    const approvedGroupId = action === "approve" ? getDefaultApprovedGroupId(request) : null;
    const isGroupChange = request.requestType === GROUP_REQUEST_TYPES.GROUP_CHANGE;
    const isSubAgent = request.requestType === GROUP_REQUEST_TYPES.SUB_AGENT;

    setConfirmation({
      action,
      adminNote,
      approvedGroupId,
      id: request.id,
      title: action === "approve" ? "Approve request" : "Reject request",
      message: isGroupChange && action === "approve"
        ? `Approve group change for ${request.user?.name || "this user"} using the requested group by default?`
        : isSubAgent && action === "approve"
          ? `Approve sub-agent business status for ${request.user?.name || "this user"}? This does not grant supervisor permissions.`
          : `Reject ${request.requestTypeLabel} request for ${request.user?.name || "this user"}?`,
      confirmLabel: action === "approve" ? "Approve request" : "Reject request",
      tone: action === "approve" ? "success" : "danger",
    });
  };

  const executeReview = async () => {
    if (!confirmation || !token) return;
    const key = `${confirmation.action}:${confirmation.id}`;
    setActionKey(key);

    try {
      const result = confirmation.action === "approve"
        ? await approveGroupRequest(token, confirmation.id, {
          adminNote: confirmation.adminNote,
          approvedGroupId: confirmation.approvedGroupId,
        })
        : await rejectGroupRequest(token, confirmation.id, {
          adminNote: confirmation.adminNote,
        });

      showToast({
        type: confirmation.action === "approve" ? "success" : "warning",
        title: result.message || (confirmation.action === "approve" ? "Request approved" : "Request rejected"),
      });
      setConfirmation(null);
      setSelected(null);
      await loadRequests();
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Request review failed.");
      showToast({ type: "error", title: "Action failed", message });
    } finally {
      setActionKey("");
    }
  };

  return (
    <div dir="rtl" className="space-y-4">
      <Header onRefresh={loadRequests} refreshing={loading} />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat icon={UsersRound} label="Backend results" value={stats.total} />
        <Stat icon={Clock3} label="Pending loaded" value={stats.pending} />
        <Stat icon={UserRoundCheck} label="Sub-agent" value={stats.subAgent} />
        <Stat icon={ShieldCheck} label="Group change" value={stats.groupChange} />
      </div>

      <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1 dark:bg-white/[0.06]">
        <button onClick={() => setTab("requests")} className={`h-10 rounded-xl text-[10px] font-black ${tab === "requests" ? "bg-white text-violet-700 shadow-sm dark:bg-[#111827] dark:text-violet-300" : "text-slate-500"}`}>Review requests</button>
        <button onClick={() => setTab("earnings")} className={`h-10 rounded-xl text-[10px] font-black ${tab === "earnings" ? "bg-white text-violet-700 shadow-sm dark:bg-[#111827] dark:text-violet-300" : "text-slate-500"}`}>Referral earnings</button>
      </div>

      {tab === "requests" ? (
        <>
          <section className="rounded-[23px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
            <div className="mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4 text-violet-500" />
              <h2 className="text-xs font-black dark:text-white">Filters</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <select value={requestType} onChange={(event) => setRequestType(event.target.value)} className="h-11 rounded-2xl bg-slate-50 px-3 text-[10px] font-black dark:bg-[#0B1220] dark:text-white">
                {requestTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-2xl bg-slate-50 px-3 text-[10px] font-black dark:bg-[#0B1220] dark:text-white">
                {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <button onClick={loadRequests} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-[10px] font-black text-white">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Apply
              </button>
            </div>
          </section>

          {error && (
            <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={index} className="h-56 rounded-[22px]" />)}
            </div>
          ) : requests.length ? (
            <Requests requests={requests} onDetails={setSelected} />
          ) : (
            <EmptyState icon={HandCoins} title="No requests found" description="Backend group-change and sub-agent requests will appear here." />
          )}
        </>
      ) : (
        <Earnings />
      )}

      <ReviewModal
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
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white"><HandCoins className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-black dark:text-white">Group and sub-agent requests</h1>
        <p className="text-[9px] font-bold text-slate-400">Operational review for customer group-change and sub-agent workflows</p>
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

function Stat({ icon: Icon, label, value }) {
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#111827]">
      <Icon className="h-8 w-8 rounded-xl bg-violet-500/10 p-2 text-violet-600" />
      <b className="mt-2 block text-right text-xl dark:text-white">{Number(value || 0).toLocaleString("ar-EG")}</b>
      <p className="text-[8px] font-black text-slate-400">{label}</p>
    </article>
  );
}

function Requests({ requests, onDetails }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {requests.map((request) => (
        <article key={request.id} className="rounded-[23px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-500/10 font-black text-sky-600">{(request.user?.name || "U").slice(0, 1)}</span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-black dark:text-white">{request.user?.name || "Unknown user"}</h2>
              <p dir="ltr" className="truncate text-right text-[8px] text-slate-400">{request.user?.email || request.user?.id || "-"}</p>
            </div>
            <RequestBadge status={request.status} />
          </div>
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[9px] font-bold leading-5 text-slate-600 dark:bg-[#0B1220] dark:text-slate-300">{request.reason || "No reason provided."}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[8px] font-black text-slate-500">
            <p>Type: {request.requestTypeLabel}</p>
            <p>Current: {request.currentGroup?.name || "-"}</p>
            <p>Requested: {request.requestedGroup?.name || "-"}</p>
            <p>Approved: {request.approvedGroup?.name || "-"}</p>
            <p className="col-span-2">Created: {request.createdAtLabel}</p>
          </div>
          <button onClick={() => onDetails(request)} className="mt-3 h-10 w-full rounded-xl bg-violet-600 text-[9px] font-black text-white">Review details</button>
        </article>
      ))}
    </div>
  );
}

function RequestBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.PENDING;
  return <span className={`rounded-full px-2 py-1 text-[8px] font-black ${meta[1]}`}>{meta[0]}</span>;
}

function ReviewModal({ actionKey, request, onClose, onReview }) {
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    setAdminNote(request?.adminNote || "");
  }, [request]);

  if (!request) return null;

  const canReview = request.status === GROUP_REQUEST_STATUS.PENDING;
  const busy = Boolean(actionKey);
  const isGroupChange = request.requestType === GROUP_REQUEST_TYPES.GROUP_CHANGE;
  const isSubAgent = request.requestType === GROUP_REQUEST_TYPES.SUB_AGENT;

  return (
    <div className="fixed inset-0 z-[140] grid place-items-center bg-slate-950/65 p-4">
      <section className="flex max-h-[92dvh] w-full max-w-[680px] flex-col rounded-[26px] bg-white dark:bg-[#111827]">
        <header className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-black dark:text-white">{request.requestTypeLabel} request</h2>
            <p className="truncate text-[8px] text-slate-400">{request.user?.name || "Unknown user"} - {request.user?.email || request.user?.id || "-"}</p>
          </div>
          <button onClick={onClose}><XCircle className="h-4 w-4" /></button>
        </header>

        <div className="overflow-y-auto p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Detail label="Status" value={statusMeta[request.status]?.[0] || request.statusLabel} />
            <Detail label="User role" value={request.user?.role || "-"} />
            <Detail label="Sub-agent status" value={request.user?.subAgentStatus || "-"} />
            <Detail label="Current group" value={request.currentGroup?.name || "-"} />
            <Detail label="Requested group" value={request.requestedGroup?.name || "-"} />
            <Detail label="Approved group" value={request.approvedGroup?.name || "-"} />
            <Detail label="Created" value={request.createdAtLabel} />
            <Detail label="Reviewed" value={request.reviewedAtLabel || "-"} />
          </div>

          <section className="mt-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
            <h3 className="text-[11px] font-black dark:text-white">Customer reason</h3>
            <p className="mt-2 rounded-xl bg-slate-50 p-3 text-[9px] font-bold leading-5 text-slate-600 dark:bg-[#0B1220] dark:text-slate-300">{request.reason || "No reason provided."}</p>
          </section>

          <section className="mt-3 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
            <h3 className="text-[11px] font-black dark:text-white">Admin note</h3>
            <textarea
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              disabled={!canReview || busy}
              placeholder="Optional note"
              className="mt-2 min-h-24 w-full rounded-2xl bg-slate-50 p-3 text-[10px] font-bold outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-70 dark:bg-[#0B1220] dark:text-white"
            />
          </section>

          {isGroupChange && canReview && (
            <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-[9px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              Approval will send the requested group as the approved group.
            </p>
          )}
          {isSubAgent && (
            <p className="mt-3 rounded-xl bg-sky-50 p-3 text-[9px] font-bold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
              Sub-agent is customer business status only. It is not supervisor access.
            </p>
          )}

          {canReview ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => onReview(request, "reject", adminNote)}
                disabled={busy}
                className="h-11 rounded-xl bg-rose-500/10 text-[10px] font-black text-rose-700 disabled:opacity-60 dark:text-rose-300"
              >
                Reject request
              </button>
              <button
                onClick={() => onReview(request, "approve", adminNote)}
                disabled={busy}
                className="h-11 rounded-xl bg-emerald-600 text-[10px] font-black text-white disabled:opacity-60"
              >
                Approve request
              </button>
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[9px] font-bold text-slate-500 dark:bg-[#0B1220] dark:text-slate-300">
              This request is already reviewed.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-[#0B1220]">
      <p className="text-[8px] font-black text-slate-400">{label}</p>
      <p className="mt-1 break-words text-[10px] font-black dark:text-white">{value}</p>
    </div>
  );
}

function Earnings() {
  const byAgent = useMemo(() => agentEarningsSeed.reduce((groups, item) => {
    return { ...groups, [item.agent]: [...(groups[item.agent] || []), item] };
  }, {}), []);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {Object.entries(byAgent).map(([agent, rows]) => (
        <article key={agent} className="rounded-[23px] border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/10 font-black text-violet-600">{agent.slice(0, 1)}</span>
            <div className="flex-1">
              <h2 className="text-sm font-black dark:text-white">{agent}</h2>
              <p className="text-[8px] text-slate-400">{rows.length} invited accounts</p>
            </div>
            <b dir="ltr" className="text-emerald-600">${rows.reduce((sum, row) => sum + row.earning, 0).toFixed(2)}</b>
          </div>
          <div className="mt-3 space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 dark:bg-[#0B1220]">
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-[9px] dark:text-white">{row.invited}</b>
                  <small className="text-[7px] text-slate-400">{row.orders} orders - sales ${row.revenue}</small>
                </div>
                <span dir="ltr" className="text-[9px] font-black text-emerald-600">+${row.earning.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </article>
      ))}
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
