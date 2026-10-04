import Link from "next/link";
import { Media } from "@/components/site/ArtPanel";
import { Reveal } from "@/components/site/Reveal";
import { Section, SectionHeading } from "@/components/site/Section";
import { formatBRL, feeFor, formatDuration } from "@/lib/format";
import type { Promotion, Service } from "@/lib/types";

export function PromotionsSection({
  promotions,
  services,
  feePercent,
}: {
  promotions: Promotion[];
  services: Service[];
  feePercent: number;
}) {
  if (promotions.length === 0) return null;

  return (
    <Section id="promocoes" tone="dark" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, #dcc490 0, transparent 40%), radial-gradient(circle at 85% 80%, #c2a15d 0, transparent 45%)",
        }}
      />

      <div className="relative">
        <SectionHeading
          eyebrow="Condições especiais"
          title="PROMOÇÕES DO STUDIO"
          highlight="✨"
          description="Ofertas por tempo determinado, com o mesmo padrão de excelência de sempre."
          align="center"
          tone="light"
        />

        <div className="mt-14 grid gap-7 md:grid-cols-2">
          {promotions.map((promo, i) => {
            const service = services.find((s) => s.id === promo.service_id);
            const fee = feeFor(promo.promo_price_cents, feePercent);
            return (
              <Reveal key={promo.id} delay={i * 90}>
                <article className="group relative flex h-full flex-col overflow-hidden border border-white/12 bg-white/[0.04] backdrop-blur-sm transition-colors duration-500 hover:border-gold/50">
                  <Media
                    src={promo.image}
                    alt={promo.title}
                    variant="promo"
                    className="h-52 w-full"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute right-4 top-4 bg-offwhite px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-espresso">
                    Oferta
                  </div>

                  <div className="flex flex-1 flex-col p-7 sm:p-8">
                    <h3 className="text-[27px] leading-tight text-champagne">
                      {promo.title}
                    </h3>
                    <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-champagne/70">
                      {promo.description}
                    </p>

                    <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-champagne/50 line-through">
                          De {formatBRL(promo.original_price_cents)}
                        </p>
                        <p className="font-display text-[40px] leading-none text-gold-soft">
                          {formatBRL(promo.promo_price_cents)}
                        </p>
                      </div>
                      <div className="border-l border-white/15 pl-5 text-[12px] leading-relaxed text-champagne/65">
                        <p>
                          Taxa de reserva ({feePercent}%):{" "}
                          <span className="text-gold-soft">{formatBRL(fee)}</span>
                        </p>
                        {service ? <p>Duração: {formatDuration(service.duration_min)}</p> : null}
                      </div>
                    </div>

                    <Link
                      href={`/agendar${promo.service_id ? `?servico=${promo.service_id}` : ""}`}
                      className="btn btn-gold mt-7 w-full"
                    >
                      {promo.cta_label || "APROVEITAR PROMOÇÃO"}
                    </Link>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
