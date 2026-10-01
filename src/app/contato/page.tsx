import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { ContactSection } from "@/components/home/ContactSection";
import { getSiteSettings } from "@/lib/queries";
import { adminPhones } from "@/lib/notify";

export function generateMetadata(): Metadata {
  return {
    title: "Contato",
    description:
      "WhatsApp, Instagram, endereço e horário de funcionamento do Studio Liso Espelhado com Beatriz Ribeiro.",
  };
}

export default function ContatoPage() {
  const { site, payment } = getSiteSettings();

  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Venha nos"
        highlight="visitar"
        description="Estamos disponíveis para tirar dúvidas, orientar sobre os procedimentos e receber você no Studio."
      />
      <ContactSection site={site} phones={adminPhones()} payment={payment} />
    </>
  );
}
