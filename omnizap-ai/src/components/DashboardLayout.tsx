import { useState, useEffect, ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Bot, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Zap,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../utils/cn';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
  { icon: MessageSquare, label: 'Conversas', path: '/app/conversations' },
  { icon: Users, label: 'Leads', path: '/app/leads' },
  { icon: Bot, label: 'Agentes IA', path: '/app/agents' },
  { icon: Calendar, label: 'Agendamentos', path: '/app/appointments' },
  { icon: BarChart3, label: 'Insights', path: '/app/insights' },
  { icon: Settings, label: 'Configurações', path: '/app/settings' },
  { icon: CreditCard, label: 'Planos', path: '/app/plans' },
  { icon: ShieldCheck, label: 'Admin', path: '/app/admin' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { user, profile } = useAuth(); // using global profile

  const handleLogout = async () => {
    try {
      // Tenta deslogar com timeout
      const logoutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout timeout')), 2000)
      );
      await Promise.race([logoutPromise, timeoutPromise]).catch(() => {});
    } catch {} finally {
      // Limpeza de TODOS os tokens — usando a key personalizada e a antiga
      localStorage.removeItem('omni_onboarding');
      localStorage.removeItem('omnizap-auth-token');
      // Limpa também qualquer chave antiga do Supabase que possa existir
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.includes('sb-')) localStorage.removeItem(key);
      }
      window.location.href = '/';
    }
  };




  return (
    <div className="flex h-screen bg-dark-background text-dark-foreground dark overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-dark-card border-r border-dark-border transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="text-white w-5 h-5 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight">OmniZap <span className="text-primary">AI</span></span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/app'}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-dark-muted-foreground hover:bg-dark-muted hover:text-dark-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-dark-border">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-dark-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-dark-border bg-dark-card flex items-center justify-between px-6">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-dark-muted-foreground hover:text-dark-foreground"
          >
            {isSidebarOpen ? <X /> : <Menu />}
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">{profile?.empresa || profile?.nome || 'Usuário'}</span>
              <span className="text-xs text-dark-muted-foreground capitalize">Plano {profile?.plano || 'Starter'}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-dark-muted flex items-center justify-center border border-dark-border overflow-hidden">
              <img src={profile?.avatar_url || "https://picsum.photos/seed/user/40/40"} alt="Avatar" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
