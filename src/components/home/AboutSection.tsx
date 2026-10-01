import Link from "next/link";
import { Media } from "@/components/site/ArtPanel";
import { Reveal } from "@/components/site/Reveal";

export function AboutSection({
  about,
  withCta = true,
}: {
  about: {
    title: string;
    role: string;
    photo: string | null;
    story: string;
    philosophy: string;
    specialties: string[];
    credentials: string[];
  };
  withCta?: boolean;
}) {
  return (
    <section id="sobre" className="py-20 sm:py-24 lg:py-28">
      <div className="container-site grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <div className="relative">
            <div className="absolute -left-4 -top-4 hidden h-28 w-28 border-l border-t border-gold/60 sm:block" />
            <div className="absolute -bottom-4 -right-4 hidden h-28 w-28 border-b border-r border-gold/60 sm:block" />
            <Media
              src={about.photo}
              alt={about.title}
              variant="portrait"
              label="Beatriz Ribeiro"
              className="aspect-[4/5] w-full"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </div>
        </Reveal>

        <Reveal delay={120} className="lg:col-span-7">
          <p className="eyebrow mb-5">A profissional</p>
          <h2 className="text-[36px] leading-[1.03] sm:text-[46px] lg:text-[54px]">
            Conheça <span className="italic gold-text">{about.title}</span>
          </h2>
          <div className="rule-gold mt-6 w-40" />

          <p className="mt-6 text-[11px] uppercase tracking-[0.24em] text-espresso-soft/75">
            {about.role}
          </p>

          <p className="mt-6 text-[16px] leading-relaxed text-espresso-soft/90">
            {about.story}
          </p>

          <div className="mt-8 border-l-2 border-gold pl-6">
            <p className="font-display text-[21px] italic leading-relaxed text-espresso">
              “{about.philosophy}”
            </p>
          </div>

          <div className="mt-9 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="mb-4 text-[11px] uppercase tracking-[0.24em] text-gold-deep">
                Especialidades
              </h3>
              <ul className="space-y-2.5 text-[14.5px] text-espresso-soft">
                {about.specialties.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-[11px] uppercase tracking-[0.24em] text-gold-deep">
                Formação
              </h3>
              <ul className="space-y-2.5 text-[14.5px] text-espresso-soft">
                {about.credentials.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {withCta ? (
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/sobre" className="btn btn-dark">
                Conhecer Beatriz
              </Link>
              <Link href="/agendar" className="btn btn-outline">
                Agendar meu horário
              </Link>
            </div>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
