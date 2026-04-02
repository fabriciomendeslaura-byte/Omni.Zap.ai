import { useMemo } from 'react';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useLeads } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';

export default function DashboardHome() {
  const { user, profile } = useAuth();
  const { leads, loading } = useLeads(user?.id);

  // Computações Reais
  const stats = useMemo(() => {
    if (!leads) return { totais: 0, concluidos: 0, finalizados: 0, abertos: 0, taxa: 0 };
    
    const totais = leads.length;
    const concluidos = leads.filter(l => l.status === 'fechado').length;
    const parados   = leads.filter(l => l.status === 'parado').length;
    const finalizados = concluidos + parados;
    const abertos = leads.filter(l => l.status === 'novo' || l.status === 'atendimento').length;
    const taxa = totais > 0 ? (concluidos / totais) * 100 : 0;

    return { totais, concluidos, finalizados, abertos, taxa };
  }, [leads]);


  // Gráfico de Dias Recentes (Últimos 7 dias agrupados)
  const chartData = useMemo(() => {
    if (!leads) return [];
    
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const hoje = new Date();
    
    // Preparar os últimos 7 dias na ordem certa
    let ultimos7dias = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - i);
      ultimos7dias.push({
        dateStr: d.toDateString(),
        name: dias[d.getDay()],
        leads: 0,
        conv: 0,
        data: d
      });
    }

    leads.forEach(lead => {
      const d = new Date(lead.created_at);
      const leadDateStr = d.toDateString();
      const obj = ultimos7dias.find(x => x.dateStr === leadDateStr);
      if (obj) {
        obj.leads++;
        if (lead.status === 'fechado') {
          obj.conv++;
        }
      }
    });

    return ultimos7dias;
  }, [leads]);


  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Bem-vindo de volta, {profile?.nome || 'Usuário'}!</h1>
        <p className="text-dark-muted-foreground">Aqui está o resumo do seu app alimentado por seus dados reais.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de Leads', value: stats.totais.toString(), icon: Users, trend: 'Novo', trendUp: true },
          { label: 'Leads Abertos', value: stats.abertos.toString(), icon: MessageSquare, trend: 'Ativos', trendUp: true },
          { label: 'Conversões Ganhas', value: stats.concluidos.toString(), icon: TrendingUp, trend: 'Vendas', trendUp: true },
          { label: 'Taxa de Conversão', value: `${stats.taxa.toFixed(1)}%`, icon: Clock, trend: 'Performance', trendUp: stats.taxa > 10 },
        ].map((stat, i) => (
          <div key={i} className="bg-dark-card p-6 rounded-2xl border border-dark-border group hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-dark-muted rounded-xl flex items-center justify-center text-dark-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.trendUp ? 'text-green-500' : 'text-primary'}`}>
                {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-dark-muted-foreground font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-dark-card p-6 rounded-2xl border border-dark-border">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg">Leads Recentes (7 Dias)</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF2E88" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF2E88" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="name" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #262626', borderRadius: '12px' }}
                  itemStyle={{ color: '#FF2E88' }}
                />
                <Area type="monotone" dataKey="leads" stroke="#FF2E88" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-dark-card p-6 rounded-2xl border border-dark-border">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg">Funil (Última Semana)</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-xs text-dark-muted-foreground font-medium">Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white/20"></div>
                <span className="text-xs text-dark-muted-foreground font-medium">Conversões</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="name" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #262626', borderRadius: '12px' }}
                />
                <Bar dataKey="leads" fill="#FF2E88" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conv" fill="#262626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-dark-card rounded-2xl border border-dark-border overflow-hidden">
        <div className="p-6 border-b border-dark-border flex items-center justify-between">
          <h3 className="font-bold text-lg">Últimos Leads Registrados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-dark-muted/50 text-dark-muted-foreground text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Lead</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Origem</th>
                <th className="px-6 py-4">Data Início</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {leads.slice(0, 10).map((lead) => (
                <tr key={lead.id} className="hover:bg-dark-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dark-muted flex items-center justify-center font-bold text-primary overflow-hidden border border-dark-border">
                        <img src={`https://i.pravatar.cc/100?u=${lead.id}`} alt={lead.nome} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold">{lead.nome}</div>
                        <div className="text-xs text-dark-muted-foreground">{lead.telefone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      lead.status === 'novo'        ? 'bg-blue-500/10 text-blue-500' :
                      lead.status === 'atendimento' ? 'bg-yellow-500/10 text-yellow-500' :
                      lead.status === 'fechado'     ? 'bg-green-500/10 text-green-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {lead.status === 'novo'        ? 'Novo' :
                       lead.status === 'atendimento' ? 'Em Atendimento' :
                       lead.status === 'fechado'     ? 'Fechado' : 'Parado'}
                    </span>

                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-dark-muted-foreground truncate max-w-[200px] capitalize">{lead.origem || 'WhatsApp'}</div>
                  </td>

                  <td className="px-6 py-4 font-bold text-sm text-dark-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-dark-muted rounded-lg transition-colors text-dark-muted-foreground hover:text-primary">
                      <Zap className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && (
            <div className="text-center py-10 text-dark-muted-foreground">
              Nenhum lead encontrado ainda. Configure seu WhatsApp para começar!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
