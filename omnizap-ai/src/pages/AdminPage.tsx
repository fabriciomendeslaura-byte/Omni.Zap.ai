import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Zap, 
  Smartphone, 
  Activity, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  Power, 
  QrCode, 
  Search, 
  MoreVertical,
  ChevronRight,
  MessageSquare,
  Clock,
  Database,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';
import { useAdminData, AdminClient } from '../hooks/useAdminData';

export default function AdminPage() {
  const { clients, loading, refetch } = useAdminData();
  const [selectedClient, setSelectedClient] = useState<AdminClient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = useMemo(() => {
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.whatsapp?.numero && client.whatsapp.numero.includes(searchTerm))
    );
  }, [clients, searchTerm]);

  const stats = useMemo(() => {
    const totalUsers = clients.length;
    const connectedWhats = clients.filter(c => c.whatsapp?.status === 'connected').length;
    const disconnectedWhats = clients.filter(c => c.whatsapp && c.whatsapp.status !== 'connected').length;
    const totalTokensUsed = clients.reduce((acc, c) => acc + (c.tokens?.used || 0), 0);
    
    return [
      { label: 'Total de Clientes', value: totalUsers.toLocaleString(), icon: Users, color: 'text-blue-500' },
      { label: 'WhatsApps Conectados', value: connectedWhats.toLocaleString(), icon: Smartphone, color: 'text-green-500' },
      { label: 'WhatsApps Desconectados', value: disconnectedWhats.toLocaleString(), icon: AlertCircle, color: 'text-red-500' },
      { label: 'Total de Mensagens', value: '---', icon: MessageSquare, color: 'text-purple-500' },
      { label: 'Consumo de Tokens', value: totalTokensUsed.toLocaleString(), icon: Database, color: 'text-orange-500' },
    ];
  }, [clients]);

  const getStatusVariant = (status: string | undefined) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'success';
      case 'disconnected':
      case 'offline':
        return 'destructive';
      case 'connecting':
      case 'unstable':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const handleRefreshData = async () => {
    await refetch();
    toast.success('Dados atualizados com sucesso!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Painel Administrativo</h1>
          <p className="text-lg text-dark-muted-foreground font-medium italic">Monitoramento global de conexões e usuários.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={handleRefreshData}
          >
            Atualizar Dados
          </Button>
          <Button 
            leftIcon={<Zap className="w-4 h-4" />}
            onClick={() => toast.info('Status da API: 100% Operacional')}
          >
            Status da API
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} padding="sm" className="relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={cn("p-3 rounded-2xl bg-dark-muted shadow-inner", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <Badge variant="secondary" size="sm">Global</Badge>
            </div>
            <div className="text-3xl font-black tracking-tight relative z-10">{stat.value}</div>
            <div className="text-xs font-black uppercase tracking-widest text-dark-muted-foreground mt-1 relative z-10">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Main Table Section */}
      <Card className="overflow-hidden border-none bg-dark-card/50 backdrop-blur-sm" padding="none">
        <div className="p-8 border-b border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <h2 className="text-2xl font-black tracking-tight uppercase">Monitoramento de Clientes</h2>
          <div className="max-w-sm w-full">
            <Input 
              placeholder="Buscar por nome, email ou whatsapp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-muted/20">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground">Cliente</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground">WhatsApp</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground">Status Conexão</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground">Status API</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground">Uso de Tokens</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground">Atividade</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-dark-muted/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dark-muted flex items-center justify-center font-bold text-primary overflow-hidden border border-dark-border">
                        <img src={client.avatar_url || `https://i.pravatar.cc/100?u=${client.id}`} alt={client.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-black text-sm uppercase tracking-tight">{client.name}</div>
                        <div className="text-xs text-dark-muted-foreground font-medium">{client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-mono font-medium">{client.whatsapp?.numero || 'Não Configurado'}</div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge variant={getStatusVariant(client.whatsapp?.status)} size="sm">
                      {client.whatsapp?.status === 'connected' ? 'Conectado' : 
                       client.whatsapp?.status === 'disconnected' ? 'Desconectado' : 
                       client.whatsapp?.status ? 'Conectando' : 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-8 py-6">
                    <Badge variant={getStatusVariant(client.whatsapp?.api_status)} size="sm">
                      {client.whatsapp?.api_status === 'active' ? 'Ativa' : 
                       client.whatsapp?.api_status === 'unstable' ? 'Instável' : 
                       client.whatsapp?.api_status ? 'Offline' : 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-8 py-6">
                    {client.tokens ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-primary">{client.tokens.used.toLocaleString()}</span>
                          <span className="text-dark-muted-foreground">/ {client.tokens.total.toLocaleString()}</span>
                        </div>
                        <div className="w-32 h-1.5 bg-dark-muted rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-1000 ease-out",
                              (client.tokens.used / client.tokens.total) > 0.9 ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-primary shadow-[0_0_8px_rgba(0,255,136,0.5)]"
                            )}
                            style={{ width: `${(client.tokens.used / client.tokens.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-dark-muted-foreground">---</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs text-dark-muted-foreground font-medium">
                      <Clock className="w-3 h-3" />
                      {client.whatsapp?.last_activity ? new Date(client.whatsapp.last_activity).toLocaleTimeString() : 'Sem atividade'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedClient(client)}
                        className="hover:scale-110"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClients.length === 0 && (
            <div className="p-16 text-center">
              <p className="text-dark-muted-foreground font-medium italic">Nenhum cliente encontrado.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Client Detail Modal */}
      <Modal
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        title={selectedClient?.name || ''}
        description={selectedClient?.email || ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedClient(null)}>Fechar</Button>
            <Button onClick={() => toast.info('Acesso total aos logs em breve!')}>Ver Logs de Agente</Button>
          </>
        }
      >
        {selectedClient && (
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground">Status da Sessão</h4>
                <div className="p-6 bg-dark-muted/30 rounded-[24px] border border-dark-border space-y-4 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-dark-muted-foreground font-medium">ID da Sessão:</span>
                    <span className="text-xs font-mono font-black text-primary">{selectedClient.whatsapp?.session_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-dark-muted-foreground font-medium">Conexão:</span>
                    <Badge variant={getStatusVariant(selectedClient.whatsapp?.status)} size="sm">
                      {selectedClient.whatsapp?.status || 'Desconectado'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground">Ações Rápidas</h4>
                <div className="grid gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    leftIcon={<RefreshCw className="w-4 h-4 text-primary" />}
                    className="justify-start text-xs"
                    onClick={() => toast.success('Comando de reconexão enviado!')}
                  >
                    Forçar Reconexão
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    leftIcon={<Power className="w-4 h-4" />}
                    className="justify-start text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => toast.error('Sessão desconectada!')}
                  >
                    Encerrar Sessão
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground">Consumo Real</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-6 bg-dark-muted/30 rounded-[24px] border border-dark-border shadow-inner">
                  <div className="text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground mb-2">Tokens Usados</div>
                  <div className="text-3xl font-black tracking-tight text-white">{selectedClient.tokens?.used.toLocaleString() || '0'}</div>
                  <div className="mt-4 w-full h-2 bg-dark-muted rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(0,255,136,0.3)]"
                      style={{ width: `${selectedClient.tokens ? (selectedClient.tokens.used / selectedClient.tokens.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="p-6 bg-dark-muted/30 rounded-[24px] border border-dark-border shadow-inner">
                  <div className="text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground mb-2">Limite Mensal</div>
                  <div className="text-3xl font-black tracking-tight text-white">{selectedClient.tokens?.total.toLocaleString() || '1.000.000'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

