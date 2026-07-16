import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BadgeDollarSign,
  Clock3,
  Copy,
  ImagePlus,
  Link2,
  Send,
  Share2,
  UserPlus,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { formatCurrency } from "../../api/adapters";
import {
  cancelGroupRequest,
  createSubAgentRequest,
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
  const { t } = useTranslation("subAgent");
  const [summary, setSummary] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [commissionPagination, setCommissionPagination] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestPagination, setRequestPagination] = useState(null);
  const [proofImageFile, setProofImageFile] = useState(null);
  const [requestReason, setRequestReason] = useState("");
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMoreCommissions, setLoadingMoreCommissions] = useState(false);
  const [loadingMoreRequests, setLoadingMoreRequests] = useState(false);
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

    const [summaryResult, commissionsResult, requestsResult] = await Promise.allSettled([
      getMyReferrals(token),
      getMyReferralCommissions(token, { page: 1, limit: COMMISSION_PAGE_SIZE }),
      getMyGroupRequests(token, { page: 1, limit: REQUEST_PAGE_SIZE }),
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

    const failed = [summaryResult, commissionsResult, requestsResult].find((result) => result.status === "rejected");
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

  const referralCode = summary?.referralCode || "";
  const referralLink = summary?.referralLink || summary?.inviteLink || "";
  const invitedUsersCount = summary?.invitedUsersCount ?? 0;
  const commissionTotalLabel = getTotalCommissionLabel(summary, user?.currency);
  const commissionPercentage = summary?.settings?.depositCommissionPercentage ?? 0;
  const proofImagePreview = useMemo(() => (proofImageFile ? URL.createObjectURL(proofImageFile) : ""), [proofImageFile]);

  useEffect(() => {
    return () => {
      if (proofImagePreview) URL.revokeObjectURL(proofImagePreview);
    };
  }, [proofImagePreview]);

  const copyText = async (text, title) => {
    if (!text) {
      showToast({ type: "warning", title: t("nothingToCopyTitle"), message: t("nothingToCopyMessage") });
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error(t("clipboardUnavailable"));
      }
      await navigator.clipboard.writeText(text);
      showToast({ type: "success", title, message: text });
    } catch {
      showToast({ type: "info", title: t("copyManuallyTitle"), message: text });
    }
  };

  const submitSubAgentRequest = async () => {
    if (!connectedCustomerPage) {
      showToast({
        type: "info",
        title: t("customerOnlyTitle"),
        message: t("subAgentCustomerOnly"),
      });
      return;
    }

    if (!token) {
      showToast({ type: "error", title: t("loginRequiredTitle"), message: t("loginRequiredMessage") });
      return;
    }

    if (pendingSubAgentRequest) {
      showToast({
        type: "info",
        title: t("alreadyPendingTitle"),
        message: t("subAgentPendingMessage"),
      });
      return;
    }

    if (!proofImageFile) {
      showToast({
        type: "warning",
        title: t("proofRequiredTitle"),
        message: t("proofRequiredMessage"),
      });
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await createSubAgentRequest(token, { reason: requestReason, proofImageFile });
      showToast({
        type: "success",
        title: t("requestSubmittedTitle"),
        message: result.message || t("subAgentSubmittedMessage"),
      });
      setRequestReason("");
      setProofImageFile(null);
      setRequestModalOpen(false);
      await Promise.allSettled([loadPageData(), refreshCurrentUser?.()]);
    } catch (requestError) {
      const message = requestError.userMessage || t("subAgentFailedMessage");
      setError(message);
      showToast({ type: "error", title: t("requestFailedTitle"), message });
    } finally {
      setSubmitting(false);
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
        title: t("requestCanceledTitle"),
        message: result.message || t("requestCanceledMessage"),
      });
      await Promise.allSettled([loadPageData(), refreshCurrentUser?.()]);
    } catch (requestError) {
      const message = requestError.userMessage || t("cancelFailedMessage");
      setError(message);
      showToast({ type: "error", title: t("cancelFailedTitle"), message });
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
        title: t("commissionsLoadFailedTitle"),
        message: requestError.userMessage || t("common:errors.tryAgain"),
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
        title: t("requestsLoadFailedTitle"),
        message: requestError.userMessage || t("common:errors.tryAgain"),
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
          <h1 className="text-xl font-black text-slate-950 dark:text-white">{t("customerWorkspaceTitle")}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
            {t("customerWorkspaceDescription")}
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
          <section className="grid grid-cols-3 gap-2 sm:gap-4">
            <MetricCard icon={Share2} label={t("inviteCode")} tone="violet" value={referralCode || t("common:states.unavailable")} />
            <MetricCard icon={UserPlus} label={t("invitedUsers")} tone="sky" value={String(invitedUsersCount)} />
            <MetricCard icon={BadgeDollarSign} label={t("creditedCommission")} tone="emerald" value={commissionTotalLabel} />
          </section>

          <section>
            <InviteCard
              referralCode={referralCode}
              referralLink={referralLink}
              inviter={summary?.inviter}
              onCopy={copyText}
            />
          </section>

          <article className="relative overflow-hidden rounded-[24px] border border-emerald-200/70 bg-gradient-to-l from-emerald-50 via-white to-sky-50 p-4 shadow-[0_14px_36px_rgba(16,185,129,0.09)] dark:border-emerald-400/15 dark:bg-[linear-gradient(120deg,rgba(16,185,129,0.10),rgba(17,24,39,0.96),rgba(14,165,233,0.08))] sm:p-5">
            <span aria-hidden="true" className="absolute -left-10 -top-12 h-32 w-32 rounded-full bg-sky-300/20 blur-3xl" />
            <div className="relative flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-[0_12px_26px_rgba(16,185,129,0.25)]">
                <WalletCards className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-black text-slate-950 dark:text-white">{t("referralWalletBehavior")}</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{t("referralWalletDescription")}</p>
                <span className="mt-3 inline-flex rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-[11px] font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                  {t("commissionSetting", { percent: commissionPercentage })}
                </span>
              </div>
            </div>
          </article>

          {requestModalOpen ? (
            <SubAgentRequestModal
              onClose={() => !submitting && setRequestModalOpen(false)}
              onProofImageChange={setProofImageFile}
              onReasonChange={setRequestReason}
              onSubmit={submitSubAgentRequest}
              proofImageFile={proofImageFile}
              proofImagePreview={proofImagePreview}
              reason={requestReason}
              submitting={submitting}
            />
          ) : null}

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <CommissionHistory
              commissions={commissions}
              onLoadMore={loadMoreCommissions}
              pagination={commissionPagination}
              loadingMore={loadingMoreCommissions}
            />
            <div className="space-y-4">
              <section className="flex flex-col items-center gap-2 text-center">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(true)}
                  disabled={submitting || Boolean(pendingSubAgentRequest)}
                  className="interactive-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#7C3AED] via-[#A855F7] to-[#0EA5E9] px-5 text-xs font-black text-white shadow-[0_12px_28px_rgba(124,58,237,0.28)] disabled:cursor-not-allowed disabled:opacity-65"
                >
                  <Send className="h-4 w-4" />
                  {pendingSubAgentRequest ? t("waitingAdmin") : t("submitSubAgent")}
                </button>
                {pendingSubAgentRequest ? (
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-300">{t("subAgentAlreadyPending", { date: pendingSubAgentRequest.createdAtLabel })}</span>
                ) : null}
              </section>
              <RequestTimeline
                cancelingId={cancelingId}
                onCancel={cancelRequest}
                onLoadMore={loadMoreRequests}
                pagination={requestPagination}
                requests={requests}
                loadingMore={loadingMoreRequests}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function HeroPanel() {
  const { t } = useTranslation("common");

  return (
    <section className="overflow-hidden rounded-lg border border-[#8B5CF6]/20 bg-[#050816] shadow-[0_20px_60px_rgba(139,92,246,0.18)] dark:border-white/10 dark:shadow-[0_0_28px_rgba(139,92,246,0.22)]">
      <img
        src={subAgentSlide}
        alt={t("nav.subAgent")}
        className="block h-auto w-full"
      />
    </section>
  );
}

function SubAgentRequestModal({
  onClose,
  onProofImageChange,
  onReasonChange,
  onSubmit,
  proofImageFile,
  proofImagePreview,
  reason,
  submitting,
}) {
  const { t } = useTranslation("subAgent");

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, submitting]);

  const pickProofImage = (file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) return;
    onProofImageChange(file);
  };

  const modal = (
    <div
      className="fixed inset-0 z-[180] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && !submitting && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="sub-agent-request-title"
        className="relative w-full max-w-[430px] overflow-hidden rounded-[24px] border-2 border-violet-400/55 bg-white p-4 shadow-[0_24px_80px_rgba(124,58,237,0.32)] ring-1 ring-sky-300/35 sm:p-5 dark:border-violet-400/45 dark:bg-[#111827] dark:shadow-[0_0_48px_rgba(139,92,246,0.28)]"
      >
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l from-violet-600 via-fuchsia-500 to-sky-400" />
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.1]"
          aria-label={t("common:actions.close")}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#0EA5E9] text-white shadow-[0_14px_30px_rgba(124,58,237,0.3)]">
            <Send className="h-5 w-5" />
          </span>
          <div className="min-w-0 pe-8">
            <h2 id="sub-agent-request-title" className="text-lg font-black text-slate-950 dark:text-white">{t("subAgentRequest")}</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{t("subAgentDescription")}</p>
          </div>
        </div>

        <textarea
          autoFocus
          value={reason}
          onChange={(event) => onReasonChange(event.target.value.slice(0, 1000))}
          placeholder={t("subAgentPlaceholder")}
          disabled={submitting}
          className="mt-4 min-h-[108px] w-full resize-none rounded-2xl border border-violet-200 bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-950 outline-none transition focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/10 disabled:cursor-not-allowed disabled:opacity-70 dark:border-violet-400/20 dark:bg-[#0D1324] dark:text-white"
        />
        <label className="mt-3 block cursor-pointer overflow-hidden rounded-2xl border border-dashed border-sky-300 bg-sky-50/70 p-3 transition hover:border-violet-400 hover:bg-violet-50/70 dark:border-sky-400/25 dark:bg-sky-400/[0.06] dark:hover:bg-violet-400/[0.08]">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={submitting}
            onChange={(event) => pickProofImage(event.target.files?.[0])}
          />
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white text-sky-600 shadow-sm dark:bg-white/10 dark:text-sky-200">
              {proofImagePreview ? (
                <img src={proofImagePreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-black text-slate-900 dark:text-white">{t("proofImageLabel")}</span>
              <span className="mt-1 block truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {proofImageFile?.name || t("proofImageHint")}
              </span>
            </span>
          </div>
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} disabled={submitting} className="h-11 rounded-xl border border-slate-200 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.05]">
            {t("common:actions.cancel")}
          </button>
          <button type="button" onClick={onSubmit} disabled={submitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-sm font-black text-white shadow-[0_12px_26px_rgba(124,58,237,0.24)] disabled:cursor-not-allowed disabled:opacity-65">
            <Send className="h-4 w-4" />
            {submitting ? t("submitting") : t("submitSubAgent")}
          </button>
        </div>
      </section>
    </div>
  );

  return typeof document === "undefined" ? modal : createPortal(modal, document.body);
}

function LoadingGrid() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
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

function MetricCard({ icon: Icon, label, tone = "violet", value }) {
  const tones = {
    emerald: {
      card: "border-emerald-200/70 bg-gradient-to-b from-emerald-50/90 to-white dark:border-emerald-400/15 dark:from-emerald-500/10 dark:to-[#111827]",
      icon: "from-emerald-500 to-teal-500 shadow-[0_10px_24px_rgba(16,185,129,0.24)]",
      value: "text-emerald-700 dark:text-emerald-300",
    },
    sky: {
      card: "border-sky-200/70 bg-gradient-to-b from-sky-50/90 to-white dark:border-sky-400/15 dark:from-sky-500/10 dark:to-[#111827]",
      icon: "from-sky-500 to-blue-600 shadow-[0_10px_24px_rgba(14,165,233,0.24)]",
      value: "text-sky-700 dark:text-sky-300",
    },
    violet: {
      card: "border-violet-200/70 bg-gradient-to-b from-violet-50/90 to-white dark:border-violet-400/15 dark:from-violet-500/10 dark:to-[#111827]",
      icon: "from-violet-600 to-fuchsia-500 shadow-[0_10px_24px_rgba(124,58,237,0.24)]",
      value: "text-violet-700 dark:text-violet-300",
    },
  };
  const colors = tones[tone] || tones.violet;

  return (
    <article className={`min-w-0 rounded-[20px] border p-2.5 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5 sm:text-start ${colors.card}`}>
      <span className={`mx-auto grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white sm:mx-0 sm:h-11 sm:w-11 sm:rounded-2xl ${colors.icon}`}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </span>
      <p className="mt-2 min-h-8 text-[10px] font-bold leading-4 text-slate-500 dark:text-slate-400 sm:mt-4 sm:min-h-0 sm:text-sm sm:font-semibold sm:leading-5">{label}</p>
      <p dir="ltr" className={`mt-1 break-all text-xs font-black leading-5 sm:break-words sm:text-2xl ${colors.value}`}>{value}</p>
    </article>
  );
}

function InviteCard({ inviter, onCopy, referralCode, referralLink }) {
  const { t } = useTranslation("subAgent");

  return (
    <article className="relative block w-full min-w-0 overflow-hidden rounded-[22px] border border-violet-200/70 bg-white p-3.5 shadow-[0_18px_46px_rgba(124,58,237,0.09)] dark:border-violet-400/15 dark:bg-[#111827] sm:rounded-[26px] sm:p-5 lg:col-span-2">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-violet-600 via-fuchsia-500 to-sky-400" />
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-[0_12px_26px_rgba(124,58,237,0.26)]">
          <Share2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-black text-slate-950 dark:text-white">{t("inviteLink")}</h2>
          <p dir="ltr" className="mt-0.5 break-all text-base font-black tracking-wider text-violet-700 dark:text-violet-300 sm:text-lg">{referralCode || t("common:states.unavailable")}</p>
        </div>
      </div>

      {inviter && (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-600 dark:bg-[#0D1324] dark:text-slate-300">
          {t("joinedThrough", { name: inviter.name })}
        </p>
      )}

      <div className="mt-4 grid w-full grid-cols-1 gap-3 sm:mt-5 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onCopy(referralLink, t("referralLinkCopied"))}
          disabled={!referralLink}
          className="interactive-ring flex min-h-[76px] w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-sky-200/80 bg-sky-50/70 px-3 py-2.5 text-left text-sm font-black text-sky-900 shadow-[0_8px_20px_rgba(14,165,233,0.07)] disabled:cursor-not-allowed disabled:opacity-65 dark:border-sky-400/15 dark:bg-sky-400/[0.07] dark:text-sky-100 sm:gap-3 sm:px-4"
        >
          <span className="flex min-w-0 flex-col">
            <span>{t("copyRegistrationLink")}</span>
            <span dir="ltr" className="mt-1 block max-w-full whitespace-normal break-all text-[10px] font-semibold leading-4 text-slate-500 dark:text-slate-400 sm:text-xs">
              {referralLink || t("common:states.unavailable")}
            </span>
          </span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-500 text-white"><Link2 className="h-4 w-4" /></span>
        </button>

        <button
          type="button"
          onClick={() => onCopy(referralCode, t("inviteCodeCopied"))}
          disabled={!referralCode}
          className="interactive-ring flex min-h-[76px] w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-violet-200/80 bg-violet-50/80 px-3 py-2.5 text-left text-sm font-black text-violet-800 shadow-[0_8px_20px_rgba(139,92,246,0.08)] disabled:cursor-not-allowed disabled:opacity-65 dark:border-violet-400/15 dark:bg-violet-400/[0.08] dark:text-violet-100 sm:gap-3 sm:px-4"
        >
          <span className="flex min-w-0 flex-col">
            <span>{t("copyCodeOnly")}</span>
            <span dir="ltr" className="mt-1 block break-all text-xs font-semibold">
              {referralCode || t("common:states.unavailable")}
            </span>
          </span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-600 text-white"><Copy className="h-4 w-4" /></span>
        </button>
      </div>
    </article>
  );
}

function CommissionHistory({ commissions, loadingMore, onLoadMore, pagination }) {
  const { t } = useTranslation("subAgent");
  const hasMore = pagination && pagination.page < pagination.pages;

  return (
    <article className="rounded-[26px] border border-emerald-200/70 bg-white p-5 shadow-[0_18px_46px_rgba(16,185,129,0.08)] dark:border-emerald-400/15 dark:bg-[#111827]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)]"><BadgeDollarSign className="h-5 w-5" /></span>
          <div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">{t("commissionHistory")}</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t("commissionHistoryDescription")}
          </p>
          </div>
        </div>
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
                    {commission.sourceTypeLabel} {commission.sourceAmountLabel ? t("sourceFrom", { amount: commission.sourceAmountLabel }) : ""}
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
        <SectionEmptyState
          icon={WalletCards}
          tone="emerald"
          title={t("noCommissionsTitle")}
          description={t("noCommissionsDescription")}
        />
      )}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="interactive-ring mt-4 h-11 w-full rounded-xl border border-[#C4B5FD]/55 bg-white text-xs font-black text-[#7C3AED] disabled:cursor-wait disabled:opacity-70 dark:border-[#8B5CF6]/32 dark:bg-[#0D1324] dark:text-[#E9D5FF]"
        >
          {loadingMore ? t("loading") : t("loadMoreCommissions")}
        </button>
      )}
    </article>
  );
}

function RequestTimeline({ cancelingId, loadingMore, onCancel, onLoadMore, pagination, requests }) {
  const { t } = useTranslation("subAgent");
  const hasMore = pagination && pagination.page < pagination.pages;

  return (
    <article className="rounded-[26px] border border-sky-200/70 bg-white p-5 shadow-[0_18px_46px_rgba(14,165,233,0.08)] dark:border-sky-400/15 dark:bg-[#111827]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_10px_24px_rgba(14,165,233,0.22)]"><Clock3 className="h-5 w-5" /></span>
          <div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">{t("requestStatus")}</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t("requestStatusDescription")}
          </p>
          </div>
        </div>
      </div>

      {requests.length ? (
        <div className="mt-5 space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-lg border border-slate-100 bg-white p-3 dark:border-white/10 dark:bg-[#0D1324]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-950 dark:text-white">{request.requestTypeLabel}</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">
                    {request.reason || t("noReason")}
                  </p>
                </div>
                <RequestBadge status={request.status} />
              </div>
              <div className="mt-3 grid gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>{t("requestCurrentGroup", { value: request.currentGroup?.name || t("unknown") })}</span>
                <span>{t("requestRequestedGroup", { value: request.requestedGroup?.name || t("notSelected") })}</span>
                {request.approvedGroup && <span>{t("requestApprovedGroup", { value: request.approvedGroup.name })}</span>}
                {request.adminNote && <span>{t("requestAdminNote", { value: request.adminNote })}</span>}
                <span>{t("requestCreated", { value: request.createdAtLabel })}</span>
                {request.reviewedAtLabel && <span>{t("requestReviewed", { value: request.reviewedAtLabel })}</span>}
              </div>
              {request.proofImageUrl ? (
                <a href={request.proofImageUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-black text-sky-600 dark:text-sky-300">
                  <ImagePlus className="h-4 w-4" />
                  {request.proofImageOriginalName || "عرض صورة الإثبات"}
                </a>
              ) : null}
              {request.canCancel && (
                <button
                  type="button"
                  onClick={() => onCancel(request)}
                  disabled={cancelingId === request.id}
                  className="interactive-ring mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 px-4 text-xs font-black text-rose-700 disabled:cursor-wait disabled:opacity-70 dark:text-rose-300"
                >
                  <XCircle className="h-4 w-4" />
                  {cancelingId === request.id ? t("canceling") : t("cancelPending")}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <SectionEmptyState
          icon={Clock3}
          tone="sky"
          title={t("noRequestsTitle")}
          description={t("noRequestsDescription")}
        />
      )}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="interactive-ring mt-4 h-11 w-full rounded-xl border border-[#C4B5FD]/55 bg-white text-xs font-black text-[#7C3AED] disabled:cursor-wait disabled:opacity-70 dark:border-[#8B5CF6]/32 dark:bg-[#0D1324] dark:text-[#E9D5FF]"
        >
          {loadingMore ? t("loading") : t("loadMoreRequests")}
        </button>
      )}
    </article>
  );
}

function SectionEmptyState({ description, icon: Icon, title, tone = "sky" }) {
  const tones = {
    emerald: "from-emerald-500 to-teal-500 shadow-[0_12px_28px_rgba(16,185,129,0.22)]",
    sky: "from-sky-500 to-blue-600 shadow-[0_12px_28px_rgba(14,165,233,0.22)]",
  };

  return (
    <div className="mt-5 rounded-[20px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-7 text-center dark:border-white/10 dark:bg-white/[0.025]">
      <span className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white ${tones[tone] || tones.sky}`}>
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

function RequestBadge({ status }) {
  const { t } = useTranslation("subAgent");
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
      {t(`statuses.${normalized}`, { defaultValue: normalized.replace(/_/g, " ") })}
    </span>
  );
}

function getTotalCommissionLabel(summary, fallbackCurrency = "USD") {
  const totals = summary?.totalCommission || [];
  if (!totals.length) return formatCurrency(0, fallbackCurrency || "USD");
  return totals.map((item) => item.amountLabel).join(" + ");
}
