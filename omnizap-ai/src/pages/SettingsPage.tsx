import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Smartphone, 
  Globe,
  Zap,
  ChevronRight,
  Mail,
  Lock,
  Key,
  LogOut,
  Plus,
  ExternalLink,
  CheckCircle2,
  Camera,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Switch } from '../components/ui/Switch';
import { useAuth } from '../hooks/useAuth';
import { useSettings, UserSettings } from '../hooks/useSettings';
import { supabase } from '../lib/supabase';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'billing' | 'devices' | 'integrations';

export default function SettingsPage() {
  const { user, profile, updateProfile } = useAuth();
  const { settings, updateSettings, loading: settingsLoading } = useSettings(user?.id);
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [avatar, setAvatar] = useState(profile?.avatar_url || "https://picsum.photos/seed/user/100/100");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: profile?.nome || '',
    companyName: profile?.empresa || '',
    phone: profile?.telefone || '',
    nicho: profile?.nicho || '',
    objetivo: profile?.objetivo || ''
  });


  const [whatsappConn, setWhatsappConn] = useState<any>(null);
  const [tokenUsage, setTokenUsage] = useState({ used: 0, total: 100000 });

  useEffect(() => {
    if (profile) {
      setAvatar(profile.avatar_url || "https://picsum.photos/seed/user/100/100");
      setProfileData({
        name: profile.nome || '',
        companyName: profile.empresa || '',
        phone: profile.telefone || '',
        nicho: profile.nicho || '',
        objetivo: profile.objetivo || ''
      });

      
      // Fetch dynamic data
      const fetchData = async () => {
        const { data: conn } = await supabase.from('whatsapp_connections').select('*').eq('user_id', profile.id).single();
        const { data: usage } = await supabase.from('tokens_usage').select('*').eq('user_id', profile.id).single();
        
        if (conn) setWhatsappConn(conn);
        if (usage) setTokenUsage({ used: Number(usage.tokens_usados), total: Number(usage.limite_tokens) });
      };
      
      fetchData();
    }
  }, [profile]);

  const integrations = [
    { 
      name: 'WhatsApp', 
      desc: 'Envio automático de mensagens.', 
      status: whatsappConn?.status === 'connected' ? 'Conectado' : 'Desconectado', 
      color: 'bg-green-500' 
    },
    { name: 'Google Calendar', desc: 'Sincronize seus agendamentos.', status: 'Desconectado', color: 'bg-blue-500' },
    { name: 'HubSpot CRM', desc: 'Sincronize leads e contatos.', status: 'Desconectado', color: 'bg-orange-500' },
    { name: 'Slack', desc: 'Notificações em canais.', status: 'Desconectado', color: 'bg-purple-500' },
  ];

  const [devices, setDevices] = useState([
    { id: 1, name: 'MacBook Pro 16"', os: 'macOS • Chrome', location: 'São Paulo, BR', current: true, icon: Globe },
    { id: 2, name: 'iPhone 15 Pro', os: 'iOS • App', location: 'São Paulo, BR', current: false, icon: Smartphone },
    { id: 3, name: 'Windows Desktop', os: 'Windows • Edge', location: 'Rio de Janeiro, BR', current: false, icon: Globe },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        toast.success('Imagem selecionada! Clique em Salvar Alterações para confirmar.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      let finalAvatarUrl = avatar;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        finalAvatarUrl = publicUrl;
      }

      const updates = {
        nome: profileData.name,
        empresa: profileData.companyName,
        telefone: profileData.phone,
        nicho: profileData.nicho,
        objetivo: profileData.objetivo,
        avatar_url: finalAvatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);


      if (error) throw error;

      updateProfile(updates);
      setAvatarFile(null);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error(`Erro ao salvar: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotification = async (key: string) => {
    if (!settings) return;
    const dbKey = `notifications_${key}` as keyof UserSettings;
    const newValue = !settings[dbKey];
    
    const success = await updateSettings({ [dbKey]: newValue });
    if (success) {
      toast.success('Preferência atualizada no banco de dados!');
    }
  };

  const handleToggleIntegration = (index: number) => {
    if (index === 0) {
      window.location.href = '/admin'; // Redirect to WhatsApp admin
      return;
    }
    toast.info('Essa integração estará disponível em breve!');
  };

  const handleRemoveDevice = (id: number) => {
    setDevices(prev => prev.filter(d => d.id !== id));
    toast.success('Sessão encerrada com sucesso!');
  };

  const handleLogoutAll = () => {
    setDevices(prev => prev.filter(d => d.current));
    toast.success('Todas as outras sessões foram encerradas!');
  };

  const handleDeleteAccount = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Conta excluída com sucesso. Redirecionando...');
      localStorage.clear();
      window.location.href = '/';
    } catch (error) {
      toast.error('Erro ao excluir conta.');
    } finally {
      setIsSaving(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleManagePlan = () => {
    setIsPlanModalOpen(true);
  };

  const tabs = [
    { id: 'profile' as const, icon: User, label: 'Perfil' },
    { id: 'notifications' as const, icon: Bell, label: 'Notificações' },
    { id: 'security' as const, icon: Shield, label: 'Segurança' },
    { id: 'billing' as const, icon: CreditCard, label: 'Faturamento' },
    { id: 'devices' as const, icon: Smartphone, label: 'Dispositivos' },
    { id: 'integrations' as const, icon: Globe, label: 'Integrações' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <Card className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                <div className="w-28 h-28 rounded-[32px] bg-dark-muted border-2 border-dark-border overflow-hidden shadow-2xl">
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px] text-white"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Mudar</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-2xl font-black tracking-tight mb-1">{profile?.nome_completo || 'Usuário'}</h3>
                <p className="text-sm text-dark-muted-foreground mb-4">{user?.email || 'email@exemplo.com'}</p>
                <Badge variant="primary">{profile?.role === 'admin' ? 'Administrador' : 'Usuário'}</Badge>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <Input 
                label="Seu Nome"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              />
              <Input 
                label="Nome da Empresa"
                value={profileData.companyName}
                onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
              />
              <Input 
                label="Telefone de Contato"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
              <Input 
                label="Nicho de Atuação"
                value={profileData.nicho}
                onChange={(e) => setProfileData({ ...profileData, nicho: e.target.value })}
                placeholder="Ex: Estética, Advogado, Vendas..."
              />
              <div className="sm:col-span-2">
                <Input 
                  label="Objetivo com a OmniZap"
                  value={profileData.objetivo}
                  onChange={(e) => setProfileData({ ...profileData, objetivo: e.target.value })}
                  placeholder="Ex: Automatizar agendamentos, triagem de leads..."
                />
              </div>
            </div>


            <div className="pt-8 border-t border-dark-border">
              <h4 className="text-lg font-black tracking-tight mb-6">Plano Atual</h4>
              <div className="bg-primary/5 border border-primary/20 rounded-[32px] p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30">
                    <Zap className="w-7 h-7 fill-current" />
                  </div>
                  <div>
                    <div className="font-black text-xl text-primary uppercase tracking-tight">Plano {profile?.plano || 'Starter'}</div>
                    <div className="text-xs text-dark-muted-foreground font-medium">Uso: {tokenUsage.used.toLocaleString()} / {tokenUsage.total.toLocaleString()} tokens</div>
                  </div>
                </div>
                <Button 
                  onClick={handleManagePlan}
                  variant="primary"
                  size="md"
                >
                  Gerenciar Plano
                </Button>
              </div>
            </div>

            <div className="pt-8 border-t border-dark-border flex flex-col sm:flex-row justify-end gap-4">
              <Button variant="ghost">Cancelar</Button>
              <Button 
                onClick={handleSaveProfile}
                isLoading={isSaving}
              >
                Salvar Alterações
              </Button>
            </div>
          </Card>
        );
      case 'notifications':
        return (
          <Card className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h3 className="text-2xl font-black tracking-tight mb-2">Notificações</h3>
              <p className="text-sm text-dark-muted-foreground font-medium">Escolha como você quer ser notificado sobre novos leads e agendamentos.</p>
            </div>
            
            <div className="space-y-4">
              {[
                { id: 'email' as const, title: 'E-mail', desc: 'Receba resumos diários e alertas de novos leads por e-mail.', icon: Mail },
                { id: 'push' as const, title: 'Push Mobile', desc: 'Notificações instantâneas no seu celular via app.', icon: Smartphone },
                { id: 'whatsapp' as const, title: 'WhatsApp', desc: 'Alertas críticos enviados diretamente para seu WhatsApp.', icon: Globe },
                { id: 'system' as const, title: 'Alertas do Sistema', desc: 'Notificações dentro do painel administrativo.', icon: Bell },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-6 bg-dark-muted/30 rounded-[24px] border border-dark-border hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-dark-muted rounded-2xl flex items-center justify-center text-primary shadow-inner">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-tight">{item.title}</h4>
                      <p className="text-xs text-dark-muted-foreground font-medium">{item.desc}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings?.[`notifications_${item.id}` as keyof UserSettings] as boolean || false} 
                    onChange={() => handleToggleNotification(item.id)} 
                  />
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-dark-border flex justify-end">
              <Button onClick={() => toast.success('Preferências de notificação salvas!')}>
                Salvar Preferências
              </Button>
            </div>
          </Card>
        );
      case 'security':
        return (
          <Card className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h3 className="text-2xl font-black tracking-tight mb-2">Segurança</h3>
              <p className="text-sm text-dark-muted-foreground font-medium">Proteja sua conta com autenticação em duas etapas e senhas fortes.</p>
            </div>

            <div className="space-y-8">
              <div className="space-y-6">
                <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                  <Lock className="w-4 h-4" /> Alterar Senha
                </h4>
                <div className="grid gap-4">
                  <Input type="password" placeholder="Senha Atual" leftIcon={<Lock className="w-4 h-4" />} />
                  <Input type="password" placeholder="Nova Senha" leftIcon={<Key className="w-4 h-4" />} />
                  <Input type="password" placeholder="Confirmar Nova Senha" leftIcon={<Key className="w-4 h-4" />} />
                </div>
                <button 
                  onClick={() => toast.info('Um link de recuperação foi enviado para seu e-mail.')}
                  className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
                >
                  Esqueceu sua senha?
                </button>
              </div>

              <div className="pt-8 border-t border-dark-border space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-dark-muted/30 rounded-[24px] border border-dark-border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-tight">Autenticação em Duas Etapas (2FA)</h4>
                      <p className="text-xs text-dark-muted-foreground font-medium">Adicione uma camada extra de segurança à sua conta.</p>
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => toast.info('Funcionalidade de 2FA será implementada em breve.')}
                  >
                    Ativar
                  </Button>
                </div>
              </div>

              <div className="pt-8 border-t border-dark-border space-y-6">
                <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                  <Smartphone className="w-4 h-4" /> Sessões Ativas
                </h4>
                <div className="space-y-3">
                  {devices.filter(d => d.current).map(device => (
                    <div key={device.id} className="flex items-center justify-between p-4 bg-dark-muted/30 rounded-2xl border border-dark-border">
                      <div className="flex items-center gap-4">
                        <device.icon className="w-5 h-5 text-dark-muted-foreground" />
                        <div>
                          <p className="text-xs font-black">{device.name} • {device.location}</p>
                          <p className="text-[10px] text-dark-muted-foreground font-medium">Ativo agora</p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">Atual</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-dark-border flex justify-end">
              <Button onClick={() => toast.success('Configurações de segurança atualizadas!')}>
                Atualizar Segurança
              </Button>
            </div>
          </Card>
        );
      case 'billing':
        return (
          <Card className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black tracking-tight mb-2">Faturamento</h3>
                <p className="text-sm text-dark-muted-foreground font-medium">Gerencie seus métodos de pagamento e histórico de faturas.</p>
              </div>
              <Badge variant="primary" size="md">Plano ProAtivo</Badge>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-8 bg-dark-muted/30 rounded-[32px] border border-dark-border space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground">Método de Pagamento</h4>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-10 bg-dark-muted rounded-xl border border-dark-border flex items-center justify-center shadow-inner">
                    <CreditCard className="w-6 h-6 text-dark-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-black">•••• •••• •••• 4242</p>
                    <p className="text-[10px] text-dark-muted-foreground font-medium">Expira em 12/28</p>
                  </div>
                </div>
                <button 
                  onClick={() => toast.info('Redirecionando para o portal de pagamentos...')}
                  className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
                >
                  Alterar Cartão
                </button>
              </div>

              <div className="p-8 bg-dark-muted/30 rounded-[32px] border border-dark-border space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-dark-muted-foreground">Próxima Fatura</h4>
                <div>
                  <p className="text-3xl font-black text-white tracking-tight">R$ 297,00</p>
                  <p className="text-[10px] text-dark-muted-foreground font-medium">Vencimento em 26 de Abril, 2026</p>
                </div>
                <button 
                  onClick={() => toast.info('Detalhes da fatura serão carregados...')}
                  className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>

            <div className="pt-8 border-t border-dark-border space-y-6">
              <h4 className="text-lg font-black tracking-tight">Histórico de Faturas</h4>
              <div className="space-y-3">
                {[
                  { date: '26 Mar, 2026', amount: 'R$ 297,00', status: 'Pago' },
                  { date: '26 Fev, 2026', amount: 'R$ 297,00', status: 'Pago' },
                  { date: '26 Jan, 2026', amount: 'R$ 297,00', status: 'Pago' },
                ].map((inv, i) => (
                  <div key={i} className="flex items-center justify-between p-6 hover:bg-dark-muted/20 rounded-[24px] transition-all border border-transparent hover:border-dark-border group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-dark-muted rounded-xl flex items-center justify-center shadow-inner">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm font-black">{inv.date}</p>
                        <p className="text-[10px] text-dark-muted-foreground font-medium">Fatura #INV-00{i+1}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm font-black">{inv.amount}</span>
                      <button 
                        onClick={() => toast.success('Download da fatura iniciado!')}
                        className="p-3 hover:bg-primary/10 hover:text-primary rounded-xl transition-all"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );
      case 'devices':
        return (
          <Card className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h3 className="text-2xl font-black tracking-tight mb-2">Dispositivos</h3>
              <p className="text-sm text-dark-muted-foreground font-medium">Gerencie os dispositivos onde sua conta está conectada.</p>
            </div>

            <div className="space-y-4">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-8 bg-dark-muted/30 rounded-[32px] border border-dark-border hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner",
                      device.current ? "bg-primary/20 text-primary" : "bg-dark-muted text-dark-muted-foreground"
                    )}>
                      <device.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-black text-sm uppercase tracking-tight">{device.name}</h4>
                        {device.current && <Badge variant="primary" size="sm">Atual</Badge>}
                      </div>
                      <p className="text-xs text-dark-muted-foreground font-medium">{device.os} • {device.location}</p>
                    </div>
                  </div>
                  {!device.current && (
                    <button 
                      onClick={() => handleRemoveDevice(device.id)}
                      className="p-3 hover:bg-destructive/10 text-dark-muted-foreground hover:text-destructive rounded-xl transition-all"
                    >
                      <LogOut className="w-6 h-6" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-dark-border">
              <button 
                onClick={handleLogoutAll}
                className="text-xs font-black uppercase tracking-widest text-destructive hover:underline"
              >
                Sair de todos os dispositivos
              </button>
            </div>
          </Card>
        );
      case 'integrations':
        return (
          <Card className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black tracking-tight mb-2">Integrações</h3>
                <p className="text-sm text-dark-muted-foreground font-medium">Conecte suas ferramentas favoritas para automatizar seu fluxo.</p>
              </div>
              <Button 
                size="sm" 
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => toast.info('App Store em breve!')}
              >
                Explorar App Store
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {integrations.map((app, i) => (
                <Card key={i} variant="muted" padding="sm" className="hover:border-primary/30 transition-all group">
                  <div className="flex items-center justify-between mb-6">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg", app.color)}>
                      {app.name[0]}
                    </div>
                    <Badge variant={app.status === 'Conectado' ? 'success' : 'secondary'} size="sm">
                      {app.status}
                    </Badge>
                  </div>
                  <h4 className="font-black text-sm uppercase tracking-tight mb-1">{app.name}</h4>
                  <p className="text-xs text-dark-muted-foreground font-medium mb-6 line-clamp-2">{app.desc}</p>
                  <Button 
                    variant={app.status === 'Conectado' ? 'outline' : 'primary'} 
                    className="w-full"
                    size="sm"
                    onClick={() => handleToggleIntegration(i)}
                  >
                    {app.status === 'Conectado' ? 'Desconectar' : 'Conectar'}
                  </Button>
                </Card>
              ))}
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black tracking-tight mb-3">Configurações</h1>
        <p className="text-lg text-dark-muted-foreground font-medium">Gerencie sua conta, planos e preferências do sistema.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-10">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-[24px] text-sm font-black uppercase tracking-widest transition-all",
                activeTab === item.id 
                  ? "bg-primary text-white shadow-xl shadow-primary/20" 
                  : "text-dark-muted-foreground hover:bg-dark-muted hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "text-dark-muted-foreground")} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-8">
          {renderContent()}

          {activeTab === 'profile' && (
            <Card 
              variant="outline" 
              className="bg-destructive/5 border-destructive/20 hover:bg-destructive/10 cursor-pointer group transition-all"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-lg text-destructive mb-1 uppercase tracking-tight">Excluir Conta</h4>
                  <p className="text-xs text-dark-muted-foreground font-medium">Todos os seus dados e agentes serão removidos permanentemente.</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Conta"
        description="Esta ação não pode ser desfeita."
        variant="destructive"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} isLoading={isSaving}>Excluir Permanentemente</Button>
          </>
        }
      >
        <div className="flex items-start gap-4 p-4 bg-destructive/10 rounded-2xl border border-destructive/20">
          <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
          <p className="text-sm text-destructive-foreground font-medium">
            Ao excluir sua conta, você perderá acesso a todos os seus agentes, leads e histórico de conversas. Esta operação é irreversível.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title="Gerenciar Plano"
        description="Escolha o plano ideal para o seu negócio."
        footer={
          <Button variant="primary" onClick={() => setIsPlanModalOpen(false)}>Fechar</Button>
        }
      >
        <div className="space-y-4">
          <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Zap className="w-6 h-6 text-primary" />
              <div>
                <p className="font-black uppercase tracking-tight">Plano Pro</p>
                <p className="text-xs text-dark-muted-foreground font-medium">R$ 297,00 / mês</p>
              </div>
            </div>
            <Badge variant="primary">Ativo</Badge>
          </div>
          <p className="text-sm text-dark-muted-foreground text-center font-medium italic">
            Para upgrades ou cancelamentos, entre em contato com nosso suporte.
          </p>
        </div>
      </Modal>
    </div>
  );
}

