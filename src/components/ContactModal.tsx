import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, Instagram, Mail } from 'lucide-react';

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

export function ContactModal({ open, onOpenChange, title = 'Entre em contato' }: ContactModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Fale com a equipe Uhome pelo canal que preferir.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button asChild className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
            <a href="https://wa.me/5566996308310" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-5 h-5" />
              WhatsApp (66) 99630-8310
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full gap-2">
            <a href="https://instagram.com/projetouhome" target="_blank" rel="noopener noreferrer">
              <Instagram className="w-5 h-5" />
              @projetouhome
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full gap-2">
            <a href="mailto:projetouhome@gmail.com">
              <Mail className="w-5 h-5" />
              projetouhome@gmail.com
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
