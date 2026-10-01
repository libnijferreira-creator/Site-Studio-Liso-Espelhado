import type { Metadata } from "next";
import { listTestimonials } from "@/lib/queries";
import { TestimonialsManager } from "./TestimonialsManager";

export const metadata: Metadata = {
  title: "Depoimentos",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminDepoimentosPage() {
  return <TestimonialsManager items={listTestimonials()} />;
}
