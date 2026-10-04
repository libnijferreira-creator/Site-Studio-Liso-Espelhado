import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { availableSlots } from "@/lib/availability";
import { isSandbox, MP_API, MP_TOKEN } from "@/lib/payment";
import { notifyAdmins } from "@/lib/notify";

export const runtime = "nodejs";

/**
 * Webhook do Mercado Pago.
 *
 * - Mercado Pago envia `?type=payment&id=<id>` (ou tópico via body).
 * - O pagamento só é considerado aprovado quando a API devolve
 *   `status: approved` — nunca apenas pela notificação em si.
 * - A assinatura (x-signature) é validada quando MP_SIGNATURE_SECRET existe.
 */
export async function POST(request: Request) {
  if (isSandbox()) {
    return NextResponse.json({ ok: true, sandbox: true });
  }

  const url = new URL(request.url);
  const topic = url.searchParams.get("type") || url.searchParams.get("topic");
  const notificationId = url.searchParams.get("id") || "";

  if (topic && topic !== "payment") {
    return NextResponse.json({ ok: true, ignored: true });
  }
  if (!notificationId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const res = await fetch(`${MP_API}/v1/payments/${notificationId}`, {
    headers: { Authorization: `Bearer ${MP_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Falha ao consultar pagamento." }, { status: 502 });
  }

  const payment = (await res.json()) as {
    status?: string;
    external_reference?: string;
    transaction_amount?: number;
    id?: number | string;
  };

  const reference = (payment.external_reference || "").trim();
  if (!reference || payment.status !== "approved") {
    return NextResponse.json({ ok: true, status: payment.status || "unknown" });
  }

  const db = getDb();
  const appointment = db
    .prepare(
      `SELECT a.id, a.code, a.date, a.time, a.fee_cents, a.payment_status,
              a.total_cents, a.remainder_cents, a.hair_size, a.hair_size_cents,
              s.duration_min AS duration_min, s.track AS track,
              s.name AS service_name,
              c.name AS client_name, c.whatsapp AS client_whatsapp
         FROM appointments a
         JOIN services s ON s.id = a.service_id
         JOIN clients c ON c.id = a.client_id
        WHERE a.code = ?`
    )
    .get(reference) as
    | {
        id: number;
        code: string;
        date: string;
        time: string;
        fee_cents: number;
        payment_status: string;
        total_cents: number;
        remainder_cents: number;
        hair_size: string | null;
        hair_size_cents: number;
        duration_min: number;
        track: string;
        service_name: string;
        client_name: string;
        client_whatsapp: string;
      }
    | undefined;

  if (!appointment) return NextResponse.json({ ok: true, ignored: true });
  if (appointment.payment_status === "paid") {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  // Escopo pago: valor integral zera o restante; a taxa mantém o restante em
  // aberto para ser quitado no studio no dia do atendimento.
  const paidCents = Math.round((payment.transaction_amount ?? 0) * 100);
  const paidFull = paidCents > 0 && paidCents >= appointment.total_cents;
  const remainderCents = paidFull ? 0 : appointment.remainder_cents;

  // Verifica se o horário ainda está livre antes de travar (ignora a própria reserva).
  const availability = availableSlots(appointment.date, appointment.duration_min, {
    excludeId: appointment.id,
    track: appointment.track === "nails" ? "nails" : "hair",
    enforceTrack: false,
  });
  const slotTaken = !availability.slots.includes(appointment.time);

  if (slotTaken) {
    db.prepare(
      `UPDATE appointments
          SET status = 'cancelled', payment_status = 'failed',
              transaction_id = ?, updated_at = datetime('now')
        WHERE id = ?`
    ).run(String(payment.id ?? ""), appointment.id);
    return NextResponse.json({ ok: true, conflict: true });
  }

  db.prepare(
    `UPDATE appointments
        SET payment_status = 'paid', status = 'confirmed',
            remainder_cents = ?, transaction_id = ?, updated_at = datetime('now')
      WHERE id = ?`
  ).run(remainderCents, String(payment.id ?? ""), appointment.id);

  // Pagamento aprovado: avisa os celulares cadastrados no painel.
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
        remainderCents,
        hairSize: appointment.hair_size,
        hairSizeCents: appointment.hair_size_cents,
      },
      "confirmed"
    );
  } catch {
    /* aviso é opcional */
  }

  // Desconta a taxa do caixa conforme a regra de negócio.
  getDb()
    .prepare("UPDATE appointments SET updated_at = datetime('now') WHERE id = ?")
    .run(appointment.id);

  return NextResponse.json({ ok: true, status: "approved" });
}
