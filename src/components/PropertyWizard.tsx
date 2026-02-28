import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropZone } from '@/components/DragDropZone';
import type { Campus } from '@/types';

const AMENITIES = [
  'Wi-Fi', 'Garagem', 'Mobiliado', 'Lavanderia',
  'Academia', 'Portaria 24h', 'Área gourmet', 'Quintal',
];

const CAMPUSES: Campus[] = ['Santa Mônica', 'Umuarama', 'Pontal', 'Glória'];

interface WizardData {
  address: string;
  campus: Campus | '';
  rooms: number;
  bathrooms: number;
  amenities: string[];
  photos: File[];
  docs: File[];
  noFiador: boolean;
  verified: boolean;
  price: string;
}

const initialData: WizardData = {
  address: '',
  campus: '',
  rooms: 1,
  bathrooms: 1,
  amenities: [],
  photos: [],
  docs: [],
  noFiador: false,
  verified: false,
  price: '',
};

export function PropertyWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const steps = ['Localização', 'Características', 'Fotos', 'Documentação'];
  const progress = ((step + 1) / steps.length) * 100;

  const toggleAmenity = (a: string) =>
    setData((d) => ({
      ...d,
      amenities: d.amenities.includes(a) ? d.amenities.filter((x) => x !== a) : [...d.amenities, a],
    }));

  const handlePublish = () => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      setSuccess(true);
    }, 2000);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="relative">
          <PartyPopper className="h-16 w-16 text-primary animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold">Anúncio Publicado!</h2>
        <p className="text-muted-foreground max-w-sm">
          Seu imóvel foi enviado para análise e estará disponível em breve.
        </p>
        <Button onClick={() => navigate('/host')} className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Ver Meus Anúncios
        </Button>
      </div>
    );
  }

  if (publishing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Publicando seu anúncio...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          {steps.map((s, i) => (
            <span key={s} className={i <= step ? 'text-primary font-medium' : ''}>{s}</span>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step content */}
      <div className="min-h-[320px]">
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Localização do Imóvel</h3>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço completo</Label>
              <Input
                id="address"
                placeholder="Rua, número, bairro"
                value={data.address}
                onChange={(e) => setData({ ...data, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Campus mais próximo</Label>
              <Select value={data.campus} onValueChange={(v) => setData({ ...data, campus: v as Campus })}>
                <SelectTrigger><SelectValue placeholder="Selecione o campus" /></SelectTrigger>
                <SelectContent>
                  {CAMPUSES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Características</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rooms">Quartos</Label>
                <Input
                  id="rooms"
                  type="number"
                  min={1}
                  value={data.rooms}
                  onChange={(e) => setData({ ...data, rooms: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baths">Banheiros</Label>
                <Input
                  id="baths"
                  type="number"
                  min={1}
                  value={data.bathrooms}
                  onChange={(e) => setData({ ...data, bathrooms: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comodidades</Label>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES.map((a) => (
                  <label key={a} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={data.amenities.includes(a)}
                      onCheckedChange={() => toggleAmenity(a)}
                    />
                    {a}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Fotos do Imóvel</h3>
            <DragDropZone
              accept="image/*"
              maxFiles={6}
              onFilesChange={(f) => setData({ ...data, photos: f })}
              label="Arraste fotos do imóvel ou clique para selecionar"
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Documentação e Preço</h3>
            <DragDropZone
              accept=".pdf,image/*"
              maxFiles={3}
              onFilesChange={(f) => setData({ ...data, docs: f })}
              label="Arraste contrato/comprovante (PDF ou foto)"
            />
            <div className="space-y-2">
              <Label htmlFor="price">Preço mensal (R$)</Label>
              <Input
                id="price"
                type="number"
                placeholder="850"
                value={data.price}
                onChange={(e) => setData({ ...data, price: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="nofiador">Sem fiador</Label>
              <Switch
                id="nofiador"
                checked={data.noFiador}
                onCheckedChange={(v) => setData({ ...data, noFiador: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="verified">Verificado</Label>
              <Switch
                id="verified"
                checked={data.verified}
                onCheckedChange={(v) => setData({ ...data, verified: v })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} className="gap-1">
            Avançar <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handlePublish} className="gap-1">
            Publicar <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
