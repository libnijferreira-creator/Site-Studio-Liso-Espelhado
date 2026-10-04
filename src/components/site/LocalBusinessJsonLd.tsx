import { getSiteSettings, listServices, listWorkingHours } from "@/lib/queries";
import { siteBaseUrl } from "@/lib/site-url";

/**
 * Dados estruturados do salão — schema.org/BeautySalon.
 *
 * É o que faz o Google entender que isto é um ESTABELECIMENTO físico (e não
 * só um site), liberando o painel lateral "Sobre este local" com endereço,
 * horário, telefone e serviços com preço.
 *
 * Renderizado como <script type="application/ld+json"> direto no layout,
 * seguindo a doc do Next (docs/01-app/02-guides/json-ld.md) — inclui o
 * escape de "<" senão uma strings com esse caractere quebraria o JSON.
 *
 * ⚠️ aggregateRating (nota/estrelas) é propositalmente OMITIDA: a Google
 * ignora avaliação "auto servida" no próprio site e pode penalizar. A nota
 * 5,0 vem do Perfil da Empresa no Google, que é onde ela vale.
 */

/**
 * Coordenadas e CEP do endereço real (perfil do Google).
 * ATUALIZAR se o studio mudar de endereço.
 */
const GEO = { latitude: -22.486933, longitude: -44.572253 };
const CEP = "27580-000";

/** Cidades que o studio atende — regiões que disputamos no Google. */
const AREA = [
  "Itatiaia",
  "Penedo",
  "Resende",
  "Barra Mansa",
  "Volta Redonda",
  "Porto Real",
  "Pinheiral",
];

const WEEKDAY_ISO = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * 270 → "PT4H30M" (ISO 8601). É como o schema.org espera a duração, e é o
 * que faz o Google mostrar "4h30" ao lado do procedimento nos resultados.
 */
function isoDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `PT${m}M`;
  return m ? `PT${h}H${m}M` : `PT${h}H`;
}

/**
 * Separa a string de endereço ("Rua X, 100 — Bairro, Cidade/UF") nas
 * partes que o schema espera. Se algo mudar de formato, cai no valor cheio
 * em vez de quebrar.
 */
function splitAddress(raw: string): {
  street: string;
  district: string;
  locality: string;
  region: string;
} {
  const full = String(raw ?? "").trim();
  // Aceita travessão (—), en dash (–) ou hífen com espaços como separador.
  const [before, after] = full.split(/\s+[—–-]\s+/);
  const tail = (after ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const last = tail[tail.length - 1] ?? "";
  const [locality, region] = last.split("/").map((s) => s.trim());

  return {
    street: (before ?? full).trim(),
    district: tail.slice(0, -1).join(", "),
    locality: locality || "",
    region: region || "",
  };
}

export function LocalBusinessJsonLd() {
  const { site, seo } = getSiteSettings();
  const hours = listWorkingHours();
  const services = listServices(true);

  const addr = splitAddress(site.address);
  const base = siteBaseUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "@id": `${base}/#salao`,
    name: site.name,
    alternateName: site.signature,
    description: seo?.description || site.description,
    url: base,
    telephone: site.whatsapp,
    email: site.email,
    image: `${base}/icon-512x512.png`,
    logo: `${base}/icon-512x512.png`,
    sameAs: [site.instagramLink].filter(Boolean),
    priceRange: "R$",
    currenciesAccepted: "BRL",
    paymentAccepted: "PIX, Cartão de crédito, Dinheiro",
    slogan: site.tagline,
    hasMap: site.mapsUrl,
    areaServed: AREA.map((city) => ({ "@type": "City", name: city })),
    address: {
      "@type": "PostalAddress",
      streetAddress: addr.street,
      addressLocality: addr.locality,
      addressRegion: addr.region,
      postalCode: CEP,
      addressCountry: "BR",
      ...(addr.district ? { addressNeighborhood: addr.district } : {}),
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: GEO.latitude,
      longitude: GEO.longitude,
    },
    openingHoursSpecification: hours
      .filter((h) => !h.closed && h.open_time && h.close_time)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: WEEKDAY_ISO[h.weekday] ?? WEEKDAY_ISO[0],
        opens: h.open_time,
        closes: h.close_time,
      })),
    // Catálogo de procedimentos com preço — é o que alimenta as buscas por
    // "liso espelhado Itatiaia" com o valor direto nos resultados.
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Procedimentos",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: s.name,
          description: s.description || undefined,
          serviceType: s.category,
          // Duração do procedimento — vem do painel (Serviços → Duração).
          timeRequired: isoDuration(s.duration_min),
        },
        price: (s.price_cents / 100).toFixed(2),
        priceCurrency: "BRL",
        availability: "https://schema.org/InStock",
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
