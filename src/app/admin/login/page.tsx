import type { Metadata } from "next";
import { Logo } from "@/components/site/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Acesso restrito",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-ink px-5 py-16">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 25% 20%, rgba(194,161,93,.30) 0, transparent 55%), radial-gradient(ellipse at 80% 85%, rgba(220,198,180,.18) 0, transparent 50%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-9 flex justify-center">
          <Logo variant="vertical" tone="light" />
        </div>

        <div className="bg-offwhite p-8 shadow-[0_40px_80px_-40px_rgba(0,0,0,.8)] sm:p-10">
          <p className="eyebrow mb-3">Painel administrativo</p>
          <h1 className="text-[32px] leading-tight">Acesso restrito</h1>
          <div className="rule-gold mt-5 w-28" />

          <div className="mt-7">
            <LoginForm />
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] tracking-[0.18em] text-champagne/55">
          STUDIO LISO ESPELHADO · BEATRIZ RIBEIRO
        </p>
      </div>
    </div>
  );
}
