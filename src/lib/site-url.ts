/**
 * URL base pública do site, lida em TEMPO DE EXECUÇÃO.
 *
 * Por que uma variável sem o prefixo `NEXT_PUBLIC_`:
 * o Next.js inlinea `NEXT_PUBLIC_*` no bundle durante o BUILD. Como o build
 * do Docker acontece antes de sabermos o IP/domínio, o valor antigo virava
 * `http://localhost:3000` dentro do XML e o Google não conseguia seguir o
 * sitemap. `SITE_URL` não é inlineada, então é lida do ambiente do container
 * a cada requisição — trocar o endereço vira uma edição no compose.
 *
 * Ordem: SITE_URL (runtime) → NEXT_PUBLIC_BASE_URL (build) → localhost.
 */
export function siteBaseUrl(): string {
  const raw =
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    "http://localhost:3000";

  // remove barra final para não gerar "//" nas URLs montadas
  return raw.replace(/\/+$/, "");
}
