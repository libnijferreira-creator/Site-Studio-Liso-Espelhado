import type { Metadata } from "next";
import { getSetting } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { listAppointments, listBlocks } from "@/lib/queries";
import type { Schedule } from "@/lib/types";
import { AgendaManager } from "./AgendaManager";

export const metadata: Metadata = {
  title: "Agenda",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  return (
    <AgendaPageLoader params={searchParams} />
  );
}

async function AgendaPageLoader({
  params,
}: {
  params: Promise<{ date?: string }>;
}) {
  const { date: raw } = await params;
  const today = new Date();
  const date =
    raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? raw
      : `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}-${`${today.getDate()}`.padStart(2, "0")}`;

  const items = listAppointments({ from: date, to: date });
  const blocks = listBlocks(date);
  const schedule = getSetting<Schedule>(
    "schedule",
    DEFAULT_SETTINGS.schedule as Schedule
  );

  return (
    <AgendaManager items={items} blocks={blocks} date={date} schedule={schedule} />
  );
}
