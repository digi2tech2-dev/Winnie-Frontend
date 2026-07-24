import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getNotifications } from "../../api/notifications";
import { useAuth } from "../../context/AuthContext";
import NotificationsPage from "../NotificationsPage";

const pageSize = 15;

export default function CustomerNotifications() {
  const context = useOutletContext();
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;

    const loadPage = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getNotifications(token, { page, limit: pageSize });
        if (cancelled) return;
        setItems(result.notifications);
        setPagination(result.pagination);
        if (page !== result.pagination.page) setPage(result.pagination.page);
      } catch (requestError) {
        if (cancelled) return;
        setItems([]);
        setPagination({ page, limit: pageSize, total: 0, pages: 1 });
        setError(requestError.userMessage || requestError.message || "");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPage();
    return () => {
      cancelled = true;
    };
  }, [page, reloadKey, token]);

  const runAndRefresh = (action) => async (...args) => {
    await action?.(...args);
    setReloadKey((value) => value + 1);
  };

  return (
    <NotificationsPage
      actionPending={context.notificationAction}
      error={error || context.notificationsError}
      items={items}
      loading={loading}
      onDeleteNotification={runAndRefresh(context.onDeleteNotification)}
      onMarkAllAsRead={runAndRefresh(context.onMarkAllNotificationsRead)}
      onMarkAsRead={runAndRefresh(context.onMarkNotificationRead)}
      onOpenNotification={context.onOpenNotification}
      onPageChange={setPage}
      pagination={pagination}
      readOnly={!context.notificationActionsSupported}
      unreadCount={context.unreadNotificationCount}
    />
  );
}
