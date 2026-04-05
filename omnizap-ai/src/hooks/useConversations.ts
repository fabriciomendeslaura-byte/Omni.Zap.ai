import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ConversationList {
  lead_id: string;
  user_id: string;
  lead_nome: string;
  lead_telefone: string;
  lead_status: string;
  ultima_atividade?: string;
  ultima_mensagem: string;
  ultima_origem: string;
  ultima_msg_at: string;
  session_id: string;
  total_mensagens?: number;
  unreadCount?: number;
}

export interface ConversationMessage {
  id: string;
  lead_id: string;
  session_id?: string;
  mensagem: string;
  origem: 'cliente' | 'ia' | 'humano';
  created_at: string;
}

// ────────────────────────────────────────────────────────────
// Hook: lista de conversas (lê da view n8n_conversations_list)
// ────────────────────────────────────────────────────────────
export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<ConversationList[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      // Tenta buscar da view n8n_conversations_list primeiro
      const { data: n8nData, error: n8nError } = await supabase
        .from('n8n_conversations_list')
        .select('*')
        .eq('user_id', userId)
        .order('ultima_msg_at', { ascending: false });

      if (!n8nError && n8nData && n8nData.length > 0) {
        const formatted = n8nData.map((item: any) => ({
          lead_id:         item.lead_id || item.session_id,
          user_id:         item.user_id,
          lead_nome:       item.lead_nome || item.lead_telefone || item.session_id,
          lead_telefone:   item.lead_telefone || '',
          lead_status:     item.lead_status || 'novo',
          ultima_mensagem: item.ultima_mensagem || '',
          ultima_origem:   item.ultima_origem || 'ia',
          ultima_msg_at:   item.ultima_msg_at || '',
          session_id:      item.session_id,
          total_mensagens: item.total_mensagens || 0,
          unreadCount:     0,
        }));
        setConversations(formatted);
        return;
      }

      // Fallback: lê da view conversation_list (legada)
      const { data: legacyData, error: legacyError } = await supabase
        .from('conversation_list')
        .select('*')
        .eq('user_id', userId)
        .order('ultima_msg_at', { ascending: false });

      if (legacyError) throw legacyError;

      const formatted = (legacyData || []).map((chat: any) => ({
        ...chat,
        session_id: chat.lead_id,
        unreadCount: 0,
      }));
      setConversations(formatted);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConversations();

    if (!userId) return;

    // Realtime: atualiza lista quando novas mensagens chegam do N8N
    const channel = supabase
      .channel(`n8n_chat:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'n8n_chat_histories',
        },
        () => fetchConversations()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${userId}`,
        },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchConversations]);

  return { conversations, loading, refetch: fetchConversations };
}

// ────────────────────────────────────────────────────────────
// Hook: mensagens de uma conversa específica
// Lê da view n8n_messages (n8n_chat_histories formatado)
// ────────────────────────────────────────────────────────────
export function useChatMessages(sessionId: string | undefined) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);

        // Tenta buscar do N8N (view n8n_messages)
        const { data: n8nData, error: n8nError } = await supabase
          .from('n8n_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('id', { ascending: true });

        if (!n8nError && n8nData && n8nData.length > 0) {
          setMessages(
            n8nData.map((m: any) => ({
              id:         m.id,
              lead_id:    m.session_id,
              session_id: m.session_id,
              mensagem:   m.mensagem || '',
              origem:     m.origem as 'cliente' | 'ia' | 'humano',
              created_at: m.created_at,
            }))
          );
          return;
        }

        // Fallback: lê da tabela conversations (legada)
        const { data: legacyData, error: legacyError } = await supabase
          .from('conversations')
          .select('*')
          .eq('lead_id', sessionId)
          .order('created_at', { ascending: true });

        if (legacyError) throw legacyError;
        setMessages(legacyData || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Realtime: novas mensagens chegando do N8N em tempo real
    const channel = supabase
      .channel(`n8n_msgs:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'n8n_chat_histories',
        },
        (payload) => {
          const row = payload.new as any;
          if (row.session_id !== sessionId) return;

          const content =
            row.message?.data?.content ||
            row.message?.content ||
            row.message?.kwargs?.content ||
            '';

          const origem: 'cliente' | 'ia' =
            (row.message?.type === 'human' || row.message?.data?.type === 'human')
              ? 'cliente'
              : 'ia';

          setMessages((prev) => [
            ...prev,
            {
              id:         row.id?.toString(),
              lead_id:    row.session_id,
              session_id: row.session_id,
              mensagem:   content,
              origem,
              created_at: row.created_at,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Envia mensagem manual (humano intervenindo)
  const sendMessage = async (
    userId: string,
    leadId: string,
    text: string,
    sender: 'humano' | 'ia'
  ) => {
    try {
      // Insere no n8n_chat_histories no formato padrão do N8N
      const { error } = await supabase
        .from('n8n_chat_histories')
        .insert([{
          session_id: leadId,
          message: {
            type: sender === 'humano' ? 'human' : 'ai',
            data: {
              content: text,
              type: sender === 'humano' ? 'human' : 'ai',
              additional_kwargs: { source: 'dashboard', user_id: userId },
            },
          },
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  return { messages, loading, sendMessage };
}
