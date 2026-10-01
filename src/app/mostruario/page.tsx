import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { CtaBanner } from "@/components/site/CtaBanner";
import { listGallery } from "@/lib/queries";
import { ShowroomGrid } from "./ShowroomGrid";

export const revalidate = 0;

export function generateMetadata(): Metadata {
  return {
    title: "Mostruário — fotos e vídeos",
    description:
      "Fotos e vídeos dos trabalhos realizados no Studio Liso Espelhado com Beatriz Ribeiro: antes e depois, finalizações, ambiente e resultados reais.",
  };
}

export default function MostruarioPage() {
  const items = listGallery(true);

  return (
    <>
      <PageHero
        eyebrow="Fotos e vídeos"
        title="Mostruário do"
        highlight="Studio"
        description="Aqui ficam os registros dos nossos trabalhos: vídeos de finalização, antes e depois, fotografias do ambiente e resultados de clientes."
      />

      <section className="py-16 sm:py-20">
        <div className="container-site">
          <ShowroomGrid items={items} />
        </div>
      </section>

      <CtaBanner
        title="Quer o seu resultado no mostruário?"
        description="Agende o procedimento e faça parte dos nossos registros."
      />
    </>
  );
}
