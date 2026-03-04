import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyTitle: string;
  price: number;
}

const SERVICE_FEE_RATE = 0.08;

export function CheckoutModal({ open, onOpenChange, propertyTitle, price }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);

  const breakdown = useMemo(() => {
    const rent = Number.isFinite(price) ? Math.max(price, 0) : 0;
    const fee = Number((rent * SERVICE_FEE_RATE).toFixed(2));
    const total = Number((rent + fee).toFixed(2));
    return { rent, fee, total };
  }, [price]);

  const toCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleMockPayment = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      toast.success('Redirecionamento para o Stripe simulado com sucesso.');
      onOpenChange(false);
    } catch {
      toast.error('Não foi possível iniciar o pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resumo da Reserva</DialogTitle>
          <DialogDescription>{propertyTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Valor do Aluguel</span>
            <span className="font-medium">{toCurrency(breakdown.rent)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Taxa de Garantia Uhome (8%)</span>
            <span className="font-medium">{toCurrency(breakdown.fee)}</span>
          </div>

          <Separator />

          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total a Pagar</span>
            <span className="text-primary">{toCurrency(breakdown.total)}</span>
          </div>
        </div>

        <Button onClick={handleMockPayment} disabled={loading} className="w-full" size="lg">
          {loading ? 'Redirecionando...' : 'Pagar com Stripe'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
