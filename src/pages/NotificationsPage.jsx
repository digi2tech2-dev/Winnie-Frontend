import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BellRing, CheckCheck, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import EmptyState from "../components/EmptyState";
import { iconMap } from "../components/icons";
import { useToast } from "../components/ToastProvider";
import { useLanguage } from "../context/LanguageContext";

const filters = ["all", "orders", "wallet", "offers", "account"];
const notificationTones = {
  orders: {
    card: "border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.92),rgba(255,255,255,0.98)_58%)] dark:border-emerald-500/20 dark:bg-[linear-gradient(135deg,rgba(6,78,59,0.18),rgba(8,13,30,0.98)_58%)]",
    icon: "bg-emerald-500/12 text-emerald-600 ring-emerald-500/15 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  wallet: {
    card: "border-violet-200/80 bg-[linear-gradient(135deg,rgba(245,243,255,0.94),rgba(255,255,255,0.98)_58%)] dark:border-violet-500/20 dark:bg-[linear-gradient(135deg,rgba(76,29,149,0.18),rgba(8,13,30,0.98)_58%)]",
    icon: "bg-violet-500/12 text-violet-600 ring-violet-500/15 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  offers: {
    card: "border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,251,235,0.94),rgba(255,255,255,0.98)_58%)] dark:border-amber-500/20 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.18),rgba(8,13,30,0.98)_58%)]",
    icon: "bg-amber-500/12 text-amber-600 ring-amber-500/15 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  account: {
    card: "border-sky-200/80 bg-[linear-gradient(135deg,rgba(240,249,255,0.94),rgba(255,255,255,0.98)_58%)] dark:border-sky-500/20 dark:bg-[linear-gradient(135deg,rgba(7,89,133,0.18),rgba(8,13,30,0.98)_58%)]",
    icon: "bg-sky-500/12 text-sky-600 ring-sky-500/15 dark:text-sky-300",
    dot: "bg-sky-500",
  },
};

export default function NotificationsPage({
  actionPending = "",
  error = "",
  items,
  loading = false,
  onDeleteNotification,
  onMarkAllAsRead,
  onMarkAsRead,
  onOpenNotification,
  onPageChange,
  pagination,
  readOnly = false,
  unreadCount,
}) {
  const [filter, setFilter] = useState("all");
  const [localItems, setLocalItems] = useState([]);
  const { showToast } = useToast();
  const { isArabic } = useLanguage();
  const { t } = useTranslation("notifications");
  const notificationItems = items ?? localItems;
  const unreadTotal = unreadCount ?? notificationItems.filter((item) => item.unread).length;
  const actionInFlight = Boolean(actionPending);

  const visible = useMemo(
    () => notificationItems.filter((item) => filter === "all" || item.type === filter),
    [filter, notificationItems],
  );

  const markAllAsRead = async () => {
    if (readOnly) {
      showToast({
        type: "info",
        title: t("readOnlyTitle"),
        message: t("readOnlyMessage"),
      });
      return;
    }

    if (!unreadTotal) {
      showToast({
        type: "info",
        title: t("allReadTitle"),
        message: t("allReadMessage"),
      });
      return;
    }

    if (onMarkAllAsRead) {
      try {
        await onMarkAllAsRead();
      } catch (requestError) {
        showToast({
          type: "error",
          title: t("updateFailedTitle"),
          message: requestError.userMessage || requestError.message || t("common:errors.tryAgain"),
        });
        return;
      }
    } else {
      setLocalItems((currentItems) => currentItems.map((item) => ({ ...item, unread: false })));
    }

    showToast({
      type: "success",
      title: t("allMarkedTitle"),
      message: t("allMarkedMessage"),
    });
  };

  const markOneAsRead = async (item) => {
    if (!item.unread || readOnly || !onMarkAsRead) return;

    try {
      await onMarkAsRead(item.id);
      showToast({
        type: "success",
        title: t("updatedTitle"),
        message: t("updatedMessage"),
      });
    } catch (requestError) {
      showToast({
        type: "error",
        title: t("updateOneFailedTitle"),
        message: requestError.userMessage || requestError.message || t("common:errors.tryAgain"),
      });
    }
  };

  const removeNotification = async (item) => {
    if (readOnly || !onDeleteNotification) return;
    if (!window.confirm(t("confirmDelete"))) return;

    try {
      await onDeleteNotification(item.id);
      showToast({
        type: "success",
        title: t("deletedTitle"),
        message: t("deletedMessage"),
      });
    } catch (requestError) {
      showToast({
        type: "error",
        title: t("deleteFailedTitle"),
        message: requestError.userMessage || requestError.message || t("common:errors.tryAgain"),
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="relative overflow-hidden rounded-[26px] border border-violet-200/70 bg-[radial-gradient(circle_at_8%_0%,rgba(34,211,238,0.17),transparent_34%),radial-gradient(circle_at_92%_10%,rgba(217,70,239,0.14),transparent_32%),rgba(255,255,255,0.94)] p-4 shadow-[0_22px_65px_rgba(76,29,149,0.12)] dark:border-violet-400/15 dark:bg-[radial-gradient(circle_at_8%_0%,rgba(34,211,238,0.10),transparent_34%),radial-gradient(circle_at_92%_10%,rgba(217,70,239,0.10),transparent_32%),#080d1e] sm:rounded-[32px] sm:p-7">
        <span className="pointer-events-none absolute -end-12 -top-16 h-48 w-48 rounded-full border-[35px] border-violet-500/[0.05]" />
        <div className="relative flex items-center justify-between gap-3 sm:gap-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-sky-500 text-white shadow-[0_14px_32px_rgba(124,58,237,0.32)] sm:h-16 sm:w-16 sm:rounded-[22px]">
              <BellRing className="h-6 w-6 sm:h-8 sm:w-8" />
              {unreadTotal > 0 && <span className="absolute -end-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-black dark:border-[#080d1e]">{unreadTotal > 99 ? "99+" : unreadTotal}</span>}
            </span>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300 sm:text-xs"><ShieldCheck className="h-3.5 w-3.5" />{t("eyebrow")}</p>
              <h1 className="mt-1 truncate text-xl font-black tracking-tight sm:text-3xl">{t("title")}</h1>
              <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:mt-2 sm:text-sm">{t("description")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={loading || actionInFlight || !unreadTotal}
            aria-busy={actionPending === "read-all"}
            className={`interactive-ring inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-[10px] font-black transition sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm ${
              unreadTotal
                ? "border-slate-200 text-slate-700 hover:border-royal/35 hover:bg-royal/5 dark:border-white/10 dark:text-white"
                : "border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/35"
            }`}
          >
            <CheckCheck className="h-4 w-4" /><span className="hidden min-[410px]:inline">{t("markAll")}</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-5 gap-1.5 rounded-2xl border border-slate-200 bg-white/75 p-1.5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:gap-2 sm:p-2">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`h-9 min-w-0 truncate rounded-xl px-1 text-[9px] font-black transition sm:h-11 sm:px-3 sm:text-sm ${filter === item ? "bg-gradient-to-r from-royal to-pulse text-white shadow-glow" : "text-slate-600 hover:bg-violet-50 dark:text-slate-300 dark:hover:bg-white/[0.06]"}`}
          >
            {t(`filters.${item}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-panel rounded-lg p-8 text-center text-sm font-black text-slate-500 dark:text-slate-400">
          {t("loading")}
        </div>
      ) : error ? (
        <EmptyState title={t("loadErrorTitle")} description={error} />
      ) : visible.length ? (
        <section className="grid gap-3">
          {visible.map((item) => {
            const Icon = iconMap[item.level === "success" ? "CheckCircle2" : item.level === "warning" ? "AlertTriangle" : "Bell"];
            const tone = notificationTones[item.type] || notificationTones.account;
            return (
              <article
                key={item.id}
                className={`group relative overflow-hidden rounded-[20px] border p-3 shadow-[0_8px_28px_rgba(15,23,42,0.055)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(124,58,237,0.10)] sm:p-4 ${tone.card} ${onOpenNotification ? "cursor-pointer hover:border-violet-300 dark:hover:border-violet-500/50" : ""}`}
                onClick={() => onOpenNotification?.(item)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (onOpenNotification && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    onOpenNotification(item);
                  }
                }}
                role={onOpenNotification ? "link" : undefined}
                tabIndex={onOpenNotification ? 0 : undefined}
              >
                {item.unread && <span className={`absolute inset-y-3 start-0 w-1 rounded-e-full ${tone.dot}`} />}
                <div className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-2.5 sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:gap-4">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-4 sm:h-12 sm:w-12 sm:rounded-2xl ${tone.icon}`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <h2 className="truncate text-xs font-black sm:text-base">{item.title}</h2>
                      {item.unread && <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-4 text-slate-500 dark:text-slate-400 sm:text-sm sm:leading-5">{item.message}</p>
                    <span className="mt-1 block truncate text-[8px] font-bold text-slate-400 sm:text-[10px]">{item.time}</span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {item.unread && <span className="hidden items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-[8px] font-black text-violet-600 shadow-sm dark:bg-white/[0.07] dark:text-violet-300 sm:inline-flex"><Sparkles className="h-3 w-3" />{t("new")}</span>}
                    {!readOnly && (onMarkAsRead || onDeleteNotification) && (
                      <div className="flex justify-end gap-1">
                        {item.unread && onMarkAsRead && (
                          <button
                            type="button"
                            onClick={(event) => { event.stopPropagation(); void markOneAsRead(item); }}
                            disabled={actionInFlight}
                            className="interactive-ring grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white/60 text-slate-600 transition hover:border-royal/35 hover:bg-royal/5 disabled:cursor-not-allowed disabled:opacity-55 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.06]"
                            title={t("read")}
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            <span className="sr-only">{actionPending === `read:${item.id}` ? "..." : t("read")}</span>
                          </button>
                        )}
                        {onDeleteNotification && (
                          <button
                            type="button"
                            onClick={(event) => { event.stopPropagation(); void removeNotification(item); }}
                            disabled={actionInFlight}
                            className="interactive-ring grid h-8 w-8 place-items-center rounded-lg border border-red-100 bg-white/60 text-red-500 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-55 dark:border-red-400/20 dark:bg-white/[0.04] dark:text-red-200 dark:hover:bg-red-500/10"
                            title={t("delete")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">{actionPending === `delete:${item.id}` ? "..." : t("delete")}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      )}

      {!loading && !error && pagination?.total > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
          isArabic={isArabic}
          label={t("common:pagination.pageOf", { page: pagination.page, pages: pagination.pages })}
        />
      )}
    </div>
  );
}

function Pagination({ pagination, onPageChange, isArabic, label }) {
  const current = pagination.page || 1;
  const total = Math.max(1, pagination.pages || 1);
  const start = Math.max(1, Math.min(current - 2, Math.max(1, total - 4)));
  const pages = Array.from({ length: Math.min(5, total) }, (_, index) => start + index);

  return (
    <nav className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm dark:border-white/10 dark:bg-white/[0.04]" aria-label={label}>
      <PageArrow disabled={current <= 1} onClick={() => onPageChange?.(current - 1)} icon={isArabic ? ArrowRight : ArrowLeft} />
      {pages.map((number) => (
        <button
          type="button"
          key={number}
          aria-current={number === current ? "page" : undefined}
          onClick={() => onPageChange?.(number)}
          className={`grid h-9 min-w-9 place-items-center rounded-xl px-2 text-xs font-black transition sm:h-11 sm:min-w-11 sm:text-sm ${number === current ? "bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-[0_8px_20px_rgba(124,58,237,0.28)]" : "text-slate-500 hover:bg-violet-50 hover:text-violet-700 dark:text-slate-400 dark:hover:bg-white/[0.07]"}`}
        >
          {number}
        </button>
      ))}
      <PageArrow disabled={current >= total} onClick={() => onPageChange?.(current + 1)} icon={isArabic ? ArrowLeft : ArrowRight} />
    </nav>
  );
}

function PageArrow({ disabled, onClick, icon: Icon }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:disabled:text-white/20 sm:h-11 sm:w-11">
      <Icon className="h-4 w-4" />
    </button>
  );
}
