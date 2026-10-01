import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { ServicesSection } from "@/components/home/ServicesSection";
import { CtaBanner } from "@/components/site/CtaBanner";
import { getSiteSettings, listServices } from "@/lib/queries";

export function generateMetadata(): Metadata {
  return {
    title: "Serviços e procedimentos",
    description:
      "Catálogo completo do Studio Liso Espelhado: liso espelhado, botox, progressiva, lifting, blindagem, cronograma capilar, coloração, escovagem, higienização, unhas e design de sobrancelhas — com valor, duração e a taxa de 15% antes de escolher o horário.",
  };
}

export default function ServicosPage() {
  const settings = getSiteSettings();
  const services = listServices(true);

  return (
    <>
      <PageHero
        eyebrow="Catálogo"
        title="Serviços e"
        highlight="procedimentos"
        description="Transparência total: você vê valor, duração e a taxa de 15% antes de escolher o seu horário."
      />
      <ServicesSection services={services} feePercent={settings.fee.percent} />

      <section className="border-t border-champagne bg-offwhite py-10">
        <div className="container-site grid gap-6 sm:grid-cols-2">
          <div className="border-l-2 border-gold/60 pl-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-deep">
              Agenda de cabelo
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-espresso-soft/80">
              Terça a sábado, das 09h às 18h. Domingo e segunda fechado.
            </p>
          </div>
          <div className="border-l-2 border-nude pl-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-espresso">
              Agenda de unhas
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-espresso-soft/80">
              Nail Design, Tips, Gel e Manutenção somente às{" "}
              <strong>quartas-feiras</strong>. Neste dia não há atendimento de
              cabelo.
            </p>
          </div>
        </div>
      </section>

      <CtaBanner
        title="Escolheu o seu procedimento?"
        description="Reserve o horário em poucos passos. A confirmação acontece automaticamente após a aprovação da taxa."
      />
    </>
  );
}
