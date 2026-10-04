export const DEFAULT_SETTINGS: Record<string, unknown> = {
  site: {
    name: "STUDIO LISO ESPELHADO",
    signature: "COM BEATRIZ RIBEIRO",
    headline: "Beleza, cuidado e um liso que reflete sua essência.",
    tagline: "Onde beleza, cuidado e sofisticação se encontram.",
    description:
      "Studio de beleza especializado em tratamentos capilares premium, com atendimento personalizado e resultados que falam por si.",
    whatsapp: "(24) 98153-1771",
    whatsappLink: "5524981531771",
    instagram: "@studio_liso_espelhado",
    instagramLink: "https://www.instagram.com/studio_liso_espelhado",
    email: "contato@studiolisoespelhado.com.br",
    address: "Rua Roberto Cotrim, 519 — Bairro Campo Alegre, Itatiaia/RJ",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rua+Roberto+Cotrim+519+Campo+Alegre+Itatiaia+RJ",
    hours: "Terça a sábado — 09h às 18h · Quartas-feiras: somente unhas",
    ctaPrimary: "AGENDAR MEU HORÁRIO",
    ctaSecondary: "CONHECER SERVIÇOS",
  },
  hero: {
    eyebrow: "BELEZA • CUIDADO • SOFISTICAÇÃO",
    title: "STUDIO LISO ESPELHADO",
    subtitle: "com Beatriz Ribeiro",
    image: null as string | null,
  },
  about: {
    title: "Beatriz Ribeiro",
    role: "Especialista em tratamentos capilares",
    photo: null as string | null,
    story:
      "Há mais de uma década dedicada à arte do liso, a Beatriz construiu uma técnica própria que une conhecimento técnico, cuidado e sensibilidade. Cada atendimento é conduzido de forma personalizada, respeitando a estrutura de cada fio e o resultado que cada cliente deseja alcançar.",
    philosophy:
      "Acredito que beleza é, acima de tudo, cuidado. Por isso, cada cliente recebe uma análise individual, um plano de tratamento honesto e um acompanhamento próximo do início ao fim.",
    specialties: [
      "Liso espelhado e tratamentos de selagem",
      "Reconstrução e restauração de fios",
      "Hidratação profunda e brilho",
      "Diagnóstico capilar personalizado",
    ],
    credentials: [
      "Formação em Tratamentos Capilares",
      "Certificação em Escova e Alisamento",
      "Atualização constante em técnicas premium",
    ],
  },
  seo: {
    title: "Studio Liso Espelhado com Beatriz Ribeiro | Agendamento Online",
    description:
      "Agende seu horário online no Studio Liso Espelhado com Beatriz Ribeiro. Tratamentos capilares premium, resultados sofisticados e confirmação imediata.",
    keywords: [
      "liso espelhado",
      "tratamento capilar",
      "salão de beleza",
      "agendamento online",
      "Beatriz Ribeiro",
    ],
  },
  fee: {
    percent: 15,
    label: "Taxa de agendamento",
    // Texto padrão da explicação da taxa. Se o percentual mudar, edite o
    // número aqui OU ajuste na aba Taxa do painel (o painel avisa disso).
    note: "A taxa de 15% garante a reserva do seu horário. O valor restante é tratado conforme a política comercial do Studio.",
  },
  notifications: {
    // Celulares que recebem o aviso de AGENDAMENTO e de PAGAMENTO (um por
    // linha). Editável no painel: Conteúdo → Avisos.
    studioPhone: "(24) 98153-1771",
    studioPhones: "(24) 98153-1771\n(24) 99875-1011",
    clientEmailEnabled: true,
    studioEmailEnabled: true,
    // Quem assina os lembretes de pagamento no Agenda → "Não confirmados".
    // O texto sempre se apresenta como "Secretária <nome>".
    assistantName: "Hadassa",
  },
  /**
   * Dados de recebimento do studio — conta Nubank, chave PIX e CNPJ.
   * Editável no painel: Conteúdo → Pagamento.
   * O cliente paga a taxa por PIX (chave exibida) ou com cartão pelo próprio
   * aplicativo do Nubank (juros e parcelas são os que o app calcular).
   */
  payment: {
    enabled: true,
    pixEnabled: true,
    // Chave PIX = CNPJ do studio (se a chave for outra, troque no painel).
    pixKey: "53362957000144",
    cardEnabled: true,
    cardLink: "",
    cardTerms:
      "Parcelamento e juros são calculados pelo próprio aplicativo do Nubank no momento do pagamento.",
    bank: "Nubank",
    agency: "",
    account: "",
    cnpj: "53362957000144",
    holder: "",
  },
  /**
   * Tamanho do cabelo — seleção oferecida na hora do agendamento dos serviços
   * de cabelo. Cada tamanho tem um acréscimo em reais somado ao valor do
   * serviço (e a taxa de 15% incide sobre o total). Os rótulos e valores são
   * editáveis no painel, em Serviços → Tamanho do cabelo.
   */
  hairSizes: {
    enabled: true,
    options: [
      { id: "curto", label: "Curto", price_cents: 0 },
      { id: "medio", label: "Médio", price_cents: 2000 },
      { id: "longo", label: "Longo", price_cents: 4000 },
    ],
  },
  /**
   * Regra de agenda: às quartas-feiras atende-se APENAS unhas,
   * e não há atendimento de cabelo neste dia.
   * nailWeekday: 0=domingo, 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta, 6=sábado
   */
  schedule: {
    nailWeekday: 3,
    nailWeekdayLabel: "quarta-feira",
    hairBlockedOnNailDay: true,
  },
};

export const DEFAULT_WORKING_HOURS = [
  { weekday: 0, open_time: "09:00", close_time: "18:00", closed: true },
  { weekday: 1, open_time: "09:00", close_time: "18:00", closed: true },
  { weekday: 2, open_time: "09:00", close_time: "18:00", closed: false },
  { weekday: 3, open_time: "09:00", close_time: "18:00", closed: false },
  { weekday: 4, open_time: "09:00", close_time: "18:00", closed: false },
  { weekday: 5, open_time: "09:00", close_time: "18:00", closed: false },
  { weekday: 6, open_time: "09:00", close_time: "18:00", closed: false },
];

/* --------------- tratamentos e serviços extras (catálogo completo) ------ */
export const EXTRA_SERVICES = [
  {
    name: "Botox Capilar com Formol",
    description:
      "Alisamento profundo com selagem de cutícula, controle de volume e brilho intenso para cabelos resistentes.",
    price_cents: 28000,
    duration_min: 150,
    category: "Alisamento",
    track: "hair" as const,
  },
  {
    name: "Botox Capilar Nanoplastia",
    description:
      "Nanoplastia nutritiva que alisa, disciplina e devolve maciez aos fios, com resultado duradouro e toque leve.",
    price_cents: 32000,
    duration_min: 180,
    category: "Alisamento",
    track: "hair" as const,
  },
  {
    name: "Progressiva sem Formol",
    description:
      "Alisamento sem formol para quem quer fios lisos, soltos e com movimento natural, respeitando a estrutura do cabelo.",
    price_cents: 28000,
    duration_min: 150,
    category: "Alisamento",
    track: "hair" as const,
  },
  {
    name: "Progressiva com Formol",
    description:
      "Progressiva clássica de longa duração: elimina o frizz, alisa de verdade e mantém o resultado por meses.",
    price_cents: 25000,
    duration_min: 150,
    category: "Alisamento",
    track: "hair" as const,
  },
  {
    name: "Lifting Capilar",
    description:
      "Levante de raiz com efeito modelador: volume controlado, disciplina e acabamento elegante que valoriza o corte.",
    price_cents: 24000,
    duration_min: 120,
    category: "Alisamento",
    track: "hair" as const,
  },
  {
    name: "Blindagem Capilar",
    description:
      "Blindagem que sela a cutícula, protege a cor e devolve o brilho espelhado com longa duração.",
    price_cents: 18000,
    duration_min: 90,
    category: "Tratamentos",
    track: "hair" as const,
  },
  {
    name: "Cronograma Capilar Ampola",
    description:
      "Protocolo com ampola concentrada: nutrição, força e brilho em uma única sessão.",
    price_cents: 13000,
    duration_min: 60,
    category: "Cronograma",
    track: "hair" as const,
  },
  {
    name: "Cronograma Capilar Máscara Personalizada",
    description:
      "Máscara montada conforme a necessidade do seu fio: hidratação, reconstrução ou nutrição na medida certa.",
    price_cents: 15000,
    duration_min: 60,
    category: "Cronograma",
    track: "hair" as const,
  },
  {
    name: "Cronograma Capilar Premium",
    description:
      "Cronograma completo com diagnóstico, tratamento em etapas e finalização profissional.",
    price_cents: 22000,
    duration_min: 90,
    category: "Cronograma",
    track: "hair" as const,
  },
  {
    name: "Cronograma Capilar Crescimento",
    description:
      "Protocolo de fortalecimento para estimular o crescimento saudável e reduzir a quebra dos fios.",
    price_cents: 17000,
    duration_min: 60,
    category: "Cronograma",
    track: "hair" as const,
  },
  {
    name: "Tratamento Regeneração SPA",
    description:
      "Ritual SPA capilar com massagem, vapor e ativos regeneradores: relaxamento e reparação em um só momento.",
    price_cents: 20000,
    duration_min: 90,
    category: "Tratamentos",
    track: "hair" as const,
  },
  {
    name: "Tratamento Plex",
    description:
      "Tecnologia Plex que reconstrói as pontes internas do fio: força, elasticidade e proteção durante químicas.",
    price_cents: 15000,
    duration_min: 60,
    category: "Tratamentos",
    track: "hair" as const,
  },
  {
    name: "Escova Comum",
    description:
      "Escova clássica com finalização cuidadosa, ideal para um visual liso e arrumado no dia a dia.",
    price_cents: 7000,
    duration_min: 45,
    category: "Escovagem",
    track: "hair" as const,
  },
  {
    name: "Escova com Tratamento",
    description:
      "Escova finalizada com tratamento escolhido para o seu fio: liso, brilho e proteção ao mesmo tempo.",
    price_cents: 11000,
    duration_min: 60,
    category: "Escovagem",
    track: "hair" as const,
  },
  {
    name: "Higienização Capilar",
    description:
      "Lavagem profissional com esfoliação do couro cabeludo, massagem relaxante e secagem leve.",
    price_cents: 12000,
    duration_min: 60,
    category: "Cuidados",
    track: "hair" as const,
  },
  {
    name: "Coloração",
    description:
      "Coloração completa com tonalização uniforme, cobertura de brancos e brilho intenso.",
    price_cents: 25000,
    duration_min: 150,
    category: "Coloração",
    track: "hair" as const,
  },
  {
    name: "Reset Capilar Limpeza Profunda",
    description:
      "Reset capilar: remove resíduos de produto e minerais, deixando o fio leve e pronto para o tratamento.",
    price_cents: 14000,
    duration_min: 60,
    category: "Tratamentos",
    track: "hair" as const,
  },
  {
    name: "Matização Blond Refresh",
    description:
      "Matização para loiros e reflexos: elimina os amarelos, uniformiza o tom e devolve a luminosidade.",
    price_cents: 19000,
    duration_min: 90,
    category: "Coloração",
    track: "hair" as const,
  },
  {
    name: "Design de Sobrancelhas",
    description:
      "Design de sobrancelhas com harmonização do formato, pinçamento e acabamento preciso.",
    price_cents: 6000,
    duration_min: 30,
    category: "Sobrancelhas",
    track: "hair" as const,
  },
];

export const DEFAULT_SERVICES = [
  {
    name: "Liso Espelhado Premium",
    description:
      "Alisamento profundo com brilho espelhado e kit home care incluso com 37% de desconto. Procedimento assinatura do Studio: resultado imediato, queda controlada e brilho que dura por meses.",
    price_cents: 35000,
    duration_min: 180,
    category: "Liso",
    track: "hair" as const,
  },
  {
    name: "Liso Espelhado + Tratamento",
    description:
      "Combinação do nosso procedimento premium com tratamento de reconstrução para fios mais resistentes, macios e luminosos.",
    price_cents: 42000,
    duration_min: 210,
    category: "Liso",
    track: "hair" as const,
  },
  {
    name: "Alisamento + Home Care incluso",
    description:
      "Alisamento completo com um kit home care incluso para você prolongar o resultado em casa. Fios lisos, hidratados e com brilho espelhado desde a primeira semana — sem precisar voltar tão cedo.",
    price_cents: 34000,
    duration_min: 270,
    category: "Alisamento",
    track: "hair" as const,
  },
  {
    name: "Selagem de Brilho",
    description:
      "Selagem leve que sela cutícula, controla o volume e devolve o brilho espelhado sem pesar nos fios.",
    price_cents: 28000,
    duration_min: 120,
    category: "Tratamentos",
    track: "hair" as const,
  },
  {
    name: "Reconstrução Capilar",
    description:
      "Protocolo de reconstrução para cabelos quimicamente tratados, devolvendo massa, resistência e elasticidade aos fios.",
    price_cents: 24000,
    duration_min: 90,
    category: "Tratamentos",
    track: "hair" as const,
  },
  {
    name: "Hidratação Profunda",
    description:
      "Hidratação intensiva com ativos selecionados, ideal para manter o resultado do liso entre os atendimentos.",
    price_cents: 15000,
    duration_min: 60,
    category: "Cuidados",
    track: "hair" as const,
  },
  {
    name: "Diagnóstico e Consultoria Capilar",
    description:
      "Análise completa do seu cabelo com plano de tratamento personalizado e orientação de manutenção em casa.",
    price_cents: 9000,
    duration_min: 45,
    category: "Consultoria",
    track: "hair" as const,
  },

  ...EXTRA_SERVICES,

  /* --------------------------- unhas (quartas-feiras) ------------------- */
  {
    name: "Nail Design",
    description:
      "Design completo de unhas com esmaltação, arte personalizada e acabamento impecável. Atenção: atendimento de unhas somente às quartas-feiras.",
    price_cents: 12000,
    duration_min: 60,
    category: "Unhas",
    track: "nails" as const,
  },
  {
    name: "Tips",
    description:
      "Alongamento de unhas em tips com aplicação precisa, formato uniforme e curvatura natural. Atenção: atendimento de unhas somente às quartas-feiras.",
    price_cents: 18000,
    duration_min: 90,
    category: "Unhas",
    track: "nails" as const,
  },
  {
    name: "Gel",
    description:
      "Unhas de gel com fortalecimento, brilho duradouro e resistência no dia a dia. Atenção: atendimento de unhas somente às quartas-feiras.",
    price_cents: 9000,
    duration_min: 60,
    category: "Unhas",
    track: "nails" as const,
  },
  {
    name: "Manutenção de Unha",
    description:
      "Manutenção dos alongamentos e do design, com correção de estrutura e nova esmaltação. Atenção: atendimento de unhas somente às quartas-feiras.",
    price_cents: 7000,
    duration_min: 45,
    category: "Unhas",
    track: "nails" as const,
  },
];

export const DEFAULT_PROMOTIONS = [
  {
    title: "Liso Espelhado + Tratamento de Brilho",
    description:
      "Nosso procedimento completo com tratamento exclusivo de brilho para um resultado impecável.",
    original_price_cents: 45000,
    promo_price_cents: 34900,
    start_date: null as string | null,
    end_date: null as string | null,
    cta_label: "APROVEITAR PROMOÇÃO",
  },
  {
    title: "Primeira Cliente — Diagnóstico + Hidratação",
    description:
      "Conheça o Studio com um diagnóstico completo e uma hidratação profunda com valor especial de boas-vindas.",
    original_price_cents: 24000,
    promo_price_cents: 16900,
    start_date: null as string | null,
    end_date: null as string | null,
    cta_label: "APROVEITAR PROMOÇÃO",
  },
];

export const DEFAULT_GALLERY = [
  { title: "Liso Espelhado Premium", caption: "Resultado de brilho espelhado", kind: "trabalho", media_type: "image" },
  { title: "Antes e depois", caption: "Reconstrução completa", kind: "antes-depois", media_type: "image" },
  { title: "Vídeo: rotina de finalização", caption: "Assista ao passo a passo", kind: "trabalho", media_type: "video" },
  { title: "Selagem de brilho", caption: "Controle de volume", kind: "trabalho", media_type: "image" },
  { title: "O Studio", caption: "Ambiente preparado para você", kind: "studio", media_type: "image" },
  { title: "Resultado da cliente", caption: "Manutenção mensal", kind: "cliente", media_type: "image" },
  { title: "Hidratação profunda", caption: "Maciez e luminosidade", kind: "trabalho", media_type: "image" },
];

export const DEFAULT_TESTIMONIALS = [
  {
    name: "Mariana Alves",
    text: "Meu cabelo nunca ficou tão liso e com um brilho que parece de propaganda. O atendimento da Beatriz é cuidadoso do começo ao fim.",
    rating: 5,
    date: null as string | null,
  },
  {
    name: "Juliana Prado",
    text: "Ambiente impecável e resultado imediato. Agendei pelo site em menos de dois minutos e recebi a confirmação na hora.",
    rating: 5,
    date: null as string | null,
  },
  {
    name: "Camila Ferreira",
    text: "A reconstrução salvou meus fios depois de anos de química. Transparência total sobre valores e cuidados.",
    rating: 5,
    date: null as string | null,
  },
];
