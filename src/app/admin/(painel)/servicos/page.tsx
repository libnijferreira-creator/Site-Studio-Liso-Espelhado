import type { Metadata } from "next";
import { getSetting } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { normalizeHairSizes } from "@/lib/hairsize";
import { listServices, getSiteSettings } from "@/lib/queries";
import type { HairSizesSettings } from "@/lib/types";
import { ServicesManager } from "./ServicesManager";

export const metadata: Metadata = {
  title: "Gerenciar serviços",
  robots: { index: false, follow: false },
};

export default function AdminServicosPage() {
  const services = listServices();
  const sizes: HairSizesSettings = normalizeHairSizes(
    getSetting("hairSizes", DEFAULT_SETTINGS.hairSizes)
  );
  const feePercent = getSiteSettings().fee.percent;
  return (
    <ServicesManager services={services} sizes={sizes} feePercent={feePercent} />
  );
}
