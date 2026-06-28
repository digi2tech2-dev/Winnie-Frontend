import { useOutletContext } from "react-router-dom";
import NotificationsPage from "../NotificationsPage";

export default function CustomerNotifications() {
  const context = useOutletContext();

  return (
    <NotificationsPage
      items={context.notifications}
      onMarkAllAsRead={context.markAllNotificationsAsRead}
      unreadCount={context.unreadNotificationCount}
    />
  );
}
