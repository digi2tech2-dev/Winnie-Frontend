import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, CheckCircle2, Edit3, RefreshCw, UsersRound, XCircle } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { getAdminGroups } from "../../api/adminGroups";
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

const tabs = [
  ["requests", "الطلبات"],
  ["agents", "الوكلاء الفرعيون"],
  ["commissions", "العمولات"],
  ["payouts", "طلبات السحب"],
  ["referred", "المستخدمون المحالون"],
];

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
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [approveRequest, setApproveRequest] = useState(null);
  const [rejectRequest, setRejectRequest] = useState(null);
  const [editAgent, setEditAgent] = useState(null);
  const [payoutReject, setPayoutReject] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);

  const activeGroups = useMemo(() => groups.filter((group) => group.isActive), [groups]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [requestsResult, agentsResult, commissionsResult, payoutsResult, groupsResult] = await Promise.all([
        getSubAgentRequests(token, { page: 1, limit: 50 }),
        getSubAgents(token, { page: 1, limit: 50 }),
        getSubAgentCommissions(token, { page: 1, limit: 50 }),
        getReferralPayouts(token, { page: 1, limit: 50 }),
        getAdminGroups(token),
      ]);
      setRequests(requestsResult.requests);
      setAgents(agentsResult.subAgents);
      setCommissions(commissionsResult.commissions);
      setPayouts(payoutsResult.payouts);
      setGroups(groupsResult.groups);
      setSelectedAgentId((current) => current || agentsResult.subAgents[0]?.userId || "");
    } catch (requestError) {
      const message = requestError.userMessage || "تعذر تحميل بيانات الوكلاء الفرعيين.";
      setError(message);
      showToast({ type: "error", title: "فشل التحميل", message });
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
    <div dir="rtl" className="space-y-4">
      <Header loading={loading} onRefresh={loadData} />
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}

      <div className="grid grid-cols-5 rounded-lg bg-slate-100 p-1 dark:bg-white/[0.06]">
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
    <section className="flex items-center gap-3 rounded-lg border border-violet-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827]">
      <BadgeDollarSign className="h-9 w-9 rounded-lg bg-violet-500/10 p-2 text-violet-600" />
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-black dark:text-white">نظام الوكلاء الفرعيين</h1>
        <p className="text-xs font-bold text-slate-500">قبول الطلبات وإدارة نسبة العمولة والمجموعات والحالة وسجل العمليات.</p>
      </div>
      <button onClick={onRefresh} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-xs font-black text-white disabled:opacity-60">
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        تحديث
      </button>
    </section>
  );
}

function RequestTab({ onApprove, onReject, requests }) {
  if (!requests.length) return <EmptyState icon={UsersRound} title="لا توجد طلبات معلقة" description="ستظهر طلبات الوكلاء الفرعيين الجديدة هنا." />;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {requests.map((request) => (
        <Panel key={request.id}>
          <RowTitle title={request.user?.name || "مستخدم"} subtitle={request.user?.email || request.createdAtLabel} />
          <div className="mt-2 flex items-center gap-2">
            <Status status={request.status} />
            <span className="text-xs font-bold text-slate-400">{request.reviewedAtLabel || request.createdAtLabel}</span>
          </div>
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">{request.reason || "لا توجد رسالة."}</p>
          {request.proofImageUrl ? (
            <a
              href={request.proofImageUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 p-2 text-xs font-black text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200"
            >
              <img src={request.proofImageUrl} alt="" className="h-12 w-12 rounded-md object-cover" />
              <span className="min-w-0 flex-1 truncate">{request.proofImageOriginalName || "عرض صورة الإثبات"}</span>
            </a>
          ) : (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs font-black text-amber-700">لا توجد صورة إثبات مرفقة.</p>
          )}
          {request.status === GROUP_REQUEST_STATUS.PENDING ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => onReject(request)} className="h-10 rounded-lg bg-rose-500/10 text-xs font-black text-rose-700">رفض</button>
              <button onClick={() => onApprove(request)} className="h-10 rounded-lg bg-emerald-600 text-xs font-black text-white">قبول</button>
            </div>
          ) : null}
        </Panel>
      ))}
    </div>
  );
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

function ReferredTab({ agents, rows, selectedAgentId, setSelectedAgentId }) {
  return (
    <Panel>
      <select value={selectedAgentId} onChange={(event) => setSelectedAgentId(event.target.value)} className="mb-4 h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold dark:border-white/10 dark:bg-[#0D1324] dark:text-white">
        {agents.map((agent) => <option key={agent.userId} value={agent.userId}>{agent.name} - {agent.code}</option>)}
      </select>
      {!rows.length ? (
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
    <Modal title={`قبول ${request.user?.name || "المستخدم"}`} onClose={onClose}>
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
            {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
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
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${classes}`}>{translateStatus(normalized)}</span>;
}

function translateStatus(status) {
  const labels = {
    active: "نشط",
    approved: "مقبول",
    cancelled: "ملغي",
    completed: "مكتمل",
    credited: "تمت الإضافة",
    eligible: "مؤهل",
    failed: "فشل",
    inactive: "غير نشط",
    paid: "مدفوعة",
    pending: "معلقة",
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


