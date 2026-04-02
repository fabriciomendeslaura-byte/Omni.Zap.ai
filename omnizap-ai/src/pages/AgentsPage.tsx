import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Bot, 
  Settings2, 
  MessageSquare, 
  Calendar, 
  ShieldCheck, 
  Zap, 
  Trash2, 
  Play, 
  Pause,
  ArrowRight,
  Check,
  QrCode,
  Loader2,
  Send,
  User,
  Sparkles,
  ChevronLeft,
  Save,
  RefreshCw,
  Info,
  MoreVertical,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { GoogleGenAI } from "@google/genai";
import { Agent, AgentType } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';

const AGENT_TEMPLATES = [
  {
    id: 'sdr',
    title: 'Bruno SDR AI',
    subtitle: 'Sales Development Representative',
    description: 'Focado em prospecção ativa e despertar interesse inicial.',
    tone: 'Comercial',
    gender: 'male',
    prompt: `Você é um SDR (Sales Development Representative) focado em prospecção ativa. Seu objetivo é despertar o interesse do lead e agendar uma conversa inicial.

Diretrizes:
- Seja persuasivo mas não invasivo.
- Foque nos benefícios da nossa solução.
- Tente converter o interesse em uma reunião de demonstração.`
  },
  {
    id: 'qualifier',
    title: 'Bianca Suporte',
    subtitle: 'Qualificador de Leads',
    description: 'Identifica se o lead possui o perfil ideal (BANT) para venda.',
    tone: 'Consultivo',
    gender: 'female',
    prompt: `Você é um especialista em qualificação de leads. Seu objetivo é fazer as perguntas certas para identificar se o lead possui o perfil ideal (BANT: Budget, Authority, Need, Timeline) para nossa solução.

Diretrizes:
- Faça perguntas abertas.
- Escute mais do que fale.
- Classifique o lead como quente, morno ou frio com base nas respostas.`
  },
  {
    id: 'setter',
    title: 'Lucas Agendador',
    subtitle: 'Agendamento de Reuniões',
    description: 'Focado em fechamento de agenda e confirmação de horários.',
    tone: 'Profissional',
    gender: 'male',
    prompt: `Você é um Appointment Setter focado em fechamento de agenda. Seu objetivo é encontrar o melhor horário e confirmar o agendamento de reuniões.

Diretrizes:
- Seja direto e organizado.
- Ofereça opções de horários claros.
- Confirme todos os detalhes da reunião ao final.`
  }
];

const TONES = [
  'Profissional',
  'Consultivo',
  'Comercial',
  'Técnico direto',
  'Amigável'
];

type ViewState = 'create-chat' | 'detail';

export default function AgentsPage() {
  const { user } = useAuth();
  const { agents, loading: agentsLoading, createAgent, updateAgent, deleteAgent, refetch } = useAgents(user?.id);

  const [view, setView] = useState<ViewState>('create-chat');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);

  // New creation form state
  const [agentForm, setAgentForm] = useState({
    nome: '',
    descricao: '',
    tone: 'Profissional',
    prompt: '',
    templateId: '',
    gender: 'male' as 'male' | 'female'
  });

  const [isGenderManual, setIsGenderManual] = useState(false);

  const [chatMessages, setChatMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: 'O que você deseja? Vamos criar um agente de ação.' },
    { role: 'ai', text: 'O que você quer que seu agente de ação faça?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    // If we are in create mode, refine the prompt
    if (view === 'create-chat') {
      setIsGenerating(true);
      setTimeout(() => {
        setAgentForm(prev => ({
          ...prev,
          prompt: prev.prompt + "\n\n[Refinado pela IA]: Foco em conversão, clareza e agilidade no atendimento."
        }));
        setIsGenerating(false);
      }, 1500);
      return;
    }

    // Original chat logic (if still used elsewhere)
    if (!userInput.trim()) return;
    const newUserMessage = { role: 'user' as const, text: userInput };
    setChatMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsGenerating(true);
    // ... rest of original logic if needed ...
  };

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setView('detail');
  };

  const handleCreateNew = () => {
    setSelectedAgent(null);
    setView('create-chat');
    setAgentForm({
      nome: '',
      descricao: '',
      tone: 'Profissional',
      prompt: '',
      templateId: '',
      gender: 'male'
    });

    setChatMessages([
      { role: 'ai', text: 'O que você deseja? Vamos criar um agente de ação.' },
      { role: 'ai', text: 'O que você quer que seu agente de ação faça?' }
    ]);
    setShowQR(false);
    setIsConnecting(false);
  };

  const handleSelectTemplate = (template: any) => {
    setAgentForm(prev => ({
      ...prev,
      templateId: template.id,
      prompt: template.prompt,
      tone: template.tone,
      nome: template.title,
      descricao: template.description,
      gender: template.gender || 'male'
    }));

    setGeneratedAvatar(null); // Reset avatar when template changes
  };

  useEffect(() => {
    if (!agentForm.nome || isGenderManual) return;
    
    const firstName = agentForm.nome.trim().split(' ')[0].toLowerCase();
    if (!firstName) return;

    // Common Brazilian female name endings
    const femaleEndings = ['a', 'ia', 'ina', 'essa', 'ele', 'ine'];
    // Common Brazilian male name endings
    const maleEndings = ['o', 'os', 'on', 'an', 'el', 'or'];

    if (femaleEndings.some(ending => firstName.endsWith(ending))) {
      setAgentForm(prev => ({ ...prev, gender: 'female' }));
    } else if (maleEndings.some(ending => firstName.endsWith(ending))) {
      setAgentForm(prev => ({ ...prev, gender: 'male' }));
    }
  }, [agentForm.nome, isGenderManual]);


  const generateAvatar = async () => {
    setIsGeneratingAvatar(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      // Extremely explicit Disney/Pixar 3D style prompt
      const prompt = `3D Disney Pixar style character portrait, ${agentForm.gender === 'male' ? 'male' : 'female'} character, friendly and ${agentForm.tone.toLowerCase()} expression. 
      Big expressive eyes, stylized 3D hair, smooth skin, vibrant colors, cinematic lighting, soft shadows. 
      High quality 3D render, Pixar animation movie style, 8k resolution, detailed professional attire, blurred colorful background.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const url = `data:image/png;base64,${part.inlineData.data}`;
            setGeneratedAvatar(url);
            return url;
          }
        }
      }
      throw new Error('No image data in response');
    } catch (error) {
      console.error('Error generating avatar:', error);
      // Fallback to static URLs if generation fails
      const maleAvatars = [
        '/avatars/male_1.png',
        '/avatars/male_2.png'
      ];
      const femaleAvatars = [
        '/avatars/female_1.png',
        '/avatars/female_2.png'
      ];
      const portraitSeeds = agentForm.gender === 'male' ? maleAvatars : femaleAvatars;
      const fallbackUrl = portraitSeeds[Math.floor(Math.random() * portraitSeeds.length)];
      setGeneratedAvatar(fallbackUrl);
      return fallbackUrl;
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleSaveNewAgent = async () => {
    if (!agentForm.nome || !agentForm.prompt) return;

    let avatarUrl = generatedAvatar;
    
    // If no avatar was generated yet, generate one now
    if (!avatarUrl) {
      avatarUrl = await generateAvatar();
    }

    const newAgent = await createAgent({
      nome: agentForm.nome,
      descricao: agentForm.descricao,
      tipo: 'custom',
      avatar_url: avatarUrl || '',
      tom: agentForm.tone,
      prompt: agentForm.prompt,
      ativo: true
    });

    if (newAgent) {
      setSelectedAgent(newAgent as Agent);
      setView('detail');
      setGeneratedAvatar(null); // Reset for next creation
    }
  };

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setShowQR(true);
    }, 1500);
  };

  const handleRegenerate = () => {
    if (!selectedAgent) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const updatedAgent = {
        ...selectedAgent,
        prompt: selectedAgent.prompt + "\n\n[Atualizado via IA]: Foco em conversão e agilidade."
      };
      setSelectedAgent(updatedAgent);
      updateAgent(updatedAgent.id, updatedAgent);
    }, 1500);
  };

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return;
    const success = await deleteAgent(selectedAgent.id);
    if (success) {
      setSelectedAgent(null);
      setView('create-chat');
    }
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;
    // In a real app, we would get values from refs or controlled state
    await updateAgent(selectedAgent.id, selectedAgent);
  };

  const filteredAgents = agents.filter(a => 
    a.nome?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div className="h-[calc(100vh-120px)] flex gap-6 overflow-hidden">
      {/* Sidebar - Existing Agents */}
      <div className="w-80 flex flex-col bg-dark-card border border-dark-border rounded-[32px] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black tracking-tight">Seus Agentes</h3>
            <button 
              onClick={handleCreateNew}
              className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted-foreground" />
            <input 
              type="text"
              placeholder="Buscar agente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-muted border border-dark-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-primary/50 transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {filteredAgents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => handleSelectAgent(agent)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-2xl transition-all group",
                selectedAgent?.id === agent.id 
                  ? "bg-primary/10 border border-primary/20" 
                  : "hover:bg-dark-muted border border-transparent"
              )}
            >
              <div className="relative shrink-0">
                <img src={agent.avatar_url} alt={agent.nome} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                {agent.ativo && (
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-dark-card" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="font-bold text-sm truncate">{agent.nome}</div>
                <div className="text-[10px] text-dark-muted-foreground uppercase font-black tracking-widest truncate">{agent.tom}</div>
              </div>
              <MoreVertical className="w-4 h-4 text-dark-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {/* CREATE AGENT VIEW */}
          {view === 'create-chat' && (
            <motion.div 
              key="create"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="h-full flex flex-col bg-dark-card/30 rounded-[32px] border border-dark-border/50 overflow-hidden"
            >
              <div className="p-8 border-b border-dark-border/50 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Novo Agente de Ação</h2>
                  <p className="text-sm text-dark-muted-foreground">Configure a identidade e o comportamento da sua IA.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-primary">Gemini 3 Flash</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide">
                {/* 1. Templates Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-lg font-black tracking-tight">Templates de Agentes Pré-configurados</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {AGENT_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleSelectTemplate(template)}
                        className={cn(
                          "text-left p-6 rounded-[24px] border transition-all group relative overflow-hidden",
                          agentForm.templateId === template.id
                            ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                            : "bg-dark-card border-dark-border hover:border-primary/50"
                        )}
                      >
                        <div className="relative z-10">
                          <h4 className="font-bold text-sm mb-1">{template.title}</h4>
                          <p className="text-[10px] text-dark-muted-foreground uppercase font-black tracking-widest mb-3">{template.subtitle}</p>
                          <p className="text-xs text-dark-muted-foreground leading-relaxed line-clamp-2">{template.description}</p>
                        </div>
                        {agentForm.templateId === template.id && (
                          <div className="absolute top-4 right-4">
                            <Check className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                <div className="grid lg:grid-cols-2 gap-12">
                  <div className="space-y-12">
                    {/* 2. Identity Section */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="text-lg font-black tracking-tight">Identidade do Agente</h3>
                      </div>
                      <div className="space-y-6 bg-dark-card p-8 rounded-[32px] border border-dark-border">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dark-muted-foreground px-1">Nome do Agente</label>
                          <input 
                            type="text"
                            value={agentForm.nome}
                            onChange={(e) => setAgentForm(prev => ({ ...prev, nome: e.target.value }))}
                            placeholder="Ex: SDR Vendas Imobiliária"
                            className="w-full bg-dark-muted border border-dark-border focus:border-primary px-6 py-4 rounded-2xl outline-none transition-all font-bold text-sm"
                          />

                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dark-muted-foreground px-1">Gênero do Avatar</label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setAgentForm(prev => ({ ...prev, gender: 'male' }));
                                setIsGenderManual(true);
                              }}
                              className={cn(
                                "flex-1 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2",
                                agentForm.gender === 'male' 
                                  ? "bg-primary/10 border-primary text-primary" 
                                  : "bg-dark-muted border-dark-border text-dark-muted-foreground hover:border-primary/30"
                              )}
                            >
                              Masculino
                            </button>
                            <button
                              onClick={() => {
                                setAgentForm(prev => ({ ...prev, gender: 'female' }));
                                setIsGenderManual(true);
                              }}
                              className={cn(
                                "flex-1 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2",
                                agentForm.gender === 'female' 
                                  ? "bg-primary/10 border-primary text-primary" 
                                  : "bg-dark-muted border-dark-border text-dark-muted-foreground hover:border-primary/30"
                              )}
                            >
                              Feminino
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dark-muted-foreground px-1">Descrição</label>
                          <textarea 
                            value={agentForm.descricao}
                            onChange={(e) => setAgentForm(prev => ({ ...prev, descricao: e.target.value }))}
                            placeholder="Breve descrição do que este agente faz..."
                            rows={3}
                            className="w-full bg-dark-muted border border-dark-border focus:border-primary px-6 py-4 rounded-2xl outline-none transition-all text-sm resize-none"
                          />

                        </div>
                      </div>
                    </section>

                    {/* 3. Behavior Section */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="text-lg font-black tracking-tight">Comportamento da IA</h3>
                      </div>
                      <div className="space-y-6 bg-dark-card p-8 rounded-[32px] border border-dark-border">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-dark-muted-foreground px-1">Tom de Voz</label>
                          <select 
                            value={agentForm.tone}
                            onChange={(e) => setAgentForm(prev => ({ ...prev, tone: e.target.value }))}
                            className="w-full bg-dark-muted border border-dark-border focus:border-primary px-6 py-4 rounded-2xl outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
                          >
                            {TONES.map(tone => (
                              <option key={tone} value={tone}>{tone}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="space-y-12">
                    {/* 4. Prompt Section */}
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-primary" />
                          </div>
                          <h3 className="text-lg font-black tracking-tight">Prompt Base</h3>
                        </div>
                        <button 
                          onClick={handleSendMessage}
                          disabled={isGenerating}
                          className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:underline disabled:opacity-50"
                        >
                          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          Refinar com IA
                        </button>
                      </div>
                      <div className="bg-dark-card p-8 rounded-[32px] border border-dark-border relative group">
                        <textarea 
                          value={agentForm.prompt}
                          onChange={(e) => setAgentForm(prev => ({ ...prev, prompt: e.target.value }))}
                          placeholder="Instruções detalhadas para o agente..."
                          rows={12}
                          className="w-full bg-dark-muted border border-dark-border focus:border-primary px-6 py-6 rounded-2xl outline-none transition-all text-sm leading-relaxed resize-none font-medium"
                        />
                        <div className="absolute bottom-12 right-12 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-card/50 backdrop-blur-sm border border-dark-border text-[9px] font-bold text-dark-muted-foreground opacity-0 group-focus-within:opacity-100 transition-opacity">
                          <Info className="w-3 h-3" />
                          Pressione Enter para pular linha
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                {/* 5. Preview Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Play className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-lg font-black tracking-tight">Preview do Agente</h3>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-[40px] p-10 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Bot className="w-40 h-40 text-primary" />
                    </div>
                    
                    {/* Avatar Preview */}
                    <div className="relative shrink-0">
                      <div className="w-32 h-32 rounded-[32px] overflow-hidden border-4 border-primary/20 shadow-2xl relative group bg-dark-muted flex items-center justify-center">
                        {isGeneratingAvatar ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-primary animate-pulse">Gerando...</span>
                          </div>
                        ) : (
                          <img 
                            src={generatedAvatar || (agentForm.gender === 'male' 
                              ? '/avatars/male_1.png' 
                              : '/avatars/female_1.png'
                            )} 
                            alt="Preview Avatar" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <button 
                          onClick={generateAvatar}
                          disabled={isGeneratingAvatar}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"
                        >
                          <RefreshCw className={cn("w-6 h-6 text-white", isGeneratingAvatar && "animate-spin")} />
                          <span className="text-[8px] font-black uppercase tracking-widest text-white">Gerar Novo</span>
                        </button>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-dark-card flex items-center justify-center shadow-lg">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>

                    <div className="flex-1 grid md:grid-cols-2 gap-8 relative z-10">
                      <div className="space-y-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-primary/60">Identidade</div>
                        <div>
                          <div className="font-black text-2xl mb-1 text-white">{agentForm.nome || 'Nome do Agente'}</div>
                          <div className="text-sm text-dark-muted-foreground font-medium">{agentForm.descricao || 'Descrição do agente...'}</div>
                        </div>

                      </div>
                      <div className="space-y-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-primary/60">Comportamento</div>
                        <div className="space-y-3">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-black uppercase tracking-widest text-primary">
                            {agentForm.tone}
                          </div>
                          <div className="text-[11px] text-dark-muted-foreground line-clamp-3 italic leading-relaxed">
                            "{agentForm.prompt || 'O prompt será exibido aqui...'}"
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-8 border-t border-dark-border/50 bg-dark-card/50 shrink-0 flex items-center justify-end gap-4">
                <button 
                  onClick={handleCreateNew}
                  className="px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-dark-muted-foreground hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveNewAgent}
                  disabled={!agentForm.nome || !agentForm.prompt || isGeneratingAvatar}
                  className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 disabled:opacity-50 disabled:shadow-none active:scale-95"
                >
                  {isGeneratingAvatar ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      GERANDO AGENTE MÁGICO...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Salvar Agente
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* DETAIL VIEW */}
          {view === 'detail' && selectedAgent && (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="h-full flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8 bg-dark-card p-6 rounded-[32px] border border-dark-border shadow-xl">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[32px] overflow-hidden border-4 border-primary/20 shadow-2xl relative group">
                    <img src={selectedAgent.avatar_url} alt={selectedAgent.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <RefreshCw className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight mb-1">{selectedAgent.nome}</h2>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-primary">Gemini 3 Flash</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-green-500">Online</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleDeleteAgent}
                    className="p-4 bg-dark-muted hover:bg-destructive/10 rounded-2xl transition-colors text-dark-muted-foreground hover:text-destructive border border-dark-border"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={handleUpdateAgent}
                    className="bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 active:scale-95"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Agente
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto grid lg:grid-cols-2 gap-8 pb-8 scrollbar-hide">
                {/* Configuration */}
                <div className="space-y-8">
                  <div className="bg-dark-card p-10 rounded-[48px] border border-dark-border space-y-8 shadow-2xl">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-dark-muted-foreground">Papel do Agente</label>
                        <Info className="w-4 h-4 text-dark-muted-foreground cursor-help" />
                      </div>
                      <input 
                        type="text" 
                        defaultValue={selectedAgent.tone}
                        className="w-full bg-dark-muted border border-dark-border focus:border-primary px-8 py-5 rounded-[24px] outline-none transition-all font-bold text-lg"
                        placeholder="Ex: Especialista em Vendas"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-dark-muted-foreground">Descrição do Agente</label>
                      </div>
                      <input 
                        type="text" 
                        defaultValue={selectedAgent.description}
                        className="w-full bg-dark-muted border border-dark-border focus:border-primary px-8 py-5 rounded-[24px] outline-none transition-all font-bold text-sm"
                        placeholder="Ex: SDR para qualificação de leads imobiliários"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-dark-muted-foreground">Tom de Voz</label>
                      </div>
                      <select 
                        defaultValue={selectedAgent.tone}
                        className="w-full bg-dark-muted border border-dark-border focus:border-primary px-8 py-5 rounded-[24px] outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
                      >
                        {TONES.map(tone => (
                          <option key={tone} value={tone}>{tone}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-dark-muted-foreground">Prompt de Ação</label>
                        <button 
                          onClick={handleRegenerate}
                          disabled={isGenerating}
                          className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 hover:underline disabled:opacity-50"
                        >
                          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          Regerar com IA
                        </button>
                      </div>
                      <div className="relative">
                        <textarea 
                          rows={12}
                          defaultValue={selectedAgent.prompt}
                          className="w-full bg-dark-muted border border-dark-border focus:border-primary px-8 py-6 rounded-[32px] outline-none transition-all text-base font-medium resize-none leading-relaxed"
                        />
                        <div className="absolute bottom-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-card/50 backdrop-blur-sm border border-dark-border text-[10px] font-bold text-dark-muted-foreground">
                          <Sparkles className="w-3 h-3 text-primary" />
                          Otimizado pelo Gemini
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 p-8 rounded-[32px] border border-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Sparkles className="w-24 h-24 text-primary" />
                    </div>
                    <h4 className="font-black uppercase tracking-[0.1em] text-primary mb-3 flex items-center gap-3">
                      <Sparkles className="w-5 h-5" />
                      Tecnologia Gemini 3 Flash
                    </h4>
                    <p className="text-sm text-dark-muted-foreground leading-relaxed font-medium">
                      Este agente utiliza o modelo mais avançado para ações rápidas e precisas. O Gemini 3 Flash garante que seu agente entenda intenções complexas e execute tarefas sem atrasos.
                    </p>
                  </div>
                </div>

                {/* WhatsApp Connection */}
                <div className="space-y-8">
                  <div className="bg-dark-card p-10 rounded-[48px] border border-dark-border flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                    
                    <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-[32px] flex items-center justify-center mb-8 shadow-inner">
                      <QrCode className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight mb-3">Conectar ao WhatsApp</h3>
                    <p className="text-base text-dark-muted-foreground mb-10 max-w-xs font-medium">
                      Conecte este agente ao seu WhatsApp para que ele comece a responder seus clientes em tempo real.
                    </p>

                    {isConnecting ? (
                      <div className="py-12 flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                        <span className="text-lg font-black uppercase tracking-widest text-primary animate-pulse">Criando Túnel Seguro...</span>
                      </div>
                    ) : showQR ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8 w-full"
                      >
                        <div className="bg-white p-6 rounded-[40px] inline-block shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative group">
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=OmniZapAI_Agent_Connection" alt="QR Code" className="w-48 h-48" />
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[40px]" />
                        </div>
                        <div className="text-left space-y-4 bg-dark-muted p-8 rounded-[32px] border border-dark-border shadow-inner">
                          <div className="flex items-center gap-4">
                            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs">1</div>
                            <span className="text-sm font-bold text-dark-muted-foreground">Abra o WhatsApp e vá em <b>Aparelhos Conectados</b></span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs">2</div>
                            <span className="text-sm font-bold text-dark-muted-foreground">Toque em <b>Conectar um Aparelho</b></span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs">3</div>
                            <span className="text-sm font-bold text-dark-muted-foreground">Escaneie o código acima</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setShowQR(false)}
                          className="text-xs font-black uppercase tracking-widest text-dark-muted-foreground hover:text-white transition-colors flex items-center gap-2 mx-auto"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Gerar novo código
                        </button>
                      </motion.div>
                    ) : (
                      <button 
                        onClick={handleConnect}
                        className="w-full bg-primary text-white py-6 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 active:scale-95"
                      >
                        <QrCode className="w-6 h-6" />
                        Gerar QR Code de Conexão
                      </button>
                    )}
                  </div>

                  <div className="bg-dark-card p-8 rounded-[40px] border border-dark-border shadow-xl">
                    <h4 className="font-black uppercase tracking-[0.1em] mb-6 flex items-center gap-3 text-sm">
                      <Zap className="w-5 h-5 text-primary" />
                      Status da Automação
                    </h4>
                    <div className="flex items-center justify-between p-6 bg-dark-muted rounded-[24px] border border-dark-border">
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        <div>
                          <span className="text-base font-bold block">Agente Online</span>
                          <span className="text-[10px] text-dark-muted-foreground uppercase font-black tracking-widest">Pronto para responder</span>
                        </div>
                      </div>
                      <button className="p-4 bg-dark-card hover:bg-dark-border rounded-2xl transition-all border border-dark-border shadow-lg active:scale-90">
                        <Pause className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
