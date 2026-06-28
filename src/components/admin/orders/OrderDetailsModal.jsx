import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AtSign,
  Bot,
  CalendarClock,
  Check,
  CircleUserRound,
  CloudCog,
  Hash,
  Mail,
  Package,
  RefreshCw,
  Save,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { executionTypeLabels } from "../../../data/adminOrders";
import StatusBadge from "./StatusBadge";

const priceFormatter = new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function OrderDetailsModal({ order, onClose, onSaveStatus }) {
  if (!order) return null;

  return createPortal(
    <OrderDetailsModalContent key={order.id} order={order} onClose={onClose} onSaveStatus={onSaveStatus} />,
    document.body,
  );
}

function OrderDetailsModalContent({ order, onClose, onSaveStatus }) {
  const normalizedOrderStatus = normalizeEditableStatus(order.status);
  const [selectedStatus, setSelectedStatus] = useState(normalizedOrderStatus);
  const [isSaving, setIsSaving] = useState(false);
  const closeButtonRef = useRef(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSavingRef.current) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleSave = async () => {
    isSavingRef.current = true;
    setIsSaving(true);
    await onSaveStatus(order.id, selectedStatus);
    isSavingRef.current = false;
    setIsSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[4px] sm:items-center sm:p-5 dark:bg-[#02040C]/75"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        className="flex max-h-[94dvh] w-full max-w-[760px] flex-col overflow-hidden rounded-t-[28px] border border-white/70 bg-[#F8FAFC] shadow-[0_34px_100px_rgba(15,23,42,0.34)] sm:max-h-[90vh] sm:rounded-[30px] dark:border-white/10 dark:bg-[#080D19] dark:shadow-[0_0_50px_rgba(139,92,246,0.20)]"
      >
        <header className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-white px-4 py-4 sm:px-6 dark:border-white/[0.08] dark:bg-[#111827]">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[#8B5CF6] via-[#3B82F6] to-[#22C55E]" aria-hidden="true" />
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] text-white shadow-[0_10px_24px_rgba(124,58,237,0.22)]">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-[#8A94A7]">تفاصيل الطلب</p>
              <h2 id="order-details-title" dir="ltr" className="mt-0.5 truncate text-right text-xl font-black text-slate-950 dark:text-white">
                {order.id}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={order.status} compact />
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-black text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300">
                  {order.executionType === "automatic" ? <Bot className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
                  {executionTypeLabels[order.executionType]}
                </span>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
              aria-label="إغلاق تفاصيل الطلب"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto overscroll-contain p-3.5 sm:p-6">
          <DetailSection title="المنتج" icon={Package}>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2.5 dark:border-white/[0.07] dark:bg-[#0B1220]">
              <img src={order.productImage} alt={order.product} className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-sm sm:h-24 sm:w-28" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black leading-5 text-slate-950 sm:text-base dark:text-white">{order.product}</h3>
                <p dir="ltr" className="mt-1 text-right text-xl font-black text-[#7C3AED] dark:text-[#C084FC]">{priceFormatter.format(order.price)}</p>
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-black text-slate-500 dark:text-slate-400">
                  {order.executionType === "automatic" ? <Bot className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
                  تنفيذ {executionTypeLabels[order.executionType]}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-3 dark:border-sky-400/10 dark:bg-sky-500/[0.05]">
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white bg-white p-1 shadow-sm dark:border-white/10 dark:bg-[#111827]">
                <img src={order.accountImage} alt="صورة الحساب" className="h-full w-full object-contain" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black text-slate-950 dark:text-white">{order.accountName}</p>
                <p dir="ltr" className="mt-1 truncate text-right text-[10px] font-bold text-slate-500 dark:text-slate-400">{order.accountId}</p>
                <p dir="ltr" className="mt-0.5 truncate text-right text-[10px] font-bold text-slate-500 dark:text-slate-400">{order.accountEmail}</p>
              </div>
            </div>
          </DetailSection>

          <DetailSection title="تفاصيل التنفيذ" icon={CloudCog}>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <InfoItem label="رقم الطلب" value={order.id} icon={Hash} dir="ltr" />
              <InfoItem label="تاريخ الطلب" value={dateFormatter.format(new Date(order.createdAt))} icon={CalendarClock} />
              <InfoItem label="الكمية" value={order.quantity.toLocaleString("ar-EG")} icon={Package} />
              <InfoItem label="معرف المستخدم" value={order.userId} icon={AtSign} dir="ltr" />
              <InfoItem label="مزود الخدمة" value={order.provider} icon={CloudCog} />
              <InfoItem label="طلب المورد" value={order.providerOrderId} icon={Hash} dir="ltr" />
              <InfoItem label="مزامنة المورد" value={order.supplierSync} icon={RefreshCw} wide />
            </dl>
          </DetailSection>

          <DetailSection title="بيانات المستخدم" icon={CircleUserRound}>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <InfoItem label="اسم المستخدم" value={order.username} icon={UserRound} />
              <InfoItem label="معرف اللاعب" value={order.playerId} icon={CircleUserRound} dir="ltr" />
              <InfoItem label="البريد الإلكتروني" value={order.userEmail} icon={Mail} dir="ltr" wide />
            </dl>
          </DetailSection>

          <DetailSection title="حالة الطلب" icon={Check}>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-black text-slate-600 dark:text-slate-300">تحديث الحالة</span>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                disabled={isSaving}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-950 outline-none transition focus:border-[#8B5CF6]/65 focus:ring-4 focus:ring-[#8B5CF6]/10 disabled:opacity-60 dark:border-white/10 dark:bg-[#0B1220] dark:text-white"
              >
                <option value="manual_review">بنتظر المراجعة</option>
                <option value="processing">قيد التنفيذ</option>
                <option value="completed">مكتمل</option>
                <option value="rejected">مرفوض</option>
              </select>
            </label>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || selectedStatus === normalizedOrderStatus}
              className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#7C3AED] to-[#3B82F6] text-xs font-black text-white shadow-[0_12px_28px_rgba(124,58,237,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "جاري الحفظ..." : "حفظ الحالة"}
            </button>
          </DetailSection>
        </div>
      </section>
    </div>
  );
}

function normalizeEditableStatus(status) {
  return ["manual_review", "processing", "completed", "rejected"].includes(status) ? status : "manual_review";
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
