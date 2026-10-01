import type { Metadata } from "next";
import { adminPhones, countUnreadNotifications, listNotifications } from "@/lib/notify";
import { NotificationsManager, type NotificationItem } from "./NotificationsManager";

export const metadata: Metadata = {
  title: "Avisos",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminAvisosPage() {
  const items = listNotifications(80) as unknown as NotificationItem[];

  return (
    <NotificationsManager
      items={items}
      unread={countUnreadNotifications()}
      phones={adminPhones()}
    />
  );
}
