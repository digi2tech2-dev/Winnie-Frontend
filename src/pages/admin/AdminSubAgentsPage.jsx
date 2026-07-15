import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, CheckCircle2, Copy, Edit3, RefreshCw, UsersRound, XCircle } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { getAdminGroups } from "../../api/adminGroups";
import {
  approveSubAgentRequest,
  getSubAgentCommissions,
  getSubAgentReferredUsers,
  getSubAgentRequests,
  getSubAgents,
  rejectSubAgentRequest,
  updateSubAgent,
} from "../../api/adminSubAgents";
import { GROUP_REQUEST_STATUS } from "../../api/groupRequests";
import { useAuth } from "../../context/AuthContext";

const tabs = [
  ["requests", "Requests"],
  ["agents", "Sub-agents"],
  ["commissions", "Commissions"],
  ["referred", "Referred users"],
];

export default function AdminSubAgentsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [agents, setAgents] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [referredUsers, setReferredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [approveRequest, setApproveRequest] = useState(null);
  const [rejectRequest, setRejectRequest] = useState(null);
  const [editAgent, setEditAgent] = useState(null);

  const activeGroups = useMemo(() => groups.filter((group) => group.isActive), [groups]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [requestsResult, agentsResult, commissionsResult, groupsResult] = await Promise.all([
        getSubAgentRequests(token, { status: GROUP_REQUEST_STATUS.PENDING, page: 1, limit: 50 }),
        getSubAgents(token, { page: 1, limit: 50 }),
        getSubAgentCommissions(token, { page: 1, limit: 50 }),
        getAdminGroups(token),
      ]);
      setRequests(requestsResult.requests);
      setAgents(agentsResult.subAgents);
      setCommissions(commissionsResult.commissions);
      setGroups(groupsResult.groups);
      setSelectedAgentId((current) => current || agentsResult.subAgents[0]?.userId || "");
    } catch (requestError) {
      const message = requestError.userMessage || "Unable to load sub-agent data.";
      setError(message);
      showToast({ type: "error", title: "Load failed", message });
    } finally {
      setLoading(false);
    }
  }, [showToast, token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const loadReferred = async () => {
      if (!token || !selectedAgentId) {
        setReferredUsers([]);
        return;
      }
      try {
        const result = await getSubAgentReferredUsers(token, selectedAgentId, { page: 1, limit: 50 });
        setReferredUsers(result.referredUsers);
      } catch {
        setReferredUsers([]);
      }
    };
    void loadReferred();
  }, [selectedAgentId, token]);

  const approve = async (values) => {
    if (!approveRequest) return;
    setBusy(`approve:${approveRequest.id}`);
    try {
      await approveSubAgentRequest(token, approveRequest.id, values);
      showToast({ type: "success", title: "Sub-agent approved" });
      setApproveRequest(null);
      await loadData();
    } catch (requestError) {
      showToast({ type: "error", title: "Approval failed", message: requestError.userMessage || "Check group and percent." });
    } finally {
      setBusy("");
    }
  };

  const reject = async (reason) => {
    if (!rejectRequest) return;
    setBusy(`reject:${rejectRequest.id}`);
    try {
      await rejectSubAgentRequest(token, rejectRequest.id, { rejectionReason: reason });
      showToast({ type: "warning", title: "Sub-agent request rejected" });
      setRejectRequest(null);
      await loadData();
    } catch (requestError) {
      showToast({ type: "error", title: "Reject failed", message: requestError.userMessage || "Unable to reject request." });
    } finally {
      setBusy("");
    }
  };

  const saveAgent = async (values) => {
    if (!editAgent) return;
    setBusy(`agent:${editAgent.userId}`);
    try {
      await updateSubAgent(token, editAgent.userId, values);
      showToast({ type: "success", title: "Sub-agent updated" });
      setEditAgent(null);
      await loadData();
    } catch (requestError) {
      showToast({ type: "error", title: "Update failed", message: requestError.userMessage || "Unable to update sub-agent." });
    } finally {
      setBusy("");
    }
  };

  return (
    <div dir="rtl" className="space-y-4">
      <Header loading={loading} onRefresh={loadData} />
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}

      <div className="grid grid-cols-4 rounded-lg bg-slate-100 p-1 dark:bg-white/[0.06]">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`h-10 rounded-md text-xs font-black ${tab === key ? "bg-white text-violet-700 shadow-sm dark:bg-[#111827]" : "text-slate-500"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <SkeletonBlock className="h-44" />
          <SkeletonBlock className="h-44" />
        </div>
      ) : (
        <>
          {tab === "requests" ? (
            <RequestTab requests={requests} onApprove={setApproveRequest} onReject={setRejectRequest} />
          ) : null}
          {tab === "agents" ? (
            <AgentsTab agents={agents} onEdit={setEditAgent} />
          ) : null}
          {tab === "commissions" ? (
            <CommissionsTab rows={commissions} />
          ) : null}
          {tab === "referred" ? (
            <ReferredTab agents={agents} selectedAgentId={selectedAgentId} setSelectedAgentId={setSelectedAgentId} rows={referredUsers} />
          ) : null}
        </>
      )}

      {approveRequest ? (
        <ApproveModal
          busy={busy === `approve:${approveRequest.id}`}
          groups={activeGroups}
          request={approveRequest}
          onClose={() => setApproveRequest(null)}
          onSubmit={approve}
        />
      ) : null}
      {rejectRequest ? (
        <RejectModal
          busy={busy === `reject:${rejectRequest.id}`}
          request={rejectRequest}
          onClose={() => setRejectRequest(null)}
          onSubmit={reject}
        />
      ) : null}
      {editAgent ? (
        <EditAgentModal
          agent={editAgent}
          busy={busy === `agent:${editAgent.userId}`}
          groups={activeGroups}
          onClose={() => setEditAgent(null)}
          onSubmit={saveAgent}
        />
      ) : null}
    </div>
  );
}

function Header({ loading, onRefresh }) {
  return (
    <section className="flex items-center gap-3 rounded-lg border border-violet-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
      <BadgeDollarSign className="h-9 w-9 rounded-lg bg-violet-500/10 p-2 text-violet-600" />
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-black dark:text-white">Sub-agent system</h1>
        <p className="text-xs font-bold text-slate-500">Approve requests, manage commission percent, groups, status, and ledger.</p>
      </div>
      <button onClick={onRefresh} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-xs font-black text-white disabled:opacity-60">
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </section>
  );
}

function RequestTab({ onApprove, onReject, requests }) {
  if (!requests.length) return <EmptyState icon={UsersRound} title="No pending requests" description="New sub-agent requests will appear here." />;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {requests.map((request) => (
        <Panel key={request.id}>
          <RowTitle title={request.user?.name || "User"} subtitle={request.user?.email || request.createdAtLabel} />
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">{request.reason || "No message."}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => onReject(request)} className="h-10 rounded-lg bg-rose-500/10 text-xs font-black text-rose-700">Reject</button>
            <button onClick={() => onApprove(request)} className="h-10 rounded-lg bg-emerald-600 text-xs font-black text-white">Approve</button>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function AgentsTab({ agents, onEdit }) {
  if (!agents.length) return <EmptyState icon={UsersRound} title="No approved sub-agents" description="Approved users will appear here." />;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {agents.map((agent) => (
        <Panel key={agent.userId}>
          <div className="flex items-start gap-3">
            <RowTitle title={agent.name} subtitle={agent.email} />
            <Status status={agent.status} />
          </div>
          <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500 md:grid-cols-2">
            <span dir="ltr">Code: {agent.code || "-"}</span>
            <span>{agent.commissionPercent}% commission</span>
            <span>Group: {agent.group?.name || "-"}</span>
            <span>Approved: {agent.approvedAtLabel || "-"}</span>
            <span>Pending: {formatTotals(agent.totalPendingCommissions)}</span>
            <span>Paid: {formatTotals(agent.totalPaidCommissions)}</span>
          </div>
          <button onClick={() => onEdit(agent)} className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-black text-white dark:bg-white dark:text-slate-950">
            <Edit3 className="h-4 w-4" />
            Edit
          </button>
        </Panel>
      ))}
    </div>
  );
}

function CommissionsTab({ rows }) {
  if (!rows.length) return <EmptyState icon={BadgeDollarSign} title="No commission records" description="Real top-up commissions will appear here." />;
  return (
    <Panel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-xs text-slate-500">
            <tr className="border-b border-slate-100 dark:border-white/10">
              <th className="py-2 text-start">Agent</th>
              <th className="py-2 text-start">User</th>
              <th className="py-2 text-start">Source</th>
              <th className="py-2 text-start">Top-up</th>
              <th className="py-2 text-start">Commission</th>
              <th className="py-2 text-start">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-b-0 dark:border-white/10">
                <td className="py-3 font-bold dark:text-white">{row.inviterUserId?.name || row.agent?.name || "-"}</td>
                <td className="py-3">{row.invitedUser?.name || "-"}</td>
                <td className="py-3">{row.sourceTypeLabel}</td>
                <td className="py-3">{row.sourceAmountLabel}</td>
                <td className="py-3 font-black text-emerald-600">{row.amountLabel}</td>
                <td className="py-3"><Status status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ReferredTab({ agents, rows, selectedAgentId, setSelectedAgentId }) {
  return (
    <Panel>
      <select value={selectedAgentId} onChange={(event) => setSelectedAgentId(event.target.value)} className="mb-4 h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold dark:border-white/10 dark:bg-[#0D1324] dark:text-white">
        {agents.map((agent) => <option key={agent.userId} value={agent.userId}>{agent.name} - {agent.code}</option>)}
      </select>
      {!rows.length ? (
        <EmptyState icon={UsersRound} title="No referred users" description="Direct referred users for the selected agent will appear here." />
      ) : (
        <div className="grid gap-2">
          {rows.map((row) => (
            <div key={row.id} className="grid gap-2 rounded-lg border border-slate-100 p-3 text-sm dark:border-white/10 md:grid-cols-[1fr_auto_auto]">
              <RowTitle title={row.user?.name || "User"} subtitle={row.user?.email || row.user?.phone || "-"} />
              <span className="text-xs font-bold text-slate-500">Until: {row.commissionEligibleUntilLabel || "-"}</span>
              <Status status={row.commissionStatus} />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function ApproveModal({ busy, groups, onClose, onSubmit, request }) {
  const [groupId, setGroupId] = useState(groups[0]?.id || "");
  const [percent, setPercent] = useState("1");
  const [adminNote, setAdminNote] = useState("");

  const submit = () => {
    if (!groupId || percent === "") return;
    onSubmit({ approvedGroupId: groupId, approvedCommissionPercent: Number(percent), adminNote });
  };

  return (
    <Modal title={`Approve ${request.user?.name || "user"}`} onClose={onClose}>
      <Field label="Assigned group">
        <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className="input">
          <option value="">Select group</option>
          {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
        </select>
      </Field>
      <Field label="Commission percent">
        <input value={percent} onChange={(event) => setPercent(event.target.value)} type="number" min="0" max="100" step="0.01" className="input" />
      </Field>
      <Field label="Admin note">
        <textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} className="input min-h-20" />
      </Field>
      <ModalActions busy={busy} disabled={!groupId || percent === ""} onClose={onClose} onSubmit={submit} submitLabel="Approve" />
    </Modal>
  );
}

function RejectModal({ busy, onClose, onSubmit, request }) {
  const [reason, setReason] = useState("");
  return (
    <Modal title={`Reject ${request.user?.name || "request"}`} onClose={onClose}>
      <Field label="Rejection reason">
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="input min-h-24" />
      </Field>
      <ModalActions busy={busy} onClose={onClose} onSubmit={() => onSubmit(reason)} submitLabel="Reject" tone="danger" />
    </Modal>
  );
}

function EditAgentModal({ agent, busy, groups, onClose, onSubmit }) {
  const [groupId, setGroupId] = useState(agent.group?.id || "");
  const [percent, setPercent] = useState(String(agent.commissionPercent ?? 0));
  const [status, setStatus] = useState(agent.status || "active");
  return (
    <Modal title={`Edit ${agent.name}`} onClose={onClose}>
      <Field label="Assigned group">
        <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className="input">
          {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
        </select>
      </Field>
      <Field label="Commission percent">
        <input value={percent} onChange={(event) => setPercent(event.target.value)} type="number" min="0" max="100" step="0.01" className="input" />
      </Field>
      <Field label="Status">
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="input">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </Field>
      <ModalActions
        busy={busy}
        disabled={!groupId || percent === ""}
        onClose={onClose}
        onSubmit={() => onSubmit({ groupId, commissionPercent: Number(percent), status })}
        submitLabel="Save"
      />
    </Modal>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-[160] grid place-items-center bg-slate-950/70 p-4">
      <section className="w-full max-w-[460px] rounded-lg bg-white p-4 shadow-2xl dark:bg-[#111827]">
        <header className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <h2 className="flex-1 text-sm font-black dark:text-white">{title}</h2>
          <button type="button" onClick={onClose}><XCircle className="h-5 w-5" /></button>
        </header>
        <div className="mt-4 space-y-3">{children}</div>
      </section>
    </div>
  );
}

function ModalActions({ busy, disabled, onClose, onSubmit, submitLabel, tone = "success" }) {
  const submitClass = tone === "danger" ? "bg-rose-600" : "bg-emerald-600";
  return (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={onClose} disabled={busy} className="h-10 rounded-lg border border-slate-200 text-xs font-black dark:border-white/10 dark:text-white">Cancel</button>
      <button type="button" onClick={onSubmit} disabled={busy || disabled} className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg text-xs font-black text-white disabled:opacity-60 ${submitClass}`}>
        {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </button>
    </div>
  );
}

function Field({ children, label }) {
  return (
    <label className="block text-xs font-black text-slate-500">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Panel({ children }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111827]">{children}</section>;
}

function RowTitle({ subtitle, title }) {
  return (
    <div className="min-w-0 flex-1">
      <h2 className="truncate text-sm font-black text-slate-950 dark:text-white">{title}</h2>
      <p dir="ltr" className="truncate text-xs font-semibold text-slate-500">{subtitle}</p>
    </div>
  );
}

function Status({ status }) {
  const normalized = String(status || "").toLowerCase();
  const good = normalized === "active" || normalized === "pending";
  const bad = normalized === "inactive" || normalized === "cancelled" || normalized.includes("stopped");
  const classes = bad
    ? "bg-rose-500/10 text-rose-700"
    : good
      ? "bg-emerald-500/10 text-emerald-700"
      : "bg-slate-500/10 text-slate-600";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${classes}`}>{normalized || "-"}</span>;
}

function formatTotals(totals = []) {
  if (!totals.length) return "-";
  return totals.map((item) => item.amountLabel || `${item.amount} ${item.currency}`).join(" + ");
}
