import { Hero } from "@/components/home/Hero";
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

  return (
    <>
      <Hero hero={settings.hero} site={settings.site} />
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
