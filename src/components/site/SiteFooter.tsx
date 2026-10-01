"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

export function SiteFooter({ site }: { site: Parameters<typeof Footer>[0]["site"] }) {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/admin")) return null;
  return <Footer site={site} />;
}
