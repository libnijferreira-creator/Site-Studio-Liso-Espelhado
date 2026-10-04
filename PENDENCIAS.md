# ⚙️ Onde paramos — retomada

> **ARQUIVO INTERNO.** Apagar este arquivo antes de entregar/vender o site.
> Não contém senhas nem dados pessoais.

Atualizado em: **04/10/2026** (manhã)

---

## ✅ Pronto (não refazer)

| # | Item | Evidência |
|---|---|---|
| 1 | Instância na nuvem no ar | `VM.Standard.E2.1.Micro`, Ubuntu 22.04, 1 GB + swap 4 GB |
| 2 | Portas **22 / 80 / 443** abertas | regras `0.0.0.0/0` na security list |
| 3 | **Registros A publicados** | raiz **e** `www` → `147.15.117.149` (DoH do Google) |
| 4 | **Site no ar pelo domínio** | `https://…` → HTTP **200** (130 KB) |
| 5 | **HTTPS com certificado** | Caddy + Let's Encrypt, porta 443 |
| 6 | `http://` → `https://` | redirect **308** automático |
| 7 | `www` funcionando | `https://www.…` → 200 |
| 8 | Sitemap 100% https | 11/11 URLs → 200, todas `https://` |
| 9 | Robots | `Sitemap: https://…/sitemap.xml` |
| 10 | Zero `localhost` e zero IP no HTML | `grep` = 0 |
| 11 | Admin com `noindex` | todas as rotas `/admin/*` |
| 12 | Código no GitHub | último commit `9de5ea7` |

---

## ⏳ Pendente

### 1. Search Console ⭐ **prioridade**
1. **Adicionar propriedade** → Prefixo de URL → `https://studiolisoespelhado.com.br/`
2. Método **Etiqueta HTML** → copiar só o valor de `content="..."`
3. Colar em `GOOGLE_SITE_VERIFICATION` em `src/app/layout.tsx`
4. `git push` → no servidor: `bash /home/ubuntu/d3.sh`
5. Concluir verificação → **Enviar sitemap** `https://…/sitemap.xml`
6. **Solicitar indexação** da home

> O campo já está preparado e **vazio** (o Google rejeita placeholder).
> O comentário no `layout.tsx` já aponta para o domínio, não mais para o IP.

### 2. `og:title` igual em todas as páginas ⚠️ *(qualidade de compartilhamento)*
Hoje, quem manda o link de `/servicos` ou `/promocoes` no WhatsApp vê o
**título da home** na prévia. Causa: `generateMetadata` do root define o
`openGraph` inteiro, e as páginas filhas só sobrescrevem `title`/`description`.

- Como funciona o merge (lido na fonte): `mergeMetadata` **substitui** o objeto
  `openGraph` inteiro quando o segmento filho define um — não faz merge por chave.
- Correção: criar `src/lib/seo.ts` com um helper que devolva `title`,
  `description`, `openGraph` completo (`type`, `locale`, `siteName`, `url: "./"`)
  e `alternates: { canonical: "./" }`, e usá-lo nas 6 páginas com
  `generateMetadata` (`servicos`, `contato`, `sobre`, `resultados`,
  `promocoes`, `mostruario`).
- `og:image` também está ausente — seria bom ter uma imagem social 1200×630.

### 3. Limpeza de dados pessoais antes de vender ⚠️

O raio-x do HTML publicado achou: **2 números de WhatsApp**, **1 e-mail**,
**endereço físico**, **CNPJ (também é a chave PIX)** e **nome de pessoa**
no `<title>`/`<meta description>`. Nenhum CPF. Não encontrei dados de
clientes no HTML público além dos depoimentos.

Mapa por **onde** cada coisa vive:

#### 3a. No banco → trocar pelo painel `/admin` (sem deploy)

| Onde no admin | O que sai |
|---|---|
| **Conteúdo → Identidade** | assinatura, subtítulo do hero |
| **Conteúdo → Sobre** | título/estória (nome da profissional, texto em 1ª pessoa) |
| **Conteúdo → SEO** | `<title>`, `<meta description>`, **keywords** |
| **Conteúdo → Contato** | WhatsApp, link do WhatsApp, Instagram, e-mail, **endereço**, Google Maps |
| **Conteúdo → Avisos** | celulares que recebem notificação de agendamento/pagamento |
| **Conteúdo → Pagamento** | **CNPJ**, chave PIX, banco |
| **Depoimentos** | nomes de clientes + texto (o de exemplo cita a profissional) |

> ⚠️ **CNPJ = chave PIX.** Trocar só o PIX não basta: o `payment.cnpj`
> também aparece no rodapé/página de contato.

#### 3b. No código → exige commit + deploy

| Arquivo | O que tem |
|---|---|
| `src/app/politica-de-agendamento/page.tsx:107` | telefone **+ endereço físico** |
| `src/app/politica-de-privacidade/page.tsx:93` | telefone + e-mail (seção LGPD) |
| `src/app/termos-de-uso/page.tsx:80` | telefone + e-mail |
| `src/components/site/HadassaForm.tsx:98` | placeholder de telefone |
| `src/app/agendar/BookingFlow.tsx:601` | placeholder de telefone |
| `src/lib/defaults.ts` | **todo o seed** (`site.*`, `seo.*`, `about.*`, `hero.*`, `payment.*`, `notifications.*`, `DEFAULT_TESTIMONIALS`) |

> 📌 **Detalhe que engana:** o `defaults.ts` só roda **na primeira criação do
> banco**. Trocar ele **não muda o site que está no ar** — muda a instalação
> **futura do comprador**. Ou seja: são **duas** limpezas diferentes, e as
> duas precisam acontecer.
>
> - Site no ar → painel `/admin`
> - Repositório entregue → `defaults.ts` + as 3 páginas de política

#### 3c. Depois de trocar, conferir de fora

```bash
curl -s https://studiolisoespelhado.com.br/ | grep -icE 'wa\.me|@gmail|cnpj'
curl -s https://studiolisoespelhado.com.br/politica-de-agendamento | grep -i 'rua\|avenida'
exiftool -r -all= public/uploads/     # tirar GPS das fotos
```


---

## 🔁 Como dar deploy sem perder o build

⚠️ **Aula de 04/10:** `ssh "bash script.sh"` com build longo → o SSH caiu em
15 min e o comando **continuou rodando** no servidor (deu certo por sorte).
Desta vez o deploy foi para `docker compose build && up -d` junto, e funcionou.

Forma segura (não depende da conexão ficar viva):

```bash
# 1) subir o script
scp -i <CHAVE> deploy3.sh ubuntu@<IP>:/home/ubuntu/

# 2) rodar desanexado (sobrevive ao SSH cair)
ssh -i <CHAVE> ubuntu@<IP> \
  "setsid nohup bash /home/ubuntu/d3.sh > /home/ubuntu/d3.log 2>&1 < /dev/null &"

# 3) acompanhar
ssh -i <CHAVE> ubuntu@<IP> "tail -f /home/ubuntu/d3.log"   # Ctrl+C só sai do tail
```

O `d3.sh` já faz: `git pull` → `sed` da senha → `docker compose build` →
`up -d` → `ps` → logs do Caddy.

**Estados que o servidor pode ter (útil pra depurar):**

```bash
sudo docker compose ps
sudo docker compose logs --tail=40 caddy
curl -I https://studiolisoespelhado.com.br/     # deve ser 200
curl -I http://studiolisoespelhado.com.br/      # deve ser 308 -> https
```

**Rollback se o Caddy der problema** (volta ao modo antigo, só porta 80):

```bash
cd /home/ubuntu/app
git revert HEAD && bash /home/ubuntu/d3.sh
```

---

## 🧭 Decisões que já foram tomadas (não reabrir)

- **Instância:** `VM.Standard.E2.1.Micro` — o `A1.Flex` não teve capacidade
  na região. Always Free elegível.
- **HTTPS:** Caddy + Let's Encrypt automático (sem cron/certbot).
- **Caddy na frente:** o Next **não** publica mais a 80; ele fica só em
  `127.0.0.1:3000`. Portas 80/443 são do Caddy.
- **`SITE_URL` em runtime** (`build.args` + `environment`) — não `NEXT_PUBLIC_*`,
  porque isso seria embutido no bundle no build.
- **Verificação do Google:** etiqueta HTML, constante `GOOGLE_SITE_VERIFICATION`
  (vazia = não emite meta).
- **Canonical:** `alternates: { canonical: "./" }` no root — o Next resolve `./`
  contra o pathname atual, então cada rota emite o próprio.
  (Fonte: `node_modules/next/dist/lib/metadata/resolvers/resolve-url.js`.)
