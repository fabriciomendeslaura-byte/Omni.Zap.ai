import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Zap, 
  Clock, 
  MessageSquare, 
  Target,
  ArrowRight,
  Lightbulb,
  Loader2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '../utils/cn';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';

export default function InsightsPage() {
  const { user } = useAuth();
  const { leads, loading } = useLeads(user?.id);

  // Group leads by hour of creation for the main chart
  const hourlyData = useMemo(() => {
    const hoursMap: Record<string, number> = {};
    // Initialize last 12 hours
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const h = new Date(now.getTime() - i * 60 * 60 * 1000);
      const label = `${String(h.getHours()).padStart(2, '0')}h`;
      hoursMap[label] = 0;
    }

    leads.forEach(lead => {
      const created = new Date(lead.created_at);
      const label = `${String(created.getHours()).padStart(2, '0')}h`;
      if (hoursMap[label] !== undefined) {
        hoursMap[label]++;
      }
    });

    return Object.entries(hoursMap).map(([name, value]) => ({ name, value }));
  }, [leads]);

  // Group leads by status for pie chart
  const statusData = useMemo(() => {
    const counts = {
      novo: leads.filter(l => l.status === 'novo').length,
      atendimento: leads.filter(l => l.status === 'atendimento').length,
      fechado: leads.filter(l => l.status === 'fechado').length,
      parado: leads.filter(l => l.status === 'parado').length,
    };

    return [
      { name: 'Novos', value: counts.novo, color: '#FF2E88' },
      { name: 'Em Atendimento', value: counts.atendimento, color: '#3b82f6' },
      { name: 'Fechados', value: counts.fechado, color: '#10b981' },
      { name: 'Parados', value: counts.parado, color: '#ef4444' },
    ];
  }, [leads]);


  // Dynamic AI Insights
  const insights = useMemo(() => {
    const total = leads.length;
    const closedCount = leads.filter(l => l.status === 'fechado').length;

    const conversionRate = total > 0 ? (closedCount / total) * 100 : 0;
    
    return [
      { 
        title: 'Status do Funil', 
        desc: total > 0 
          ? `Você possui ${leads.filter(l => l.status === 'atendimento').length} leads em conversação ativa. Mantenha o fluxo para converter!` 
          : 'Sem dados suficientes para analisar o funil ainda.', 
        icon: Target, 
        color: 'text-blue-500',
        bg: 'bg-blue-500/10'
      },
      { 
        title: 'Taxa de Conversão', 
        desc: `Sua taxa de conversão atual é de ${conversionRate.toFixed(1)}%. ${conversionRate > 20 ? 'Excelente performance!' : 'Pode ser otimizada com novo prompt.'}`, 
        icon: TrendingUp, 
        color: 'text-primary',
        bg: 'bg-primary/10'
      },
      { 
        title: 'Tempo de Resposta IA', 
        desc: 'Sua IA está respondendo instantaneamente em todos os canais conectados.', 
        icon: Zap, 
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10'
      },
    ];
  }, [leads]);


  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Insights Inteligentes</h1>
        <p className="text-dark-muted-foreground">Análise profunda do seu atendimento e sugestões da IA.</p>
      </div>

      {/* AI Insights Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {insights.map((insight, i) => (
          <div key={i} className="bg-dark-card p-6 rounded-2xl border border-dark-border relative overflow-hidden group">
            <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 transition-all group-hover:opacity-40", insight.bg)}></div>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6", insight.bg, insight.color)}>
              <insight.icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">{insight.title}</h3>
            <p className="text-sm text-dark-muted-foreground leading-relaxed">{insight.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-dark-card p-8 rounded-2xl border border-dark-border">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-xl mb-1">Volume de Leads por Horário</h3>
              <p className="text-sm text-dark-muted-foreground">Frequência de novos contatos nas últimas 12 horas.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-muted rounded-lg border border-dark-border">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase text-dark-muted-foreground">Sincronizado</span>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="name" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #262626', borderRadius: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#FF2E88" 
                  strokeWidth={4} 
                  dot={{ fill: '#FF2E88', strokeWidth: 2, r: 4 }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-dark-card p-8 rounded-2xl border border-dark-border flex flex-col">
          <h3 className="font-bold text-xl mb-1">Status do Funil Real</h3>
          <p className="text-sm text-dark-muted-foreground mb-8">Distribuição atual dos seus contatos.</p>
          <div className="flex-1 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #262626', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {statusData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-dark-muted-foreground font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
            <Lightbulb className="w-8 h-8" />
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-primary">Recomendação OmniZap</h3>
            <p className="text-lg text-dark-muted-foreground leading-relaxed max-w-3xl">
              {leads.length > 0 
                ? "Sua IA detectou que a maior parte dos leads novos não avança para 'Atendimento' no final de semana. Recomendamos ajustar o agente para ser mais proativo aos sábados."
                : "Aguardando volume de dados para gerar recomendações personalizadas pela IA estratégica."}
            </p>
            <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95">
              Refinar Agente SDR
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

