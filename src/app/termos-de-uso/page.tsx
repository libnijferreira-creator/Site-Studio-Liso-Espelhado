import { LegalPage, legalMetadata } from "@/components/site/LegalPage";

export const metadata = legalMetadata(
  "Termos de Uso — Studio Liso Espelhado",
  "Regras de uso do site e do sistema de agendamento do Studio Liso Espelhado com Beatriz Ribeiro."
);

export default function TermosPage() {
  return (
    <LegalPage
      eyebrow="Condições de uso"
      title="Termos de"
      highlight="Uso"
      description="Ao navegar neste site ou fazer um agendamento, você concorda com as condições abaixo."
      updated="30 de setembro de 2026"
      sections={[
        {
          h: "Aceitação dos termos",
          p: [
            "Estes Termos de Uso regulam o acesso e o uso do site do Studio Liso Espelhado com Beatriz Ribeiro, incluindo o sistema de agendamento online.",
            "O uso do site implica a leitura e a aceitação integral destes termos. Caso não concorde, recomendamos que não utilize o sistema de agendamento.",
          ],
        },
        {
          h: "Sobre os serviços",
          p: [
            "O Studio oferece serviços de tratamento capilar, finalização e procedimentos estéticos, executados por profissionais habilitados, com produtos originais e dentro das normas sanitárias vigentes.",
            "Os valores, durações e descrições de cada serviço são informados no site e podem ser atualizados a qualquer momento, sem aviso prévio.",
          ],
        },
        {
          h: "Responsabilidades da cliente",
          ul: [
            "Informar dados verdadeiros e atualizados no formulário de agendamento.",
            "Chegar com até 10 minutos de antecedência ao horário reservado.",
            "Comunicar remarcações ou cancelamentos com pelo menos 24 horas de antecedência.",
            "Relatar alergias, condições do couro cabeludo ou uso de medicamentos antes do procedimento.",
            "Seguir as orientações de cuidado pós-atendimento.",
          ],
        },
        {
          h: "Responsabilidades do Studio",
          ul: [
            "Reservar o horário confirmado com prioridade exclusiva para a cliente.",
            "Executar o serviço contratado com técnica, higiene e produto adequado ao seu tipo de cabelo.",
            "Avisar com antecedência caso haja qualquer impedimento de atendimento.",
            "Manter o ambiente seguro, climatizado e privativo.",
          ],
        },
        {
          h: "Resultados e expectativas",
          p: [
            "Resultados dependem de fatores individuais como histórico químico, textura, porosidade e histórico de alisamentos. A avaliação feita na consulta presencial é parte integrante do serviço e prevalece sobre expectativas formadas apenas pela galeria de fotos.",
            "As imagens do site representam resultados reais de clientes, mas não constituem garantia de resultado idêntico em todos os casos.",
          ],
        },
        {
          h: "Propriedade intelectual",
          p: [
            "Marca, nome, logotipo, textos, fotografias e design deste site são propriedade do Studio Liso Espelhado com Beatriz Ribeiro ou de seus licenciantes.",
            "É proibida a reprodução total ou parcial do conteúdo sem autorização prévia por escrito.",
          ],
        },
        {
          h: "Limitação de responsabilidade",
          p: [
            "O Studio não se responsabiliza por danos decorrentes de informações incorretas fornecidas pela cliente, por desistência sem aviso ou por condições de saúde não declaradas no momento do atendimento.",
            "O sistema pode passar por manutenções programadas, nas quais o agendamento temporariamente fica indisponível.",
          ],
        },
        {
          h: "Legislação aplicável",
          p: [
            "Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de Itatiaia/RJ para dirimir eventuais controvérsias, sem prejuízo do foro do domicílio da consumidora.",
          ],
        },
        {
          h: "Contato",
          p: [
            "Dúvidas sobre estes termos: WhatsApp (24) 98153-1771 ou contato@studiolisoespelhado.com.br.",
          ],
        },
      ]}
    />
  );
}
