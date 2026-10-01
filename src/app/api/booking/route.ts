import { NextResponse } from "next/server";
import { getDb, getSetting } from "@/lib/db";
import { getService, getSiteSettings } from "@/lib/queries";
import { availableSlots } from "@/lib/availability";
import { feeFor, onlyDigits, remainderFor } from "@/lib/format";
import { notifyAdmins } from "@/lib/notify";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { normalizeHairSizes, resolveSize } from "@/lib/hairsize";

export const runtime = "nodejs";

type Payload = {
  serviceId: number;
  date: string;
  time: string;
  name: string;
  whatsapp: string;
  email?: string;
  cpf?: string;
  notes?: string;
  /** Id do tamanho do cabelo (curto/medio/longo/extra-longo) — serviços de cabelo. */
  hairSize?: string;
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

  const { serviceId, date, time } = payload;
  const name = (payload.name || "").trim();
  const whatsapp = onlyDigits(payload.whatsapp || "");

  if (!name || name.length < 3) return bad("Informe o nome completo.");
  if (whatsapp.length < 10) return bad("Informe um WhatsApp válido.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad("Data inválida.");
  if (!/^\d{2}:\d{2}$/.test(time)) return bad("Horário inválido.");

  const service = getService(serviceId);
  if (!service || service.status !== "active") {
    return bad("Serviço indisponível.", 404);
  }

  // O horário precisa continuar livre neste exato momento.
  const availability = availableSlots(date, service.duration_min, {
    track: service.track ?? "hair",
  });
  if (!availability.slots.includes(time)) {
    const message =
      availability.closed && availability.reason
        ? availability.reason
        : "Este horário não está mais disponível.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  const db = getDb();

  // Tamanho do cabelo: só serviços de cabelo, valor e rótulo vindos do painel.
  const sizeSettings = normalizeHairSizes(
    getSetting("hairSizes", DEFAULT_SETTINGS.hairSizes)
  );
  const size = resolveSize(sizeSettings, service, payload.hairSize);
  const hairSize = size?.label ?? null;
  const hairSizeCents = size?.price_cents ?? 0;

  const total = service.price_cents + hairSizeCents;
  const fee = feeFor(total);
  const remainder = remainderFor(total);

  const client = db
    .prepare("SELECT id FROM clients WHERE whatsapp = ? OR name = ? ORDER BY id LIMIT 1")
    .get(whatsapp, name) as { id: number } | undefined;

  let clientId: number;
  if (client) {
    clientId = client.id;
    db.prepare(
      "UPDATE clients SET name = ?, whatsapp = ?, email = COALESCE(?, email), cpf = COALESCE(?, cpf) WHERE id = ?"
    ).run(name, whatsapp, payload.email?.trim() || null, onlyDigits(payload.cpf || "") || null, clientId);
  } else {
    const info = db
      .prepare(
        "INSERT INTO clients (name, whatsapp, email, cpf) VALUES (?, ?, ?, ?)"
      )
      .run(
        name,
        whatsapp,
        payload.email?.trim() || null,
        onlyDigits(payload.cpf || "") || null
      );
    clientId = Number(info.lastInsertRowid);
  }

  const code = `SLE-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const info = db
    .prepare(
      `INSERT INTO appointments
         (code, client_id, service_id, date, time, total_cents, fee_cents,
          remainder_cents, hair_size, hair_size_cents, status, payment_status,
          payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', NULL, ?)`
    )
    .run(
      code,
      clientId,
      service.id,
      date,
      time,
      total,
      fee,
      remainder,
      hairSize,
      hairSizeCents,
      payload.notes?.trim() || null
    );

  // Avisa os celulares cadastrados no painel (Conteúdo → Avisos).
  try {
    notifyAdmins(
      {
        id: Number(info.lastInsertRowid),
        code,
        clientName: name,
        clientPhone: payload.whatsapp,
        serviceName: service.name,
        durationMin: service.duration_min,
        date,
        time,
        totalCents: total,
        feeCents: fee,
        remainderCents: remainder,
        hairSize,
        hairSizeCents,
      },
      "booking"
    );
  } catch {
    /* aviso é opcional — nunca derruba a reserva */
  }

  const settings = getSiteSettings();

  return NextResponse.json({
    code,
    appointmentId: Number(info.lastInsertRowid),
    service: { id: service.id, name: service.name, duration_min: service.duration_min },
    date,
    time,
    total,
    fee,
    remainder,
    hairSize,
    hairSizeCents,
    feePercent: settings.fee.percent,
    feeNote: settings.fee.note,
  });
}
