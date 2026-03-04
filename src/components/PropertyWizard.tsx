import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropZone } from '@/components/DragDropZone';
import { ImageLightbox } from '@/components/ImageLightbox';
import { MediaCarousel } from '@/components/MediaCarousel';
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
  ownerCpfCnpj: string;
  ownerEmail: string;
  acceptsPet: boolean;
  description: string;
}

const initialData: WizardData = {
  address: '', campus: '', title: '', rooms: 1, bathrooms: 1,
  amenities: [], photos: [], docs: [], noFiador: false, verified: false,
  price: '', ownerCpfCnpj: '', ownerEmail: '', acceptsPet: false, description: '',
};

const STEPS = ['Localização', 'Características', 'Documentação', 'Fotos'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function normalizeDocument(value: string): string {
  return value.replace(/\D/g, '').slice(0, 14);
}

function formatCpfCnpj(value: string): string {
  const digits = normalizeDocument(value);

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function allDigitsEqual(value: string): boolean {
  return /^([0-9])\1+$/.test(value);
}

function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11 || allDigitsEqual(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(cpf[i]) * (10 - i);
  }
  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;
  if (firstDigit !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(cpf[i]) * (11 - i);
  }
  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;

  return secondDigit === Number(cpf[10]);
}

function isValidCnpj(cnpj: string): boolean {
  if (cnpj.length !== 14 || allDigitsEqual(cnpj)) return false;

  const calcDigit = (base: string, weights: number[]) => {
    const total = base
      .split('')
      .reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calcDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calcDigit(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return firstDigit === Number(cnpj[12]) && secondDigit === Number(cnpj[13]);
}

function isValidCpfCnpj(value: string): boolean {
  const digits = normalizeDocument(value);
  if (digits.length === 11) return isValidCpf(digits);
  if (digits.length === 14) return isValidCnpj(digits);
  return false;
}

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

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
      if (!data.ownerCpfCnpj.trim()) return 'Informe CPF/CNPJ do proprietário';
      if (!isValidCpfCnpj(data.ownerCpfCnpj)) return 'CPF/CNPJ inválido. Revise o documento informado';
      if (!data.ownerEmail.trim()) return 'Informe o e-mail do proprietário';
      if (!isValidEmail(data.ownerEmail)) return 'E-mail inválido. Revise o formato informado';
      return null;
    case 3:
      if (data.photos.length < 1) return 'Envie ao menos 1 foto do imóvel';
      return null;
    default:
      return null;
  }
}

function validateStepForEdit(step: number, data: WizardData): string | null {
  switch (step) {
    case 0:
    case 1:
      return validateStep(step, data);
    case 2:
      if (!data.price || Number(data.price) <= 0) return 'Informe o preço mensal';
      if (!data.ownerCpfCnpj.trim()) return 'Informe CPF/CNPJ do proprietário';
      if (!isValidCpfCnpj(data.ownerCpfCnpj)) return 'CPF/CNPJ inválido. Revise o documento informado';
      if (!data.ownerEmail.trim()) return 'Informe o e-mail do proprietário';
      if (!isValidEmail(data.ownerEmail)) return 'E-mail inválido. Revise o formato informado';
      return null;
    case 3:
      return null;
    default:
      return null;
  }
}

export function PropertyWizard() {
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = Boolean(editId);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const [publishing, setPublishing] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingDocumentPaths, setExistingDocumentPaths] = useState<string[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [docPreviewUrls, setDocPreviewUrls] = useState<string[]>([]);
  const [previewLightboxOpen, setPreviewLightboxOpen] = useState(false);
  const [previewLightboxIndex, setPreviewLightboxIndex] = useState(0);
  const [previewLightboxImages, setPreviewLightboxImages] = useState<string[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const progress = ((step + 1) / STEPS.length) * 100;

  const toggleAmenity = (a: string) =>
    setData((d) => ({ ...d, amenities: d.amenities.includes(a) ? d.amenities.filter((x) => x !== a) : [...d.amenities, a] }));

  const stepError = isEditMode ? validateStepForEdit(step, data) : validateStep(step, data);
  const ownerDocumentError =
    step === 2 && data.ownerCpfCnpj.trim() && !isValidCpfCnpj(data.ownerCpfCnpj)
      ? 'CPF/CNPJ inválido.'
      : null;
  const ownerEmailError =
    step === 2 && data.ownerEmail.trim() && !isValidEmail(data.ownerEmail)
      ? 'Formato de e-mail inválido.'
      : null;

  const previewPhotoImages = useMemo(() => [...existingImages, ...photoPreviewUrls], [existingImages, photoPreviewUrls]);
  const previewDocImages = useMemo(() => docPreviewUrls, [docPreviewUrls]);

  useEffect(() => {
    const nextPreviewUrls = data.photos.map((photo) => URL.createObjectURL(photo));
    setPhotoPreviewUrls(nextPreviewUrls);

    return () => {
      nextPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [data.photos]);

  useEffect(() => {
    const imageDocs = data.docs.filter((doc) => doc.type.startsWith('image/'));
    const nextPreviewUrls = imageDocs.map((doc) => URL.createObjectURL(doc));
    setDocPreviewUrls(nextPreviewUrls);

    return () => {
      nextPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [data.docs]);

  const handleNext = () => {
    const error = isEditMode ? validateStepForEdit(step, data) : validateStep(step, data);
    if (error) {
      toast.error(error);
      return;
    }
    setStep((s) => s + 1);
  };

  useEffect(() => {
    const fetchPropertyForEdit = async () => {
      if (!isEditMode || !editId || !user) return;

      setLoadingProperty(true);
      try {
        const { data: existingProperty, error } = await supabase
          .from('properties')
          .select('id, owner_id, title, address, campus, rooms, bathrooms, amenities, images, document_paths, no_fiador, price, owner_cpf_cnpj, owner_email, accepts_pet, description')
          .eq('id', editId)
          .eq('owner_id', user.id)
          .single();

        if (error) throw error;

        setData((prev) => ({
          ...prev,
          title: existingProperty.title ?? '',
          address: existingProperty.address ?? '',
          campus: (existingProperty.campus as Campus | null) ?? '',
          rooms: existingProperty.rooms ?? 1,
          bathrooms: existingProperty.bathrooms ?? 1,
          amenities: existingProperty.amenities ?? [],
          noFiador: existingProperty.no_fiador ?? false,
          price: String(existingProperty.price ?? ''),
          ownerCpfCnpj: formatCpfCnpj(existingProperty.owner_cpf_cnpj ?? ''),
          ownerEmail: existingProperty.owner_email ?? '',
          acceptsPet: existingProperty.accepts_pet ?? false,
          description: existingProperty.description ?? '',
        }));

        setExistingImages(existingProperty.images ?? []);
        setExistingDocumentPaths(existingProperty.document_paths ?? []);
      } catch (error: any) {
        toast.error(error.message || 'Não foi possível carregar o anúncio para edição.');
        navigate('/my-properties');
      } finally {
        setLoadingProperty(false);
      }
    };

    fetchPropertyForEdit();
  }, [isEditMode, editId, user, navigate]);

  const handlePublish = async () => {
    const error = isEditMode ? validateStepForEdit(step, data) : validateStep(step, data);
    if (error) {
      toast.error(error);
      return;
    }
    if (!user) { toast.error('Faça login primeiro'); return; }
    setPublishing(true);

    try {
      // Upload photos to public bucket
      const imageUrls: string[] = [...existingImages];
      for (const photo of data.photos) {
        const path = `${user.id}/${Date.now()}-${photo.name}`;
        const { error } = await supabase.storage.from('property-images').upload(path, photo);
        if (!error) {
          const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }
      }

      // Upload docs to private bucket
      const documentPaths: string[] = [...existingDocumentPaths];
      for (const doc of data.docs) {
        const path = `${user.id}/${Date.now()}-${doc.name}`;
        const { error } = await supabase.storage.from('property-documents').upload(path, doc);
        if (!error) {
          documentPaths.push(path);
        }
      }

      if (isEditMode && editId) {
        const { error } = await supabase
          .from('properties')
          .update({
            title: data.title,
            address: data.address,
            campus: data.campus || null,
            rooms: data.rooms,
            bathrooms: data.bathrooms,
            amenities: data.amenities,
            images: imageUrls,
            no_fiador: data.noFiador,
            price: Number(data.price),
            owner_cpf_cnpj: normalizeDocument(data.ownerCpfCnpj),
            owner_email: data.ownerEmail.trim().toLowerCase(),
            document_paths: documentPaths,
            accepts_pet: data.acceptsPet,
            description: data.description,
            status: 'pending',
            validation_status: 'pending_docs',
            rejection_reason: null,
          })
          .eq('id', editId)
          .eq('owner_id', user.id);

        if (error) throw error;
      } else {
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
            owner_cpf_cnpj: normalizeDocument(data.ownerCpfCnpj),
            owner_email: data.ownerEmail.trim().toLowerCase(),
          document_paths: documentPaths,
          accepts_pet: data.acceptsPet,
          description: data.description,
          status: 'pending',
          validation_status: 'pending_docs',
        });

        if (error) throw error;
      }

      setSuccess(true);
    } catch (err: any) {
      toast.error('Erro ao publicar: ' + (err.message || 'Tente novamente'));
    } finally {
      setPublishing(false);
    }
  };

  if (loadingProperty) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Carregando dados do anúncio...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <PartyPopper className="h-16 w-16 text-primary animate-bounce" />
        <h2 className="text-2xl font-bold">{isEditMode ? 'Anúncio Atualizado!' : 'Anúncio Publicado!'}</h2>
        <p className="text-muted-foreground max-w-sm">Seu imóvel foi enviado para análise e estará disponível em breve.</p>
        <Button onClick={() => navigate('/my-properties')} className="gap-2">
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
            {previewDocImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview dos documentos (imagem)</p>
                <MediaCarousel
                  items={previewDocImages.map((url, index) => ({ url, alt: `Documento ${index + 1}` }))}
                  onItemClick={(index) => {
                    setPreviewLightboxImages(previewDocImages);
                    setPreviewLightboxIndex(index);
                    setPreviewLightboxOpen(true);
                  }}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="price">Preço mensal (R$) *</Label>
              <Input id="price" type="number" placeholder="850" value={data.price} onChange={(e) => setData({ ...data, price: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ownerCpfCnpj">CPF/CNPJ do proprietário *</Label>
                <Input
                  id="ownerCpfCnpj"
                  placeholder="Ex: 123.456.789-00"
                  value={data.ownerCpfCnpj}
                  onChange={(e) => setData({ ...data, ownerCpfCnpj: formatCpfCnpj(e.target.value) })}
                />
                {ownerDocumentError && <p className="text-xs text-destructive">{ownerDocumentError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerEmail">E-mail do proprietário *</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  placeholder="Ex: proprietario@email.com"
                  value={data.ownerEmail}
                  onChange={(e) => setData({ ...data, ownerEmail: e.target.value })}
                />
                {ownerEmailError && <p className="text-xs text-destructive">{ownerEmailError}</p>}
              </div>
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
            {previewPhotoImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview das fotos</p>
                <MediaCarousel
                  items={previewPhotoImages.map((url, index) => ({ url, alt: `Foto ${index + 1}` }))}
                  onItemClick={(index) => {
                    setPreviewLightboxImages(previewPhotoImages);
                    setPreviewLightboxIndex(index);
                    setPreviewLightboxOpen(true);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext} className="gap-1" disabled={Boolean(stepError)}>Avançar <ArrowRight className="h-4 w-4" /></Button>
        ) : (
          <Button onClick={handlePublish} className="gap-1" disabled={Boolean(stepError)}>{isEditMode ? 'Salvar Edição' : 'Finalizar Anúncio'} <CheckCircle2 className="h-4 w-4" /></Button>
        )}
      </div>

      <ImageLightbox
        open={previewLightboxOpen}
        images={previewLightboxImages}
        initialIndex={previewLightboxIndex}
        onClose={() => setPreviewLightboxOpen(false)}
      />
    </div>
  );
}
