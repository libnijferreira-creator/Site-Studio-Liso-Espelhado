import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { AboutSection } from "@/components/home/AboutSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CtaBanner } from "@/components/site/CtaBanner";
import { getSiteSettings, listTestimonials } from "@/lib/queries";

export function generateMetadata(): Metadata {
  return {
    title: "Sobre Beatriz Ribeiro",
    description:
      "Conheça a trajetória, especialidades e filosofia de atendimento de Beatriz Ribeiro, especialista do Studio Liso Espelhado.",
  };
}

export default function SobrePage() {
  const settings = getSiteSettings();
  const testimonials = listTestimonials(true);

  return (
    <>
      <PageHero
        eyebrow="A profissional"
        title="Sofisticação nas mãos de"
        highlight="quem ama o que faz"
        description="Técnica, sensibilidade e um olhar atento para cada fio. Conheça quem está por trás de cada resultado."
      />
      <AboutSection about={settings.about} withCta={false} />
      <TestimonialsSection testimonials={testimonials} />
      <CtaBanner
        title="Vamos conversar sobre o seu cabelo?"
        description="Agende um diagnóstico e receba a orientação ideal para o seu tipo de fio."
      />
    </>
  );
}
