/**
 * Camada de pagamento.
 *
 * - Com MERCADOPAGO_ACCESS_TOKEN definido, cria cobranças reais (PIX/cartão).
 * - Sem token, opera em MODO DEMONSTRAÇÃO: nenhum valor é cobrado e a
 *   confirmação é feita manualmente pela própria tela de pagamento.
 */

export const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || "";
export const MP_API = "https://api.mercadopago.com";

export const isSandbox = () => MP_TOKEN.length === 0;

export type Method = "pix" | "card";

export interface PaymentSession {
  mode: "mercadopago" | "sandbox";
  method: Method;
  amountCents: number;
  /** PIX copia e cola */
  payload?: string;
  /** QR Code em base64 (retrievado do Mercado Pago) */
  qrCodeBase64?: string;
  /** Link de pagamento (cartão) */
  checkoutUrl?: string;
  externalReference: string;
  expiresAt: string;
  notice: string;
}

async function mp(path: string, body: unknown, idempotencyKey: string) {
  const res = await fetch(`${MP_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason = data?.message || `HTTP ${res.status}`;
    throw new Error(`Mercado Pago: ${reason}`);
  }
  return data;
}

const sandboxNotice =
  "Ambiente de demonstração: nenhum valor será cobrado. Use o botão abaixo para simular a aprovação.";

export async function createPixCharge(params: {
  reference: string;
  amountCents: number;
  description: string;
  payer: { name: string; email?: string; cpf?: string };
}): Promise<PaymentSession> {
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  if (isSandbox()) {
    return {
      mode: "sandbox",
      method: "pix",
      amountCents: params.amountCents,
      payload: `00020126STUDIO-LISO-ESPPELHADO${params.reference}5204000053039865802BR5924STUDIO LISO ESPELHADO6009ITATIAIA62070503***6304A1B2`,
      externalReference: params.reference,
      expiresAt,
      notice: sandboxNotice,
    };
  }

  const payment = await mp(
    "/v1/payments",
    {
      transaction_amount: params.amountCents / 100,
      description: params.description,
      external_reference: params.reference,
      payment_method_id: "pix",
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/webhooks/mercadopago`,
      payer: {
        name: params.payer.name,
        email: params.payer.email || undefined,
        identification: params.payer.cpf
          ? { type: "CPF", number: params.payer.cpf }
          : undefined,
      },
    },
    `pix-${params.reference}`
  );

  const tx = payment?.point_of_interaction?.transaction_data;

  return {
    mode: "mercadopago",
    method: "pix",
    amountCents: params.amountCents,
    payload: tx?.qr_code,
    qrCodeBase64: tx?.qr_code_base64,
    externalReference: params.reference,
    expiresAt,
    notice:
      "Pague pelo QR Code ou pelo código copia e cola. A confirmação é automática.",
  };
}

export async function createCardCheckout(params: {
  reference: string;
  amountCents: number;
  description: string;
  payer: { name: string; email?: string; cpf?: string };
}): Promise<PaymentSession> {
  const expiresAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();

  if (isSandbox()) {
    return {
      mode: "sandbox",
      method: "card",
      amountCents: params.amountCents,
      checkoutUrl: "",
      externalReference: params.reference,
      expiresAt,
      notice: sandboxNotice,
    };
  }

  const preference = await mp(
    "/checkout/preferences",
    {
      items: [
        {
          id: params.reference,
          title: params.description,
          quantity: 1,
          unit_price: params.amountCents / 100,
          currency_id: "BRL",
        },
      ],
      external_reference: params.reference,
      payer: {
        name: params.payer.name,
        email: params.payer.email || undefined,
        identification: params.payer.cpf
          ? { type: "CPF", number: params.payer.cpf }
          : undefined,
      },
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }],
        installments: 12,
      },
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/agendar/confirmado`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/agendar/confirmado`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/agendar`,
      },
      auto_return: "approved",
    },
    `card-${params.reference}`
  );

  return {
    mode: "mercadopago",
    method: "card",
    amountCents: params.amountCents,
    checkoutUrl: preference.init_point,
    externalReference: params.reference,
    expiresAt,
    notice: "Pagamento processado com segurança pelo Mercado Pago.",
  };
}
