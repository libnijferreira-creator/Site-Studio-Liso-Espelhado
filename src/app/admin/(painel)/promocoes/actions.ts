"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

function refresh() {
  revalidatePath("/");
  revalidatePath("/promocoes");
  revalidatePath("/admin/promocoes");
  revalidatePath("/admin");
}

function toCents(value: FormDataEntryValue | null): number {
  const raw = String(value ?? "0").replace(",", ".");
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function optionalDate(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

export async function savePromotionAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const id = Number(formData.get("id"));
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const image = String(formData.get("image") || "").trim() || null;
  const original = toCents(formData.get("original_price"));
  const promo = toCents(formData.get("promo_price"));
  const start = optionalDate(formData.get("start_date"));
  const end = optionalDate(formData.get("end_date"));
  const cta = String(formData.get("cta_label") || "").trim() || "APROVEITAR PROMOÇÃO";
  const serviceRaw = String(formData.get("service_id") || "");
  const serviceId = /^\d+$/.test(serviceRaw) ? Number(serviceRaw) : null;
  const active = formData.get("active") === "inactive" ? "inactive" : "active";

  if (!title || promo <= 0) return;

  const db = getDb();

  if (Number.isFinite(id) && id > 0) {
    db.prepare(
      `UPDATE promotions
          SET title = ?, description = ?, image = ?, original_price_cents = ?,
              promo_price_cents = ?, start_date = ?, end_date = ?, cta_label = ?,
              service_id = ?, active = ?
        WHERE id = ?`
    ).run(title, description, image, original, promo, start, end, cta, serviceId, active, id);
  } else {
    const max = db
      .prepare("SELECT COALESCE(MAX(sort_order), -1) AS n FROM promotions")
      .get() as { n: number };
    db.prepare(
      `INSERT INTO promotions
         (title, description, image, original_price_cents, promo_price_cents,
          start_date, end_date, cta_label, service_id, active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(title, description, image, original, promo, start, end, cta, serviceId, active, max.n + 1);
  }

  refresh();
}

export async function deletePromotionAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  getDb().prepare("DELETE FROM promotions WHERE id = ?").run(id);
  refresh();
}

export async function togglePromotionAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  getDb()
    .prepare(
      "UPDATE promotions SET active = CASE active WHEN 'active' THEN 'inactive' ELSE 'active' END WHERE id = ?"
    )
    .run(id);
  refresh();
}

export async function movePromotionAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir"));
  if (!Number.isFinite(id)) return;

  const db = getDb();
  const rows = db
    .prepare("SELECT id, sort_order FROM promotions ORDER BY sort_order, id")
    .all() as unknown as { id: number; sort_order: number }[];
  const index = rows.findIndex((r) => r.id === id);
  const target = dir === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= rows.length) return;

  const update = db.prepare("UPDATE promotions SET sort_order = ? WHERE id = ?");
  update.run(rows[target].sort_order, id);
  update.run(rows[index].sort_order, rows[target].id);

  refresh();
}
