import { useOutletContext } from "react-router-dom";
import NotificationsPage from "../NotificationsPage";

export default function CustomerNotifications() {
  const context = useOutletContext();

  return (
    <NotificationsPage
      actionPending={context.notificationAction}
      error={context.notificationsError}
      items={context.notifications}
      loading={context.notificationsLoading}
      onDeleteNotification={context.onDeleteNotification}
      onMarkAllAsRead={context.onMarkAllNotificationsRead}
      onMarkAsRead={context.onMarkNotificationRead}
      onOpenNotification={context.onOpenNotification}
      readOnly={!context.notificationActionsSupported}
      unreadCount={context.unreadNotificationCount}
    />
  );
}
