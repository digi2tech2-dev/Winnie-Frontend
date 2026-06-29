import { motion } from "framer-motion";
import { CheckCircle2, Copy, ExternalLink, ReceiptText, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function PurchaseSuccessModal({ receipt, onClose, onViewOrder }) {
  const [copied, setCopied] = useState(false);
  const details = useMemo(() => {
    const submittedFields = Array.isArray(receipt.submittedFields)
      ? receipt.submittedFields.map((item) => ({ label: item.label, value: item.value }))
      : [];

    return [
      { label: "Product", value: receipt.productName },
      { label: "Status", value: receipt.statusLabel || receipt.status },
      { label: "Quantity", value: receipt.quantity },
      { label: "Total", value: receipt.totalLabel },
      ...submittedFields,
      { label: "Created at", value: receipt.createdAt, wide: true },
    ].filter((item) => item.value !== undefined && item.value !== null && item.value !== "");
  }, [receipt]);

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
      <motion.section
        dir="rtl"
        initial={{ opacity: 0, y: 34, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 34, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[430px] overflow-hidden rounded-[24px] border border-white/80 bg-[linear-gradient(145deg,#FFFFFF_0%,#F8FBFF_38%,#F6F3FF_68%,#F0FDFA_100%)] text-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.20),0_14px_42px_rgba(20,184,166,0.14)] ring-1 ring-[#BAE6FD]/45 dark:border-white/10 dark:bg-[linear-gradient(145deg,#07111F_0%,#0B1220_44%,#11162A_72%,#061A1D_100%)] dark:text-white dark:ring-white/10 dark:shadow-[0_28px_76px_rgba(2,6,23,0.54),0_0_38px_rgba(34,211,238,0.14)]"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#22D3EE,#7C3AED,#10B981,#FBBF24,#22D3EE)]" />

        <header className="relative overflow-hidden bg-[linear-gradient(135deg,#111827_0%,#5B21B6_42%,#0369A1_72%,#047857_100%)] p-4 text-white">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_34%,rgba(2,6,23,0.30)),linear-gradient(90deg,rgba(34,211,238,0.18),transparent_42%,rgba(16,185,129,0.16))]" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/25 bg-white/16 text-white shadow-[0_14px_32px_rgba(2,6,23,0.22)] ring-1 ring-white/20 backdrop-blur">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/72">Backend order created</p>
                <h2 className="mt-1 truncate text-xl font-black leading-tight">{receipt.productName}</h2>
                <p className="mt-0.5 text-xs font-bold text-white/82">{receipt.statusLabel || receipt.status}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/25 bg-white/16 text-white backdrop-blur transition hover:bg-white/25"
              aria-label="Close order success"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="relative p-3 sm:p-3.5">
          <section className="relative overflow-hidden rounded-[18px] border border-[#D8E7FF] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FBFF_48%,#EEF2FF_100%)] p-2.5 shadow-[0_12px_30px_rgba(14,165,233,0.09)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#0D1726,#101827,#171A2F)]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1 text-[10px] font-black text-[#7C3AED] dark:text-[#C084FC]">
                  <ReceiptText className="h-3.5 w-3.5" />
                  Order number
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
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </section>

          <section className="mt-2 grid grid-cols-2 gap-1.5">
            {details.map((item) => (
              <div
                key={`${item.label}-${item.value}`}
                className={`min-w-0 rounded-2xl border border-slate-200/80 bg-white/78 px-2.5 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.045)] dark:border-white/10 dark:bg-[#0B1220]/82 ${
                  item.wide ? "col-span-2" : ""
                }`}
              >
                <p className="text-[9.5px] font-black text-slate-500 dark:text-[#8A94A7]">{item.label}</p>
                <p className="mt-0.5 truncate text-[11px] font-black text-slate-950 dark:text-white" title={String(item.value)}>
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 flex-1 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 shadow-[0_10px_22px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:hover:bg-white/[0.09]"
            >
              Close
            </button>
            {onViewOrder ? (
              <button
                type="button"
                onClick={onViewOrder}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(56,189,248,0.10))] text-xs font-black text-emerald-700 shadow-[0_10px_22px_rgba(16,185,129,0.08)] transition hover:-translate-y-0.5 dark:text-emerald-300"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Details
              </button>
            ) : (
              <span className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(56,189,248,0.10))] text-xs font-black text-emerald-700 shadow-[0_10px_22px_rgba(16,185,129,0.08)] dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
