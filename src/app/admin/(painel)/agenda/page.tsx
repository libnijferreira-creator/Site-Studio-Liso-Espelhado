import type { Metadata } from "next";
import { getSetting } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { listAppointments, listBlocks } from "@/lib/queries";
import { assistantNameOf } from "@/lib/reminder";
import type { NotificationsSettings, Schedule } from "@/lib/types";
import { AgendaManager } from "./AgendaManager";

export const metadata: Metadata = {
  title: "Agenda",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function iso(d: Date): string {
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}

export default function AdminAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  return <AgendaPageLoader params={searchParams} />;
}

async function AgendaPageLoader({
  params,
}: {
  params: Promise<{ date?: string }>;
}) {
  const { date: raw } = await params;
  const todayISO = iso(new Date());
  const date =
    raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : todayISO;

  // Aba "Dia": só a data selecionada (comportamento antigo).
  const items = listAppointments({ from: date, to: date });
  // Abas de lista: a partir de hoje, para não enterrar o histórico antigo.
  const confirmed = listAppointments({
    from: todayISO,
    statuses: ["confirmed", "completed"],
  });
  const pending = listAppointments({
    from: todayISO,
    statuses: ["pending", "approved"],
  });

  const blocks = listBlocks(date);
  const schedule = getSetting<Schedule>(
    "schedule",
    DEFAULT_SETTINGS.schedule as Schedule
  );
  const notif = getSetting<NotificationsSettings>(
    "notifications",
    DEFAULT_SETTINGS.notifications as NotificationsSettings
  );

  return (
    <AgendaManager
      items={items}
      confirmed={confirmed}
      pending={pending}
      blocks={blocks}
      date={date}
      schedule={schedule}
      secretary={assistantNameOf(notif.assistantName)}
    />
  );
}
