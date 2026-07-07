import { Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}) {
  const { t } = useTranslation("common");
  const resolvedTitle = title || t("empty.defaultTitle");
  const resolvedDescription = description || t("empty.defaultDescription");

  return (
    <div className="glass-panel grid place-items-center rounded-lg p-8 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-lg bg-royal/12 text-royal dark:bg-pulse/15 dark:text-pulse">
        <Icon className="h-8 w-8" />
      </span>
      <h2 className="mt-5 text-2xl font-black">{resolvedTitle}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        {resolvedDescription}
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
