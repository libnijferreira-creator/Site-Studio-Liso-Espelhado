import Link from "next/link";
import { Media } from "@/components/site/ArtPanel";
import { PromoAlert, type PromoAlertData } from "./PromoAlert";

export function Hero({
  hero,
  site,
  promo,
}: {
  hero: { eyebrow: string; title: string; subtitle: string; image: string | null };
  site: { headline: string; ctaPrimary: string; ctaSecondary: string; whatsapp: string; hours: string };
  /** null = sem promoção ativa (ou aviso fechado) → nada é renderizado */
  promo: PromoAlertData | null;
}) {
  return (
    <section className="relative isolate flex min-h-svh items-end overflow-hidden bg-ink">
      <Media
        src={hero.image}
        alt="Studio Liso Espelhado com Beatriz Ribeiro"
        variant="hero"
        className="absolute inset-0 h-full w-full"
        sizes="100vw"
        priority
      />

      {/* Escurecimento editorial */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/15" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/25 to-transparent" />

      <div className="container-site relative z-10 pb-16 pt-36 sm:pb-20 lg:pb-24">
        <div className="max-w-3xl animate-[fade-up_.9s_cubic-bezier(.22,1,.36,1)_both]">
          {promo ? <PromoAlert {...promo} /> : null}

          <p className="eyebrow !text-gold-soft">{hero.eyebrow}</p>

          <h1 className="mt-6 text-champagne">
            <span className="block text-[42px] leading-[0.95] tracking-[0.02em] sm:text-[68px] lg:text-[86px]">
              {hero.title}
            </span>
            <span className="mt-3 block font-display text-[22px] italic text-gold-soft sm:text-[30px] lg:text-[36px]">
              {hero.subtitle}
            </span>
          </h1>

          <div className="rule-gold mt-8 w-52" />

          <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-champagne/85 sm:text-[19px]">
            {site.headline}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link href="/agendar" className="btn btn-gold sm:!px-9">
              {site.ctaPrimary}
            </Link>
            <Link href="/servicos" className="btn btn-ghost-light">
              {site.ctaSecondary}
            </Link>
          </div>

          <ul className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/12 pt-6 text-[11px] uppercase tracking-[0.2em] text-champagne/60">
            <li className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rotate-45 bg-gold" aria-hidden="true" />
              <span>{site.hours}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rotate-45 bg-gold" aria-hidden="true" />
              <span>Agendamento online 24h</span>
            </li>
            <li className="hidden items-center gap-2 sm:flex">
              <span className="inline-block h-1.5 w-1.5 rotate-45 bg-gold" aria-hidden="true" />
              <span>{site.whatsapp}</span>
            </li>
          </ul>
        </div>
      </div>

      <span className="absolute bottom-6 right-6 hidden text-[10px] uppercase tracking-[0.34em] text-champagne/45 lg:block">
        role para descobrir
      </span>
    </section>
  );
}
