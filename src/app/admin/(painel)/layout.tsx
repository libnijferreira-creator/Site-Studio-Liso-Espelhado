import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { countUnreadNotifications } from "@/lib/notify";
import { AdminShell } from "./AdminShell";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell user={session.username} unread={countUnreadNotifications()}>
      {children}
    </AdminShell>
  );
}
