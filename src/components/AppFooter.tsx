import { Instagram, MessageCircle, Mail } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="border-t bg-card py-6 px-4 mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>Desenvolvido por alunos da UFU 💜</span>
        <div className="flex items-center gap-4">
          <a href="https://instagram.com/projetouhome" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            <Instagram className="w-5 h-5" />
          </a>
          <a href="https://wa.me/5566996308310" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            <MessageCircle className="w-5 h-5" />
          </a>
          <a href="mailto:projetouhome@gmail.com" className="hover:text-primary transition-colors">
            <Mail className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
