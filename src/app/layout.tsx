import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/site/Header";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MobileCta } from "@/components/site/MobileCta";
import { getSiteSettings } from "@/lib/queries";

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

export function generateMetadata(): Metadata {
  const { seo, site } = getSiteSettings();
  const title = seo?.title || site?.name || "Studio Liso Espelhado";
  const description = seo?.description || site?.description || "";

  return {
    metadataBase: new URL("https://studiolisoespelhado.com.br"),
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
