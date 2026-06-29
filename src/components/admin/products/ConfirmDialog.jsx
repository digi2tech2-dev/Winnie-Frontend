import { AlertTriangle, Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";

export default function ConfirmDialog({ open, title, message, confirmLabel = "تأكيد الحذف", onConfirm, onCancel, tone = "danger", busy = false }) {
  if (!open) return null;

  const isDanger = tone === "danger";

  return createPortal(
    <div className="fixed inset-0 z-[180] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-[4px] dark:bg-[#02040C]/80" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" className="w-full max-w-[420px] rounded-[26px] border border-white/70 bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.30)] dark:border-white/10 dark:bg-[#111827] dark:shadow-[0_0_42px_rgba(139,92,246,0.18)]">
        <div className="flex items-start gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${isDanger ? "bg-rose-500/10 text-rose-600 dark:text-rose-300" : "bg-orange-500/10 text-orange-600 dark:text-orange-300"}`}>
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-lg font-black text-slate-950 dark:text-white">{title}</h2>
            <p className="mt-1.5 text-xs font-bold leading-6 text-slate-500 dark:text-[#9AA7BD]">{message}</p>
          </div>
          <button type="button" onClick={onCancel} disabled={busy} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/[0.07] dark:hover:text-white" aria-label="إلغاء">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button type="button" onClick={onCancel} disabled={busy} className="h-11 rounded-2xl border border-slate-200 bg-white text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]">إلغاء</button>
          <button type="button" onClick={onConfirm} disabled={busy} className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl text-xs font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${isDanger ? "bg-gradient-to-l from-rose-600 to-red-500 shadow-rose-500/20" : "bg-gradient-to-l from-orange-600 to-amber-500 shadow-orange-500/20"}`}>
            <Trash2 className="h-4 w-4" />
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
