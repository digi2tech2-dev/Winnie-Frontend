import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  AtSign,
  Bot,
  CalendarClock,
  Check,
  CircleDollarSign,
  CircleUserRound,
  CloudCog,
  Hash,
  Mail,
  Package,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShoppingBag,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { executionTypeLabels } from "../../../data/adminOrders";
import StatusBadge from "./StatusBadge";

export default function OrderDetailsModal({
  actionKey = "",
  detailsError = "",
  isLoading = false,
  onAction,
  onClose,
  order,
}) {
  if (!order && !isLoading) return null;

  return createPortal(
    <OrderDetailsModalContent
      actionKey={actionKey}
      detailsError={detailsError}
      isLoading={isLoading}
      onAction={onAction}
      onClose={onClose}
      order={order}
    />,
    document.body,
  );
}

function OrderDetailsModalContent({ actionKey, detailsError, isLoading, onAction, onClose, order }) {
  const [confirmation, setConfirmation] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const closeButtonRef = useRef(null);
  const busy = Boolean(actionKey);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [busy, onClose]);

  useEffect(() => {
    setConfirmation(null);
    setRefundReason("");
  }, [order?.id]);

  const requestAction = (action) => {
    if (!order || busy) return;
    const availability = order.actionAvailability?.[action];
    if (availability && !availability.enabled) return;
    setRefundReason("");
    setConfirmation(getConfirmation(action, order));
  };

  const confirmAction = async () => {
    if (!confirmation || !order) return;
    await onAction(order.id, confirmation.action, {
      rejectionReason: confirmation.action === "refund" ? refundReason.trim() : undefined,
    });
    setConfirmation(null);
    setRefundReason("");
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[4px] sm:items-center sm:p-5 dark:bg-[#02040C]/75"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        className="flex max-h-[94dvh] w-full max-w-[820px] flex-col overflow-hidden rounded-t-[28px] border border-white/70 bg-[#F8FAFC] shadow-[0_34px_100px_rgba(15,23,42,0.34)] sm:max-h-[90vh] sm:rounded-[30px] dark:border-white/10 dark:bg-[#080D19] dark:shadow-[0_0_50px_rgba(139,92,246,0.20)]"
      >
        <header className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-white px-4 py-4 sm:px-6 dark:border-white/[0.08] dark:bg-[#111827]">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[#8B5CF6] via-[#3B82F6] to-[#22C55E]" aria-hidden="true" />
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] text-white shadow-[0_10px_24px_rgba(124,58,237,0.22)]">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-[#8A94A7]">تفاصيل الطلب من الخادم</p>
              <h2 id="order-details-title" dir="ltr" className="mt-0.5 truncate text-right text-xl font-black text-slate-950 dark:text-white">
                {order?.displayId || "جارٍ تحميل الطلب..."}
              </h2>
              {order && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={order.status} compact />
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-black text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300">
                    {order.executionType === "automatic" ? <Bot className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
                    {executionTypeLabels[order.executionType] || order.executionType}
                  </span>
                </div>
              )}
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              disabled={busy}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
              aria-label="إغلاق تفاصيل الطلب"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto overscroll-contain p-3.5 sm:p-6">
          {isLoading && (
            <div className="mb-3 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-xs font-black text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200">
              جارٍ تحميل أحدث تفاصيل الطلب...
            </div>
          )}

          {detailsError && (
            <div className="mb-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{detailsError}</span>
            </div>
          )}

          {order && (
            <>
              <DetailSection title="المنتج" icon={Package}>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2.5 dark:border-white/[0.07] dark:bg-[#0B1220]">
                  <img src={order.productImage} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-sm sm:h-24 sm:w-28" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black leading-5 text-slate-950 sm:text-base dark:text-white">{order.product}</h3>
                    <p dir="ltr" className="mt-1 text-right text-xl font-black text-[#7C3AED] dark:text-[#C084FC]">{order.priceLabel}</p>
                    <p className="mt-1 text-[10px] font-black text-slate-500 dark:text-slate-400">
                      الكمية {order.quantity.toLocaleString("ar-EG-u-nu-latn")} - سعر الوحدة {order.unitPriceLabel}
                    </p>
                  </div>
                </div>
              </DetailSection>

              <DetailSection title="ملخص الطلب" icon={CloudCog}>
                <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <InfoItem label="معرّف الطلب" value={order.id} icon={Hash} dir="ltr" />
                  <InfoItem label="رقم الطلب" value={order.orderNumber || "-"} icon={Hash} dir="ltr" />
                  <InfoItem label="تاريخ الإنشاء" value={order.createdAtLabel} icon={CalendarClock} />
                  <InfoItem label="آخر تحديث" value={order.updatedAtLabel} icon={CalendarClock} />
                  <InfoItem label="حالة الخادم" value={order.backendStatus} icon={ShieldAlert} dir="ltr" />
                  <InfoItem label="نوع التنفيذ" value={executionTypeLabels[order.executionType] || order.executionType} icon={order.executionType === "automatic" ? Bot : UserRound} />
                </dl>
              </DetailSection>

              <DetailSection title="العميل" icon={CircleUserRound}>
                <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <InfoItem label="الاسم" value={order.username} icon={UserRound} />
                  <InfoItem label="البريد الإلكتروني" value={order.userEmail || "-"} icon={Mail} dir="ltr" wide />
                  <InfoItem label="معرّف المستخدم" value={order.userId || "-"} icon={AtSign} dir="ltr" />
                  <InfoItem
                    label="رصيد المحفظة"
                    value={order.user?.walletBalance === null || order.user?.walletBalance === undefined ? "غير متاح" : String(order.user.walletBalance)}
                    icon={CircleDollarSign}
                    dir="ltr"
                  />
                </dl>
              </DetailSection>

              <DetailSection title="البيانات المُدخلة" icon={CircleUserRound}>
                {order.submittedFields.length ? (
                  <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {order.submittedFields.map((field) => (
                      <InfoItem key={field.key} label={field.label} value={field.valueLabel} icon={Hash} dir="ltr" />
                    ))}
                  </dl>
                ) : (
                  <p className="rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-500 dark:bg-[#0B1220] dark:text-slate-300">
                    لم تُرجع أي حقول إضافية لهذا الطلب.
                  </p>
                )}
              </DetailSection>

              <DetailSection title="المحفظة والاسترداد" icon={CircleDollarSign}>
                <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <InfoItem label="المبلغ المحصّل" value={order.amountLabel} icon={CircleDollarSign} dir="ltr" />
                  <InfoItem label="المخصوم من المحفظة" value={order.walletDeductedLabel} icon={CircleDollarSign} dir="ltr" />
                  <InfoItem label="الرصيد المستخدم" value={`${order.creditUsedAmount} ${order.currency}`} icon={CircleDollarSign} dir="ltr" />
                  <InfoItem label="المبلغ بالدولار" value={order.usdAmount || "-"} icon={CircleDollarSign} dir="ltr" />
                  <InfoItem label="تم الاسترداد" value={order.refunded ? "نعم" : "لا"} icon={RotateCcw} />
                  <InfoItem label="تاريخ الاسترداد" value={order.refundedAtLabel} icon={CalendarClock} />
                  <InfoItem label="سبب الفشل أو الاسترداد" value={order.rejectionReason || "-"} icon={XCircle} wide />
                </dl>
              </DetailSection>

              <DetailSection title="حالة المورد" icon={CloudCog}>
                <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <InfoItem label="المورد" value={order.provider} icon={CloudCog} />
                  <InfoItem label="رمز المورد" value={order.providerCode || "-"} icon={Hash} dir="ltr" />
                  <InfoItem label="معرّف طلب المورد" value={order.providerOrderId} icon={Hash} dir="ltr" />
                  <InfoItem label="حالة المورد" value={order.providerStatusLabel || "-"} icon={ShieldAlert} />
                  <InfoItem label="عدد المحاولات" value={String(order.retryCount)} icon={RefreshCw} dir="ltr" />
                  <InfoItem label="المتبقي" value={String(order.remains)} icon={Package} dir="ltr" />
                  <InfoItem label="وقت المزامنة" value={order.supplierSync} icon={RefreshCw} wide />
                </dl>
              </DetailSection>

              <DetailSection title="الخط الزمني" icon={CalendarClock}>
                {order.timeline.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {order.timeline.map((item) => (
                      <div key={`${item.label}-${item.value}`} className="rounded-xl border border-slate-100 bg-slate-50/75 p-2.5 dark:border-white/[0.06] dark:bg-[#0B1220]/70">
                        <p className="text-[9px] font-black text-slate-400 dark:text-[#7C8598]">{item.label}</p>
                        <p className="mt-1 text-[11px] font-black text-slate-700 dark:text-slate-200">{item.valueLabel}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-500 dark:bg-[#0B1220] dark:text-slate-300">
                    لا توجد أوقات مسجلة لهذا الطلب.
                  </p>
                )}
              </DetailSection>

              <DetailSection title="إجراءات الطلب" icon={Check}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <OrderActionButton
                    action="complete"
                    availability={order.actionAvailability.complete}
                    busy={actionKey === `${order.id}:complete`}
                    icon={Check}
                    label="إكمال يدوي"
                    onClick={requestAction}
                    tone="success"
                  />
                  <OrderActionButton
                    action="refund"
                    availability={order.actionAvailability.refund}
                    busy={actionKey === `${order.id}:refund`}
                    icon={XCircle}
                    label="تسجيل الفشل والاسترداد"
                    onClick={requestAction}
                    tone="danger"
                  />
                  <OrderActionButton
                    action="retry"
                    availability={order.actionAvailability.retry}
                    busy={actionKey === `${order.id}:retry`}
                    icon={RefreshCw}
                    label="إعادة محاولة المورد"
                    onClick={requestAction}
                    tone="info"
                  />
                  <OrderActionButton
                    action="sync"
                    availability={order.actionAvailability.sync}
                    busy={actionKey === `${order.id}:sync`}
                    icon={CloudCog}
                    label="مزامنة حالة المورد"
                    onClick={requestAction}
                    tone="info"
                  />
                </div>
              </DetailSection>
            </>
          )}
        </div>
      </section>

      {confirmation && (
        <ConfirmActionDialog
          busy={busy}
          confirmation={confirmation}
          onCancel={() => setConfirmation(null)}
          onConfirm={confirmAction}
          reason={refundReason}
          setReason={setRefundReason}
        />
      )}
    </div>
  );
}

function getConfirmation(action, order) {
  const base = {
    action,
    title: "تأكيد الإجراء",
    confirmLabel: "تأكيد",
    message: "",
    tone: "info",
  };

  if (action === "complete") {
    return {
      ...base,
      confirmLabel: "إكمال الطلب",
      message: `هل تريد تسجيل الطلب ${order.displayId} كمكتمل؟ إذا كان المبلغ قد استُرد سابقًا فقد يُخصم مرة أخرى.`,
      tone: "success",
    };
  }

  if (action === "refund") {
    return {
      ...base,
      confirmLabel: "تسجيل الفشل والاسترداد",
      message: `هل تريد تسجيل فشل الطلب ${order.displayId} وترك الخادم ينفذ الاسترداد؟`,
      tone: "danger",
    };
  }

  if (action === "retry") {
    return {
      ...base,
      confirmLabel: "إعادة المحاولة",
      message: `هل تريد إعادة إرسال الطلب ${order.displayId} إلى المورد؟`,
    };
  }

  return {
    ...base,
    confirmLabel: "مزامنة الحالة",
    message: `هل تريد التحقق من حالة الطلب ${order.displayId} لدى المورد؟`,
  };
}

function DetailSection({ title, icon: Icon, children }) {
  return (
    <section className="mb-3 rounded-[22px] border border-slate-200/80 bg-white p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.035)] last:mb-0 sm:p-4 dark:border-white/[0.08] dark:bg-[#111827] dark:shadow-none">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-500/10 text-[#7C3AED] dark:text-[#C084FC]">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-black text-slate-950 dark:text-white">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function InfoItem({ label, value, icon: Icon, dir, wide = false }) {
  return (
    <div className={`min-w-0 rounded-xl border border-slate-100 bg-slate-50/75 p-2.5 dark:border-white/[0.06] dark:bg-[#0B1220]/70 ${wide ? "col-span-2 sm:col-span-3" : ""}`}>
      <dt className="flex items-center gap-1 text-[9px] font-black text-slate-400 dark:text-[#7C8598]">
        <Icon className="h-3 w-3 shrink-0" />
        {label}
      </dt>
      <dd dir={dir} title={String(value)} className={`mt-1 break-words text-[11px] font-black leading-5 text-slate-700 dark:text-slate-200 ${dir === "ltr" ? "text-right" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function OrderActionButton({ action, availability, busy, icon: Icon, label, onClick, tone }) {
  const enabled = availability?.enabled !== false;
  const toneClass = {
    danger: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300",
    info: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-300",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  }[tone];

  return (
    <button
      type="button"
      onClick={() => onClick(action)}
      disabled={!enabled || busy}
      title={!enabled ? availability?.reason : label}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-55 ${toneClass}`}
    >
      {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      <span>{busy ? "جارٍ التنفيذ..." : label}</span>
    </button>
  );
}

function ConfirmActionDialog({ busy, confirmation, onCancel, onConfirm, reason, setReason }) {
  const danger = confirmation.tone === "danger";
  const success = confirmation.tone === "success";

  return (
    <div className="fixed inset-0 z-[160] grid place-items-center bg-slate-950/70 p-4">
      <section className="w-full max-w-[460px] rounded-[26px] bg-white p-5 text-center shadow-2xl dark:bg-[#111827]">
        <span className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl ${danger ? "bg-rose-500/10 text-rose-600" : success ? "bg-emerald-500/10 text-emerald-600" : "bg-sky-500/10 text-sky-600"}`}>
          {danger ? <AlertTriangle className="h-6 w-6" /> : success ? <Check className="h-6 w-6" /> : <CloudCog className="h-6 w-6" />}
        </span>
        <h2 className="mt-3 text-sm font-black dark:text-white">{confirmation.title}</h2>
        <p className="mt-2 text-xs font-bold leading-6 text-slate-500 dark:text-slate-300">{confirmation.message}</p>
        {confirmation.action === "refund" && (
          <label className="mt-3 block text-right">
            <span className="mb-1 block text-[10px] font-black text-slate-500 dark:text-slate-300">سبب الرفض (اختياري)</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              placeholder="سيُحفظ السبب مع حالة الطلب في الخادم"
            />
          </label>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="h-11 rounded-xl border border-slate-200 text-[10px] font-black dark:border-white/10 dark:text-white">
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl text-[10px] font-black text-white disabled:opacity-60 ${danger ? "bg-rose-600" : success ? "bg-emerald-600" : "bg-sky-600"}`}
          >
            {busy && <RefreshCw className="h-4 w-4 animate-spin" />}
            {busy ? "جارٍ التنفيذ..." : confirmation.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
