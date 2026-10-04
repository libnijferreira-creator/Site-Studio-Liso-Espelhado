"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAdmin,
  getDb,
  getSetting,
  removeAdmin,
  setAdminPassword,
  setSetting,
  verifyAdmin,
} from "@/lib/db";
import { normalizeHairSizes } from "@/lib/hairsize";
import { endSession, getSession, startSession } from "@/lib/session";

/* --------------------------------- auth ---------------------------------- */

export type FormState = { error?: string; ok?: string } | null;

export async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !password) {
    return { error: "Informe usuário e senha." };
  }

  const admin = verifyAdmin(username, password);
  if (!admin) {
    return { error: "Usuário ou senha inválidos." };
  }

  await startSession(admin.id);
  redirect("/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

/* ------------------------------- serviços -------------------------------- */

function parsePrice(value: FormDataEntryValue | null): number {
  const raw = String(value ?? "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100);
}

function serviceFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    price_cents: parsePrice(formData.get("price")),
    duration_min: Math.max(
      5,
      Number.parseInt(String(formData.get("duration_min") || "60"), 10) || 60
    ),
    category: String(formData.get("category") || "Tratamentos").trim(),
    track: formData.get("track") === "nails" ? "nails" : "hair",
    image: (String(formData.get("image") || "").trim() || null) as string | null,
    status: formData.get("status") === "inactive" ? "inactive" : "active",
  };
}

export async function createServiceAction(formData: FormData) {
  await requireSession();
  const s = serviceFromForm(formData);
  if (!s.name) return;

  const db = getDb();
  const max = db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) AS n FROM services")
    .get() as { n: number };

  db.prepare(
    `INSERT INTO services (name, description, price_cents, duration_min, image, category, track, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    s.name,
    s.description,
    s.price_cents,
    s.duration_min,
    s.image,
    s.category,
    s.track,
    s.status,
    max.n + 1
  );

  refreshSite();
}

export async function updateServiceAction(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;

  const s = serviceFromForm(formData);
  if (!s.name) return;

  getDb()
    .prepare(
      `UPDATE services
         SET name = ?, description = ?, price_cents = ?, duration_min = ?,
             image = ?, category = ?, track = ?, status = ?
       WHERE id = ?`
    )
    .run(
      s.name,
      s.description,
      s.price_cents,
      s.duration_min,
      s.image,
      s.category,
      s.track,
      s.status,
      id
    );

  refreshSite();
}

export async function deleteServiceAction(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  getDb().prepare("DELETE FROM services WHERE id = ?").run(id);
  refreshSite();
}

export async function toggleServiceAction(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  getDb()
    .prepare(
      "UPDATE services SET status = CASE status WHEN 'active' THEN 'inactive' ELSE 'active' END WHERE id = ?"
    )
    .run(id);
  refreshSite();
}

function refreshSite() {
  revalidatePath("/");
  revalidatePath("/servicos");
  revalidatePath("/agendar");
  revalidatePath("/admin/servicos");
  revalidatePath("/admin");
}

/* --------------------------- tamanho do cabelo --------------------------- */

/**
 * Salva a seleção de tamanho do cabelo (rótulo + acréscimo de cada um).
 * Os ids são fixos (curto/medio/longo/extra-longo) — só rótulo e valor mudam.
 */
export async function saveHairSizesAction(formData: FormData) {
  await requireSession();
  const current = normalizeHairSizes(getSetting("hairSizes", null));

  // O form inteiro é enviado junto com o botão "Remover" de um tamanho —
  // removemos primeiro e depois gravamos o que sobrou.
  const removeId = String(formData.get("remove") ?? "");
  const base = removeId
    ? current.options.filter((o) => o.id !== removeId)
    : current.options;
  // Precisa sobrar pelo menos um: senão some a seleção de todo mundo.
  if (!base.length) return;

  const options = base.map((o) => {
    const label = String(formData.get(`label_${o.id}`) ?? "").trim();
    const raw = String(formData.get(`price_${o.id}`) ?? "");
    return {
      id: o.id,
      label: label || o.label,
      price_cents: raw.trim() === "" ? o.price_cents : parsePrice(raw),
    };
  });

  setSetting("hairSizes", {
    enabled: formData.get("enabled") === "on",
    options,
  });
  refreshSite();
}

/** Adiciona um tamanho novo (Curto/Médio/Longo + o que o studio quiser). */
export async function addHairSizeAction(formData: FormData) {
  await requireSession();
  const current = normalizeHairSizes(getSetting("hairSizes", null));

  const label = String(formData.get("newLabel") ?? "").trim();
  if (!label) return;

  // id estável e único — o agendamento manda o id, nunca o preço.
  const id = `tam-${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 5)}`;

  setSetting("hairSizes", {
    enabled: current.enabled,
    options: [
      ...current.options,
      { id, label, price_cents: parsePrice(formData.get("newPrice")) },
    ],
  });
  refreshSite();
}

/* -------------------------------- avisos --------------------------------- */

export async function markNotificationReadAction(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  getDb()
    .prepare(
      "UPDATE notifications SET status = 'read', read_at = datetime('now') WHERE id = ?"
    )
    .run(id);
  revalidatePath("/admin/avisos");
  revalidatePath("/admin");
}

export async function markAllNotificationsReadAction() {
  await requireSession();
  getDb()
    .prepare(
      "UPDATE notifications SET status = 'read', read_at = datetime('now') WHERE status = 'pending'"
    )
    .run();
  revalidatePath("/admin/avisos");
  revalidatePath("/admin");
}

export async function clearReadNotificationsAction() {
  await requireSession();
  getDb().prepare("DELETE FROM notifications WHERE status = 'read'").run();
  revalidatePath("/admin/avisos");
  revalidatePath("/admin");
}

/* --------------------------- usuários do painel -------------------------- */

/** Cria um novo login (usuário + senha) para o painel. */
export async function createAdminAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireSession();
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  const res = createAdmin(username, password);
  if (!res.ok) return { error: res.error };

  revalidatePath("/admin/usuarios");
  return { ok: `Login “${username.trim().toLowerCase()}” criado com sucesso.` };
}

/** Troca a senha de um login (inclusive o de outra pessoa). */
export async function changePasswordAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireSession();
  const id = Number(formData.get("id"));
  const password = String(formData.get("password") || "");
  if (!Number.isFinite(id)) return { error: "Usuário inválido." };

  const res = setAdminPassword(id, password);
  if (!res.ok) return { error: res.error };

  revalidatePath("/admin/usuarios");
  return { ok: "Senha alterada com sucesso." };
}

/** Exclui um login (nunca o próprio nem o último usuário). */
export async function deleteAdminAction(formData: FormData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  removeAdmin(id, session.id);
  revalidatePath("/admin/usuarios");
}
