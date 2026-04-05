import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Send, 
  Phone, 
  Video, 
  Info,
  Bot,
  User,
  CheckCheck,
  MessageSquare,
  ChevronLeft,
  Zap
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../hooks/useAuth';
import { useConversations, useChatMessages, ConversationList } from '../hooks/useConversations';

 

export default function ConversationsPage() {
  const { user } = useAuth();
  const { conversations, loading } = useConversations(user?.id);
  
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const selectedChat = useMemo(() => conversations.find(c => c.lead_id === selectedChatId) || null, [conversations, selectedChatId]);
  
  // Usa session_id do N8N se disponível, senão usa lead_id como fallback
  const chatKey = selectedChat?.session_id || selectedChat?.lead_id;
  const { messages, loading: messagesLoading, sendMessage } = useChatMessages(chatKey);

  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiMode, setIsAiMode] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedChat]);

  const filteredChats = useMemo(() => {
    if (!searchQuery) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(chat => 
      chat.lead_nome?.toLowerCase().includes(query) || 
      chat.lead_telefone?.toLowerCase().includes(query)
    );
  }, [searchQuery, conversations]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedChat) return;

    const msgText = newMessage;
    setNewMessage('');

    await sendMessage(user.id, selectedChat.lead_id, msgText, isAiMode ? 'ia' : 'humano');
  };

  const toggleMode = () => {
    setIsAiMode(!isAiMode);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex bg-dark-card rounded-2xl border border-dark-border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sidebar - Chat List */}
      <div className="w-80 border-r border-dark-border flex flex-col">
        <div className="p-4 border-b border-dark-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-muted border border-dark-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredChats.map((chat) => (
            <button
              key={chat.lead_id}
              onClick={() => setSelectedChatId(chat.lead_id)}
              className={cn(
                "w-full p-4 flex items-center gap-3 hover:bg-dark-muted/50 transition-colors border-b border-dark-border/50 text-left",
                selectedChatId === chat.lead_id && "bg-dark-muted"
              )}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-dark-muted flex items-center justify-center font-bold text-primary border border-dark-border overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?u=${chat.lead_id}`} alt={chat.lead_nome} className="w-full h-full object-cover" />
                </div>
                {chat.ultima_origem === 'ia' && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full border-2 border-dark-card flex items-center justify-center">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold truncate text-sm">{chat.lead_nome || chat.lead_telefone}</span>
                  <span className="text-[10px] text-dark-muted-foreground">
                    {chat.ultima_msg_at ? new Date(chat.ultima_msg_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-dark-muted-foreground truncate">{chat.ultima_mensagem || 'Nenhuma mensagem'}</p>
                  {chat.unreadCount ? chat.unreadCount > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {chat.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-dark-background/50">
          {/* Chat Header */}
          <div className="h-20 border-b border-dark-border bg-dark-card flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-dark-muted flex items-center justify-center font-bold text-primary border border-dark-border overflow-hidden">
                <img src={`https://i.pravatar.cc/100?u=${selectedChat.lead_id}`} alt={selectedChat.lead_nome} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-bold text-base">{selectedChat.lead_nome || selectedChat.lead_telefone}</div>
                <div className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Online
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* AI/Human Toggle */}
              <div className="flex items-center bg-dark-muted rounded-full p-1 border border-dark-border">
                <button 
                  onClick={() => setIsAiMode(true)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                    isAiMode ? "bg-primary text-white shadow-lg" : "text-dark-muted-foreground hover:text-white"
                  )}
                >
                  <Bot className="w-3 h-3" />
                  IA Ativa
                </button>
                <button 
                  onClick={() => setIsAiMode(false)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                    !isAiMode ? "bg-white text-black shadow-lg" : "text-dark-muted-foreground hover:text-white"
                  )}
                >
                  <User className="w-3 h-3" />
                  Humano
                </button>
              </div>

              <div className="flex items-center gap-4 text-dark-muted-foreground border-l border-dark-border pl-6">
                <button className="hover:text-primary transition-colors"><Phone className="w-5 h-5" /></button>
                <button className="hover:text-primary transition-colors"><Video className="w-5 h-5" /></button>
                <button className="hover:text-primary transition-colors"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-90 scroll-smooth"
          >
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col max-w-[75%]",
                  (msg.origem === 'cliente') ? "mr-auto items-start" : "ml-auto items-end"
                )}
              >
                <div className={cn(
                  "p-4 rounded-2xl shadow-sm relative group",
                  (msg.origem === 'cliente')
                    ? "bg-primary text-white rounded-tl-none border border-dark-border" 
                    : "bg-dark-muted text-white rounded-tr-none"
                )}>
                  {msg.origem === 'ia' && (
                    <div className="flex items-center gap-1 mb-1 text-[10px] font-black uppercase tracking-widest text-primary/70">
                      <Zap className="w-3 h-3 fill-current" />
                      OmniZap AI
                    </div>
                  )}
                  <p className="text-sm leading-relaxed font-medium">{msg.mensagem}</p>
                  <div className={cn(
                    "flex items-center gap-1 mt-2 text-[10px]",
                    (msg.origem === 'cliente') ? "text-white/70" : "text-dark-muted-foreground"
                  )}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {msg.origem !== 'cliente' && <CheckCheck className="w-3 h-3 text-primary" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-dark-card border-t border-dark-border">
            <form onSubmit={handleSendMessage} className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-dark-muted-foreground">
                <button type="button" className="p-2 hover:bg-dark-muted rounded-full transition-colors"><Smile className="w-5 h-5" /></button>
                <button type="button" className="p-2 hover:bg-dark-muted rounded-full transition-colors"><Paperclip className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  className="w-full bg-dark-muted border border-dark-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <button 
                type="submit"
                className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-dark-muted-foreground bg-dark-background/50">
          <div className="w-20 h-20 bg-dark-muted rounded-3xl flex items-center justify-center mb-6 border border-dark-border">
            <MessageSquare className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-dark-foreground mb-2">Selecione uma conversa</h3>
          <p className="text-sm">Escolha um lead para começar a conversar.</p>
        </div>
      )}
    </div>
  );
}
