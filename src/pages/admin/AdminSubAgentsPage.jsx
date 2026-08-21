import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeDollarSign,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Edit3,
  ExternalLink,
  HandCoins,
  Image as ImageIcon,
  ImageOff,
  LoaderCircle,
  Mail,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRoundPlus,
  UsersRound,
  XCircle,
} from "lucide-react";
import { createPortal } from "react-dom";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { getAdminGroups } from "../../api/adminGroups";
import { getApiBaseUrl } from "../../api/client";
import {
  approveReferralPayoutWalletCredit,
  approveSubAgentRequest,
  getReferralPayouts,
  getSubAgentCommissions,
  getSubAgentReferredUsers,
  getSubAgentRequests,
  getSubAgents,
  markReferralPayoutPaid,
  rejectSubAgentRequest,
  rejectReferralPayout,
  updateSubAgent,
} from "../../api/adminSubAgents";
import { GROUP_REQUEST_STATUS } from "../../api/groupRequests";
import { useAuth } from "../../context/AuthContext";
import AdminPagination from "../../components/admin/AdminPagination";
import "../../styles/admin-subagents-tabs.css";

const tabs = [
  { key: "requests", label: "الطلبات", icon: ClipboardList },
  { key: "agents", label: "الوكلاء الفرعيون", icon: UsersRound },
  { key: "commissions", label: "العمولات", icon: BadgeDollarSign },
  { key: "payouts", label: "طلبات السحب", icon: HandCoins },
  { key: "referred", label: "المستخدمون المحالون", icon: UserRoundPlus },
];
const pageSize = 15;
const initialPages = { requests: 1, agents: 1, commissions: 1, payouts: 1, referred: 1 };
const emptyPagination = { page: 1, limit: pageSize, total: 0, pages: 1 };

export default function AdminSubAgentsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [agents, setAgents] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [referredUsers, setReferredUsers] = useState([]);
  const [referredLoading, setReferredLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [approveRequest, setApproveRequest] = useState(null);
  const [rejectRequest, setRejectRequest] = useState(null);
  const [editAgent, setEditAgent] = useState(null);
  const [payoutReject, setPayoutReject] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [pages, setPages] = useState(initialPages);
  const [paginations, setPaginations] = useState({
    requests: emptyPagination,
    agents: emptyPagination,
    commissions: emptyPagination,
    payouts: emptyPagination,
    referred: emptyPagination,
  });
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const activeGroups = useMemo(() => groups.filter((group) => group.isActive), [groups]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [requestsResult, agentsResult, commissionsResult, payoutsResult, groupsResult] = await Promise.all([
        getSubAgentRequests(token, { page: pages.requests, limit: pageSize, search: appliedSearch }),
        getSubAgents(token, { page: pages.agents, limit: pageSize, search: appliedSearch }),
        getSubAgentCommissions(token, { page: pages.commissions, limit: pageSize, search: appliedSearch }),
        getReferralPayouts(token, { page: pages.payouts, limit: pageSize, search: appliedSearch }),
        getAdminGroups(token),
      ]);
      setRequests(requestsResult.requests);
      setAgents(agentsResult.subAgents);
      setCommissions(commissionsResult.commissions);
      setPayouts(payoutsResult.payouts);
      setPaginations((current) => ({
        ...current,
        requests: requestsResult.pagination,
        agents: agentsResult.pagination,
        commissions: commissionsResult.pagination,
        payouts: payoutsResult.pagination,
      }));
      setGroups(groupsResult.groups);
      setSelectedAgentId((current) => current || agentsResult.subAgents[0]?.userId || "");
    } catch (requestError) {
      const message = requestError.userMessage || "تعذر تحميل بيانات الوكلاء الفرعيين.";
      setError(message);
      showToast({ type: "error", title: "فشل التحميل", message });
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, pages.agents, pages.commissions, pages.payouts, pages.requests, showToast, token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    let ignore = false;

    const loadReferred = async () => {
      if (!token || !selectedAgentId) {
        setReferredUsers([]);
        setPaginations((current) => ({ ...current, referred: emptyPagination }));
        return;
      }
      setReferredLoading(true);
      try {
        const result = await getSubAgentReferredUsers(token, selectedAgentId, { page: pages.referred, limit: pageSize, search: appliedSearch });
        if (ignore) return;
        setReferredUsers(result.referredUsers);
        setPaginations((current) => ({ ...current, referred: result.pagination }));
      } catch (requestError) {
        if (ignore) return;
        setReferredUsers([]);
        showToast({
          type: "error",
          title: "تعذر تحميل المستخدمين المحالين",
          message: requestError.userMessage || "تحقق من الوكيل المحدد ثم حاول مرة أخرى.",
        });
      } finally {
        if (!ignore) setReferredLoading(false);
      }
    };
    void loadReferred();
    return () => {
      ignore = true;
    };
  }, [appliedSearch, pages.referred, selectedAgentId, showToast, token]);

  const selectReferredAgent = (agentId) => {
    setSelectedAgentId(agentId);
    setPages((current) => ({ ...current, referred: 1 }));
  };

  const approve = async (values) => {
    if (!approveRequest) return;
    setBusy(`approve:${approveRequest.id}`);
    try {
      await approveSubAgentRequest(token, approveRequest.id, values);
      showToast({ type: "success", title: "تم قبول الوكيل الفرعي" });
      setApproveRequest(null);
      await loadData();
    } catch (requestError) {
      showToast({ type: "error", title: "فشل القبول", message: requestError.userMessage || "تحقق من المجموعة المحددة." });
    } finally {
      setBusy("");
    }
  };

  const reject = async (reason) => {
    if (!rejectRequest) return;
    setBusy(`reject:${rejectRequest.id}`);
    try {
      await rejectSubAgentRequest(token, rejectRequest.id, { rejectionReason: reason });
      showToast({ type: "warning", title: "تم رفض طلب الوكيل الفرعي" });
      setRejectRequest(null);
      await loadData();
    } catch (requestError) {
      showToast({ type: "error", title: "فشل الرفض", message: requestError.userMessage || "تعذر رفض الطلب." });
    } finally {
      setBusy("");
    }
  };

  const saveAgent = async (values) => {
    if (!editAgent) return;
    setBusy(`agent:${editAgent.userId}`);
    try {
      await updateSubAgent(token, editAgent.userId, values);
      showToast({ type: "success", title: "تم تحديث الوكيل الفرعي" });
      setEditAgent(null);
      await loadData();
    } catch (requestError) {
      showToast({ type: "error", title: "فشل التحديث", message: requestError.userMessage || "تعذر تحديث الوكيل الفرعي." });
    } finally {
      setBusy("");
    }
  };

  const approvePayout = async (payout) => {
    if (!payout) return;
    setBusy(`payout:${payout.id}:approve`);
    try {
      await approveReferralPayoutWalletCredit(token, payout.id);
      showToast({ type: "success", title: "تم تحويل العمولة إلى المحفظة" });
      setSelectedPayout(null);
      await loadData();
    } catch (requestError) {
      showToast({ type: "error", title: "فشل التحويل", message: requestError.userMessage || "تعذر اعتماد طلب السحب." });
    } finally {
      setBusy("");
    }
  };

  const markPaidPayout = async (payout, adminNotes = "") => {
    if (!payout) return;
    setBusy(`payout:${payout.id}:paid`);
    try {
      await markReferralPayoutPaid(token, payout.id, { adminNotes });
      showToast({ type: "success", title: "تم تسجيل السحب كمدفوع" });
      setSelectedPayout(null);
      await loadData();
    } catch (requestError) {
      showToast({ type: "error", title: "فشل التحديث", message: requestError.userMessage || "تعذر تسجيل الطلب كمدفوع." });
    } finally {
      setBusy("");
    }
  };

  const rejectPayout = async (reason, adminNotes = "") => {
    if (!payoutReject) return;
    setBusy(`payout:${payoutReject.id}:reject`);
    try {
      await rejectReferralPayout(token, payoutReject.id, { reason, adminNotes });
      showToast({ type: "warning", title: "تم رفض طلب السحب" });
      setPayoutReject(null);
      setSelectedPayout(null);
      await loadData();
    } catch (requestError) {
      showToast({ type: "error", title: "فشل الرفض", message: requestError.userMessage || "تعذر رفض طلب السحب." });
    } finally {
      setBusy("");
    }
  };

  return (
    <div dir="rtl" className="admin-subagents-page space-y-4">
      <Header loading={loading} onRefresh={loadData} />
      <form onSubmit={(event) => { event.preventDefault(); setPages((current) => ({ ...current, [tab]: 1 })); setAppliedSearch(search.trim()); }} className="admin-subagents-search flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-[#111827]">
        <label className="site-filter-search relative min-w-0 flex-1">
          <span className="site-filter-search-icon"><Search /></span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث في القسم الحالي" className="site-filter-search-input" />
        </label>
        <button type="submit" className="h-11 rounded-xl bg-violet-600 px-5 text-xs font-black text-white">بحث</button>
      </form>
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}

      <nav className="admin-subagents-tabs" aria-label="أقسام إدارة الوكلاء الفرعيين">
        {tabs.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`admin-subagents-tab${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="admin-subagents-tab-icon" aria-hidden="true">
                <Icon />
              </span>
              <span className="admin-subagents-tab-copy">
                <b>{label}</b>
                <small>{active ? "القسم مفتوح الآن" : "اضغط للفتح"}</small>
              </span>
              <ChevronLeft className="admin-subagents-tab-arrow" aria-hidden="true" />
            </button>
          );
        })}
      </nav>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <SkeletonBlock className="h-44" />
          <SkeletonBlock className="h-44" />
        </div>
      ) : (
        <>
          {tab === "requests" ? (
            <RequestTab requests={requests} token={token} onApprove={setApproveRequest} onReject={setRejectRequest} />
          ) : null}
          {tab === "agents" ? (
            <AgentsTab agents={agents} onEdit={setEditAgent} />
          ) : null}
          {tab === "commissions" ? (
            <CommissionsTab rows={commissions} />
          ) : null}
          {tab === "payouts" ? (
            <PayoutsTab
              onApprove={approvePayout}
              onMarkPaid={markPaidPayout}
              onReject={setPayoutReject}
              onView={setSelectedPayout}
              rows={payouts}
            />
          ) : null}
          {tab === "referred" ? (
            <ReferredTab
              agents={agents}
              loading={referredLoading}
              onSelectAgent={selectReferredAgent}
              rows={referredUsers}
              selectedAgentId={selectedAgentId}
            />
          ) : null}
        </>
      )}
      <AdminPagination
        {...paginations[tab]}
        loading={loading || (tab === "referred" && referredLoading)}
        onChange={(nextPage) => setPages((current) => ({ ...current, [tab]: nextPage }))}
      />

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
          groups={groups}
          onClose={() => setEditAgent(null)}
          onSubmit={saveAgent}
        />
      ) : null}
      {selectedPayout ? (
        <PayoutDetailsModal
          busy={busy === `payout:${selectedPayout.id}:approve` || busy === `payout:${selectedPayout.id}:paid`}
          onApprove={() => approvePayout(selectedPayout)}
          onClose={() => setSelectedPayout(null)}
          onMarkPaid={() => markPaidPayout(selectedPayout)}
          onReject={() => {
            setPayoutReject(selectedPayout);
            setSelectedPayout(null);
          }}
          payout={selectedPayout}
        />
      ) : null}
      {payoutReject ? (
        <PayoutRejectModal
          busy={busy === `payout:${payoutReject.id}:reject`}
          onClose={() => setPayoutReject(null)}
          onSubmit={rejectPayout}
          payout={payoutReject}
        />
      ) : null}
    </div>
  );
}

function Header({ loading, onRefresh }) {
  return (
    <section className="admin-subagents-hero flex items-center gap-3 rounded-lg border border-violet-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
      <BadgeDollarSign className="h-9 w-9 rounded-lg bg-violet-500/10 p-2 text-violet-600" />
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-black dark:text-white">نظام الوكلاء الفرعيين</h1>
        <p className="text-xs font-bold text-slate-500">قبول الطلبات وإدارة نسبة العمولة والمجموعات والحالة وسجل العمليات.</p>
      </div>
      <button type="button" onClick={onRefresh} disabled={loading} className="admin-subagents-refresh inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-xs font-black text-white disabled:opacity-60">
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        تحديث
      </button>
    </section>
  );
}

function RequestTab({ onApprove, onReject, requests, token }) {
  const [proofPreview, setProofPreview] = useState(null);

  if (!requests.length) return <EmptyState icon={UsersRound} title="لا توجد طلبات معلقة" description="ستظهر طلبات الوكلاء الفرعيين الجديدة هنا." />;

  const pendingCount = requests.filter((request) => request.status === GROUP_REQUEST_STATUS.PENDING).length;
  const proofCount = requests.filter((request) => Boolean(request.proofImageUrl)).length;

  return (
    <section className="subagent-requests-section" aria-labelledby="subagent-requests-title">
      <header className="subagent-requests-heading">
        <div>
          <span className="subagent-requests-eyebrow">مراجعة طلبات الانضمام</span>
          <h2 id="subagent-requests-title">المستخدمون المحالون</h2>
          <p>راجع بيانات المستخدم والإثبات، ثم اتخذ الإجراء المناسب.</p>
        </div>
        <div className="subagent-requests-summary" aria-label="ملخص الطلبات">
          <span><b>{requests.length}</b> الكل</span>
          <span className="is-pending"><b>{pendingCount}</b> معلّقة</span>
          <span><b>{proofCount}</b> بإثبات</span>
        </div>
      </header>

      <div className="subagent-request-grid">
        {requests.map((request) => {
          const name = request.user?.name || "مستخدم";
          const email = request.user?.email || "لا يوجد بريد إلكتروني";
          const isPending = request.status === GROUP_REQUEST_STATUS.PENDING;
          return (
            <article key={request.id} className={`subagent-request-card${isPending ? " is-pending" : ""}`}>
              <div className="subagent-request-card-top">
                <span className="subagent-request-avatar" aria-hidden="true">{getInitials(name)}</span>
                <div className="subagent-request-identity">
                  <h3>{name}</h3>
                  <span dir="ltr"><Mail aria-hidden="true" />{email}</span>
                </div>
                <Status status={request.status} />
              </div>

              <div className="subagent-request-date">
                <CalendarClock aria-hidden="true" />
                <span>{request.reviewedAtLabel ? "تاريخ المراجعة" : "تاريخ الطلب"}</span>
                <time>{request.reviewedAtLabel || request.createdAtLabel || "-"}</time>
              </div>

              <div className="subagent-request-message">
                <MessageSquareText aria-hidden="true" />
                <div>
                  <span>رسالة المستخدم</span>
                  <p>{request.reason || "لا توجد رسالة مرفقة مع الطلب."}</p>
                </div>
              </div>

              {request.proofImageUrl ? (
                <button
                  type="button"
                  onClick={() => setProofPreview(request)}
                  className="subagent-request-proof"
                  aria-label={`معاينة إثبات ${name}`}
                >
                  <ProofImage
                    alt={`صورة إثبات ${name}`}
                    src={request.proofImageUrl}
                    token={token}
                  />
                  <span className="subagent-request-proof-caption">
                    <span>
                      <small>صورة الإثبات</small>
                      <b>{request.proofImageOriginalName || "عرض الصورة المرفقة"}</b>
                    </span>
                    <span className="subagent-request-proof-open">تكبير الصورة <ExternalLink aria-hidden="true" /></span>
                  </span>
                </button>
              ) : (
                <div className="subagent-request-no-proof">
                  <ImageIcon aria-hidden="true" />
                  <span><b>لا يوجد إثبات</b>لم يرفق المستخدم صورة مع الطلب.</span>
                </div>
              )}

              {isPending ? (
                <div className="subagent-request-actions" aria-label={`إجراءات طلب ${name}`}>
                  <button type="button" onClick={() => onReject(request)} className="is-reject">
                    <XCircle aria-hidden="true" />
                    رفض الطلب
                  </button>
                  <button type="button" onClick={() => onApprove(request)} className="is-approve">
                    <CheckCircle2 aria-hidden="true" />
                    قبول الطلب
                  </button>
                </div>
              ) : (
                <div className="subagent-request-processed">
                  <ShieldCheck aria-hidden="true" />
                  تمت مراجعة هذا الطلب ولا يحتاج إلى إجراء.
                </div>
              )}
            </article>
          );
        })}
      </div>

      {proofPreview ? <ProofPreviewModal request={proofPreview} token={token} onClose={() => setProofPreview(null)} /> : null}
    </section>
  );
}

function useProofImageSource(src, token) {
  const [source, setSource] = useState(src);
  const [loading, setLoading] = useState(Boolean(src));
  const [failed, setFailed] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);
  const blobUrlRef = useRef("");

  useEffect(() => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = "";
    setSource(src);
    setLoading(Boolean(src));
    setFailed(!src);
    setAuthAttempted(false);

    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = "";
    };
  }, [src]);

  const handleError = async () => {
    if (!src || !token || authAttempted) {
      setLoading(false);
      setFailed(true);
      return;
    }

    setAuthAttempted(true);
    setLoading(true);
    try {
      const imageUrl = new URL(src, window.location.origin);
      const apiOrigin = new URL(getApiBaseUrl()).origin;
      if (imageUrl.origin !== apiOrigin) throw new Error("External proof image");

      const isSignedUpload = imageUrl.pathname === "/uploads/file"
        && imageUrl.searchParams.has("payload")
        && imageUrl.searchParams.has("signature");
      const headers = { Accept: "image/*" };
      if (!isSignedUpload) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(imageUrl.toString(), {
        credentials: "omit",
        headers,
      });
      if (!response.ok) throw new Error(`Image request failed: ${response.status}`);

      const blob = await response.blob();
      if (!blob.size) throw new Error("Empty proof image");
      const blobUrl = URL.createObjectURL(blob);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = blobUrl;
      setSource(blobUrl);
      setFailed(false);
    } catch {
      setLoading(false);
      setFailed(true);
    }
  };

  return {
    failed,
    handleError,
    handleLoad: () => {
      setLoading(false);
      setFailed(false);
    },
    loading,
    source,
  };
}

function ProofImage({ alt, src, token }) {
  const image = useProofImageSource(src, token);
  return (
    <span className={`subagent-proof-image-state${image.failed ? " is-failed" : ""}${image.loading ? " is-loading" : ""}`}>
      <img src={image.source} alt={alt} referrerPolicy="no-referrer" onLoad={image.handleLoad} onError={image.handleError} />
      {image.loading ? <span className="subagent-proof-image-feedback"><LoaderCircle className="animate-spin" />جاري تحميل الصورة</span> : null}
      {image.failed ? <span className="subagent-proof-image-feedback"><ImageOff />تعذر عرض الصورة</span> : null}
    </span>
  );
}

function ProofPreviewModal({ onClose, request, token }) {
  const name = request.user?.name || "المستخدم";
  const image = useProofImageSource(request.proofImageUrl, token);
  return <BodyPortal>
    <div className="subagent-proof-modal" role="presentation" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="معاينة صورة الإثبات"
        className="subagent-proof-dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <small>صورة الإثبات</small>
            <h3>{name}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق المعاينة"><XCircle /></button>
        </header>
        <div className="subagent-proof-image-wrap">
          <span className={`subagent-proof-image-state${image.failed ? " is-failed" : ""}${image.loading ? " is-loading" : ""}`}>
            <img src={image.source} alt={`صورة إثبات ${name}`} referrerPolicy="no-referrer" onLoad={image.handleLoad} onError={image.handleError} />
            {image.loading ? <span className="subagent-proof-image-feedback"><LoaderCircle className="animate-spin" />جاري تحميل الصورة</span> : null}
            {image.failed ? <span className="subagent-proof-image-feedback"><ImageOff />تعذر تحميل صورة الإثبات من الخادم</span> : null}
          </span>
        </div>
        <footer>
          <span>{request.proofImageOriginalName || "صورة الإثبات"}</span>
          {!image.failed && image.source ? (
            <a href={image.source} target="_blank" rel="noreferrer">
              فتح بالحجم الكامل
              <ExternalLink aria-hidden="true" />
            </a>
          ) : null}
        </footer>
      </section>
    </div>
  </BodyPortal>;
}

function AgentsTab({ agents, onEdit }) {
  if (!agents.length) return <EmptyState icon={UsersRound} title="لا يوجد وكلاء فرعيون مقبولون" description="سيظهر المستخدمون المقبولون هنا." />;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {agents.map((agent) => (
        <Panel key={agent.userId}>
          <div className="flex items-start gap-3">
            <RowTitle title={agent.name} subtitle={agent.email} />
            <Status status={agent.status} />
          </div>
          <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500 md:grid-cols-2">
            <span dir="ltr">الكود: {agent.code || "-"}</span>
            <span>العمولة: {agent.usingDefaultCommission ? `الافتراضي ${agent.defaultCommissionPercent}%` : `مخصص ${agent.referralCommissionPercentOverride}%`}</span>
            <span>المجموعة: {agent.group?.name || "-"}</span>
            <span>المستخدمون المحالون: {agent.referredUsersCount}</span>
            <span>تاريخ القبول: {agent.approvedAtLabel || "-"}</span>
            <span>المعلقة: {formatTotals(agent.totalPendingCommissions)}</span>
            <span>المدفوعة: {formatTotals(agent.totalPaidCommissions)}</span>
          </div>
          <button onClick={() => onEdit(agent)} className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-black text-white dark:bg-white dark:text-slate-950">
            <Edit3 className="h-4 w-4" />
            تعديل
          </button>
        </Panel>
      ))}
    </div>
  );
}

function CommissionsTab({ rows }) {
  if (!rows.length) return <EmptyState icon={BadgeDollarSign} title="لا توجد سجلات عمولات" description="ستظهر عمولات شحن الرصيد الفعلية هنا." />;
  return (
    <Panel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-xs text-slate-500">
            <tr className="border-b border-slate-100 dark:border-white/10">
              <th className="py-2 text-start">الوكيل</th>
              <th className="py-2 text-start">المستخدم</th>
              <th className="py-2 text-start">المصدر</th>
              <th className="py-2 text-start">قيمة الشحن</th>
              <th className="py-2 text-start">العمولة</th>
              <th className="py-2 text-start">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-b-0 dark:border-white/10">
                <td className="py-3 font-bold dark:text-white">{row.inviterUserId?.name || row.agent?.name || "-"}</td>
                <td className="py-3">{row.invitedUser?.name || "-"}</td>
                <td className="py-3">{translateSourceType(row.sourceType)}</td>
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

function PayoutsTab({ onApprove, onMarkPaid, onReject, onView, rows }) {
  if (!rows.length) return <EmptyState icon={BadgeDollarSign} title="لا توجد طلبات سحب عمولات" description="ستظهر طلبات السحب هنا." />;
  return (
    <Panel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] text-sm">
          <thead className="text-xs text-slate-500">
            <tr className="border-b border-slate-100 dark:border-white/10">
              <th className="py-2 text-start">المستخدم</th>
              <th className="py-2 text-start">القيمة</th>
              <th className="py-2 text-start">الطريقة</th>
              <th className="py-2 text-start">الحالة</th>
              <th className="py-2 text-start">تاريخ الطلب</th>
              <th className="py-2 text-start">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-b-0 dark:border-white/10">
                <td className="py-3">
                  <div className="min-w-0">
                    <p className="font-bold dark:text-white">{row.user?.name || "-"}</p>
                    <p className="truncate text-xs text-slate-500">{row.user?.email || row.user?.phone || "-"}</p>
                  </div>
                </td>
                <td className="py-3 font-black text-emerald-600">{row.amountLabel}</td>
                <td className="py-3">{row.method === "wallet_credit" ? "إلى المحفظة" : "سحب خارجي"}</td>
                <td className="py-3"><Status status={row.status} /></td>
                <td className="py-3 text-xs text-slate-500">{row.createdAtLabel}</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => onView(row)} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-black dark:border-white/10 dark:text-white">عرض</button>
                    {row.status === "pending" && row.method === "wallet_credit" ? (
                      <button onClick={() => onApprove(row)} className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white">اعتماد المحفظة</button>
                    ) : null}
                    {row.status === "pending" && row.method === "manual_external" ? (
                      <button onClick={() => onMarkPaid(row)} className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white">تم الدفع</button>
                    ) : null}
                    {row.status === "pending" ? (
                      <button onClick={() => onReject(row)} className="h-9 rounded-lg bg-rose-500/10 px-3 text-xs font-black text-rose-700">رفض</button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function PayoutDetailsModal({ busy, onApprove, onClose, onMarkPaid, onReject, payout }) {
  return (
    <Modal title={`طلب سحب ${payout.user?.name || "المستخدم"}`} onClose={onClose}>
      <div className="space-y-2 text-xs font-bold text-slate-500">
        <p>القيمة: {payout.amountLabel}</p>
        <p>العملة: {payout.currency}</p>
        <p>الطريقة: {payout.method === "wallet_credit" ? "إلى المحفظة" : "سحب خارجي"}</p>
        <p>الحالة: {payout.statusLabel}</p>
        <p>عدد العمولات المغلقة: {payout.lockedCommissionCount}</p>
        {payout.walletCreditAmountLabel ? <p>المحوّل إلى المحفظة: {payout.walletCreditAmountLabel}</p> : null}
        {payout.rejectionReason ? <p>سبب الرفض: {payout.rejectionReason}</p> : null}
        {payout.payoutDetails ? <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-[11px] dark:bg-white/[0.04]">{JSON.stringify(payout.payoutDetails, null, 2)}</pre> : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 text-xs font-black dark:border-white/10 dark:text-white">إغلاق</button>
        {payout.status === "pending" && payout.method === "wallet_credit" ? (
          <button type="button" onClick={onApprove} disabled={busy} className="h-10 rounded-lg bg-emerald-600 text-xs font-black text-white">اعتماد المحفظة</button>
        ) : null}
        {payout.status === "pending" && payout.method === "manual_external" ? (
          <button type="button" onClick={onMarkPaid} disabled={busy} className="h-10 rounded-lg bg-emerald-600 text-xs font-black text-white">تم الدفع</button>
        ) : null}
        {payout.status === "pending" ? (
          <button type="button" onClick={onReject} disabled={busy} className="h-10 rounded-lg bg-rose-500/10 text-xs font-black text-rose-700">رفض</button>
        ) : null}
      </div>
    </Modal>
  );
}

function PayoutRejectModal({ busy, onClose, onSubmit, payout }) {
  const [reason, setReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  return (
    <Modal title={`رفض طلب ${payout.user?.name || "المستخدم"}`} onClose={onClose}>
      <Field label="سبب الرفض">
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="input min-h-24" />
      </Field>
      <Field label="ملاحظات الإدارة">
        <textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} className="input min-h-20" />
      </Field>
      <ModalActions
        busy={busy}
        disabled={!reason.trim()}
        onClose={onClose}
        onSubmit={() => onSubmit(reason, adminNotes)}
        submitLabel="رفض"
        tone="danger"
      />
    </Modal>
  );
}

function ReferredTab({ agents, loading, onSelectAgent, rows, selectedAgentId }) {
  return (
    <Panel>
      <label className="mb-4 block text-[10px] font-black text-slate-500">
        <span className="mb-1.5 block">اختر الوكيل الفرعي</span>
        <select
          value={selectedAgentId}
          onChange={(event) => onSelectAgent(event.target.value)}
          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-violet-500 dark:border-white/10 dark:bg-[#0D1324] dark:text-white sm:max-w-md"
        >
          {!agents.length ? <option value="">لا يوجد وكلاء في الصفحة الحالية</option> : null}
        {agents.map((agent) => <option key={agent.userId} value={agent.userId}>{agent.name} - {agent.code}</option>)}
        </select>
      </label>
      {loading ? (
        <div className="grid gap-2">
          <SkeletonBlock className="h-16" />
          <SkeletonBlock className="h-16" />
        </div>
      ) : !rows.length ? (
        <EmptyState icon={UsersRound} title="لا يوجد مستخدمون مُحالون" description="سيظهر المستخدمون المُحالون مباشرة بواسطة الوكيل المحدد هنا." />
      ) : (
        <div className="grid gap-2">
          {rows.map((row) => (
            <div key={row.id} className="grid gap-2 rounded-lg border border-slate-100 p-3 text-sm dark:border-white/10 md:grid-cols-[1fr_auto_auto]">
              <RowTitle title={row.user?.name || "مستخدم"} subtitle={row.user?.email || row.user?.phone || "-"} />
              <span className="text-xs font-bold text-slate-500">استحقاق العمولة حتى: {row.commissionEligibleUntilLabel || "-"}</span>
              <Status status={row.commissionStatus} />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function ApproveModal({ busy, groups, onClose, onSubmit, request }) {
  const [groupId, setGroupId] = useState(request.approvedGroup?.id || groups[0]?.id || "");
  const [adminNote, setAdminNote] = useState("");

  const submit = () => {
    if (!groupId) return;
    onSubmit({ approvedGroupId: groupId, adminNote });
  };

  return (
    <Modal title={`قبول طلب ${request.user?.name || "المستخدم"}`} onClose={onClose}>
      <Field label="المجموعة المعيّنة">
        <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className="input">
          <option value="">اختر المجموعة</option>
          {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
        </select>
      </Field>
      <Field label="ملاحظة الإدارة">
        <textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} className="input min-h-20" />
      </Field>
      <ModalActions busy={busy} disabled={!groupId} onClose={onClose} onSubmit={submit} submitLabel="قبول" />
    </Modal>
  );
}

function RejectModal({ busy, onClose, onSubmit, request }) {
  const [reason, setReason] = useState("");
  return (
    <Modal title={`رفض طلب ${request.user?.name || "المستخدم"}`} onClose={onClose}>
      <Field label="سبب الرفض">
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="input min-h-24" />
      </Field>
      <ModalActions busy={busy} onClose={onClose} onSubmit={() => onSubmit(reason)} submitLabel="رفض" tone="danger" />
    </Modal>
  );
}

function EditAgentModal({ agent, busy, groups, onClose, onSubmit }) {
  const [groupId, setGroupId] = useState(agent.group?.id || "");
  const [useDefault, setUseDefault] = useState(agent.usingDefaultCommission !== false);
  const [percent, setPercent] = useState(String(agent.referralCommissionPercentOverride ?? agent.commissionPercent ?? 0));
  const [status, setStatus] = useState(agent.status || "active");
  const canEditResellerFields = agent.isSubAgent === true;
  const groupOptions = agent.group?.id && !groups.some((group) => group.id === agent.group.id)
    ? [agent.group, ...groups]
    : groups;
  const percentNumber = Number(percent);
  const percentInvalid = !useDefault && (percent === "" || !Number.isFinite(percentNumber) || percentNumber < 0 || percentNumber > 100);

  const submit = () => {
    const payload = useDefault
      ? { useDefault: true }
      : { commissionPercent: percentNumber };
    if (canEditResellerFields) {
      payload.groupId = groupId;
      payload.status = status;
    }
    onSubmit(payload);
  };

  return (
    <Modal title={`تعديل ${agent.name}`} onClose={onClose}>
      {canEditResellerFields ? (
        <Field label="المجموعة المعيّنة">
          <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className="input">
            <option value="">اختر المجموعة</option>
            {groupOptions.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}{group.isActive === false ? " (غير نشطة)" : ""}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <Field label="نسبة عمولة الإحالة">
        <select value={useDefault ? "default" : "custom"} onChange={(event) => setUseDefault(event.target.value === "default")} className="input">
          <option value="default">استخدام الافتراضي ({agent.defaultCommissionPercent}%)</option>
          <option value="custom">نسبة مخصصة</option>
        </select>
      </Field>
      {!useDefault ? (
        <Field label="النسبة المخصصة">
          <input value={percent} onChange={(event) => setPercent(event.target.value)} type="number" min="0" max="100" step="0.01" className="input" />
          {percentInvalid ? <span className="mt-1 block text-[10px] font-bold text-rose-600">أدخل نسبة صحيحة من 0 إلى 100.</span> : null}
        </Field>
      ) : null}
      {canEditResellerFields ? (
        <Field label="الحالة">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="input">
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
        </Field>
      ) : null}
      <p className="text-xs font-bold text-slate-500">
        النسبة الحالية: {agent.usingDefaultCommission ? `الافتراضي ${agent.defaultCommissionPercent}%` : `مخصص ${agent.referralCommissionPercentOverride}%`}
      </p>
      <ModalActions
        busy={busy}
        disabled={(canEditResellerFields && !groupId) || percentInvalid}
        onClose={onClose}
        onSubmit={submit}
        submitLabel="حفظ"
      />
    </Modal>
  );
}

function Modal({ children, onClose, title }) {
  return <BodyPortal>
    <div className="subagent-action-modal" role="presentation" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-label={title} className="subagent-action-dialog" onMouseDown={(event) => event.stopPropagation()}>
        <header className="subagent-action-dialog-header">
          <span className="subagent-action-dialog-icon"><CheckCircle2 /></span>
          <h2><bdi>{title}</bdi></h2>
          <button type="button" aria-label="إغلاق" onClick={onClose}><XCircle /></button>
        </header>
        <div className="subagent-action-dialog-body">{children}</div>
      </section>
    </div>
  </BodyPortal>;
}

function ModalActions({ busy, disabled, onClose, onSubmit, submitLabel, tone = "success" }) {
  const submitClass = tone === "danger" ? "bg-rose-600" : "bg-emerald-600";
  return (
    <div className="subagent-modal-actions grid grid-cols-2 gap-2">
      <button type="button" onClick={onClose} disabled={busy} className="h-10 rounded-lg border border-slate-200 text-xs font-black dark:border-white/10 dark:text-white">إلغاء</button>
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

function BodyPortal({ children }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

function Panel({ children }) {
  return <section className="admin-subagents-panel rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111827]">{children}</section>;
}

function RowTitle({ subtitle, title }) {
  return (
    <div className="min-w-0 flex-1">
      <h2 className="truncate text-sm font-black text-slate-950 dark:text-white">{title}</h2>
      <p dir="ltr" className="truncate text-xs font-semibold text-slate-500">{subtitle}</p>
    </div>
  );
}

function getInitials(name) {
  const parts = String(name || "م").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase() || "م";
}

function Status({ status }) {
  const normalized = String(status || "").toLowerCase();
  const good = normalized === "active" || normalized === "approved" || normalized === "completed" || normalized === "paid";
  const pending = normalized === "pending";
  const bad = normalized === "inactive" || normalized === "canceled" || normalized === "cancelled" || normalized === "rejected" || normalized.includes("stopped");
  const classes = bad
    ? "bg-rose-500/10 text-rose-700"
    : pending
      ? "bg-amber-500/10 text-amber-700"
      : good
        ? "bg-emerald-500/10 text-emerald-700"
        : "bg-slate-500/10 text-slate-600";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${classes}`}>{translateStatus(normalized)}</span>;
}

function translateStatus(status) {
  const labels = {
    active: "نشط",
    approved: "مقبول",
    canceled: "ملغي",
    cancelled: "ملغي",
    completed: "مكتمل",
    credited: "تمت الإضافة",
    eligible: "مؤهل",
    failed: "فشل",
    inactive: "غير نشط",
    paid: "مدفوعة",
    pending: "معلقة",
    rejected: "مرفوض",
    skipped: "تم التجاوز",
    stopped: "متوقف",
    unknown: "غير معروف",
  };
  return labels[status] || (status ? "حالة غير معروفة" : "-");
}

function translateSourceType(sourceType) {
  const normalized = String(sourceType || "").toUpperCase();
  const labels = {
    ADMIN_CREDIT: "إضافة رصيد إدارية",
    DEPOSIT: "إيداع",
    MANUAL_DEPOSIT: "إيداع يدوي",
    PAYMENT: "عملية دفع",
    REFERRAL_SOURCE: "مصدر إحالة",
    TOP_UP: "شحن رصيد",
    WALLET_TOP_UP: "شحن المحفظة",
  };
  return labels[normalized] || (normalized ? "مصدر غير معروف" : "-");
}

function formatTotals(totals = []) {
  if (!totals.length) return "-";
  return totals.map((item) => item.amountLabel || `${item.amount} ${item.currency}`).join(" + ");
}


