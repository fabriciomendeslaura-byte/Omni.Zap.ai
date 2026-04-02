import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ConversationList {
  lead_id: string;
  user_id: string;
  lead_nome: string;
  lead_telefone: string;
  lead_status: string;
  ultima_atividade: string;
  ultima_mensagem: string;
  ultima_origem: string;
  ultima_msg_at: string;
  unreadCount?: number;
}

export interface ConversationMessage {
  id: string;
  lead_id: string;
  mensagem: string;
  origem: 'cliente' | 'ia' | 'humano';
  created_at: string;
}

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<ConversationList[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch the conversation list view
  const fetchConversations = async () => {
    try {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('conversation_list')
        .select('*')
        .eq('user_id', userId)
        .order('ultima_msg_at', { ascending: false });


      if (error) throw error;
      
      // We can map this to add dummy unreadCount until we add unread tracking later
      const formatted = (data || []).map(chat => ({ ...chat, unreadCount: 0 }));
      setConversations(formatted);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    if (!userId) return;

    // Listen to changes in both leads and conversations tables to refresh the list
    const channel = supabase
      .channel('public:chat_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `user_id=eq.${userId}` }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `user_id=eq.${userId}` }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);


  return { conversations, loading, refetch: fetchConversations };
}

export function useChatMessages(leadId: string | undefined) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!leadId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Realtime sync for this specific lead's chat
    const channel = supabase
      .channel(`chat:lead:${leadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations', filter: `lead_id=eq.${leadId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ConversationMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  const sendMessage = async (userId: string, leadId: string, text: string, sender: 'humano' | 'ia') => {
    try {
      const { error } = await supabase
        .from('conversations')
        .insert([{
          user_id: userId,
          lead_id: leadId,
          mensagem: text,
          origem: sender
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
