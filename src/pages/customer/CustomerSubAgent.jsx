import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, CheckCircle2, Clock3, Copy, Send, UserPlus, UsersRound } from "lucide-react";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { formatCurrency } from "../../api/adapters";
import {
  getMyReferralCommissions,
  getMySubAgent,
  getMySubAgentReferredUsers,
  submitSubAgentRequest,
} from "../../api/referrals";
import { getMyGroupRequests, GROUP_REQUEST_STATUS, GROUP_REQUEST_TYPES } from "../../api/groupRequests";
import { useAuth } from "../../context/AuthContext";

const subAgentSlide = "/اسلايد وكيل.jpg";

export default function CustomerSubAgent({ basePath = "/customer" }) {
  const connectedCustomerPage = basePath === "/customer";
  const { refreshCurrentUser, token, user } = useAuth();
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [referredUsers, setReferredUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadPage = useCallback(async () => {
    if (!token || !connectedCustomerPage) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const [summaryResult, commissionsResult, referredResult, requestsResult] = await Promise.allSettled([
      getMySubAgent(token),
      getMyReferralCommissions(token, { page: 1, limit: 10 }),
      getMySubAgentReferredUsers(token, { page: 1, limit: 20 }),
      getMyGroupRequests(token, { page: 1, limit: 20, requestType: GROUP_REQUEST_TYPES.SUB_AGENT }),
    ]);

    if (summaryResult.status === "fulfilled") setSummary(summaryResult.value.summary);
    else setSummary(null);

    if (commissionsResult.status === "fulfilled") setCommissions(commissionsResult.value.commissions);
    else setCommissions([]);

    if (referredResult.status === "fulfilled") setReferredUsers(referredResult.value.referredUsers);
    else setReferredUsers([]);

    if (requestsResult.status === "fulfilled") setRequests(requestsResult.value.requests);
    else setRequests([]);

    const failed = [summaryResult, commissionsResult, referredResult, requestsResult].find((result) => result.status === "rejected");
    setError(failed?.reason?.userMessage || "");
    setLoading(false);
  }, [connectedCustomerPage, token]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const latestSubAgentRequest = useMemo(
    () => requests.find((request) => request.requestType === GROUP_REQUEST_TYPES.SUB_AGENT) || null,
    [requests],
  );
  const pendingRequest = latestSubAgentRequest?.status === GROUP_REQUEST_STATUS.PENDING ? latestSubAgentRequest : null;
  const isSubAgent = summary?.isSubAgent === true;
  const code = summary?.referralCode || summary?.agentProfile?.code || "";
  const percent = summary?.agentProfile?.commissionPercent ?? summary?.settings?.depositCommissionPercentage ?? 0;
  const totalLabel = formatTotals(summary?.totalCommission, user?.currency);

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      showToast({ type: "success", title: "Code copied", message: code });
    } catch {
      showToast({ type: "info", title: "Copy manually", message: code });
    }
  };

  const submitRequest = async () => {
    if (!token || pendingRequest || isSubAgent) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await submitSubAgentRequest(token, { requestedMessage: message });
      showToast({
        type: "success",
        title: "تم إرسال الطلب",
        message: result.message || "تم إرسال الطلب، وهيتم مراجعته من الإدارة، وفي حالة الموافقة هيتم تحويل حسابك إلى وكيل فرعي.",
      });
      setMessage("");
      await Promise.allSettled([loadPage(), refreshCurrentUser?.()]);
    } catch (requestError) {
      const nextError = requestError.userMessage || "Unable to submit the request.";
      setError(nextError);
      showToast({ type: "error", title: "Request failed", message: nextError });
    } finally {
      setSubmitting(false);
    }
  };

  if (!connectedCustomerPage) {
    return (
      <div className="space-y-4">
        <Hero />
        <Panel>
          <h1 className="text-lg font-black text-slate-950 dark:text-white">Sub-agent workspace</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Sub-agent requests are available from the customer workspace.
          </p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Hero />
      {error ? <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">{error}</p> : null}
      {loading ? (
        <div className="grid gap-3 lg:grid-cols-3">
          <SkeletonBlock className="h-32" />
          <SkeletonBlock className="h-32" />
          <SkeletonBlock className="h-32" />
        </div>
      ) : isSubAgent ? (
        <>
          <section className="grid gap-3 md:grid-cols-3">
            <Metric icon={Copy} label="Referral code" value={code || "-"} action={copyCode} />
            <Metric icon={BadgeDollarSign} label="Commission percent" value={`${percent}%`} />
            <Metric icon={UsersRound} label="Pending earned" value={totalLabel} />
          </section>
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-950 dark:text-white">Direct referred users</h2>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Commission is one-level only and expires after 30 days.</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">{referredUsers.length}</span>
            </div>
            <ReferredUsers rows={referredUsers} />
          </Panel>
          <Panel>
            <h2 className="text-base font-black text-slate-950 dark:text-white">Commission ledger</h2>
            <CommissionRows rows={commissions} />
          </Panel>
        </>
      ) : (
        <Panel>
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-sky-500 text-white"><UserPlus className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-black text-slate-950 dark:text-white">طلب وكيل فرعي</h1>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                Send a request to admin. If approved, your account gets a referral code, selected group, and commission percent.
              </p>
            </div>
          </div>

          {latestSubAgentRequest ? (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm font-bold dark:bg-white/[0.04]">
              <span className="me-2 inline-flex rounded-full bg-sky-500/10 px-2 py-1 text-xs text-sky-700">{latestSubAgentRequest.statusLabel}</span>
              {latestSubAgentRequest.adminNote || latestSubAgentRequest.reason || "Request is waiting for review."}
            </div>
          ) : null}

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, 1000))}
            disabled={Boolean(pendingRequest) || submitting}
            placeholder="Optional message"
            className="mt-4 min-h-28 w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold outline-none focus:border-sky-400 dark:border-white/10 dark:bg-[#0D1324] dark:text-white"
          />
          <button
            type="button"
            onClick={submitRequest}
            disabled={Boolean(pendingRequest) || submitting}
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {pendingRequest ? "Waiting for admin" : submitting ? "Submitting..." : "طلب وكيل فرعي"}
          </button>
        </Panel>
      )}
    </div>
  );
}

function Hero() {
  return (
    <section className="overflow-hidden rounded-lg border border-violet-200 bg-[#050816] shadow-sm dark:border-white/10">
      <img src={subAgentSlide} alt="Sub-agent" className="block h-auto w-full" />
    </section>
  );
}

function Panel({ children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111827]">
      {children}
    </section>
  );
}

function Metric({ action, icon: Icon, label, value }) {
  return (
    <button
      type="button"
      onClick={action}
      disabled={!action}
      className="rounded-lg border border-slate-200 bg-white p-4 text-start shadow-sm disabled:cursor-default dark:border-white/10 dark:bg-[#111827]"
    >
      <Icon className="h-5 w-5 text-violet-600" />
      <p className="mt-3 text-xs font-bold text-slate-500">{label}</p>
      <p dir="ltr" className="mt-1 break-all text-xl font-black text-slate-950 dark:text-white">{value}</p>
    </button>
  );
}

function ReferredUsers({ rows }) {
  if (!rows.length) {
    return <EmptyLine icon={Clock3} text="No direct referred users yet." />;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-100 dark:border-white/10">
      {rows.map((row) => (
        <div key={row.id} className="grid gap-2 border-b border-slate-100 p-3 text-sm last:border-b-0 dark:border-white/10 md:grid-cols-[1fr_auto_auto]">
          <div>
            <b className="text-slate-950 dark:text-white">{row.user?.name || "User"}</b>
            <p className="text-xs font-semibold text-slate-500">{row.user?.email || row.user?.phone || "-"}</p>
          </div>
          <span className="text-xs font-bold text-slate-500">Until: {row.commissionEligibleUntilLabel || "-"}</span>
          <StatusPill status={row.commissionStatus} />
        </div>
      ))}
    </div>
  );
}

function CommissionRows({ rows }) {
  if (!rows.length) {
    return <EmptyLine icon={BadgeDollarSign} text="No commission records yet." />;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-100 dark:border-white/10">
      {rows.map((row) => (
        <div key={row.id} className="grid gap-2 border-b border-slate-100 p-3 text-sm last:border-b-0 dark:border-white/10 md:grid-cols-[1fr_auto_auto]">
          <div>
            <b className="text-slate-950 dark:text-white">{row.invitedUser?.name || row.sourceTypeLabel}</b>
            <p className="text-xs font-semibold text-slate-500">{row.sourceTypeLabel} {row.sourceAmountLabel}</p>
          </div>
          <span className="font-black text-emerald-600">{row.amountLabel}</span>
          <StatusPill status={row.status} />
        </div>
      ))}
    </div>
  );
}

function StatusPill({ status }) {
  const normalized = String(status || "").toLowerCase();
  const active = normalized === "active" || normalized === "pending";
  const stopped = normalized.includes("stopped") || normalized === "cancelled" || normalized === "rejected";
  const classes = stopped
    ? "bg-rose-500/10 text-rose-700"
    : active
      ? "bg-emerald-500/10 text-emerald-700"
      : "bg-amber-500/10 text-amber-700";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${classes}`}>{normalized || "unknown"}</span>;
}

function EmptyLine({ icon: Icon, text }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-5 text-center text-sm font-bold text-slate-500 dark:border-white/10">
      <Icon className="mx-auto mb-2 h-5 w-5" />
      {text}
    </div>
  );
}

function formatTotals(totals = [], fallbackCurrency = "USD") {
  if (!totals.length) return formatCurrency(0, fallbackCurrency || "USD");
  return totals.map((item) => item.amountLabel || formatCurrency(item.amount, item.currency)).join(" + ");
}
