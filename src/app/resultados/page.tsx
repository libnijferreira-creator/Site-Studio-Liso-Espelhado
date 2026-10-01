import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { GallerySection } from "@/components/home/GallerySection";
import { CtaBanner } from "@/components/site/CtaBanner";
import { listGallery } from "@/lib/queries";

export function generateMetadata(): Metadata {
  return {
    title: "Resultados que falam por si",
    description:
      "Veja antes e depois, trabalhos realizados e o ambiente do Studio Liso Espelhado com Beatriz Ribeiro.",
  };
}

export default function ResultadosPage() {
  const gallery = listGallery(true);

  return (
    <>
      <PageHero
        eyebrow="Portfólio"
        title="RESULTADOS QUE FALAM"
        highlight="POR SI"
        description="Antes e depois, trabalhos realizados e detalhes do ambiente preparado para receber você."
      />
      <GallerySection items={gallery} withCta={false} />
      <CtaBanner
        title="Quer ver esse resultado no seu cabelo?"
        description="Agende o seu procedimento e receba um plano de cuidado personalizado desde a primeira consulta."
      />
    </>
  );
}
