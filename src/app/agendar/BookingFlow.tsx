"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  feeFor,
  formatBRL,
  formatCNPJ,
  formatDateLong,
  formatDuration,
  maskCPF,
  maskPhone,
  remainderFor,
  toISO,
} from "@/lib/format";
import type { PaymentSettings, Schedule, Service, WorkingHours } from "@/lib/types";
import type { HairSizesSettings } from "@/lib/types";
import { optionsFor, resolveSize } from "@/lib/hairsize";

const STEPS = [
  "Serviço",
  "Data",
  "Horário",
  "Dados",
  "Resumo",
  "Pagamento",
  "Confirmação",
];

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const DOM = ["D", "S", "T", "Q", "Q", "S", "S"];

interface ClientData {
  name: string;
  whatsapp: string;
  email: string;
  cpf: string;
  notes: string;
}

interface BookingResult {
  code: string;
  service: { id: number; name: string; duration_min: number };
  date: string;
  time: string;
  total: number;
  fee: number;
  remainder: number;
  feePercent: number;
}

interface PaymentSession {
  mode: "mercadopago" | "sandbox";
  method: "pix" | "card";
  amountCents: number;
  payload?: string;
  qrCodeBase64?: string;
  checkoutUrl?: string;
  notice: string;
}

interface Confirmation {
  code: string;
  status: string;
  service: string;
  hairSize?: string | null;
  date: string;
  time: string;
  total: number;
  fee: number;
  remainder: number;
  studioName: string;
  sandbox: boolean;
  studioPhone?: string;
  whatsappLink?: string;
}

const EMPTY: ClientData = { name: "", whatsapp: "", email: "", cpf: "", notes: "" };

export function BookingFlow({
  services,
  hours,
  schedule,
  hairSizes,
  payment,
  studioWaLink,
  feePercent,
}: {
  services: Service[];
  hours: WorkingHours[];
  schedule: Schedule;
  hairSizes: HairSizesSettings;
  /** Dados de recebimento (PIX/cartão) — Conteúdo → Pagamento. */
  payment: PaymentSettings;
  /** Dígitos do WhatsApp do studio (com DDI) para o comprovante. */
  studioWaLink: string;
  /** % da taxa de agendamento — Conteúdo → Taxa (nunca fixar aqui). */
  feePercent: number;
}) {
  const [step, setStep] = useState(1);
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [client, setClient] = useState<ClientData>(EMPTY);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotInfo, setSlotInfo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPixKey, setCopiedPixKey] = useState(false);
  // Tamanho do cabelo escolhido no passo 1 (vazio = primeira opção).
  const [sizeId, setSizeId] = useState<string>("");

  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() =>
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  // Pré-seleção vinda dos cards de serviço (/agendar?servico=ID)
  const searchParams = useSearchParams();
  useEffect(() => {
    const raw = searchParams.get("servico");
    if (!raw) return;
    const id = Number(raw);
    if (!Number.isFinite(id)) return;
    const found = services.find((s) => s.id === id);
    if (found) {
      setService(found);
      setStep(2);
    }
  }, [searchParams, services]);

  // Tamanho do cabelo: só serviços de cabelo (não sobrancelhas/unhas).
  const sizeOptions = service ? optionsFor(hairSizes, service) : [];
  const sizeOption = service ? resolveSize(hairSizes, service, sizeId) : null;
  const sizeCents = sizeOption?.price_cents ?? 0;
  // Valor do procedimento = serviço + acréscimo do tamanho.
  const procedureCents = service ? service.price_cents + sizeCents : 0;

  const fee = service ? feeFor(procedureCents, feePercent) : 0;
  const remainder = service ? remainderFor(procedureCents, feePercent) : 0;

  const hoursByWeekday = useMemo(() => {
    const map: Record<number, WorkingHours> = {};
    hours.forEach((h) => (map[h.weekday] = h));
    return map;
  }, [hours]);

  /* ------------------------------ horários ------------------------------ */
  useEffect(() => {
    if (!date || !service) return;
    let alive = true;
    setLoading(true);
    setError(null);

    const url = `/api/booking/availability?date=${date}&serviceId=${service.id}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        setSlots(Array.isArray(data.slots) ? data.slots : []);
        setSlotInfo(
          data.closed && data.reason
            ? data.reason
            : `${data.openTime} às ${data.closeTime}`
        );
        setTime("");
      })
      .catch(() => alive && setError("Não foi possível carregar os horários."))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [date, service]);

  /* ------------------------------ calendário ---------------------------- */
  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const total = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (string | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= total; d++) cells.push(toISO(new Date(cursor.getFullYear(), cursor.getMonth(), d)));
    return cells;
  }, [cursor]);

  function dayDisabled(iso: string): boolean {
    const d = new Date(`${iso}T12:00:00`);
    const wd = d.getDay();
    const wh = hoursByWeekday[wd];
    if (!wh || wh.closed) return true;
    if (iso < toISO(today)) return true;

    // Regra de agenda: unha só na quarta; na quarta não há cabelo.
    if (schedule.hairBlockedOnNailDay && service) {
      const nails = service.track === "nails";
      if (nails && wd !== schedule.nailWeekday) return true;
      if (!nails && wd === schedule.nailWeekday) return true;
    }

    return false;
  }

  /* ------------------------------ ações -------------------------------- */
  async function createBooking() {
    // Evita duplicar a reserva caso a cliente volte para o passo 4.
    if (result) {
      setStep(5);
      return;
    }
    if (!service || !date || !time) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          date,
          time,
          ...(sizeOption ? { hairSize: sizeOption.id } : {}),
          ...client,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao reservar.");
      setResult(data);
      setStep(5);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao reservar.");
    } finally {
      setLoading(false);
    }
  }

  async function startPayment(method: "pix" | "card") {
    if (!result) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/booking/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: result.code,
          method,
          payer: { name: client.name, email: client.email, cpf: client.cpf },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao iniciar o pagamento.");
      setSession(data as PaymentSession);
      setStep(6);
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao iniciar o pagamento.");
    } finally {
      setLoading(false);
    }
  }

  async function approvePayment() {
    if (!result) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch("/api/booking/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: result.code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível confirmar.");
      setConfirmation(data as Confirmation);
      setStep(7);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível confirmar.");
    } finally {
      setConfirming(false);
    }
  }

  function copyPix() {
    if (!session?.payload) return;
    navigator.clipboard?.writeText(session.payload).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  // Chave PIX do studio (pode ser o CNPJ) — exibida na etapa de pagamento.
  const pixDigits = (payment.pixKey || "").replace(/\D/g, "");
  const pixKeyLabel =
    pixDigits.length === 14 ? formatCNPJ(pixDigits) : payment.pixKey || "";

  function copyPixKey() {
    if (!payment.pixKey) return;
    navigator.clipboard?.writeText(payment.pixKey).then(() => {
      setCopiedPixKey(true);
      setTimeout(() => setCopiedPixKey(false), 2500);
    });
  }

  // WhatsApp da Hadassa com a mensagem do comprovante pronta.
  const comprovanteLink = studioWaLink
    ? `https://wa.me/${studioWaLink}?text=${encodeURIComponent(
        `Olá, Hadassa! Paguei a taxa de ${formatBRL(
          session?.amountCents ?? fee
        )} do agendamento${result ? ` ${result.code}` : ""} via PIX ou cartão. Segue o comprovante.`
      )}`
    : "";

  function back() {
    setError(null);
    if (step === 6 && session) return setStep(5);
    setStep((s) => Math.max(1, s - 1));
  }

  const canContinue =
    (step === 1 && service) ||
    (step === 2 && date) ||
    (step === 3 && time) ||
    (step === 4 && client.name.trim().length >= 3 && client.whatsapp.replace(/\D/g, "").length >= 10);

  /* ------------------------------- render ------------------------------ */
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <div>
        {/* passos */}
        <ol className="mb-9 flex flex-wrap gap-x-5 gap-y-2 border-b border-champagne pb-5">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const state = n === step ? "on" : n < step ? "done" : "off";
            return (
              <li
                key={label}
                className={`text-[10px] uppercase tracking-[0.2em] ${
                  state === "on"
                    ? "text-gold-deep"
                    : state === "done"
                      ? "text-espresso-soft/85"
                      : "text-espresso-soft/75"
                }`}
              >
                <span className="mr-1.5 font-semibold">{n}</span>
                {label}
              </li>
            );
          })}
        </ol>

        {error ? (
          <p className="mb-6 border-l-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {/* 1 — serviço */}
        {step === 1 ? (
          <div>
            <h2 className="mb-1 text-[30px] leading-tight">Escolha o serviço</h2>
            <p className="mb-7 text-[14px] text-espresso-soft/75">
              Selecione o procedimento. A taxa de {feePercent}% é calculada
              automaticamente.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setService(s)}
                  className={`card-premium p-6 text-left transition-all duration-300 ${
                    service?.id === s.id
                      ? "!border-gold ring-1 ring-gold/50"
                      : "hover:-translate-y-1"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[21px] leading-tight">{s.name}</h3>
                    <span className="shrink-0 font-semibold text-gold-deep">
                      {formatBRL(s.price_cents)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[13.5px] text-espresso-soft/75">
                    {s.description}
                  </p>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-espresso-soft/75">
                    {formatDuration(s.duration_min)} · {s.category}
                  </p>
                </button>
              ))}
            </div>

            {sizeOptions.length ? (
              <fieldset className="mt-9 border-t border-champagne pt-7">
                <legend className="text-[13px] uppercase tracking-[0.2em] text-espresso-soft/75">
                  Tamanho do cabelo
                </legend>
                <p className="mb-4 mt-3 text-[14px] text-espresso-soft/75">
                  O tamanho soma um acréscimo ao valor do serviço e a taxa de{" "}
                  {feePercent}% passa a ser calculada sobre o total.
                </p>
                <div className="grid gap-3 sm:grid-cols-4">
                  {sizeOptions.map((o) => {
                    const on = sizeOption?.id === o.id;
                    return (
                      <label
                        key={o.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 border px-4 py-3.5 transition-all duration-200 ${
                          on
                            ? "border-gold bg-gold/10"
                            : "border-champagne hover:border-gold"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="hair-size"
                            value={o.id}
                            checked={on}
                            onChange={() => setSizeId(o.id)}
                            className="h-4 w-4 accent-gold"
                          />
                          <span className="text-[14px] font-medium text-espresso">
                            {o.label}
                          </span>
                        </span>
                        <span className="shrink-0 text-[12px] text-gold-deep">
                          {o.price_cents > 0
                            ? `+ ${formatBRL(o.price_cents)}`
                            : "sem acréscimo"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}
          </div>
        ) : null}

        {/* 2 — data */}
        {step === 2 ? (
          <div>
            <h2 className="mb-1 text-[30px] leading-tight">Escolha a data</h2>
            <p className="mb-7 text-[14px] text-espresso-soft/75">
              {service?.track === "nails"
                ? `Atendimento de unhas somente ${schedule.nailWeekdayLabel}.`
                : schedule.hairBlockedOnNailDay
                  ? `Terça a sábado, 09h às 18h — exceto ${schedule.nailWeekdayLabel}, dia de unhas.`
                  : "Terça a sábado, das 09h às 18h. Domingo e segunda fechado."}
            </p>

            <div className="card-premium p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                  }
                  className="btn btn-outline !px-4 !py-2 !text-[11px]"
                >
                  ← Anterior
                </button>
                <p className="text-[14px] uppercase tracking-[0.2em]">
                  {MESES[cursor.getMonth()]} {cursor.getFullYear()}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                  }
                  className="btn btn-outline !px-4 !py-2 !text-[11px]"
                >
                  Próximo →
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {DOM.map((d, i) => (
                  <div
                    key={`${d}-${i}`}
                    className="pb-2 text-center text-[10px] uppercase tracking-[0.18em] text-espresso-soft/75"
                  >
                    {d}
                  </div>
                ))}
                {days.map((iso, i) =>
                  iso === null ? (
                    <div key={`e-${i}`} />
                  ) : (
                    <button
                      key={iso}
                      type="button"
                      disabled={dayDisabled(iso)}
                      onClick={() => setDate(iso)}
                      className={`aspect-square border text-[13.5px] transition-all duration-200 ${
                        date === iso
                          ? "border-gold bg-gold text-white"
                          : dayDisabled(iso)
                            ? "cursor-not-allowed border-transparent text-espresso-soft/25"
                            : "border-champagne text-espresso hover:border-gold hover:text-gold-deep"
                      }`}
                    >
                      {Number(iso.slice(-2))}
                    </button>
                  )
                )}
              </div>
            </div>

            {date ? (
              <p className="mt-5 text-[14px] text-espresso-soft/80">
                Data selecionada:{" "}
                <strong className="text-gold-deep">{formatDateLong(date)}</strong>
              </p>
            ) : null}
          </div>
        ) : null}

        {/* 3 — horário */}
        {step === 3 ? (
          <div>
            <h2 className="mb-1 text-[30px] leading-tight">Escolha o horário</h2>
            <p className="mb-7 text-[14px] text-espresso-soft/75">
              {service ? `${service.name} · ${formatDuration(service.duration_min)} · ` : ""}
              {formatDateLong(date)}
              {slotInfo ? ` · aberto das ${slotInfo}` : ""}
            </p>

            {loading ? (
              <p className="text-[14px] text-espresso-soft/75">Carregando horários...</p>
            ) : slots.length === 0 ? (
              <div className="card-premium p-8 text-center text-[14px] text-espresso-soft/75">
                Nenhum horário livre nesta data. Tente outro dia.
                <div className="mt-5">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setStep(2)}
                  >
                    Voltar e escolher outra data
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTime(s)}
                    className={`border py-3 text-[13.5px] transition-all duration-200 ${
                      time === s
                        ? "border-gold bg-gold text-white"
                        : "border-champagne text-espresso hover:border-gold hover:text-gold-deep"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* 4 — dados */}
        {step === 4 ? (
          <div>
            <h2 className="mb-1 text-[30px] leading-tight">Seus dados</h2>
            <p className="mb-7 text-[14px] text-espresso-soft/75">
              Usados para confirmar o agendamento no WhatsApp.
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="bk-name">Nome completo *</label>
                <input
                  id="bk-name"
                  className="field"
                  value={client.name}
                  onChange={(e) => setClient({ ...client, name: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="bk-wpp">WhatsApp *</label>
                <input
                  id="bk-wpp"
                  className="field"
                  inputMode="numeric"
                  value={client.whatsapp}
                  onChange={(e) =>
                    setClient({ ...client, whatsapp: maskPhone(e.target.value) })
                  }
                  placeholder="(24) 98153-1771"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="bk-mail">E-mail</label>
                <input
                  id="bk-mail"
                  type="email"
                  className="field"
                  value={client.email}
                  onChange={(e) => setClient({ ...client, email: e.target.value })}
                  placeholder="voce@email.com"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="bk-cpf">CPF</label>
                <input
                  id="bk-cpf"
                  className="field"
                  inputMode="numeric"
                  value={client.cpf}
                  onChange={(e) => setClient({ ...client, cpf: maskCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="bk-notes">Observações</label>
                <textarea
                  id="bk-notes"
                  className="field min-h-[96px]"
                  value={client.notes}
                  onChange={(e) => setClient({ ...client, notes: e.target.value })}
                  placeholder="Algo importante sobre o seu cabelo?"
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* 5 — resumo */}
        {step === 5 && service ? (
          <div>
            <h2 className="mb-1 text-[30px] leading-tight">Resumo da reserva</h2>
            <p className="mb-7 text-[14px] text-espresso-soft/75">
              Código de reserva: <strong className="text-gold-deep">{result?.code}</strong>
            </p>

            <div className="card-premium divide-y divide-champagne p-6 sm:p-8">
              <Row label="Serviço" value={service.name} />
              {sizeOption ? (
                <Row
                  label="Tamanho do cabelo"
                  value={
                    sizeCents > 0
                      ? `${sizeOption.label} · acréscimo ${formatBRL(sizeCents)}`
                      : `${sizeOption.label} · sem acréscimo`
                  }
                />
              ) : null}
              <Row label="Duração" value={formatDuration(service.duration_min)} />
              <Row label="Data" value={formatDateLong(date)} />
              <Row label="Horário" value={time} />
              <Row label="Cliente" value={client.name} />
              <Row label="WhatsApp" value={client.whatsapp} />
              <Row label="Valor do procedimento" value={formatBRL(procedureCents)} />
              <Row
                label={`Taxa de agendamento (${feePercent}%) — calculada automaticamente`}
                value={formatBRL(fee)}
                accent
              />
              <div className="flex items-baseline justify-between gap-4 pt-5">
                <span className="text-[13px] uppercase tracking-[0.2em] text-espresso-soft/75">
                  Total à vista
                </span>
                <span className="font-display text-[32px] leading-none text-gold-deep">
                  {formatBRL(fee)}
                </span>
              </div>
              <p className="mt-4 text-[12.5px] leading-relaxed text-espresso-soft/75">
                A taxa de {feePercent}% é o valor pago agora para reservar o
                horário. O restante ({formatBRL(remainder)}) é pago diretamente
                no studio no dia do atendimento.
              </p>
            </div>
          </div>
        ) : null}

        {/* 6 — pagamento */}
        {step === 6 && session ? (
          <div>
            <h2 className="mb-1 text-[30px] leading-tight">Pagamento da taxa</h2>
            <p className="mb-7 text-[14px] text-espresso-soft/75">
              {session.notice}
            </p>

            {/* Pagamento direto: PIX/cartão na conta do studio (Nubank) */}
            {payment.enabled && (payment.pixEnabled || payment.cardEnabled) ? (
              <div className="mb-7 border border-gold/50 bg-white p-5 sm:p-6">
                <p className="eyebrow mb-4">
                  Pague direto{payment.bank ? ` · ${payment.bank}` : ""}
                </p>

                {payment.pixEnabled && payment.pixKey ? (
                  <div className="border-b border-champagne pb-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <span className="text-[13px] uppercase tracking-[0.2em] text-espresso-soft/75">
                        Chave PIX{pixDigits.length === 14 ? " (CNPJ)" : ""}
                      </span>
                      <span className="font-display text-[26px] leading-none text-gold-deep">
                        {formatBRL(session.amountCents)}
                      </span>
                    </div>

                    <p className="mt-3 break-all border border-champagne bg-offwhite p-3 text-[13.5px] text-espresso">
                      {pixKeyLabel}
                    </p>

                    <dl className="mt-3 grid gap-1 text-[12.5px] leading-relaxed text-espresso-soft/75 sm:grid-cols-2">
                      {payment.holder ? (
                        <div>
                          <dt className="inline font-medium text-espresso-soft">
                            Titular:{" "}
                          </dt>
                          <dd className="inline">{payment.holder}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="inline font-medium text-espresso-soft">
                          Banco:{" "}
                        </dt>
                        <dd className="inline">{payment.bank || "—"}</dd>
                      </div>
                      {payment.cnpj ? (
                        <div>
                          <dt className="inline font-medium text-espresso-soft">
                            CNPJ:{" "}
                          </dt>
                          <dd className="inline">{formatCNPJ(payment.cnpj)}</dd>
                        </div>
                      ) : null}
                      {payment.agency || payment.account ? (
                        <div>
                          <dt className="inline font-medium text-espresso-soft">
                            Conta:{" "}
                          </dt>
                          <dd className="inline">
                            {[
                              payment.agency ? `ag. ${payment.agency}` : "",
                              payment.account ? `cc ${payment.account}` : "",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </dd>
                        </div>
                      ) : null}
                    </dl>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={copyPixKey}
                      >
                        {copiedPixKey ? "Chave copiada ✓" : "Copiar chave PIX"}
                      </button>
                      {comprovanteLink ? (
                        <a
                          href={comprovanteLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-gold"
                        >
                          Já paguei — enviar comprovante
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {payment.cardEnabled ? (
                  <div className={payment.pixEnabled && payment.pixKey ? "pt-5" : ""}>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <span className="text-[13px] uppercase tracking-[0.2em] text-espresso-soft/75">
                        Cartão pelo aplicativo do {payment.bank || "studio"}
                      </span>
                      <span className="font-display text-[26px] leading-none text-gold-deep">
                        {formatBRL(session.amountCents)}
                      </span>
                    </div>

                    <p className="mt-3 text-[13px] leading-relaxed text-espresso-soft/80">
                      {payment.cardTerms ||
                        "Parcelamento e juros são calculados pelo próprio aplicativo no momento do pagamento."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {payment.cardLink ? (
                        <a
                          href={payment.cardLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-dark"
                        >
                          Pagar com cartão
                        </a>
                      ) : null}
                      {comprovanteLink ? (
                        <a
                          href={comprovanteLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-gold"
                        >
                          Já paguei — enviar comprovante
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <p className="mt-5 border-l-2 border-gold/60 pl-4 text-[12.5px] leading-relaxed text-espresso-soft/75">
                  Depois de pagar, envie o comprovante no WhatsApp: a{" "}
                  <strong className="text-espresso">Hadassa</strong>, nossa
                  secretária virtual, confirma o recebimento e o horário fica
                  travado na agenda. Se precisar de ajuda, é só chamar.
                </p>
              </div>
            ) : null}

            <div className="card-premium p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-champagne pb-5">
                <span className="text-[13px] uppercase tracking-[0.2em] text-espresso-soft/75">
                  {session.method === "pix"
                    ? session.mode === "sandbox"
                      ? "PIX · demonstração (Mercado Pago)"
                      : "PIX pelo Mercado Pago"
                    : session.mode === "sandbox"
                      ? "Cartão · demonstração (Mercado Pago)"
                      : "Cartão pelo Mercado Pago"}
                </span>
                <span className="font-display text-[32px] leading-none text-gold-deep">
                  {formatBRL(session.amountCents)}
                </span>
              </div>

              {session.method === "pix" ? (
                <div className="mt-6 grid gap-6 sm:grid-cols-[170px_1fr]">
                  <div className="flex h-[170px] w-[170px] items-center justify-center border border-champagne bg-white p-2">
                    {session.qrCodeBase64 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`data:image/png;base64,${session.qrCodeBase64}`}
                        alt="QR Code PIX"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center border border-dashed border-gold/50 text-center">
                        <span className="font-display text-[30px] text-gold-deep">BR</span>
                        <span className="mt-1 px-2 text-[8.5px] uppercase leading-tight tracking-[0.16em] text-espresso-soft/75">
                          QR Code
                          {session.mode === "sandbox" ? " de demonstração" : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="field-label">PIX copia e cola</label>
                    <p className="break-all border border-champagne bg-offwhite p-3 text-[11.5px] leading-relaxed text-espresso-soft/80">
                      {session.payload}
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline mt-3"
                      onClick={copyPix}
                    >
                      {copied ? "Copiado ✓" : "Copiar código PIX"}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-7 rounded-sm border border-champagne bg-offwhite p-5">
                <p className="text-[13px] leading-relaxed text-espresso-soft/80">
                  {session.mode === "sandbox"
                    ? "Ambiente de demonstração: nenhum valor será cobrado de fato. Ao confirmar, o agendamento é aprovado e o horário é travado."
                    : "Assina o pagamento, a confirmação acontece automaticamente e o horário é travado na agenda."}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="btn btn-gold"
                    onClick={approvePayment}
                    disabled={confirming || loading}
                  >
                    {confirming
                      ? "Confirmando..."
                      : session.mode === "sandbox"
                        ? "Simular pagamento aprovado"
                        : "Já fiz o pagamento"}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={back}>
                    Voltar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* 7 — confirmação */}
        {step === 7 && confirmation ? (
          <div className="card-premium p-8 text-center sm:p-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gold bg-gold/10">
              <svg viewBox="0 0 24 24" className="h-9 w-9 text-gold-deep" aria-hidden="true">
                <path
                  d="M4.5 12.5l5 5 10-11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <p className="eyebrow mb-3">Pagamento aprovado</p>
            <h2 className="text-[34px] leading-tight">Agendamento confirmado</h2>

            <div className="mx-auto mt-7 max-w-md space-y-3 text-left">
              <Row label="Código" value={confirmation.code} />
              <Row label="Serviço" value={confirmation.service} />
              {confirmation.hairSize ? (
                <Row label="Tamanho do cabelo" value={confirmation.hairSize} />
              ) : null}
              <Row label="Data" value={formatDateLong(confirmation.date)} />
              <Row label="Horário" value={confirmation.time} />
              <Row label="Taxa paga" value={formatBRL(confirmation.fee)} accent />
              <Row
                label="Restante no studio"
                value={formatBRL(confirmation.remainder)}
              />
            </div>

            <p className="mx-auto mt-7 max-w-lg text-[13.5px] leading-relaxed text-espresso-soft/75">
              A <strong className="text-espresso">Hadassa</strong>, nossa
              secretária virtual, já avisou os dois celulares do Studio e a
              confirmação ficou salva. Chegue com 10 minutos de antecedência.
            </p>

            {confirmation.whatsappLink ? (
              <div className="mt-6">
                <a
                  href={`https://wa.me/${confirmation.whatsappLink}?text=${encodeURIComponent(
                    `Olá! Meu agendamento ${confirmation.code} foi confirmado: ${confirmation.service}, em ${formatDateLong(confirmation.date)} às ${confirmation.time}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold"
                >
                  Enviar confirmação no WhatsApp
                </a>
              </div>
            ) : null}

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a href="/" className="btn btn-dark">Voltar ao site</a>
              <a href={`/resultados`} className="btn btn-outline">
                Ver resultados
              </a>
            </div>
          </div>
        ) : null}

        {/* navegação */}
        {step < 7 && step !== 6 ? (
          <div className="mt-9 flex flex-wrap items-center gap-3 border-t border-champagne pt-7">
            {step > 1 ? (
              <button type="button" className="btn btn-outline" onClick={back}>
                ← Voltar
              </button>
            ) : null}

            {step === 4 ? (
              <button
                type="button"
                className="btn btn-dark"
                disabled={!canContinue || loading}
                onClick={createBooking}
              >
                {loading ? "Reservando..." : "Revisar reserva →"}
              </button>
            ) : step < 5 ? (
              <button
                type="button"
                className="btn btn-dark"
                disabled={!canContinue}
                onClick={() => {
                  setError(null);
                  setStep((s) => s + 1);
                }}
              >
                Continuar →
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-gold"
                disabled={loading}
                onClick={() => startPayment("pix")}
              >
                {loading ? "Gerando..." : `Pagar taxa ${formatBRL(fee)}`}
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* coluna lateral — resumo fixo */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card-premium p-6">
          <p className="eyebrow mb-4">Sua reserva</p>

          <div className="space-y-3.5 text-[13.5px]">
            <div className="flex justify-between gap-3">
              <span className="text-espresso-soft/75">Serviço</span>
              <span className="text-right font-medium">
                {service ? service.name : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-espresso-soft/75">Data</span>
              <span className="text-right font-medium">
                {date ? formatDateLong(date) : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-espresso-soft/75">Horário</span>
              <span className="font-medium">{time || "—"}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-espresso-soft/75">Procedimento</span>
              <span className="font-medium">
                {service ? formatBRL(procedureCents) : "—"}
              </span>
            </div>
            {sizeOption ? (
              <div className="flex justify-between gap-3">
                <span className="text-espresso-soft/75">Tamanho do cabelo</span>
                <span className="text-right font-medium">
                  {sizeOption.label}
                  {sizeCents > 0 ? ` (+${formatBRL(sizeCents)})` : ""}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <span className="text-gold-deep">Taxa {feePercent}%</span>
              <span className="font-medium text-gold-deep">
                {service ? formatBRL(fee) : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-t border-champagne pt-4">
              <span className="text-espresso-soft/75">Restante no studio</span>
              <span className="font-medium">
                {service ? formatBRL(remainder) : "—"}
              </span>
            </div>
          </div>

          <p className="mt-5 border-l-2 border-gold/50 pl-4 text-[12px] leading-relaxed text-espresso-soft/75">
            A taxa de {feePercent}% garante a reserva do horário e é cobrada por
            procedimento. O valor restante é pago no studio.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-5 py-3">
      <span
        className={`text-[12.5px] leading-snug ${accent ? "text-gold-deep" : "text-espresso-soft/75"}`}
      >
        {label}
      </span>
      <span
        className={`shrink-0 text-right font-medium ${accent ? "text-gold-deep" : "text-espresso"}`}
      >
        {value}
      </span>
    </div>
  );
}
