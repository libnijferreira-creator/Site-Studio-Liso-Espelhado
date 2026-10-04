import Link from "next/link";
import { Media } from "@/components/site/ArtPanel";
import { Reveal } from "@/components/site/Reveal";
import { Section, SectionHeading } from "@/components/site/Section";
import { formatBRL, feeFor, formatDuration } from "@/lib/format";
import type { Service } from "@/lib/types";

export function ServicesSection({
  services,
  feePercent,
  limit,
  showAll = false,
}: {
  services: Service[];
  feePercent: number;
  limit?: number;
  showAll?: boolean;
}) {
  const visible = limit ? services.slice(0, limit) : services;

  return (
    <Section id="servicos">
      <SectionHeading
        eyebrow="Nossos procedimentos"
        title="Serviços pensados para"
        highlight="realçar a sua essência"
        description="Cada procedimento é conduzido com técnica, tempo e produto de excelência — do diagnóstico ao acabamento."
        align="center"
      />

      <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((service, i) => (
          <Reveal key={service.id} delay={Math.min(i, 7) * 70}>
            <article className="card-premium group flex h-full flex-col">
              <Media
                src={service.image}
                alt={service.name}
                variant="service"
                label={service.category}
                className="aspect-[4/3] w-full"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />

              <div className="flex flex-1 flex-col p-7">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-[25px] leading-tight">{service.name}</h3>
                  <span
                    className={`shrink-0 border px-2 py-0.5 pt-1 text-[10px] uppercase tracking-[0.2em] ${
                      service.track === "nails"
                        ? "border-nude text-espresso"
                        : "border-gold/50 text-gold-deep"
                    }`}
                  >
                    {service.track === "nails" ? "Só quartas" : service.category}
                  </span>
                </div>

                <p className="mt-4 flex-1 text-[14.5px] leading-relaxed text-espresso-soft/85">
                  {service.description}
                </p>

                <div className="mt-6 flex items-end justify-between gap-4 border-t border-champagne pt-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-espresso-soft/75">
                      Duração
                    </p>
                    <p className="mt-1 text-sm text-espresso">
                      {formatDuration(service.duration_min)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-espresso-soft/75">
                      Valor
                    </p>
                    <p className="font-display text-[27px] leading-none text-ink">
                      {formatBRL(service.price_cents)}
                    </p>
                    <p className="mt-1.5 text-[11px] text-gold-deep">
                      Taxa {feePercent}% ={" "}
                      {formatBRL(feeFor(service.price_cents, feePercent))}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/agendar?servico=${service.id}`}
                  className="btn btn-outline mt-6 w-full"
                >
                  Agendar
                </Link>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      {showAll || (limit && services.length > limit) ? (
        <div className="mt-12 text-center">
          <Link href="/servicos" className="btn btn-dark">
            Ver todos os serviços
          </Link>
        </div>
      ) : null}
    </Section>
  );
}
