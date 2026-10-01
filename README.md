# STUDIO LISO ESPELHADO COM BEATRIZ RIBEIRO

Site institucional + plataforma de agendamento online com taxa automática de 15%.

---

## 1. Como rodar

```bash
cd studio-liso
npm install      # já feito
npm run dev      # http://localhost:3000
```

Build de produção:

```bash
npm run build
npm start
```

---

## 2. Acesso ao painel

| | |
|---|---|
| Endereço | `http://localhost:3000/admin` |
| Usuário | `admin` |
| Senha | `studio2026` |

> Altere em `.env.local` (`ADMIN_USER` / `ADMIN_PASSWORD`) antes de publicar.
> **Mais de um acesso:** painel → **Usuários** → *+ Novo login* (cada pessoa
> com o seu usuário/senha, dá para as duas entrarem ao mesmo tempo).

---

## 3. O que já está pronto

### Site público
- Home com hero, serviços, promoções, mostruário, depoimentos, sobre, contato
- `/servicos` · `/promocoes` · `/resultados` · `/mostruario` · `/sobre` · `/contato`
- **`/agendar`** — fluxo completo em 7 etapas
- Páginas legais: `/politica-de-privacidade`, `/termos-de-uso`, `/politica-de-agendamento`
- SEO: sitemap.xml, robots.txt, metadados e descrições por página
- Responsivo, com botão fixo "Agendar agora" no celular
- Logo/monograma **BR** (Beatriz Ribeiro)

### Agendamento
1. Serviço → 2. Data → 3. Horário → 4. Dados → 5. Resumo → 6. Pagamento → 7. Confirmação

- **Taxa de 15% calculada automaticamente** (nunca digitada à mão)
- Fórmula: `taxa = valor × 0,15` — o restante é pago no studio
- Horários vindos de terça a sábado, 09h–18h (domingo/segunda fechado)
- **Quarta-feira é dia de unha**: somente Nail Design, Tips, Gel e Manutenção —
  **não há atendimento de cabelo** neste dia (regra editável em `settings.schedule`
  e no painel, aba **Horários → Dia de unhas**)
- A regra é aplicada **pelo servidor**: reservar cabelo na quarta ou unha fora
  dela é recusado com o motivo exibido na tela
- Horário é travado somente **após** o pagamento ser aprovado
- Reserva segura o horário por 30 min enquanto o pagamento não acontece
- Duração de cada serviço respeitada ao montar a grade de horários

### Tamanho do cabelo (etapa 1 do agendamento)

Quando a cliente escolhe um **serviço de cabelo**, aparece o campo
**"Tamanho do cabelo"**:

| Tamanho | Acréscimo inicial (editável) |
|---|---|
| Curto | R$ 0,00 (sem acréscimo) |
| Médio | R$ 20,00 |
| Longo | R$ 40,00 |
| Extra Longo | R$ 60,00 |

- O acréscimo é somado ao serviço e **a taxa de 15% incide sobre o total**
  (ex.: R$ 350,00 + Longo R$ 40,00 = R$ 390,00 → taxa **R$ 58,50** · restante
  **R$ 331,50**).
- **Para editar nome/valor ou desligar a seleção:** painel → **Serviços →
  Tamanho do cabelo** → *Salvar tamanhos*.
- Aparece no resumo, na confirmação, no aviso do WhatsApp do studio e na
  agenda do painel.
- Serviços de **unhas** e **sobrancelhas** não pedem tamanho.

### Catálogo completo — 29 serviços (valores iniciais, tudo editável no painel)

**19 serviços de cabelo/beleza acrescentados:**

| Serviço | Categoria | Valor | Duração |
|---|---|---|---|
| Botox Capilar com Formol | Alisamento | R$ 280,00 | 150 min |
| Botox Capilar Nanoplastia | Alisamento | R$ 320,00 | 180 min |
| Progressiva sem Formol | Alisamento | R$ 280,00 | 150 min |
| Progressiva com Formol | Alisamento | R$ 250,00 | 150 min |
| Lifting Capilar | Alisamento | R$ 240,00 | 120 min |
| Blindagem Capilar | Tratamentos | R$ 180,00 | 90 min |
| Cronograma Capilar Ampola | Cronograma | R$ 130,00 | 60 min |
| Cronograma Capilar Máscara Personalizada | Cronograma | R$ 150,00 | 60 min |
| Cronograma Capilar Premium | Cronograma | R$ 220,00 | 90 min |
| Cronograma Capilar Crescimento | Cronograma | R$ 170,00 | 60 min |
| Tratamento Regeneração SPA | Tratamentos | R$ 200,00 | 90 min |
| Tratamento Plex | Tratamentos | R$ 150,00 | 60 min |
| Escova Comum | Escovagem | R$ 70,00 | 45 min |
| Escova com Tratamento | Escovagem | R$ 110,00 | 60 min |
| Higienização Capilar | Cuidados | R$ 120,00 | 60 min |
| Coloração | Coloração | R$ 250,00 | 150 min |
| Reset Capilar Limpeza Profunda | Tratamentos | R$ 140,00 | 60 min |
| Matização Blond Refresh | Coloração | R$ 190,00 | 90 min |
| Design de Sobrancelhas | Sobrancelhas | R$ 60,00 | 30 min |

Além dos 6 procedimentos assinatura (Liso Espelhado Premium, Liso Espelhado +
Tratamento, Selagem de Brilho, Reconstrução Capilar, Hidratação Profunda e
Diagnóstico e Consultoria Capilar).

**Para mudar qualquer valor:** painel → **Serviços** → *Editar* → campo
**Valor** → *Salvar serviço*. A alteração aparece no site na hora e a taxa de
15% é recalculada sozinha.

### Serviços de unha (tabela inicial — tudo editável no painel)

| Serviço | Valor | Duração |
|---|---|---|
| Nail Design | R$ 120,00 | 60 min |
| Tips | R$ 180,00 | 90 min |
| Gel | R$ 90,00 | 60 min |
| Manutenção de Unha | R$ 70,00 | 45 min |

No painel (**Serviços**) cada item tem o campo **Tipo de atendimento**
`Cabelo` / `Unhas`, que define em quais dias ele pode ser agendado.

### Painel administrativo
| Rota | O que faz |
|---|---|
| `/admin` | Painel com métricas e próximos atendimentos |
| `/admin/agenda` | Agenda por dia, status, bloqueios, taxa recebida |
| `/admin/servicos` | CRUD de serviços com preço, duração e imagem editáveis |
| `/admin/promocoes` | Promoções com preço original/promocional e período |
| `/admin/galeria` | **Mostruário** — fotos e vídeos (YouTube, Vimeo ou .mp4) |
| `/admin/depoimentos` | Depoimentos das clientes |
| `/admin/avisos` | **Avisos de agendamento** — notificação no celular a cada reserva |
| `/admin/conteudo` | Textos, imagens, contato, SEO, horários e avisos |
| `/admin/usuarios` | **Usuários** — cria 2º login, troca senha, exclui (não deixa excluir a si mesmo nem o último) |

Tudo é editável pelo painel — **nenhuma alteração exige mexer em código**.

### Mais de um login no painel

Duas formas de criar o acesso da segunda pessoa:

1. **Pelo painel (recomendado):** menu **Usuários** → **+ Novo login** →
   usuário (mín. 3 caracteres) + senha (mín. 8) → **Criar login**. Depois é só
   entrar em `/admin/login` com esses dados — as sessões são independentes.
2. **Pelo terminal:** `node scripts/add-admin.mjs joana senha12345`

Para trocar ou excluir um acesso: mesma tela **Usuários**. Ao excluir, as
sessões daquela pessoa são derrubadas na hora.

### Avisos de agendamento no celular

Sempre que alguém fizer uma reserva — e de novo quando o pagamento for
aprovado — a **Hadassa, secretária virtual do Studio**, prepara a mensagem e
envia para **os dois celulares cadastrados** (agendamento **e** pagamento
chegam nos dois):

1. painel → **Conteúdo → Avisos** → "Celulares do studio (avisos)": coloque
   **um número por linha** (vários celulares recebem o mesmo aviso) →
   **Salvar avisos**. Já vem com **(24) 98153-1771** e **(24) 98751-011**;
2. painel → **Avisos**: veja a lista com badge de não lidos;
3. toque em **Enviar no WhatsApp** — o WhatsApp abre com a mensagem pronta
   (a Hadassa se apresenta como secretária virtual, e vem código, cliente,
   serviço, data/hora, taxa de 15%, restante a cobrar e o link da agenda).

Também aparece um cartão "Avisos de agendamento" no Dashboard e o contador ao
lado do menu. Para desligar, desmarque "Enviar aviso ao studio a cada novo
agendamento" em Conteúdo → Avisos.

### Hadassa — secretária virtual (área Nome + Telefone e dúvidas)

- **Área de agendamento rápido** na **home** e em **`/contato`**: digite
  **nome** e **telefone** → botão **Chamar no WhatsApp** abre o WhatsApp do
  Studio com a mensagem pronta para a Hadassa atender e confirmar o horário.
- **Dúvidas?** cartão em **`/agendar`** ("Fale com a Hadassa, secretária
  virtual") e link **"Dúvidas? (24) 98153-1771"** no rodapé de todas as
  páginas — tudo aponta para o contato cadastrado no painel.
- Confirmação da reserva (etapa 7) avisa que a Hadassa já avisou os dois
  celulares do Studio.

---

## 4. Pagamento (Mercado Pago)

**Status: ⏳ conta bancária/mercado pago PENDENTE (deixada para depois — só
isso falta para cobrar de verdade).**

**Hoje: modo demonstração.** Nenhum valor é cobrado; a tela tem o botão
"Simular pagamento aprovado", que aprova a reserva e trava o horário — o fluxo
completo (taxa de 15%, reserva segurando o horário, confirmação) funciona
normalmente para testes.

**Para ativar de verdade**, quando a conta bancária estiver pronta:

1. Copie `.env.local.example` para `.env.local`
2. Cole o Access Token em `MERCADOPAGO_ACCESS_TOKEN`
3. Ajuste `NEXT_PUBLIC_BASE_URL` com o domínio real
4. Reinicie o servidor

Com o token, o PIX é gerado pelo Mercado Pago (QR Code real) e a confirmação
acontece sozinha pelo webhook `/api/webhooks/mercadopago`.

---

## 5. Fotos (pendente com você)

Onde não existe foto, o site exibe automaticamente **artes editoriais**
(`public/art/*.svg`) — seda, luz dourada e grão fino, na paleta da marca.

Para colocar as fotos reais:
- painel → **Mostruário** (galeria e vídeos)
- painel → **Conteúdo → Destaque** (foto da primeira tela)
- painel → **Conteúdo → Sobre** (foto da Beatriz)
- painel → **Serviços** (imagem de cada serviço)

Formatos aceitos: JPG, PNG, WebP, AVIF — até 25 MB.

---

## 6. Contato já configurado

- WhatsApp: **(24) 98153-1771**
- Endereço: **Rua Roberto Cotrim, 519 — Bairro Campo Alegre, Itatiaia/RJ**

---

## 7. Estrutura

```
src/
  app/                 páginas públicas, agendamento, painel, APIs
  components/          componentes de site e da home
  lib/                 banco (SQLite), consultas, regras, formatação
  app/globals.css      sistema de design (Tailwind v4)
data/studio.db         banco SQLite (criado sozinho na primeira execução)
public/art/            artes editoriais de reserva
public/uploads/        fotos enviadas pelo painel
```

Banco: SQLite nativo do Node (`node:sqlite`) — sem dependências nativas.
Valores monetários em centavos, exibidos em formato pt-BR.

---

## 8. Verificação e auditoria

| Comando | O que valida | Resultado da entrega |
|---|---|---|
| `powershell -ExecutionPolicy Bypass -File scripts\verify.ps1` | 13 rotas públicas + fluxo de agendamento ponta a ponta + 10 telas do painel | **TUDO OK** |
| `node scripts/test-hair-size.mjs` | tamanho do cabelo (acréscimo, padrão Curto, unha ignora, banco) | 6/6 |
| `node scripts/test-notifications.mjs` | avisos por celular (18 asserções) | 18/18 |
| `node scripts/test-booking-guard.mjs` | recusa da regra no servidor + fluxo de unha | 8/8 |
| `node scripts/test-nail-rule.mjs` | regra do dia de unhas | 4/4 |
| `node scripts/test-schedule-config.mjs` | agenda segue o dia configurado no painel | 7/7 |
| `npx tsc --noEmit` · `npm run build` | tipos e build | exit 0 · exit 0 |
| `node scripts/backup.mjs` | backup do banco (`data/backups/`) | ✓ |

**Acessibilidade (Lighthouse):** as **21 telas** (11 públicas + 10 do painel)
fecharam **100 / 100 / 100** — acessibilidade, boas práticas e SEO — com zero
auditorias reprovadas. Os relatórios JSON ficam em `docs/lighthouse/`
(resumo em `RESUMO.md`). Para repetir com o servidor ligado:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\lighthouse-audit.ps1
```

**Ao criar campo/formulário novo no painel:**

```powershell
node scripts/fix-labels.mjs          # simula: acha <label> sem htmlFor
node scripts/fix-labels.mjs --apply  # grava htmlFor/id
node scripts/fix-encoding.mjs        # detecta/recupera acentos quebrados
```

> ⚠️ Nunca edite arquivos do projeto com `Get-Content`/`Set-Content` do
> PowerShell 5.1 — eles leem UTF-8 sem BOM como ANSI e quebram os acentos
> (`horários` → `horÃ¡rios`). Use o editor ou `node`.

---

## 9. Site no ar — Oracle Cloud (grátis para sempre)

O site tem pacote de deploy pronto:

| Arquivo | O que é |
|---|---|
| `Dockerfile` | imagem de produção (Node 24, build + `npm prune`) |
| `docker-compose.yml` | sobe o site na porta 80 com **banco e fotos em volumes** (sobrevivem a atualização) |
| `DEPLOY-ORACLE.md` | **guia passo a passo**: conta grátis → instância Ubuntu → portas 22/80 → chave SSH |
| `scripts/backup.mjs` | backup do banco mantendo os 14 últimos |

Resumo do caminho (detalhes no guia):

1. Criar a conta Oracle Cloud (cartão só valida, **R$ 0**) e a instância
   **Ubuntu Always Free** colando a chave SSH pública do guia;
2. Abrir as portas **22** e **80** na Security List e mandar o **IP**;
3. Aqui: subir o código, instalo o Docker e sobo com `docker compose up -d --build`;
4. Depois: trocar a senha e criar o 2º login em **Usuários**.
