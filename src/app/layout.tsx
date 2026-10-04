import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MobileCta } from "@/components/site/MobileCta";
import { getSiteSettings } from "@/lib/queries";
import { siteBaseUrl } from "@/lib/site-url";

const display = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

/**
 * GOOGLE SEARCH CONSOLE — verificação por etiqueta HTML.
 *
 * ⚠️ O token é POR PROPRIEDADE. O de outro domínio/prefixo dá erro
 * "Sua metatag está incorreta" mesmo estando no ar.
 * Propriedade: https://studiolisoespelhado.com.br/  (Prefixo do URL)
 * Método: Tag HTML — pego em Configurações → Verificação do proprietário.
 *
 * Enquanto estiver vazio, NENHUMA etiqueta é emitida no HTML (o Google
 * rejeita placeholder).
 */
const GOOGLE_SITE_VERIFICATION = "1ATs7xf_mXWQ-sAH6WG2p6vF4Vz1brHX_D-2u4eg-U0";

export function generateMetadata(): Metadata {
  const { seo, site } = getSiteSettings();
  const title = seo?.title || site?.name || "Studio Liso Espelhado";
  const description = seo?.description || site?.description || "";

  return {
    metadataBase: new URL(siteBaseUrl()),
    title: {
      default: title,
      template: "%s | Studio Liso Espelhado",
    },
    description,
    keywords: seo?.keywords,
    // "./" é resolvido contra a URL da página atual (resolveRelativeUrl),
    // então cada rota emite o PRÓPRIO canonical — nunca o da home.
    alternates: { canonical: "./" },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: site?.name || "Studio Liso Espelhado",
      title,
      description,
      // mesmo truque do canonical: vira a URL da rota atual
      url: "./",
    },
    robots: { index: true, follow: true },
    // só emite <meta name="google-site-verification"> se houver valor real
    ...(GOOGLE_SITE_VERIFICATION
      ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
      : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#0b0908",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const { site } = getSiteSettings();

  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${sans.variable} h-full`}
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col pb-[74px] lg:pb-0">
        <Header />
        <main className="flex-1">{children}</main>
        <SiteFooter site={site} />
        <MobileCta />
      </body>
    </html>
  );
}
