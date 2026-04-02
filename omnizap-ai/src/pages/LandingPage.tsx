import { Link } from 'react-router-dom';
import { 
  Zap, 
  CheckCircle2, 
  MessageSquare, 
  Users, 
  Bot, 
  ArrowRight, 
  PlayCircle,
  TrendingUp,
  Clock,
  ShieldCheck,
  Layout
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils/cn';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-foreground selection:bg-primary/20">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="text-white w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight">OmniZap <span className="text-primary">AI</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#beneficios" className="text-sm font-medium hover:text-primary transition-colors">Benefícios</a>
            <a href="#como-funciona" className="text-sm font-medium hover:text-primary transition-colors">Como funciona</a>
            <a href="#crm" className="text-sm font-medium hover:text-primary transition-colors">CRM</a>
            <a href="#planos" className="text-sm font-medium hover:text-primary transition-colors">Planos</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold hover:text-primary transition-colors">Login</Link>
            <Link 
              to="/signup" 
              className="bg-primary text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <Zap className="w-4 h-4" />
              IA + WhatsApp + CRM
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] mb-6">
              Pare de perder clientes no <span className="text-primary">WhatsApp</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
              Automatize seu atendimento com IA e gerencie todos os seus leads em um só lugar. Responda em segundos e feche mais vendas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/signup" 
                className="bg-primary text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-2"
              >
                Começar grátis por 7 dias
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button className="bg-white text-foreground border border-border px-6 py-3 rounded-full text-sm font-bold hover:bg-muted transition-all flex items-center justify-center gap-2">
                <PlayCircle className="w-4 h-4" />
                Ver como funciona
              </button>
            </div>
            <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <img key={i} className="w-8 h-8 rounded-full border-2 border-white" src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                ))}
              </div>
              <span>+500 empresas já utilizam</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-50"></div>
            <div className="relative bg-dark-card rounded-[32px] border border-border shadow-2xl overflow-hidden p-2">
              <div className="bg-dark-muted h-8 flex items-center px-4 gap-1.5 rounded-t-2xl">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
              </div>
              <img 
                src="/dashboard.jpeg" 
                alt="OmniZap Dashboard" 
                className="w-full h-auto rounded-b-2xl shadow-inner object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-24 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Por que escolher a OmniZap?</h2>
            <p className="text-lg text-muted-foreground">Tudo o que você precisa para escalar seu atendimento.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Clock, title: "Respostas em segundos", desc: "Sua IA responde instantaneamente, 24 horas por dia." },
              { icon: TrendingUp, title: "Aumente suas vendas", desc: "Nunca mais perca um lead por demora no atendimento." },
              { icon: ShieldCheck, title: "Seguro e Confiável", desc: "Integração oficial e segura com seu WhatsApp." },
              { icon: Layout, title: "Organização Total", desc: "Seus leads organizados automaticamente em um CRM." }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CRM Section */}
      <section id="crm" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-30"></div>
              <div className="relative bg-dark-card rounded-3xl border border-border shadow-2xl overflow-hidden">
                <div className="bg-dark-muted h-8 flex items-center px-4 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                </div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold">Pipeline de Leads</h3>
                    <div className="flex gap-2">
                      <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">Ativos</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {['Novo', 'Em Contato', 'Fechado'].map((status, i) => (
                      <div key={status} className="space-y-3">
                        <div className="text-[10px] font-bold text-dark-muted-foreground uppercase tracking-widest">{status}</div>
                        <div className="h-24 rounded-xl bg-white/5 border border-white/10 p-3">
                          <div className="w-full h-2 bg-white/10 rounded-full mb-2"></div>
                          <div className="w-2/3 h-2 bg-white/5 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Novo Lead via WhatsApp</div>
                        <div className="text-xs text-muted-foreground">Agora mesmo</div>
                      </div>
                    </div>
                    <div className="text-primary font-bold text-sm">+ R$ 2.500</div>
                  </div>
                </div>
              </div>
              
              {/* Floating element */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -right-8 top-1/4 bg-white p-4 rounded-2xl shadow-2xl border border-border hidden sm:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Venda Confirmada</div>
                    <div className="text-sm font-bold text-foreground">R$ 1.490,00</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
            <h2 className="text-4xl font-black mb-6 leading-tight">
              Um CRM construído para o <span className="text-primary">WhatsApp</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Esqueça planilhas e sistemas complexos. Gerencie seu funil de vendas diretamente onde a conversa acontece.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                'Organização automática por funil',
                'Histórico completo de conversas',
                'Lembretes de follow-up inteligentes',
                'Dashboard de métricas em tempo real'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 font-medium">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/signup" className="text-primary font-bold flex items-center gap-2 group">
              Explorar recursos do CRM
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* AI Agent Section */}
      <section className="py-24 bg-dark-background text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black mb-16">Crie seu Agente de IA em minutos</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Escolha o tipo", desc: "SDR, Atendimento ou Agendamento. Temos modelos prontos." },
              { step: "02", title: "Personalize", desc: "Defina o tom de voz, nome e as regras do seu agente." },
              { step: "03", title: "Conecte", desc: "Escaneie o QR Code e sua IA já começa a responder." }
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="text-8xl font-black text-white/5 absolute -top-12 left-1/2 -translate-x-1/2 group-hover:text-primary/10 transition-colors">
                  {item.step}
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-dark-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-muted rounded-[40px] p-8 sm:p-12 border border-border shadow-inner">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold">OmniZap AI</h4>
                <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[80%] border border-border">
                  Olá! Gostaria de saber os preços do plano Pro.
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-primary text-white p-4 rounded-2xl rounded-tr-none shadow-md max-w-[80%]">
                  Olá! Com certeza. O plano Pro custa R$ 197/mês e inclui IA ilimitada, CRM completo e até 3 conexões WhatsApp. Gostaria de testar grátis?
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[80%] border border-border">
                  Sim, por favor!
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-primary text-white p-4 rounded-2xl rounded-tr-none shadow-md max-w-[80%]">
                  Perfeito! Vou te enviar o link para cadastro agora mesmo. 🚀
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="planos" className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Escolha o plano ideal para o seu negócio</h2>
            <p className="text-lg text-muted-foreground">Comece grátis por 7 dias e escale seu atendimento.</p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-white p-8 rounded-[40px] border border-border flex flex-col hover:shadow-xl transition-all">
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Plano Starter</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-muted-foreground">R$</span>
                  <span className="text-4xl font-black">97</span>
                  <span className="text-sm font-medium text-muted-foreground">/mês</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium italic">
                  "equivalente a centenas de atendimentos"
                </p>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {['1 WhatsApp', '1 agente IA', 'CRM completo', 'Insights', 'Agendamentos', '1.000.000 tokens/mês'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="w-full py-4 rounded-2xl bg-muted text-foreground font-bold hover:bg-primary hover:text-white transition-all text-center">
                Começar grátis por 7 dias
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white p-8 rounded-[40px] border-2 border-primary flex flex-col shadow-2xl shadow-primary/10 relative scale-105 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                Mais Popular
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Plano Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-muted-foreground">R$</span>
                  <span className="text-4xl font-black">197</span>
                  <span className="text-sm font-medium text-muted-foreground">/mês</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium italic">
                  "ideal para empresas com volume diário de leads"
                </p>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {['2 WhatsApp', '3 agentes IA', 'CRM completo', 'Follow-up automático', 'Insights', 'Agendamentos', '3.000.000 tokens/mês'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-all text-center shadow-xl shadow-primary/20">
                Começar grátis por 7 dias
              </Link>
            </div>

            {/* Scale */}
            <div className="bg-white p-8 rounded-[40px] border border-border flex flex-col hover:shadow-xl transition-all">
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Plano Scale</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-muted-foreground">R$</span>
                  <span className="text-4xl font-black">297</span>
                  <span className="text-sm font-medium text-muted-foreground">/mês</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium italic">
                  "alto volume de atendimento"
                </p>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {['5 WhatsApp', 'IA ilimitada', 'CRM completo', 'Insights', 'Agendamentos', 'Follow-up automático', 'Automação avançada', '10.000.000 tokens/mês'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="w-full py-4 rounded-2xl bg-muted text-foreground font-bold hover:bg-primary hover:text-white transition-all text-center">
                Começar grátis por 7 dias
              </Link>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground font-medium max-w-2xl mx-auto">
              Tokens são utilizados pela IA para gerar respostas. Quanto mais tokens, mais atendimentos você pode automatizar.
            </p>
          </div>
        </div>
      </section>

      {/* Proof Section */}
      <section className="py-24 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center text-center md:text-left">
          <h2 className="text-4xl font-black leading-tight">
            Empresas perdem até 70% dos leads por demora no atendimento.
          </h2>
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
            <p className="text-2xl font-bold mb-4">"Respostas rápidas aumentam as taxas de conversão em até 391%."</p>
            <p className="text-white/80 font-medium">— Harvard Business Review</p>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-24 bg-dark-background text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-primary text-[10px] font-black uppercase tracking-widest mb-6 border border-white/10">
                Tecnologia de Ponta
              </div>
              <h2 className="text-4xl font-black mb-6">Impulsionado pelo Gemini 3 Flash</h2>
              <p className="text-xl text-dark-muted-foreground leading-relaxed">
                Utilizamos o modelo de IA mais avançado do Google para garantir respostas rápidas, precisas e com contexto humano para seus clientes.
              </p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-5xl font-black text-primary mb-2">0.5s</div>
                <div className="text-xs font-bold uppercase tracking-widest text-dark-muted-foreground">Tempo de Resposta</div>
              </div>
              <div className="w-px h-16 bg-white/10"></div>
              <div className="text-center">
                <div className="text-5xl font-black text-primary mb-2">99%</div>
                <div className="text-xs font-bold uppercase tracking-widest text-dark-muted-foreground">Precisão Contextual</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl sm:text-6xl font-black mb-8">Comece agora gratuitamente</h2>
          <p className="text-xl text-muted-foreground mb-12">
            Junte-se a centenas de empresas que já escalaram suas vendas com a OmniZap AI.
          </p>
          <Link 
            to="/signup" 
            className="inline-flex bg-primary text-white px-12 py-6 rounded-2xl text-xl font-bold hover:bg-primary/90 transition-all shadow-2xl shadow-primary/40 active:scale-95"
          >
            Testar grátis por 7 dias
          </Link>
          <p className="mt-6 text-sm text-muted-foreground font-medium">
            Sem compromisso • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="text-white w-4 h-4 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight">OmniZap <span className="text-primary">AI</span></span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 OmniZap AI. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary">Termos</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary">Privacidade</a>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <motion.a
        href="https://wa.me/5511999999999"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-[#FF2E88] text-white rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(255,46,136,0.3)] cursor-pointer group"
      >
        <div className="absolute -inset-2 bg-[#FF2E88]/20 rounded-full animate-pulse group-hover:animate-none"></div>
        <svg 
          viewBox="0 0 24 24" 
          className="w-9 h-9 fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.554 4.189 1.605 6.056L0 24l6.117-1.605a11.845 11.845 0 005.928 1.588h.005c6.632 0 12.03-5.392 12.033-12.03a11.85 11.85 0 00-3.486-8.503z"/>
        </svg>
      </motion.a>
    </div>
  );
}
