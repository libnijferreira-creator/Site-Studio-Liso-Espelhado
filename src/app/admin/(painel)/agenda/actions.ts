"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { notifyAdmins } from "@/lib/notify";
import { getSession } from "@/lib/session";

function refresh() {
  revalidatePath("/admin/agenda");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/agendar");
}

type Status = "pending" | "approved" | "confirmed" | "cancelled" | "completed";

const ALLOWED: Status[] = [
  "pending",
  "approved",
  "confirmed",
  "cancelled",
  "completed",
];

export async function setAppointmentStatusAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const id = Number(formData.get("id"));
  const status = String(formData.get("status") || "") as Status;

  if (!Number.isFinite(id) || !ALLOWED.includes(status)) return;

  const db = getDb();
  const row = db
    .prepare("SELECT id, payment_status FROM appointments WHERE id = ?")
    .get(id) as { id: number; payment_status: string } | undefined;
  if (!row) return;

  // Confirmado exige pagamento aprovado.
  if (status === "confirmed" && row.payment_status !== "paid") {
    return;
  }

  db.prepare(
    "UPDATE appointments SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(status, id);

  refresh();
}

/** Marca a taxa como recebida (PIX confirmado pelo admin) e trava o horário. */
export async function markPaidAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;

  const db = getDb();
  const row = db
    .prepare(
      `SELECT a.id, a.code, a.date, a.time, a.total_cents, a.fee_cents,
              a.remainder_cents, a.hair_size, a.hair_size_cents, a.status,
              c.name AS client_name, c.whatsapp AS client_whatsapp,
              s.name AS service_name, s.duration_min
         FROM appointments a
         JOIN clients c ON c.id = a.client_id
         JOIN services s ON s.id = a.service_id
        WHERE a.id = ?`
    )
    .get(id) as
    | {
        id: number;
        code: string;
        date: string;
        time: string;
        total_cents: number;
        fee_cents: number;
        remainder_cents: number;
        hair_size: string | null;
        hair_size_cents: number;
        status: string;
        client_name: string;
        client_whatsapp: string;
        service_name: string;
        duration_min: number;
      }
    | undefined;

  db.prepare(
    `UPDATE appointments
        SET payment_status = 'paid', status = 'confirmed',
            updated_at = datetime('now')
      WHERE id = ? AND status <> 'cancelled'`
  ).run(id);

  // PIX/cartão confirmados manualmente: gera o aviso de CONFIRMAÇÃO para os
  // celulares cadastrados (Conteúdo → Avisos), igual ao Mercado Pago.
  if (row && row.status !== "cancelled") {
    try {
      notifyAdmins(
        {
          id: row.id,
          code: row.code,
          clientName: row.client_name,
          clientPhone: row.client_whatsapp,
          serviceName: row.service_name,
          durationMin: row.duration_min,
          date: row.date,
          time: row.time,
          totalCents: row.total_cents,
          feeCents: row.fee_cents,
          remainderCents: row.remainder_cents,
          hairSize: row.hair_size,
          hairSizeCents: row.hair_size_cents,
        },
        "confirmed"
      );
    } catch {
      /* aviso é opcional */
    }
  }

  refresh();
}

export async function addBlockAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const date = String(formData.get("date") || "");
  const start = String(formData.get("start_time") || "").trim() || null;
  const end = String(formData.get("end_time") || "").trim() || null;
  const reason = String(formData.get("reason") || "").trim() || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  if (start && end && start >= end) return;

  getDb()
    .prepare(
      "INSERT INTO blocks (date, start_time, end_time, reason) VALUES (?, ?, ?, ?)"
    )
    .run(date, start, end, reason);

  refresh();
}

export async function deleteBlockAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  getDb().prepare("DELETE FROM blocks WHERE id = ?").run(id);
  refresh();
}
