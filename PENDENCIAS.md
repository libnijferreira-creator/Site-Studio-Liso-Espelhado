# ⚙️ Onde paramos — retomada

> **ARQUIVO INTERNO.** Apagar este arquivo antes de entregar/vender o site.
> Não contém senhas nem dados pessoais.

Atualizado em: **04/10/2026**

---

## ✅ Pronto (não refazer)

| # | Item | Evidência |
|---|---|---|
| 1 | Instância na nuvem no ar | `VM.Standard.E2.1.Micro`, Ubuntu 22.04, 1 GB + swap 4 GB |
| 2 | Site publicado e respondendo | `http://<IP>/` → **HTTP 200** |
| 3 | Porta **80** aberta | testada de fora |
| 4 | Porta **443** aberta | regra `0.0.0.0/0 TCP 443` criada na security list |
| 5 | Sitemap e robots apontando para a URL certa | 11/11 URLs com HTTP 200 |
| 6 | Zero `localhost` no HTML | `grep -c localhost` = 0 |
| 7 | Bug de build corrigido | seed de `settings` quebrava o prerender da home |
| 8 | `Caddyfile` criado e **commitado** | commit `5bc89d2` |
| 9 | Hook do Search Console no `layout.tsx` | commit `5bc89d2` |
| 10 | **Registros A gravados no registrador** | sobrevivem a reload completo da página |

Repo: `<SEU_REPO>` · branch `main` · último commit `5bc89d2`

---

## ⏳ Pendente (o que falta amanhã)

### 1. Esperar a publicação DNS ⭐ **prioridade**
O registrador mostra "servidores DNS em transição" (bloqueio de domínio
recém-registrado). Os registros já estão salvos, mas a zona autoritativa
ainda não os recebeu.

Conferir:
```bash
curl -s -H 'accept: application/dns-json' \
  'https://dns.google/resolve?name=<SEU_DOMINIO>&type=A'
```
- `Answer` com o IP → **pronto, siga para o passo 2**
- `Status 0` + `Answer: []` → ainda não publicou

> Um monitor de 55 min foi lançado em 04/10. Se a máquina desligar,
> ele morre — basta rodar o comando acima de novo.

### 2. Subir o Caddy + trocar a URL base
- Adicionar o serviço `caddy` ao `docker-compose.yml`
- Tirar o mapeamento público `80:3000` do serviço `studio` (conflito de porta)
- Trocar as **2 linhas** `SITE_URL` de `<IP>` para `https://<SEU_DOMINIO>`
- `git push` → no servidor: `git pull && docker compose up -d --build`
- Validar: `https://<SEU_DOMINIO>/` e `/sitemap.xml`

### 3. Search Console
1. Gerar etiqueta (Prefixo de URL → método **Etiqueta HTML**)
2. Colar em `GOOGLE_SITE_VERIFICATION` em `src/app/layout.tsx`
3. Deploy
4. Concluir verificação → **enviar sitemap** → **solicitar indexação da home**

---

## 🔁 Comandos de retomada

```bash
# entrar no servidor
ssh -i <CHAVE_SSH> ubuntu@<IP_DA_INSTANCIA>

# estado
cd /home/ubuntu/app && docker compose ps
docker compose logs --tail=50

# deploy após mudanças
git pull && docker compose up -d --build

# rollback se o Caddy der problema (volta ao modo atual, só porta 80)
git revert HEAD && git pull && docker compose up -d --build
```

---

## 🧭 Decisões que já foram tomadas (não reabrir)

- **Instância:** `VM.Standard.E2.1.Micro` — o `A1.Flex` nunca teve capacidade
  na região. É *Always Free elegível*.
- **Domínio:** escolhido por já ser a marca (o e-mail e o perfil social já
  usavam esse nome).
- **HTTPS:** Caddy com Let's Encrypt automático (nada de cron/certbot).
- **Verificação do Google:** por etiqueta HTML (constante no `layout.tsx`,
  vazia = não emite meta).
- **Sem tag `canonical` ainda** — apontaria URL errada até o DNS funcionar.

---

## 📋 Ordem sugerida de amanhã

1. Conferir DNS (1 comando)
2. Subir Caddy + trocar `SITE_URL`
3. Search Console → sitemap → pedir indexação
4. Limpeza final de dados pessoais (seção 7 do `RUNBOOK.md`)
