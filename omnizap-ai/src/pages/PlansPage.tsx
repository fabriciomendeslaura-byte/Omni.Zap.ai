import { Check, Zap, ArrowRight } from 'lucide-react';
import { cn } from '../utils/cn';

const plans = [
  {
    id: 'starter',
    name: 'Plano Starter',
    price: '97',
    features: [
      '1 WhatsApp',
      '1 agente IA',
      'CRM completo',
      'Insights',
      'Agendamentos',
      '1.000.000 tokens/mês'
    ],
    auxText: 'equivalente a centenas de atendimentos',
    current: false
  },
  {
    id: 'pro',
    name: 'Plano Pro',
    price: '197',
    features: [
      '2 WhatsApp',
      '3 agentes IA',
      'CRM completo',
      'Follow-up automático',
      'Insights',
      'Agendamentos',
      '3.000.000 tokens/mês'
    ],
    auxText: 'ideal para empresas com volume diário de leads',
    current: true,
    popular: true
  },
  {
    id: 'scale',
    name: 'Plano Scale',
    price: '297',
    features: [
      '5 WhatsApp',
      'IA ilimitada',
      'CRM completo',
      'Insights',
      'Agendamentos',
      'Follow-up automático',
      'Automação avançada',
      '10.000.000 tokens/mês'
    ],
    auxText: 'alto volume de atendimento',
    current: false
  }
];

export default function PlansPage() {
  const tokenUsage = 750000;
  const tokenLimit = 3000000;
  const progress = (tokenUsage / tokenLimit) * 100;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Planos e Faturamento</h1>
        <p className="text-dark-muted-foreground">Gerencie seu plano e acompanhe o consumo de recursos.</p>
      </div>

      {/* Token Usage Card */}
      <div className="bg-dark-card p-8 rounded-3xl border border-dark-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-1">Consumo de Tokens</h3>
            <p className="text-sm text-dark-muted-foreground">Tokens são utilizados pela IA para gerar respostas.</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-primary">
              {tokenUsage.toLocaleString('pt-BR')} <span className="text-dark-muted-foreground text-sm font-medium">/ {tokenLimit.toLocaleString('pt-BR')} tokens</span>
            </div>
            <p className="text-xs text-dark-muted-foreground mt-1">Seu ciclo renova em 15 dias</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="h-4 bg-dark-muted rounded-full overflow-hidden border border-dark-border">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-dark-muted-foreground">
            <span>0%</span>
            <span>{progress.toFixed(1)}% consumido</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={cn(
              "relative bg-dark-card p-8 rounded-[40px] border transition-all flex flex-col",
              plan.current ? "border-primary shadow-2xl shadow-primary/10" : "border-dark-border hover:border-dark-muted-foreground/50",
              plan.popular && !plan.current && "border-primary/50"
            )}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                Mais Popular
              </div>
            )}
            
            {plan.current && (
              <div className="absolute top-6 right-8 flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Plano Atual
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-dark-muted-foreground">R$</span>
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-sm font-medium text-dark-muted-foreground">/mês</span>
              </div>
              <p className="text-xs text-dark-muted-foreground mt-2 font-medium italic">
                "{plan.auxText}"
              </p>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-medium text-dark-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <button 
              className={cn(
                "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95",
                plan.current 
                  ? "bg-dark-muted text-dark-muted-foreground cursor-default" 
                  : "bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20"
              )}
            >
              {plan.current ? "Plano Ativo" : "Fazer Upgrade"}
              {!plan.current && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>

      <div className="text-center p-8 bg-dark-muted/30 rounded-3xl border border-dark-border">
        <p className="text-sm text-dark-muted-foreground font-medium">
          Tokens são utilizados pela IA para gerar respostas. Quanto mais tokens, mais atendimentos você pode automatizar.
        </p>
      </div>
    </div>
  );
}
