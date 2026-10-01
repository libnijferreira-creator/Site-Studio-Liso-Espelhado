import Link from "next/link";
import { Reveal } from "./Reveal";

export function CtaBanner({
  title = "Pronta para o seu novo liso?",
  description = "Escolha o procedimento, a data e o horário. Confirmamos assim que a taxa de reserva for aprovada.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-cream py-16 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(115deg, rgba(231,220,201,.9), rgba(247,243,238,.6) 45%, rgba(220,198,180,.75))",
        }}
      />
      <div className="container-site relative">
        <Reveal>
          <div className="flex flex-col items-center gap-7 text-center">
            <p className="eyebrow">Agendamento online 24 horas</p>
            <h2 className="max-w-3xl text-[34px] leading-[1.05] sm:text-[46px]">
              {title}
            </h2>
            <div className="rule-gold w-40" />
            <p className="max-w-xl text-[15.5px] leading-relaxed text-espresso-soft/85">
              {description}
            </p>
            <Link href="/agendar" className="btn btn-gold">
              Agendar meu horário
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
