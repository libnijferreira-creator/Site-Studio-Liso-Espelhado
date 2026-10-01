import type { Metadata } from "next";
import { listAdmins } from "@/lib/db";
import { getSession } from "@/lib/session";
import { UsersManager } from "./UsersManager";

export const metadata: Metadata = {
  title: "Usuários do painel",
  robots: { index: false, follow: false },
};

export default async function AdminUsuariosPage() {
  const admins = listAdmins();
  const session = await getSession();

  return <UsersManager admins={admins} currentId={session?.id ?? null} />;
}
