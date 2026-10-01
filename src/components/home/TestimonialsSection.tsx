import { Reveal } from "@/components/site/Reveal";
import { Section, SectionHeading } from "@/components/site/Section";
import type { Testimonial } from "@/lib/types";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
          <path
            d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.4l-5.8 3.06 1.1-6.47L2.6 9.35l6.5-.95z"
            fill={i < rating ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.1"
          />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <Section id="depoimentos">
      <SectionHeading
        eyebrow="Depoimentos"
        title="ELAS AMAM"
        highlight="O RESULTADO ✨"
        align="center"
      />

      <div className="mt-14 grid gap-7 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <Reveal key={t.id} delay={i * 90}>
            <figure className="card-premium flex h-full flex-col p-8">
              <div className="text-gold">
                <Stars rating={t.rating} />
              </div>

              <blockquote className="mt-6 flex-1 font-display text-[21px] leading-[1.5] text-espresso">
                “{t.text}”
              </blockquote>

              <figcaption className="mt-7 flex items-center gap-4 border-t border-champagne pt-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-champagne to-nude font-display text-[17px] text-espresso">
                  {t.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-[14px] tracking-[0.04em] text-ink">
                    {t.name}
                  </span>
                  {t.date ? (
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-espresso-soft/75">
                      {t.date}
                    </span>
                  ) : null}
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
