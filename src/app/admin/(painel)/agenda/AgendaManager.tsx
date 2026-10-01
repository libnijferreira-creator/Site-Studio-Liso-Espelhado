"use client";

import { useState } from "react";
import {
  addBlockAction,
  deleteBlockAction,
  markPaidAction,
  setAppointmentStatusAction,
} from "./actions";
import { formatDateLong, formatBRL } from "@/lib/format";
import type { Schedule } from "@/lib/types";

type Appointment = {
  id: number;
  code: string;
  date: string;
  time: string;
  total_cents: number;
  fee_cents: number;
  remainder_cents: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  notes: string | null;
  client_name: string;
  client_whatsapp: string;
  client_email: string | null;
  service_name: string;
  service_duration_min: number;
  service_track: string;
  hair_size: string | null;
  hair_size_cents: number;
};

type Block = {
  id: number;
  date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Aguardando pagamento", cls: "border-amber-300 text-amber-700" },
  approved: { label: "Pagamento iniciado", cls: "border-sky-300 text-sky-700" },
  confirmed: { label: "Confirmado", cls: "border-gold/70 text-gold-deep" },
  cancelled: { label: "Cancelado", cls: "border-red-300 text-red-600" },
  completed: { label: "Concluído", cls: "border-emerald-300 text-emerald-700" },
};

function Action({
  id,
  status,
  label,
  danger = false,
}: {
  id: number;
  status: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <form action={setAppointmentStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={`btn btn-outline !px-4 !py-2 !text-[10px] ${
          danger ? "!text-red-700 hover:!border-red-400" : ""
        }`}
      >
        {label}
      </button>
    </form>
  );
}

export function AgendaManager({
  items,
  blocks,
  date,
  schedule,
}: {
  items: Appointment[];
  blocks: Block[];
  date: string;
  schedule: Schedule;
}) {
  const [day, setDay] = useState(date);
  const [nav, setNav] = useState(date);
  const [showBlock, setShowBlock] = useState(false);

  function go(days: number) {
    const d = new Date(`${nav}T12:00:00`);
    d.setDate(d.getDate() + days);
    const iso = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
    setNav(iso);
    setDay(iso);
  }

  const totalFees = items
    .filter((i) => i.payment_status === "paid")
    .reduce((s, i) => s + i.fee_cents, 0);

  const weekday = new Date(`${day}T12:00:00`).getDay();
  const isNailDay =
    schedule.hairBlockedOnNailDay && weekday === schedule.nailWeekday;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Agenda do studio</p>
          <h1 className="text-[36px] leading-tight sm:text-[44px]">Agenda</h1>
          <div className="rule-gold mt-5 w-32" />
        </div>
        <button
          type="button"
          className="btn btn-dark"
          onClick={() => setShowBlock((v) => !v)}
        >
          {showBlock ? "Fechar" : "+ Bloquear horário"}
        </button>
      </header>

      {showBlock ? (
        <form
          action={addBlockAction}
          className="mb-8 grid gap-4 border border-gold/60 bg-white p-6 sm:grid-cols-5"
        >
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="block-date">Data</label>
            <input
              id="block-date"
              type="date"
              name="date"
              className="field"
              defaultValue={nav}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="block-start">Início (opcional)</label>
            <input id="block-start" type="time" name="start_time" className="field" />
          </div>
          <div>
            <label className="field-label" htmlFor="block-end">Fim (opcional)</label>
            <input id="block-end" type="time" name="end_time" className="field" />
          </div>
          <div className="sm:col-span-4">
            <label className="field-label" htmlFor="block-reason">Motivo</label>
            <input
              id="block-reason"
              name="reason"
              className="field"
              placeholder="Almoço, viagem, atendimento interno..."
            />
            <p className="mt-2 text-[12px] text-espresso-soft/75">
              Sem horários, o dia inteiro fica bloqueado.
            </p>
          </div>
          <div className="sm:col-span-5">
            <button type="submit" className="btn btn-gold">
              Bloquear
            </button>
          </div>
        </form>
      ) : null}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-champagne pb-5">
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-outline !px-4 !py-2 !text-[11px]" onClick={() => go(-1)}>
            ←
          </button>
          <input
            type="date"
            aria-label="Selecionar data da agenda"
            className="field !w-auto !py-2.5"
            value={nav}
            onChange={(e) => {
              setNav(e.target.value);
              setDay(e.target.value);
            }}
          />
          <button type="button" className="btn btn-outline !px-4 !py-2 !text-[11px]" onClick={() => go(1)}>
            →
          </button>
        </div>
        <p className="text-[13px] text-espresso-soft/75">{formatDateLong(day)}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-6 border-l-2 border-gold/60 pl-5">
        <Stat label="Atendimentos" value={`${items.length}`} />
        <Stat label="Confirmados" value={`${items.filter((i) => i.status === "confirmed").length}`} />
        <Stat label="Taxas recebidas" value={formatBRL(totalFees)} />
        <Stat label="Bloqueios" value={`${blocks.length}`} />
      </div>

      {isNailDay ? (
        <div className="mb-6 border-l-2 border-nude bg-offwhite px-5 py-4 text-[13px] leading-relaxed text-espresso">
          <strong className="uppercase tracking-[0.14em]">
            Dia de unhas — {schedule.nailWeekdayLabel}
          </strong>
          <span className="ml-2 text-espresso-soft/80">
            Somente atendimentos de unha. Nenhum horário de cabelo é oferecido
            neste dia.
          </span>
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="border border-dashed border-espresso/25 bg-white px-6 py-12 text-center text-sm text-espresso-soft/75">
          Nenhum atendimento nesta data.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((a) => {
            const st = STATUS[a.status] ?? STATUS.pending;
            return (
              <li
                key={a.id}
                className="flex flex-wrap items-start gap-5 border border-champagne bg-white p-5"
              >
                <div className="w-[74px] shrink-0 border-r border-champagne pr-4 text-center">
                  <p className="font-display text-[26px] leading-none text-gold-deep">
                    {a.time}
                  </p>
                  <p className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-espresso-soft/75">
                    {a.service_duration_min}min
                  </p>
                </div>

                <div className="min-w-[220px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[19px] leading-tight">{a.client_name}</h2>
                    <span className={`border px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] ${st.cls}`}>
                      {st.label}
                    </span>
                    <span className="border border-champagne px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-espresso-soft/75">
                      {a.payment_status === "paid" ? "taxa paga" : `taxa ${a.payment_status}`}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] text-espresso-soft/80">
                    <span
                      className={`mr-2 border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ${
                        a.service_track === "nails"
                          ? "border-nude text-espresso"
                          : "border-champagne text-espresso-soft/75"
                      }`}
                    >
                      {a.service_track === "nails" ? "unhas" : "cabelo"}
                    </span>
                    {a.service_name}
                    {a.hair_size ? ` · ${a.hair_size}` : ""} ·{" "}
                    {formatBRL(a.total_cents)} · taxa{" "}
                    {formatBRL(a.fee_cents)} · restante {formatBRL(a.remainder_cents)}
                  </p>
                  <p className="mt-1 text-[12.5px] text-espresso-soft/75">
                    WhatsApp {a.client_whatsapp} · {a.code}
                  </p>
                  {a.notes ? (
                    <p className="mt-1.5 border-l-2 border-champagne pl-3 text-[12.5px] text-espresso-soft/75">
                      {a.notes}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {a.payment_status !== "paid" && a.status !== "cancelled" ? (
                    <form action={markPaidAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="btn btn-gold !px-4 !py-2 !text-[10px]">
                        Taxa recebida
                      </button>
                    </form>
                  ) : null}

                  {a.status === "confirmed" ? (
                    <Action id={a.id} status="completed" label="Concluir" />
                  ) : null}
                  {a.status === "completed" ? (
                    <Action id={a.id} status="confirmed" label="Reabrir" />
                  ) : null}
                  {a.status === "cancelled" ? (
                    <Action id={a.id} status="approved" label="Reativar" />
                  ) : null}
                  {a.status !== "cancelled" ? (
                    <Action id={a.id} status="cancelled" label="Cancelar" danger />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {blocks.length > 0 ? (
        <div className="mt-10">
          <h2 className="mb-4 text-[20px]">Bloqueios desta data</h2>
          <ul className="space-y-3">
            {blocks.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-champagne bg-offwhite px-5 py-3.5"
              >
                <p className="text-[13.5px] text-espresso-soft/85">
                  <strong>
                    {b.start_time && b.end_time
                      ? `${b.start_time} às ${b.end_time}`
                      : "Dia inteiro"}
                  </strong>
                  {b.reason ? ` — ${b.reason}` : ""}
                </p>
                <form action={deleteBlockAction}>
                  <input type="hidden" name="id" value={b.id} />
                  <button
                    type="submit"
                    className="btn btn-outline !px-4 !py-2 !text-[10px] !text-red-700 hover:!border-red-400"
                  >
                    Remover
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-espresso-soft/75">
        {label}
      </p>
      <p className="mt-1 font-display text-[26px] leading-none text-gold-deep">
        {value}
      </p>
    </div>
  );
}
