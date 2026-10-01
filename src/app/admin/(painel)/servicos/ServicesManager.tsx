"use client";

import { useState } from "react";
import {
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

function ServiceForm({
  draft,
  onCancel,
}: {
  draft: Draft;
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
            Taxa de 15% = {formatBRL(feeFor(previewCents))} · restante{" "}
            {formatBRL(previewCents - feeFor(previewCents))}
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
          <label className="field-label" htmlFor={`image-${draft.id ?? "new"}`}>
            Imagem (URL ou caminho)
          </label>
          <input
            id={`image-${draft.id ?? "new"}`}
            name="image"
            className="field"
            defaultValue={draft.image ?? ""}
            placeholder="/uploads/servico.jpg"
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
}: {
  services: Service[];
  sizes: HairSizesSettings;
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
            no site. A taxa de 15% é calculada automaticamente — não é preciso
            cadastrá-la.
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
          tamanho é um acréscimo somado ao serviço — e a taxa de 15% passa a ser
          calculada sobre o total.
        </p>

        <form action={saveHairSizesAction} className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {sizes.options.map((o) => (
              <div
                key={o.id}
                className="grid gap-3 border border-champagne/70 p-4 sm:grid-cols-[1fr_130px]"
              >
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
              Ex.: Longo + R$ 40,00 num serviço de R$ 350,00 → taxa de 15% = R$
              58,50 · restante R$ 331,50.
            </p>
          </div>
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
                      taxa 15% = {formatBRL(feeFor(service.price_cents))}
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
