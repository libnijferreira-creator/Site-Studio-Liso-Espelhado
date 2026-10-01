import Link from "next/link";
import { Reveal } from "@/components/site/Reveal";
import { VideoCard } from "@/components/site/VideoCard";
import { Section, SectionHeading } from "@/components/site/Section";
import type { GalleryItem } from "@/lib/types";

/**
 * Mostruário em destaque na Home: vídeos e registros dos trabalhos.
 */
export function ShowroomSection({ items }: { items: GalleryItem[] }) {
  const videos = items.filter(
    (i) => i.media_type === "video" && i.video_url
  );
  const photos = items.filter((i) => i.media_type !== "video");

  const picks = [...videos, ...photos].slice(0, 3);
  if (picks.length === 0) return null;

  return (
    <Section id="mostruario" tone="dark" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "url(/art/studio.svg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-ink/80" />

      <div className="relative">
        <SectionHeading
          eyebrow="Vídeos e fotografias"
          title="MOSTRUÁRIO"
          highlight="DO STUDIO"
          description="Um espaço dedicado aos registros dos nossos trabalhos: antes e depois, finalizações, ambiente e resultados reais."
          align="center"
          tone="light"
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((item, i) => (
            <Reveal key={item.id} delay={i * 90}>
              {item.media_type === "video" && item.video_url ? (
                <VideoCard
                  url={item.video_url}
                  poster={item.image}
                  title={item.title}
                  caption={item.caption}
                  artVariant={item.kind === "studio" ? "studio" : "video"}
                />
              ) : (
                <Link
                  href="/mostruario"
                  className="group block overflow-hidden border border-white/10"
                >
                  <figure className="relative aspect-[4/5] w-full sm:aspect-[3/4]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image || "/art/gallery.svg"}
                      alt={item.title || "Trabalho do Studio"}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
                    <figcaption className="absolute inset-x-0 bottom-0 p-5">
                      <p className="text-[9px] uppercase tracking-[0.3em] text-gold-soft">
                        fotografia
                      </p>
                      <p className="mt-1.5 font-display text-[21px] leading-tight text-champagne">
                        {item.title}
                      </p>
                      {item.caption ? (
                        <p className="mt-1 text-[12.5px] text-champagne/75">
                          {item.caption}
                        </p>
                      ) : null}
                    </figcaption>
                  </figure>
                </Link>
              )}
            </Reveal>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/mostruario" className="btn btn-gold">
            Abrir o mostruário completo
          </Link>
        </div>
      </div>
    </Section>
  );
}
