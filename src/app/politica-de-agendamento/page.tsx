import { LegalPage, legalMetadata } from "@/components/site/LegalPage";
import { getSetting } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { getSiteSettings } from "@/lib/queries";
import type { Metadata } from "next";
import type { Schedule } from "@/lib/types";

// Metadata dinâmica: o % da taxa vem do banco (Conteúdo → Taxa). Se ficasse
// em `export const metadata`, o número do texto de busca seria fixo.
export function generateMetadata(): Metadata {
  const feePercent = getSiteSettings().fee.percent;
  return legalMetadata(
    "Política de Agendamento — Studio Liso Espelhado",
    `Regras de reserva, taxa de ${feePercent}%, cancelamento, remarcação e pontualidade do Studio Liso Espelhado com Beatriz Ribeiro.`
  );
}

const WEEKDAYS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

export default function PoliticaAgendamentoPage() {
  const schedule = getSetting<Schedule>(
    "schedule",
    DEFAULT_SETTINGS.schedule as Schedule
  );
  const dia = schedule.nailWeekdayLabel || WEEKDAYS[schedule.nailWeekday];
  const feePercent = getSiteSettings().fee.percent;

  return (
    <LegalPage
      eyebrow="Reservas e pagamentos"
      title="Política de"
      highlight="Agendamento"
      description={`Tudo o que você precisa saber sobre a reserva online, a taxa de ${feePercent}% e as regras de remarcação.`}
      updated="30 de setembro de 2026"
      sections={[
        {
          h: "Como funciona a reserva",
          p: [
            "O agendamento é feito em 7 etapas: escolha do serviço, da data, do horário, preenchimento dos dados, revisão do resumo, pagamento da taxa de reserva e confirmação automática.",
            "Somente após a aprovação do pagamento o horário é travado na agenda com status Confirmado. Até lá, ele pode ser oferecido a outra cliente.",
          ],
        },
        {
          h: `Taxa de agendamento de ${feePercent}%`,
          table: [
            {
              k: "Como é calculada",
              v: `${feePercent}% sobre o valor do procedimento, automaticamente.`,
            },
            { k: "Quando é paga", v: "No ato da reserva, por PIX, antes da confirmação." },
            { k: "O que garante", v: "A reserva exclusiva do horário e a vaga na agenda." },
            { k: "O restante", v: "Pago diretamente no Studio, no dia do atendimento." },
            { k: "Reembolso", v: "Aplicam-se as regras de cancelamento abaixo." },
          ],
          p: [
            "A taxa é cobrada por procedimento e por reserva. O valor restante é pago no Studio, na forma que preferir (dinheiro, PIX, débito ou crédito).",
          ],
        },
        {
          h: "Confirmação e lembrete",
          p: [
            "Assim que o pagamento é aprovado, a reserva passa a status Confirmado e você recebe a confirmação pelo canal informado no agendamento.",
            "Um lembrete é enviado antes do atendimento. Recomendamos manter o WhatsApp atualizado.",
          ],
        },
        {
          h: "Cancelamento e remarcação",
          ul: [
            "Com mais de 24 horas de antecedência: remarcação gratuita ou devolução integral da taxa.",
            `Com menos de 24 horas: a taxa de ${feePercent}% não é devolvida, por se tratar de horário já bloqueado.`,
            "Não comparecimento (falta): a taxa não é devolvida e novas reservas poderão exigir pagamento antecipado integral.",
            "Cancelamento pelo Studio (imprevisto, doença ou falta de produto): devolução integral da taxa ou remarcação sem custo, à escolha da cliente.",
          ],
        },
        {
          h: "Pontualidade",
          p: [
            "Chegue com até 10 minutos de antecedência. Atrasos acima de 15 minutos podem encurtar o atendimento ou exigir remarcação, conforme a disponibilidade restante do dia, sem devolução da taxa.",
          ],
        },
        {
          h: "Horários de funcionamento",
          p: [
            "Terça a sábado, das 09h às 18h. Domingo e segunda-feira fechado.",
            "Dias e horários bloqueados para viagens, férias ou manutenção ficam automaticamente indisponíveis no calendário do agendamento.",
          ],
        },
        {
          h: `Dia de unhas — ${dia}`,
          ul: [
            `Atendimentos de unha (Nail Design, Tips, Gel e Manutenção) são realizados somente ${dia}.`,
            `Neste dia não há atendimento de cabelo: os horários de cabelo não são oferecidos no calendário.`,
            "Se você deseja unha e cabelo no mesmo dia, faça duas reservas em datas diferentes.",
            "Lembramos que a taxa de agendamento é cobrada por procedimento e por reserva.",
          ],
          p: [
            `Na ${dia} o Studio atende exclusivamente a agenda de unhas. Nos demais dias de funcionamento (terça a sábado, exceto ${dia}) são realizados os atendimentos de cabelo.`,
          ],
        },
        {
          h: "Segurança do agendamento",
          p: [
            "Os dados informados são usados exclusivamente para confirmar a sua reserva e são tratados conforme a Política de Privacidade (LGPD).",
            "O pagamento é feito por PIX e o Studio não armazena dados bancários nem informações de pagamento.",
          ],
        },
        {
          h: "Contato",
          p: [
            "WhatsApp (24) 98153-1771 — Rua Roberto Cotrim, 519, Bairro Campo Alegre, Itatiaia/RJ.",
          ],
        },
      ]}
    />
  );
}
