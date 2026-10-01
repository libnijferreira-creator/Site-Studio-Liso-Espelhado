"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function MobileCta() {
  const pathname = usePathname() ?? "";
  const hidden = pathname.startsWith("/agendar") || pathname.startsWith("/admin");

  // Reserva espaço para a barra fixa e devolve ao sair da página.
  useEffect(() => {
    if (hidden) return;
    document.body.style.paddingBottom = "78px";
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-champagne/60 bg-offwhite/95 px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md lg:hidden">
      <Link href="/agendar" className="btn btn-gold w-full !py-3.5">
        Agendar agora
      </Link>
    </div>
  );
}
