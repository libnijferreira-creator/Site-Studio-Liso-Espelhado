export type Status = "active" | "inactive";

export type ServiceTrack = "hair" | "nails";

export interface Service {
  id: number;
  name: string;
  description: string;
  price_cents: number;
  duration_min: number;
  image: string | null;
  category: string;
  track: ServiceTrack;
  status: Status;
  sort_order: number;
}

export interface Client {
  id: number;
  name: string;
  whatsapp: string;
  email: string | null;
  cpf: string | null;
  created_at: string;
}

export type AppointmentStatus =
  | "pending"
  | "approved"
  | "confirmed"
  | "cancelled"
  | "completed";

export type PaymentStatus =
  | "pending"
  | "waiting"
  | "paid"
  | "failed"
  | "refunded";

export interface Appointment {
  id: number;
  code: string;
  client_id: number;
  service_id: number;
  date: string;
  time: string;
  total_cents: number;
  fee_cents: number;
  remainder_cents: number;
  /** Tamanho do cabelo escolhido no agendamento (rótulo gravado na reserva). */
  hair_size: string | null;
  /** Acréscimo cobrado pelo tamanho, em centavos (já somado ao total). */
  hair_size_cents: number;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface AppointmentWithRelations extends Appointment {
  client_name: string;
  client_whatsapp: string;
  client_email: string | null;
  service_name: string;
  service_duration_min: number;
  service_track: ServiceTrack;
}

export interface Block {
  id: number;
  date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

export interface Promotion {
  id: number;
  title: string;
  description: string;
  image: string | null;
  original_price_cents: number;
  promo_price_cents: number;
  start_date: string | null;
  end_date: string | null;
  cta_label: string;
  service_id: number | null;
  active: Status;
  sort_order: number;
}

export type GalleryKind = "antes-depois" | "trabalho" | "studio" | "cliente";

export type MediaType = "image" | "video";

export interface GalleryItem {
  id: number;
  title: string;
  caption: string | null;
  image: string | null;
  video_url: string | null;
  media_type: MediaType;
  kind: GalleryKind;
  active: Status;
  sort_order: number;
}

export interface Testimonial {
  id: number;
  name: string;
  photo: string | null;
  text: string;
  rating: number;
  date: string | null;
  active: Status;
  sort_order: number;
}

export interface WorkingHours {
  weekday: number;
  open_time: string;
  close_time: string;
  closed: boolean;
}

/** Regra de agenda: dia dedicado às unhas (sem atendimento de cabelo). */
export interface Schedule {
  nailWeekday: number;
  nailWeekdayLabel: string;
  hairBlockedOnNailDay: boolean;
}

/**
 * Tamanho do cabelo escolhido na hora do agendamento.
 * `price_cents` é o acréscimo somado ao valor do serviço (Curto = 0).
 */
export interface HairSizeOption {
  id: string;
  label: string;
  price_cents: number;
}

/** Configuração da seleção de tamanho (editável no painel → Serviços). */
export interface HairSizesSettings {
  enabled: boolean;
  options: HairSizeOption[];
}

/**
 * Dados para pagamento cadastrados no painel (Conteúdo → Pagamento).
 * O studio recebe por PIX e/ou cartão (juros e parcelas calculados
 * pelo próprio aplicativo do Nubank).
 */
export interface PaymentSettings {
  /** Mostra a área de pagamento direto na etapa de pagamento. */
  enabled: boolean;
  /** Aceita pagamento por PIX (chave exibida ao cliente). */
  pixEnabled: boolean;
  /** Chave PIX do studio (pode ser o CNPJ). */
  pixKey: string;
  /** Aceita pagamento com cartão via aplicativo do Nubank. */
  cardEnabled: boolean;
  /** Link de pagamento do cartão (opcional — colar quando o studio tiver). */
  cardLink?: string;
  /** Texto sobre juros/parcelas — vem do aplicativo do Nubank. */
  cardTerms?: string;
  /** Ex.: "Nubank". */
  bank: string;
  /** Agência (opcional, exibida ao cliente). */
  agency?: string;
  /** Conta (opcional, exibida ao cliente). */
  account?: string;
  /** CNPJ do studio. */
  cnpj: string;
  /** Titular da conta / razão social. */
  holder: string;
}

/** Avisos ao studio — celulares cadastrados no painel (Conteúdo → Avisos). */
export interface NotificationsSettings {
  /** Campo legado (um número). */
  studioPhone: string;
  /** Novo: um ou vários celulares, separados por vírgula/quebra de linha. */
  studioPhones?: string | string[];
  clientEmailEnabled: boolean;
  studioEmailEnabled: boolean;
}
