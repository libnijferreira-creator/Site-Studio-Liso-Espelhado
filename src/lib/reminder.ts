import { formatBRL, formatDateLong } from "./format";

/**
 * Lembretes de pagamento para confirmar o procedimento.
 *
 * Regras do texto (combinadas com o studio):
 *  - SEMPRE se apresenta como "Secretária <nome>" (padrão: Hadassa);
 *  - tom humano e próximo: fala em primeira pessoa, usa o primeiro nome da
 *    cliente, tem espaço, emoji leve e assinatura — nada de linguagem robótica;
 *  - mostra só o essencial: data/hora, serviço e o valor da taxa.
 *
 * É puro (não toca no banco) para poder ser importado pelo Client Component
 * da Agenda; o nome da secretária chega por props.
 */

/** Nome da secretária, com fallback pro padrão. */
export function assistantNameOf(raw: string | null | undefined): string {
  const name = String(raw ?? "").trim();
  return name || "Hadassa";
}

/** Primeiro nome — a mensagem soa mais pessoal assim. */
function firstName(full: string): string {
  return String(full ?? "").trim().split(/\s+/)[0] || "";
}

/** Serviço com o tamanho do cabelo, quando houver. */
function serviceLabel(a: {
  service_name: string;
  hair_size?: string | null;
}): string {
  return a.hair_size ? `${a.service_name} (${a.hair_size})` : a.service_name;
}

type ReminderData = {
  client_name: string;
  code: string;
  service_name: string;
  hair_size?: string | null;
  date: string;
  time: string;
  fee_cents: number;
};

/** Mensagem pronta para UMA cliente, assinada pela secretária. */
export function reminderMessage(a: ReminderData, secretary: string): string {
  const nome = firstName(a.client_name);
  const servico = serviceLabel(a);
  const data = formatDateLong(a.date);

  return [
    `Oi, ${nome}! Tudo bem? 💛`,
    ``,
    `Aqui é a Secretária ${secretary}, do Studio Liso Espelhado.`,
    ``,
    `Estava olhando a agenda e lembrei de você: o seu horário de ${data}, ` +
      `às ${a.time}, para o ${servico}, está reservado e só falta você ` +
      `confirmar. ✨`,
    ``,
    `Para eu deixar tudo certinho e garantir o seu lugar, falta apenas a ` +
      `taxa de reserva de ${formatBRL(a.fee_cents)}.`,
    `Assim que o pagamento cair eu mesma já confirmo o procedimento e te ` +
      `aviso por aqui. 🤍`,
    ``,
    `Qualquer dúvida é só me chamar, viu? Estou por aqui. Beijo!`,
    ``,
    `— Secretária ${secretary} · Studio Liso Espelhado`,
    `Código do agendamento: ${a.code}`,
  ].join("\n");
}

/**
 * Resumo de TODOS os não confirmados para a secretária enviar em um corte só:
 * índice com nome/data/valor + as mensagens prontas logo abaixo.
 */
export function reminderBatch(
  list: ReminderData[],
  secretary: string
): string {
  if (!list.length) return "";

  const header = [
    `Oi! Aqui é a Secretária ${secretary}, do Studio Liso Espelhado 👋`,
    ``,
    `Ficaram ${list.length} ${
      list.length === 1 ? "agendamento sem confirmação" : "agendamentos sem confirmação"
    }:`,
    ``,
    ...list.map(
      (a, i) =>
        `${i + 1}. ${a.client_name} — ${serviceLabel(a)} — ` +
        `${formatDateLong(a.date)} às ${a.time} — taxa ` +
        `${formatBRL(a.fee_cents)} — código ${a.code}`
    ),
    ``,
    `Abaixo a mensagem pronta para cada uma. É só copiar e enviar 💛`,
    ``,
    `──────────`,
    ``,
    ...list.map((a, i) =>
      [`▶ Cliente ${i + 1}`, reminderMessage(a, secretary)].join("\n")
    ),
  ];

  return header.join("\n");
}
