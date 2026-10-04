# ✅ Projeto concluído — 04/10/2026

> **ARQUIVO INTERNO.** Apagar este arquivo antes de entregar/vender o site.
> Não contém senhas nem dados pessoais.

**Status: site no ar, HTTPS, indexado e aparecendo no Google.**

---

## ✅ Tudo concluído

| # | Item | Evidência |
|---|---|---|
| 1 | Domínio registrado | `studiolisoespelhado.com.br` · expira 03/10/2027 |
| 2 | DNS publicado | raiz e `www` → `147.15.117.149` |
| 3 | Portas 80, 443 e 22 abertas | testadas de fora |
| 4 | Site no ar | `https://studiolisoespelhado.com.br/` → **200** |
| 5 | **HTTPS** | Caddy + Let's Encrypt (`CN=studiolisoespelhado.com.br`) |
| 6 | `http://` → `https://` | redirect **308** automático |
| 7 | `www` funciona | **200** (canonical aponta pra raiz) |
| 8 | Caddy no servidor | container `caddy` (80/443) · `studio` só em `127.0.0.1:3000` |
| 9 | `SITE_URL` | `https://studiolisoespelhado.com.br` nos 2 lugares |
| 10 | sitemap.xml | **11 URLs**, todas **200** |
| 11 | robots.txt | `Allow: /` · `Disallow: /admin`, `/api` · sitemap correto |
| 12 | canonical | `<link rel="canonical" href="https://studiolisoespelhado.com.br">` |
| 13 | `index, follow` | presente em todas as páginas |
| 14 | Zero `localhost` no HTML | verificado |
| 15 | **Etiqueta do Google** | `<meta name="google-site-verification">` presente |
| 16 | **Search Console** | propriedade verificada |
| 17 | **Sitemap enviado** | Status **Processado** · **11 páginas encontradas** |
| 18 | **Inspeção de URL** | *"O URL está no Google"* · *"A página está indexada"* · *"A página é exibida por HTTPS"* |
| 19 | **SERP** | a meta description já aparece em *"Resultados da web"* |
| 20 | Sem links quebrados | `/admin` é bloqueado de propósito |

Repo: branch `main` · último commit `38d648d`

---

## 🔎 Por que demorou o DNS

O registrador bloqueia alterações de DNS em domínio **recém-registrado**
por ~1 hora (*"servidores DNS em transição"*). Passado o prazo,
a zona publicou sozinha. Nada precisou ser refeito.

---

## 📈 O que falta agora (opcional / aceleração)

Não há pendências técnicas. Para ranquear mais rápido:

- [ ] Link do site na **bio do Instagram** `@studio_liso_espelhado`
- [ ] Criar **Google Meu Negócio** (perfil local — Itatiaia/RJ)
- [ ] Cadastrar em diretórios locais de salões
- [ ] Publicar o endereço no WhatsApp Status
- [ ] Pedir a clientes que deixem avaliações

> Site novo + domínio novo = resultados levam **semanas a meses**.
> Backlinks são o que mais acelera.

---

## 🧭 Antes de VENDER (limpeza de dados pessoais)

Ver **seção 7 do `RUNBOOK.md`**. O site exibe hoje:

- Nome da profissional (Beatriz Ribeiro) e de clientes em depoimentos
- WhatsApp, endereço, e-mail, Instagram, chave PIX/CNPJ

Tudo isso é **conteúdo do negócio** — decide-se na venda o que
fica, o que sai e o que se anonimiza.

---

## 🗑️ Para apagar antes de entregar

- [ ] `PENDENCIAS.md` (este arquivo)
- [ ] `deploy/` (chaves SSH)
- [ ] `data/` (banco com admins e e-mails)
- [ ] `uploads/` (fotos dos trabalhos)
- [ ] `.env*`
