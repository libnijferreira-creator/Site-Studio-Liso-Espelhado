/**
 * Escolhe os serviços de cabelo e de unha direto do banco — assim os scripts
 * não dependem de id fixo: a administração pode editar, remover ou recriar
 * serviços pelo painel que os testes continuam válidos.
 *
 * Preferências:
 *  - cabelo: ativo, NÃO da categoria "Sobrancelhas" (que não pede tamanho)
 *    e com a MENOR duração — assim há mais horários livres por dia e os
 *    testes não falham por causa de agendamentos já existentes na agenda;
 *  - unhas: ativo com a menor duração (mesma lógica).
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

export function pegarServicos() {
  const db = new DatabaseSync(
    path.join(process.cwd(), "data", "studio.db"),
    { readOnly: true }
  );
  try {
    const cabelo = db
      .prepare(
        `SELECT id, name, price_cents, duration_min
           FROM services
          WHERE status = 'active'
            AND track = 'hair'
            AND COALESCE(category, '') <> 'Sobrancelhas'
          ORDER BY duration_min ASC, id
          LIMIT 1`
      )
      .get();

    const unhas = db
      .prepare(
        `SELECT id, name, price_cents, duration_min
           FROM services
          WHERE status = 'active' AND track = 'nails'
          ORDER BY duration_min ASC, id
          LIMIT 1`
      )
      .get();

    if (!cabelo) {
      throw new Error("Nenhum serviço de CABELO ativo no banco (painel → Serviços).");
    }
    if (!unhas) {
      throw new Error("Nenhum serviço de UNHA ativo no banco (painel → Serviços).");
    }
    return { cabelo, unhas };
  } finally {
    db.close();
  }
}
