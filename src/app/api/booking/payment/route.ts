import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getService, getSiteSettings } from "@/lib/queries";
import {
  createCardCheckout,
  createPixCharge,
  type Method,
  type PaymentSession,
} from "@/lib/payment";
import { onlyDigits } from "@/lib/format";

export const runtime = "nodejs";

type Payload = {
  code: string;
  method: Method;
  payer?: { name?: string; email?: string; cpf?: string };
};

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return bad("Corpo inválido.");
  }

  const code = (payload.code || "").trim();
  const method: Method = payload.method === "card" ? "card" : "pix";

  if (!code) return bad("Código do agendamento ausente.");

  const db = getDb();
  const appointment = db
    .prepare(
      `SELECT a.id, a.code, a.service_id, a.total_cents, a.fee_cents,
              a.status, a.payment_status, c.name AS client_name,
              c.email AS client_email, c.cpf AS client_cpf
         FROM appointments a
         JOIN clients c ON c.id = a.client_id
        WHERE a.code = ?`
    )
    .get(code) as
    | {
        id: number;
        code: string;
        service_id: number;
        total_cents: number;
        fee_cents: number;
        status: string;
        payment_status: string;
        client_name: string;
        client_email: string | null;
        client_cpf: string | null;
      }
    | undefined;

  if (!appointment) return bad("Agendamento não encontrado.", 404);
  if (appointment.status === "cancelled") {
    return bad("Agendamento cancelado.", 409);
  }
  if (appointment.payment_status === "paid") {
    return bad("Esta taxa já foi paga.", 409);
  }

  const service = getService(appointment.service_id);
  const settings = getSiteSettings();

  const payer = {
    name: payload.payer?.name?.trim() || appointment.client_name,
    email: payload.payer?.email?.trim() || appointment.client_email || undefined,
    cpf:
      onlyDigits(payload.payer?.cpf || "") ||
      appointment.client_cpf ||
      undefined,
  };

  const common = {
    reference: `${appointment.code}`,
    amountCents: appointment.fee_cents,
    description: `Taxa de agendamento — ${service?.name ?? "Studio Liso"} (${settings.site.name})`,
    payer,
  };

  let session: PaymentSession;
  try {
    session =
      method === "card"
        ? await createCardCheckout(common)
        : await createPixCharge(common);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao criar o pagamento.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Registra o meio de pagamento escolhido — o status só muda na aprovação.
  db.prepare(
    "UPDATE appointments SET payment_method = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(method, appointment.id);

  return NextResponse.json({
    ...session,
    appointment: {
      id: appointment.id,
      code: appointment.code,
      serviceName: service?.name ?? "",
      total: appointment.total_cents,
      fee: appointment.fee_cents,
      remainder: appointment.total_cents - appointment.fee_cents,
    },
  });
}
