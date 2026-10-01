"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/servicos", label: "Serviços" },
  { href: "/promocoes", label: "Promoções" },
  { href: "/resultados", label: "Resultados" },
  { href: "/mostruario", label: "Mostruário" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isAdmin = pathname?.startsWith("/admin");
  const isBooking = pathname?.startsWith("/agendar");
  const overlayMode = pathname === "/" && !scrolled;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (isAdmin) return null;

  const tone = overlayMode ? "light" : "dark";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          overlayMode
            ? "bg-transparent"
            : "border-b border-champagne/70 bg-offwhite/92 backdrop-blur-md"
        }`}
        style={{ height: "var(--header-h)" }}
      >
        <div className="container-site flex h-full items-center justify-between gap-6">
          <Logo variant="horizontal" tone={tone} />

          <nav className="hidden items-center gap-5 lg:flex xl:gap-8">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative whitespace-nowrap text-[11px] uppercase tracking-[0.14em] transition-colors duration-300 xl:tracking-[0.22em] ${
                    overlayMode
                      ? "text-champagne hover:text-gold-soft"
                      : "text-espresso-soft hover:text-gold-deep"
                  } ${active ? (overlayMode ? "text-gold-soft" : "text-gold-deep") : ""}`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1.5 left-0 h-px bg-gold transition-all duration-300 ${
                      active ? "w-full" : "w-0"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/agendar"
              className="btn btn-gold hidden !px-7 !py-3 !text-[11px] lg:inline-flex"
            >
              Agendar
            </Link>

            <button
              type="button"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={`flex h-11 w-11 flex-col items-center justify-center gap-[5px] border transition-colors lg:hidden ${
                overlayMode && !open
                  ? "border-champagne/40 text-champagne"
                  : "border-espresso/20 text-espresso"
              }`}
            >
              <span
                className={`block h-px w-5 bg-current transition-transform duration-300 ${open ? "translate-y-[6px] rotate-45" : ""}`}
              />
              <span
                className={`block h-px w-5 bg-current transition-opacity duration-300 ${open ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-px w-5 bg-current transition-transform duration-300 ${open ? "-translate-y-[6px] -rotate-45" : ""}`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Menu mobile em tela cheia */}
      <div
        className={`fixed inset-0 z-40 bg-ink transition-opacity duration-500 lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex h-full flex-col justify-between gap-6 overflow-y-auto px-6 pb-10 pt-28">
          <nav className="flex flex-col gap-1">
            {LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="group flex items-baseline gap-4 border-b border-white/10 py-4 text-champagne transition-colors hover:text-gold-soft"
                style={{
                  transitionDelay: `${i * 40}ms`,
                  opacity: open ? 1 : 0,
                  transform: open ? "translateY(0)" : "translateY(14px)",
                  transition: "opacity .5s ease, transform .5s ease, color .3s ease",
                }}
              >
                <span className="font-display text-3xl">
                  {link.label}
                </span>
                <span className="text-[10px] tracking-[0.3em] text-gold/70">
                  0{i + 1}
                </span>
              </Link>
            ))}
          </nav>

          <div className="space-y-4">
            <Link
              href="/agendar"
              onClick={() => setOpen(false)}
              className="btn btn-gold w-full"
            >
              Agendar meu horário
            </Link>
            <p className="text-center text-[11px] tracking-[0.28em] text-champagne/60">
              {isBooking ? "RESERVE SUA DATA" : "ATELIER DE BELEZA PREMIUM"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
