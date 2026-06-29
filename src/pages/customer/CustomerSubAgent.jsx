import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Clock3,
  Copy,
  Link2,
  RotateCcw,
  Send,
  Share2,
  UserPlus,
  WalletCards,
  XCircle,
} from "lucide-react";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { formatCurrency } from "../../api/adapters";
import {
  cancelGroupRequest,
  createGroupRequest,
  createSubAgentRequest,
  getGroupChangeOptions,
  getMyGroupRequests,
  GROUP_REQUEST_STATUS,
  GROUP_REQUEST_TYPES,
} from "../../api/groupRequests";
import { getMyReferralCommissions, getMyReferrals } from "../../api/referrals";
import { useAuth } from "../../context/AuthContext";

const subAgentSlide = "/اسلايد وكيل.jpg";
const COMMISSION_PAGE_SIZE = 8;
const REQUEST_PAGE_SIZE = 20;

export default function CustomerSubAgent({ basePath = "/customer" }) {
  const connectedCustomerPage = basePath === "/customer";
  const { refreshCurrentUser, token, user } = useAuth();
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [commissionPagination, setCommissionPagination] = useState(null);
  const [groupOptions, setGroupOptions] = useState({ currentGroup: null, groups: [] });
  const [requests, setRequests] = useState([]);
  const [requestPagination, setRequestPagination] = useState(null);
  const [groupChangeReason, setGroupChangeReason] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMoreCommissions, setLoadingMoreCommissions] = useState(false);
  const [loadingMoreRequests, setLoadingMoreRequests] = useState(false);
  const [submittingGroupChange, setSubmittingGroupChange] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelingId, setCancelingId] = useState("");
  const [error, setError] = useState("");

  const loadPageData = useCallback(async () => {
    if (!token || !connectedCustomerPage) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const [summaryResult, commissionsResult, requestsResult, groupOptionsResult] = await Promise.allSettled([
      getMyReferrals(token),
      getMyReferralCommissions(token, { page: 1, limit: COMMISSION_PAGE_SIZE }),
      getMyGroupRequests(token, { page: 1, limit: REQUEST_PAGE_SIZE }),
      getGroupChangeOptions(token),
    ]);

    if (summaryResult.status === "fulfilled") {
      setSummary(summaryResult.value.summary);
    } else {
      setSummary(null);
    }

    if (commissionsResult.status === "fulfilled") {
      setCommissions(commissionsResult.value.commissions);
      setCommissionPagination(commissionsResult.value.pagination);
    } else {
      setCommissions([]);
      setCommissionPagination(null);
    }

    if (requestsResult.status === "fulfilled") {
      setRequests(requestsResult.value.requests);
      setRequestPagination(requestsResult.value.pagination);
    } else {
      setRequests([]);
      setRequestPagination(null);
    }

    if (groupOptionsResult.status === "fulfilled") {
      setGroupOptions(groupOptionsResult.value.options);
      setSelectedGroupId((current) => {
        const selectedStillAvailable = groupOptionsResult.value.options.groups.some((group) => group.id === current && !group.isCurrent);
        return selectedStillAvailable ? current : "";
      });
    } else {
      setGroupOptions({ currentGroup: null, groups: [] });
      setSelectedGroupId("");
    }

    const failed = [summaryResult, commissionsResult, requestsResult, groupOptionsResult].find((result) => result.status === "rejected");
    setError(failed?.reason?.userMessage || "");
    setLoading(false);
  }, [connectedCustomerPage, token]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const pendingSubAgentRequest = useMemo(
    () => requests.find((request) => request.requestType === GROUP_REQUEST_TYPES.SUB_AGENT && request.status === GROUP_REQUEST_STATUS.PENDING),
    [requests],
  );

  const latestSubAgentRequest = useMemo(
    () => requests.find((request) => request.requestType === GROUP_REQUEST_TYPES.SUB_AGENT) || null,
    [requests],
  );

  const pendingGroupChangeRequest = useMemo(
    () => requests.find((request) => request.requestType === GROUP_REQUEST_TYPES.GROUP_CHANGE && request.status === GROUP_REQUEST_STATUS.PENDING),
    [requests],
  );

  const selectableGroups = useMemo(
    () => groupOptions.groups.filter((group) => !group.isCurrent),
    [groupOptions.groups],
  );

  const currentGroup = groupOptions.currentGroup?.name || user?.group?.name || latestSubAgentRequest?.currentGroup?.name || requests.find((request) => request.currentGroup)?.currentGroup?.name || "Current group";
  const referralCode = summary?.referralCode || "";
  const referralLink = summary?.referralLink || summary?.inviteLink || "";
  const invitedUsersCount = summary?.invitedUsersCount ?? 0;
  const commissionTotalLabel = getTotalCommissionLabel(summary, user?.currency);
  const commissionPercentage = summary?.settings?.depositCommissionPercentage ?? 0;

  const copyText = async (text, title) => {
    if (!text) {
      showToast({ type: "warning", title: "Nothing to copy", message: "Referral data is not available yet." });
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard is not available");
      }
      await navigator.clipboard.writeText(text);
      showToast({ type: "success", title, message: text });
    } catch {
      showToast({ type: "info", title: "Copy manually", message: text });
    }
  };

  const submitSubAgentRequest = async () => {
    if (!connectedCustomerPage) {
      showToast({
        type: "info",
        title: "Customer action only",
        message: "Sub-agent requests are available from the customer workspace only.",
      });
      return;
    }

    if (!token) {
      showToast({ type: "error", title: "Login required", message: "Please sign in before submitting a request." });
      return;
    }

    if (pendingSubAgentRequest) {
      showToast({
        type: "info",
        title: "Request already pending",
        message: "Your pending sub-agent request is waiting for admin review.",
      });
      return;
    }

    if (!requestReason.trim()) {
      showToast({
        type: "warning",
        title: "Reason required",
        message: "Tell the team about your activity before submitting the request.",
      });
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await createSubAgentRequest(token, { reason: requestReason });
      showToast({
        type: "success",
        title: "Request submitted",
        message: result.message || "Your sub-agent request is pending admin review.",
      });
      setRequestReason("");
      await Promise.allSettled([loadPageData(), refreshCurrentUser?.()]);
    } catch (requestError) {
      const message = requestError.userMessage || "Unable to submit the request.";
      setError(message);
      showToast({ type: "error", title: "Request failed", message });
    } finally {
      setSubmitting(false);
    }
  };

  const submitGroupChangeRequest = async () => {
    if (!connectedCustomerPage) {
      showToast({
        type: "info",
        title: "Customer action only",
        message: "Group-change requests are available from the customer workspace only.",
      });
      return;
    }

    if (!token) {
      showToast({ type: "error", title: "Login required", message: "Please sign in before submitting a request." });
      return;
    }

    if (pendingGroupChangeRequest) {
      showToast({
        type: "info",
        title: "Request already pending",
        message: "Your pending group-change request is waiting for admin review.",
      });
      return;
    }

    const selectedGroup = selectableGroups.find((group) => group.id === selectedGroupId);
    if (!selectedGroup) {
      showToast({
        type: "warning",
        title: "Select a group",
        message: "Choose an available target group before submitting.",
      });
      return;
    }

    if (!groupChangeReason.trim()) {
      showToast({
        type: "warning",
        title: "Reason required",
        message: "Tell the team why you want to change groups.",
      });
      return;
    }

    setSubmittingGroupChange(true);
    setError("");

    try {
      const result = await createGroupRequest(token, {
        requestType: GROUP_REQUEST_TYPES.GROUP_CHANGE,
        requestedGroupId: selectedGroup.id,
        reason: groupChangeReason,
      });
      showToast({
        type: "success",
        title: "Request submitted",
        message: result.message || "Your group-change request is pending admin review.",
      });
      setGroupChangeReason("");
      setSelectedGroupId("");
      await Promise.allSettled([loadPageData(), refreshCurrentUser?.()]);
    } catch (requestError) {
      const message = requestError.userMessage || "Unable to submit the group-change request.";
      setError(message);
      showToast({ type: "error", title: "Request failed", message });
    } finally {
      setSubmittingGroupChange(false);
    }
  };

  const cancelRequest = async (request) => {
    if (!token || !request?.id || request.status !== GROUP_REQUEST_STATUS.PENDING) return;

    setCancelingId(request.id);
    setError("");

    try {
      const result = await cancelGroupRequest(token, request.id);
      showToast({
        type: "success",
        title: "Request canceled",
        message: result.message || "The pending request was canceled.",
      });
      await Promise.allSettled([loadPageData(), refreshCurrentUser?.()]);
    } catch (requestError) {
      const message = requestError.userMessage || "Unable to cancel the request.";
      setError(message);
      showToast({ type: "error", title: "Cancel failed", message });
    } finally {
      setCancelingId("");
    }
  };

  const loadMoreCommissions = async () => {
    if (!token || !commissionPagination || commissionPagination.page >= commissionPagination.pages) return;

    setLoadingMoreCommissions(true);
    try {
      const result = await getMyReferralCommissions(token, {
        page: commissionPagination.page + 1,
        limit: commissionPagination.limit || COMMISSION_PAGE_SIZE,
      });
      setCommissions((current) => [...current, ...result.commissions]);
      setCommissionPagination(result.pagination);
    } catch (requestError) {
      showToast({
        type: "error",
        title: "Unable to load commissions",
        message: requestError.userMessage || "Please try again.",
      });
    } finally {
      setLoadingMoreCommissions(false);
    }
  };

  const loadMoreRequests = async () => {
    if (!token || !requestPagination || requestPagination.page >= requestPagination.pages) return;

    setLoadingMoreRequests(true);
    try {
      const result = await getMyGroupRequests(token, {
        page: requestPagination.page + 1,
        limit: requestPagination.limit || REQUEST_PAGE_SIZE,
      });
      setRequests((current) => [...current, ...result.requests]);
      setRequestPagination(result.pagination);
    } catch (requestError) {
      showToast({
        type: "error",
        title: "Unable to load requests",
        message: requestError.userMessage || "Please try again.",
      });
    } finally {
      setLoadingMoreRequests(false);
    }
  };

  if (!connectedCustomerPage) {
    return (
      <div className="space-y-6">
        <HeroPanel />
        <section className="glass-panel rounded-lg p-5">
          <h1 className="text-xl font-black text-slate-950 dark:text-white">Customer referral workspace</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
            Referral and group request actions are customer-only. This admin mirror keeps the page informational and does not call customer mutation endpoints.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeroPanel />

      {error && (
        <p className="rounded-2xl border border-amber-400/30 bg-amber-400/12 px-3 py-2 text-xs font-bold leading-5 text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}

      {loading ? (
        <LoadingGrid />
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <MetricCard icon={Share2} label="Invite code" value={referralCode || "Unavailable"} />
            <MetricCard icon={UserPlus} label="Invited users" value={String(invitedUsersCount)} />
            <MetricCard icon={BadgeDollarSign} label="Credited commission" value={commissionTotalLabel} />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <article className="glass-panel rounded-lg p-5 lg:col-span-2">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-royal/12 text-royal dark:bg-pulse/15 dark:text-pulse">
                  <Send className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-black text-slate-950 dark:text-white">Sub-agent request</h2>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                    Requests stay pending until an admin reviews them. Sub-agent status does not grant supervisor permissions.
                  </p>
                </div>
                {latestSubAgentRequest && <RequestBadge status={latestSubAgentRequest.status} />}
              </div>

              {pendingSubAgentRequest && (
                <p className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold leading-5 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">
                  A sub-agent request is already pending since {pendingSubAgentRequest.createdAtLabel}.
                </p>
              )}

              <textarea
                value={requestReason}
                onChange={(event) => setRequestReason(event.target.value.slice(0, 1000))}
                placeholder="Tell us about your digital services activity and why you want sub-agent status."
                disabled={submitting || Boolean(pendingSubAgentRequest)}
                className="mt-4 min-h-[110px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-950 outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/10 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-[#0D1324] dark:text-white"
              />
              <button
                type="button"
                onClick={submitSubAgentRequest}
                disabled={submitting || Boolean(pendingSubAgentRequest)}
                className="interactive-ring mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-65"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Submitting..." : pendingSubAgentRequest ? "Waiting for admin review" : "Submit sub-agent request"}
              </button>
            </article>

            <article className="glass-panel rounded-lg p-5">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-royal/12 text-royal dark:bg-pulse/15 dark:text-pulse">
                <WalletCards className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Referral wallet behavior</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-700 dark:text-slate-300">
                Referral commissions are credited directly to your wallet after eligible successful wallet credits.
              </p>
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-black text-slate-500 dark:bg-[#0D1324] dark:text-slate-400">
                Current backend commission setting: {commissionPercentage}%.
              </p>
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <InviteCard
              referralCode={referralCode}
              referralLink={referralLink}
              inviter={summary?.inviter}
              onCopy={copyText}
            />
            <GroupChangeCard
              currentGroup={currentGroup}
              groupOptions={selectableGroups}
              onReasonChange={setGroupChangeReason}
              onSelectGroup={setSelectedGroupId}
              onSubmit={submitGroupChangeRequest}
              pendingRequest={pendingGroupChangeRequest}
              reason={groupChangeReason}
              selectedGroupId={selectedGroupId}
              submitting={submittingGroupChange}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <CommissionHistory
              commissions={commissions}
              onLoadMore={loadMoreCommissions}
              pagination={commissionPagination}
              loadingMore={loadingMoreCommissions}
            />
            <RequestTimeline
              cancelingId={cancelingId}
              onCancel={cancelRequest}
              onLoadMore={loadMoreRequests}
              pagination={requestPagination}
              requests={requests}
              loadingMore={loadingMoreRequests}
            />
          </section>
        </>
      )}
    </div>
  );
}

function HeroPanel() {
  return (
    <section className="overflow-hidden rounded-lg border border-[#8B5CF6]/20 bg-[#050816] shadow-[0_20px_60px_rgba(139,92,246,0.18)] dark:border-white/10 dark:shadow-[0_0_28px_rgba(139,92,246,0.22)]">
      <img
        src={subAgentSlide}
        alt="Winnie sub-agent"
        className="block h-auto w-full"
      />
    </section>
  );
}

function LoadingGrid() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonBlock className="h-64 lg:col-span-2" />
        <SkeletonBlock className="h-64" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-72" />
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <article className="glass-panel rounded-lg p-5">
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-royal/12 text-royal dark:bg-pulse/15 dark:text-pulse">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p dir="ltr" className="mt-1 break-words text-2xl font-black text-slate-950 dark:text-white">{value}</p>
    </article>
  );
}

function InviteCard({ inviter, onCopy, referralCode, referralLink }) {
  return (
    <article className="glass-panel rounded-lg p-5 lg:col-span-2">
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-royal/12 text-royal dark:bg-pulse/15 dark:text-pulse">
        <Share2 className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Invite link</p>
      <p dir="ltr" className="mt-1 break-all text-xl font-black text-slate-950 dark:text-white">{referralCode || "Unavailable"}</p>

      {inviter && (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-600 dark:bg-[#0D1324] dark:text-slate-300">
          You joined through {inviter.name}.
        </p>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onCopy(referralLink, "Referral link copied")}
          disabled={!referralLink}
          className="interactive-ring flex min-h-14 items-center justify-between gap-3 rounded-xl border border-sky-100 bg-white px-4 text-left text-sm font-black text-slate-700 shadow-[0_8px_20px_rgba(14,165,233,0.08)] disabled:cursor-not-allowed disabled:opacity-65 dark:border-white/10 dark:bg-[#0D1324] dark:text-slate-300"
        >
          <span className="flex min-w-0 flex-col">
            <span>Copy registration link</span>
            <span dir="ltr" className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
              {referralLink || "Unavailable"}
            </span>
          </span>
          <Link2 className="h-5 w-5 shrink-0 text-[#8B5CF6]" />
        </button>

        <button
          type="button"
          onClick={() => onCopy(referralCode, "Invite code copied")}
          disabled={!referralCode}
          className="interactive-ring flex min-h-14 items-center justify-between gap-3 rounded-xl border border-[#C4B5FD]/55 bg-[#F5F3FF] px-4 text-left text-sm font-black text-[#7C3AED] shadow-[0_8px_20px_rgba(139,92,246,0.10)] disabled:cursor-not-allowed disabled:opacity-65 dark:border-[#8B5CF6]/32 dark:bg-[#1A2335] dark:text-[#E9D5FF]"
        >
          <span className="flex min-w-0 flex-col">
            <span>Copy code only</span>
            <span dir="ltr" className="mt-1 text-xs font-semibold">
              {referralCode || "Unavailable"}
            </span>
          </span>
          <Copy className="h-5 w-5 shrink-0" />
        </button>
      </div>
    </article>
  );
}

function GroupChangeCard({
  currentGroup,
  groupOptions,
  onReasonChange,
  onSelectGroup,
  onSubmit,
  pendingRequest,
  reason,
  selectedGroupId,
  submitting,
}) {
  const hasOptions = groupOptions.length > 0;
  const disabled = submitting || Boolean(pendingRequest) || !hasOptions;

  return (
    <article className="glass-panel rounded-lg p-5">
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-royal/12 text-royal dark:bg-pulse/15 dark:text-pulse">
        <RotateCcw className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Group-change request</p>
      <p className="mt-1 text-xl font-black text-slate-950 dark:text-white">{currentGroup}</p>
      {pendingRequest ? (
        <p className="mt-3 rounded-xl bg-sky-50 p-3 text-xs font-bold leading-5 text-sky-700 dark:bg-sky-400/10 dark:text-sky-200">
          Your group-change request is pending admin review.
        </p>
      ) : hasOptions ? (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600 dark:bg-[#0D1324] dark:text-slate-300">
          Select a new active group and submit it for admin review. Your current group will not change until approval.
        </p>
      ) : (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600 dark:bg-[#0D1324] dark:text-slate-300">
          No other active groups are available for request right now.
        </p>
      )}

      <label className="mt-4 block">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400">Target group</span>
        <select
          value={selectedGroupId}
          onChange={(event) => onSelectGroup(event.target.value)}
          disabled={disabled}
          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-950 outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/10 disabled:cursor-not-allowed disabled:opacity-65 dark:border-white/10 dark:bg-[#0D1324] dark:text-white"
        >
          <option value="">{hasOptions ? "Choose a group" : "No groups available"}</option>
          {groupOptions.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>

      <textarea
        value={reason}
        onChange={(event) => onReasonChange(event.target.value.slice(0, 1000))}
        placeholder="Why do you want to change groups?"
        disabled={disabled}
        className="mt-3 min-h-[88px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-950 outline-none focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/10 disabled:cursor-not-allowed disabled:opacity-65 dark:border-white/10 dark:bg-[#0D1324] dark:text-white"
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="interactive-ring mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-65"
      >
        <RotateCcw className="h-4 w-4" />
        {submitting ? "Submitting..." : pendingRequest ? "Waiting for admin review" : "Submit group-change request"}
      </button>
    </article>
  );
}

function CommissionHistory({ commissions, loadingMore, onLoadMore, pagination }) {
  const hasMore = pagination && pagination.page < pagination.pages;

  return (
    <article className="glass-panel rounded-lg p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Commission history</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Backend-calculated referral records.
          </p>
        </div>
        <BadgeDollarSign className="h-5 w-5 text-royal dark:text-pulse" />
      </div>

      {commissions.length ? (
        <div className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100 dark:divide-white/10 dark:border-white/10">
          {commissions.map((commission) => (
            <div key={commission.id} className="bg-white px-3 py-3 dark:bg-[#0D1324]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                    {commission.invitedUser?.name || commission.sourceTypeLabel}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {commission.sourceTypeLabel} {commission.sourceAmountLabel ? `from ${commission.sourceAmountLabel}` : ""}
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-slate-400">{commission.creditedAtLabel || commission.createdAtLabel}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p dir="ltr" className="text-sm font-black text-emerald-600 dark:text-emerald-300">
                    {commission.amountLabel}
                  </p>
                  <RequestBadge status={commission.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={WalletCards}
          title="No referral commissions yet"
          description="Eligible commissions will appear after backend-confirmed wallet credits generate referral records."
        />
      )}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="interactive-ring mt-4 h-11 w-full rounded-xl border border-[#C4B5FD]/55 bg-white text-xs font-black text-[#7C3AED] disabled:cursor-wait disabled:opacity-70 dark:border-[#8B5CF6]/32 dark:bg-[#0D1324] dark:text-[#E9D5FF]"
        >
          {loadingMore ? "Loading..." : "Load more commissions"}
        </button>
      )}
    </article>
  );
}

function RequestTimeline({ cancelingId, loadingMore, onCancel, onLoadMore, pagination, requests }) {
  const hasMore = pagination && pagination.page < pagination.pages;

  return (
    <article className="glass-panel rounded-lg p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Request status</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Own customer requests only.
          </p>
        </div>
        <Clock3 className="h-5 w-5 text-royal dark:text-pulse" />
      </div>

      {requests.length ? (
        <div className="mt-5 space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-lg border border-slate-100 bg-white p-3 dark:border-white/10 dark:bg-[#0D1324]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-950 dark:text-white">{request.requestTypeLabel}</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">
                    {request.reason || "No reason provided."}
                  </p>
                </div>
                <RequestBadge status={request.status} />
              </div>
              <div className="mt-3 grid gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>Current group: {request.currentGroup?.name || "Unknown"}</span>
                <span>Requested group: {request.requestedGroup?.name || "Not selected"}</span>
                {request.approvedGroup && <span>Approved group: {request.approvedGroup.name}</span>}
                {request.adminNote && <span>Admin note: {request.adminNote}</span>}
                <span>Created: {request.createdAtLabel}</span>
                {request.reviewedAtLabel && <span>Reviewed: {request.reviewedAtLabel}</span>}
              </div>
              {request.canCancel && (
                <button
                  type="button"
                  onClick={() => onCancel(request)}
                  disabled={cancelingId === request.id}
                  className="interactive-ring mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 px-4 text-xs font-black text-rose-700 disabled:cursor-wait disabled:opacity-70 dark:text-rose-300"
                >
                  <XCircle className="h-4 w-4" />
                  {cancelingId === request.id ? "Canceling..." : "Cancel pending request"}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Clock3}
          title="No requests yet"
          description="Submitted sub-agent or group-change requests will appear here after the backend creates them."
        />
      )}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="interactive-ring mt-4 h-11 w-full rounded-xl border border-[#C4B5FD]/55 bg-white text-xs font-black text-[#7C3AED] disabled:cursor-wait disabled:opacity-70 dark:border-[#8B5CF6]/32 dark:bg-[#0D1324] dark:text-[#E9D5FF]"
        >
          {loadingMore ? "Loading..." : "Load more requests"}
        </button>
      )}
    </article>
  );
}

function RequestBadge({ status }) {
  const normalized = String(status || "PENDING").toUpperCase();
  const styles = {
    APPROVED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    CANCELED: "border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300",
    CREDITED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    PENDING: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300",
    REJECTED: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300",
    REVERSED: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300",
    SKIPPED: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black ${styles[normalized] || styles.PENDING}`}>
      {normalized.replace(/_/g, " ")}
    </span>
  );
}

function getTotalCommissionLabel(summary, fallbackCurrency = "USD") {
  const totals = summary?.totalCommission || [];
  if (!totals.length) return formatCurrency(0, fallbackCurrency || "USD");
  return totals.map((item) => item.amountLabel).join(" + ");
}
