import Link from "next/link";

type Variant = "horizontal" | "vertical" | "monogram";

export function Monogram({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Monograma BR — Beatriz Ribeiro"
    >
      <path
        d="M50 4 L96 50 L50 96 L4 50 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M50 13 L87 50 L50 87 L13 50 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.55"
      />
      <text
        x="50"
        y="61"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="32"
        fontWeight="500"
        letterSpacing="1"
        fill="currentColor"
      >
        BR
      </text>
    </svg>
  );
}

export function Logo({
  variant = "horizontal",
  className = "",
  tone = "dark",
}: {
  variant?: Variant;
  className?: string;
  tone?: "dark" | "light";
}) {
  const primary = tone === "light" ? "text-champagne" : "text-ink";
  const accent = tone === "light" ? "text-gold-soft" : "text-gold-deep";

  if (variant === "monogram") {
    return <Monogram className={`h-10 w-10 ${accent} ${className}`} />;
  }

  if (variant === "vertical") {
    return (
      <span className={`flex flex-col items-center text-center ${className}`}>
        <Monogram className={`h-12 w-12 ${accent}`} />
        <span
          className={`mt-3 font-display text-[26px] leading-[1.05] tracking-[0.16em] ${primary}`}
        >
          STUDIO LISO
          <br />
          ESPELHADO
        </span>
        <span className="mt-2 flex w-full items-center gap-3">
          <span className="rule-gold h-px flex-1" />
          <span className={`text-[9px] tracking-[0.4em] ${accent}`}>
            COM BEATRIZ RIBEIRO
          </span>
          <span className="rule-gold h-px flex-1" />
        </span>
      </span>
    );
  }

  return (
    <Link
      href="/"
      className={`group flex items-center gap-3 ${className}`}
    >
      <Monogram className={`h-9 w-9 shrink-0 transition-colors ${accent}`} />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-[17px] tracking-[0.2em] transition-colors sm:text-[19px] ${primary}`}
        >
          STUDIO LISO ESPELHADO
        </span>
        <span
          className={`mt-1 text-[8px] tracking-[0.42em] ${accent} sm:text-[9px]`}
        >
          COM BEATRIZ RIBEIRO
        </span>
      </span>
    </Link>
  );
}
