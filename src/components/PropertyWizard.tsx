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
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
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
  listing_type: 'alugar' | 'vender';
  title: string;
  campus: Campus | '';
  cep: string;
  street: string;
  addressNumber: string;
  addressComplement: string;
  neighborhood: string;
  city: string;
  state: string;
  cepValidated: boolean;
  rooms: number;
  bathrooms: number;
  amenities: string[];
  photos: File[];
  noFiador: boolean;
  verified: boolean;
  price: string;
  ownerCpfCnpj: string;
  ownerEmail: string;
  contactWhatsApp: string;
  contactSocial: string;
  acceptsPet: boolean;
  description: string;
}

type WizardDraftData = Omit<WizardData, 'photos'>;

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  if (!value.every((item) => typeof item === 'string')) return undefined;
  return value;
}

function parseDraft(value: string): Partial<WizardDraftData> | null {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  const source = parsed as Record<string, unknown>;
  const draft: Partial<WizardDraftData> = {};

  const title = asString(source.title);
  const listingType = asString(source.listing_type);
  const campus = asString(source.campus);
  const cep = asString(source.cep);
  const street = asString(source.street);
  const addressNumber = asString(source.addressNumber);
  const addressComplement = asString(source.addressComplement);
  const neighborhood = asString(source.neighborhood);
  const city = asString(source.city);
  const state = asString(source.state);
  const cepValidated = asBoolean(source.cepValidated);
  const rooms = asNumber(source.rooms);
  const bathrooms = asNumber(source.bathrooms);
  const amenities = asStringArray(source.amenities);
  const noFiador = asBoolean(source.noFiador);
  const verified = asBoolean(source.verified);
  const price = asString(source.price);
  const ownerCpfCnpj = asString(source.ownerCpfCnpj);
  const ownerEmail = asString(source.ownerEmail);
  const contactWhatsApp = asString(source.contactWhatsApp);
  const contactSocial = asString(source.contactSocial);
  const acceptsPet = asBoolean(source.acceptsPet);
  const description = asString(source.description);

  if (listingType === 'alugar' || listingType === 'vender') draft.listing_type = listingType;
  if (title !== undefined) draft.title = title;
  if (campus !== undefined) draft.campus = campus as Campus | '';
  if (cep !== undefined) draft.cep = cep;
  if (street !== undefined) draft.street = street;
  if (addressNumber !== undefined) draft.addressNumber = addressNumber;
  if (addressComplement !== undefined) draft.addressComplement = addressComplement;
  if (neighborhood !== undefined) draft.neighborhood = neighborhood;
  if (city !== undefined) draft.city = city;
  if (state !== undefined) draft.state = state;
  if (cepValidated !== undefined) draft.cepValidated = cepValidated;
  if (rooms !== undefined) draft.rooms = Math.max(1, Math.floor(rooms));
  if (bathrooms !== undefined) draft.bathrooms = Math.max(1, Math.floor(bathrooms));
  if (amenities !== undefined) draft.amenities = amenities;
  if (noFiador !== undefined) draft.noFiador = noFiador;
  if (verified !== undefined) draft.verified = verified;
  if (price !== undefined) draft.price = price;
  if (ownerCpfCnpj !== undefined) draft.ownerCpfCnpj = ownerCpfCnpj;
  if (ownerEmail !== undefined) draft.ownerEmail = ownerEmail;
  if (contactWhatsApp !== undefined) draft.contactWhatsApp = contactWhatsApp;
  if (contactSocial !== undefined) draft.contactSocial = contactSocial;
  if (acceptsPet !== undefined) draft.acceptsPet = acceptsPet;
  if (description !== undefined) draft.description = description;

  return draft;
}

const initialData: WizardData = {
  listing_type: 'alugar',
  title: '',
  campus: '',
  cep: '',
  street: '',
  addressNumber: '',
  addressComplement: '',
  neighborhood: '',
  city: '',
  state: '',
  cepValidated: false,
  rooms: 1,
  bathrooms: 1,
  amenities: [],
  photos: [],
  noFiador: false,
  verified: false,
  price: '',
  ownerCpfCnpj: '',
  ownerEmail: '',
  contactWhatsApp: '',
  contactSocial: '',
  acceptsPet: false,
  description: '',
};

const STEPS = ['Verificação', 'Tipo', 'Imagens', 'Descrição', 'Preço', 'Preço e Contato'];
const DRAFT_STORAGE_KEY = 'uhome_property_draft';

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

function normalizeCep(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8);
}

function formatCep(value: string): string {
  const digits = normalizeCep(value);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function isValidCep(value: string): boolean {
  return normalizeCep(value).length === 8;
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11);
}

function formatPhone(value: string): string {
  const digits = normalizePhone(value);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidWhatsapp(value: string): boolean {
  const digits = normalizePhone(value);
  return digits.length === 11 && !allDigitsEqual(digits);
}

function composeAddress(data: WizardData): string {
  const number = data.addressNumber.trim();
  const complement = data.addressComplement.trim();
  return [
    `${data.street.trim()}${number ? `, ${number}` : ''}`,
    data.neighborhood.trim(),
    `${data.city.trim()} - ${data.state.trim()}`,
    data.cep,
    complement,
  ]
    .filter(Boolean)
    .join(' | ');
}

function parseComposedAddress(address: string | null) {
  if (!address) {
    return {
      street: '',
      addressNumber: '',
      neighborhood: '',
      city: '',
      state: '',
      cep: '',
      addressComplement: '',
      cepValidated: false,
    };
  }

  const parts = address.split(' | ').map((part) => part.trim());
  if (parts.length < 4) {
    return {
      street: address,
      addressNumber: '',
      neighborhood: '',
      city: '',
      state: '',
      cep: '',
      addressComplement: '',
      cepValidated: false,
    };
  }

  const [streetWithNumber, neighborhood, cityState, cepPart, complement = ''] = parts;
  const streetSplitIndex = streetWithNumber.lastIndexOf(',');
  const street = streetSplitIndex > -1 ? streetWithNumber.slice(0, streetSplitIndex).trim() : streetWithNumber;
  const addressNumber = streetSplitIndex > -1 ? streetWithNumber.slice(streetSplitIndex + 1).trim() : '';
  const [city = '', state = ''] = cityState.split(' - ').map((part) => part.trim());
  const formattedCep = formatCep(cepPart);

  return {
    street,
    addressNumber,
    neighborhood,
    city,
    state,
    cep: formattedCep,
    addressComplement: complement,
    cepValidated: isValidCep(formattedCep),
  };
}

function validateStep(step: number, data: WizardData, otpCode: string): string | null {
  switch (step) {
    case 0:
      if (otpCode.replace(/\D/g, '').length !== 8) return 'Digite o código OTP de 8 dígitos';
      return null;
    case 1:
      if (!data.title.trim()) return 'Preencha o título do anúncio';
      if (!isValidCep(data.cep)) return 'Informe um CEP válido';
      if (!data.cepValidated) return 'CEP não encontrado. Verifique e tente novamente';
      if (!data.street.trim()) return 'Preencha a rua';
      if (!data.addressNumber.trim()) return 'Preencha o número';
      if (!data.neighborhood.trim()) return 'Preencha o bairro';
      if (!data.city.trim()) return 'Preencha a cidade';
      if (!data.state.trim()) return 'Preencha o estado';
      if (!data.campus) return 'Selecione o campus mais próximo';
      if (data.rooms < 1) return 'Informe a quantidade de quartos';
      if (data.bathrooms < 1) return 'Informe a quantidade de banheiros';
      if (data.amenities.length < 1) return 'Selecione ao menos 1 comodidade';
      return null;
    case 2:
      if (data.photos.length < 1) return 'Envie ao menos 1 foto do imóvel';
      return null;
    case 3:
      if (!data.description.trim()) return 'Preencha a descrição do imóvel';
      return null;
    case 4:
      if (!data.price || Number(data.price) <= 0) return 'Informe o preço mensal';
      return null;
    case 5:
      if (!data.ownerCpfCnpj.trim()) return 'Informe CPF/CNPJ do proprietário';
      if (!isValidCpfCnpj(data.ownerCpfCnpj)) return 'CPF/CNPJ inválido. Revise o documento informado';
      if (!data.ownerEmail.trim()) return 'Informe o e-mail do proprietário';
      if (!isValidEmail(data.ownerEmail)) return 'E-mail inválido. Revise o formato informado';
      if (!data.contactWhatsApp.trim()) return 'Informe o WhatsApp de contato';
      if (!isValidWhatsapp(data.contactWhatsApp)) return 'WhatsApp inválido. Use o formato (00) 00000-0000';
      return null;
    default:
      return null;
  }
}

function validateStepForEdit(step: number, data: WizardData, otpCode: string): string | null {
  switch (step) {
    case 0:
      if (otpCode.replace(/\D/g, '').length !== 8) return 'Digite o código OTP de 8 dígitos';
      return null;
    case 1:
      return validateStep(step, data, otpCode);
    case 2:
      if (data.photos.length < 1) return 'Envie ao menos 1 foto do imóvel';
      return null;
    case 3:
      if (!data.description.trim()) return 'Preencha a descrição do imóvel';
      return null;
    case 4:
      if (!data.price || Number(data.price) <= 0) return 'Informe o preço mensal';
      return null;
    case 5:
      if (!data.ownerCpfCnpj.trim()) return 'Informe CPF/CNPJ do proprietário';
      if (!isValidCpfCnpj(data.ownerCpfCnpj)) return 'CPF/CNPJ inválido. Revise o documento informado';
      if (!data.ownerEmail.trim()) return 'Informe o e-mail do proprietário';
      if (!isValidEmail(data.ownerEmail)) return 'E-mail inválido. Revise o formato informado';
      if (!data.contactWhatsApp.trim()) return 'Informe o WhatsApp de contato';
      if (!isValidWhatsapp(data.contactWhatsApp)) return 'WhatsApp inválido. Use o formato (00) 00000-0000';
      return null;
    default:
      return null;
  }
}

export function PropertyWizard() {
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = Boolean(editId);
  const [step, setStep] = useState(0);
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [data, setData] = useState<WizardData>(initialData);
  const [publishing, setPublishing] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepLookupError, setCepLookupError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [previewLightboxOpen, setPreviewLightboxOpen] = useState(false);
  const [previewLightboxIndex, setPreviewLightboxIndex] = useState(0);
  const [previewLightboxImages, setPreviewLightboxImages] = useState<string[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const progress = ((step + 1) / STEPS.length) * 100;

  const toggleAmenity = (amenity: string) =>
    setData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity],
    }));

  const stepError = isEditMode ? validateStepForEdit(step, data, otpCode) : validateStep(step, data, otpCode);

  const ownerDocumentError =
    step === 5 && data.ownerCpfCnpj.trim() && !isValidCpfCnpj(data.ownerCpfCnpj)
      ? 'CPF/CNPJ inválido.'
      : null;

  const ownerEmailError =
    step === 5 && data.ownerEmail.trim() && !isValidEmail(data.ownerEmail)
      ? 'Formato de e-mail inválido.'
      : null;

  const ownerWhatsAppError =
    step === 5 && data.contactWhatsApp.trim() && !isValidWhatsapp(data.contactWhatsApp)
      ? 'WhatsApp inválido.'
      : null;

  const previewPhotoImages = useMemo(() => [...existingImages, ...photoPreviewUrls], [existingImages, photoPreviewUrls]);

  useEffect(() => {
    const nextPreviewUrls = data.photos.map((photo) => URL.createObjectURL(photo));
    setPhotoPreviewUrls(nextPreviewUrls);

    return () => {
      nextPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [data.photos]);

  useEffect(() => {
    if (isEditMode) return;

    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!savedDraft) return;

      const parsedDraft = parseDraft(savedDraft);
      if (!parsedDraft) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        return;
      }

      setData((prev) => ({
        ...prev,
        ...parsedDraft,
        photos: [],
      }));
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, [isEditMode]);

  useEffect(() => {
    if (isEditMode) return;

    const { photos: _photos, ...draftData } = data;
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
  }, [data, isEditMode]);

  useEffect(() => {
    const cepDigits = normalizeCep(data.cep);
    if (cepDigits.length !== 8) {
      setLoadingCep(false);
      setCepLookupError(null);
      setData((prev) => ({ ...prev, cepValidated: false }));
      return;
    }

    const controller = new AbortController();

    const fetchAddressByCep = async () => {
      setLoadingCep(true);
      setCepLookupError(null);

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Falha na consulta do CEP.');
        }

        const payload = await response.json();

        if (payload.erro) {
          setData((prev) => ({
            ...prev,
            street: '',
            neighborhood: '',
            city: '',
            state: '',
            cepValidated: false,
          }));
          setCepLookupError('CEP não encontrado.');
          return;
        }

        setData((prev) => ({
          ...prev,
          street: payload.logradouro ?? prev.street,
          neighborhood: payload.bairro ?? prev.neighborhood,
          city: payload.localidade ?? prev.city,
          state: payload.uf ?? prev.state,
          cepValidated: true,
        }));
      } catch (error) {
        if (controller.signal.aborted) return;
        setData((prev) => ({ ...prev, cepValidated: false }));
        setCepLookupError('Não foi possível validar o CEP agora.');
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCep(false);
        }
      }
    };

    fetchAddressByCep();

    return () => controller.abort();
  }, [data.cep]);

  useEffect(() => {
    const fetchPropertyForEdit = async () => {
      if (!isEditMode || !editId || !user) return;

      setLoadingProperty(true);
      try {
        const { data: existingProperty, error } = await supabase
          .from('properties')
          .select('id, owner_id, title, listing_type, address, campus, rooms, bathrooms, amenities, images, no_fiador, price, owner_cpf_cnpj, owner_email, contact_whatsapp, contact_social, accepts_pet, description')
          .eq('id', editId)
          .eq('owner_id', user.id)
          .single();

        if (error) throw error;

        const parsedAddress = parseComposedAddress(existingProperty.address);

        setData((prev) => ({
          ...prev,
          listing_type: existingProperty.listing_type === 'vender' ? 'vender' : 'alugar',
          title: existingProperty.title ?? '',
          cep: parsedAddress.cep,
          street: parsedAddress.street,
          addressNumber: parsedAddress.addressNumber,
          addressComplement: parsedAddress.addressComplement,
          neighborhood: parsedAddress.neighborhood,
          city: parsedAddress.city,
          state: parsedAddress.state,
          cepValidated: parsedAddress.cepValidated,
          campus: (existingProperty.campus as Campus | null) ?? '',
          rooms: existingProperty.rooms ?? 1,
          bathrooms: existingProperty.bathrooms ?? 1,
          amenities: existingProperty.amenities ?? [],
          noFiador: existingProperty.no_fiador ?? false,
          price: String(existingProperty.price ?? ''),
          ownerCpfCnpj: formatCpfCnpj(existingProperty.owner_cpf_cnpj ?? ''),
          ownerEmail: existingProperty.owner_email ?? '',
          contactWhatsApp: formatPhone(existingProperty.contact_whatsapp ?? ''),
          contactSocial: existingProperty.contact_social ?? '',
          acceptsPet: existingProperty.accepts_pet ?? false,
          description: existingProperty.description ?? '',
        }));

        setExistingImages(existingProperty.images ?? []);
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
    const error = isEditMode ? validateStepForEdit(step, data, otpCode) : validateStep(step, data, otpCode);
    if (error) {
      toast.error(error);
      return;
    }

    if (!user) {
      toast.error('Faça login primeiro');
      return;
    }

    setPublishing(true);

    try {
      const imageUrls: string[] = [...existingImages];
      for (const photo of data.photos) {
        const path = `${user.id}/${Date.now()}-${photo.name}`;
        const { error } = await supabase.storage.from('property-images').upload(path, photo);
        if (!error) {
          const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }
      }

      const payload = {
        listing_type: data.listing_type,
        title: data.title,
        address: composeAddress(data),
        campus: data.campus || null,
        rooms: data.rooms,
        bathrooms: data.bathrooms,
        amenities: data.amenities,
        images: imageUrls,
        no_fiador: data.noFiador,
        price: Number(data.price),
        owner_cpf_cnpj: normalizeDocument(data.ownerCpfCnpj),
        owner_email: data.ownerEmail.trim().toLowerCase(),
        contact_whatsapp: normalizePhone(data.contactWhatsApp),
        contact_social: data.contactSocial.trim() || null,
        document_paths: [],
        accepts_pet: data.acceptsPet,
        description: data.description,
      };

      if (isEditMode && editId) {
        const { error } = await supabase
          .from('properties')
          .update({
            ...payload,
            status: 'pending',
            validation_status: 'pending',
            rejection_reason: null,
          })
          .eq('id', editId)
          .eq('owner_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('properties').insert({
          owner_id: user.id,
          ...payload,
          verified: false,
          status: 'pending',
          validation_status: 'pending',
        });

        if (error) throw error;
      }

      localStorage.removeItem(DRAFT_STORAGE_KEY);

      setSuccess(true);
    } catch (error: any) {
      toast.error('Erro ao publicar: ' + (error.message || 'Tente novamente'));
    } finally {
      setPublishing(false);
    }
  };

  const handleSendOtp = async () => {
    if (!otpEmail.trim() || !isValidEmail(otpEmail)) {
      toast.error('Informe um e-mail válido');
      return;
    }

    const normalizedEmail = otpEmail.trim().toLowerCase();
    setOtpLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
      });

      if (error) throw error;

      setOtpSent(true);
      toast.success('Código OTP enviado para o e-mail. Verifique sua caixa de entrada.');
    } catch (error: any) {
      toast.error('Erro ao enviar OTP: ' + (error.message || 'Tente novamente'));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (): Promise<boolean> => {
    const otpToken = otpCode.replace(/\D/g, '');

    if (otpToken.length !== 8) {
      toast.error('Digite o código OTP de 8 dígitos');
      return false;
    }

    const normalizedEmail = otpEmail.trim().toLowerCase();
    setOtpLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: otpToken,
        type: 'email',
      });

      if (error) throw error;

      if (!data.session) {
        toast.error('Sessão não estabelecida. Tente novamente.');
        return false;
      }

      toast.success('Verificação de OTP realizada com sucesso!');
      setOtpCode('');
      return true;
    } catch (error: any) {
      toast.error('Código inválido ou expirado. Tente novamente.');
      setOtpCode('');
      return false;
    } finally {
      setOtpLoading(false);
    }
  };

  const handleNext = async () => {
    // Step 0: Verify OTP before proceeding
    if (step === 0) {
      const otpVerified = await handleVerifyOtp();
      if (!otpVerified) return;
      setStep((prev) => prev + 1);
      return;
    }

    const error = isEditMode ? validateStepForEdit(step, data, otpCode) : validateStep(step, data, otpCode);
    if (error) {
      toast.error(error);
      return;
    }
    setStep((prev) => prev + 1);
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
          {STEPS.map((label, index) => (
            <span key={label} className={index <= step ? 'text-primary font-medium' : ''}>{label}</span>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="min-h-[320px]">
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={data.listing_type === 'alugar' ? 'default' : 'outline'}
                onClick={() => setData((prev) => ({ ...prev, listing_type: 'alugar' }))}
              >
                Quero Alugar
              </Button>
              <Button
                type="button"
                variant={data.listing_type === 'vender' ? 'default' : 'outline'}
                onClick={() => setData((prev) => ({ ...prev, listing_type: 'vender' }))}
              >
                Quero Vender
              </Button>
            </div>
            <h3 className="text-lg font-semibold">Verificação de E-mail com OTP</h3>
            <p className="text-sm text-muted-foreground">Informe o e-mail para receber o código de verificação (OTP).</p>

            {!otpSent ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="otpEmail">E-mail para Verificação *</Label>
                  <Input
                    id="otpEmail"
                    type="email"
                    placeholder="seu.email@example.com"
                    value={otpEmail}
                    onChange={(event) => setOtpEmail(event.target.value)}
                    disabled={otpLoading}
                  />
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={otpLoading || !otpEmail.trim()}
                  className="w-full"
                >
                  {otpLoading ? 'Enviando...' : 'Enviar Código OTP'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium">Código OTP enviado para: <span className="text-primary font-semibold">{otpEmail}</span></p>
                <div className="space-y-2">
                  <Label htmlFor="otpCode">Digite o Código OTP (8 dígitos) *</Label>
                  <InputOTP maxLength={8} value={otpCode} onChange={setOtpCode} disabled={otpLoading}>
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                        <InputOTPSlot key={index} index={index} className="h-12 w-12 rounded-md border" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                  }}
                  disabled={otpLoading}
                  className="w-full"
                >
                  Usar Outro E-mail
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tipo e localização</h3>

            <div className="space-y-2">
              <Label htmlFor="title">Título do anúncio *</Label>
              <Input
                id="title"
                placeholder="Ex: Kitnet mobiliada perto da UFU"
                value={data.title}
                onChange={(event) => setData((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={data.cep}
                  onChange={(event) => {
                    const masked = formatCep(event.target.value);
                    setData((prev) => ({ ...prev, cep: masked, cepValidated: false }));
                  }}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="street">Rua *</Label>
                <Input
                  id="street"
                  placeholder="Rua/Av."
                  value={data.street}
                  onChange={(event) => setData((prev) => ({ ...prev, street: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  placeholder="123"
                  value={data.addressNumber}
                  onChange={(event) => setData((prev) => ({ ...prev, addressNumber: event.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  placeholder="Apto, bloco, referência"
                  value={data.addressComplement}
                  onChange={(event) => setData((prev) => ({ ...prev, addressComplement: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  value={data.neighborhood}
                  onChange={(event) => setData((prev) => ({ ...prev, neighborhood: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  value={data.state}
                  maxLength={2}
                  onChange={(event) => setData((prev) => ({ ...prev, state: event.target.value.toUpperCase() }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                value={data.city}
                onChange={(event) => setData((prev) => ({ ...prev, city: event.target.value }))}
              />
            </div>

            {(loadingCep || cepLookupError) && (
              <p className={`text-xs ${cepLookupError ? 'text-destructive' : 'text-muted-foreground'}`}>
                {loadingCep ? 'Buscando endereço pelo CEP...' : cepLookupError}
              </p>
            )}

            <div className="space-y-2">
              <Label>Campus mais próximo *</Label>
              <Select value={data.campus} onValueChange={(value) => setData((prev) => ({ ...prev, campus: value as Campus }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o campus" />
                </SelectTrigger>
                <SelectContent>
                  {CAMPUSES.map((campus) => (
                    <SelectItem key={campus} value={campus}>{campus}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rooms">Quartos *</Label>
                <Input
                  id="rooms"
                  type="number"
                  min={1}
                  value={data.rooms}
                  onChange={(event) => setData((prev) => ({ ...prev, rooms: Number(event.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baths">Banheiros *</Label>
                <Input
                  id="baths"
                  type="number"
                  min={1}
                  value={data.bathrooms}
                  onChange={(event) => setData((prev) => ({ ...prev, bathrooms: Number(event.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Comodidades (mín. 1) *</Label>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES.map((amenity) => (
                  <label key={amenity} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={data.amenities.includes(amenity)} onCheckedChange={() => toggleAmenity(amenity)} />
                    {amenity}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Aceita pet</Label>
              <Switch checked={data.acceptsPet} onCheckedChange={(value) => setData((prev) => ({ ...prev, acceptsPet: value }))} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Imagens</h3>
            <DragDropZone
              accept="image/*"
              maxFiles={6}
              onFilesChange={(files) => setData((prev) => ({ ...prev, photos: files }))}
              label="Arraste fotos do imóvel ou clique para selecionar (mín. 1) *"
            />

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

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Descrição</h3>
            <div className="space-y-2">
              <Label htmlFor="desc">Descrição *</Label>
              <Input
                id="desc"
                placeholder="Descreva o imóvel..."
                value={data.description}
                onChange={(event) => setData((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preço</h3>
            <div className="space-y-2">
              <Label htmlFor="price">Preço mensal (R$) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="850"
                value={data.price}
                onChange={(event) => setData((prev) => ({ ...prev, price: event.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Sem fiador</Label>
              <Switch checked={data.noFiador} onCheckedChange={(value) => setData((prev) => ({ ...prev, noFiador: value }))} />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contacto</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ownerCpfCnpj">CPF/CNPJ do proprietário *</Label>
                <Input
                  id="ownerCpfCnpj"
                  placeholder="Ex: 123.456.789-00"
                  value={data.ownerCpfCnpj}
                  onChange={(event) => setData((prev) => ({ ...prev, ownerCpfCnpj: formatCpfCnpj(event.target.value) }))}
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
                  onChange={(event) => setData((prev) => ({ ...prev, ownerEmail: event.target.value }))}
                />
                {ownerEmailError && <p className="text-xs text-destructive">{ownerEmailError}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="contactWhatsApp">WhatsApp de Contato *</Label>
                <Input
                  id="contactWhatsApp"
                  placeholder="(34) 99999-9999"
                  value={data.contactWhatsApp}
                  onChange={(event) => setData((prev) => ({ ...prev, contactWhatsApp: formatPhone(event.target.value) }))}
                />
                {ownerWhatsAppError && <p className="text-xs text-destructive">{ownerWhatsAppError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactSocial">Rede social (opcional)</Label>
                <Input
                  id="contactSocial"
                  placeholder="https://instagram.com/perfil ou @perfil"
                  value={data.contactSocial}
                  onChange={(event) => setData((prev) => ({ ...prev, contactSocial: event.target.value }))}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={() => setStep((prev) => prev - 1)} disabled={step === 0 || otpLoading} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext} className="gap-1" disabled={loadingCep}>
            Avançar <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handlePublish} className="gap-1" disabled={loadingCep || publishing}>
            {isEditMode ? 'Salvar Edição' : 'Finalizar Anúncio'} <CheckCircle2 className="h-4 w-4" />
          </Button>
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