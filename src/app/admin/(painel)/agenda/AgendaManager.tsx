"use client";

import { useState } from "react";
import {
  addBlockAction,
  deleteBlockAction,
  markPaidAction,
  setAppointmentStatusAction,
} from "./actions";
import { formatDateLong, formatBRL } from "@/lib/format";
import { reminderBatch, reminderMessage } from "@/lib/reminder";
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

type View = "dia" | "confirmados" | "pendentes";

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Aguardando pagamento", cls: "border-amber-300 text-amber-700" },
  approved: { label: "Pagamento iniciado", cls: "border-sky-300 text-sky-700" },
  confirmed: { label: "Confirmado", cls: "border-gold/70 text-gold-deep" },
  cancelled: { label: "Cancelado", cls: "border-red-300 text-red-600" },
  completed: { label: "Concluído", cls: "border-emerald-300 text-emerald-700" },
};

/** Situação da taxa, em português (evita "taxa pending" na tela). */
const TAXA: Record<string, string> = {
  paid: "taxa paga",
  pending: "taxa pendente",
  waiting: "taxa aguardando",
  failed: "taxa recusada",
  refunded: "taxa estornada",
};

/** Ainda não confirmou? É sobre isso que o lembrete age. */
function precisaLembrete(a: Appointment): boolean {
  return a.status === "pending" || a.status === "approved";
}

/** Copia para a área de transferência (com fallback para navegador antigo). */
async function writeClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    /* tenta o fallback */
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "-1000px";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } catch {
    /* silencioso — o usuário ainda pode selecionar à mão */
  }
  document.body.removeChild(ta);
}

/** Link wa.me com o telefone só com dígitos e DDI 55. */
function waLink(phone: string, text: string): string {
  const digits = String(phone ?? "").replace(/\D/g, "");
  const full = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

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

/**
 * Lembrete de pagamento: mensagem pronta, assinada pela Secretária, com
 * botão de copiar e de mandar direto no WhatsApp da cliente.
 */
function Lembrete({ a, secretary }: { a: Appointment; secretary: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const msg = reminderMessage(
    {
      client_name: a.client_name,
      code: a.code,
      service_name: a.service_name,
      hair_size: a.hair_size,
      date: a.date,
      time: a.time,
      fee_cents: a.fee_cents,
    },
    secretary
  );

  async function onCopy() {
    await writeClipboard(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="basis-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-outline !px-4 !py-2 !text-[10px]"
      >
        {open ? "Fechar lembrete" : "Lembrete de pagamento"}
      </button>

      {open ? (
        <div className="mt-4 border-l-2 border-gold/60 bg-offwhite p-5">
          <p className="eyebrow mb-3">
            Mensagem pronta — Secretária {secretary}
          </p>
          <pre className="whitespace-pre-wrap border border-champagne bg-white p-4 font-sans text-[13.5px] leading-relaxed text-espresso-soft/85">
            {msg}
          </pre>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onCopy}
              className="btn btn-gold !px-5 !py-2.5 !text-[10px]"
            >
              {copied ? "Copiado ✓" : "Copiar mensagem"}
            </button>
            <a
              href={waLink(a.client_whatsapp, msg)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline !px-5 !py-2.5 !text-[10px]"
            >
              Mandar no WhatsApp da cliente
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Card({
  a,
  secretary,
}: {
  a: Appointment;
  secretary: string;
}) {
  const st = STATUS[a.status] ?? STATUS.pending;
  const lembrete = precisaLembrete(a);

  return (
    <li className="flex flex-wrap items-start gap-5 border border-champagne bg-white p-5">
      <div className="w-[74px] shrink-0 border-r border-champagne pr-4 text-center">
        <p className="font-display text-[26px] leading-none text-gold-deep">
          {a.time}
        </p>
        <p className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-espresso-soft/75">
          {a.service_duration_min}min
        </p>
        <p className="mt-1 text-[10px] tracking-[0.06em] text-espresso-soft/60">
          {formatDateLong(a.date).replace(/ de /g, " ")}
        </p>
      </div>

      <div className="min-w-[220px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[19px] leading-tight">{a.client_name}</h2>
          <span
            className={`border px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] ${st.cls}`}
          >
            {st.label}
          </span>
          <span className="border border-champagne px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-espresso-soft/75">
            {TAXA[a.payment_status] ?? `taxa ${a.payment_status}`}
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
          {a.hair_size ? ` · ${a.hair_size}` : ""} · {formatBRL(a.total_cents)} ·
          taxa {formatBRL(a.fee_cents)} · restante{" "}
          {formatBRL(a.remainder_cents)}
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
            <button
              type="submit"
              className="btn btn-gold !px-4 !py-2 !text-[10px]"
            >
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

      {lembrete ? <Lembrete a={a} secretary={secretary} /> : null}
    </li>
  );
}

function Lista({
  items,
  secretary,
  vazio,
}: {
  items: Appointment[];
  secretary: string;
  vazio: string;
}) {
  if (!items.length) {
    return (
      <p className="border border-dashed border-espresso/25 bg-white px-6 py-12 text-center text-sm text-espresso-soft/75">
        {vazio}
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {items.map((a) => (
        <Card key={a.id} a={a} secretary={secretary} />
      ))}
    </ul>
  );
}

export function AgendaManager({
  items,
  confirmed,
  pending,
  blocks,
  date,
  schedule,
  secretary,
}: {
  items: Appointment[];
  confirmed: Appointment[];
  pending: Appointment[];
  blocks: Block[];
  date: string;
  schedule: Schedule;
  secretary: string;
}) {
  const [day, setDay] = useState(date);
  const [nav, setNav] = useState(date);
  const [showBlock, setShowBlock] = useState(false);
  const [view, setView] = useState<View>("dia");
  const [batchCopied, setBatchCopied] = useState(false);

  const TABS: { id: View; label: string; n: number }[] = [
    { id: "dia", label: "Por dia", n: items.length },
    { id: "confirmados", label: "Confirmados", n: confirmed.length },
    { id: "pendentes", label: "Não confirmados", n: pending.length },
  ];

  function go(days: number) {
    const d = new Date(`${nav}T12:00:00`);
    d.setDate(d.getDate() + days);
    const iso = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
    setNav(iso);
    setDay(iso);
  }

  async function copyBatch() {
    await writeClipboard(
      reminderBatch(
        pending.map((a) => ({
          client_name: a.client_name,
          code: a.code,
          service_name: a.service_name,
          hair_size: a.hair_size,
          date: a.date,
          time: a.time,
          fee_cents: a.fee_cents,
        })),
        secretary
      )
    );
    setBatchCopied(true);
    setTimeout(() => setBatchCopied(false), 2500);
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

      {/* ------------------------------ abas ------------------------------ */}
      <div className="mb-8 flex flex-wrap gap-7 border-b border-champagne">
        {TABS.map((t) => {
          const on = view === t.id;
          const alerta = t.id === "pendentes" && t.n > 0;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setView(t.id)}
              className={`-mb-px border-b-2 pb-3 text-[11.5px] uppercase tracking-[0.18em] transition-colors ${
                on
                  ? "border-gold text-gold-deep"
                  : "border-transparent text-espresso-soft/60 hover:text-ink"
              }`}
            >
              {t.label}
              <span
                className={`ml-2 inline-block min-w-[22px] border px-1.5 py-0.5 text-[9px] tracking-[0.1em] ${
                  alerta
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : on
                      ? "border-gold/70 text-gold-deep"
                      : "border-champagne text-espresso-soft/60"
                }`}
              >
                {t.n}
              </span>
            </button>
          );
        })}
      </div>

      {showBlock ? (
        <form
          action={addBlockAction}
          className="mb-8 grid gap-4 border border-gold/60 bg-white p-6 sm:grid-cols-5"
        >
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="block-date">
              Data
            </label>
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
            <label className="field-label" htmlFor="block-start">
              Início (opcional)
            </label>
            <input id="block-start" type="time" name="start_time" className="field" />
          </div>
          <div>
            <label className="field-label" htmlFor="block-end">
              Fim (opcional)
            </label>
            <input id="block-end" type="time" name="end_time" className="field" />
          </div>
          <div className="sm:col-span-4">
            <label className="field-label" htmlFor="block-reason">
              Motivo
            </label>
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

      {/* --------------------------- aba: por dia -------------------------- */}
      {view === "dia" ? (
        <>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-champagne pb-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn btn-outline !px-4 !py-2 !text-[11px]"
                onClick={() => go(-1)}
              >
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
              <button
                type="button"
                className="btn btn-outline !px-4 !py-2 !text-[11px]"
                onClick={() => go(1)}
              >
                →
              </button>
            </div>
            <p className="text-[13px] text-espresso-soft/75">
              {formatDateLong(day)}
            </p>
          </div>

          <div className="mb-6 flex flex-wrap gap-6 border-l-2 border-gold/60 pl-5">
            <Stat label="Atendimentos" value={`${items.length}`} />
            <Stat
              label="Confirmados"
              value={`${items.filter((i) => i.status === "confirmed").length}`}
            />
            <Stat label="Taxas recebidas" value={formatBRL(totalFees)} />
            <Stat label="Bloqueios" value={`${blocks.length}`} />
          </div>

          {isNailDay ? (
            <div className="mb-6 border-l-2 border-nude bg-offwhite px-5 py-4 text-[13px] leading-relaxed text-espresso">
              <strong className="uppercase tracking-[0.14em]">
                Dia de unhas — {schedule.nailWeekdayLabel}
              </strong>
              <span className="ml-2 text-espresso-soft/80">
                Somente atendimentos de unha. Nenhum horário de cabelo é
                oferecido neste dia.
              </span>
            </div>
          ) : null}

          <Lista
            items={items}
            secretary={secretary}
            vazio="Nenhum atendimento nesta data."
          />

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
        </>
      ) : null}

      {/* ------------------------ aba: confirmados ------------------------- */}
      {view === "confirmados" ? (
        <>
          <div className="mb-6 border-l-2 border-gold/60 bg-offwhite px-5 py-4">
            <p className="eyebrow mb-1.5">Horários garantidos</p>
            <p className="text-[13px] leading-relaxed text-espresso-soft/80">
              {confirmed.length
                ? `${confirmed.length} agendamento(s) a partir de hoje já com a taxa confirmada.`
                : "Nada confirmado a partir de hoje ainda."}
            </p>
          </div>
          <Lista
            items={confirmed}
            secretary={secretary}
            vazio="Nenhum agendamento confirmado a partir de hoje."
          />
        </>
      ) : null}

      {/* ---------------------- aba: não confirmados ----------------------- */}
      {view === "pendentes" ? (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-l-2 border-amber-400 bg-amber-50/60 px-5 py-4">
            <div className="min-w-[240px] flex-1">
              <p className="eyebrow mb-1.5">Lembretes de pagamento</p>
              <p className="text-[13px] leading-relaxed text-espresso-soft/80">
                {pending.length
                  ? `${pending.length} agendamento(s) aguardando a taxa. A Secretária ${secretary} envia o lembrete — a mensagem já vem pronta e assinada por ela.`
                  : `Tudo em dia! Nenhum agendamento esperando confirmação. 🎉`}
              </p>
            </div>
            {pending.length ? (
              <button
                type="button"
                onClick={copyBatch}
                className="btn btn-gold !px-5 !py-2.5 !text-[10px]"
              >
                {batchCopied
                  ? "Tudo copiado ✓"
                  : `Copiar todos os lembretes (${pending.length})`}
              </button>
            ) : null}
          </div>

          <Lista
            items={pending}
            secretary={secretary}
            vazio="Tudo confirmado! Nenhum agendamento aguardando a taxa."
          />
        </>
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
