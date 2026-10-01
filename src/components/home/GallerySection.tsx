import Link from "next/link";
import { Media } from "@/components/site/ArtPanel";
import { Reveal } from "@/components/site/Reveal";
import { VideoCard } from "@/components/site/VideoCard";
import { Section, SectionHeading } from "@/components/site/Section";
import type { GalleryItem } from "@/lib/types";

const RATIOS = ["3/4", "1/1", "4/5", "1/1", "3/4", "5/6"];

const KIND_LABEL: Record<string, string> = {
  "antes-depois": "Antes e depois",
  trabalho: "Trabalho realizado",
  studio: "O Studio",
  cliente: "Resultado de cliente",
};

export type GalleryFilter = "all" | "image" | "video";

export function GallerySection({
  items,
  limit,
  filter = "all",
  withCta = true,
  heading = {
    eyebrow: "Portfólio",
    title: "RESULTADOS QUE FALAM",
    highlight: "POR SI",
    description:
      "Cada fio conta uma história. Estes são alguns dos resultados construídos no Studio.",
  },
}: {
  items: GalleryItem[];
  limit?: number;
  filter?: GalleryFilter;
  withCta?: boolean;
  heading?: {
    eyebrow?: string;
    title: string;
    highlight?: string;
    description?: string;
  };
}) {
  const filtered =
    filter === "all"
      ? items
      : items.filter((i) =>
          filter === "video" ? i.media_type === "video" : i.media_type !== "video"
        );

  const visible = limit ? filtered.slice(0, limit) : filtered;
  if (visible.length === 0) return null;

  return (
    <Section id="resultados" className="bg-cream">
      <SectionHeading
        eyebrow={heading.eyebrow}
        title={heading.title}
        highlight={heading.highlight}
        description={heading.description}
        align="center"
      />

      <div className="mt-14 gap-5 sm:columns-2 lg:columns-3">
        {visible.map((item, i) => (
          <Reveal
            key={item.id}
            delay={(i % 3) * 80}
            className="mb-5 break-inside-avoid"
          >
            {item.media_type === "video" && item.video_url ? (
              <VideoCard
                url={item.video_url}
                poster={item.image}
                title={item.title}
                caption={item.caption}
                artVariant={item.kind === "studio" ? "studio" : "video"}
              />
            ) : (
              <figure className="group relative overflow-hidden bg-offwhite">
                <Media
                  src={item.image}
                  alt={item.title || "Resultado do Studio"}
                  variant={item.kind === "studio" ? "studio" : "gallery"}
                  className="w-full"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ aspectRatio: RATIOS[i % RATIOS.length] }}
                />
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 p-5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-gold-soft">
                    {KIND_LABEL[item.kind] ?? "Resultado"}
                  </p>
                  <p className="mt-1.5 font-display text-[22px] leading-tight text-champagne">
                    {item.title}
                  </p>
                  {item.caption ? (
                    <p className="mt-1 text-[13px] text-champagne/75">
                      {item.caption}
                    </p>
                  ) : null}
                </figcaption>
              </figure>
            )}
          </Reveal>
        ))}
      </div>

      {withCta ? (
        <div className="mt-6 text-center">
          <Link href="/mostruario" className="btn btn-outline">
            Ver o mostruário completo
          </Link>
        </div>
      ) : null}
    </Section>
  );
}
