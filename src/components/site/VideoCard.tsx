"use client";

import { useState } from "react";

function youtubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i
  );
  return match ? match[1] : null;
}

function vimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match ? match[1] : null;
}

export function VideoCard({
  url,
  poster,
  title,
  caption,
  className = "",
  artVariant = "video",
}: {
  url: string;
  poster?: string | null;
  title?: string;
  caption?: string | null;
  className?: string;
  artVariant?: "video" | "gallery" | "studio";
}) {
  const [playing, setPlaying] = useState(false);

  const yt = youtubeId(url);
  const vimeo = vimeoId(url);
  const isDirect = !yt && !vimeo;

  const fallbackPoster =
    poster ??
    (artVariant === "video"
      ? "/art/video.svg"
      : artVariant === "studio"
        ? "/art/studio.svg"
        : "/art/gallery.svg");

  return (
    <figure className={`group relative overflow-hidden bg-ink ${className}`}>
      <div className="relative aspect-[4/5] w-full sm:aspect-[3/4]">
        {playing && yt ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1`}
            title={title || "Vídeo do Studio"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : playing && vimeo ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://player.vimeo.com/video/${vimeo}?autoplay=1`}
            title={title || "Vídeo do Studio"}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : playing && isDirect ? (
          <video
            className="absolute inset-0 h-full w-full bg-black object-cover"
            src={url}
            poster={fallbackPoster}
            controls
            autoPlay
            playsInline
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fallbackPoster}
              alt={title || "Vídeo do Studio"}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />

            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Reproduzir ${title ?? "vídeo"}`}
              className="absolute inset-0 z-10 flex items-center justify-center"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold-soft/70 bg-ink/45 backdrop-blur-sm transition-all duration-500 group-hover:scale-110 group-hover:border-gold group-hover:bg-ink/70">
                <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 text-gold-soft" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
                </svg>
              </span>
            </button>
          </>
        )}
      </div>

      {title || caption ? (
        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-ink/90 to-transparent p-5">
          {title ? (
            <p className="font-display text-[21px] leading-tight text-champagne">
              {title}
            </p>
          ) : null}
          {caption ? (
            <p className="mt-1 text-[12.5px] text-champagne/75">{caption}</p>
          ) : null}
          <p className="mt-2 text-[9px] uppercase tracking-[0.3em] text-gold-soft">
            vídeo · mostruário
          </p>
        </figcaption>
      ) : null}
    </figure>
  );
}
