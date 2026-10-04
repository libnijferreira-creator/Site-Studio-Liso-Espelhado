import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/site-url";

// igual ao sitemap.xml: senão o Sitemap: aponta para a URL do build.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const BASE = siteBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
