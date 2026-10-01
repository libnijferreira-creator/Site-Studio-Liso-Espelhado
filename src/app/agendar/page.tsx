import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/site/PageHero";
import { listServices, listWorkingHours, getSiteSettings } from "@/lib/queries";
import { getSetting } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { normalizeHairSizes } from "@/lib/hairsize";
import type { Schedule } from "@/lib/types";
import { formatBRL } from "@/lib/format";
import { BookingFlow } from "./BookingFlow";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Agendamento online",
  description:
    "Agende seu procedimento no Studio Liso Espelhado com Beatriz Ribeiro. Escolha o serviço, a data e o horário, pague a taxa de reserva online e receba a confirmação automática.",
};

export default function AgendarPage() {
  const services = listServices(true);
  const hours = listWorkingHours();
  const settings = getSiteSettings();
  const schedule = getSetting<Schedule>(
    "schedule",
    DEFAULT_SETTINGS.schedule as Schedule
  );
  const hairSizes = normalizeHairSizes(
    getSetting("hairSizes", DEFAULT_SETTINGS.hairSizes)
  );

  // Número do studio para a linha de ajuda (wa.me precisa de dígitos + DDI).
  const waDigitos = (() => {
    const d = (settings.site.whatsappLink || "").replace(/\D/g, "");
    return d ? (d.startsWith("55") ? d : `55${d}`) : "";
  })();
  const duvidaLink = waDigitos
    ? `https://wa.me/${waDigitos}?text=${encodeURIComponent(
        "Olá, Hadassa! Estou no site agendando e fiquei com uma dúvida. Pode me ajudar?"
      )}`
    : "/contato";

  // Meios de pagamento cadastrados (Conteúdo → Pagamento) — passo 02.
  const meioPagamento = (() => {
    const p = settings.payment;
    if (!p.enabled) return "PIX ou cartão, com aprovação imediata.";
    const partes: string[] = [];
    if (p.pixEnabled && p.pixKey)
      partes.push(`PIX na chave do studio${p.bank ? ` (${p.bank})` : ""}`);
    if (p.cardEnabled)
      partes.push(`cartão pelo aplicativo${p.bank ? ` ${p.bank}` : ""}`);
    return `${partes.join(" ou ") || "PIX ou cartão"}, com envio do comprovante pelo WhatsApp.`;
  })();

  return (
    <>
      <PageHero
        eyebrow="Reserva online"
        title="Agende seu"
        highlight="horário"
        description="Escolha o serviço, a data e o horário em poucos passos. A taxa de agendamento de 15% é calculada automaticamente e garante a reserva do seu horário."
      />

      <section className="py-14 sm:py-20">
        <div className="container-site">
          <Suspense fallback={null}>
            <BookingFlow
              services={services}
              hours={hours}
              schedule={schedule}
              hairSizes={hairSizes}
              payment={settings.payment}
              studioWaLink={waDigitos}
            />
          </Suspense>
        </div>
      </section>

      <section className="pb-14 sm:pb-20">
        <div className="container-site">
          <div className="border border-champagne bg-white p-6 sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-7">
              <div className="max-w-2xl">
                <p className="eyebrow mb-3">Ficou com dúvidas?</p>
                <h2 className="text-[26px] leading-tight sm:text-[30px]">
                  Fale com a <span className="italic text-gold-deep">Hadassa</span>,
                  secretária virtual
                </h2>
                <p className="mt-4 text-[14px] leading-relaxed text-espresso-soft/80">
                  Travou em alguma etapa, quer saber o valor de um serviço,
                  confirmar o dia de unhas ou falar sobre pagamento? É só chamar:
                  a Hadassa se identifica como secretária virtual, tira a sua
                  dúvida e direciona a mensagem para os{" "}
                  <strong className="text-espresso">
                    dois celulares cadastrados
                  </strong>{" "}
                  do Studio.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={duvidaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold"
                >
                  Tirar dúvida no WhatsApp
                </a>
                <a href="/contato" className="btn btn-outline">
                  Ver contato
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-champagne bg-offwhite py-10">
        <div className="container-site">
          <div className="grid gap-6 sm:grid-cols-3">
            <Info
              passo="01"
              titulo="Escolha e reserve"
              texto="Selecione o procedimento, a data e o horário disponível. A reserva é feita em menos de 2 minutos."
            />
            <Info
              passo="02"
              titulo="Pague a taxa de 15%"
              texto={`${meioPagamento} Equivale a ${formatBRL(
                Math.round(
                  Math.min(...services.map((s) => s.price_cents)) * 0.15
                )
              )} a partir do menor serviço.`}
            />
            <Info
              passo="03"
              titulo="Confirmação automática"
              texto={
                settings.notifications.studioPhone
                  ? `Você recebe a confirmação e o lembrete no WhatsApp ${settings.notifications.studioPhone}.`
                  : "Você recebe a confirmação e o lembrete pelo WhatsApp, e o horário fica travado na agenda."
              }
            />
          </div>

          <p className="mt-8 border-l-2 border-gold/60 pl-5 text-[13px] leading-relaxed text-espresso-soft/75">
            <strong className="text-gold-deep">Horários de funcionamento:</strong>{" "}
            {settings.site.hours}. Cancelamentos e remarcações devem ser feitos com
            pelo menos 24 horas de antecedência pelo WhatsApp {settings.site.whatsapp}.
          </p>
        </div>
      </section>
    </>
  );
}

function Info({ passo, titulo, texto }: { passo: string; titulo: string; texto: string }) {
  return (
    <div className="border-t-2 border-gold/50 pt-5">
      <p className="text-[10px] uppercase tracking-[0.3em] text-gold-deep">{passo}</p>
      <h3 className="mt-2.5 text-[20px] leading-tight">{titulo}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-espresso-soft/75">{texto}</p>
    </div>
  );
}
