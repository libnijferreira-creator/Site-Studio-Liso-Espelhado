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
 * Deixe VAZIO até gerar a tag. Enquanto estiver vazio, NENHUMA etiqueta é
 * emitida no HTML (não adianta colocar texto placeholder: o Google rejeita).
 *
 * Como gerar:
 *   1. https://search.google.com/search-console → Adicionar propriedade
 *   2. Prefixo de URL → http://147.15.117.149/
 *   3. Método "Etiqueta HTML" → copie só o valor de content="..."
 *   4. Cole entre as asas abaixo e faça o deploy
 */
const GOOGLE_SITE_VERIFICATION = "";

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
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: site?.name || "Studio Liso Espelhado",
      title,
      description,
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
