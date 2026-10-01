"use client";

import Link from "next/link";
import {
  clearReadNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/admin/actions";

export type NotificationItem = {
  id: number;
  appointment_id: number | null;
  kind: string;
  phone: string;
  message: string;
  wa_link: string;
  status: string;
  created_at: string;
  read_at: string | null;
};

/** "2026-09-30 14:02:11" (UTC do SQLite) → horário local. */
function when(utc: string): string {
  const d = new Date(`${utc.replace(" ", "T")}Z`);
  if (Number.isNaN(d.getTime())) return utc;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function kindLabel(kind: string) {
  return kind === "confirmed"
    ? { text: "Pagamento aprovado", cls: "bg-emerald-900/10 text-emerald-800 border-emerald-800/30" }
    : { text: "Nova reserva", cls: "bg-gold/15 text-espresso border-gold/50" };
}

export function NotificationsManager({
  items,
  unread,
  phones,
}: {
  items: NotificationItem[];
  unread: number;
  phones: string[];
}) {
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-champagne pb-5">
        <div>
          <p className="eyebrow">Painel</p>
          <h1 className="mt-1 font-heading text-3xl leading-none">Avisos de agendamento</h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-espresso-soft/75">
            Cada nova reserva e cada pagamento aprovado geram um aviso para
            {phones.length > 0 ? (
              <>
                {" "}
                os celulares <strong>{phones.join(", ")}</strong>
              </>
            ) : (
              " os celulares cadastrados"
            )}
            . Use o botão <strong>Enviar no WhatsApp</strong> para abrir a
            mensagem pronta no celular.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="border border-gold/60 bg-gold/10 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-espresso">
            {unread} não lido{unread === 1 ? "" : "s"}
          </span>
          <form action={markAllNotificationsReadAction}>
            <button type="submit" className="btn btn-outline !px-4 !py-2 !text-[11px]">
              Marcar todas como lidas
            </button>
          </form>
          <form action={clearReadNotificationsAction}>
            <button type="submit" className="btn btn-outline !px-4 !py-2 !text-[11px]">
              Limpar lidos
            </button>
          </form>
        </div>
      </header>

      {phones.length === 0 ? (
        <div className="border-l-2 border-gold bg-offwhite px-5 py-4 text-[13.5px] leading-relaxed text-espresso-soft/85">
          Nenhum celular cadastrado. Cadastre um ou mais números em{" "}
          <Link href="/admin/conteudo" className="text-gold underline">
            Conteúdo → Avisos
          </Link>{" "}
          para que os avisos passem a ser gerados.
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="card-premium p-8 text-center text-[14px] text-espresso-soft/75">
          Nenhum aviso ainda. Assim que alguém fizer um agendamento ele aparece
          aqui.
        </div>
      ) : (
        <ul className="grid gap-4">
          {items.map((n) => {
            const kind = kindLabel(n.kind);
            const lida = n.status === "read";
            return (
              <li
                key={n.id}
                className={`card-premium grid gap-4 p-5 sm:grid-cols-[1fr_auto] ${
                  lida ? "opacity-60" : ""
                }`}
              >
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`border px-2.5 py-1 text-[10.5px] uppercase tracking-[0.18em] ${kind.cls}`}
                    >
                      {kind.text}
                    </span>
                    <span className="text-[12px] uppercase tracking-[0.14em] text-espresso-soft/75">
                      {n.phone}
                    </span>
                    <span className="text-[12px] text-espresso-soft/75">{when(n.created_at)}</span>
                    {lida ? (
                      <span className="text-[11px] uppercase tracking-[0.16em] text-espresso-soft/75">
                        lida
                      </span>
                    ) : null}
                  </div>

                  <pre className="whitespace-pre-wrap break-words font-body text-[13px] leading-relaxed text-espresso-soft/90">
                    {n.message}
                  </pre>
                </div>

                <div className="flex flex-col gap-2 sm:w-52">
                  <a
                    href={n.wa_link || `https://wa.me/${n.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-dark !text-[11px]"
                  >
                    Enviar no WhatsApp
                  </a>
                  {!lida ? (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="id" value={n.id} />
                      <button type="submit" className="btn btn-outline w-full !text-[11px]">
                        Marcar como lida
                      </button>
                    </form>
                  ) : null}
                  {n.appointment_id ? (
                    <Link
                      href={`/admin/agenda?date=${(n.message.match(/\d{4}-\d{2}-\d{2}/) || [""])[0]}`}
                      className="btn btn-outline w-full !text-[11px]"
                    >
                      Ver na agenda
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
