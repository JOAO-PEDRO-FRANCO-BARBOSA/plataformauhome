import { FormEvent, useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type FeedbackType = 'Ideia' | 'Problema' | 'Outro';

export function FeedbackWidget() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('Ideia');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      toast({
        title: 'Mensagem obrigatória',
        description: 'Digite sua mensagem antes de enviar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-feedback', {
        body: {
          type,
          message: trimmedMessage,
        },
      });

      if (error) throw error;

      toast({
        title: 'Feedback enviado com sucesso!',
      });

      setType('Ideia');
      setMessage('');
      setOpen(false);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Não foi possível enviar agora.';
      toast({
        title: 'Falha ao enviar feedback',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed right-4 z-50 bottom-[5.5rem] md:bottom-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">Abrir formulário de feedback</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" side="top" className="w-80 space-y-4">
          <div>
            <h3 className="text-base font-semibold">Enviar Feedback</h3>
            <p className="text-xs text-muted-foreground">Sua opinião ajuda a melhorar a UHOME.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Tipo de feedback</Label>
              <RadioGroup value={type} onValueChange={(value) => setType(value as FeedbackType)} className="grid grid-cols-3 gap-2">
                <label htmlFor="feedback-type-ideia" className="flex items-center gap-2 rounded-md border px-2 py-2 text-xs cursor-pointer">
                  <RadioGroupItem id="feedback-type-ideia" value="Ideia" />
                  Ideia
                </label>
                <label htmlFor="feedback-type-problema" className="flex items-center gap-2 rounded-md border px-2 py-2 text-xs cursor-pointer">
                  <RadioGroupItem id="feedback-type-problema" value="Problema" />
                  Problema
                </label>
                <label htmlFor="feedback-type-outro" className="flex items-center gap-2 rounded-md border px-2 py-2 text-xs cursor-pointer">
                  <RadioGroupItem id="feedback-type-outro" value="Outro" />
                  Outro
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">Mensagem *</Label>
              <Textarea
                id="feedback-message"
                placeholder="Conte sua sugestão, dificuldade ou ideia..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
                minLength={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar'
              )}
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
