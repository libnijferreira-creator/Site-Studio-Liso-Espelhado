import { Hero } from "@/components/home/Hero";
import type { PromoAlertData } from "@/components/home/PromoAlert";
import { ServicesSection } from "@/components/home/ServicesSection";
import { PromotionsSection } from "@/components/home/PromotionsSection";
import { GallerySection } from "@/components/home/GallerySection";
import { ShowroomSection } from "@/components/home/ShowroomSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { AboutSection } from "@/components/home/AboutSection";
import { ContactSection } from "@/components/home/ContactSection";
import { CtaBanner } from "@/components/site/CtaBanner";
import { adminPhones } from "@/lib/notify";
import {
  getSiteSettings,
  listGallery,
  listPromotions,
  listServices,
  listTestimonials,
} from "@/lib/queries";

export default function HomePage() {
  const settings = getSiteSettings();
  const services = listServices(true);
  const promotions = listPromotions(true);
  const gallery = listGallery(true);
  const testimonials = listTestimonials(true);

  // Vitrine equilibrada: parte dos serviços de cabelo + parte dos de unha.
  const hair = services.filter((s) => s.track !== "nails");
  const nails = services.filter((s) => s.track === "nails");
  const showcase = [...hair.slice(0, 3), ...nails.slice(0, 3)];

  // Dados da aba de destaque (ícone de alerta de promoções) no hero.
  // Desconto = (valor cheio − valor promocional) / valor cheio.
  const promo: PromoAlertData | null =
    promotions.length > 0
      ? {
          count: promotions.length,
          maxDiscountPct: Math.max(
            0,
            ...promotions.map((p) =>
              p.original_price_cents > 0
                ? Math.round(
                    ((p.original_price_cents - p.promo_price_cents) /
                      p.original_price_cents) *
                      100
                  )
                : 0
            )
          ),
        }
      : null;

  return (
    <>
      <Hero hero={settings.hero} site={settings.site} promo={promo} />
      <ServicesSection
        services={showcase}
        feePercent={settings.fee.percent}
        showAll
      />
      <PromotionsSection
        promotions={promotions}
        services={services}
        feePercent={settings.fee.percent}
      />
      <GallerySection items={gallery} limit={6} />
      <ShowroomSection items={gallery} />
      <TestimonialsSection testimonials={testimonials} />
      <AboutSection about={settings.about} />
      <CtaBanner />
      <ContactSection
        site={settings.site}
        phones={adminPhones()}
        payment={settings.payment}
      />
    </>
  );
}
