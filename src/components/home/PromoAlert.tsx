"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISS_KEY = "slep:promo-alert";

export type PromoAlertData = {
  /** número de promoções ativas */
  count: number;
  /** maior desconto entre elas, em % (0 quando não calculável) */
  maxDiscountPct: number;
};

/**
 * ABA DE DESTAQUE DA HOME — aviso de promoções com ícone de alerta.
 *
 * Comportamento:
 *  - só renderiza se houver promoção ativa;
 *  - leva a #promocoes (seção das promoções na própria home);
 *  - o visitante pode fechar (×) e o aviso fica guardado em sessionStorage,
 *    ou seja, volta na próxima visita — não some pra sempre.
 *
 * Por ser client component, o estado inicial casa com o do servidor e a
 * checagem de sessionStorage roda só no efeito (pós-hidratação).
 */
export function PromoAlert({ count, maxDiscountPct }: PromoAlertData) {
  // Começa TRUE de propósito: assim o servidor emite a aba no HTML (funciona
  // sem JS e o Google enxerga). O fechamento por sessionStorage só roda depois
  // da hidratação — update pós-hidratação, sem divergência de hidratação.
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY)) setOpen(false);
    } catch {
      /* storage indisponível — mantém o aviso visível */
    }
  }, []);

  if (count <= 0 || !open) return null;

  function dismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* storage indisponível — só fecha desta vez */
    }
    setOpen(false);
  }

  return (
    <div className="relative z-30 mb-9 max-w-2xl animate-[fade-up_.7s_cubic-bezier(.22,1,.36,1)_both]">
      <Link
        href="#promocoes"
        className="group flex flex-wrap items-center gap-x-5 gap-y-4 border border-gold/70 bg-gradient-to-r from-ink/95 via-ink/90 to-ink/60 py-4 pl-4 pr-28 backdrop-blur-sm transition-colors duration-300 hover:border-gold sm:pl-5"
      >
        {/* ícone de alerta */}
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center border border-gold/70 bg-gold/15 text-gold-soft">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M12 9.5v4m0 3h.01" />
            <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
          <span
            className="absolute inset-0 animate-ping border border-gold/40"
            aria-hidden="true"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="eyebrow !text-gold-soft">Promoções ativas</span>
          <span className="mt-1.5 block font-display text-[21px] leading-tight text-champagne sm:text-[25px]">
            {count === 1 ? "1 oferta" : `${count} ofertas`} por tempo limitado
            {maxDiscountPct > 0 ? (
              <>
                {" · "}
                <span className="text-gold-soft">até {maxDiscountPct}% OFF</span>
              </>
            ) : null}
          </span>
        </span>

        <span className="btn btn-gold !px-6 !py-3 !text-[10px] group-hover:brightness-110">
          Ver agora
        </span>
      </Link>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar aviso de promoções"
        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-champagne/25 text-champagne/70 transition-colors duration-300 hover:border-champagne/60 hover:text-champagne"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
