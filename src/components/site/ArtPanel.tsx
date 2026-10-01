import Image from "next/image";

const PALETTES: Record<string, { from: string; via: string; to: string }> = {
  hero: { from: "#150f0c", via: "#3d2b21", to: "#1b1310" },
  portrait: { from: "#2a1e19", via: "#6b4e3a", to: "#1b1310" },
  service: { from: "#f7f3ee", via: "#e7dcc9", to: "#dcc6b4" },
  promo: { from: "#2a1e19", via: "#7b5c30", to: "#3a2a22" },
  gallery: { from: "#efe8de", via: "#f7f3ee", to: "#dcc6b4" },
  studio: { from: "#0b0908", via: "#5b4234", to: "#1b1310" },
  video: { from: "#150f0c", via: "#9a7c3f", to: "#1b1310" },
};

/** Artes editoriais em /public/art — substituídas por fotos reais pelo painel. */
const ART: Record<string, string> = {
  hero: "/art/hero.svg",
  portrait: "/art/portrait.svg",
  service: "/art/service.svg",
  promo: "/art/promo.svg",
  gallery: "/art/gallery.svg",
  studio: "/art/studio.svg",
  video: "/art/video.svg",
};

type Variant = keyof typeof PALETTES;

export function ArtPanel({
  variant = "gallery",
  label,
  className = "",
  rounded = false,
}: {
  variant?: Variant;
  label?: string;
  className?: string;
  rounded?: boolean;
}) {
  const palette = PALETTES[variant] ?? PALETTES.gallery;
  const art = ART[variant] ?? ART.gallery;
  const isDark =
    variant === "hero" ||
    variant === "portrait" ||
    variant === "studio" ||
    variant === "promo" ||
    variant === "video";
  const position = /\b(absolute|fixed)\b/.test(className) ? "" : "relative";

  return (
    <div
      className={`${position} overflow-hidden ${rounded ? "rounded-sm" : ""} ${className}`}
      style={{
        backgroundColor: palette.via,
        backgroundImage: `radial-gradient(120% 90% at 30% 15%, ${palette.from}CC 0%, transparent 60%), url(${art})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      aria-hidden="true"
    >
      {/* Vinheta para dar profundidade editorial */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(115% 85% at 50% 45%, transparent 35%, rgba(11,9,8,.55) 100%)"
            : "radial-gradient(115% 85% at 50% 45%, transparent 40%, rgba(42,30,25,.18) 100%)",
        }}
      />

      {label ? (
        <span
          className={`absolute inset-x-4 bottom-4 z-10 text-center text-[9px] uppercase tracking-[0.34em] ${
            isDark ? "text-champagne/75" : "text-espresso/65"
          }`}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

/** Mídia do banco: foto enviada pelo painel ou arte editorial na ausência. */
export function Media({
  src,
  alt,
  variant = "gallery",
  className = "",
  label,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: {
  src?: string | null;
  alt: string;
  variant?: Variant;
  className?: string;
  label?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-cream ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
        />
      </div>
    );
  }

  return <ArtPanel variant={variant} label={label} className={className} />;
}
