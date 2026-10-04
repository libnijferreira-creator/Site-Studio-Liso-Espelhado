import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/queries";

/**
 * Manifest do PWA — é o que torna o site INSTALÁVEL (ícone no celular/PC).
 *
 * Nomes e descrição vêm das settings (Conteúdo → SEO/Contato) para seguirem
 * o que for editado no painel. Os ícones são gerados por scripts/make-icons.cjs.
 *
 * https://studiolisoespelhado.com.br/manifest.webmanifest
 */
export default function generateManifest(): MetadataRoute.Manifest {
  const settings = getSiteSettings();

  return {
    id: "/",
    name: `${settings.site.name} ${settings.site.signature}`.trim(),
    short_name: "Studio Liso",
    description: settings.seo.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    lang: "pt-BR",
    dir: "ltr",
    // Escuro igual ao topo do site e ao fundo do ícone.
    background_color: "#0b0908",
    theme_color: "#0b0908",
    categories: ["beauty", "lifestyle"],
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
