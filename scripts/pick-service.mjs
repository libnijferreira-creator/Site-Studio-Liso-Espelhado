/**
 * Imprime em JSON os serviços usados pela verificação (id + nome + valor).
 * Uso: node scripts/pick-service.mjs   →   {"hair":1,"hairName":"...","nails":7}
 */
import { pegarServicos } from "./lib-services.mjs";

const { cabelo, unhas } = pegarServicos();
console.log(
  JSON.stringify({
    hair: cabelo.id,
    hairName: cabelo.name,
    hairPrice: cabelo.price_cents,
    nails: unhas.id,
    nailsName: unhas.name,
  })
);
