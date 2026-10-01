import { LegalPage, legalMetadata } from "@/components/site/LegalPage";

export const metadata = legalMetadata(
  "Política de Privacidade — Studio Liso Espelhado",
  "Como o Studio Liso Espelhado com Beatriz Ribeiro coleta, usa e protege os seus dados pessoais, em conformidade com a LGPD."
);

export default function PrivacidadePage() {
  return (
    <LegalPage
      eyebrow="LGPD · Lei 13.709/2018"
      title="Política de"
      highlight="Privacidade"
      description="Transparência sobre os dados que coletamos no agendamento online e como eles são tratados."
      updated="30 de setembro de 2026"
      sections={[
        {
          h: "Quem somos",
          p: [
            "O Studio Liso Espelhado com Beatriz Ribeiro, localizado na Rua Roberto Cotrim, 519 — Bairro Campo Alegre, Itatiaia/RJ, é o controlador dos dados pessoais coletados neste site e no sistema de agendamento online.",
            "Este documento explica, em linguagem simples, quais dados solicitamos, para que usamos e quais são os seus direitos.",
          ],
        },
        {
          h: "Dados que coletamos",
          p: [
            "Coletamos apenas o necessário para realizar o seu agendamento e entrar em contato com você:",
          ],
          ul: [
            "Nome completo",
            "Número de WhatsApp",
            "E-mail (opcional)",
            "CPF (opcional, exigido apenas em alguns fluxos de pagamento)",
            "Observações que você escrever sobre o seu cabelo ou atendimento",
            "Data, horário, serviço escolhido e código da reserva",
          ],
        },
        {
          h: "Para que usamos os dados",
          ul: [
            "Confirmar, remarcar ou cancelar o seu agendamento",
            "Enviar lembretes antes do atendimento",
            "Processar a taxa de reserva de 15% e comprovar o pagamento",
            "Cumprir obrigações legais e fiscais",
            "Melhorar a experiência do site (dados de navegação, de forma agregada)",
          ],
        },
        {
          h: "Base legal do tratamento",
          p: [
            "Tratamos os seus dados com base no seu consentimento, dado no momento do agendamento (art. 7º, I, da LGPD) e na execução do contrato entre você e o Studio (art. 7º, V).",
            "Você pode revogar o consentimento a qualquer momento, pelos canais indicados ao final.",
          ],
        },
        {
          h: "Compartilhamento",
          p: [
            "Não vendemos nem alugamos dados pessoais. O compartilhamento ocorre apenas com:",
          ],
          ul: [
            "Mercado Pago — processamento do pagamento da taxa de reserva, tratando os dados financeiros necessários à cobrança.",
            "Provedor de e-mail e WhatsApp — apenas para o envio das confirmações que você solicitou.",
            "Prestadores de hospedagem do site, sujeitos a obrigação de confidencialidade.",
          ],
        },
        {
          h: "Segurança e retenção",
          p: [
            "Os dados ficam armazenados em banco de dados local, com acesso restrito à administradora do Studio. A conexão do site é criptografada (HTTPS).",
            "Mantemos os registros de agendamento por até 5 anos, prazo necessário para questões fiscais e de prova. Encerrado esse período, os dados são anonimizados ou excluídos.",
          ],
        },
        {
          h: "Os seus direitos (art. 18 da LGPD)",
          table: [
            { k: "Confirmação e acesso", v: "Saber se tratamos os seus dados e solicitar uma cópia." },
            { k: "Correção", v: "Corrigir dados incompletos ou desatualizados." },
            { k: "Anonimização / eliminação", v: "Pedir a exclusão dos dados não mais necessários." },
            { k: "Revogação do consentimento", v: "Retirar o consentimento a qualquer momento." },
            { k: "Informação sobre compartilhamento", v: "Saber com quem os dados foram compartilhados." },
          ],
        },
        {
          h: "Cookies",
          p: [
            "Este site usa apenas cookies estritamente necessários: um cookie de sessão para manter você logado no painel administrativo e os dados técnicos de navegação.",
            "Não utilizamos cookies de publicidade nem de rastreamento entre sites.",
          ],
        },
        {
          h: "Como exercer os seus direitos",
          p: [
            "Solicitações sobre dados pessoais devem ser feitas pelo WhatsApp (24) 98153-1771 ou pelo e-mail contato@studiolisoespelhado.com.br, com assunto “Dados Pessoais — LGPD”.",
            "Responderemos em até 15 dias, conforme o art. 19 da LGPD.",
          ],
        },
      ]}
    />
  );
}
