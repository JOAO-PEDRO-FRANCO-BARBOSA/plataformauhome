import { useState, useRef, useEffect } from 'react';
import { useMatches } from '@/hooks/useMatches';
import { mockMessages, ChatMessage } from '@/data/mockMessages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, GraduationCap, MessageCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function Messages() {
  const { connected } = useMatches();
  const isMobile = useIsMobile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>(mockMessages);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedMatch = connected.find((m) => m.student.id === selectedId);
  const messages = selectedId ? conversations[selectedId] ?? [] : [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = () => {
    if (!draft.trim() || !selectedId) return;
    const msg: ChatMessage = { sender: 'me', text: draft.trim(), time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
    setConversations((prev) => ({ ...prev, [selectedId]: [...(prev[selectedId] ?? []), msg] }));
    setDraft('');
  };

  const showChat = isMobile ? !!selectedId : true;
  const showList = isMobile ? !selectedId : true;

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold mb-4">Mensagens</h1>
      <div className="flex h-[calc(100%-3rem)] border rounded-xl overflow-hidden bg-card">
        {/* Contact list */}
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
                connected.map((m) => {
                  const lastMsg = (conversations[m.student.id] ?? []).at(-1);
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedId(m.student.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left',
                        selectedId === m.student.id && 'bg-accent'
                      )}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={m.student.avatar} alt={m.student.name} />
                        <AvatarFallback>{m.student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{m.student.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{lastMsg?.text ?? 'Inicie a conversa!'}</p>
                      </div>
                      {lastMsg && <span className="text-[10px] text-muted-foreground shrink-0">{lastMsg.time}</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Chat window */}
        {showChat && (
          <div className="flex-1 flex flex-col min-w-0">
            {selectedMatch ? (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 p-3 border-b">
                  {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)} className="shrink-0">
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

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      Comece a conversa! 💬
                    </p>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={cn('flex', msg.sender === 'me' ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                          msg.sender === 'me'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        )}
                      >
                        <p>{msg.text}</p>
                        <p className={cn('text-[10px] mt-1', msg.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="p-3 border-t flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={sendMessage} disabled={!draft.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
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
