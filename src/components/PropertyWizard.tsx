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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Campus } from '@/types';

const AMENITIES = ['Wi-Fi', 'Garagem', 'Mobiliado', 'Lavanderia', 'Academia', 'Portaria 24h', 'Área gourmet', 'Quintal'];
const CAMPUSES: Campus[] = ['Santa Mônica', 'Umuarama', 'Pontal', 'Glória'];

interface WizardData {
  address: string;
  campus: Campus | '';
  title: string;
  rooms: number;
  bathrooms: number;
  amenities: string[];
  photos: File[];
  docs: File[];
  noFiador: boolean;
  verified: boolean;
  price: string;
  acceptsPet: boolean;
  description: string;
}

const initialData: WizardData = {
  address: '', campus: '', title: '', rooms: 1, bathrooms: 1,
  amenities: [], photos: [], docs: [], noFiador: false, verified: false,
  price: '', acceptsPet: false, description: '',
};

const STEPS = ['Localização', 'Características', 'Documentação', 'Fotos'];

function validateStep(step: number, data: WizardData): string | null {
  switch (step) {
    case 0:
      if (!data.title.trim()) return 'Preencha o título do anúncio';
      if (!data.address.trim()) return 'Preencha o endereço';
      if (!data.campus) return 'Selecione o campus mais próximo';
      return null;
    case 1:
      if (data.rooms < 1) return 'Informe a quantidade de quartos';
      if (data.bathrooms < 1) return 'Informe a quantidade de banheiros';
      if (data.amenities.length < 1) return 'Selecione ao menos 1 comodidade';
      if (!data.description.trim()) return 'Preencha a descrição do imóvel';
      return null;
    case 2:
      if (data.docs.length < 1) return 'Envie ao menos 1 documento (contrato/comprovante)';
      if (!data.price || Number(data.price) <= 0) return 'Informe o preço mensal';
      return null;
    case 3:
      if (data.photos.length < 1) return 'Envie ao menos 1 foto do imóvel';
      return null;
    default:
      return null;
  }
}

export function PropertyWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const progress = ((step + 1) / STEPS.length) * 100;

  const toggleAmenity = (a: string) =>
    setData((d) => ({ ...d, amenities: d.amenities.includes(a) ? d.amenities.filter((x) => x !== a) : [...d.amenities, a] }));

  const handleNext = () => {
    const error = validateStep(step, data);
    if (error) {
      toast.error(error);
      return;
    }
    setStep((s) => s + 1);
  };

  const handlePublish = async () => {
    const error = validateStep(step, data);
    if (error) {
      toast.error(error);
      return;
    }
    if (!user) { toast.error('Faça login primeiro'); return; }
    setPublishing(true);

    try {
      // Upload photos to public bucket
      const imageUrls: string[] = [];
      for (const photo of data.photos) {
        const path = `${user.id}/${Date.now()}-${photo.name}`;
        const { error } = await supabase.storage.from('property-images').upload(path, photo);
        if (!error) {
          const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }
      }

      // Upload docs to private bucket
      for (const doc of data.docs) {
        const path = `${user.id}/${Date.now()}-${doc.name}`;
        await supabase.storage.from('property-documents').upload(path, doc);
      }

      const { error } = await supabase.from('properties').insert({
        owner_id: user.id,
        title: data.title,
        address: data.address,
        campus: data.campus || null,
        rooms: data.rooms,
        bathrooms: data.bathrooms,
        amenities: data.amenities,
        images: imageUrls,
        no_fiador: data.noFiador,
        verified: false,
        price: Number(data.price),
        accepts_pet: data.acceptsPet,
        description: data.description,
        status: 'pending',
        validation_status: 'pending_docs',
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      toast.error('Erro ao publicar: ' + (err.message || 'Tente novamente'));
    } finally {
      setPublishing(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <PartyPopper className="h-16 w-16 text-primary animate-bounce" />
        <h2 className="text-2xl font-bold">Anúncio Publicado!</h2>
        <p className="text-muted-foreground max-w-sm">Seu imóvel foi enviado para análise e estará disponível em breve.</p>
        <Button onClick={() => navigate('/host')} className="gap-2">
          <CheckCircle2 className="h-4 w-4" /> Ver Meus Anúncios
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
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          {STEPS.map((s, i) => (
            <span key={s} className={i <= step ? 'text-primary font-medium' : ''}>{s}</span>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="min-h-[320px]">
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Localização do Imóvel</h3>
            <div className="space-y-2">
              <Label htmlFor="title">Título do anúncio *</Label>
              <Input id="title" placeholder="Ex: Kitnet mobiliada perto da UFU" value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço completo *</Label>
              <Input id="address" placeholder="Rua, número, bairro" value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Campus mais próximo *</Label>
              <Select value={data.campus} onValueChange={(v) => setData({ ...data, campus: v as Campus })}>
                <SelectTrigger><SelectValue placeholder="Selecione o campus" /></SelectTrigger>
                <SelectContent>
                  {CAMPUSES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
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
                <Label htmlFor="rooms">Quartos *</Label>
                <Input id="rooms" type="number" min={1} value={data.rooms} onChange={(e) => setData({ ...data, rooms: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baths">Banheiros *</Label>
                <Input id="baths" type="number" min={1} value={data.bathrooms} onChange={(e) => setData({ ...data, bathrooms: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comodidades (mín. 1) *</Label>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES.map((a) => (
                  <label key={a} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={data.amenities.includes(a)} onCheckedChange={() => toggleAmenity(a)} />
                    {a}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descrição *</Label>
              <Input id="desc" placeholder="Descreva o imóvel..." value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Aceita pet</Label>
              <Switch checked={data.acceptsPet} onCheckedChange={(v) => setData({ ...data, acceptsPet: v })} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Documentação e Preço</h3>
            <DragDropZone accept=".pdf,image/*" maxFiles={3} onFilesChange={(f) => setData({ ...data, docs: f })} label="Arraste contrato/comprovante (PDF ou foto) *" />
            <div className="space-y-2">
              <Label htmlFor="price">Preço mensal (R$) *</Label>
              <Input id="price" type="number" placeholder="850" value={data.price} onChange={(e) => setData({ ...data, price: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Sem fiador</Label>
              <Switch checked={data.noFiador} onCheckedChange={(v) => setData({ ...data, noFiador: v })} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Fotos do Imóvel</h3>
            <DragDropZone accept="image/*" maxFiles={6} onFilesChange={(f) => setData({ ...data, photos: f })} label="Arraste fotos do imóvel ou clique para selecionar (mín. 1) *" />
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext} className="gap-1">Avançar <ArrowRight className="h-4 w-4" /></Button>
        ) : (
          <Button onClick={handlePublish} className="gap-1">Finalizar Anúncio <CheckCircle2 className="h-4 w-4" /></Button>
        )}
      </div>
    </div>
  );
}
