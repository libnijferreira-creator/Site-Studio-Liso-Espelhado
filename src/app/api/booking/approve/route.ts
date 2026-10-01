import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getService, getSiteSettings } from "@/lib/queries";
import { availableSlots } from "@/lib/availability";
import { isSandbox } from "@/lib/payment";
import { notifyAdmins } from "@/lib/notify";

export const runtime = "nodejs";

type Payload = { code: string; method?: string; transactionId?: string };

/**
 * Confirma o pagamento da taxa de agendamento.
 *
 * - Em MODO DEMONSTRAÇÃO (sem token do Mercado Pago) é chamado pelo próprio
 *   botão da tela de pagamento.
 * - Em produção, o mesmo fluxo é acionado pelo webhook do Mercado Pago
 *   (/api/webhooks/mercadopago), que reusa `confirmPayment`.
 */
export async function POST(request: Request) {
  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const code = (payload.code || "").trim();
  if (!code) {
    return NextResponse.json({ error: "Código ausente." }, { status: 400 });
  }

  // Ambiente real: pagamento deve chegar pelo webhook assinado.
  if (!isSandbox() && !payload.transactionId) {
    return NextResponse.json(
      { error: "Aguarde a confirmação automática do Mercado Pago." },
      { status: 403 }
    );
  }

  const db = getDb();
  const appointment = db
    .prepare(
      `SELECT a.id, a.code, a.date, a.time, a.service_id, a.total_cents,
              a.fee_cents, a.remainder_cents, a.hair_size, a.hair_size_cents,
              a.status, a.payment_status,
              s.name AS service_name, s.duration_min AS duration_min,
              s.track AS track,
              c.name AS client_name, c.whatsapp AS client_whatsapp
         FROM appointments a
         JOIN services s ON s.id = a.service_id
         JOIN clients c ON c.id = a.client_id
        WHERE a.code = ?`
    )
    .get(code) as
    | {
        id: number;
        code: string;
        date: string;
        time: string;
        service_id: number;
        total_cents: number;
        fee_cents: number;
        remainder_cents: number;
        hair_size: string | null;
        hair_size_cents: number;
        status: string;
        payment_status: string;
        service_name: string;
        duration_min: number;
        track: string;
        client_name: string;
        client_whatsapp: string;
      }
    | undefined;

  if (!appointment) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  if (appointment.payment_status === "paid") {
    return NextResponse.json({
      ok: true,
      alreadyPaid: true,
      code: appointment.code,
    });
  }

  // Revalida o horário antes de travar o agendamento (ignora a própria reserva).
  const availability = availableSlots(appointment.date, appointment.duration_min, {
    excludeId: appointment.id,
    track: appointment.track === "nails" ? "nails" : "hair",
    enforceTrack: false,
  });
  const slotTaken = !availability.slots.includes(appointment.time);
  const stillPending = appointment.payment_status === "pending";

  if (slotTaken && stillPending) {
    db.prepare(
      "UPDATE appointments SET status = 'cancelled', payment_status = 'failed', updated_at = datetime('now') WHERE id = ?"
    ).run(appointment.id);

    return NextResponse.json(
      { error: "Este horário já foi ocupado. Escolha outra data." },
      { status: 409 }
    );
  }

  db.prepare(
    `UPDATE appointments
        SET payment_status = 'paid',
            status = 'confirmed',
            transaction_id = COALESCE(?, transaction_id),
            updated_at = datetime('now')
      WHERE id = ?`
  ).run(payload.transactionId?.trim() || null, appointment.id);

  // Confirmação: avisa os celulares cadastrados no painel.
  try {
    notifyAdmins(
      {
        id: appointment.id,
        code: appointment.code,
        clientName: appointment.client_name,
        clientPhone: appointment.client_whatsapp,
        serviceName: appointment.service_name,
        durationMin: appointment.duration_min,
        date: appointment.date,
        time: appointment.time,
        totalCents: appointment.total_cents,
        feeCents: appointment.fee_cents,
        remainderCents: appointment.remainder_cents,
        hairSize: appointment.hair_size,
        hairSizeCents: appointment.hair_size_cents,
      },
      "confirmed"
    );
  } catch {
    /* aviso é opcional */
  }

  const settings = getSiteSettings();

  return NextResponse.json({
    ok: true,
    code: appointment.code,
    status: "confirmed",
    paymentStatus: "paid",
    service: appointment.service_name,
    hairSize: appointment.hair_size,
    date: appointment.date,
    time: appointment.time,
    total: appointment.total_cents,
    fee: appointment.fee_cents,
    remainder: appointment.remainder_cents,
    studioPhone: settings.notifications.studioPhone || settings.site.whatsapp,
    whatsappLink: settings.site.whatsappLink,
    studioName: settings.site.name,
    sandbox: isSandbox(),
  });
}
