import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/site-url";

// Sem isto, o Next trata sitemap.xml como rota estática e grava a URL do
// build (IP/domínio de quando o Docker image foi criado). `force-dynamic`
// faz a URL ser lida do ambiente a cada requisição.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const BASE = siteBaseUrl();
  const now = new Date();

  const routes = [
    { path: "", priority: 1, change: "weekly" as const },
    { path: "/servicos", priority: 0.9, change: "weekly" as const },
    { path: "/agendar", priority: 1, change: "daily" as const },
    { path: "/promocoes", priority: 0.8, change: "weekly" as const },
    { path: "/mostruario", priority: 0.8, change: "daily" as const },
    { path: "/resultados", priority: 0.7, change: "weekly" as const },
    { path: "/sobre", priority: 0.7, change: "monthly" as const },
    { path: "/contato", priority: 0.7, change: "monthly" as const },
    { path: "/politica-de-agendamento", priority: 0.4, change: "yearly" as const },
    { path: "/politica-de-privacidade", priority: 0.3, change: "yearly" as const },
    { path: "/termos-de-uso", priority: 0.3, change: "yearly" as const },
  ];

  return routes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.change,
    priority: r.priority,
  }));
}
