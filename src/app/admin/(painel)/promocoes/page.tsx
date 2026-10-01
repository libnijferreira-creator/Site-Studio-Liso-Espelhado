import type { Metadata } from "next";
import { listPromotions, listServices } from "@/lib/queries";
import { PromotionsManager } from "./PromotionsManager";

export const metadata: Metadata = {
  title: "Promoções",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminPromocoesPage() {
  const items = listPromotions();
  const services = listServices().map((s) => ({ id: s.id, name: s.name }));
  return <PromotionsManager items={items} services={services} />;
}
