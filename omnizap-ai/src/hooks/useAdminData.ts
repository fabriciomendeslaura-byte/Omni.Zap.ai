import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminClient {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  whatsapp?: {
    numero: string;
    status: string;
    api_status: string;
    session_id: string;
    last_activity: string;
  };
  tokens?: {
    used: number;
    total: number;
  };
  created_at: string;
}

export function useAdminData() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all core data
      const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
      const { data: connections, error: cError } = await supabase.from('whatsapp_connections').select('*');
      const { data: tokens, error: tError } = await supabase.from('tokens_usage').select('*');

      if (pError) throw pError;

      // Map combined object
      const mapped = profiles.map((p: any) => {
        const conn = connections?.find((c: any) => c.user_id === p.id);
        const tok = tokens?.find((t: any) => t.user_id === p.id);
        
        return {
          id: p.id,
          name: p.nome || 'Sem Nome',
          email: p.email,
          avatar_url: p.avatar_url,
          whatsapp: conn ? {
            numero: conn.numero,
            status: conn.status,
            api_status: conn.api_status,
            session_id: conn.session_id,
            last_activity: conn.last_activity
          } : undefined,
          tokens: tok ? {
            used: Number(tok.tokens_usados),
            total: Number(tok.limite_tokens)
          } : { used: 0, total: 1000000 },
          created_at: p.created_at
        };
      });

      setClients(mapped);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  return { clients, loading, refetch: fetchAdminData };
}
