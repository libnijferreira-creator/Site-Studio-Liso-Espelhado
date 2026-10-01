"use client";

import { useState } from "react";

/**
 * Área de agendamento rápido: a cliente digita NOME e TELEFONE e o botão abre
 * o WhatsApp do Studio com a mensagem pronta, endereçada à Hadassa (secretária
 * virtual). É ela quem recebe e confirma o horário.
 */
export function HadassaForm({
  waNumber,
  tone = "dark",
}: {
  /** Número em dígitos com DDI, ex.: 5524981531771 */
  waNumber: string;
  tone?: "dark" | "light";
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const escuro = tone === "dark";
  const labelCls = escuro
    ? "mb-2 block text-[10px] uppercase tracking-[0.28em] text-gold-soft"
    : "field-label";

  function enviar(e: React.FormEvent) {
    e.preventDefault();

    const n = nome.trim();
    const t = telefone.trim();
    if (n.length < 2 || t.replace(/\D/g, "").length < 8) {
      setErro("Preencha o seu nome e um telefone válido com DDD.");
      setEnviado(false);
      return;
    }

    setErro(null);
    const mensagem =
      `Olá, Hadassa! Aqui é ${n} (${t}).\n` +
      "Quero agendar um horário no Studio Liso Espelhado com Beatriz Ribeiro.";
    window.open(
      `https://wa.me/${waNumber}?text=${encodeURIComponent(mensagem)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setEnviado(true);
  }

  return (
    <div
      className={`border p-6 sm:p-7 ${
        escuro ? "border-white/12 bg-white/[0.04]" : "border-champagne bg-white"
      }`}
    >
      <p className={labelCls}>Agendamento rápido</p>
      <h3 className="text-[24px] leading-tight">Fale com a Hadassa</h3>
      <p
        className={`mt-3 text-[13.5px] leading-relaxed ${
          escuro ? "text-champagne/75" : "text-espresso-soft/80"
        }`}
      >
        Sou a <strong className="text-gold-soft">Hadassa</strong>, secretária
        virtual do Studio. Deixe seu <strong>nome</strong> e{" "}
        <strong>telefone</strong> que eu abro o WhatsApp do Studio com a
        mensagem pronta — é só enviar que cuidamos do resto.
      </p>

      <form onSubmit={enviar} className="mt-5 space-y-4">
        <div>
          <label className={labelCls} htmlFor="hadassa-nome">
            Seu nome
          </label>
          <input
            id="hadassa-nome"
            name="nome"
            className="field"
            autoComplete="name"
            placeholder="Como podemos te chamar?"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="hadassa-telefone">
            Seu telefone
          </label>
          <input
            id="hadassa-telefone"
            name="telefone"
            type="tel"
            inputMode="tel"
            className="field"
            autoComplete="tel"
            placeholder="(24) 99999-9999"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-gold w-full sm:w-auto">
          Chamar no WhatsApp
        </button>

        {erro ? (
          <p
            role="alert"
            className={`text-[13px] ${escuro ? "text-[#ffc9c0]" : "text-red-700"}`}
          >
            {erro}
          </p>
        ) : null}
        {enviado && !erro ? (
          <p
            role="status"
            className={`text-[13px] ${escuro ? "text-gold-soft" : "text-gold-deep"}`}
          >
            Prontinho! Abri o WhatsApp do Studio com seu nome e telefone — é só
            enviar a mensagem.
          </p>
        ) : null}
      </form>
    </div>
  );
}
