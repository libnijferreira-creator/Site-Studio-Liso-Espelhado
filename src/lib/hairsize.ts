import { DEFAULT_SETTINGS } from "./defaults";
import type {
  HairSizeOption,
  HairSizesSettings,
  Service,
} from "./types";

/**
 * Tamanho do cabelo na hora do agendamento.
 *
 * Regra: os serviços de cabelo (`track: "hair"`) pedem o tamanho — exceto a
 * categoria "Sobrancelhas", que não depende do comprimento do fio. Serviços de
 * unha nunca pedem.
 *
 * Este arquivo é puro (não toca no banco) para poder ser importado pelo Client
 * Component do fluxo de agendamento; a leitura do setting fica na página/route.
 */

/** Opções padrão (mesmas do seed do banco). */
export function defaultHairSizes(): HairSizesSettings {
  const base = DEFAULT_SETTINGS.hairSizes as HairSizesSettings;
  return {
    enabled: base.enabled !== false,
    options: base.options.map((o) => ({ ...o })),
  };
}

/** Normaliza o que veio do banco — settings antigos/incompletos caem no padrão. */
export function normalizeHairSizes(raw: unknown): HairSizesSettings {
  const fallback = defaultHairSizes();
  if (!raw || typeof raw !== "object") return fallback;

  const obj = raw as Partial<HairSizesSettings>;
  const list = Array.isArray(obj.options) ? obj.options : [];
  const options = list
    .filter(
      (o): o is HairSizeOption =>
        !!o &&
        typeof o === "object" &&
        typeof o.id === "string" &&
        typeof o.label === "string"
    )
    .map((o) => ({
      id: o.id,
      label: o.label.trim() || "Tamanho",
      price_cents: Math.max(0, Math.round(Number(o.price_cents) || 0)),
    }));

  return {
    enabled: obj.enabled !== false,
    options: options.length ? options : fallback.options,
  };
}

/** Este serviço pede o tamanho do cabelo? */
export function sizeAppliesTo(service: Pick<Service, "track" | "category">): boolean {
  if ((service.track ?? "hair") !== "hair") return false;
  return service.category.trim().toLowerCase() !== "sobrancelhas";
}

/** Tamanhos disponíveis para um serviço (configuração + regra). */
export function optionsFor(
  settings: HairSizesSettings,
  service: Pick<Service, "track" | "category">
): HairSizeOption[] {
  if (!settings.enabled) return [];
  if (!sizeAppliesTo(service)) return [];
  return settings.options;
}

/**
 * Resolve o tamanho enviado pelo cliente.
 *
 * - serviço sem tamanho → `null` (nenhum acréscimo);
 * - id desconhecido ou ausente → primeiro tamanho (padrão "Curto", R$ 0).
 *
 * O valor SEMPRE vem do painel — o cliente não envia preço.
 */
export function resolveSize(
  settings: HairSizesSettings,
  service: Pick<Service, "track" | "category">,
  id?: string | null
): HairSizeOption | null {
  const options = optionsFor(settings, service);
  if (!options.length) return null;
  return options.find((o) => o.id === id) ?? options[0];
}
