"use client";

import { useState } from "react";
import { Media } from "@/components/site/ArtPanel";
import { Reveal } from "@/components/site/Reveal";
import { VideoCard } from "@/components/site/VideoCard";
import type { GalleryItem } from "@/lib/types";

type Tab = "tudo" | "video" | "image";

const TABS: { id: Tab; label: string }[] = [
  { id: "tudo", label: "Tudo" },
  { id: "video", label: "Vídeos" },
  { id: "image", label: "Fotos" },
];

const KIND_LABEL: Record<string, string> = {
  "antes-depois": "Antes e depois",
  trabalho: "Trabalho realizado",
  studio: "O Studio",
  cliente: "Resultado de cliente",
};

export function ShowroomGrid({ items }: { items: GalleryItem[] }) {
  const [tab, setTab] = useState<Tab>("tudo");

  const filtered =
    tab === "tudo"
      ? items
      : items.filter((i) =>
          tab === "video" ? i.media_type === "video" : i.media_type !== "video"
        );

  const videos = filtered.filter((i) => i.media_type === "video" && i.video_url);
  const photos = filtered.filter((i) => i.media_type !== "video");

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2 border-b border-champagne pb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-all duration-300 ${
              tab === t.id
                ? "border-gold bg-gold/10 text-gold-deep"
                : "border-espresso/15 text-espresso-soft/75 hover:border-gold/60 hover:text-gold-deep"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-14 border border-dashed border-espresso/25 bg-white px-6 py-14 text-center text-sm text-espresso-soft/75">
          Nenhum item nesta categoria ainda. Envie suas fotos e vídeos pelo painel
          administrativo.
        </p>
      ) : (
        <>
          {videos.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((item, i) => (
                <Reveal key={item.id} delay={(i % 3) * 80}>
                  <VideoCard
                    url={item.video_url!}
                    poster={item.image}
                    title={item.title}
                    caption={item.caption}
                    artVariant={item.kind === "studio" ? "studio" : "video"}
                  />
                </Reveal>
              ))}
            </div>
          ) : null}

          {photos.length > 0 ? (
            <div className="mt-6 gap-5 sm:columns-2 lg:columns-3">
              {photos.map((item, i) => (
                <Reveal key={item.id} delay={(i % 3) * 80} className="mb-5 break-inside-avoid">
                  <figure className="group relative overflow-hidden bg-offwhite">
                    <Media
                      src={item.image}
                      alt={item.title || "Trabalho do Studio"}
                      variant={item.kind === "studio" ? "studio" : "gallery"}
                      className="w-full"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
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
                </Reveal>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
