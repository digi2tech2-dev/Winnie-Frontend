import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Circle,
  X,
} from "lucide-react";
import { statusLabels } from "../../../data/adminDashboard";

const statusStyles = {
  pending: "border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-300",
  completed: "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  approved: "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  reviewing: "border-sky-500/25 bg-sky-500/12 text-sky-700 dark:text-sky-300",
  rejected: "border-rose-500/25 bg-rose-500/12 text-rose-700 dark:text-rose-300",
  active: "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  paused: "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  online: "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  degraded: "border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-300",
  healthy: "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
};

export function DashboardPanel({ children, className = "" }) {
  return <section className={`admin-panel ${className}`}>{children}</section>;
}

export function PanelHeading({ icon: Icon, title, action }) {
  return (
    <div className="admin-panel-heading flex items-center justify-between gap-2.5">
      <div className="flex min-w-0 items-center gap-2">
        {Icon && (
          <span className="admin-panel-heading-icon grid shrink-0 place-items-center bg-slate-950 text-white dark:bg-white dark:text-slate-950">
            <Icon className="admin-panel-heading-svg" />
          </span>
        )}
        <h2 className="admin-panel-title truncate font-black text-slate-950 dark:text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`admin-status-badge inline-flex items-center gap-1 rounded-md border font-black ${statusStyles[status] || statusStyles.reviewing}`}>
      <Circle className="admin-status-dot fill-current" />
      {statusLabels[status] || status}
    </span>
  );
}

export function ActionIconButton({ icon: Icon, label, tone = "neutral", onClick, disabled = false }) {
  const tones = {
    neutral: "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/16 dark:text-emerald-300",
    danger: "border-rose-500/25 bg-rose-500/10 text-rose-700 hover:bg-rose-500/16 dark:text-rose-300",
    warning: "border-amber-500/25 bg-amber-500/10 text-amber-700 hover:bg-amber-500/16 dark:text-amber-300",
    info: "border-sky-500/25 bg-sky-500/10 text-sky-700 hover:bg-sky-500/16 dark:text-sky-300",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`admin-action-icon-button grid shrink-0 place-items-center border transition disabled:cursor-not-allowed disabled:opacity-45 ${tones[tone] || tones.neutral}`}
      aria-label={label}
      title={label}
    >
      <Icon className="admin-action-icon" />
    </button>
  );
}

export function ChangePill({ value = 0, inverse = false }) {
  const numericValue = Number.isFinite(value) ? value : 0;
  const positive = numericValue >= 0;
  const good = inverse ? !positive : positive;
  const Icon = positive ? ArrowUp : ArrowDown;

  return (
    <span
      dir="ltr"
      className={`inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] font-black ${
        good
          ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
          : "bg-rose-500/12 text-rose-700 dark:text-rose-300"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(numericValue).toFixed(1)}%
    </span>
  );
}

export function MetricCard({ metric, rangeKey }) {
  const Icon = metric.icon;
  const showChange = metric.change !== null && metric.change !== undefined && !metric.unavailable;

  return (
    <motion.article
      key={`${metric.id}-${rangeKey}-${metric.value}`}
      initial={{ opacity: 0, y: 10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`admin-metric-card ${metric.accent || ""}`}
    >
      <div className="admin-metric-top">
        <span className={`admin-metric-icon ${metric.tone || ""}`}>
          <Icon className="h-5 w-5" />
        </span>
        <p className="admin-metric-label">{metric.label}</p>
      </div>
      <p dir="ltr" className="admin-metric-value" title={metric.value}>{metric.value}</p>
      {metric.description ? <p className="admin-metric-description">{metric.description}</p> : null}
      <div className="admin-metric-footer">
        {showChange ? (
          <ChangePill value={metric.change} inverse={metric.inverse} />
        ) : (
          <span className={`admin-metric-live ${metric.unavailable ? "is-unavailable" : ""}`}>
            {metric.unavailable ? "غير متاح" : "مباشر"}
          </span>
        )}
        <span className="admin-metric-rail" aria-hidden="true" />
      </div>
    </motion.article>
  );
}

export function EmptyStateInline({ text }) {
  return (
    <div className="admin-empty-state grid place-items-center rounded-lg border border-dashed border-slate-200 font-bold text-slate-400 dark:border-white/10">
      {text}
    </div>
  );
}

export function ModalShell({ title, children, onClose, footer }) {
  return (
    <div className="fixed inset-0 z-[180] grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        className="admin-modal"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <h2 className="truncate text-base font-black text-slate-950 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="admin-icon-button"
            aria-label="إغلاق"
            title="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[72vh] overflow-y-auto p-4">{children}</div>
        {footer && <div className="border-t border-slate-200 px-4 py-3 dark:border-white/10">{footer}</div>}
      </motion.div>
    </div>
  );
}

export function ConfirmFooter({ onCancel, onConfirm, confirmLabel = "تنفيذ", tone = "success" }) {
  const classes = {
    success: "bg-emerald-600 hover:bg-emerald-700",
    danger: "bg-rose-600 hover:bg-rose-700",
    warning: "bg-amber-500 hover:bg-amber-600",
    info: "bg-sky-600 hover:bg-sky-700",
  };

  return (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="admin-secondary-button">
        إلغاء
      </button>
      <button type="button" onClick={onConfirm} className={`admin-primary-button ${classes[tone] || classes.success}`}>
        {confirmLabel}
      </button>
    </div>
  );
}

export function LowBalanceNotice({ show }) {
  if (!show) return null;

  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/12 px-2 text-[11px] font-black text-amber-700 dark:text-amber-300">
      <AlertTriangle className="h-3.5 w-3.5" />
      منخفض
    </span>
  );
}

export function InlineResult({ type = "success", text }) {
  const Icon = type === "success" ? Check : AlertTriangle;

  return (
    <p
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${
        type === "success"
          ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
          : "bg-amber-500/12 text-amber-700 dark:text-amber-300"
      }`}
    >
      <Icon className="h-4 w-4" />
      {text}
    </p>
  );
}
