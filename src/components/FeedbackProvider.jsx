import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, CircleAlert, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const FeedbackContext = createContext(null);

const modalConfig = {
  success: {
    icon: CheckCircle2,
    tone: "from-emerald-400 to-teal-600",
    button: "bg-emerald-500 hover:bg-emerald-600",
  },
  error: {
    icon: CircleAlert,
    tone: "from-rose-500 to-red-700",
    button: "bg-rose-500 hover:bg-rose-600",
  },
  warning: {
    icon: AlertTriangle,
    tone: "from-amber-400 to-orange-600",
    button: "bg-amber-500 hover:bg-amber-600",
  },
};

export function FeedbackProvider({ children }) {
  const [modal, setModal] = useState(null);
  const { t } = useTranslation("common");

  const showFeedback = useCallback((nextModal) => {
    setModal({ type: "success", confirmLabel: t("feedback.done"), ...nextModal });
  }, [t]);

  const closeFeedback = useCallback(() => setModal(null), []);

  const value = useMemo(() => ({ showFeedback, closeFeedback }), [showFeedback, closeFeedback]);

  const config = modal ? modalConfig[modal.type] || modalConfig.success : modalConfig.success;
  const Icon = config.icon;

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {modal && (
          <motion.div
            className="fixed inset-0 z-[160] grid place-items-center bg-[#050816] px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              className="w-full max-w-md rounded-lg border border-sky-100 bg-white p-6 text-slate-950 shadow-soft dark:border-white/[0.08] dark:bg-[#111827] dark:text-[#F8F9FA] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className={`grid h-14 w-14 place-items-center rounded-lg bg-gradient-to-br ${config.tone} text-white shadow-glow`}>
                  <Icon className="h-7 w-7" />
                </span>
                <button
                  type="button"
                  onClick={closeFeedback}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-[rgba(255,255,255,0.08)] dark:text-[#8A94A7] dark:hover:bg-[#1A2335] dark:hover:text-white"
                  aria-label={t("feedback.closeWindow")}
                  title={t("actions.close")}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <h2 className="mt-6 text-2xl font-black">{modal.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {modal.message}
              </p>
              <div className="mt-6 flex justify-end gap-3">
                {modal.cancelLabel && (
                  <button
                    type="button"
                    onClick={closeFeedback}
                    className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-black dark:border-white/10"
                  >
                    {modal.cancelLabel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    modal.onConfirm?.();
                    closeFeedback();
                  }}
                  className={`h-11 rounded-lg px-5 text-sm font-black text-white transition ${config.button}`}
                >
                  {modal.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return context;
}
