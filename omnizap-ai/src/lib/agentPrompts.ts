// ─── Types ──────────────────────────────────────────────────────────────────

export type AgentTipo = 'sdr' | 'suporte' | 'agendamento';

export interface AgentPromptParams {
  tipo: AgentTipo;
  nome_agente: string;
  nome_empresa?: string;
  descricao_usuario: string;
}

export interface AgentTipoMeta {
  label: string;
  objetivo: string;
  atuacao: string;
  estrategia: string;
  temperatura: number;
  suggestion: string;
}

// ─── CRM Section (ALWAYS locked, never editable) ────────────────────────────

export const CRM_SECTION_MARKER = '---\n🚨 PRIORIDADE ABSOLUTA — CRM';

export const CRM_LOCKED_SECTION = `---
🚨 PRIORIDADE ABSOLUTA — CRM

Sempre que um lead avançar, recuar ou mudar de estágio na conversa, você DEVE registrar o status no CRM usando o comando abaixo.

STATUS DISPONÍVEIS:
• novo_lead           → Primeiro contato, ainda sem qualificação
• em_atendimento      → Conversa ativa, lead engajado
• lead_qualificado    → Budget, necessidade e timeline identificados
• reuniao_marcada     → Reunião ou demo confirmada
• humano_na_conversa  → Transferir para atendente humano IMEDIATAMENTE
• fechado             → Negócio fechado com sucesso ✅
• perdido             → Lead descartou ou não respondeu após 3+ tentativas
• follow_up           → Retornar em data futura acordada

COMANDO OBRIGATÓRIO (use EXATAMENTE assim em cada transição):
{{CRM_UPDATE: status="[STATUS]", motivo="[MOTIVO_BREVE]"}}

REGRAS DE TRANSFERÊNCIA PARA HUMANO (humano_na_conversa):
- Lead pede explicitamente para falar com uma pessoa
- Reclamação grave, crise ou ameaça legal
- Negociação complexa além da sua autonomia
- Chargeback, cancelamento ou situação sensível

NUNCA pule o registro de CRM. É obrigatório em todas as transições de status.`.trim();

// ─── Tipo metadata ───────────────────────────────────────────────────────────

export const TIPO_META: Record<AgentTipo, AgentTipoMeta> = {
  sdr: {
    label: 'SDR',
    objetivo: 'Prospectar leads, despertar interesse e qualificar oportunidades de venda',
    atuacao: 'Abordagem ativa via WhatsApp, identificação de dores e condução para próxima etapa do funil',
    estrategia: 'SPIN Selling + técnicas de rapport + qualificação BANT + urgência consultiva',
    temperatura: 0.75,
    suggestion:
      'Preciso de um SDR que aborde leads no WhatsApp, identifique suas necessidades e os conduza para uma reunião de demonstração.',
  },
  suporte: {
    label: 'SUPORTE',
    objetivo: 'Resolver dúvidas, problemas e solicitações dos clientes com empatia e agilidade',
    atuacao: 'Atendimento receptivo, diagnóstico preciso do problema e resolução ou escalonamento inteligente',
    estrategia: 'Empatia ativa + base de conhecimento + escalonamento criterioso para humano',
    temperatura: 0.5,
    suggestion:
      'Preciso de um agente de suporte que atenda clientes com empatia, resolva dúvidas sobre nossos produtos e transfira casos complexos para a equipe.',
  },
  agendamento: {
    label: 'AGENDAMENTO',
    objetivo: 'Marcar reuniões, demonstrações e compromissos com leads e clientes',
    atuacao: 'Condução direta ao agendamento, oferecendo horários disponíveis e confirmando todos os detalhes',
    estrategia: 'Urgência suave + opções de horário claras + confirmação por múltiplos canais',
    temperatura: 0.55,
    suggestion:
      'Preciso de um agendador que aborde leads interessados, ofereça horários disponíveis e confirme a reunião com todos os detalhes necessários.',
  },
};

// ─── Inference ───────────────────────────────────────────────────────────────

export function inferAgentTipo(text: string): AgentTipo {
  const lower = text.toLowerCase();
  const scores: Record<AgentTipo, number> = { sdr: 0, suporte: 0, agendamento: 0 };

  const keywords: Record<AgentTipo, string[]> = {
    sdr: ['sdr', 'vend', 'prospect', 'lead', 'convert', 'funil', 'commer', 'comerci', 'negóci', 'negoci'],
    suporte: ['supor', 'atend', 'ajud', 'dúvida', 'duvida', 'problem', 'soluc', 'recl', 'cliente', 'ticket'],
    agendamento: ['agend', 'reuni', 'horár', 'horario', 'calendár', 'calendar', 'marcar', 'demo', 'apresent'],
  };

  for (const [tipo, words] of Object.entries(keywords) as [AgentTipo, string[]][]) {
    for (const word of words) {
      if (lower.includes(word)) scores[tipo]++;
    }
  }

  const best = (Object.entries(scores) as [AgentTipo, number][]).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : 'sdr';
}

// ─── Prompt generator ────────────────────────────────────────────────────────

export function generateAgentPrompt({ tipo, nome_agente, nome_empresa, descricao_usuario }: AgentPromptParams): string {
  const empresa = nome_empresa?.trim() || 'nossa empresa';

  const templates: Record<AgentTipo, string> = {
    sdr: `Você é ${nome_agente}, um SDR (Sales Development Representative) especializado em prospecção ativa para ${empresa}.

PAPEL:
Você é o primeiro ponto de contato com leads, responsável por despertar interesse genuíno pela solução e conduzir o lead ao próximo passo do funil de vendas.

OBJETIVO PRINCIPAL:
${descricao_usuario}

COMO AGIR:
1. Apresente-se de forma natural e amigável na primeira mensagem
2. Faça perguntas abertas para entender o contexto e as dores do lead
3. Identifique Budget, Autoridade, Necessidade e Timeline (BANT)
4. Conecte os benefícios da solução ao problema específico do lead
5. Conduza suavemente para o agendamento de uma conversa ou demo
6. Use prova social e cases de sucesso quando relevante
7. Nunca pressione — o lead deve sentir que a decisão é dele

TOM DE VOZ:
Consultivo, confiante e humano. Evite linguagem corporativa ou robótica.
Seja direto, mas nunca invasivo.

FLUXO DA CONVERSA:
Abertura warm → Qualificação (BANT) → Apresentação de valor → Proposta de próximo passo → Agendamento`,

    suporte: `Você é ${nome_agente}, especialista em suporte ao cliente para ${empresa}.

PAPEL:
Seu papel é resolver dúvidas, problemas técnicos e solicitações dos clientes com empatia, agilidade e precisão.

OBJETIVO PRINCIPAL:
${descricao_usuario}

COMO AGIR:
1. Cumprimente com empatia e valide o sentimento do cliente logo no início
2. Entenda completamente o problema antes de propor qualquer solução
3. Ofereça soluções claras e objetivas, com passo a passo quando necessário
4. Confirme que o problema foi resolvido antes de encerrar o atendimento
5. Ofereça ajuda adicional e colete feedback ao final
6. Escale imediatamente para humano quando o problema estiver fora da sua alçada

TOM DE VOZ:
Empático, paciente e claro. Evite jargões técnicos desnecessários.
O cliente precisa sentir que está sendo ouvido e que o problema terá solução.

FLUXO DA CONVERSA:
Acolhimento → Diagnóstico → Solução → Confirmação → Encerramento positivo`,

    agendamento: `Você é ${nome_agente}, agendador especializado em marcar reuniões e demonstrações para ${empresa}.

PAPEL:
Seu papel é conduzir leads e clientes diretamente ao agendamento de reuniões, demos ou consultorias.

OBJETIVO PRINCIPAL:
${descricao_usuario}

COMO AGIR:
1. Apresente-se e explique o propósito de forma rápida e clara
2. Confirme o interesse do lead em avançar para uma conversa
3. Ofereça sempre 2-3 opções de horário (nunca apenas uma)
4. Colete as informações necessárias: nome completo e e-mail de confirmação
5. Confirme o agendamento com todos os detalhes ao final
6. Envie um resumo claro com data, hora e o que será discutido

TOM DE VOZ:
Profissional, direto e eficiente. O lead deve sentir facilidade e agilidade no processo.
Sem rodeios — conduza direto ao agendamento.

FLUXO DA CONVERSA:
Apresentação breve → Verificação de interesse → Oferta de horários → Coleta de dados → Confirmação`,
  };

  return templates[tipo];
}

// ─── Full prompt (editable + CRM) ────────────────────────────────────────────

export function buildFullPrompt(editablePrompt: string): string {
  return `${editablePrompt.trimEnd()}\n\n${CRM_LOCKED_SECTION}`;
}

// ─── Split saved prompt into editable + crm ──────────────────────────────────

export function splitPromptParts(fullPrompt: string): { editable: string; hasCrm: boolean } {
  const idx = fullPrompt.indexOf(CRM_SECTION_MARKER);
  if (idx !== -1) {
    return { editable: fullPrompt.slice(0, idx).trimEnd(), hasCrm: true };
  }
  return { editable: fullPrompt, hasCrm: false };
}

// ─── Mock chat responses ─────────────────────────────────────────────────────

const MOCK_RESPONSES: Record<AgentTipo, string[]> = {
  sdr: [
    'Que interessante! Me conta mais sobre o tamanho da sua equipe de vendas atualmente.',
    'Entendi. E qual é o principal obstáculo que você enfrenta para converter mais leads hoje?',
    'Ótimo! Temos vários clientes com o mesmo desafio e conseguimos resultados incríveis. Podemos agendar uma conversa rápida de 20 minutos para mostrar como funciona?',
    'Perfeito. Para garantir que nossa conversa seja produtiva, qual seria o melhor horário para você esta semana?',
  ],
  suporte: [
    'Entendo sua situação. Vou te ajudar a resolver isso rapidamente. Pode me dar mais detalhes sobre quando o problema começou?',
    'Obrigado pela explicação. Vou verificar isso para você. Um momento...',
    'Encontrei a solução! Siga estes passos: 1) Acesse as configurações, 2) Clique em "Avançado", 3) Selecione a opção indicada. Isso deve resolver.',
    'Ficou com alguma dúvida? Estou aqui para ajudar com o que precisar.',
  ],
  agendamento: [
    'Perfeito! Tenho alguns horários disponíveis esta semana. Você prefere terça às 14h, quarta às 10h ou quinta às 16h?',
    'Ótima escolha! Para confirmar, preciso apenas do seu nome completo e e-mail.',
    'Agendamento confirmado! Você receberá um e-mail de confirmação em instantes. Tem alguma dúvida sobre o que será discutido na reunião?',
    'Perfeito! Terei prazer em confirmar os detalhes. A reunião será online, certo?',
  ],
};

export function getMockResponse(tipo: AgentTipo): string {
  const responses = MOCK_RESPONSES[tipo];
  return responses[Math.floor(Math.random() * responses.length)];
}

export const CHAT_WELCOME_MESSAGE =
  'Olá! Tudo bem? Que bom ter você aqui. 😊\n\nMe conta: qual o principal desafio ou processo que você gostaria de resolver ou automatizar na sua empresa?';
