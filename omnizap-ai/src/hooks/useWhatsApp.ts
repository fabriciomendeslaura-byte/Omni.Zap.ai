import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface WhatsAppConnection {
  id: string;
  user_id: string;
  numero: string;
  session_id: string;
  status: 'connected' | 'disconnected' | 'connecting';
  api_status: string;
  last_activity: string;
  created_at: string;
}

export interface TokenUsage {
  tokens_usados: number;
  limite_tokens: number;
}

export function useWhatsApp(userId: string | undefined) {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({ tokens_usados: 0, limite_tokens: 100000 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      const [connResult, tokenResult] = await Promise.all([
        supabase.from('whatsapp_connections').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('tokens_usage').select('*').eq('user_id', userId).maybeSingle(),
      ]);

      if (connResult.data) setConnection(connResult.data);
      if (tokenResult.data) setTokenUsage(tokenResult.data);
    } catch (error) {
      console.error('Error fetching whatsapp/token data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();

    if (!userId) return;

    const channel = supabase
      .channel(`whatsapp:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'whatsapp_connections',
        filter: `user_id=eq.${userId}`,
      }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchData]);

  const saveConnection = async (data: Partial<WhatsAppConnection>) => {
    if (!userId) return null;
    try {
      // Upsert — cria se não existe, atualiza se já existe
      const { data: result, error } = await supabase
        .from('whatsapp_connections')
        .upsert([{ ...data, user_id: userId }], { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      setConnection(result);
      return result;
    } catch (error) {
      console.error('Error saving whatsapp connection:', error);
      return null;
    }
  };

  const disconnectWhatsApp = async () => {
    if (!connection) return false;
    try {
      const { error } = await supabase
        .from('whatsapp_connections')
        .update({ status: 'disconnected' })
        .eq('id', connection.id);
      if (error) throw error;
      setConnection(prev => prev ? { ...prev, status: 'disconnected' } : null);
      return true;
    } catch (error) {
      console.error('Error disconnecting whatsapp:', error);
      return false;
    }
  };

  return { connection, tokenUsage, loading, saveConnection, disconnectWhatsApp, refetch: fetchData };
}
