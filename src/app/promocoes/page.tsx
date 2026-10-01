import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { PromotionsSection } from "@/components/home/PromotionsSection";
import { CtaBanner } from "@/components/site/CtaBanner";
import { getSiteSettings, listPromotions, listServices } from "@/lib/queries";

export function generateMetadata(): Metadata {
  return {
    title: "Promoções do Studio",
    description:
      "Ofertas especiais e condições promocionais do Studio Liso Espelhado com Beatriz Ribeiro. Aproveite por tempo determinado.",
  };
}

export default function PromocoesPage() {
  const settings = getSiteSettings();
  const promotions = listPromotions(true);
  const services = listServices(true);

  return (
    <>
      <PageHero
        eyebrow="Condições especiais"
        title="PROMOÇÕES DO"
        highlight="STUDIO ✨"
        description="Pacotes com valor especial, com a mesma excelência de sempre. Os valores já refletem o desconto aplicado."
      />
      <PromotionsSection
        promotions={promotions}
        services={services}
        feePercent={settings.fee.percent}
      />
      <CtaBanner />
    </>
  );
}
