export type User = {
  id: string;
  nome: string;
  email: string;
  empresa?: string;
  telefone?: string;
  avatar_url?: string;
  role?: 'user' | 'admin';
  nicho?: string;
  objetivo?: string;
};

export type LeadStatus = 'novo' | 'atendimento' | 'fechado' | 'parado';


export type Lead = {
  id: string;
  user_id: string;
  nome: string;
  telefone: string;
  status: LeadStatus;
  ultima_mensagem?: string;
  ultima_atividade?: string;
  origem?: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversa_id: string;
  mensagem: string;
  origem: 'cliente' | 'ia' | 'humano';
  created_at: string;
};

export type Conversation = {
  lead_id: string;
  lead_nome: string;
  lead_telefone: string;
  ultima_mensagem: string;
  ultima_msg_at: string;
  ultima_origem: 'cliente' | 'ia' | 'humano';
  unreadCount?: number;
};

export type AgentType = 'sdr' | 'atendimento' | 'agendamento' | 'followup' | 'custom';

export type Agent = {
  id: string;
  user_id: string;
  nome: string;
  descricao?: string;
  tipo: AgentType;
  avatar_url?: string;
  tom: string;
  prompt: string;
  ativo: boolean;
  created_at: string;
};

export type Appointment = {
  id: string;
  user_id: string;
  lead_id?: string;
  nome: string;
  telefone?: string;
  data_agendamento: string;
  hora_agendamento: string;
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  observacoes?: string;
  created_at: string;
};

