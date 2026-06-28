import { useOutletContext } from "react-router-dom";
import NotificationsPage from "../NotificationsPage";

export default function CustomerNotifications() {
  const context = useOutletContext();

  return (
    <NotificationsPage
      error={context.notificationsError}
      items={context.notifications}
      loading={context.notificationsLoading}
      readOnly
      unreadCount={context.unreadNotificationCount}
    />
  );
}
