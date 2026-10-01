import type { Metadata } from "next";
import { getSetting } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { getSiteSettings, listWorkingHours } from "@/lib/queries";
import type { Schedule } from "@/lib/types";
import { ContentManager } from "./ContentManager";

export const metadata: Metadata = {
  title: "Conteúdo do site",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminConteudoPage() {
  const settings = getSiteSettings();
  const hours = listWorkingHours();
  const schedule = getSetting<Schedule>(
    "schedule",
    DEFAULT_SETTINGS.schedule as Schedule
  );

  return <ContentManager settings={settings} hours={hours} schedule={schedule} />;
}
