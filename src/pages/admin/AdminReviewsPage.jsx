import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Filter,
  MessageSquareText,
  RefreshCw,
  ShieldX,
  Sparkles,
  Star,
} from "lucide-react";
import { fetchAdminReviews, updateAdminReview } from "../../api/reviews";
import AdminPagination from "../../components/admin/AdminPagination";
import EmptyState from "../../components/EmptyState";
import { SkeletonBlock } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

const pageSize = 20;

const filters = [
  { key: "all", label: "الكل" },
  { key: "PENDING", label: "قيد المراجعة" },
  { key: "APPROVED", label: "مقبولة" },
  { key: "REJECTED", label: "مرفوضة" },
  { key: "FEATURED", label: "المميزة" },
];

const statusMeta = {
  PENDING: {
    label: "قيد المراجعة",
    icon: Clock3,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  APPROVED: {
    label: "مقبولة",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  REJECTED: {
    label: "مرفوضة",
    icon: ShieldX,
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
};

function getErrorMessage(error, fallback) {
  return error?.userMessage || error?.message || fallback;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function countByStatus(items, status) {
  return items.filter((item) => item.status === status).length;
}

export default function AdminReviewsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionKey, setActionKey] = useState("");

  const loadReviews = useCallback(async () => {
    if (!token) {
      setReviews([]);
      setError("يلزم تسجيل الدخول بحساب مدير.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await fetchAdminReviews(token, {
        page,
        limit: pageSize,
        status: filter === "all" || filter === "FEATURED" ? undefined : filter,
        featured: filter === "FEATURED" ? true : undefined,
      });
      setReviews(result.reviews);
      setPagination(result.pagination);
    } catch (requestError) {
      const message = getErrorMessage(requestError, "تعذر تحميل تقييمات العملاء.");
      setError(message);
      showToast({ type: "error", title: "لم يتم تحميل التقييمات", message });
    } finally {
      setLoading(false);
    }
  }, [filter, page, showToast, token]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const counts = useMemo(() => ({
    total: pagination.total || reviews.length,
    pending: countByStatus(reviews, "PENDING"),
    approved: countByStatus(reviews, "APPROVED"),
    featured: reviews.filter((review) => review.isFeatured).length,
  }), [pagination.total, reviews]);

  const changeFilter = (nextFilter) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const runAction = async (review, action) => {
    if (!token || !review?.id || actionKey) return;

    const actionPayloads = {
      approve: { status: "APPROVED", isFeatured: review.isFeatured },
      reject: { status: "REJECTED", isFeatured: false },
      pending: { status: "PENDING", isFeatured: review.isFeatured },
      feature: { status: review.status, isFeatured: true },
      unfeature: { status: review.status, isFeatured: false },
    };
    const payload = actionPayloads[action];
    if (!payload) return;

    const key = `${action}:${review.id}`;
    setActionKey(key);
    try {
      await updateAdminReview(token, review.id, payload);
      const titles = {
        approve: "تم قبول التقييم",
        reject: "تم رفض التقييم",
        pending: "تمت إعادة التقييم للمراجعة",
        feature: "تم تمييز التقييم",
        unfeature: "تم إلغاء تمييز التقييم",
      };
      showToast({ type: action === "reject" ? "warning" : "success", title: titles[action] || "تم تحديث التقييم" });
      await loadReviews();
    } catch (requestError) {
      const message = getErrorMessage(requestError, "تعذر تحديث التقييم.");
      showToast({ type: "error", title: "فشل الإجراء", message });
    } finally {
      setActionKey("");
    }
  };

  return (
    <div dir="rtl" className="admin-reviews-page space-y-4">
      <Header onRefresh={loadReviews} refreshing={loading} />

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <Stat icon={MessageSquareText} label="إجمالي التقييمات" value={counts.total} tone="violet" />
        <Stat icon={Clock3} label="بانتظار المراجعة" value={counts.pending} tone="amber" />
        <Stat icon={CheckCircle2} label="التقييمات المقبولة" value={counts.approved} tone="emerald" />
        <Stat icon={Sparkles} label="التقييمات المميزة" value={counts.featured} tone="sky" />
      </div>

      <section className="rounded-[23px] border border-slate-200 bg-white p-3 shadow-[0_10px_26px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#111827]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 px-1 text-sm font-black text-slate-600 dark:text-slate-200">
            <Filter className="h-4 w-4 text-violet-500" />
            الفلاتر
          </span>
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => changeFilter(item.key)}
              disabled={loading && filter === item.key}
              className={`h-10 rounded-2xl px-4 text-xs font-black transition disabled:opacity-60 ${
                filter === item.key
                  ? "bg-violet-600 text-white shadow-[0_10px_24px_rgba(124,58,237,0.20)]"
                  : "bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-700 dark:bg-[#0B1220] dark:text-slate-300 dark:hover:bg-violet-500/10 dark:hover:text-violet-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="flex flex-col gap-3 rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadReviews}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 text-xs font-black text-white disabled:opacity-60"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            إعادة المحاولة
          </button>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-violet-500">مراجعات العملاء</p>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">إدارة التقييمات</h2>
          </div>
          <span className="text-xs font-bold text-slate-400">
            صفحة {Number(pagination.page || page).toLocaleString("ar-EG-u-nu-latn")} من {Number(pagination.pages || 1).toLocaleString("ar-EG-u-nu-latn")}
          </span>
        </div>

        {loading ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-64 rounded-[23px]" />
            ))}
          </div>
        ) : reviews.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                actionKey={actionKey}
                onAction={runAction}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MessageSquareText}
            title="لا توجد تقييمات حاليًا"
            description="ستظهر هنا تقييمات العملاء الحقيقية بعد إرسالها من الطلبات المكتملة."
          />
        )}

        <AdminPagination {...pagination} loading={loading} onChange={setPage} />
      </section>
    </div>
  );
}

function Header({ onRefresh, refreshing }) {
  return (
    <section className="flex flex-col gap-4 rounded-[26px] border border-violet-200 bg-gradient-to-l from-white to-violet-50 p-5 shadow-[0_12px_30px_rgba(124,58,237,0.06)] sm:flex-row sm:items-center dark:border-white/10 dark:bg-[linear-gradient(135deg,#111827,#17152A)]">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white">
        <MessageSquareText className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-black leading-tight text-slate-950 dark:text-white sm:text-2xl">إدارة تقييمات العملاء</h1>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-500 dark:text-slate-300">مراجعة التقييمات الحقيقية وقبولها أو رفضها أو تمييزها للواجهة العامة</p>
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
    amber: "bg-amber-500/10 text-amber-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    sky: "bg-sky-500/10 text-sky-600",
    violet: "bg-violet-500/10 text-violet-600",
  }[tone];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[#111827] sm:p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-8 w-8 shrink-0 rounded-xl p-2 sm:h-9 sm:w-9 sm:p-2.5 ${style}`} />
        <b className="block text-xl leading-none text-slate-950 dark:text-white sm:text-2xl">{Number(value || 0).toLocaleString("ar-EG-u-nu-latn")}</b>
      </div>
      <p className="mt-2 text-[10px] font-black leading-4 text-slate-400 sm:text-xs">{label}</p>
    </article>
  );
}

function ReviewCard({ actionKey, review, onAction }) {
  const StatusIcon = statusMeta[review.status]?.icon || Clock3;
  const status = statusMeta[review.status] || statusMeta.PENDING;
  const busy = Boolean(actionKey);
  const canApprove = review.status !== "APPROVED";
  const canReject = review.status !== "REJECTED";
  const canRestorePending = review.status !== "PENDING";
  const canFeature = review.status === "APPROVED" && !review.isFeatured;
  const canUnfeature = review.isFeatured;

  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.045)] dark:border-white/10 dark:bg-[#111827]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-words text-base font-black text-slate-950 dark:text-white">{review.reviewer.displayName}</h3>
            {review.verifiedCustomer && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-1 text-[10px] font-black text-sky-700 dark:text-sky-300">
                <BadgeCheck className="h-3 w-3" />
                عميل موثق
              </span>
            )}
            {review.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-1 text-[10px] font-black text-violet-700 dark:text-violet-300">
                <Sparkles className="h-3 w-3" />
                مميز
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1" dir="ltr" aria-label={`${review.rating} من 5`}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={`h-4 w-4 ${index < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
              />
            ))}
          </div>
        </div>
        <span className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[10px] font-black ${status.className}`}>
          <StatusIcon className="h-3.5 w-3.5" />
          {status.label}
        </span>
      </div>

      <p className="mt-4 min-h-20 whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-3 text-sm font-bold leading-7 text-slate-600 dark:bg-[#0B1220] dark:text-slate-300">
        {review.comment || "لا يوجد نص للتقييم."}
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Info label="المنتج" value={review.product.name || "-"} />
        <Info label="تاريخ الإرسال" value={formatDate(review.createdAt)} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <ActionButton
          busy={actionKey === `approve:${review.id}`}
          disabled={busy || !canApprove}
          tone="success"
          onClick={() => onAction(review, "approve")}
        >
          قبول
        </ActionButton>
        <ActionButton
          busy={actionKey === `reject:${review.id}`}
          disabled={busy || !canReject}
          tone="danger"
          onClick={() => onAction(review, "reject")}
        >
          رفض
        </ActionButton>
        <ActionButton
          busy={actionKey === `feature:${review.id}`}
          disabled={busy || !canFeature}
          tone="violet"
          onClick={() => onAction(review, "feature")}
        >
          تمييز
        </ActionButton>
        <ActionButton
          busy={actionKey === `unfeature:${review.id}`}
          disabled={busy || !canUnfeature}
          tone="neutral"
          onClick={() => onAction(review, "unfeature")}
        >
          إلغاء التمييز
        </ActionButton>
        <ActionButton
          busy={actionKey === `pending:${review.id}`}
          disabled={busy || !canRestorePending}
          tone="neutral"
          onClick={() => onAction(review, "pending")}
        >
          للمراجعة
        </ActionButton>
      </div>
    </article>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-2.5 dark:bg-[#0B1220]">
      <p className="text-[9px] font-black text-slate-400">{label}</p>
      <p className="mt-1 break-words text-xs font-black leading-5 text-slate-700 dark:text-white">{value}</p>
    </div>
  );
}

function ActionButton({ busy, children, disabled, onClick, tone }) {
  const style = {
    danger: "bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300",
    neutral: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    violet: "bg-violet-600 text-white hover:bg-violet-700",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${style}`}
    >
      {busy && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}
