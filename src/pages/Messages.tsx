import { useState, useRef, useEffect, useCallback } from 'react';
import { useMatches } from '@/hooks/useMatches';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, GraduationCap, MessageCircle, Reply, Pencil, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Message } from '@/types';

export default function Messages() {
  const { connected } = useMatches();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedMatch = connected.find((m) => m.connectionId === selectedConnectionId);

  // Fetch messages for selected connection
  const fetchMessages = useCallback(async (connId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('connection_id', connId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
  }, []);

  useEffect(() => {
    if (!selectedConnectionId) return;
    setMessages([]);
    fetchMessages(selectedConnectionId);

    // Realtime subscription
    const channel = supabase
      .channel(`messages-${selectedConnectionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `connection_id=eq.${selectedConnectionId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConnectionId, fetchMessages]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [messages.length]);

  const sendMessage = async () => {
    if (!draft.trim() || !selectedConnectionId || !user || sending) return;

    const messageText = draft.trim();
    setSending(true);

    if (editingMessage) {
      const { error } = await supabase
        .from('messages')
        .update({ content: messageText, is_edited: true })
        .eq('id', editingMessage.id);

      if (error) {
        toast.error('Erro ao editar mensagem. Tente novamente.');
      } else {
        setMessages((prev) => prev.map((m) =>
          m.id === editingMessage.id ? { ...m, content: messageText, is_edited: true } : m
        ));
        setEditingMessage(null);
        setDraft('');
      }
    } else {
      setDraft('');
      const { error } = await supabase.from('messages').insert({
        connection_id: selectedConnectionId,
        sender_id: user.id,
        content: messageText,
        reply_to_id: replyingTo?.id || null,
      });

      if (error) {
        toast.error('Erro ao enviar mensagem. Tente novamente.');
        setDraft(messageText);
      } else {
        setReplyingTo(null);
      }
    }

    setSending(false);
  };

  const showChat = isMobile ? !!selectedConnectionId : true;
  const showList = isMobile ? !selectedConnectionId : true;

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const canEditMessage = (msg: Message) => {
    if (!user || msg.sender_id !== user.id) return false;
    const fifteenMinutesMs = 15 * 60 * 1000;
    const elapsed = Date.now() - new Date(msg.created_at).getTime();
    return elapsed <= fifteenMinutesMs;
  };

  const messagesById = messages.reduce((acc, msg) => {
    acc[msg.id] = msg;
    return acc;
  }, {} as Record<string, Message>);

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold mb-4">Mensagens</h1>
      <div className="flex h-[calc(100%-3rem)] border rounded-xl overflow-hidden bg-card">
        {showList && (
          <div className={cn('border-r flex flex-col', isMobile ? 'w-full' : 'w-80 shrink-0')}>
            <div className="p-3 border-b">
              <p className="text-sm font-medium text-muted-foreground">Conexões ({connected.length})</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {connected.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Faça matches para começar a conversar!
                </div>
              ) : (
                connected.map((m) => (
                  <button
                    key={m.connectionId}
                    onClick={() => setSelectedConnectionId(m.connectionId!)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left',
                      selectedConnectionId === m.connectionId && 'bg-accent'
                    )}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={m.student.avatar} alt={m.student.name} />
                      <AvatarFallback>{m.student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{m.student.name}</p>
                      <p className="text-xs text-muted-foreground truncate">Inicie a conversa!</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {showChat && (
          <div className="flex-1 flex flex-col min-w-0">
            {selectedMatch ? (
              <>
                <div className="flex items-center gap-3 p-3 border-b">
                  {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => setSelectedConnectionId(null)} className="shrink-0">
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={selectedMatch.student.avatar} />
                    <AvatarFallback>{selectedMatch.student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{selectedMatch.student.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <GraduationCap className="w-3 h-3" />
                      {selectedMatch.student.course}
                    </div>
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">Comece a conversa! 💬</p>
                  )}
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    const repliedMessage = msg.reply_to_id ? messagesById[msg.reply_to_id] : null;

                    return (
                      <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                        <div className="max-w-[75%] group">
                          <div className={cn(
                          'rounded-2xl px-4 py-2 text-sm',
                          isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'
                        )}>
                          {repliedMessage && (
                            <div className={cn(
                              'mb-2 rounded-md border-l-2 px-2 py-1 text-xs opacity-85',
                              isMe ? 'bg-primary-foreground/10 border-primary-foreground/40' : 'bg-background/70 border-muted-foreground/30'
                            )}>
                              <p className={cn('font-medium truncate', isMe ? 'text-primary-foreground/90' : 'text-foreground/80')}>
                                {repliedMessage.sender_id === user?.id ? 'Você' : selectedMatch?.student.name}
                              </p>
                              <p className={cn('truncate', isMe ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                                {repliedMessage.content}
                              </p>
                            </div>
                          )}
                          <p>{msg.content}</p>
                          <p className={cn('text-[10px] mt-1', isMe ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                            {formatTime(msg.created_at)} {msg.is_edited ? '(Editada)' : ''}
                          </p>
                          </div>
                          <div className={cn('mt-1 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity', isMe ? 'justify-end' : 'justify-start')}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                setReplyingTo(msg);
                                setEditingMessage(null);
                              }}
                            >
                              <Reply className="w-3 h-3 mr-1" /> Responder
                            </Button>
                            {canEditMessage(msg) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  setEditingMessage(msg);
                                  setReplyingTo(null);
                                  setDraft(msg.content);
                                }}
                              >
                                <Pencil className="w-3 h-3 mr-1" /> Editar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 border-t space-y-2">
                  {replyingTo && (
                    <div className="flex items-start justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          A responder a {replyingTo.sender_id === user?.id ? 'você' : selectedMatch.student.name}
                        </p>
                        <p className="text-xs truncate">{replyingTo.content}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        onClick={() => setReplyingTo(null)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                  {editingMessage && (
                    <div className="flex items-start justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">A editar mensagem</p>
                        <p className="text-xs truncate">{editingMessage.content}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        onClick={() => {
                          setEditingMessage(null);
                          setDraft('');
                        }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                  <Input
                    placeholder={editingMessage ? 'Edite sua mensagem...' : 'Digite sua mensagem...'}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={sendMessage} disabled={!draft.trim() || sending}>
                    <Send className="w-4 h-4" />
                  </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Selecione uma conversa para começar
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
