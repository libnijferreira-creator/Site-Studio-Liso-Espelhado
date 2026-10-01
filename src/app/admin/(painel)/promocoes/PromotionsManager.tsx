"use client";

import { useRef, useState } from "react";
import { formatBRL } from "@/lib/format";
import {
  deletePromotionAction,
  movePromotionAction,
  savePromotionAction,
  togglePromotionAction,
} from "./actions";

type Promotion = {
  id: number;
  title: string;
  description: string;
  image: string | null;
  original_price_cents: number;
  promo_price_cents: number;
  start_date: string | null;
  end_date: string | null;
  cta_label: string;
  service_id: number | null;
  active: string;
  sort_order: number;
};

type Service = { id: number; name: string };

function Form({
  promo,
  services,
  onClose,
}: {
  promo?: Promotion;
  services: Service[];
  onClose: () => void;
}) {
  const [image, setImage] = useState(promo?.image ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
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

  const money = (cents: number) =>
    cents ? (cents / 100).toFixed(2).replace(".", ",") : "";

  return (
    <form
      action={savePromotionAction}
      className="mb-8 border border-gold/60 bg-white p-6 shadow-[0_24px_50px_-32px_rgba(42,30,25,.5)]"
    >
      {promo ? <input type="hidden" name="id" value={promo.id} /> : null}
      <input type="hidden" name="image" value={image} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="title">Título da promoção *</label>
          <input id="title"
            name="title"
            className="field"
            defaultValue={promo?.title ?? ""}
            placeholder="Liso + Hidratação"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="description">Descrição</label>
          <textarea id="description"
            name="description"
            className="field min-h-[84px]"
            defaultValue={promo?.description ?? ""}
            placeholder="O que está incluso na promoção"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="original_price">Preço original (R$)</label>
          <input id="original_price"
            name="original_price"
            className="field"
            inputMode="decimal"
            defaultValue={money(promo?.original_price_cents ?? 0)}
            placeholder="450,00"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="promo_price">Preço promocional (R$) *</label>
          <input id="promo_price"
            name="promo_price"
            className="field"
            inputMode="decimal"
            defaultValue={money(promo?.promo_price_cents ?? 0)}
            placeholder="349,00"
            required
          />
        </div>

        <div>
          <label className="field-label" htmlFor="start_date">Início</label>
          <input id="start_date"
            type="date"
            name="start_date"
            className="field"
            defaultValue={promo?.start_date ?? ""}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="end_date">Fim</label>
          <input id="end_date"
            type="date"
            name="end_date"
            className="field"
            defaultValue={promo?.end_date ?? ""}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="cta_label">Texto do botão</label>
          <input id="cta_label"
            name="cta_label"
            className="field"
            defaultValue={promo?.cta_label ?? "APROVEITAR PROMOÇÃO"}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="service_id">Serviço vinculado</label>
          <select id="service_id" name="service_id" className="field" defaultValue={promo?.service_id ?? ""}>
            <option value="">— Nenhum —</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="campo-2">Imagem</label>
          <input id="campo-2"
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-outline !px-5 !py-2.5 !text-[10px]"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Enviando..." : "Enviar imagem"}
            </button>
            <input
              className="field flex-1 !py-2.5 !text-[13px]"
              placeholder="ou cole o caminho (/uploads/... ou URL)"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="Prévia" className="mt-3 h-28 w-44 border border-champagne object-cover" />
          ) : null}
        </div>

        <div>
          <label className="field-label" htmlFor="active">Status</label>
          <select id="active" name="active" className="field" defaultValue={promo?.active ?? "active"}>
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
          Salvar promoção
        </button>
        <button type="button" onClick={onClose} className="btn btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function PromotionsManager({
  items,
  services,
}: {
  items: Promotion[];
  services: Service[];
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Ofertas do studio</p>
          <h1 className="text-[36px] leading-tight sm:text-[44px]">Promoções</h1>
          <div className="rule-gold mt-5 w-32" />
          <p className="mt-4 max-w-xl text-[14px] text-espresso-soft/80">
            Crie campanhas com preço original e promocional, período definido e
            destaque na página de promoções.
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
          {creating ? "Fechar" : "+ Nova promoção"}
        </button>
      </header>

      {creating ? <Form onClose={() => setCreating(false)} services={services} /> : null}

      {items.length === 0 ? (
        <p className="border border-dashed border-espresso/25 bg-white px-6 py-12 text-center text-sm text-espresso-soft/75">
          Nenhuma promoção cadastrada.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((p) => (
            <li key={p.id}>
              {editingId === p.id ? (
                <Form promo={p} services={services} onClose={() => setEditingId(null)} />
              ) : (
                <article className="flex flex-wrap items-center gap-5 border border-champagne bg-white p-5">
                  <div className="h-24 w-32 shrink-0 overflow-hidden border border-champagne bg-ink">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image || "/art/promo.svg"}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[20px] leading-tight">{p.title}</h2>
                      <span
                        className={`border px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] ${
                          p.active === "active"
                            ? "border-gold/60 text-gold-deep"
                            : "border-espresso/20 text-espresso-soft/75"
                        }`}
                      >
                        {p.active === "active" ? "visível" : "oculto"}
                      </span>
                    </div>
                    <p className="mt-1 text-[14px]">
                      <span className="text-espresso-soft/75 line-through">
                        {formatBRL(p.original_price_cents)}
                      </span>{" "}
                      <strong className="text-gold-deep">
                        {formatBRL(p.promo_price_cents)}
                      </strong>
                    </p>
                    <p className="mt-1 text-[12.5px] text-espresso-soft/75">
                      {p.start_date || p.end_date
                        ? `${p.start_date ?? "início imediato"} até ${p.end_date ?? "sem data"}`
                        : "Sem período definido"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-outline !px-4 !py-2 !text-[10px]"
                      onClick={() => {
                        setEditingId(p.id);
                        setCreating(false);
                      }}
                    >
                      Editar
                    </button>

                    <form action={movePromotionAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="dir" value="up" />
                      <button type="submit" className="btn btn-outline !px-3 !py-2 !text-[10px]" aria-label="↑ Subir">
                        ↑
                      </button>
                    </form>

                    <form action={movePromotionAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="dir" value="down" />
                      <button type="submit" className="btn btn-outline !px-3 !py-2 !text-[10px]" aria-label="↓ Descer">
                        ↓
                      </button>
                    </form>

                    <form action={togglePromotionAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="btn btn-outline !px-4 !py-2 !text-[10px]">
                        {p.active === "active" ? "Ocultar" : "Exibir"}
                      </button>
                    </form>

                    <form
                      action={deletePromotionAction}
                      onSubmit={(e) => {
                        if (!confirm(`Excluir "${p.title}"?`)) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={p.id} />
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
