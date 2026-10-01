"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

function refresh() {
  revalidatePath("/");
  revalidatePath("/mostruario");
  revalidatePath("/resultados");
  revalidatePath("/admin/galeria");
}

export async function saveGalleryItemAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const id = Number(formData.get("id"));
  const title = String(formData.get("title") || "").trim();
  const caption = String(formData.get("caption") || "").trim() || null;
  const image = String(formData.get("image") || "").trim() || null;
  const video_url = String(formData.get("video_url") || "").trim() || null;
  const media_type = formData.get("media_type") === "video" ? "video" : "image";
  const kind = String(formData.get("kind") || "trabalho");
  const active = formData.get("active") === "inactive" ? "inactive" : "active";

  if (!title) return;
  if (media_type === "video" && !video_url) return;
  if (media_type === "image" && !image) return;

  const db = getDb();

  if (Number.isFinite(id) && id > 0) {
    db.prepare(
      `UPDATE gallery
          SET title = ?, caption = ?, image = ?, video_url = ?, media_type = ?,
              kind = ?, active = ?
        WHERE id = ?`
    ).run(title, caption, image, video_url, media_type, kind, active, id);
  } else {
    const max = db
      .prepare("SELECT COALESCE(MAX(sort_order), -1) AS n FROM gallery")
      .get() as { n: number };
    db.prepare(
      `INSERT INTO gallery (title, caption, image, video_url, media_type, kind, active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(title, caption, image, video_url, media_type, kind, active, max.n + 1);
  }

  refresh();
}

export async function deleteGalleryItemAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  getDb().prepare("DELETE FROM gallery WHERE id = ?").run(id);
  refresh();
}

export async function toggleGalleryItemAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  getDb()
    .prepare(
      "UPDATE gallery SET active = CASE active WHEN 'active' THEN 'inactive' ELSE 'active' END WHERE id = ?"
    )
    .run(id);
  refresh();
}

export async function moveGalleryItemAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir"));
  if (!Number.isFinite(id)) return;

  const db = getDb();
  const current = db.prepare("SELECT * FROM gallery WHERE id = ?").get(id) as
    | { id: number; sort_order: number }
    | undefined;
  if (!current) return;

  const rows = db
    .prepare("SELECT id, sort_order FROM gallery ORDER BY sort_order, id")
    .all() as unknown as { id: number; sort_order: number }[];
  const index = rows.findIndex((r) => r.id === id);
  const target = dir === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= rows.length) return;

  const swap = rows[target];
  const update = db.prepare("UPDATE gallery SET sort_order = ? WHERE id = ?");
  update.run(swap.sort_order, current.id);
  update.run(current.sort_order, swap.id);

  refresh();
}
