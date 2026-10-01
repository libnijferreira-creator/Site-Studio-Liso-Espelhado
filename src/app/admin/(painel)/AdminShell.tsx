"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/admin/actions";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "◆" },
  { href: "/admin/servicos", label: "Serviços", icon: "◇" },
  { href: "/admin/agenda", label: "Agenda", icon: "◇" },
  { href: "/admin/avisos", label: "Avisos", icon: "◇" },
  { href: "/admin/promocoes", label: "Promoções", icon: "◇" },
  { href: "/admin/galeria", label: "Mostruário", icon: "◇" },
  { href: "/admin/depoimentos", label: "Depoimentos", icon: "◇" },
  { href: "/admin/conteudo", label: "Conteúdo", icon: "◇" },
  { href: "/admin/usuarios", label: "Usuários", icon: "◇" },
];

export function AdminShell({
  user,
  unread = 0,
  children,
}: {
  user: string;
  unread?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      {/* Topbar mobile */}
      <div className="flex items-center justify-between border-b border-champagne bg-ink px-5 py-4 lg:hidden">
        <span className="font-display text-[17px] tracking-[0.16em] text-champagne">
          STUDIO LISO
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="border border-champagne/40 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-champagne"
        >
          {open ? "Fechar" : "Menu"}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          open ? "block" : "hidden"
        } shrink-0 border-r border-white/10 bg-ink px-5 py-7 lg:flex lg:h-svh lg:w-64 lg:flex-col lg:px-6`}
      >
        <div className="hidden lg:block">
          <p className="font-display text-[19px] leading-tight tracking-[0.14em] text-champagne">
            PAINEL
          </p>
          <p className="mt-1 text-[9px] tracking-[0.34em] text-gold-soft">
            STUDIO LISO ESPELHADO
          </p>
        </div>

        <nav className="mt-7 flex flex-col gap-1 lg:flex-1">
          {ITEMS.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 border-l-2 px-3 py-3 text-[13px] tracking-[0.08em] transition-colors ${
                  active
                    ? "border-gold bg-white/[0.06] text-gold-soft"
                    : "border-transparent text-champagne/70 hover:border-champagne/40 hover:text-champagne"
                }`}
              >
                <span className="text-[9px] opacity-70">{item.icon}</span>
                {item.label}
                {item.href === "/admin/avisos" && unread > 0 ? (
                  <span className="ml-auto min-w-5 border border-gold/60 bg-gold/20 px-1.5 py-0.5 text-center text-[10px] leading-none text-gold-soft">
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-7 border-t border-white/10 pt-5">
          <p className="text-[10px] uppercase tracking-[0.24em] text-champagne/45">
            Conectada como
          </p>
          <p className="mt-1 text-[14px] text-champagne">{user}</p>

          <form action={logoutAction} className="mt-4">
            <button
              type="submit"
              className="w-full border border-champagne/30 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-champagne/80 transition-colors hover:border-gold hover:text-gold-soft"
            >
              Sair
            </button>
          </form>

          <Link
            href="/"
            className="mt-3 block text-center text-[11px] tracking-[0.16em] text-champagne/50 transition-colors hover:text-gold-soft"
          >
            ver o site →
          </Link>
        </div>
      </aside>

      <main className="flex-1 bg-cream px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        {children}
      </main>
    </div>
  );
}
