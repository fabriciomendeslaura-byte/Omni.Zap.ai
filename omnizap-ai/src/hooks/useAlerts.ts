import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Alert {
  id: string;
  user_id: string;
  tipo: 'whatsapp_desconectado' | 'api_offline' | 'erro_envio' | 'falha_automacao' | 'sessao_expirada' | 'limite_tokens';
  descricao: string;
  status: 'ativo' | 'resolvido';
  created_at: string;
}

export function useAlerts(userId: string | undefined) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!userId) return;

    fetchAlerts();

    const channel = supabase
      .channel('public:alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts', filter: `user_id=eq.${userId}` }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const resolveAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ status: 'resolvido' })
        .eq('id', id);
      
      if (error) throw error;
      
      // Optmistic update
      setAlerts(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (error) {
      console.error('Error resolving alert:', error);
      return false;
    }
  };

  return { alerts, loading, resolveAlert, refetch: fetchAlerts };
}
