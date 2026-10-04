# Runbook — publicar um site Next.js com Docker + HTTPS + SEO

Documento **portátil e anonimizado**: serve para qualquer site novo.
Aqui **não** há dados pessoais (sem CPF/CNPJ, nomes, telefones, e-mails
pessoais ou senhas). Tudo que for específico de um projeto usa o
placeholder `<...>` para você trocar.

---

## 1. Arquitetura

```
                    ┌─────────────────────────────┐
   usuário ──HTTP──▶│  Caddy (:80/:443)           │  HTTPS automático
                    │  Let's Encrypt, renovação   │  (sem cron/certbot)
                    └──────────────┬──────────────┘
                                   │ reverse_proxy
                    ┌──────────────▼──────────────┐
                    │  Next.js (:3000)  container │
                    │  volumes: ./data, ./uploads │
                    └─────────────────────────────┘
```

- **Servidor:** VPS Ubuntu 22.04+ com 1 GB RAM → **swap de 4 GB obrigatório**
- **Imagem base:** `node:20-alpine` (build multi-stage)
- **Portas expostas:** só `80` e `443`

---

## 2. Provisionar a máquina

```bash
# 1 GB de RAM é pouco para o build do Next.js — crie swap antes de tudo
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

**Regras de firewall / security list (obrigatórias):**

| Porta | Origem | Motivo |
|---|---|---|
| 22   | 0.0.0.0/0 | SSH |
| 80   | 0.0.0.0/0 | HTTP + desafio Let's Encrypt |
| 443  | 0.0.0.0/0 | HTTPS |

> ⚠️ Em provedores com *security list* separada (Oracle Cloud, GCP),
> abrir no **host** não basta — a lista também precisa liberar.
> Teste de fora antes de seguir: `curl -I https://<SEU_IP>`.

---

## 3. Registros DNS

Dois registros **A** — é o que faz o domínio funcionar:

| Nome | Tipo | Valor |
|---|---|---|
| *(vazio)* | A | `<IP_DA_INSTANCIA>` |
| `www` | A | `<IP_DA_INSTANCIA>` |

Onde encontrar: painel do registrador → domínio → **Configurar zona DNS**
(ou *DNS zone*). Em registradores com "modo básico", **troque para o modo
avançado** — o modo básico não tem campo de registro A.

**Checklist clássico (os erros que mais atrasam):**

- [ ] Modo **avançado** ativo (o básico só faz redirect de URL)
- [ ] Campo **Nome** preenchido como descrito acima (`vazio` = raiz)
- [ ] Clicou em **Adicionar/Inserir** *antes* de salvar (senão a linha some)
- [ ] Clicou em **Salvar alterações** no fim
- [ ] Esperou o ciclo de publicação (geralmente 5 min; domínio recém-registrado pode levar horas)

**Como conferir de verdade** (sem enganar com cache):

```bash
# servidor autoritativo — responde sem cache
dig @<NS1> <SEU_DOMINIO> A +short
# ou via DoH (Google), mostra a seção Authority
curl -s -H 'accept: application/dns-json' \
  'https://dns.google/resolve?name=<SEU_DOMINIO>&type=A'
```

Interpretação:
- `Status: 0` + `Answer: []` → zona existe, **registro faltando**
- `Status: 3` → nome não existe (NXDOMAIN)
- `Authority` com SOA do **seu** domínio → a resposta veio da zona certa

---

## 4. Deploy

```bash
git clone <SEU_REPO> && cd <projeto>
# edite docker-compose.yml: SITE_URL e ADMIN_PASSWORD
docker compose up -d --build
```

Alterações depois disso:

```bash
git pull
docker compose up -d --build      # build ~6 min em máquina de 1 GB
```

**Variáveis que precisam existir (não commite valores reais):**

| Variável | Onde | Observação |
|---|---|---|
| `SITE_URL` | `build.args` **e** `environment` | aparece em **dois** lugares de propósito |
| `ADMIN_PASSWORD` | `environment` | só vale na 1ª inicialização |
| `DATABASE_PATH` | `environment` | aponte para o volume `./data` |

> `SITE_URL` precisa estar nos dois: `build.args` grava no HTML pré-renderizado,
> `environment` é o que `/sitemap.xml` e `/robots.txt` leem em runtime.
> Use `NEXT_PUBLIC_*` **não** serve para isso — o Next embute o valor no build.

---

## 5. HTTPS (Caddy)

`Caddyfile` — obtém e renova o certificado sozinho:

```
<SEU_DOMINIO>, www.<SEU_DOMINIO> {
	reverse_proxy studio:3000
}

http://<IP_DA_INSTANCIA> {
	reverse_proxy studio:3000
}
```

`docker-compose.yml`:

```yaml
  caddy:
    image: caddy:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
```

> O certificado só sai depois que o **DNS já aponta** (desafio HTTP-01 na porta 80).
> O bloco `http://<IP>` é reserva: mantém o site no ar pelo IP enquanto isso.

---

## 6. SEO — checklist completo

No código:

- [ ] `metadataBase` vem de `SITE_URL` em runtime (nunca fixo, nunca `localhost`)
- [ ] `src/app/sitemap.ts` com `export const dynamic = "force-dynamic"`
- [ ] `src/app/robots.ts` com `export const dynamic = "force-dynamic"`
- [ ] `<meta name="robots" content="index, follow">`
- [ ] Nenhuma ocorrência de `localhost` no HTML gerado

```bash
# validação rápida — deve dar 0
curl -s http://<SEU_DOMINIO>/ | grep -c localhost

# todas as URLs do sitemap devem responder 200
curl -s http://<SEU_DOMINIO>/sitemap.xml | grep -o '<loc>[^<]*' 
```

No Google Search Console:

1. **Adicionar propriedade** → Prefixo de URL → `<SEU_DOMINIO>`
2. Método **Etiqueta HTML** → copie só o valor de `content="..."`
3. Cole na constante `GOOGLE_SITE_VERIFICATION` (em `src/app/layout.tsx`)
   e faça deploy. **Deixe vazia enquanto não tiver a tag real** —
   o Google rejeita placeholder.
4. **Enviar sitemap** → `https://<SEU_DOMINIO>/sitemap.xml`
5. **Solicitar indexação** da home

**Prazos realistas:**
- verificação da propriedade: minutos
- primeira indexação de site novo: **3 a 7 dias**
- ranquear bem: **semanas a meses**
- Backlinks (bio do Instagram, Google Meu Negócio) aceleram bastante

---

## 7. Antes de VENDER o site — limpar dados pessoais

Nada disto deve ir junto na venda:

- [ ] **Titular do domínio** no registrador (CPF/CNPJ) → transferir o domínio
- [ ] **Contatos** do domínio (administrativo/técnico/cobrança)
- [ ] E-mail de contato exibido no site (`contato@...`)
- [ ] Telefone / WhatsApp no site e no JSON-LD
- [ ] Links de redes sociais (`@usuario`)
- [ ] Texto "Sobre" com nomes de pessoas
- [ ] Razão social / CNPJ no rodapé ou em `/sobre`
- [ ] Nome de usuário e e-mails de admin no banco (`admins`)
- [ ] Chaves de pagamento (Mercado Pago) em variáveis de ambiente
- [ ] **EXIF/GPS das fotos** publicadas
- [ ] Nome do usuário do GitHub no remote do repositório
- [ ] Logs e `.env` do servidor

```bash
# conferir texto pessoal no HTML
curl -s http://<SEU_DOMINIO>/ | grep -iE 'cpf|cnpj|@gmail|whatsapp|wa.me'

# limpar localização das fotos
exiftool -r -all= public/uploads/
```

---

## 8. O que NUNCA commitar

`.gitignore` já cobre — confira antes de cada push:

```
*.key
deploy/oracle/oracle_key*
data/*.db*
public/uploads/
.env*
*.log
```

```bash
# última linha de defesa antes do push
git grep -iE 'password|secret|api[_-]?key|BEGIN .*PRIVATE' -- . ':!*.md'
```

---

## 9. Trocar de domínio / clonar para outro site

1. `SITE_URL` nos **dois** lugares do `docker-compose.yml`
2. Nome no `Caddyfile` (bloco de domínio)
3. Nome/descrição em `src/lib/defaults.ts` (ou `settings` do banco)
4. `NEXT_PUBLIC_*` não esquecer de limpar caches — `.next/` é refeito no build
5. Banco novo: apagar `data/*.db` para o `seed()` recriar com os padrões
6. Novo Search Console, novo sitemap, novo registro A
