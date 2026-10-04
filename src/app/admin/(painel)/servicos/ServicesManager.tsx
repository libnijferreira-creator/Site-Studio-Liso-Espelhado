"use client";

import { useRef, useState } from "react";
import {
  addHairSizeAction,
  createServiceAction,
  deleteServiceAction,
  saveHairSizesAction,
  toggleServiceAction,
  updateServiceAction,
} from "@/app/admin/actions";
import { feeFor, formatBRL, formatDuration } from "@/lib/format";
import type { HairSizesSettings, Service } from "@/lib/types";

function priceToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

type Draft = Partial<Service> & { isNew?: boolean };

/**
 * Campo de foto com envio de arquivo — mesmos padrões de
 * Conteúdo/Depoimentos/Promoções. O valor vai no input hidden (para o
 * Server Action pegar); o visível serve só para digitar/preview.
 */
function ImageField({ id, value }: { id: string; value: string }) {
  const [current, setCurrent] = useState(value);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setErro(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) setCurrent(data.url);
      else setErro(data.error || "Não foi possível enviar a foto.");
    } catch {
      setErro("Falha no envio. Verifique a conexão.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="field-label" htmlFor={id}>
        Foto do procedimento
      </label>
      <input type="hidden" name="image" value={current} />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-outline !px-5 !py-2.5 !text-[10px]"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Enviando..." : "Enviar foto"}
        </button>
        <input
          id={id}
          className="field flex-1 !py-2.5 !text-[13px]"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="/uploads/servico.jpg ou https://..."
        />
      </div>
      {erro ? (
        <p className="mt-2 text-[12px] text-red-700">{erro}</p>
      ) : null}
      {current ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current}
          alt="Prévia da foto"
          className="mt-3 h-28 w-44 border border-champagne object-cover"
        />
      ) : null}
    </div>
  );
}

function ServiceForm({
  draft,
  feePercent,
  onCancel,
}: {
  draft: Draft;
  /** % da taxa — Conteúdo → Taxa (nunca fixar). */
  feePercent: number;
  onCancel: () => void;
}) {
  const action = draft.isNew ? createServiceAction : updateServiceAction;
  const [price, setPrice] = useState(priceToInput(draft.price_cents ?? 0));
  const previewCents = Math.round(
    (Number(price.replace(/[^\d,]/g, "").replace(",", ".")) || 0) * 100
  );

  return (
    <form
      action={action}
      className="border border-gold/60 bg-white p-6 shadow-[0_24px_50px_-32px_rgba(42,30,25,.5)]"
    >
      {draft.isNew ? null : <input type="hidden" name="id" value={draft.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor={`name-${draft.id ?? "new"}`}>
            Nome do serviço
          </label>
          <input
            id={`name-${draft.id ?? "new"}`}
            name="name"
            className="field"
            defaultValue={draft.name ?? ""}
            placeholder="Liso Espelhado Premium"
            required
          />
        </div>

        <div>
          <label className="field-label" htmlFor={`price-${draft.id ?? "new"}`}>
            Valor (R$)
          </label>
          <input
            id={`price-${draft.id ?? "new"}`}
            name="price"
            className="field"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="350,00"
            required
          />
          <p className="mt-2 text-[12px] text-gold-deep">
            Taxa de {feePercent}% ={" "}
            {formatBRL(feeFor(previewCents, feePercent))} · restante{" "}
            {formatBRL(previewCents - feeFor(previewCents, feePercent))}
          </p>
        </div>

        <div>
          <label className="field-label" htmlFor={`duration-${draft.id ?? "new"}`}>
            Duração (minutos)
          </label>
          <input
            id={`duration-${draft.id ?? "new"}`}
            name="duration_min"
            type="number"
            min={5}
            step={5}
            className="field"
            defaultValue={draft.duration_min ?? 60}
            required
          />
          <p className="mt-2 text-[12px] text-espresso-soft/75">
            Exibido como {formatDuration(draft.duration_min ?? 60)}
          </p>
        </div>

        <div>
          <label className="field-label" htmlFor={`category-${draft.id ?? "new"}`}>
            Categoria
          </label>
          <input
            id={`category-${draft.id ?? "new"}`}
            name="category"
            className="field"
            defaultValue={draft.category ?? "Tratamentos"}
            placeholder="Liso, Tratamentos, Cuidados..."
          />
        </div>

        <div>
          <label className="field-label" htmlFor={`track-${draft.id ?? "new"}`}>
            Tipo de atendimento
          </label>
          <select
            id={`track-${draft.id ?? "new"}`}
            name="track"
            className="field"
            defaultValue={draft.track ?? "hair"}
          >
            <option value="hair">Cabelo — terça a sábado</option>
            <option value="nails">Unhas — somente quartas-feiras</option>
          </select>
          <p className="mt-2 text-[12px] text-espresso-soft/75">
            Define em quais dias o serviço pode ser agendado.
          </p>
        </div>

        <div>
          <label className="field-label" htmlFor={`status-${draft.id ?? "new"}`}>
            Status
          </label>
          <select
            id={`status-${draft.id ?? "new"}`}
            name="status"
            className="field"
            defaultValue={draft.status ?? "active"}
          >
            <option value="active">Ativo (visível no site)</option>
            <option value="inactive">Inativo (oculto)</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <ImageField
            id={`image-${draft.id ?? "new"}`}
            value={draft.image ?? ""}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor={`desc-${draft.id ?? "new"}`}>
            Descrição
          </label>
          <textarea
            id={`desc-${draft.id ?? "new"}`}
            name="description"
            rows={4}
            className="field resize-y"
            defaultValue={draft.description ?? ""}
            placeholder="Descreva o procedimento..."
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" className="btn btn-gold">
          Salvar serviço
        </button>
        <button type="button" onClick={onCancel} className="btn btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function ServicesManager({
  services,
  sizes,
  feePercent,
}: {
  services: Service[];
  sizes: HairSizesSettings;
  /** % da taxa de agendamento — lido das settings, não é constante. */
  feePercent: number;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Catálogo</p>
          <h1 className="text-[36px] leading-tight sm:text-[44px]">Serviços</h1>
          <div className="rule-gold mt-5 w-32" />
          <p className="mt-4 max-w-xl text-[14px] text-espresso-soft/80">
            Valores, durações e descrições são editáveis e aparecem imediatamente
            no site. A taxa de {feePercent}% é calculada automaticamente — não é
            preciso cadastrá-la.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreating((v) => !v);
            setEditingId(null);
          }}
          className="btn btn-dark"
        >
          {creating ? "Fechar" : "+ Novo serviço"}
        </button>
      </header>

      {creating ? (
        <div className="mb-8">
          <ServiceForm
            draft={{ isNew: true, status: "active", duration_min: 60, price_cents: 0, track: "hair" }}
            feePercent={feePercent}
            onCancel={() => setCreating(false)}
          />
        </div>
      ) : null}

      <section className="mb-8 border border-champagne bg-white p-6">
        <p className="eyebrow mb-3">Agendamento</p>
        <h2 className="text-[24px] leading-tight">Tamanho do cabelo</h2>
        <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-espresso-soft/75">
          A seleção aparece na etapa 1 do agendamento dos serviços de cabelo
          (não aparece para sobrancelhas nem para unhas). O valor de cada
          tamanho é um acréscimo somado ao serviço — e a taxa de {feePercent}%
          passa a ser calculada sobre o total.
        </p>

        <form action={saveHairSizesAction} className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {sizes.options.map((o) => (
              <div key={o.id} className="border border-champagne/70 p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
                  <div>
                    <label className="field-label" htmlFor={`hs-label-${o.id}`}>
                      Nome do tamanho
                    </label>
                    <input
                      id={`hs-label-${o.id}`}
                      name={`label_${o.id}`}
                      className="field"
                      defaultValue={o.label}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor={`hs-price-${o.id}`}>
                      Acréscimo (R$)
                    </label>
                    <input
                      id={`hs-price-${o.id}`}
                      name={`price_${o.id}`}
                      className="field"
                      defaultValue={priceToInput(o.price_cents)}
                      inputMode="decimal"
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>

                {sizes.options.length > 1 ? (
                  <button
                    type="submit"
                    name="remove"
                    value={o.id}
                    className="mt-3 text-[10px] uppercase tracking-[0.16em] text-red-700/70 transition-colors hover:text-red-700"
                    onClick={(e) => {
                      const ok = window.confirm(
                        `Remover o tamanho "${o.label}"? Vale para todos os serviços de cabelo.`
                      );
                      if (!ok) e.preventDefault();
                    }}
                  >
                    Remover tamanho
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <label className="mt-5 flex items-center gap-3 text-[13.5px] text-espresso-soft/80">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={sizes.enabled}
              className="h-4 w-4 accent-gold"
            />
            Mostrar a seleção de tamanho no agendamento
          </label>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button type="submit" className="btn btn-gold">
              Salvar tamanhos
            </button>
            <p className="text-[12.5px] text-espresso-soft/75">
              Ex.: Longo + R$ 40,00 num serviço de R$ 350,00 → taxa de{" "}
              {feePercent}% = {formatBRL(feeFor(39000, feePercent))} · restante{" "}
              {formatBRL(39000 - feeFor(39000, feePercent))}.
            </p>
          </div>
        </form>

        {/* ------------------------- adicionar tamanho -------------------- */}
        <form
          action={addHairSizeAction}
          className="mt-5 grid gap-4 border border-dashed border-gold/60 bg-offwhite p-5 sm:grid-cols-[1fr_150px_auto]"
        >
          <div>
            <label className="field-label" htmlFor="new-size-label">
              Novo tamanho
            </label>
            <input
              id="new-size-label"
              name="newLabel"
              className="field"
              placeholder="Extra Longo"
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="new-size-price">
              Acréscimo (R$)
            </label>
            <input
              id="new-size-price"
              name="newPrice"
              className="field"
              inputMode="decimal"
              placeholder="0,00"
              defaultValue="0,00"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn btn-outline !px-5 !py-3">
              + Adicionar
            </button>
          </div>
          <p className="text-[12.5px] leading-relaxed text-espresso-soft/75 sm:col-span-3">
            O tamanho novo passa a valer para <strong>todos</strong> os serviços
            de cabelo (não para unhas nem sobrancelhas).
          </p>
        </form>
      </section>

      <ul className="space-y-4">
        {services.map((service) => {
          const isEditing = editingId === service.id;
          return (
            <li key={service.id}>
              {isEditing ? (
                <ServiceForm
                  draft={service}
                  feePercent={feePercent}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <article className="flex flex-wrap items-center justify-between gap-5 border border-champagne bg-white p-6">
                  <div className="min-w-[240px] flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-[23px] leading-tight">{service.name}</h2>
                      <span
                        className={`border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                          service.status === "active"
                            ? "border-gold/60 text-gold-deep"
                            : "border-espresso/20 text-espresso-soft/75"
                        }`}
                      >
                        {service.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-espresso-soft/75">
                      {service.description}
                    </p>
                    <p className="mt-3 flex flex-wrap items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-espresso-soft/75">
                      <span
                        className={`border px-2 py-0.5 text-[10px] ${
                          service.track === "nails"
                            ? "border-nude text-espresso"
                            : "border-champagne text-espresso-soft/75"
                        }`}
                      >
                        {service.track === "nails" ? "Unhas · quarta" : "Cabelo"}
                      </span>
                      <span>
                        {service.category} · {formatDuration(service.duration_min)}
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-display text-[30px] leading-none text-ink">
                      {formatBRL(service.price_cents)}
                    </p>
                    <p className="mt-1.5 text-[12px] text-gold-deep">
                      taxa {feePercent}% ={" "}
                      {formatBRL(feeFor(service.price_cents, feePercent))}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(isEditing ? null : service.id);
                        setCreating(false);
                      }}
                      className="btn btn-outline !px-5 !py-2.5 !text-[10px]"
                    >
                      Editar
                    </button>

                    <form action={toggleServiceAction}>
                      <input type="hidden" name="id" value={service.id} />
                      <button
                        type="submit"
                        className="btn btn-outline !px-5 !py-2.5 !text-[10px]"
                      >
                        {service.status === "active" ? "Ocultar" : "Ativar"}
                      </button>
                    </form>

                    <form
                      action={deleteServiceAction}
                      onSubmit={(e) => {
                        if (!confirm(`Excluir "${service.name}"?`)) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={service.id} />
                      <button
                        type="submit"
                        className="btn btn-outline !px-5 !py-2.5 !text-[10px] !text-red-700 hover:!border-red-400 hover:!text-red-700"
                      >
                        Excluir
                      </button>
                    </form>
                  </div>
                </article>
              )}
            </li>
          );
        })}
      </ul>

      {services.length === 0 ? (
        <p className="border border-dashed border-espresso/25 bg-white px-6 py-10 text-center text-sm text-espresso-soft/75">
          Nenhum serviço cadastrado. Clique em “+ Novo serviço”.
        </p>
      ) : null}
    </div>
  );
}
