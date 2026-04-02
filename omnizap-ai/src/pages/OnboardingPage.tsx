import { cn } from '../utils/cn';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Building2, Target, Rocket, Loader2, Check, ArrowRight } from 'lucide-react';

interface OnboardingPageProps {
  onComplete: () => void;
}

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [niche, setNiche] = useState('');
  const [objective, setObjective] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleFinish();
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsLoading(true);
    console.log('Finalizando configuração para usuário:', user.id);
    
    try {
      // Tenta salvar no Supabase com um limite de tempo (3s)
      const savePromise = supabase
        .from('profiles')
        .update({ 
          empresa: companyName,
          nicho: niche,
          objetivo: objective
        })
        .eq('id', user.id);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Onboarding DB timeout')), 3000)
      );

      await Promise.race([savePromise, timeoutPromise]).catch(err => {
        console.warn('Aviso no salvamento do onboarding (fallback ativado):', err);
      });

      console.log('Onboarding concluído localmente.');
      
      // Update local profile state
      updateProfile({ 
        empresa: companyName,
        nicho: niche,
        objetivo: objective
      });
      
      // Persist locally as primary hint for this browser
      localStorage.setItem('omni_onboarding', 'true');
      
      // Redirecionamento quase imediato
      onComplete();
    } catch (error: any) {
      console.error('Erro crítico no onboarding:', error);
      // Fallback total: Prossegue de qualquer forma para não travar o usuário
      onComplete();
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white p-12 rounded-[40px] shadow-2xl border border-border relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl text-primary mb-6">
            {step === 1 ? (
              <Building2 key="step1-icon" className="w-8 h-8" />
            ) : step === 2 ? (
              <Target key="step2-icon" className="w-8 h-8" />
            ) : (
              <Rocket key="step3-icon" className="w-8 h-8" />
            )}
          </div>
          <h1 className="text-4xl font-black mb-2">
            {step === 1 ? "Qual o nome da sua empresa?" : step === 2 ? "Qual o seu nicho?" : "Qual o seu objetivo?"}
          </h1>
          <p className="text-muted-foreground font-medium">Vamos configurar seu ambiente em segundos.</p>
        </div>

        <div key={`step-container-${step}`} className="space-y-8">
          {step === 1 ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <input 
                type="text" 
                autoFocus
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-muted border-2 border-transparent focus:border-primary focus:bg-white px-8 py-6 rounded-2xl outline-none transition-all text-2xl font-bold text-center"
                placeholder="Ex: OmniZap Solutions"
              />
            </div>
          ) : step === 2 ? (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {['E-commerce', 'Serviços', 'Educação', 'Imobiliário', 'Saúde', 'Outros'].map((item) => (
                <button
                  key={item}
                  onClick={() => setNiche(item)}
                  className={cn(
                    "p-6 rounded-2xl border-2 font-bold text-lg transition-all",
                    niche === item ? "border-primary bg-primary/5 text-primary" : "border-muted hover:border-primary/50"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {[
                { id: 'vendas', label: 'Aumentar Vendas', desc: 'Foco em conversão e fechamento.' },
                { id: 'atendimento', label: 'Suporte Automático', desc: 'Responder dúvidas frequentes 24h.' },
                { id: 'agendamento', label: 'Agendamentos', desc: 'Marcar reuniões e consultas.' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setObjective(item.id)}
                  className={cn(
                    "w-full p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between group",
                    objective === item.id ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                  )}
                >
                  <div>
                    <div className={cn("font-bold text-xl mb-1", objective === item.id ? "text-primary" : "")}>{item.label}</div>
                    <div className="text-muted-foreground font-medium">{item.desc}</div>
                  </div>
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                    objective === item.id ? "bg-primary border-primary text-white" : "border-muted group-hover:border-primary/50"
                  )}>
                    {objective === item.id && <Check className="w-5 h-5" />}
                  </div>
                </button>
              ))}
            </div>
          )}

          <button 
            onClick={handleNext}
            disabled={isLoading || (step === 1 && !companyName) || (step === 2 && !niche) || (step === 3 && !objective)}
            className="w-full bg-primary text-white py-6 rounded-2xl text-xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                {step === 3 ? "Finalizar Configuração" : "Próximo Passo"}
                <ArrowRight className="w-6 h-6" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
