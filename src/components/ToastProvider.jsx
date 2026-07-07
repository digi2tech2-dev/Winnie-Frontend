import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const ToastContext = createContext(null);

const toastIcons = {
  success: CheckCircle2,
  error: CircleAlert,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: "border-emerald-500/25 bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
  error: "border-rose-500/25 bg-rose-500/12 text-rose-600 dark:text-rose-300",
  warning: "border-amber-500/30 bg-amber-500/14 text-amber-700 dark:text-amber-300",
  info: "border-blue-500/25 bg-blue-500/12 text-blue-600 dark:text-blue-300",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const { t } = useTranslation("common");

  const removeToast = useCallback((id) => {
    setToasts((items) => items.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    ({ title, message, type = "info", duration = 3600 }) => {
      const id = crypto.randomUUID();
      setToasts((items) => [...items, { id, title, message, type }]);
      window.setTimeout(() => removeToast(id), duration);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ clearToasts, showToast }), [clearToasts, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed left-4 top-24 z-[160] flex w-[min(92vw,380px)] flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = toastIcons[toast.type] || toastIcons.info;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: -24, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24, scale: 0.96 }}
                className="pointer-events-auto rounded-lg border border-slate-200 bg-white p-4 shadow-soft dark:border-[rgba(255,255,255,0.08)] dark:bg-[#111827] dark:shadow-[0_0_20px_rgba(139,92,246,0.20)]"
              >
                <div className="flex gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${toastStyles[toast.type]}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-black">{toast.title}</p>
                    {toast.message && (
                      <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                        {toast.message}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeToast(toast.id)}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-[#8A94A7] dark:hover:bg-[#1A2335] dark:hover:text-white"
                    aria-label={t("toast.close")}
                    title={t("actions.close")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
