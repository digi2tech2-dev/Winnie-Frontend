import { useMemo, useState } from "react";
import { CheckCheck, Trash2 } from "lucide-react";
import EmptyState from "../components/EmptyState";
import { iconMap } from "../components/icons";
import { useToast } from "../components/ToastProvider";

const filters = ["all", "orders", "wallet", "offers", "account"];
const filterLabels = {
  all: "الكل",
  orders: "الطلبات",
  wallet: "المحفظة",
  offers: "العروض",
  account: "الحساب",
};

export default function NotificationsPage({
  actionPending = "",
  error = "",
  items,
  loading = false,
  onDeleteNotification,
  onMarkAllAsRead,
  onMarkAsRead,
  readOnly = false,
  unreadCount,
}) {
  const [filter, setFilter] = useState("all");
  const [localItems, setLocalItems] = useState([]);
  const { showToast } = useToast();
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
        title: "Read-only notifications",
        message: "Notification actions are unavailable on this surface.",
      });
      return;
    }

    if (!unreadTotal) {
      showToast({
        type: "info",
        title: "كل الإشعارات مقروءة",
        message: "لا توجد إشعارات جديدة حالياً.",
      });
      return;
    }

    if (onMarkAllAsRead) {
      try {
        await onMarkAllAsRead();
      } catch (requestError) {
        showToast({
          type: "error",
          title: "Unable to update notifications",
          message: requestError.userMessage || requestError.message || "Please try again.",
        });
        return;
      }
    } else {
      setLocalItems((currentItems) => currentItems.map((item) => ({ ...item, unread: false })));
    }

    showToast({
      type: "success",
      title: "تمت قراءة الإشعارات",
      message: "تم تعليم كل الإشعارات كمقروءة.",
    });
  };

  const markOneAsRead = async (item) => {
    if (!item.unread || readOnly || !onMarkAsRead) return;

    try {
      await onMarkAsRead(item.id);
      showToast({
        type: "success",
        title: "Notification updated",
        message: "The notification was marked as read.",
      });
    } catch (requestError) {
      showToast({
        type: "error",
        title: "Unable to update notification",
        message: requestError.userMessage || requestError.message || "Please try again.",
      });
    }
  };

  const removeNotification = async (item) => {
    if (readOnly || !onDeleteNotification) return;
    if (!window.confirm("Delete this notification?")) return;

    try {
      await onDeleteNotification(item.id);
      showToast({
        type: "success",
        title: "Notification deleted",
        message: "The notification was removed from your account.",
      });
    } catch (requestError) {
      showToast({
        type: "error",
        title: "Unable to delete notification",
        message: requestError.userMessage || requestError.message || "Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-lg p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-royal dark:text-pulse">صندوق التنبيهات</p>
            <h1 className="mt-2 text-3xl font-black">الإشعارات</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">تنبيهات مصنفة للطلبات والمحفظة والعروض ونشاط الحساب.</p>
          </div>
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={loading || actionInFlight || !unreadTotal}
            aria-busy={actionPending === "read-all"}
            className={`interactive-ring h-11 rounded-lg border px-4 text-sm font-black transition ${
              unreadTotal
                ? "border-slate-200 text-slate-700 hover:border-royal/35 hover:bg-royal/5 dark:border-white/10 dark:text-white"
                : "border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/35"
            }`}
          >
            تعليم الكل كمقروء
          </button>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`h-10 rounded-lg px-4 text-sm font-black transition ${filter === item ? "bg-gradient-to-r from-royal to-pulse text-white shadow-glow" : "border border-slate-200 bg-white/70 text-slate-600 dark:border-white/10 dark:bg-white/[0.045] dark:text-slate-300"}`}
          >
            {filterLabels[item]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-panel rounded-lg p-8 text-center text-sm font-black text-slate-500 dark:text-slate-400">
          Loading notifications...
        </div>
      ) : error ? (
        <EmptyState title="Unable to load notifications" description={error} />
      ) : visible.length ? (
        <section className="grid gap-3">
          {visible.map((item) => {
            const Icon = iconMap[item.level === "success" ? "CheckCircle2" : item.level === "warning" ? "AlertTriangle" : "Bell"];
            return (
              <article key={item.id} className="glass-panel rounded-lg p-4">
                <div className="flex gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-royal/12 text-royal dark:bg-pulse/15 dark:text-pulse">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black">{item.title}</h2>
                      {item.unread && <span className="h-2 w-2 rounded-full bg-pulse" />}
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.message}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs font-bold text-slate-400">{item.time}</span>
                    {!readOnly && (onMarkAsRead || onDeleteNotification) && (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {item.unread && onMarkAsRead && (
                          <button
                            type="button"
                            onClick={() => markOneAsRead(item)}
                            disabled={actionInFlight}
                            className="interactive-ring inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs font-black text-slate-600 transition hover:border-royal/35 hover:bg-royal/5 disabled:cursor-not-allowed disabled:opacity-55 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.06]"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            {actionPending === `read:${item.id}` ? "..." : "Read"}
                          </button>
                        )}
                        {onDeleteNotification && (
                          <button
                            type="button"
                            onClick={() => removeNotification(item)}
                            disabled={actionInFlight}
                            className="interactive-ring inline-flex h-8 items-center gap-1 rounded-lg border border-red-100 px-2 text-xs font-black text-red-500 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-55 dark:border-red-400/20 dark:text-red-200 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {actionPending === `delete:${item.id}` ? "..." : "Delete"}
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
        <EmptyState title="لا توجد إشعارات" description="هذا القسم لا يحتوي على إشعارات حالياً." />
      )}
    </div>
  );
}
