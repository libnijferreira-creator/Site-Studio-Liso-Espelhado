# REGISTRO DA ENTREGA — Studio Liso Espelhado com Beatriz Ribeiro

> Documento de acompanhamento. Salvo para que o trabalho possa ser retomado
> em qualquer momento, mesmo com reinício da máquina ou interrupção.
> Projeto: `C:\Users\Empreendedores\Desktop\studio-liso`

---

## 1. Ambiente (como rodar)

| Item | Valor |
|---|---|
| Node.js | 24.19 — `%LOCALAPPDATA%\Programs\nodejs` |
| npm/npx | wrappers `npm.cmd` / `npx.cmd` criados (o zip oficial não trazia) |
| Comando | `$env:Path = "$env:Path;$env:LOCALAPPDATA\Programs\nodejs"` |
| Dev | `npm run dev` → http://localhost:3000 |
| Build | `npm run build` → `npm start` |
| Banco | `data/studio.db` (SQLite nativo `node:sqlite`, zero deps nativas) |
| Login painel | `admin` / `studio2026` (`ADMIN_USER` / `ADMIN_PASSWORD`) |

---

## 1. Decisões técnicas

| Tema | Decisão |
|---|---|
| Stack | Next.js 16.3.7 (App Router, Turbopack) + SQLite |
| Dinheiro | sempre em **centavos** (inteiros), exibido em pt-BR |
| Taxa 15% | `taxa = valor × 0,15` — **calculada, nunca digitada** |
| Fontes | Cormorant Garamond (títulos) + Jost (corpo) via `next/font` |
| Design system | Tailwind v4 — tokens em `@theme`, estilos em `@layer base/components` |
| Pagamento | Mercado Pago (PIX + cartão); **sem token = modo demonstração** |
| Imagens | painel envia → `/uploads/`; sem foto → artes editoriais `/art/*.svg` |
| Logo | monograma **BR** (Beatriz Ribeiro) em losango |

### Regras de agenda
- Funcionamento: **terça a sábado, 09:00–18:00**; domingo e segunda fechado
- **DIA DE UNHA: somente quarta-feira** — e às quartas **não há atendimento de
  cabelo** (regra `schedule` nas settings, editável no banco)
- Grade em passos de 30 min, respeitando a duração de cada serviço
- Horário do passado de hoje descartado + 1 h de antecedência mínima
- Reserva pendente **segura o slot por 30 min**
- Slot é **travado só após pagamento aprovado** (`status = confirmed`)
- Status: `pending → approved → confirmed → completed` / `cancelled`

### Trilhas de serviço (`services.track`)
| Valor | Significado | Dias |
|---|---|---|
| `hair` | Cabelo | terça a sábado, **exceto quarta** |
| `nails` | Unhas | **somente quarta-feira** |

Tabela inicial de unhas (preços editáveis no painel → Serviços):

| Serviço | Valor | Duração |
|---|---|---|
| Nail Design | R$ 120,00 | 60 min |
| Tips | R$ 180,00 | 90 min |
| Gel | R$ 90,00 | 60 min |
| Manutenção de Unha | R$ 70,00 | 45 min |

---

## 2. O que foi construído

### Site público
- `/` — hero, serviços, promoções, **mostruário**, depoimentos, sobre, contato
- `/servicos` · `/promocoes` · `/resultados` · `/mostruario` · `/sobre` · `/contato`
- `/agendar` — **fluxo de 7 etapas**
- `/politica-de-privacidade` · `/termos-de-uso` · `/politica-de-agendamento`
- `sitemap.xml` · `robots.txt` · favicon · metadados por página
- Responsivo + botão fixo "Agendar agora" no celular
- Cabeçalho fixo com menu mobile em tela cheia

### Catálogo de serviços — 29 serviços, tudo editável no painel

**6 procedimentos assinatura:** Liso Espelhado Premium · Liso Espelhado +
Tratamento · Selagem de Brilho · Reconstrução Capilar · Hidratação Profunda ·
Diagnóstico e Consultoria Capilar

**19 serviços acrescentados (com valores de referência, editáveis):**

| Categoria | Serviços | Valores |
|---|---|---|
| Alisamento | Botox Capilar com Formol · Botox Capilar Nanoplastia · Progressiva sem Formol · Progressiva com Formol · Lifting Capilar | R$ 240 – R$ 320 |
| Cronograma | Cronograma Capilar Ampola · Máscara Personalizada · Premium · Crescimento | R$ 130 – R$ 220 |
| Tratamentos | Blindagem Capilar · Regeneração SPA · Tratamento Plex · Reset Capilar Limpeza Profunda | R$ 140 – R$ 200 |
| Escovagem | Escova Comum · Escova com Tratamento | R$ 70 – R$ 110 |
| Coloração | Coloração · Matização Blond Refresh | R$ 190 – R$ 250 |
| Cuidados | Higienização Capilar | R$ 120 |
| Sobrancelhas | Design de Sobrancelhas | R$ 60 |

**4 serviços de unha:** Nail Design · Tips · Gel · Manutenção (quartas-feiras)

- **Tudo editável pelo painel** (`/admin/servicos`): nome, valor, duração,
  categoria, descrição, imagem, tipo (cabelo/unhas) e ativar/ocultar —
  alteração salva aparece no site na hora.
- A **taxa de 15%** é calculada automaticamente sobre qualquer valor (não
  precisa cadastrar).
- Tipos `cabelo` seguem a regra da quarta (inclusive Design de Sobrancelhas);
  serviços `unhas` são os das quartas-feiras.
- Os valores do banco são os de referência da entrega — **a Beatriz altera
  pelo próprio login** quando quiser.

### Tamanho do cabelo na etapa 1 do agendamento

Seleção oferecida quando a cliente escolhe um **serviço de cabelo**:

| Tamanho | Acréscimo padrão (editável) |
|---|---|
| Curto | R$ 0,00 (sem acréscimo) |
| Médio | R$ 20,00 |
| Longo | R$ 40,00 |
| Extra Longo | R$ 60,00 |

- **Editável no painel** → **Serviços → Tamanho do cabelo**: nome de cada
  tamanho, valor do acréscimo e um checkbox para ligar/desligar a seleção.
- O acréscimo é **somado ao serviço** e a **taxa de 15% incide sobre o total**
  (ex.: R$ 350,00 + Longo R$ 40,00 = R$ 390,00 → taxa R$ 58,50 · restante
  R$ 331,50).
- Aparece no resumo, na confirmação, **no aviso do WhatsApp do studio** e na
  **agenda do painel** (`Liso Espelhado Premium · Longo · ...`).
- Gravado em `appointments.hair_size` + `appointments.hair_size_cents`
  (migração automática em bancos antigos).
- **Regra**: serviços de cabelo pedem o tamanho; **unhas e sobrancelhas não
  pedem**. Se o cliente não informar (ou mandar id desconhecido), o servidor
  usa o primeiro tamanho (Curto, R$ 0) — o **valor nunca vem do cliente**, só
  do painel (`src/lib/hairsize.ts`).

### Usuários do painel — mais de um login

- Tela **`/admin/usuarios`** (item **Usuários** no menu): lista os acessos,
  cria login novo (usuário + senha), troca a senha e exclui.
- Cada pessoa entra com o **seu** usuário/senha em `/admin/login` — as sessões
  são independentes (dá para as duas acessarem ao mesmo tempo).
- Proteções: usuário mínimo 3 caracteres (letras/números/`.`/`-`/`_`), senha
  mínima 8, **não dá para excluir o próprio login nem o último usuário**, e ao
  excluir **as sessões daquela pessoa são derrubadas** na hora.
- Senha guardada com **scrypt + salt** (mesmo padrão do usuário `admin`).
- Alternativa pela linha de comando:
  `node scripts/add-admin.mjs <usuario> <senha>`.

### Hospedagem (Oracle Cloud grátis, permanente)

- `Dockerfile` + `docker-compose.yml` prontos (Node24, banco e fotos em
  **volumes** — sobrevivem a atualizações) e o guia completo em
  **`DEPLOY-ORACLE.md`** (conta grátis → servidor Ubuntu → portas22/80 →
  chave SSH que gerei em `deploy\oracle\oracle_key`).
- `scripts/backup.mjs` gera backup consistente do banco (mantém os14 últimos).

### Agendamento (7 etapas)
1 Serviço · 2 Data (calendário) · 3 Horário · 4 Dados · 5 Resumo · 6 Pagamento · 7 Confirmação

APIs:
- `GET /api/booking/availability?date&serviceId` → horários livres
- `POST /api/booking` → cria reserva (`pending`, código `SLE-XXXXXX`; aceita
  `hairSize` — `curto` \| `medio` \| `longo` \| `extra-longo`, validado no servidor)
- `POST /api/booking/payment` → PIX/cartão (`pix` | `card`)
- `POST /api/booking/approve` → aprovação (demonstração / manual)
- `POST /api/webhooks/mercadopago` → confirmação automática em produção
- `POST /api/admin/upload` → envio de fotos (sessão exigida, 25 MB, JPG/PNG/WebP/AVIF/GIF)

### Painel `/admin`
| Rota | Função |
|---|---|
| `/admin` | métricas + próximos atendimentos |
| `/admin/agenda` | agenda por dia, status, bloqueios, taxa recebida |
| `/admin/servicos` | CRUD com preço/duração/imagem editáveis + preview da taxa |
| `/admin/promocoes` | preço original/promocional, período, ordem, ativar |
| `/admin/galeria` | **Mostruário** — fotos e vídeos (YouTube/Vimeo/.mp4) |
| `/admin/depoimentos` | avaliações das clientes |
| `/admin/avisos` | **notificações de agendamento** — aviso por celular a cada reserva/pagamento, com mensagem pronta no WhatsApp |
| `/admin/conteudo` | contato, destaque, sobre, SEO, horários, avisos |
| `/admin/usuarios` | **usuários do painel** — criar 2º login, trocar senha e excluir (não deixa excluir a si mesmo nem o último) |

### Avisos de agendamento (celulares do admin)

- Cadastro: **Conteúdo → Avisos → "Celulares do studio"** (um por linha; todos
  os números recebem o mesmo aviso). Já vem com os **dois celulares**:
  **(24) 98153-1771** e **(24) 98751-011** — agendamento **e** pagamento
  chegam nos dois.
- Gatilhos: `POST /api/booking` (nova reserva, `kind=booking`) e
  `/api/booking/approve` + webhook do Mercado Pago (pagamento aprovado,
  `kind=confirmed`).
- Cada aviso vira uma linha em `notifications` **por celular**, com mensagem
  pronta (código, cliente, serviço, data/hora, taxa 15%, restante, link da
  agenda) e link `https://wa.me/55...?text=...`.
- No painel: badge "não lidos" no menu, cartão no Dashboard e a tela
  `/admin/avisos` com **Enviar no WhatsApp**, **Marcar como lida**,
  **Marcar todas como lidas** e **Limpar lidos**.
- Checkbox "Enviar aviso ao studio a cada novo agendamento" desliga a geração
  (default ligado). Sem celular cadastrado, nada é gerado (a tela avisa).

### Secretária virtual HADASSA

- **Toda mensagem** de agendamento e de pagamento **se apresenta primeiro**:
  *"Sou a HADASSA, secretária virtual do Studio Liso Espelhado com Beatriz
  Ribeiro."* — e depois detalha o agendamento (código, cliente, serviço,
  tamanho, data, taxa, restante, link da agenda). Gerado em
  `src/lib/notify.ts` (`buildMessage`), vale para os **dois** celulares.
- **Área de agendamento rápido (Nome + Telefone)** — componente
  `HadassaForm`, dentro de **Contato** (aparece na **home** e em
  `/contato`): a pessoa digita **nome** e **telefone**, o botão **Chamar no
  WhatsApp** abre o `wa.me` do Studio com a mensagem pronta
  (*"Olá, Hadassa! Aqui é {nome} ({telefone}). Quero agendar..."*), com
  validação (`role="alert"`) e confirmação (`role="status"`).
- **Dúvidas → contato cadastrado** em3 lugares:
  - `/agendar`: cartão **"Ficou com dúvidas? Fale com a Hadassa, secretária
    virtual"** com botão **Tirar dúvida no WhatsApp** (mensagem pronta);
  - **rodapé de todas as páginas**: "Dúvidas? (24) 98153-1771" já vira link
    de WhatsApp;
  - **Contato**: os dois celulares cadastrados aparecem na lista, cada um com
    seu link `wa.me`.
- Etapa 7 (confirmação) informa que a Hadassa avisou os dois celulares do
  Studio.

---

## 3. Bugs encontrados e corrigidos (importante reaproveitar)

1. **H1 invisível** — CSS fora de `@layer` sobrescrevia utilitários do Tailwind.
   → movido para `@layer base/components`.
2. **500 "Only plain objects"** — linhas do `node:sqlite` têm prototype nulo.
   → `plainRows()` / `plainRow()` em `db.ts`, aplicado em todas as consultas.
3. **Colunas novas não existiam** — `gallery.media_type` / `video_url`.
   → função `migrate()` com `ALTER TABLE` no boot.
4. **BUG CRÍTICO: aprovação cancelava a própria reserva** — depois de passar a
   segurar slot de pendente por 30 min, a reserva conflitava consigo mesma ao
   ser aprovada. → `busyIntervalsFor(date, excludeId)` +
   `availableSlots(..., { excludeId })`, usado em `/approve` e no webhook.
5. **Reserva duplicada** — voltar ao passo 4 reenviava.
   → guarda: se `result` já existe, vai direto ao resumo.
6. **`payment_method` deixou de ser gravado** ao corrigir o 4 → gravação isolada
   (não altera `status`, que só muda na aprovação).
7. **Erros de tipo** — `AdminLayoutProps` inexistente; `node:sqlite` sem tipos
   (`@types/node@20` → **24.19.0**); `unknown` no spread SQL → array tipado.
8. **Cabeçalho apertado** com 7 itens a 1024px → gaps/tracking menores até `xl`.
9. **Barra fixa cobria o rodapé** → `body.padding-bottom` aplicado pelo componente.
10. **`?servico=` ignorado** — o "Agendar" dos cards levava para
    `/agendar?servico=ID`, mas ninguém lia o parâmetro (serviço nunca era
    pré-selecionado). → `useSearchParams` + efeito de pré-seleção, começando na
    etapa 2; exigiu `<Suspense>` em volta do `BookingFlow`.
11. **Serviços de unha não apareciam na Home** (`limit={6}` cortava os novos) →
    vitrine equilibrada: 3 de cabelo + 3 de unha, com link "ver todos".
12. **Servidor rodando build antigo** — o `migrate()` que cria `services.track`
    só existe na aplicação nova, então o banco ficava sem a coluna. Sintoma:
    `no such column: track`. → `npm run build` + reinício do `npm start`.
13. **`verify.ps1` esperava token de 32 chars** e o hex real tem 64 → comparação
    corrigida e captura de saída com `Out-String` (evita ruído de avisos).
14. **Recusa genérica no agendamento** — bloquear cabelo na quarta devolvia
    "Este horário não está mais disponível." → agora devolve o motivo real
    (`availability.reason`), que o cliente já exibe na tela.
15. **Aprovação poderia ficar bloqueada pela própria regra** se o dia de unhas
    mudasse depois (reserva de cabelo numa data que virou dia de unha).
    → `availableSlots(..., { enforceTrack: false })` em `/approve` e no webhook:
    a regra vale para **criar** reserva, nunca para **cancelar** uma existente.
16. **`AppointmentWithRelations` sem `service_track`** → erro de build
    (`TS2322`) ao adicionar o selo `cabelo/unhas` na agenda do painel.
17. **`npm` não executava pelo PowerShell** — `npm.ps1` é bloqueado pela
    política de execução de scripts ("Arquivo ... npm.ps1 não pode ser
    carregado"). → usar **`npm.cmd` / `npx.cmd`** (ex.: `& "$nd\npm.cmd" run build`).
    Sintoma parecido: `npx tsc` falha com `'"node"' não é reconhecido` quando o
    diretório do Node não está no `PATH`.
18. **Import errado na tela de avisos** — de dentro de `app/admin/(painel)/avisos`
    o `../actions` não existe (as actions ficam em `app/admin/actions.ts`) →
    `TS2307`; corrigido para `@/app/admin/actions`, mesmo caminho do `AdminShell`.
19. **Limpeza falhava com `FOREIGN KEY constraint failed`** — `notifications`
    referencia `appointments`, então os avisos precisam ser apagados **antes**
    dos agendamentos. A causa de fundo era outra: todos os scripts de teste
    usavam o **mesmo WhatsApp** (24 98153-1771) e o `POST /api/booking`
    reaproveita o cliente pelo número, **sobrescrevendo o nome** — a limpeza por
    nome deixava de enxergar os agendamentos antigos. → cada script ganhou um
    número exclusivo (`24999990001/2/3`) e `clean-test-data.mjs` agora cruza
    nome + número + avisos, apagando avisos primeiro e clientes só se ficarem
    órfãos.
20. **Crash do Node ao encerrar os scripts** (`Assertion failed:
    UV_HANDLE_CLOSING`, exit `0xC0000409`) — `db.close()` junto do `process.exit`
    no Windows. → scripts passaram a usar `process.exitCode` e a deixar o
    processo sair sozinho.
21. **Acessibilidade em 89 (Lighthouse)** — 4 regras reprovadas na home:
    (a) `div` com `aria-label` sem papel (estrelas) → `role="img"`;
    (b) `dl` com `div > span` no herói → virou `ul > li`;
    (c) link do logo com `aria-label` diferente do texto visível → rótulo
    removido (o conteúdo já descreve);
    (d) contraste: `--color-gold-deep` `#9a7c3f` dava 3,2–3,6:1 em fundo claro
    e o rodapé `champagne/50` dava 4,18:1 → token escurecido para **`#7d6231`**
    (5,2:1 em offwhite) e rodapé para `champagne/70`. Depois da varredura nas
    demais telas, **49 textos** `text-espresso-soft/60|65|70` (4,0–4,3:1) foram
    para `/75` (≥4,5:1) em painel e fluxo de agendamento, e os passos da
    reserva (`/30` e `/55`) para `/75` e `/85`. Dias desabilitados do calendário
    ficam como estão: componente inativo é exceção da WCAG 1.4.3.
    → resultado: home/serviços **100/100/100**.
22. **Acentos corrompidos na origem (encoding)** — o `Get-Content` do
    PowerShell 5.1 lê UTF-8 sem BOM como ANSI, e um `Set-Content -Encoding utf8`
    regravou os acentos quebrados: "horários" virou "horÃ¡rios", a seta "↑"
    virou "â†‘" (isso reprovaria o contraste/nome acessível depois). Afetou
    `BookingFlow`, `AgendaManager`, `NotificationsManager`, `PromotionsManager`
    e 2 scripts de teste. → criado **`scripts/fix-encoding.mjs`**, que desfaz a
    decodificação errada (CP1252 → bytes → UTF-8) **por trecho**, ou seja,
    corrige arquivo misto sem tocar no texto íntegro. **Regra para o futuro:**
    nunca editar arquivo do projeto com `Get-Content`/`Set-Content` — usar o
    editor ou `node` (UTF-8).
23. **62 `<label>` sem `htmlFor` (regra `label` do Lighthouse)** — os campos do
    painel eram rotulados só no visual; em `/admin/conteudo`, 14 de 16 campos
    ficavam sem nome para leitor de tela. → criado **`scripts/fix-labels.mjs`**
    (casa cada `<label>` com o próximo controle e grava `htmlFor`/`id`): 51
    labels corrigidos + 5 manuais na agenda (bloqueio de horário e
    `aria-label` no seletor de data). Reprovava em `/admin/conteudo` (88) e
    `/admin/agenda` (93) → hoje as duas em 100.
24. **Contraste 4,42:1 e nome acessível divergente no painel** —
    (a) `--color-gold-deep: #7d6231` sobre o fundo da aba ativa (`#ebe1d1`)
    dava 4,42:1 (WCAG AA exige 4,5:1) → token final **`#775e2d`** (≈4,7:1 em
    fundo dourado, 6,1:1 em branco); (b) os botões "↑/↓" de reordenar tinham
    `aria-label="Subir"` **sem** o glifo visível, e o texto visível não estava
    no nome acessível (regra `label-content-name-mismatch`) → rótulo passou a
    incluir o glifo (`"↑ Subir"`, `"↓ Descer"`) em promoções, depoimentos e
    galeria.

---

## 4. Contato já configurado (solicitado e aplicado)

- WhatsApp: **(24) 98153-1771** → link `5524981531771`
- Endereço: **Rua Roberto Cotrim, 519 — Bairro Campo Alegre, Itatiaia/RJ**
- Google Maps configurado para esse endereço

---

## 5. Pendências (ficam do seu lado)

| Item | Situação | O que fazer |
|---|---|---|
| **💸 Conta bancária / Mercado Pago** | ⏳ **PENDENTE (decidido deixar para depois)** | 1) criar a conta no Mercado Pago (CPF/CNPJ + conta para recebimento); 2) copiar o token de acesso; 3) colar em `MERCADOPAGO_ACCESS_TOKEN` no `.env.local`; 4) reiniciar. Enquanto isso o site roda em **modo demonstração** |
| **Fotos** | ⏳ pendente | enviar pelo painel (Mostruário / Destaque / Sobre / Serviços) |
| **Domínio** | opcional | ajustar `NEXT_PUBLIC_BASE_URL` no `.env.local` |
| **☁️ Conta Oracle Cloud (servidor grátis)** | ⏳ **PENDENTE (etapa do site no ar)** | seguir o passo a passo do **`DEPLOY-ORACLE.md`**: criar a conta (e-mail + celular, cartão só valida, **R$ 0**), criar a instância Ubuntu com a chave SSH pública do guia, abrir as portas 22 e 80 e me passar o **IP público** — o restante (código, Docker, banco, testes) é feito por aqui |
| **Senha admin** | recomendado | trocar `ADMIN_PASSWORD` antes de publicar |
| E-mails | opcional | flags existem no painel (Avisos), envio ainda não implementado |

Enquanto não houver token, o site roda em **modo demonstração**: nenhum valor é
cobrado e a confirmação é feita pelo botão "Simular pagamento aprovado" — o
fluxo inteiro (taxa de 15%, reserva, confirmação) continua funcionando para
testes. A **conta bancária é a única pendência que bloqueia cobrança real**;
nada mais do site espera por ela.

---

## 6. Arte gerada (substituída por fotos reais depois)

`scripts/generate-art.cjs` cria 7 artes SVG em `public/art/`:
`hero · portrait · service · gallery · studio · promo · video`
(ondas de seda, luz dourada, grão fino, na paleta da marca).
Rodar novamente: `node scripts/generate-art.cjs`

---

## 7. Histórico de validação

| Teste | Resultado |
|---|---|
| `GET /api/booking/availability` (qui, 180 min) | ✅ 09:00–15:00, fecha 18:00 |
| Mesma API num domingo | ✅ `closed: true, "Fechado neste dia."` |
| Reserva → taxa 15% | ✅ R$ 350,00 → R$ 52,50 / restante R$ 297,50 |
| Pagamento PIX (demonstração) | ✅ `mode=sandbox, amount=5250` |
| Aprovação | ✅ `status=confirmed, paymentStatus=paid` |
| Slot travado | ✅ horário desapareceu da grade |
| Rotas públicas (13 páginas: 10 + 3 legais + sitemap/robots) | ✅ todas HTTP 200 |
| Painel (9 telas) | ✅ todas HTTP 200 |
| `scripts/verify.ps1` completo | ✅ **TUDO OK** |
| `tsc --noEmit` | ✅ exit 0 |
| `npm run build` | ✅ exit 0 (30 rotas geradas) |
| Regra dia de unha — unha na quarta | ✅ 17 horários liberados |
| Regra dia de unha — unha na quinta | ✅ bloqueado: "Atendimento de unhas somente na quarta-feira." |
| Regra dia de unha — cabelo na quarta | ✅ bloqueado: "Dia de unhas: na quarta-feira não há atendimento de cabelo." |
| Regra dia de unha — cabelo na quinta | ✅ 13 horários liberados |
| Migração do banco (`track`, `schedule`, 4 serviços de unha) | ✅ aplicada automaticamente no boot |
| **Edição no painel reflete no site público** | ✅ login real → Conteúdo → subtítulo alterado → home **e** `/sobre` atualizaram (cache invalidado) → valor restaurado |
| Card "Dia de unhas" no painel (aba Horários) | ✅ salva dia=3/quarta, checkbox e 14 horários intactos após o envio |
| **Fluxo completo na interface (7 etapas) com serviço de unha pré-selecionado** | ✅ `/agendar?servico=7` entra na etapa 2 com Nail Design; dica "somente quarta-feira"; calendário de outubro só com 7/14/21/28 |
| Calendário com serviço de cabelo | ✅ novembro ativa ter/qui/sex/sáb e **bloqueia todas as quartas**, dom e seg |
| Resumo e pagamento na interface | ✅ "PAGAR TAXA R$ 52,50" → PIX/simulação → confirmação **SLE-NX9LV4** = `confirmed`/`paid` (5250 / 29750) |
| Link de WhatsApp na confirmação | ✅ `wa.me/5524981531771?text=...SLE-NX9LV4` |
| Console do navegador (fluxo inteiro) | ✅ **0 erros** (apenas aviso de preload não utilizado) |
| **Avisos — `scripts/test-notifications.mjs`** | ✅ **18/18**: reserva → 2 avisos (um por celular), tipo `booking`, código/taxa/restante/link da agenda na mensagem, `wa.me/55...`; aprovação → +2 avisos `confirmed`; com o checkbox desligado → 0 avisos; limpeza automática |
| Avisos — 2 celulares salvos pelo painel | ✅ Conteúdo → Avisos: textarea com 2 números salvos e persistidos → nova reserva gerou exatamente **2 avisos** (um por número) |
| Tela `/admin/avisos` no navegador | ✅ badge "1 NÃO LIDO", cartão com a mensagem completa, botões Enviar no WhatsApp / Marcar como lida / Marcar todas / Limpar lidos; **console 0 erros** |
| Badge no menu + cartão no Dashboard | ✅ menu mostra "Avisos **1**"; Dashboard mostra "Avisos de agendamento — 1 não lido" com "Abrir avisos" e "Enviar no WhatsApp" |
| Estado vazio da tela de avisos | ✅ "Nenhum aviso ainda…" e aviso de "Nenhum celular cadastrado" quando não há número |
| `tsc --noEmit` (com avisos) | ✅ exit 0 |
| `npm run build` (com avisos) | ✅ exit 0 — **30 rotas**, inclui `/admin/avisos` e `/admin/usuarios` |
| **Varredura de encoding** (`node scripts/fix-encoding.mjs`) | ✅ 0 arquivos com texto corrompido (6 já recuperados — ver bug 22) |
| **Rótulos de formulário** (`node scripts/fix-labels.mjs`) | ✅ 71 `<label>` associados (`htmlFor`), 0 campo visível sem nome acessível |
| **Auditoria Lighthouse — 21 telas** | ✅ **100 / 100 / 100** em todas, zero auditorias reprovadas |
| **Catálogo ampliado: 29 serviços** | ✅ 6 assinatura + **19 novos** (ordem 6–24) + 4 de unhas (100–103), sem duplicidade; `extras_seeded` evita repetição e não repõe serviço renomeado no painel |
| **Novos serviços nas páginas** | ✅ `/servicos` e `/agendar` trazem os 19; home mantém a vitrine 3 cabelo + 3 unha |
| **Edição de valor pelo painel (ida e volta)** | ✅ login → `/admin/servicos` → Design de Sobrancelhas **R$ 60,00 → 65,00** → banco `6500` → site público mostrou **R$ 65,00** → restaurado **60,00** (banco `6000`) |
| **Lighthouse depois do catálogo** | ✅ `/servicos`, `/` , `/agendar` e `/admin/servicos` = **100/100/100** |
| **Tamanho do cabelo — `scripts/test-hair-size.mjs` (novo)** | ✅ **6/6**: cabelo+Longo → total **R$ 390,00** / taxa **R$ 58,50** / restante R$ 331,50; cabelo sem tamanho → **Curto (R$ 0)**; **unha ignora** o tamanho; gravação em `hair_size`/`hair_size_cents`; `settings.hairSizes` com os 4 tamanhos |
| **Tamanho na interface (etapa 1)** | ✅ campo “TAMANHO DO CABELO” com **4 rádios** (`name="hair-size"`, Curto já marcado), lateral mostra *Procedimento R$ 390,00 · Tamanho Longo (+R$ 40,00) · Taxa R$ 58,50 · Restante R$ 331,50*; **serviço de unha não mostra o campo** |
| **Tamanho editável pelo painel (ida e volta)** | ✅ Serviços → Longo **R$ 40,00 → 50,00** → banco `5000` → `/agendar` passou a mostrar **+ R$ 50,00** (total R$ 400,00 · taxa R$ 60,00 · restante R$ 340,00) → restaurado **40,00** (banco `4000`) |
| **2º login criado, usado e excluído pela interface** | ✅ `/admin/usuarios` → login “teste” criado (mensagem em `role="status"`) → **logout → login com `teste` entrou no painel** → ao excluir, usuário **e sessões** removidos (base final: só `admin`) |
| **Proteções de usuário** | ✅ senha mínima 8, usuário mínimo 3, username duplicado recusado com `role="alert"`, **não exclui a si mesmo nem o último** (`removeAdmin`) |
| **Lighthouse das telas novas/alteradas** | ✅ `/agendar`, `/admin/usuarios`, `/admin/servicos` e `/servicos` = **100/100/100** — **21 telas consolidadas** em `docs/lighthouse/` |

### Auditoria Lighthouse (acessibilidade / boas práticas / SEO)

> **21 telas auditadas — todas 100 / 100 / 100 — zero auditorias reprovadas.**
> JSON completo de cada página em `docs/lighthouse/lh-*.json` e resumo em
> `docs/lighthouse/RESUMO.md`. Pela linha de comando:
> `powershell -ExecutionPolicy Bypass -File scripts\lighthouse-audit.ps1`
> (sem throttling — é auditoria local; mata o Chrome entre as páginas).

| # | Página | Acessib. | Boas práticas | SEO | Falhas |
|---|---|---|---|---|---|
| 1 | `/` (home) | **100** (era 89) | 100 | 100 | — |
| 2 | `/servicos` | 100 | 100 | 100 | — |
| 3 | `/promocoes` | 100 | 100 | 100 | — |
| 4 | `/resultados` | 100 | 100 | 100 | — |
| 5 | `/mostruario` | 100 | 100 | 100 | — |
| 6 | `/sobre` | 100 | 100 | 100 | — |
| 7 | `/contato` | 100 | 100 | 100 | — |
| 8 | `/agendar` | **100** (era 95) | 100 | 100 | — |
| 9 | `/politica-de-privacidade` | 100 | 100 | 100 | — |
| 10 | `/termos-de-uso` | 100 | 100 | 100 | — |
| 11 | `/politica-de-agendamento` | 100 | 100 | 100 | — |
| 12 | `/admin` (painel) | 100 | 100 | 100 | — |
| 13 | `/admin/avisos` | 100 | 100 | 100 | — |
| 14 | `/admin/agenda` | 100 | 100 | 100 | — |
| 15 | `/admin/conteudo` | 100 | 100 | 100 | — |
| 16 | `/admin/servicos` | 100 | 100 | 100 | — |
| 17 | `/admin/galeria` | 100 | 100 | 100 | — |
| 18 | `/admin/promocoes` | 100 | 100 | 100 | — |
| 19 | `/admin/depoimentos` | 100 | 100 | 100 | — |
| 20 | `/admin/login` | 100 | 100 | 100 | — |
| 21 | `/admin/usuarios` | 100 | 100 | 100 | — |

**Notas sobre execuções antigas (já superadas):**

- Relatórios com `0` ou SEO 91/92 eram execuções **canceladas** pelas
  reinicializações da máquina (`PAGE_HUNG`/`PROTOCOL_TIMEOUT`) e o aviso de
  `robots.txt` era timeout de fetch — `/robots.txt` responde **200** em ~25 ms
  e é válido (conferido por `curl`). Causa raiz: Chrome órfão de execuções
  canceladas (29 processos!) travando a máquina — `lighthouse-audit.ps1` agora
  mata o Chrome entre cada página, e a auditoria final foi feita pelo navegador
  do próprio agente (sem emulação de rede).
- A última leva de problemas (`label`, `label-content-name-mismatch`,
  contraste 4,42:1) foi corrigida — ver bugs **22**, **23** e **24**.

---

## 8. Scripts de apoio

| Arquivo | Uso |
|---|---|
| `scripts/verify.ps1` | verificação completa: 13 rotas públicas + fluxo de agendamento ponta a ponta + 10 telas do painel (inclui `/admin/usuarios`). Resultado final "TUDO OK ✅" |
| `scripts/test-hair-size.mjs` | valida o **tamanho do cabelo**: `node scripts/test-hair-size.mjs` (6 asserções — acréscimo no total, padrão Curto, unha ignora, gravação no banco) |
| `scripts/test-notifications.mjs` | valida os **avisos por celular**: `node scripts/test-notifications.mjs` (18 asserções, restaura config e limpa os dados) |
| `scripts/test-nail-rule.mjs` | valida a regra dia de unhas: `node scripts/test-nail-rule.mjs` |
| `scripts/add-admin.mjs` | cria um login novo pelo terminal: `node scripts/add-admin.mjs <usuario> <senha>` (scrypt + salt, mesmo padrão do painel) |
| `scripts/backup.mjs` | backup consistente do banco (`VACUUM INTO`) em `data/backups/`, mantém os 14 últimos: `node scripts/backup.mjs` |
| `scripts/test-schedule-config.mjs` | prova que a agenda segue o dia de unhas configurado no painel (altera e restaura) |
| `scripts/test-booking-guard.mjs` | prova que o **servidor** recusa cabelo na quarta e unha fora da quarta, e completa o fluxo de uma unha (reserva → pagamento → confirmação) |
| `scripts/clean-test-data.mjs` | limpa a agenda dos dados de teste (`--force` apaga); apaga avisos antes dos agendamentos (FK) e clientes só se ficarem órfãos. A entrega foi feita com 0 agendamentos / 0 clientes / 0 avisos |
| `scripts/session-token.mjs` | gera token de sessão de admin direto no banco (para testes com curl) |
| `scripts/lighthouse-audit.ps1` | auditoria Lighthouse (acessibilidade / boas práticas / SEO) nas 11 páginas públicas + 5 telas do painel (entra com sessão de admin). `powershell -ExecutionPolicy Bypass -File scripts\lighthouse-audit.ps1` — imprime a nota de cada página ao final |
| `scripts/fix-labels.mjs` | associa `<label>` ↔ campo (`htmlFor`/`id`) em todo o painel — `node scripts/fix-labels.mjs` (simula) / `--apply` (grava). Corrige a regra `label` do Lighthouse |
| `scripts/fix-encoding.mjs` | recupera arquivos UTF-8 quebrados por leitura em ANSI (`horÃ¡rios`, `â†‘`) — `node scripts/fix-encoding.mjs` (simula) / `--apply` (grava). Já aplicado: 6 arquivos recuperados |
| `scripts/generate-art.cjs` | regenera as 7 artes SVG de `public/art/` |

> **Números de teste:** `verify.ps1` usa `24999990001`, `test-booking-guard.mjs`
> `24999990002` e `test-notifications.mjs` `24999990003` — nunca o WhatsApp real
> do studio, para não misturar clientes de teste com os da cliente.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\verify.ps1
```

> **Dica de teste:** a edição de conteúdo é feita por *server action* (`action={...}`
> no formulário). Invocar a action direto via HTTP (header `Next-Action`) **não
> funciona** nesta versão do Next e devolve `Connection closed.` — não é bug do
> app. O caminho correto é o navegador: login → painel → campo → Salvar, e
> conferir a página pública.

---

## 9. Como retomar (se a máquina reiniciar)

```powershell
$env:Path = "$env:Path;$env:LOCALAPPDATA\Programs\nodejs"
Set-Location "C:\Users\Empreendedores\Desktop\studio-liso"
npm run dev          # ou: npm run build ; npm start
```

Login: `http://localhost:3000/admin` → `admin` / `studio2026`

Verificação rápida:
```powershell
curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/
curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/agendar
curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/sitemap.xml
```

---

## 10. Status final e pendências (do lado da cliente)

### ✅ Entregue e validado
- Site institucional completo: home, serviços, promoções, resultados, mostruário,
  sobre, contato, agendar + 3 páginas legais + sitemap/robots
- Agendamento em 7 etapas com **taxa de 15% automática**, reserva segurando o
  horário por 30 min e trava só após pagamento aprovado
- Painel `/admin`: agenda, serviços, promoções, galeria (fotos **e vídeos**),
  depoimentos, conteúdo (contato, destaque, sobre, SEO, horários, avisos),
  **usuários** (criar/renomear logins — mais de um acesso ao mesmo tempo)
- **Serviços de unha**: Nail Design, Tips, Gel e Manutenção com preço/duração
  editáveis e o campo **Tipo de atendimento** (Cabelo / Unhas) em cada serviço
- **Regra dia de unhas** editável no painel → aba **Horários** → card
  "Dia de unhas": escolha do dia + bloqueio de cabelo; afeta calendário, grade,
  API e confirmação de pagamento
- **Painel → Agenda**: faixa "Dia de unhas" na data configurada e selo
  `cabelo` / `unhas` em cada atendimento
- **Avisos de agendamento no celular do admin**: a cada nova reserva e a cada
  pagamento aprovado o sistema gera um aviso **por número cadastrado** (Conteúdo
  → Avisos, um por linha; já vem (24) 98153-1771) com a mensagem pronta —
  código, cliente, serviço, data/hora, taxa 15%, restante e link da agenda — e o
  botão **Enviar no WhatsApp** em `/admin/avisos`, com badge de não lidos no menu
  e cartão no Dashboard
- `verify.ps1` → **TUDO OK** (13 rotas + fluxo completo + **10 telas** do painel)
- `tsc --noEmit` → exit 0 e `npm run build` → exit 0 (rotas do build incluem
  `/admin/usuarios`)
- Testes da regra: `test-nail-rule.mjs` (4/4), `test-schedule-config.mjs` (7/7)
  e `test-booking-guard.mjs` (8/8 — recusa no servidor + fluxo de unha)
- **Tamanho do cabelo**: `test-hair-size.mjs` (**6/6**) — serviço de cabelo com
  `hairSize: "longo"` soma o acréscimo e **recalcula a taxa de 15% sobre o
  total**; sem tamanho cai em **Curto (R$ 0)**; **unhas ignoram** o tamanho;
  gravação em `hair_size`/`hair_size_cents`. Editável no painel (Serviço →
  Tamanho do cabelo) com teste ida e volta (**R$ 40,00 → 50,00 → 40,00**)
- **2º login do painel**: tela `/admin/usuarios` cria, troca senha e exclui
  logins — teste feito pela interface (criar `teste` → **login com ele** →
  excluir → sessões derrubadas), proteções de último/usuário próprio ativas
- **Pacote de deploy**: `Dockerfile` + `docker-compose.yml` (banco e fotos em
  volumes) + guia **`DEPLOY-ORACLE.md`** para a Oracle Cloud Always Free
- Teste dos avisos: `test-notifications.mjs` (**18/18** — geração por celular,
  conteúdo da mensagem, link wa.me, confirmação de pagamento e checkbox
  desligado), com restauração de config e limpeza automática
- **Acessibilidade 100 em todas as telas**: Lighthouse nas **21 telas**
  (11 públicas + 10 do painel) fechou **100 / 100 / 100 com zero falhas**
  (home saiu de 89 e `/agendar` de 95) — contraste do dourado no `#775e2d`,
  71 rótulos de formulário associados, contraste corrigido em 49+ textos;
  relatórios JSON em `docs/lighthouse/` + `RESUMO.md`
- **Catálogo com 29 serviços** (6 assinatura + **19 novos** + 4 de unhas):
  botox, progressiva com/sem formol, lifting, blindagem, 4 cronogramas,
  regeneração SPA, plex, escovas, higienização, coloração, reset, blond
  refresh e design de sobrancelhas — **nome, valor, duração e descrição
  editáveis pelo login** em `/admin/servicos` (teste de edição ida e volta
  aprovado: R$ 60,00 → 65,00 → 60,00)
- **Agenda zerada** na entrega: agendamentos, clientes e avisos de teste
  removidos por `scripts/clean-test-data.mjs --force` (0 / 0 / 0)
- Build final rodando: `npm start` → http://localhost:3000
- Recusa no agendamento devolve o **motivo real** ("Dia de unhas: na
  quarta-feira não há atendimento de cabelo"), não uma mensagem genérica
- Aprovação de pagamento e webhook **ignoram** a regra do dia (usam só o
  conflito de horário): mudar o dia de unhas depois não cancela reservas já
  criadas

### ⏳ Pendências do lado da cliente (não travam o site)
1. **💸 Conta bancária / Mercado Pago — PENDENTE por decisão (deixada para
   depois da entrega)** — única pendência que **bloqueia cobrança real**.
   Quando for fazer: criar a conta, copiar o token e colar
   `MERCADOPAGO_ACCESS_TOKEN` em `.env.local` → reiniciar. Hoje o site roda em
   **modo demonstração** (botão "Simular pagamento aprovado"), com o fluxo
   completo de taxa de 15% funcionando para testes
2. **Fotos reais** — subir em `Galeria` (mostruário) e nas imagens de destaque;
   até lá o site usa as artes SVG em `public/art/`
3. Ajustar `NEXT_PUBLIC_BASE_URL` em `.env.local` quando o site tiver domínio
   (é o endereço usado no webhook do Mercado Pago)
4. **☁️ Colocar o site no ar (Oracle Cloud Always Free)** — pacote pronto
   (`Dockerfile`, `docker-compose.yml`, `scripts/backup.mjs`) + guia completo
   em **`DEPLOY-ORACLE.md`**. Falta só a sua parte: criar a conta e a
   instância, colar a chave SSH pública do guia e me mandar o IP

### 🔑 Credenciais
- Painel: `http://localhost:3000/admin` → usuário `admin` / senha `studio2026`
