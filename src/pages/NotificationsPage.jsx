import { useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import { iconMap } from "../components/icons";
import { notifications as defaultNotifications } from "../data/catalog";
import { useToast } from "../components/ToastProvider";

const filters = ["all", "orders", "wallet", "offers", "account"];
const filterLabels = {
  all: "الكل",
  orders: "الطلبات",
  wallet: "المحفظة",
  offers: "العروض",
  account: "الحساب",
};

export default function NotificationsPage({ error = "", items, loading = false, onMarkAllAsRead, readOnly = false, unreadCount }) {
  const [filter, setFilter] = useState("all");
  const [localItems, setLocalItems] = useState(defaultNotifications);
  const { showToast } = useToast();
  const notificationItems = items ?? localItems;
  const unreadTotal = unreadCount ?? notificationItems.filter((item) => item.unread).length;

  const visible = useMemo(
    () => notificationItems.filter((item) => filter === "all" || item.type === filter),
    [filter, notificationItems],
  );

  const markAllAsRead = () => {
    if (readOnly) {
      showToast({
        type: "info",
        title: "Read-only notifications",
        message: "Mark-read actions will be connected in a later phase.",
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
      onMarkAllAsRead();
    } else {
      setLocalItems((currentItems) => currentItems.map((item) => ({ ...item, unread: false })));
    }

    showToast({
      type: "success",
      title: "تمت قراءة الإشعارات",
      message: "تم تعليم كل الإشعارات كمقروءة.",
    });
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
                  <span className="text-xs font-bold text-slate-400">{item.time}</span>
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
