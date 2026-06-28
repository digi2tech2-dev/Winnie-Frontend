import { Inbox } from "lucide-react";

export default function EmptyState({
  title = "لا يوجد شيء هنا بعد",
  description = "عند توفر بيانات جديدة ستظهر هنا.",
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}) {
  return (
    <div className="glass-panel grid place-items-center rounded-lg p-8 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-lg bg-royal/12 text-royal dark:bg-pulse/15 dark:text-pulse">
        <Icon className="h-8 w-8" />
      </span>
      <h2 className="mt-5 text-2xl font-black">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="interactive-ring mt-5 h-11 rounded-lg bg-gradient-to-r from-royal to-pulse px-5 text-sm font-black text-white shadow-glow"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
