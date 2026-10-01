import Link from "next/link";
import { HadassaForm } from "@/components/site/HadassaForm";
import { Reveal } from "@/components/site/Reveal";
import { Section, SectionHeading } from "@/components/site/Section";
import { formatCNPJ } from "@/lib/format";

/** "(24) 98153-1771" → "5524981531771" (pronto para wa.me). */
function waDigits(display: string): string {
  const digits = String(display || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

export function ContactSection({
  site,
  phones = [],
  payment = null,
}: {
  site: {
    whatsapp: string;
    whatsappLink: string;
    instagram: string;
    instagramLink: string;
    email: string;
    address: string;
    mapsUrl: string;
    hours: string;
  };
  /** Celulares cadastrados no painel (Conteúdo → Avisos) — todos aparecem. */
  phones?: string[];
  /** Dados de recebimento (chave PIX) — painel → Conteúdo → Pagamento. */
  payment?: {
    enabled: boolean;
    pixEnabled: boolean;
    pixKey: string;
    bank?: string;
  } | null;
}) {
  const whats = (phones.length ? phones : [site.whatsapp]).filter(Boolean);
  const waPrincipal = waDigits(site.whatsappLink) || waDigits(whats[0]);

  // Chave PIX cadastrada (formatada quando é um CNPJ).
  const pixDigits = (payment?.pixKey || "").replace(/\D/g, "");
  const pixValue =
    pixDigits.length === 14 ? formatCNPJ(pixDigits) : payment?.pixKey || "";

  const info = [
    ...whats.map((p, i) => ({
      label: i === 0 ? "WhatsApp" : "WhatsApp 2",
      value: p,
      href: `https://wa.me/${waDigits(p)}`,
    })),
    ...(payment?.enabled && payment.pixEnabled && pixValue
      ? [
          {
            label: `Chave PIX${payment.bank ? ` · ${payment.bank}` : ""}`,
            value: pixValue,
            href: null as string | null,
          },
        ]
      : []),
    { label: "Instagram", value: site.instagram, href: site.instagramLink },
    { label: "E-mail", value: site.email, href: `mailto:${site.email}` },
    { label: "Endereço", value: site.address, href: site.mapsUrl },
    { label: "Horário", value: site.hours, href: null as string | null },
  ];

  return (
    <Section id="contato" tone="dark">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <SectionHeading
            eyebrow="Fale conosco"
            title="Estamos aqui para"
            highlight="receber você"
            description="Tire suas dúvidas, converse com a Beatriz ou agende direto pelo site — a qualquer hora."
            align="left"
            tone="light"
          />

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${waPrincipal}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold"
            >
              Falar no WhatsApp
            </a>
            <Link href="/agendar" className="btn btn-ghost-light">
              Agendar agora
            </Link>
          </div>

          <p className="mt-6 text-[13.5px] leading-relaxed text-champagne/70">
            Dúvidas sobre valores, dia de unhas ou pagamento? Chame no
            WhatsApp — a <strong className="text-gold-soft">Hadassa</strong>,
            nossa secretária virtual, direciona sua mensagem para os celulares
            cadastrados do Studio.
          </p>

          <div className="mt-8">
            <HadassaForm waNumber={waPrincipal} tone="dark" />
          </div>
        </Reveal>

        <Reveal delay={120} className="lg:col-span-7">
          <dl className="divide-y divide-white/10 border-y border-white/10">
            {info.map((item) => (
              <div key={item.label} className="grid gap-1 py-5 sm:grid-cols-3 sm:gap-6">
                <dt className="text-[10px] uppercase tracking-[0.28em] text-gold-soft">
                  {item.label}
                </dt>
                <dd className="sm:col-span-2">
                  {item.href ? (
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="text-[15.5px] text-champagne/85 transition-colors hover:text-gold-soft"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span className="text-[15.5px] text-champagne/85">{item.value}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <a
            href={site.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 block overflow-hidden border border-white/12"
          >
            <div className="relative flex h-52 items-center justify-center bg-gradient-to-br from-espresso to-ink transition-transform duration-700 group-hover:scale-[1.01]">
              <div className="text-center">
                <p className="font-display text-[26px] text-champagne">{site.address}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-gold-soft">
                  abrir no mapa
                </p>
              </div>
            </div>
          </a>
        </Reveal>
      </div>
    </Section>
  );
}
