"use client";

import { useRef, useState } from "react";
import {
  deleteTestimonialAction,
  moveTestimonialAction,
  saveTestimonialAction,
  toggleTestimonialAction,
} from "./actions";

type Testimonial = {
  id: number;
  name: string;
  photo: string | null;
  text: string;
  rating: number;
  date: string | null;
  active: string;
  sort_order: number;
};

function Form({
  item,
  onClose,
}: {
  item?: Testimonial;
  onClose: () => void;
}) {
  const [photo, setPhoto] = useState(item?.photo ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (res.ok) setPhoto(data.url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      action={saveTestimonialAction}
      className="mb-8 border border-gold/60 bg-white p-6 shadow-[0_24px_50px_-32px_rgba(42,30,25,.5)]"
    >
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <input type="hidden" name="photo" value={photo} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="name">Nome da cliente *</label>
          <input id="name" name="name" className="field" defaultValue={item?.name ?? ""} required />
        </div>
        <div>
          <label className="field-label" htmlFor="date">Data</label>
          <input id="date" type="date" name="date" className="field" defaultValue={item?.date ?? ""} />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="text">Depoimento *</label>
          <textarea id="text"
            name="text"
            className="field min-h-[110px]"
            defaultValue={item?.text ?? ""}
            required
            placeholder="Conte como foi a experiência no Studio..."
          />
        </div>

        <div>
          <label className="field-label" htmlFor="rating">Nota (1 a 5)</label>
          <select id="rating" name="rating" className="field" defaultValue={item?.rating ?? 5}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)} ({n})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="campo-2">Foto</label>
          <input id="campo-2"
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn btn-outline !px-5 !py-2.5 !text-[10px]"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Enviando..." : "Enviar foto"}
            </button>
            <input
              className="field flex-1 !py-2.5 !text-[13px]"
              placeholder="ou cole o caminho"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="active">Status</label>
          <select id="active" name="active" className="field" defaultValue={item?.active ?? "active"}>
            <option value="active">Visível no site</option>
            <option value="inactive">Oculto</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" className="btn btn-gold">
          Salvar depoimento
        </button>
        <button type="button" onClick={onClose} className="btn btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function TestimonialsManager({ items }: { items: Testimonial[] }) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Prova social</p>
          <h1 className="text-[36px] leading-tight sm:text-[44px]">Depoimentos</h1>
          <div className="rule-gold mt-5 w-32" />
          <p className="mt-4 max-w-xl text-[14px] text-espresso-soft/80">
            Avaliações das clientes exibidas na Home. Ative apenas depoimentos
            reais e autorizados.
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
          {creating ? "Fechar" : "+ Novo depoimento"}
        </button>
      </header>

      {creating ? <Form onClose={() => setCreating(false)} /> : null}

      {items.length === 0 ? (
        <p className="border border-dashed border-espresso/25 bg-white px-6 py-12 text-center text-sm text-espresso-soft/75">
          Nenhum depoimento cadastrado.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((t) => (
            <li key={t.id}>
              {editingId === t.id ? (
                <Form item={t} onClose={() => setEditingId(null)} />
              ) : (
                <article className="flex flex-wrap items-start gap-5 border border-champagne bg-white p-5">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-champagne bg-ink">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.photo || "/art/portrait.svg"}
                      alt={t.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[19px] leading-tight">{t.name}</h2>
                      <span className="text-[13px] text-gold-deep">
                        {"★".repeat(Math.max(1, Math.min(5, t.rating)))}
                      </span>
                      <span
                        className={`border px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] ${
                          t.active === "active"
                            ? "border-gold/60 text-gold-deep"
                            : "border-espresso/20 text-espresso-soft/75"
                        }`}
                      >
                        {t.active === "active" ? "visível" : "oculto"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-espresso-soft/80">
                      {t.text}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-outline !px-4 !py-2 !text-[10px]"
                      onClick={() => {
                        setEditingId(t.id);
                        setCreating(false);
                      }}
                    >
                      Editar
                    </button>

                    <form action={moveTestimonialAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="dir" value="up" />
                      <button type="submit" className="btn btn-outline !px-3 !py-2 !text-[10px]" aria-label="↑ Subir">
                        ↑
                      </button>
                    </form>

                    <form action={moveTestimonialAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="dir" value="down" />
                      <button type="submit" className="btn btn-outline !px-3 !py-2 !text-[10px]" aria-label="↓ Descer">
                        ↓
                      </button>
                    </form>

                    <form action={toggleTestimonialAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <button type="submit" className="btn btn-outline !px-4 !py-2 !text-[10px]">
                        {t.active === "active" ? "Ocultar" : "Exibir"}
                      </button>
                    </form>

                    <form
                      action={deleteTestimonialAction}
                      onSubmit={(e) => {
                        if (!confirm(`Excluir depoimento de ${t.name}?`)) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={t.id} />
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
