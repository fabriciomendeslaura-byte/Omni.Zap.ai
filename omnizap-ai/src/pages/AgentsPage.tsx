import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Bot, Zap, Trash2, Play, Pause, Send, User, Sparkles,
  Save, RefreshCw, MoreVertical, Search, Lock, CheckCircle2,
  ArrowRight, ChevronRight, MessageSquare, Settings, X, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../utils/cn';
import { Agent, AgentType } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import { WhatsAppConnect } from '../components/WhatsAppConnect';
import {
  AgentTipo,
  TIPO_META,
  CRM_LOCKED_SECTION,
  generateAgentPrompt,
  buildFullPrompt,
  splitPromptParts,
  inferAgentTipo,
  getMockResponse,
  CHAT_WELCOME_MESSAGE,
} from '../lib/agentPrompts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ViewState = 'create' | 'success' | 'edit';

interface ChatMessage {
  role: 'agent' | 'user';
  text: string;
  ts: number;
}

function agentTypeToTipo(tipo: AgentType): AgentTipo {
  if (tipo === 'sdr') return 'sdr';
  if (tipo === 'agendamento') return 'agendamento';
  return 'suporte'; // atendimento, followup, custom → suporte
}

const TONES = ['Profissional', 'Consultivo', 'Comercial', 'Técnico direto', 'Amigável'];
const MODELS = ['Gemini 2.5 Flash', 'Gemini 2.5 Pro', 'GPT-4o Mini', 'Claude Haiku'];

// ─── Logo component ───────────────────────────────────────────────────────────

const OmniLogo: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'lg' }) => (
  <div
    className={cn(
      'rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40',
      size === 'lg' ? 'w-20 h-20' : 'w-10 h-10'
    )}
  >
    <Zap className={cn('text-white fill-current', size === 'lg' ? 'w-10 h-10' : 'w-5 h-5')} />
  </div>
);

// ─── CREATE VIEW ─────────────────────────────────────────────────────────────

interface CreateViewProps {
  userName: string;
  onCreated: (agent: Agent) => void;
  createAgent: (data: Partial<Agent>) => Promise<Agent | null>;
}

const CreateView: React.FC<CreateViewProps> = ({ userName, onCreated, createAgent }) => {
  const [description, setDescription] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<AgentTipo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inferredTipo: AgentTipo = selectedTipo ?? (description.trim() ? inferAgentTipo(description) : 'sdr');
  const meta = TIPO_META[inferredTipo];

  const handleQuickSelect = (tipo: AgentTipo) => {
    setSelectedTipo(tipo);
    setDescription(TIPO_META[tipo].suggestion);
  };

  const handleSubmit = async () => {
    if (!description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const tipo = selectedTipo ?? inferAgentTipo(description);
    const meta = TIPO_META[tipo];

    const nomeAgente = `Agente ${meta.label}`;
    const editablePrompt = generateAgentPrompt({
      tipo,
      nome_agente: nomeAgente,
      descricao_usuario: description,
    });
    const fullPrompt = buildFullPrompt(editablePrompt);

    // Map AgentTipo → AgentType
    const agentType: AgentType = tipo === 'sdr' ? 'sdr' : tipo === 'agendamento' ? 'agendamento' : 'atendimento';

    const created = await createAgent({
      nome: nomeAgente,
      descricao: description,
      tipo: agentType,
      tom: meta.label,
      prompt: fullPrompt,
      ativo: true,
      avatar_url: `/avatars/male_1.png`,
      contexto: {
        model: 'Gemini 2.5 Flash',
        temperature: meta.temperatura,
        effort: 0.8,
      },
    });

    setIsSubmitting(false);

    if (created) {
      onCreated(created as Agent);
    } else {
      toast.error('Erro ao criar agente. Tente novamente.');
    }
  };

  return (
    <motion.div
      key="create"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="h-full flex flex-col items-center justify-center px-8 py-12 text-center"
    >
      {/* Logo */}
      <OmniLogo size="lg" />

      {/* Greeting */}
      <div className="mt-8 mb-10">
        <h1 className="text-3xl font-black tracking-tight mb-2">
          Olá, <span className="text-primary">{userName}</span>, bora criar seu novo agente!
        </h1>
        <p className="text-dark-muted-foreground text-sm">
          Descreva o que você quer que ele faça e a IA vai montar tudo para você.
        </p>
      </div>

      {/* Quick select buttons */}
      <div className="flex gap-3 mb-6 flex-wrap justify-center">
        {(['sdr', 'suporte', 'agendamento'] as AgentTipo[]).map((tipo) => (
          <button
            key={tipo}
            onClick={() => handleQuickSelect(tipo)}
            className={cn(
              'px-5 py-2.5 rounded-full border font-black text-xs uppercase tracking-widest transition-all',
              selectedTipo === tipo || (selectedTipo === null && inferredTipo === tipo && description)
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30'
                : 'bg-dark-card border-dark-border text-dark-muted-foreground hover:border-primary/50 hover:text-primary'
            )}
          >
            {TIPO_META[tipo].label}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <div className="w-full max-w-2xl relative">
        <textarea
          autoFocus
          rows={5}
          maxLength={5000}
          value={description}
          onChange={(e) => { setDescription(e.target.value); setSelectedTipo(null); }}
          placeholder="Descreva o que você quer que seu agente faça..."
          className="w-full bg-dark-card border-2 border-dark-border focus:border-primary rounded-2xl px-6 py-5 outline-none transition-all text-sm leading-relaxed resize-none shadow-xl"
        />
        <div className="absolute bottom-4 right-4 text-[10px] font-bold text-dark-muted-foreground">
          {description.length}/5000
        </div>
      </div>

      {/* Inferred type indicator */}
      {description.trim() && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 text-xs text-dark-muted-foreground"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Tipo inferido:
          <span className="font-black text-primary">{meta.label}</span>
          <span>·</span>
          <span className="italic">{meta.objetivo}</span>
        </motion.div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!description.trim() || isSubmitting}
        className="mt-8 bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 disabled:opacity-50 disabled:shadow-none active:scale-95"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Criando agente...
          </>
        ) : (
          <>
            Criar Agente
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </motion.div>
  );
};

// ─── SUCCESS VIEW ─────────────────────────────────────────────────────────────

interface SuccessViewProps {
  agent: Agent;
  onEdit: () => void;
  onCreateNew: () => void;
}

const SuccessView: React.FC<SuccessViewProps> = ({ agent, onEdit, onCreateNew }) => {
  const tipo = agentTypeToTipo(agent.tipo);
  const meta = TIPO_META[tipo];
  const { editable } = splitPromptParts(agent.prompt);
  const lineCount = editable.split('\n').length;

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      className="h-full flex flex-col items-center justify-center px-8 py-12 overflow-y-auto"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        className="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mb-8 shrink-0"
      >
        <CheckCircle2 className="w-12 h-12 text-green-400" />
      </motion.div>

      <h1 className="text-3xl font-black tracking-tight mb-2">Agente criado com sucesso!</h1>
      <p className="text-dark-muted-foreground text-sm mb-10">
        Aqui está um resumo do seu agente recém-criado:
      </p>

      <div className="w-full max-w-2xl space-y-4">
        {/* Summary card */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-dark-border">
              <img src={agent.avatar_url} alt={agent.nome} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-black text-lg">{agent.nome}</div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                <Zap className="w-3 h-3" />
                {meta.label}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'Objetivo', value: meta.objetivo },
              { label: 'Forma de atuação', value: meta.atuacao },
              { label: 'Estratégia', value: meta.estrategia },
              { label: 'Tom de voz', value: agent.tom || meta.label },
            ].map(({ label, value }) => (
              <div key={label} className="bg-dark-muted rounded-xl p-4 border border-dark-border">
                <div className="text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground mb-1">{label}</div>
                <div className="text-sm font-medium leading-snug">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical details */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
          <div className="text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground mb-4">
            Detalhes técnicos
          </div>
          <div className="space-y-2.5">
            {[
              { icon: <Bot className="w-4 h-4" />, label: 'Nome e papel', value: `${agent.nome} · ${meta.label}` },
              { icon: <MessageSquare className="w-4 h-4" />, label: 'Estrutura do prompt', value: `${lineCount} linhas · Seção CRM incluída e bloqueada` },
              { icon: <Settings className="w-4 h-4" />, label: 'Temperatura', value: `${meta.temperatura} (${meta.temperatura >= 0.7 ? 'Criativo' : meta.temperatura >= 0.5 ? 'Balanceado' : 'Preciso'})` },
              { icon: <Sparkles className="w-4 h-4" />, label: 'Modelo & Reasoning', value: `Gemini 3.0 Flash · Effort 0.8` },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <div className="text-primary shrink-0">{icon}</div>
                <span className="text-dark-muted-foreground w-40 shrink-0">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-10">
        <button
          onClick={onCreateNew}
          className="px-6 py-3 rounded-xl border border-dark-border font-black text-sm hover:bg-dark-muted transition-colors"
        >
          Criar outro agente
        </button>
        <button
          onClick={onEdit}
          className="bg-primary text-white px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 active:scale-95"
        >
          <Settings className="w-4 h-4" />
          Editar agente
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── EDIT VIEW ────────────────────────────────────────────────────────────────

interface EditViewProps {
  agent: Agent;
  onChange: (a: Agent) => void;
  onSave: () => void;
  onDelete: () => void;
  isSaving: boolean;
  userId?: string;
}

const EditView: React.FC<EditViewProps> = ({ agent, onChange, onSave, onDelete, isSaving, userId }) => {
  const tipo = agentTypeToTipo(agent.tipo);
  const meta = TIPO_META[tipo];
  const { editable: initialEditable } = splitPromptParts(agent.prompt);
  const [editablePrompt, setEditablePrompt] = useState(initialEditable);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'agent', text: CHAT_WELCOME_MESSAGE, ts: Date.now() },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Config state (from contexto)
  const ctx = (agent.contexto ?? {}) as { model?: string; temperature?: number; effort?: number };
  const [model, setModel] = useState<string>(ctx.model ?? 'Gemini 2.5 Flash');
  const [temperature, setTemperature] = useState<number>(ctx.temperature ?? meta.temperatura);
  const [effort, setEffort] = useState<number>(ctx.effort ?? 0.8);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatTyping]);

  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim() || isChatTyping) return;
    const text = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text, ts: Date.now() }]);
    setIsChatTyping(true);
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    const response = getMockResponse(tipo);
    setChatMessages((prev) => [...prev, { role: 'agent', text: response, ts: Date.now() }]);
    setIsChatTyping(false);
  }, [chatInput, isChatTyping, tipo]);

  const handleSaveWithPrompt = () => {
    const newFullPrompt = buildFullPrompt(editablePrompt);
    onChange({
      ...agent,
      prompt: newFullPrompt,
      contexto: { model, temperature, effort },
    });
    setTimeout(onSave, 0);
  };

  return (
    <motion.div
      key="edit"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="h-full flex flex-col gap-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 bg-dark-card p-5 rounded-2xl border border-dark-border shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-dark-border shadow-xl shrink-0">
            <img src={agent.avatar_url} alt={agent.nome} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-black text-xl">{agent.nome}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                <Zap className="w-3 h-3" />
                {meta.label}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-black uppercase tracking-widest text-yellow-400">
                Rascunho
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onDelete}
            className="p-3 bg-dark-muted hover:bg-destructive/10 rounded-xl transition-colors text-dark-muted-foreground hover:text-destructive border border-dark-border"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleSaveWithPrompt}
            disabled={isSaving}
            className="bg-primary text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 active:scale-95 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </div>
      </div>

      {/* Body: left config + right chat */}
      <div className="flex-1 grid lg:grid-cols-[1fr_340px] gap-4 min-h-0">

        {/* Left: config */}
        <div className="space-y-4 overflow-y-auto pr-1 scrollbar-hide">

          {/* Identity */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground">Identidade</div>
            <div>
              <label className="text-xs font-bold text-dark-muted-foreground mb-1.5 block">Nome do Agente</label>
              <input
                type="text"
                value={agent.nome}
                onChange={(e) => onChange({ ...agent, nome: e.target.value })}
                className="w-full bg-dark-muted border border-dark-border focus:border-primary px-4 py-3 rounded-xl outline-none transition-all font-bold text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-dark-muted-foreground mb-1.5 block">Papel do Agente</label>
              <select
                value={agent.tom}
                onChange={(e) => onChange({ ...agent, tom: e.target.value })}
                className="w-full bg-dark-muted border border-dark-border focus:border-primary px-4 py-3 rounded-xl outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
              >
                {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Editable Prompt */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground">
                Prompt (editável)
              </div>
              <span className="text-[10px] text-dark-muted-foreground">{editablePrompt.length} chars</span>
            </div>
            <textarea
              rows={10}
              value={editablePrompt}
              onChange={(e) => setEditablePrompt(e.target.value)}
              className="w-full bg-dark-muted border border-dark-border focus:border-primary px-5 py-4 rounded-xl outline-none transition-all text-sm leading-relaxed resize-none font-medium"
            />
          </div>

          {/* CRM Locked Section */}
          <div className="bg-dark-muted/50 border border-dark-border rounded-2xl p-6 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-400" />
              <div className="text-[10px] font-black uppercase tracking-widest text-red-400">
                Seção CRM — Protegida (não editável)
              </div>
            </div>
            <textarea
              rows={8}
              readOnly
              value={CRM_LOCKED_SECTION}
              className="w-full bg-transparent px-5 py-4 rounded-xl text-xs leading-relaxed font-mono text-dark-muted-foreground cursor-not-allowed resize-none border border-dark-border/50 select-none"
            />
            <p className="text-[10px] text-dark-muted-foreground">
              Esta seção é gerada automaticamente e garante que o agente registre corretamente os status no CRM a cada interação.
            </p>
          </div>

          {/* Config */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground">Configurações</div>

            <div>
              <label className="text-xs font-bold text-dark-muted-foreground mb-1.5 block">Modelo de IA</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-dark-muted border border-dark-border focus:border-primary px-4 py-3 rounded-xl outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
              >
                {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-dark-muted-foreground">Temperatura</label>
                <span className="text-xs font-black text-primary">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-dark-muted-foreground mt-1">
                <span>Preciso</span><span>Balanceado</span><span>Criativo</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-dark-muted-foreground">Esforço de Raciocínio</label>
                <span className="text-xs font-black text-primary">{effort.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.05"
                value={effort}
                onChange={(e) => setEffort(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-dark-muted-foreground mt-1">
                <span>Rápido</span><span>Equilibrado</span><span>Profundo</span>
              </div>
            </div>
          </div>

          {/* Status toggle */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm">
                  {agent.ativo ? 'Agente Ativo' : 'Agente Pausado'}
                </div>
                <div className="text-[10px] text-dark-muted-foreground uppercase font-black tracking-widest mt-0.5">
                  {agent.ativo ? 'Respondendo mensagens' : 'Não está respondendo'}
                </div>
              </div>
              <button
                onClick={() => onChange({ ...agent, ativo: !agent.ativo })}
                className="p-3 bg-dark-muted hover:bg-dark-border rounded-xl transition-all border border-dark-border"
              >
                {agent.ativo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <h3 className="text-sm font-black mb-4 flex items-center gap-2">
              Conexão WhatsApp
            </h3>
            {userId && <WhatsAppConnect userId={userId} />}
          </div>
        </div>

        {/* Right: real-time chat */}
        <div className="bg-dark-card border border-dark-border rounded-2xl flex flex-col overflow-hidden min-h-0">
          {/* Chat header */}
          <div className="p-4 border-b border-dark-border flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-dark-border">
              <img src={agent.avatar_url} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-black text-xs">{agent.nome}</div>
              <div className="flex items-center gap-1 text-[10px] text-green-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                Teste em tempo real
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {chatMessages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'agent' && (
                  <div className="w-6 h-6 rounded-lg overflow-hidden border border-dark-border shrink-0 mr-2 mt-1">
                    <img src={agent.avatar_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap',
                    msg.role === 'agent'
                      ? 'bg-dark-muted border border-dark-border text-foreground rounded-tl-sm'
                      : 'bg-primary text-white rounded-tr-sm'
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isChatTyping && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg overflow-hidden border border-dark-border shrink-0">
                  <img src={agent.avatar_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="bg-dark-muted border border-dark-border rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex gap-1.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-dark-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="p-3 border-t border-dark-border shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                placeholder="Teste seu agente..."
                className="flex-1 bg-dark-muted border border-dark-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all"
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim() || isChatTyping}
                className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const { user, profile } = useAuth();
  const { agents, loading: agentsLoading, createAgent, updateAgent, deleteAgent } = useAgents(user?.id);

  const [view, setView] = useState<ViewState>('create');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userName = profile?.nome?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'usuário';
  const filteredAgents = agents.filter((a) =>
    a.nome?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreated = (agent: Agent) => {
    setSelectedAgent(agent);
    setView('success');
  };

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setView('edit');
  };

  const handleCreateNew = () => {
    setSelectedAgent(null);
    setView('create');
  };

  const handleSave = async () => {
    if (!selectedAgent) return;
    setIsSaving(true);
    const updated = await updateAgent(selectedAgent.id, {
      nome: selectedAgent.nome,
      tom: selectedAgent.tom,
      prompt: selectedAgent.prompt,
      ativo: selectedAgent.ativo,
      n8n_webhook: selectedAgent.n8n_webhook,
      contexto: selectedAgent.contexto,
    });
    setIsSaving(false);
    if (updated) {
      toast.success('Agente salvo com sucesso!');
    } else {
      toast.error('Erro ao salvar. Tente novamente.');
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent) return;
    const ok = await deleteAgent(selectedAgent.id);
    if (ok) {
      toast.success('Agente removido.');
      setSelectedAgent(null);
      setView('create');
    } else {
      toast.error('Erro ao remover agente.');
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-5 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <div className="w-72 flex flex-col bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-xl shrink-0">
        <div className="p-5 border-b border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black tracking-tight">Seus Agentes</h3>
            <button
              onClick={handleCreateNew}
              className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar agente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-muted border border-dark-border rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-hide">
          {agentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-dark-muted-foreground" />
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-10 text-dark-muted-foreground">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Nenhum agente criado</p>
            </div>
          ) : (
            filteredAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => handleSelectAgent(agent)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl transition-all group',
                  selectedAgent?.id === agent.id
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-dark-muted border border-transparent'
                )}
              >
                <div className="relative shrink-0">
                  <img
                    src={agent.avatar_url}
                    alt={agent.nome}
                    className="w-10 h-10 rounded-xl object-cover border border-dark-border"
                    referrerPolicy="no-referrer"
                  />
                  {agent.ativo && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-card" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-bold text-xs truncate">{agent.nome}</div>
                  <div className="text-[10px] text-dark-muted-foreground uppercase font-black tracking-widest truncate">
                    {TIPO_META[agentTypeToTipo(agent.tipo)]?.label ?? agent.tom}
                  </div>
                </div>
                <MoreVertical className="w-3.5 h-3.5 text-dark-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Main content ────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'create' && (
            <div className="absolute inset-0 bg-dark-card/30 rounded-2xl border border-dark-border/50 overflow-y-auto">
              <CreateView
                userName={userName}
                onCreated={handleCreated}
                createAgent={createAgent as (data: Partial<Agent>) => Promise<Agent | null>}
              />
            </div>
          )}

          {view === 'success' && selectedAgent && (
            <div className="absolute inset-0 bg-dark-card/30 rounded-2xl border border-dark-border/50 overflow-y-auto">
              <SuccessView
                agent={selectedAgent}
                onEdit={() => setView('edit')}
                onCreateNew={handleCreateNew}
              />
            </div>
          )}

          {view === 'edit' && selectedAgent && (
            <div className="absolute inset-0 overflow-y-auto p-0.5">
              <EditView
                agent={selectedAgent}
                onChange={setSelectedAgent}
                onSave={handleSave}
                onDelete={handleDelete}
                isSaving={isSaving}
                userId={user?.id}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
