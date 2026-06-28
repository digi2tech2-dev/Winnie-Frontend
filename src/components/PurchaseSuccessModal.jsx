import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, CheckCircle2, Copy, MessageSquareText, ReceiptText, Send, ShieldCheck, Sparkles, Star, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { addCustomerReview, getReviewerAvatarUrl, getReviewerInitial, getStoredProfileAvatar } from "../utils/customerReviews";
import { iconMap } from "./icons";

const fallbackReviewerName = "Winnie Customer";
const detailListVariants = {
  show: {
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.08,
    },
  },
};
const detailItemVariants = {
  hidden: { opacity: 0, x: 12 },
  show: { opacity: 1, x: 0 },
};
const headerAccents = [
  "right-20 top-4 h-0.5 w-12 bg-white/50",
  "left-20 bottom-5 h-0.5 w-14 bg-cyan-100/45",
  "left-9 top-8 h-2.5 w-2.5 rotate-45 border border-white/55",
  "right-36 bottom-7 h-2 w-2 rotate-45 border border-emerald-200/55",
];
const cardEdgeLights = [
  "right-0 top-10 h-16 w-px bg-[linear-gradient(180deg,transparent,#22D3EE,transparent)]",
  "left-0 bottom-12 h-16 w-px bg-[linear-gradient(180deg,transparent,#A78BFA,transparent)]",
  "bottom-0 right-12 h-px w-24 bg-[linear-gradient(90deg,transparent,#10B981,transparent)]",
];

export default function PurchaseSuccessModal({ receipt, onClose }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewNotice, setReviewNotice] = useState(null);
  const ProductIcon = iconMap[receipt.product?.icon] || iconMap.ShoppingBag;
  const storedAvatarUrl = useMemo(() => getStoredProfileAvatar(), []);
  const reviewerName = user?.name || fallbackReviewerName;
  const reviewerAvatarUrl = getReviewerAvatarUrl(user, storedAvatarUrl);
  const reviewerAvatarInitial = getReviewerInitial(user, reviewerName);

  const details = useMemo(
    () => [
      { label: "المنتج", value: receipt.productName },
      { label: "القسم", value: receipt.categoryLabel },
      { label: "الباقة", value: receipt.packageLabel },
      { label: "الكمية", value: receipt.quantity },
      { label: "الأيدي / رقم الحساب", value: receipt.accountId },
      { label: "الإجمالي", value: receipt.totalLabel },
      { label: "وقت العملية", value: receipt.createdAt, wide: true },
    ],
    [receipt],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const copyOrderId = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(receipt.orderId);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = receipt.orderId;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const chooseRating = (value) => {
    setRating(value);
    setReviewOpen(true);
    setReviewNotice(null);
  };

  const submitReview = (event) => {
    event.preventDefault();
    const safeMessage = reviewText.trim();

    if (!rating) {
      setReviewNotice({
        type: "error",
        message: "اختار عدد النجوم قبل إرسال التقييم.",
      });
      return;
    }

    if (!safeMessage) {
      setReviewNotice({
        type: "error",
        message: "اكتب رأيك أو تجربتك قبل إرسال التقييم.",
      });
      return;
    }

    addCustomerReview({
      id: `purchase-review-${Date.now()}`,
      name: reviewerName,
      rating,
      message: safeMessage,
      createdAt: Date.now(),
      avatarInitial: reviewerAvatarInitial,
      avatarUrl: reviewerAvatarUrl,
      userId: user?.id,
      orderId: receipt.orderId,
      productName: receipt.productName,
      source: "purchase",
    });

    setReviewNotice({
      type: "success",
      message: "تم نشر تقييمك في الصفحة الرئيسية.",
    });
    setReviewText("");
  };

  return (
    <motion.div
      className="fixed inset-0 z-[160] grid place-items-center overflow-y-auto bg-[#050816]/82 px-3 py-4 backdrop-blur-lg backdrop-brightness-[0.50] backdrop-saturate-[0.35]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="pointer-events-none fixed inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.14)_0_1px,transparent_1px_3px),repeating-linear-gradient(90deg,rgba(255,255,255,0.10)_0_1px,transparent_1px_4px)]" />
      <motion.section
        dir="rtl"
        initial={{ opacity: 0, y: 34, scale: 0.94, rotateX: 7 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        exit={{ opacity: 0, y: 34, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[430px] overflow-hidden rounded-[24px] border border-white/80 bg-[linear-gradient(145deg,#FFFFFF_0%,#F8FBFF_38%,#F6F3FF_68%,#F0FDFA_100%)] text-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.20),0_14px_42px_rgba(20,184,166,0.14)] ring-1 ring-[#BAE6FD]/45 dark:border-white/10 dark:bg-[linear-gradient(145deg,#07111F_0%,#0B1220_44%,#11162A_72%,#061A1D_100%)] dark:text-white dark:ring-white/10 dark:shadow-[0_28px_76px_rgba(2,6,23,0.54),0_0_38px_rgba(34,211,238,0.14)]"
      >
        {cardEdgeLights.map((className, index) => (
          <motion.span
            key={className}
            className={`pointer-events-none absolute z-[1] ${className}`}
            animate={{ opacity: [0.12, 0.9, 0.12], scale: [0.72, 1.06, 0.72] }}
            transition={{ duration: 2.5 + index * 0.3, repeat: Infinity, ease: "easeInOut", delay: index * 0.35 }}
          />
        ))}
        <motion.div
          className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#22D3EE,#7C3AED,#10B981,#FBBF24,#22D3EE)] bg-[length:220%_100%]"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "linear" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.20)_28%,transparent_54%)] opacity-60 dark:opacity-20" />

        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#111827_0%,#5B21B6_42%,#0369A1_72%,#047857_100%)] p-3.5 text-white sm:p-4">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_34%,rgba(2,6,23,0.30)),linear-gradient(90deg,rgba(34,211,238,0.18),transparent_42%,rgba(16,185,129,0.16))]" />
          {headerAccents.map((className, index) => (
            <motion.span
              key={className}
              className={`pointer-events-none absolute rounded-sm ${className}`}
              animate={{ opacity: [0.18, 0.85, 0.18], x: [0, index % 2 === 0 ? -8 : 8, 0], scaleX: [0.72, 1.12, 0.72] }}
              transition={{ duration: 2.4 + index * 0.25, repeat: Infinity, ease: "easeInOut", delay: index * 0.22 }}
            />
          ))}
          <motion.div
            className="pointer-events-none absolute inset-y-0 -right-1/3 w-1/2 skew-x-[-18deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.34),transparent)]"
            animate={{ x: ["0%", "260%"] }}
            transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.1, ease: "easeInOut" }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <motion.span
                initial={{ scale: 0.72, rotate: -12 }}
                animate={{ scale: [1, 1.05, 1], rotate: [0, -2, 2, 0] }}
                transition={{ scale: { duration: 2.2, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 3, repeat: Infinity, repeatDelay: 0.7, ease: "easeInOut" } }}
                className="relative grid h-12 w-12 shrink-0 place-items-center rounded-[18px] border border-white/35 bg-white/18 shadow-[0_14px_34px_rgba(2,6,23,0.24)] backdrop-blur-md"
              >
                <motion.span
                  className="absolute inset-[-3px] rounded-[21px] border border-white/35"
                  animate={{ opacity: [0.15, 0.55, 0.15], scale: [0.96, 1.06, 0.96] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <ProductIcon className="h-7 w-7 drop-shadow-[0_10px_18px_rgba(2,6,23,0.32)]" />
              </motion.span>
              <div className="min-w-0">
                <motion.span
                  className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/16 px-2 py-0.5 text-[9px] font-black text-white/90 backdrop-blur"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.22, 1], rotate: [0, 9, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                  </motion.span>
                  تمت العملية بنجاح
                </motion.span>
                <motion.h2
                  className="mt-1 text-xl font-black leading-tight drop-shadow-[0_8px_18px_rgba(2,6,23,0.18)] sm:text-2xl"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                >
                  تم الشراء
                </motion.h2>
                <motion.p
                  className="mt-0.5 truncate text-xs font-bold text-white/82"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 }}
                >
                  {receipt.productName}
                </motion.p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/25 bg-white/16 text-white backdrop-blur transition hover:bg-white/25"
              aria-label="إغلاق نافذة تمت العملية"
              title="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative p-3 sm:p-3.5">
          <motion.div
            className="relative overflow-hidden rounded-[18px] border border-[#D8E7FF] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FBFF_48%,#EEF2FF_100%)] p-2.5 shadow-[0_12px_30px_rgba(14,165,233,0.09)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#0D1726,#101827,#171A2F)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <motion.span
              className="pointer-events-none absolute inset-y-0 -right-12 w-20 rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)] dark:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]"
              animate={{ x: ["0%", "420%"] }}
              transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 2.4, ease: "easeInOut" }}
            />
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1 text-[10px] font-black text-[#7C3AED] dark:text-[#C084FC]">
                  <ReceiptText className="h-3.5 w-3.5" />
                  رقم العملية
                </p>
                <p dir="ltr" className="mt-0.5 text-right text-lg font-black tracking-normal text-slate-950 dark:text-white">
                  {receipt.orderId}
                </p>
              </div>
              <button
                type="button"
                onClick={copyOrderId}
                className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#111827,#2563EB_52%,#14B8A6)] px-2.5 text-[11px] font-black text-white shadow-[0_10px_24px_rgba(20,184,166,0.20)] transition hover:-translate-y-0.5"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "تم النسخ" : "نسخ الرقم"}
              </button>
            </div>
          </motion.div>

          <motion.div
            className="mt-2 grid grid-cols-2 gap-1.5"
            variants={detailListVariants}
            initial="hidden"
            animate="show"
          >
            {details.map((item) => (
              <motion.div
                key={item.label}
                variants={detailItemVariants}
                className={`min-w-0 rounded-2xl border border-slate-200/80 bg-white/78 px-2.5 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-[#67E8F9] hover:shadow-[0_12px_24px_rgba(20,184,166,0.10)] dark:border-white/10 dark:bg-[#0B1220]/82 dark:hover:border-[#22D3EE]/40 ${
                  item.wide ? "col-span-2" : ""
                }`}
              >
                <p className="text-[9.5px] font-black text-slate-500 dark:text-[#8A94A7]">{item.label}</p>
                <p className="mt-0.5 truncate text-[11px] font-black text-slate-950 dark:text-white" title={String(item.value)}>
                  {item.value}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="relative mt-2.5 overflow-hidden rounded-[18px] border border-[#BAE6FD] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FAFC_48%,#ECFEFF_100%)] p-2.5 shadow-[0_12px_30px_rgba(14,165,233,0.10)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#0B1220,#111827,#071926)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="inline-flex items-center gap-1 text-xs font-black text-slate-950 dark:text-white">
                  <BadgeCheck className="h-4 w-4 text-[#7C3AED] dark:text-[#C084FC]" />
                  تقييم العملية
                </p>
                <p className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-[#8A94A7]">اضغط النجوم لكتابة رأيك.</p>
              </div>
              <div className="flex items-center gap-1">
                <motion.span
                  animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.12, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
                  className="hidden text-[#F59E0B] sm:block"
                >
                  <Sparkles className="h-4 w-4" />
                </motion.span>
                <StarRating value={rating} onChoose={chooseRating} />
              </div>
            </div>

          </motion.div>

          <motion.div
            className="mt-3 flex gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="h-9 flex-1 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 shadow-[0_10px_22px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:hover:bg-white/[0.09]"
            >
              إغلاق
            </button>
            <span className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(56,189,248,0.10))] text-xs font-black text-emerald-700 shadow-[0_10px_22px_rgba(16,185,129,0.08)] dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              تفاصيل العملية محفوظة
            </span>
          </motion.div>
        </div>
      </motion.section>

      <AnimatePresence>
        {reviewOpen && (
          <ReviewFloatingModal
            rating={rating}
            reviewText={reviewText}
            reviewNotice={reviewNotice}
            reviewerName={reviewerName}
            productName={receipt.productName}
            onChooseRating={chooseRating}
            onClose={() => setReviewOpen(false)}
            onTextChange={(value) => {
              setReviewText(value);
              if (reviewNotice?.type === "error") setReviewNotice(null);
            }}
            onSubmit={submitReview}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ReviewFloatingModal({ rating, reviewText, reviewNotice, reviewerName, productName, onChooseRating, onClose, onTextChange, onSubmit }) {
  return (
    <motion.div
      className="fixed inset-0 z-[180] grid place-items-center bg-[#050816]/84 px-3 backdrop-blur-lg backdrop-brightness-[0.48] backdrop-saturate-[0.35]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <div className="pointer-events-none fixed inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.14)_0_1px,transparent_1px_3px),repeating-linear-gradient(90deg,rgba(255,255,255,0.10)_0_1px,transparent_1px_4px)]" />
      <motion.form
        dir="rtl"
        initial={{ opacity: 0, y: -18, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[392px] overflow-hidden rounded-[24px] border border-[#BAE6FD]/80 bg-[linear-gradient(145deg,#FFFFFF_0%,#F8FBFF_34%,#F6F3FF_62%,#ECFEFF_100%)] p-3.5 text-slate-950 shadow-[0_30px_92px_rgba(15,23,42,0.24),0_16px_42px_rgba(20,184,166,0.16)] ring-1 ring-white/80 dark:border-white/10 dark:bg-[linear-gradient(145deg,#07111F,#0B1220_42%,#12172D_72%,#061A1D)] dark:text-white dark:ring-white/10 dark:shadow-[0_30px_80px_rgba(2,6,23,0.56),0_0_38px_rgba(34,211,238,0.14)]"
      >
        {cardEdgeLights.map((className, index) => (
          <motion.span
            key={`review-${className}`}
            className={`pointer-events-none absolute z-[1] ${className}`}
            animate={{ opacity: [0.12, 0.86, 0.12], scale: [0.72, 1.06, 0.72] }}
            transition={{ duration: 2.6 + index * 0.32, repeat: Infinity, ease: "easeInOut", delay: index * 0.32 }}
          />
        ))}
        <motion.div
          className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#22D3EE,#7C3AED,#10B981,#FBBF24,#22D3EE)] bg-[length:220%_100%]"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.10),transparent_36%,rgba(124,58,237,0.07)_66%,transparent)] dark:bg-[linear-gradient(135deg,rgba(34,211,238,0.08),transparent_36%,rgba(16,185,129,0.07)_68%,transparent)]" />

        <div className="relative -m-3.5 mb-3 overflow-hidden bg-[linear-gradient(135deg,#111827_0%,#2563EB_46%,#0F766E_100%)] p-3.5 text-white">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.18),transparent_36%,rgba(34,211,238,0.14)_70%,transparent)]" />
          <motion.span
            className="pointer-events-none absolute inset-y-0 -right-16 w-20 rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.34),transparent)]"
            animate={{ x: ["0%", "420%"] }}
            transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
            <motion.span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/25 bg-white/16 text-white shadow-[0_14px_32px_rgba(2,6,23,0.22)] ring-1 ring-white/20 backdrop-blur"
              animate={{ y: [0, -2, 0], rotate: [0, -3, 3, 0] }}
              transition={{ duration: 2.7, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
            >
              <MessageSquareText className="h-5 w-5" />
            </motion.span>
            <div className="min-w-0">
              <h3 className="text-lg font-black text-white">اكتب تقييمك</h3>
              <p className="mt-0.5 text-xs font-bold text-white/74">تقييم عملية شراء {productName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/25 bg-white/16 text-white shadow-[0_8px_18px_rgba(2,6,23,0.16)] transition hover:-translate-y-0.5 hover:bg-white/25"
            aria-label="إغلاق نافذة التقييم"
            title="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
          </div>
        </div>

        <div className="relative grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="rounded-2xl border border-[#D8E7FF] bg-[linear-gradient(135deg,#FFFFFF,#F8FBFF)] px-3 py-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.035))]">
            <p className="text-[10px] font-black text-slate-500 dark:text-[#9AA7BD]">سيتم النشر باسم</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-black text-slate-950 dark:text-white">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#ECFEFF] text-[#0E7490] dark:bg-[#083344] dark:text-[#67E8F9]">
                <UserRound className="h-3.5 w-3.5" />
              </span>
              {reviewerName}
            </p>
          </div>
          <div className="rounded-2xl border border-[#BAE6FD] bg-[linear-gradient(135deg,#ECFEFF,#FFFFFF)] px-3 py-2.5 shadow-[0_10px_24px_rgba(14,165,233,0.08)] dark:border-[#22D3EE]/20 dark:bg-[linear-gradient(135deg,rgba(34,211,238,0.11),rgba(255,255,255,0.035))]">
            <p className="text-[10px] font-black text-[#92400E] dark:text-[#FCD34D]">عدد النجوم</p>
            <StarRating value={rating} onChoose={onChooseRating} compact />
          </div>
        </div>

        <label className="relative mt-3 block">
          <span className="mb-1.5 block text-xs font-black text-slate-700 dark:text-[#D7DEEA]">رأيك أو رسالتك</span>
          <textarea
            value={reviewText}
            onChange={(event) => onTextChange(event.target.value)}
            rows={4}
            className="min-h-[112px] w-full resize-none rounded-2xl border border-[#E0E7FF] bg-white/90 px-3 py-3 text-sm font-bold text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_10px_24px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:border-[#A855F7]/70 focus:ring-4 focus:ring-[#EDE9FE] dark:border-white/10 dark:bg-[#050816]/92 dark:text-white dark:focus:border-[#A855F7]/80 dark:focus:ring-[#8B5CF6]/20"
            placeholder="اكتب تجربتك معنا..."
          />
        </label>

        {reviewNotice && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative mt-2 rounded-2xl border px-3 py-2 text-xs font-black ${
              reviewNotice.type === "success"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-amber-500/30 bg-amber-500/12 text-amber-800 dark:text-amber-300"
            }`}
          >
            {reviewNotice.message}
          </motion.p>
        )}

        <button
          type="submit"
          className="relative mt-3 inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#111827,#2563EB_44%,#0F766E_78%,#38BDF8)] text-sm font-black text-white shadow-[0_18px_42px_rgba(37,99,235,0.22),0_10px_26px_rgba(20,184,166,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(56,189,248,0.20)]"
        >
          <motion.span
            className="pointer-events-none absolute inset-y-0 -right-16 w-20 rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.34),transparent)]"
            animate={{ x: ["0%", "430%"] }}
            transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }}
          />
          <Send className="h-4 w-4" />
          إرسال التقييم
        </button>
      </motion.form>
    </motion.div>
  );
}

function StarRating({ value, onChoose, compact = false }) {
  return (
    <div className={`flex items-center ${compact ? "gap-0.5 pt-1" : "gap-1.5"}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const selected = star <= value;

        return (
          <motion.button
            key={star}
            type="button"
            whileHover={{ y: -2, scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onChoose(star)}
            className={`grid shrink-0 place-items-center rounded-xl transition ${
              compact ? "h-8 w-8" : "h-8 w-8 sm:h-9 sm:w-9"
            } ${
              selected
                ? "bg-[#FEF3C7] text-[#F59E0B] shadow-[0_10px_22px_rgba(245,158,11,0.20)] dark:bg-[#422006] dark:text-[#FBBF24]"
                : "bg-white text-slate-300 hover:text-[#F59E0B] dark:bg-white/[0.07] dark:text-[#677189] dark:hover:text-[#FBBF24]"
            }`}
            aria-label={`تقييم ${star} نجوم`}
            title={`${star} نجوم`}
          >
            <Star className={`${compact ? "h-4 w-4" : "h-4 w-4 sm:h-[18px] sm:w-[18px]"} ${selected ? "fill-current" : ""}`} />
          </motion.button>
        );
      })}
    </div>
  );
}
