import type { Metadata } from "next";
import Link from "next/link";
import { formatBRL, formatDateShort, feeFor } from "@/lib/format";
import { getDb } from "@/lib/db";
import {
  getSiteSettings,
  listPromotions,
  listAppointments,
  listWorkingHours,
} from "@/lib/queries";
import { countUnreadNotifications, listNotifications } from "@/lib/notify";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="border border-champagne bg-white p-6">
      <p className="text-[10px] uppercase tracking-[0.24em] text-espresso-soft/75">
        {label}
      </p>
      <p className="mt-3 font-display text-[34px] leading-none text-ink">{value}</p>
      {hint ? (
        <p className="mt-2 text-[12px] text-espresso-soft/75">{hint}</p>
      ) : null}
    </div>
  );
}

export default function AdminDashboardPage() {
  const today = new Date().toISOString().slice(0, 10);
  const db = getDb();
  const feePercent = getSiteSettings().fee.percent;

  const todayCount = (
    db
      .prepare(
        "SELECT COUNT(*) AS n FROM appointments WHERE date = ? AND status NOT IN ('cancelled')"
      )
      .get(today) as { n: number }
  ).n;

  const upcoming = listAppointments({ from: today }).filter(
    (a) => a.status !== "cancelled"
  );

  const fees = upcoming
    .filter((a) => a.payment_status === "paid")
    .reduce((sum, a) => sum + a.fee_cents, 0);

  const cancelled = (
    db.prepare("SELECT COUNT(*) AS n FROM appointments WHERE status = 'cancelled'").get() as {
      n: number;
    }
  ).n;

  const blocked = (db.prepare("SELECT COUNT(*) AS n FROM blocks WHERE date = ?").get(today) as {
    n: number;
  }).n;

  const hours = listWorkingHours();
  const openToday = hours.find((h) => h.weekday === new Date().getDay());
  const slotsToday = openToday && !openToday.closed
    ? Math.max(0, Math.floor(((Number(openToday.close_time.slice(0,2)) * 60 + Number(openToday.close_time.slice(3,5)) - (Number(openToday.open_time.slice(0,2)) * 60 + Number(openToday.open_time.slice(3,5)))) / 60)))
    : 0;

  const activePromo = listPromotions(true)[0];
  const avisos = listNotifications(3);
  const avisosNaoLidos = countUnreadNotifications();

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-9">
        <p className="eyebrow mb-3">Visão geral</p>
        <h1 className="text-[36px] leading-tight sm:text-[44px]">Dashboard</h1>
        <div className="rule-gold mt-5 w-32" />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Agendamentos hoje" value={String(todayCount)} hint={formatDateShort(today)} />
        <Stat label="Próximos agendamentos" value={String(upcoming.length)} hint="a partir de hoje" />
        <Stat
          label="Taxas recebidas"
          value={formatBRL(fees)}
          hint={`${feePercent}% confirmados`}
        />
        <Stat label="Cancelamentos" value={String(cancelled)} hint="histórico total" />
        <Stat
          label="Horários ocupados hoje"
          value={String(todayCount + blocked)}
          hint="agendados + bloqueados"
        />
        <Stat
          label="Horários disponíveis hoje"
          value={String(Math.max(0, slotsToday - todayCount - blocked))}
          hint={openToday?.closed ? "fechado hoje" : "estimado por hora de atendimento"}
        />
        <Stat
          label="Promoção ativa"
          value={activePromo ? "1" : "0"}
          hint={activePromo ? activePromo.title : "nenhuma no momento"}
        />
        <Stat
          label="Taxa padrão"
          value={`${feePercent}%`}
          hint="calculada automaticamente"
        />
      </div>

      <section className="mt-10 border border-champagne bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-champagne px-6 py-5">
          <h2 className="text-[22px]">Próximos atendimentos</h2>
          <Link href="/admin/agenda" className="btn btn-outline !py-2.5 !text-[10px]">
            Abrir agenda
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="px-6 py-8 text-sm text-espresso-soft/75">
            Nenhum agendamento futuro ainda.
          </p>
        ) : (
          <ul className="divide-y divide-champagne/70">
            {upcoming.slice(0, 8).map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <div>
                  <p className="text-[15px] text-ink">
                    {formatDateShort(a.date)} · {a.time} — {a.service_name}
                  </p>
                  <p className="text-[13px] text-espresso-soft/75">
                    {a.client_name} · {a.client_whatsapp}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] text-ink">{formatBRL(a.total_cents)}</p>
                  <p className="text-[12px] text-gold-deep">
                    taxa {formatBRL(a.fee_cents)} · restante{" "}
                    {formatBRL(a.remainder_cents)}
                  </p>
                </div>
                <span className="border border-champagne px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-espresso-soft">
                  {a.status === "confirmed"
                    ? "Confirmado"
                    : a.status === "approved"
                      ? "Pagamento aprovado"
                      : a.status === "completed"
                        ? "Concluído"
                        : a.status === "cancelled"
                          ? "Cancelado"
                          : "Pendente"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 border border-champagne bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-champagne px-6 py-5">
          <h2 className="text-[22px]">
            Avisos de agendamento
            {avisosNaoLidos > 0 ? (
              <span className="ml-3 border border-gold/60 bg-gold/10 px-2 py-1 align-middle text-[10px] uppercase tracking-[0.16em] text-gold-deep">
                {avisosNaoLidos} não lido{avisosNaoLidos === 1 ? "" : "s"}
              </span>
            ) : null}
          </h2>
          <Link href="/admin/avisos" className="btn btn-outline !py-2.5 !text-[10px]">
            Abrir avisos
          </Link>
        </div>

        {avisos.length === 0 ? (
          <p className="px-6 py-6 text-sm text-espresso-soft/75">
            Nenhum aviso ainda. Cadastre os celulares do studio em Conteúdo →
            Avisos para receber a notificação de cada agendamento.
          </p>
        ) : (
          <ul className="divide-y divide-champagne/70">
            {avisos.map((n) => (
              <li
                key={n.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <div>
                  <p className="text-[14px] text-ink">
                    {n.kind === "confirmed" ? "Pagamento aprovado" : "Nova reserva"} ·{" "}
                    {n.phone}
                  </p>
                  <p className="text-[13px] text-espresso-soft/75">
                    {n.message
                      .split("\n")
                      .filter(Boolean)
                      .slice(1, 4)
                      .join(" · ")}
                  </p>
                </div>
                <a
                  href={n.wa_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline !py-2.5 !text-[10px]"
                >
                  Enviar no WhatsApp
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-[12px] text-espresso-soft/75">
        Exemplo de cálculo aplicado automaticamente: R$ 400,00 → taxa{" "}
        {formatBRL(feeFor(40000, feePercent))}, restante{" "}
        {formatBRL(40000 - feeFor(40000, feePercent))}.
      </p>
    </div>
  );
}
