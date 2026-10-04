"use client";

import { useRef, useState } from "react";
import type { SiteSettings } from "@/lib/queries";
import { feeFor, formatBRL } from "@/lib/format";
import type { Schedule, WorkingHours } from "@/lib/types";
import {
  saveAboutAction,
  saveContactAction,
  saveFeeAction,
  saveHeroAction,
  saveHoursAction,
  saveNotificationsAction,
  savePaymentAction,
  saveSeoAction,
} from "./actions";

type Tab =
  | "contato"
  | "hero"
  | "sobre"
  | "seo"
  | "horarios"
  | "taxa"
  | "notificacoes"
  | "pagamento";

const TABS: { id: Tab; label: string }[] = [
  { id: "contato", label: "Contato" },
  { id: "hero", label: "Destaque" },
  { id: "sobre", label: "Sobre" },
  { id: "seo", label: "SEO" },
  { id: "horarios", label: "Horários" },
  { id: "taxa", label: "Taxa" },
  { id: "notificacoes", label: "Avisos" },
  { id: "pagamento", label: "Pagamento" },
];

const DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

function ImageField({
  name,
  value,
  label = "Imagem",
}: {
  name: string;
  value: string;
  label?: string;
}) {
  const [current, setCurrent] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (res.ok) setCurrent(data.url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="field-label">{label}</label>
      <input type="hidden" name={name} value={current} />
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-outline !px-5 !py-2.5 !text-[10px]"
          onClick={() => ref.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Enviando..." : "Enviar"}
        </button>
        <input
          className="field flex-1 !py-2.5 !text-[13px]"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="URL ou /uploads/arquivo.jpg"
        />
      </div>
      {current ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current} alt="Prévia" className="mt-3 h-28 w-44 border border-champagne object-cover" />
      ) : null}
    </div>
  );
}

/**
 * Aba "Taxa" — percentual da taxa de agendamento.
 * Componente separado porque o preview precisa de estado local (o form em si
 * é controlado pela ação do servidor).
 */
function FeeForm({ fee }: { fee: SiteSettings["fee"] }) {
  const [percent, setPercent] = useState(String(fee.percent));
  const numeric = Number.parseFloat(percent.replace(",", ".")) || 0;
  // R$ 390,00 = serviço de R$ 350,00 + acréscimo de R$ 40,00 (Longo)
  const exampleCents = 39000;

  return (
    <form action={saveFeeAction}>
      <Card
        title="Taxa de agendamento"
        hint="Percentual cobrado para reservar o horário. Sai daqui e vale para a home, Serviços, Promoções, o agendamento, os avisos e os e-mails."
      >
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="fee-percent">
                Percentual (%)
              </label>
              <input
                id="fee-percent"
                name="percent"
                className="field"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                inputMode="decimal"
                required
              />
              <p className="mt-2 text-[12.5px] leading-relaxed text-espresso-soft/75">
                Aceita vírgula ou ponto (ex.: 15 ou 12,5). De 0 a 100.
              </p>
            </div>

            <div>
              <label className="field-label" htmlFor="fee-label">
                Rótulo
              </label>
              <input
                id="fee-label"
                name="label"
                className="field"
                defaultValue={fee.label}
                placeholder="Taxa de agendamento"
              />
              <p className="mt-2 text-[12.5px] leading-relaxed text-espresso-soft/75">
                O nome da linha no resumo do agendamento.
              </p>
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="fee-note">
              Texto explicativo
            </label>
            <textarea
              id="fee-note"
              name="note"
              rows={3}
              className="field resize-y"
              defaultValue={fee.note}
            />
            <p className="mt-2 text-[12.5px] leading-relaxed text-espresso-soft/75">
              É o que a cliente lê na etapa de pagamento. Se mudar o
              percentual, atualize também o número escrito neste texto.
            </p>
          </div>

          <p className="border-l-2 border-gold/60 bg-offwhite px-4 py-3 text-[13px] leading-relaxed text-espresso-soft/75">
            Prévia com o valor digitado: serviço de{" "}
            {formatBRL(exampleCents)} + tamanho Longo → taxa de{" "}
            <strong>{numeric || 0}%</strong> ={" "}
            <strong className="text-gold-deep">
              {formatBRL(feeFor(exampleCents, numeric))}
            </strong>{" "}
            · restante {formatBRL(exampleCents - feeFor(exampleCents, numeric))}.
          </p>
        </div>
      </Card>
      <button type="submit" className="btn btn-gold">
        Salvar taxa
      </button>
    </form>
  );
}

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7 border border-champagne bg-white p-6 sm:p-7">
      <h2 className="text-[21px] leading-tight">{title}</h2>
      {hint ? <p className="mt-1 text-[13px] text-espresso-soft/75">{hint}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function ContentManager({
  settings,
  hours,
  schedule,
}: {
  settings: SiteSettings;
  hours: WorkingHours[];
  schedule: Schedule;
}) {
  const [tab, setTab] = useState<Tab>("contato");

  const hoursByDay = hours.reduce<Record<number, WorkingHours>>((acc, h) => {
    acc[h.weekday] = h;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-7">
        <p className="eyebrow mb-3">Textos, imagens e configurações</p>
        <h1 className="text-[36px] leading-tight sm:text-[44px]">Conteúdo do site</h1>
        <div className="rule-gold mt-5 w-32" />
        <p className="mt-4 max-w-2xl text-[14px] text-espresso-soft/80">
          Tudo o que aparece no site pode ser alterado aqui — sem tocar em código.
          As mudanças entram em vigor imediatamente.
        </p>
      </header>

      <div className="mb-7 flex flex-wrap gap-2 border-b border-champagne pb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] transition-all duration-300 ${
              tab === t.id
                ? "border-gold bg-gold/10 text-gold-deep"
                : "border-espresso/15 text-espresso-soft/75 hover:border-gold/60 hover:text-gold-deep"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------------------------- contato ---------------------------- */}
      {tab === "contato" ? (
        <form action={saveContactAction}>
          <Card title="Identidade" hint="Nome, assinatura e chamadas do site.">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="name">Nome do studio</label>
                <input id="name" name="name" className="field" defaultValue={settings.site.name} />
              </div>
              <div>
                <label className="field-label" htmlFor="signature">Assinatura</label>
                <input id="signature" name="signature" className="field" defaultValue={settings.site.signature} />
              </div>
              <div>
                <label className="field-label" htmlFor="headline">Chamada principal (Hero)</label>
                <input id="headline" name="headline" className="field" defaultValue={settings.site.headline} />
              </div>
              <div>
                <label className="field-label" htmlFor="tagline">Subtítulo</label>
                <input id="tagline" name="tagline" className="field" defaultValue={settings.site.tagline} />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="description-2">Descrição curta</label>
                <textarea id="description-2"
                  name="description"
                  className="field min-h-[80px]"
                  defaultValue={settings.site.description}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="ctaPrimary">Botão principal</label>
                <input id="ctaPrimary" name="ctaPrimary" className="field" defaultValue={settings.site.ctaPrimary} />
              </div>
              <div>
                <label className="field-label" htmlFor="ctaSecondary">Botão secundário</label>
                <input id="ctaSecondary" name="ctaSecondary" className="field" defaultValue={settings.site.ctaSecondary} />
              </div>
            </div>
          </Card>

          <Card title="Contato" hint="WhatsApp, Instagram, e-mail e endereço.">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="whatsapp">WhatsApp</label>
                <input id="whatsapp" name="whatsapp" className="field" defaultValue={settings.site.whatsapp} />
                <p className="mt-2 text-[12px] text-espresso-soft/75">
                  O link de atendimento é montado automaticamente (55 + número).
                </p>
              </div>
              <div>
                <label className="field-label" htmlFor="instagram">Instagram</label>
                <input id="instagram" name="instagram" className="field" defaultValue={settings.site.instagram} />
              </div>
              <div>
                <label className="field-label" htmlFor="instagramLink">Link do Instagram</label>
                <input id="instagramLink" name="instagramLink" className="field" defaultValue={settings.site.instagramLink} />
              </div>
              <div>
                <label className="field-label" htmlFor="email">E-mail</label>
                <input id="email" name="email" className="field" defaultValue={settings.site.email} />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="address">Endereço</label>
                <input id="address" name="address" className="field" defaultValue={settings.site.address} />
              </div>
              <div>
                <label className="field-label" htmlFor="mapsUrl">Link do Google Maps</label>
                <input id="mapsUrl" name="mapsUrl" className="field" defaultValue={settings.site.mapsUrl} />
              </div>
              <div>
                <label className="field-label" htmlFor="hours">Horário (texto exibido)</label>
                <input id="hours" name="hours" className="field" defaultValue={settings.site.hours} />
              </div>
            </div>
          </Card>

          <button type="submit" className="btn btn-gold">
            Salvar contato
          </button>
        </form>
      ) : null}

      {/* ------------------------------ hero ----------------------------- */}
      {tab === "hero" ? (
        <form action={saveHeroAction}>
          <Card title="Imagem de destaque" hint="Fundo da primeira tela do site.">
            <div className="grid gap-5">
              <div>
                <label className="field-label" htmlFor="eyebrow">Sobretítulo</label>
                <input id="eyebrow" name="eyebrow" className="field" defaultValue={settings.hero.eyebrow} />
              </div>
              <div>
                <label className="field-label" htmlFor="title-3">Título</label>
                <input id="title-3" name="title" className="field" defaultValue={settings.hero.title} />
              </div>
              <div>
                <label className="field-label" htmlFor="subtitle">Subtítulo</label>
                <textarea id="subtitle"
                  name="subtitle"
                  className="field min-h-[80px]"
                  defaultValue={settings.hero.subtitle}
                />
              </div>
              <ImageField name="image" value={settings.hero.image ?? ""} label="Foto de fundo" />
            </div>
          </Card>
          <button type="submit" className="btn btn-gold">
            Salvar destaque
          </button>
        </form>
      ) : null}

      {/* ------------------------------ sobre ---------------------------- */}
      {tab === "sobre" ? (
        <form action={saveAboutAction}>
          <Card title="Sobre Beatriz Ribeiro" hint="Textos exibidos na página Sobre.">
            <div className="grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="title-2">Título</label>
                  <input id="title-2" name="title" className="field" defaultValue={settings.about.title} />
                </div>
                <div>
                  <label className="field-label" htmlFor="role">Função</label>
                  <input id="role" name="role" className="field" defaultValue={settings.about.role} />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="story">História</label>
                <textarea id="story"
                  name="story"
                  className="field min-h-[140px]"
                  defaultValue={settings.about.story}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="philosophy">Filosofia</label>
                <textarea id="philosophy"
                  name="philosophy"
                  className="field min-h-[100px]"
                  defaultValue={settings.about.philosophy}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="specialties">Especialidades (uma por linha)</label>
                  <textarea id="specialties"
                    name="specialties"
                    className="field min-h-[120px]"
                    defaultValue={settings.about.specialties.join("\n")}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="credentials">Certificações (uma por linha)</label>
                  <textarea id="credentials"
                    name="credentials"
                    className="field min-h-[120px]"
                    defaultValue={settings.about.credentials.join("\n")}
                  />
                </div>
              </div>
              <ImageField name="photo" value={settings.about.photo ?? ""} label="Foto da Beatriz" />
            </div>
          </Card>
          <button type="submit" className="btn btn-gold">
            Salvar sobre
          </button>
        </form>
      ) : null}

      {/* -------------------------------- seo ---------------------------- */}
      {tab === "seo" ? (
        <form action={saveSeoAction}>
          <Card title="SEO" hint="Título e descrição usados no Google.">
            <div className="grid gap-5">
              <div>
                <label className="field-label" htmlFor="title">Título (title tag)</label>
                <input id="title" name="title" className="field" defaultValue={settings.seo.title} />
              </div>
              <div>
                <label className="field-label" htmlFor="description">Descrição</label>
                <textarea id="description"
                  name="description"
                  className="field min-h-[100px]"
                  defaultValue={settings.seo.description}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="keywords">Palavras-chave (uma por linha)</label>
                <textarea id="keywords"
                  name="keywords"
                  className="field min-h-[110px]"
                  defaultValue={settings.seo.keywords.join("\n")}
                />
              </div>
            </div>
          </Card>
          <button type="submit" className="btn btn-gold">
            Salvar SEO
          </button>
        </form>
      ) : null}

      {/* ----------------------------- horários -------------------------- */}
      {tab === "horarios" ? (
        <form action={saveHoursAction}>
          <Card
            title="Horários de funcionamento"
            hint="Definem quais dias e horários aparecem disponíveis no agendamento."
          >
            <div className="space-y-3">
              {[0, 1, 2, 3, 4, 5, 6].map((wd) => {
                const h = hoursByDay[wd];
                return (
                  <div
                    key={wd}
                    className="grid items-center gap-3 border-b border-champagne pb-3 sm:grid-cols-[120px_1fr_1fr_130px]"
                  >
                    <span className="text-[13.5px] font-medium">{DIAS[wd]}</span>
                    <input
                      type="time"
                      name={`open_${wd}`}
                      className="field !py-2"
                      defaultValue={h?.open_time ?? "09:00"}
                      disabled={h?.closed}
                    />
                    <input
                      type="time"
                      name={`close_${wd}`}
                      className="field !py-2"
                      defaultValue={h?.close_time ?? "18:00"}
                      disabled={h?.closed}
                    />
                    <label className="flex items-center gap-2 text-[12px] text-espresso-soft/75">
                      <input
                        type="checkbox"
                        name={`closed_${wd}`}
                        defaultChecked={Boolean(h?.closed)}
                        className="h-4 w-4 accent-[#b8955a]"
                      />
                      Fechado
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="mt-6">
              <label className="field-label" htmlFor="summary">Texto exibido no site</label>
              <input id="summary" name="summary" className="field" defaultValue={settings.site.hours} />
            </div>
          </Card>

          <Card
            title="Dia de unhas"
            hint="Neste dia atende-se apenas unhas (Nail Design, Tips, Gel e Manutenção). Marcado, nenhum horário de cabelo é oferecido."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="nailWeekday">
                  Dia da semana
                </label>
                <select
                  id="nailWeekday"
                  name="nailWeekday"
                  className="field"
                  defaultValue={String(schedule.nailWeekday)}
                >
                  {DIAS.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-3 self-end pb-2 text-[13.5px] text-espresso-soft/85">
                <input
                  type="checkbox"
                  name="hairBlockedOnNailDay"
                  defaultChecked={schedule.hairBlockedOnNailDay}
                  className="mt-1 h-4 w-4 accent-[#b8955a]"
                />
                Bloquear atendimento de cabelo neste dia
              </label>
            </div>

            <p className="mt-5 border-l-2 border-nude bg-offwhite px-4 py-3 text-[13px] leading-relaxed text-espresso-soft/75">
              Regra atual: serviços com tipo <strong>Unhas</strong> só aparecem
              na {DIAS[schedule.nailWeekday].toLowerCase()}, e serviços com tipo{" "}
              <strong>Cabelo</strong> não têm horários neste dia. O tipo de cada
              serviço é definido em <strong>Serviços</strong>.
            </p>
          </Card>

          <button type="submit" className="btn btn-gold">
            Salvar horários
          </button>
        </form>
      ) : null}

      {/* ------------------------------ taxa ----------------------------- */}
      {tab === "taxa" ? <FeeForm fee={settings.fee} /> : null}

      {/* --------------------------- notificações ------------------------ */}
      {tab === "notificacoes" ? (
        <form action={saveNotificationsAction}>
          <Card
            title="Avisos e confirmações"
            hint="Celulares que recebem a notificação de cada agendamento."
          >
            <div className="grid gap-5">
              <div>
                <label className="field-label" htmlFor="assistantName">
                  Secretária dos lembretes (nome)
                </label>
                <input
                  id="assistantName"
                  name="assistantName"
                  className="field"
                  defaultValue={
                    settings.notifications.assistantName || "Hadassa"
                  }
                  placeholder="Hadassa"
                />
                <p className="mt-2 text-[12.5px] leading-relaxed text-espresso-soft/75">
                  É quem se apresenta nos lembretes de pagamento enviados pela
                  aba <strong>Não confirmados</strong> da Agenda — o texto
                  sempre abre com{" "}
                  <em>“Oi! Aqui é a Secretária {settings.notifications.assistantName || "Hadassa"}…”</em>.
                </p>
              </div>

              <div>
                <label className="field-label" htmlFor="studioPhones">
                  Celulares do studio (avisos) — um por linha
                </label>
                <textarea id="studioPhones"
                  name="studioPhones"
                  rows={3}
                  className="field resize-y"
                  defaultValue={
                    settings.notifications.studioPhones
                      ? String(settings.notifications.studioPhones)
                      : settings.notifications.studioPhone
                  }
                  placeholder={"(24) 98153-1771\n(24) 99999-0000"}
                />
                <p className="mt-2 text-[12.5px] leading-relaxed text-espresso-soft/75">
                  A cada nova reserva e a cada pagamento aprovado o sistema
                  prepara a mensagem do agendamento para{" "}
                  <strong>todos os números acima</strong>. Os avisos ficam em
                  <a href="/admin/avisos" className="text-gold underline">
                    {" "}
                    Avisos
                  </a>{" "}
                  com o botão pronto para enviar no WhatsApp.
                </p>
              </div>

              <label className="flex items-start gap-3 text-[13.5px] text-espresso-soft/85">
                <input
                  type="checkbox"
                  name="studioEmailEnabled"
                  defaultChecked={settings.notifications.studioEmailEnabled}
                  className="mt-1 h-4 w-4 accent-[#b8955a]"
                />
                Enviar aviso ao studio a cada novo agendamento
              </label>

              <label className="flex items-start gap-3 text-[13.5px] text-espresso-soft/85">
                <input
                  type="checkbox"
                  name="clientEmailEnabled"
                  defaultChecked={settings.notifications.clientEmailEnabled}
                  className="mt-1 h-4 w-4 accent-[#b8955a]"
                />
                Enviar confirmação à cliente por e-mail
              </label>

              <p className="border-l-2 border-gold/60 bg-offwhite px-4 py-3 text-[13px] leading-relaxed text-espresso-soft/75">
                As confirmações de pagamento são recebidas automaticamente pelo
                Mercado Pago. Cada aviso já sai com o código, a cliente, a data,
                a taxa de {settings.fee.percent}% e o restante a cobrar no
                studio.
              </p>
            </div>
          </Card>
          <button type="submit" className="btn btn-gold">
            Salvar avisos
          </button>
        </form>
      ) : null}

      {/* --------------------------- pagamento -------------------------- */}
      {tab === "pagamento" ? (
        <form action={savePaymentAction}>
          <Card
            title="Pagamento — conta Nubank e PIX"
            hint="Dados que o cliente vê na etapa de pagamento do agendamento."
          >
            <div className="grid gap-5">
              <label className="flex items-start gap-3 text-[13.5px] text-espresso-soft/85">
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={settings.payment.enabled}
                  className="mt-1 h-4 w-4 accent-[#b8955a]"
                />
                Exibir a área de pagamento direto no agendamento
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="pay-pixKey">
                    Chave PIX
                  </label>
                  <input
                    id="pay-pixKey"
                    name="pixKey"
                    className="field"
                    defaultValue={settings.payment.pixKey || ""}
                    placeholder="CNPJ, telefone ou e-mail"
                  />
                  <p className="mt-2 text-[12.5px] leading-relaxed text-espresso-soft/75">
                    Pode ser o próprio CNPJ. É a chave que a cliente usa para
                    pagar a taxa.
                  </p>
                </div>

                <div>
                  <label className="field-label" htmlFor="pay-cnpj">
                    CNPJ
                  </label>
                  <input
                    id="pay-cnpj"
                    name="cnpj"
                    className="field"
                    defaultValue={settings.payment.cnpj || ""}
                    placeholder="53.362.957/0001-44"
                    inputMode="numeric"
                  />
                  <p className="mt-2 text-[12.5px] leading-relaxed text-espresso-soft/75">
                    Guardado como números e exibido formatado ao cliente.
                  </p>
                </div>

                <div>
                  <label className="field-label" htmlFor="pay-bank">
                    Banco / aplicativo
                  </label>
                  <input
                    id="pay-bank"
                    name="bank"
                    className="field"
                    defaultValue={settings.payment.bank || ""}
                    placeholder="Nubank"
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="pay-holder">
                    Titular / razão social
                  </label>
                  <input
                    id="pay-holder"
                    name="holder"
                    className="field"
                    defaultValue={settings.payment.holder || ""}
                    placeholder="Nome do titular da conta"
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="pay-agency">
                    Agência (opcional)
                  </label>
                  <input
                    id="pay-agency"
                    name="agency"
                    className="field"
                    defaultValue={settings.payment.agency || ""}
                    placeholder="0000"
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="pay-account">
                    Conta (opcional)
                  </label>
                  <input
                    id="pay-account"
                    name="account"
                    className="field"
                    defaultValue={settings.payment.account || ""}
                    placeholder="00000-0"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 text-[13.5px] text-espresso-soft/85">
                <input
                  type="checkbox"
                  name="pixEnabled"
                  defaultChecked={settings.payment.pixEnabled}
                  className="mt-1 h-4 w-4 accent-[#b8955a]"
                />
                Aceitar pagamento por <strong>PIX</strong> (mostrar a chave)
              </label>

              <p className="border-l-2 border-gold/60 bg-offwhite px-4 py-3 text-[13px] leading-relaxed text-espresso-soft/75">
                O site cobra <strong>somente por PIX</strong>: ou a cliente paga
                o valor integral do procedimento, ou paga só a taxa de
                agendamento. Pagamento com cartão foi removido do fluxo.
              </p>

              <p className="border-l-2 border-gold/60 bg-offwhite px-4 py-3 text-[13px] leading-relaxed text-espresso-soft/75">
                Pagou a cliente? Confirme em{" "}
                <a href="/admin/agenda" className="text-gold underline">
                  Agenda
                </a>{" "}
                → <strong>Confirmar pagamento</strong> para travar o horário e
                disparar a confirmação. O Mercado Pago continua disponível na
                etapa de pagamento para confirmação automática.
              </p>
            </div>
          </Card>
          <button type="submit" className="btn btn-gold">
            Salvar pagamento
          </button>
        </form>
      ) : null}
    </div>
  );
}
