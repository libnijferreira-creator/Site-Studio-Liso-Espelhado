import Link from "next/link";
import { Logo } from "./Logo";

const NAV = [
  { href: "/servicos", label: "Serviços" },
  { href: "/promocoes", label: "Promoções" },
  { href: "/resultados", label: "Resultados" },
  { href: "/mostruario", label: "Mostruário" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
  { href: "/agendar", label: "Agendar" },
];

const LEGAL = [
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
  { href: "/termos-de-uso", label: "Termos de Uso" },
  { href: "/politica-de-agendamento", label: "Política de Agendamento" },
];

export function Footer({
  site,
}: {
  site: {
    name: string;
    whatsapp: string;
    whatsappLink: string;
    instagram: string;
    instagramLink: string;
    address: string;
    hours: string;
    email: string;
  };
}) {
  const year = new Date().getFullYear();
  const waDuvidas = site.whatsappLink
    ? `https://wa.me/${site.whatsappLink}?text=${encodeURIComponent(
        "Olá! Estou no site do Studio Liso Espelhado e fiquei com uma dúvida. Pode me ajudar?"
      )}`
    : null;

  return (
    <footer className="relative bg-ink text-champagne">
      <div className="container-site grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <Logo variant="vertical" tone="light" className="!items-start text-left" />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-champagne/70">
            {site.name} — onde beleza, cuidado e sofisticação se encontram.
          </p>
        </div>

        <nav className="md:col-span-2">
          <h3 className="mb-5 text-[10px] uppercase tracking-[0.32em] text-gold-soft">
            Navegação
          </h3>
          <ul className="space-y-3 text-sm text-champagne/75">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition-colors hover:text-gold-soft"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-3">
          <h3 className="mb-5 text-[10px] uppercase tracking-[0.32em] text-gold-soft">
            Contato
          </h3>
          <ul className="space-y-3 text-sm text-champagne/75">
            <li>
              {waDuvidas ? (
                <a
                  href={waDuvidas}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-gold-soft"
                >
                  Dúvidas? {site.whatsapp}
                </a>
              ) : (
                site.whatsapp
              )}
            </li>
            <li>
              {site.instagramLink ? (
                <a
                  href={site.instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-gold-soft"
                >
                  {site.instagram}
                </a>
              ) : (
                site.instagram
              )}
            </li>
            <li>{site.email}</li>
            <li className="leading-relaxed">{site.address}</li>
            <li className="leading-relaxed text-champagne/60">{site.hours}</li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <h3 className="mb-5 text-[10px] uppercase tracking-[0.32em] text-gold-soft">
            Pronto para o seu momento?
          </h3>
          <p className="mb-6 text-sm text-champagne/70">
            Agende online em menos de dois minutos e garanta o seu horário.
          </p>
          <Link href="/agendar" className="btn btn-gold w-full">
            Agendar agora
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-4 py-6 text-[11px] tracking-[0.12em] text-champagne/70 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {site.name}. Todos os direitos reservados.
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {LEGAL.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-gold-soft"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Acesso do dono do site ao painel — leva ao login. */}
            <Link
              href="/admin/login"
              className="border-l border-white/15 pl-6 uppercase tracking-[0.18em] text-champagne/45 transition-colors hover:text-gold-soft"
            >
              Painel
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
