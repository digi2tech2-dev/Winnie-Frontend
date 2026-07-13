import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
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
import { approveDeposit, getAdminDeposit, getAdminDeposits, rejectDeposit } from "../../api/adminDeposits";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ToastProvider";
import { SkeletonBlock } from "../../components/Skeletons";
import EmptyState from "../../components/EmptyState";

const statusMeta = {
  PENDING: ["قيد الانتظار", "bg-orange-500/10 text-orange-700 dark:text-orange-300"],
  APPROVED: ["مقبول", "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"],
  REJECTED: ["مرفوض", "bg-rose-500/10 text-rose-700 dark:text-rose-300"],
};

const reviewedNoticeMeta = {
  APPROVED: {
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
    text: "تم قبول طلب إضافة الرصيد بالفعل، وأي تحديث للرصيد تم تنفيذه من الخادم.",
  },
  REJECTED: {
    className: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    icon: ShieldX,
    text: "تم رفض طلب إضافة الرصيد بالفعل، ولا يمكن تنفيذ إجراء قبول أو رفض عليه مرة أخرى.",
  },
  DEFAULT: {
    className: "border-slate-300 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-[#0B1220] dark:text-slate-300",
    icon: AlertTriangle,
    text: "تمت مراجعة هذا الطلب بالفعل. حالة المحفظة المعروضة مأخوذة من بيانات الخادم فقط.",
  },
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
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDepositId = searchParams.get("details") || "";
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
      setError("يلزم تسجيل الدخول بحساب مدير.");
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
      const message = getErrorMessage(requestError, "تعذر تحميل طلبات إضافة الرصيد.");
      setError(message);
      showToast({ type: "error", title: "لم يتم تحميل طلبات إضافة الرصيد", message });
    } finally {
      setLoading(false);
    }
  }, [applied, showToast, token]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (!requestedDepositId || !token) return undefined;
    let cancelled = false;

    const loadRequestedDeposit = async () => {
      try {
        const result = await getAdminDeposit(token, requestedDepositId);
        if (!cancelled) setSelected(result.deposit);
      } catch (requestError) {
        if (!cancelled) {
          showToast({
            type: "error",
            title: "تعذر فتح تفاصيل العملية",
            message: getErrorMessage(requestError, "لم نتمكن من تحميل طلب إضافة الرصيد المرتبط بهذا الإشعار."),
          });
        }
      }
    };

    void loadRequestedDeposit();
    return () => {
      cancelled = true;
    };
  }, [requestedDepositId, showToast, token]);

  const closeSelectedRequest = useCallback(() => {
    setSelected(null);
    if (searchParams.has("details")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("details");
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
      title: action === "approve" ? "قبول طلب إضافة الرصيد" : "رفض طلب إضافة الرصيد",
      message: `هل تريد ${action === "approve" ? "قبول" : "رفض"} طلب إضافة رصيد بقيمة ${request.amountLabel} للمستخدم ${request.user?.name || "هذا المستخدم"}؟ يتولى الخادم وحده تحديث رصيد المحفظة.`,
      confirmLabel: action === "approve" ? "قبول الطلب" : "رفض الطلب",
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
        title: result.message || (confirmation.action === "approve" ? "تم قبول طلب إضافة الرصيد" : "تم رفض طلب إضافة الرصيد"),
      });
      setConfirmation(null);
      setSelected(null);
      await loadRequests();
    } catch (requestError) {
      const message = getErrorMessage(requestError, "فشلت مراجعة طلب إضافة الرصيد.");
      showToast({ type: "error", title: "فشل الإجراء", message });
    } finally {
      setActionKey("");
    }
  };

  return (
    <div dir="rtl" className="space-y-4">
      <Header onRefresh={loadRequests} refreshing={loading} />
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <Stat icon={ReceiptText} label="إجمالي الطلبات" value={counts.total} tone="violet" />
        <Stat icon={Clock3} label="بانتظار المراجعة" value={counts.pending} tone="sky" />
        <Stat icon={CheckCircle2} label="الطلبات المقبولة" value={counts.approved} tone="emerald" />
        <Stat icon={ShieldX} label="الطلبات المرفوضة" value={counts.rejected} tone="rose" />
      </div>

      <section className="overflow-hidden rounded-[23px] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#111827]">
        <button onClick={() => setFiltersOpen((open) => !open)} className="flex h-14 w-full items-center gap-2 px-4 text-right">
          <Filter className="h-4 w-4 text-violet-500" />
          <b className="flex-1 text-sm font-black dark:text-white">الفلاتر</b>
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
            <div className="grid gap-2.5 border-t p-4 md:grid-cols-[1fr_180px_auto] dark:border-white/10">
              <label className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ابحث باسم المستخدم أو البريد الإلكتروني"
                  className="h-11 w-full rounded-2xl bg-slate-50 pe-9 ps-3 text-sm font-black dark:bg-[#0B1220] dark:text-white"
                />
              </label>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-2xl bg-slate-50 px-3 text-sm font-black dark:bg-[#0B1220] dark:text-white">
                <option value="all">الكل</option>
                <option value="PENDING">قيد الانتظار</option>
                <option value="APPROVED">مقبول</option>
                <option value="REJECTED">مرفوض</option>
              </select>
              <button className="h-11 rounded-2xl bg-violet-600 px-5 text-sm font-black text-white">تصفية</button>
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
        <EmptyState icon={ReceiptText} title="لا توجد طلبات إضافة رصيد" description="ستظهر هنا طلبات إضافة الرصيد اليدوية التي يرسلها العملاء." />
      )}

      <RequestDetails
        actionKey={actionKey}
        request={confirmation ? null : selected}
        onClose={closeSelectedRequest}
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
    <section className="flex flex-col gap-4 rounded-[26px] border border-violet-200 bg-gradient-to-l from-white to-violet-50 p-5 sm:flex-row sm:items-center dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827,#17152A)]">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white"><WalletCards className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-black leading-tight dark:text-white sm:text-2xl">طلبات إضافة الرصيد</h1>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-500 dark:text-slate-300">قبول طلبات إضافة الرصيد أو رفضها بأمان من خلال الخادم</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 text-sm font-black text-white disabled:opacity-60 sm:w-auto"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        تحديث
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
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#111827] sm:p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-8 w-8 shrink-0 rounded-xl p-2 sm:h-9 sm:w-9 sm:p-2.5 ${style}`} />
        <b className="block text-xl leading-none dark:text-white sm:text-2xl">{Number(value || 0).toLocaleString("ar-EG-u-nu-latn")}</b>
      </div>
      <p className="mt-2 text-[10px] font-black leading-4 text-slate-400 sm:text-xs">{label}</p>
    </article>
  );
}

function Badge({ status }) {
  const meta = statusMeta[status] || statusMeta.PENDING;
  return <span className={`rounded-full px-2 py-1 text-[8px] font-black ${meta[1]}`}>{meta[0]}</span>;
}

function RequestCard({ request, onDetails }) {
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_12px_28px_rgba(15,23,42,0.045)] dark:border-white/10 dark:bg-[#111827] sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-black dark:text-white sm:text-base">{request.user?.name || "مستخدم غير معروف"}</h2>
          <p dir="ltr" className="mt-0.5 truncate text-right text-[10px] font-bold text-slate-400 sm:text-xs">{request.user?.email || request.user?.id || "-"}</p>
        </div>
        <Badge status={request.status} />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black text-slate-400">المبلغ</p>
          <p dir="ltr" className="mt-1 truncate text-right text-xl font-black text-violet-700 dark:text-violet-300 sm:text-2xl">{request.amountLabel}</p>
        </div>
        <div className="min-w-0 text-left">
          <p className="text-[9px] font-black text-slate-400">تاريخ الإنشاء</p>
          <p className="mt-1 truncate text-[10px] font-black text-slate-600 dark:text-slate-300">{request.createdAtLabel}</p>
        </div>
      </div>
      <button onClick={onDetails} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1 rounded-xl bg-violet-500/10 text-sm font-black text-violet-700 dark:text-violet-300">
        <Eye className="h-4 w-4" />
        عرض التفاصيل
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
  const reviewStatus = statusMeta[request.status]?.[0] || request.statusLabel;
  const reviewedNotice = reviewedNoticeMeta[request.status] || reviewedNoticeMeta.DEFAULT;
  const ReviewedNoticeIcon = reviewedNotice.icon;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="flex h-[100dvh] max-h-[100dvh] w-full max-w-[920px] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:rounded-[28px] dark:bg-[#111827]">
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111827] sm:p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
            <ReceiptText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-base font-black leading-6 dark:text-white sm:text-lg">تفاصيل طلب إضافة الرصيد</h2>
            <p dir="ltr" className="mt-0.5 break-all text-right text-xs font-bold leading-5 text-slate-400">ID: {request.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
            aria-label="إغلاق تفاصيل طلب إضافة الرصيد"
            title="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-[#0B1220]/70">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400">المستخدم</p>
                <h3 className="mt-1 break-words text-lg font-black text-slate-950 dark:text-white">{request.user?.name || "مستخدم غير معروف"}</h3>
                <p dir="ltr" className="mt-0.5 break-all text-right text-xs font-bold leading-5 text-slate-500 dark:text-slate-300">{request.user?.email || request.user?.id || "-"}</p>
              </div>
              <Badge status={request.status} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-3 dark:border-white/10 sm:p-4">
            <h3 className="text-sm font-black dark:text-white">بيانات طلب إضافة الرصيد</h3>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <DetailInfo label="المبلغ المطلوب" value={request.amountLabel} emphasis />
              <DetailInfo label="القيمة المكافئة بالدولار" value={request.amountUsdLabel} emphasis />
              <DetailInfo label="العملة" value={request.currency} />
              <DetailInfo label="الحالة" value={reviewStatus} />
              <DetailInfo label="طريقة الدفع" value={request.paymentMethodId || "-"} />
              <DetailInfo label="سعر الصرف" value={request.exchangeRate ? String(request.exchangeRate) : "-"} dir="ltr" />
              <DetailInfo label="تاريخ الإنشاء" value={request.createdAtLabel} />
              <DetailInfo label="تاريخ المراجعة" value={request.reviewedAtLabel || "-"} />
              <DetailInfo label="راجعه" value={request.reviewedBy?.name || request.reviewedBy?.email || "-"} />
              <DetailInfo label="معرّف المستخدم" value={request.user?.id || "-"} dir="ltr" />
              <DetailInfo label="معرّف الطلب" value={request.id} dir="ltr" />
              <DetailInfo label="الإيصال" value={request.receiptImage || "-"} dir="ltr" />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-3 dark:border-white/10 sm:p-4">
            <h3 className="text-sm font-black dark:text-white">ملاحظات العميل والإيصال</h3>
            <p className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-sm font-bold leading-7 text-slate-600 dark:bg-[#0B1220] dark:text-slate-300">
              {request.notes || "لا توجد ملاحظات من العميل."}
            </p>
            {request.receiptUrl ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setReceiptOpen(true)}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 dark:border-white/10 dark:bg-[#0B1220] dark:text-white sm:w-auto sm:px-5"
                >
                  <ReceiptText className="h-4 w-4" />
                  معاينة الصورة
                </button>
              </div>
            ) : (
              <p className="mt-2 text-sm font-bold text-slate-400">لم يُرفق رابط للإيصال.</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 p-3 dark:border-white/10 sm:p-4">
            <h3 className="text-sm font-black dark:text-white">ملاحظة الإدارة</h3>
            <textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              disabled={!canReview || busy}
              placeholder="ملاحظة اختيارية عند القبول أو الرفض"
              className="mt-2 min-h-28 w-full resize-y rounded-2xl bg-slate-50 p-3 text-sm font-bold leading-7 outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-70 dark:bg-[#0B1220] dark:text-white"
            />
          </section>

          {canReview ? (
            <div className="sticky bottom-0 z-10 -mx-4 mt-3 grid grid-cols-1 gap-2 border-t border-slate-200 bg-white p-4 shadow-[0_-12px_28px_rgba(15,23,42,0.10)] sm:-mx-5 sm:grid-cols-2 sm:p-5 dark:border-white/10 dark:bg-[#111827]">
              <button
                onClick={() => onReview(request, "reject", adminNotes)}
                disabled={busy}
                className="h-11 rounded-xl bg-rose-500/10 text-sm font-black text-rose-700 disabled:opacity-60 dark:text-rose-300"
              >
                رفض الطلب
              </button>
              <button
                onClick={() => onReview(request, "approve", adminNotes)}
                disabled={busy}
                className="h-11 rounded-xl bg-emerald-600 text-sm font-black text-white disabled:opacity-60"
              >
                قبول الطلب في الخادم
              </button>
            </div>
          ) : (
            <div className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-sm font-bold leading-6 ${reviewedNotice.className}`}>
              <ReviewedNoticeIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{reviewedNotice.text}</p>
            </div>
          )}
        </div>
      </section>

      {receiptOpen && (
        <div className="fixed inset-0 z-[1010] grid place-items-center bg-slate-950/80 p-4" onClick={() => setReceiptOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-[860px] overflow-hidden rounded-[24px] bg-white p-2 dark:bg-[#111827]">
            <img src={request.receiptUrl} alt="إيصال طلب إضافة الرصيد" className="max-h-[80vh] w-full object-contain" />
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

function DetailInfo({ dir, emphasis = false, label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-[#0B1220]">
      <p className="text-[10px] font-black text-slate-400">{label}</p>
      <p
        dir={dir}
        className={`mt-1 break-words text-sm font-black leading-6 dark:text-white ${dir === "ltr" ? "text-right" : ""} ${emphasis ? "text-violet-700 dark:text-violet-300" : "text-slate-800"}`}
      >
        {value || "-"}
      </p>
    </div>
  );
}

function ConfirmDialog({ busy, confirmation, onCancel, onConfirm }) {
  const danger = confirmation.tone === "danger";
  return (
    <div className="fixed inset-0 z-[1020] grid place-items-center bg-slate-950/70 p-4">
      <section className="w-full max-w-[440px] rounded-[26px] bg-white p-5 text-center shadow-2xl dark:bg-[#111827]">
        <span className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl ${danger ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"}`}>
          {danger ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
        </span>
        <h2 className="mt-3 text-base font-black dark:text-white">{confirmation.title}</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500 dark:text-slate-300">{confirmation.message}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="h-11 rounded-xl border border-slate-200 text-sm font-black dark:border-white/10 dark:text-white">إلغاء</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-black text-white disabled:opacity-60 ${danger ? "bg-rose-600" : "bg-emerald-600"}`}
          >
            {busy && <RefreshCw className="h-4 w-4 animate-spin" />}
            {busy ? "جارٍ التنفيذ..." : confirmation.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
