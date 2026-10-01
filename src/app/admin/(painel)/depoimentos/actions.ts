"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin/depoimentos");
}

export async function saveTestimonialAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const photo = String(formData.get("photo") || "").trim() || null;
  const text = String(formData.get("text") || "").trim();
  const rating = Math.min(5, Math.max(1, Number(formData.get("rating")) || 5));
  const rawDate = String(formData.get("date") || "").trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;
  const active = formData.get("active") === "inactive" ? "inactive" : "active";

  if (!name || !text) return;

  const db = getDb();
  if (Number.isFinite(id) && id > 0) {
    db.prepare(
      `UPDATE testimonials
          SET name = ?, photo = ?, text = ?, rating = ?, date = ?, active = ?
        WHERE id = ?`
    ).run(name, photo, text, rating, date, active, id);
  } else {
    const max = db
      .prepare("SELECT COALESCE(MAX(sort_order), -1) AS n FROM testimonials")
      .get() as { n: number };
    db.prepare(
      `INSERT INTO testimonials (name, photo, text, rating, date, active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(name, photo, text, rating, date, active, max.n + 1);
  }

  refresh();
}

export async function deleteTestimonialAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  getDb().prepare("DELETE FROM testimonials WHERE id = ?").run(id);
  refresh();
}

export async function toggleTestimonialAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  getDb()
    .prepare(
      "UPDATE testimonials SET active = CASE active WHEN 'active' THEN 'inactive' ELSE 'active' END WHERE id = ?"
    )
    .run(id);
  refresh();
}

export async function moveTestimonialAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir"));
  if (!Number.isFinite(id)) return;

  const db = getDb();
  const rows = db
    .prepare("SELECT id, sort_order FROM testimonials ORDER BY sort_order, id")
    .all() as unknown as { id: number; sort_order: number }[];
  const index = rows.findIndex((r) => r.id === id);
  const target = dir === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= rows.length) return;

  const update = db.prepare("UPDATE testimonials SET sort_order = ? WHERE id = ?");
  update.run(rows[target].sort_order, id);
  update.run(rows[index].sort_order, rows[target].id);

  refresh();
}
