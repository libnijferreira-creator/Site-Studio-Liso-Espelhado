"use client";

import { useRef, useState } from "react";
import {
  deleteGalleryItemAction,
  moveGalleryItemAction,
  saveGalleryItemAction,
  toggleGalleryItemAction,
} from "./actions";

type Item = {
  id: number;
  title: string;
  caption: string | null;
  image: string | null;
  video_url: string | null;
  media_type: "image" | "video";
  kind: string;
  active: "active" | "inactive";
  sort_order: number;
};

const KINDS = [
  { id: "trabalho", label: "Trabalho realizado" },
  { id: "antes-depois", label: "Antes e depois" },
  { id: "studio", label: "O Studio" },
  { id: "cliente", label: "Cliente" },
];

function ItemForm({
  item,
  onClose,
}: {
  item?: Item;
  onClose: () => void;
}) {
  const [type, setType] = useState<"image" | "video">(item?.media_type ?? "image");
  const [image, setImage] = useState(item?.image ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no envio.");
      setImage(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no envio.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      action={saveGalleryItemAction}
      className="border border-gold/60 bg-white p-6 shadow-[0_24px_50px_-32px_rgba(42,30,25,.5)]"
    >
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <input type="hidden" name="media_type" value={type} />
      <input type="hidden" name="image" value={image} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label">Tipo de mídia</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("image")}
              className={`flex-1 border px-4 py-3 text-[11px] uppercase tracking-[0.16em] transition-colors ${
                type === "image"
                  ? "border-gold bg-gold/10 text-gold-deep"
                  : "border-espresso/15 text-espresso-soft/75"
              }`}
            >
              Foto
            </button>
            <button
              type="button"
              onClick={() => setType("video")}
              className={`flex-1 border px-4 py-3 text-[11px] uppercase tracking-[0.16em] transition-colors ${
                type === "video"
                  ? "border-gold bg-gold/10 text-gold-deep"
                  : "border-espresso/15 text-espresso-soft/75"
              }`}
            >
              Vídeo
            </button>
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="kind">Categoria</label>
          <select id="kind" name="kind" className="field" defaultValue={item?.kind ?? "trabalho"}>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="title">Título</label>
          <input id="title"
            name="title"
            className="field"
            defaultValue={item?.title ?? ""}
            placeholder="Liso Espelhado Premium"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="caption">Legenda</label>
          <input id="caption"
            name="caption"
            className="field"
            defaultValue={item?.caption ?? ""}
            placeholder="Resultado de brilho espelhado"
          />
        </div>

        {type === "video" ? (
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="video_url">Link do vídeo</label>
            <input id="video_url"
              name="video_url"
              className="field"
              defaultValue={item?.video_url ?? ""}
              placeholder="https://youtube.com/... ou link direto do arquivo (.mp4)"
              required
            />
            <p className="mt-2 text-[12px] text-espresso-soft/75">
              Aceita YouTube, Vimeo ou arquivo direto (.mp4 / .webm).
            </p>
          </div>
        ) : (
          <>
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="campo-3">Imagem</label>
              <input id="campo-3"
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                }}
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="btn btn-outline !px-5 !py-2.5 !text-[10px]"
                  disabled={uploading}
                >
                  {uploading ? "Enviando..." : "Enviar foto"}
                </button>
                <input
                  name="image_url_manual"
                  className="field flex-1 !py-2.5 !text-[13px]"
                  placeholder="ou cole uma URL / caminho"
                  defaultValue={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </div>

              {image ? (
                <img
                  src={image}
                  alt="Prévia"
                  className="mt-3 h-32 w-32 border border-champagne object-cover"
                />
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="image_url">Capa (opcional, para vídeo)</label>
              <input id="image_url"
                className="field"
                name="image_url"
                defaultValue={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="/uploads/capa.jpg"
              />
            </div>
          </>
        )}

        <div>
          <label className="field-label" htmlFor="active">Status</label>
          <select id="active"
            name="active"
            className="field"
            defaultValue={item?.active ?? "active"}
          >
            <option value="active">Visível no site</option>
            <option value="inactive">Oculto</option>
          </select>
        </div>
      </div>

      {error ? (
        <p className="mt-4 border-l-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" className="btn btn-gold">
          Salvar no mostruário
        </button>
        <button type="button" onClick={onClose} className="btn btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function ShowroomManager({ items }: { items: Item[] }) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Fotos e vídeos</p>
          <h1 className="text-[36px] leading-tight sm:text-[44px]">Mostruário</h1>
          <div className="rule-gold mt-5 w-32" />
          <p className="mt-4 max-w-xl text-[14px] text-espresso-soft/80">
            Envie fotografias e links de vídeo, organize a ordem de exibição e
            escolha o que fica visível no site.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-dark"
          onClick={() => {
            setCreating((v) => !v);
            setEditingId(null);
          }}
        >
          {creating ? "Fechar" : "+ Adicionar mídia"}
        </button>
      </header>

      {creating ? (
        <div className="mb-8">
          <ItemForm onClose={() => setCreating(false)} />
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="border border-dashed border-espresso/25 bg-white px-6 py-12 text-center text-sm text-espresso-soft/75">
          Mostruário vazio. Clique em “+ Adicionar mídia” para enviar a primeira
          foto ou vídeo.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id}>
              {editingId === item.id ? (
                <ItemForm item={item} onClose={() => setEditingId(null)} />
              ) : (
                <article className="flex flex-wrap items-center gap-5 border border-champagne bg-white p-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden border border-champagne bg-ink">
                    <img
                      src={item.media_type === "video" ? item.image || "/art/video.svg" : item.image || "/art/gallery.svg"}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-[200px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[20px] leading-tight">{item.title}</h2>
                      <span className="border border-champagne px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-espresso-soft/75">
                        {item.media_type === "video" ? "vídeo" : "foto"}
                      </span>
                      <span
                        className={`border px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] ${
                          item.active === "active"
                            ? "border-gold/60 text-gold-deep"
                            : "border-espresso/20 text-espresso-soft/75"
                        }`}
                      >
                        {item.active === "active" ? "visível" : "oculto"}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-espresso-soft/75">
                      {item.caption || "Sem legenda"} · {KINDS.find((k) => k.id === item.kind)?.label ?? item.kind}
                    </p>
                    {item.media_type === "video" ? (
                      <p className="mt-1 truncate text-[12px] text-gold-deep">
                        {item.video_url}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-outline !px-4 !py-2 !text-[10px]"
                      onClick={() => {
                        setEditingId(item.id);
                        setCreating(false);
                      }}
                    >
                      Editar
                    </button>

                    <form action={moveGalleryItemAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="dir" value="up" />
                      <button
                        type="submit"
                        className="btn btn-outline !px-3 !py-2 !text-[10px]"
                        aria-label="↑ Subir"
                      >
                        ↑
                      </button>
                    </form>

                    <form action={moveGalleryItemAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="dir" value="down" />
                      <button
                        type="submit"
                        className="btn btn-outline !px-3 !py-2 !text-[10px]"
                        aria-label="↓ Descer"
                      >
                        ↓
                      </button>
                    </form>

                    <form action={toggleGalleryItemAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        type="submit"
                        className="btn btn-outline !px-4 !py-2 !text-[10px]"
                      >
                        {item.active === "active" ? "Ocultar" : "Exibir"}
                      </button>
                    </form>

                    <form
                      action={deleteGalleryItemAction}
                      onSubmit={(e) => {
                        if (!confirm(`Excluir "${item.title}"?`)) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        type="submit"
                        className="btn btn-outline !px-4 !py-2 !text-[10px] !text-red-700 hover:!border-red-400"
                      >
                        Excluir
                      </button>
                    </form>
                  </div>
                </article>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
