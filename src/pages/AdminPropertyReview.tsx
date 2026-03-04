import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Download, Eye, MapPin, BedDouble, Bath, DollarSign, PawPrint, ShieldCheck, FileText } from 'lucide-react';

interface PropertyDetail {
  id: string;
  title: string;
  address: string | null;
  campus: string | null;
  price: number;
  rooms: number | null;
  bathrooms: number | null;
  description: string | null;
  amenities: string[] | null;
  accepts_pet: boolean | null;
  no_fiador: boolean | null;
  images: string[] | null;
  document_paths: string[] | null;
  status: string;
  created_at: string;
}

interface DocumentLink {
  name: string;
  path: string;
  signedUrl: string | null;
}

export default function AdminPropertyReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentLink[]>([]);
  const [updating, setUpdating] = useState<'approved' | 'rejected' | null>(null);

  const resolveImageUrl = (img: string) => {
    if (img.startsWith('http')) return img;
    return supabase.storage.from('property-images').getPublicUrl(img).data.publicUrl;
  };

  const fetchProperty = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, address, campus, price, rooms, bathrooms, description, amenities, accepts_pet, no_fiador, images, document_paths, status, created_at')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProperty({
        ...data,
        price: Number(data.price),
      });

      // Resolve document signed URLs
      if (data.document_paths && data.document_paths.length > 0) {
        const docs = await Promise.all(
          data.document_paths.map(async (path: string, index: number) => {
            const fileName = path.split('/').pop() || `Documento ${index + 1}`;
            const { data: signed } = await supabase.storage
              .from('property-documents')
              .createSignedUrl(path, 60 * 60);
            return { name: fileName, path, signedUrl: signed?.signedUrl ?? null };
          })
        );
        setDocuments(docs);
      }
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível carregar os detalhes do imóvel.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  const handleUpdateStatus = async (nextStatus: 'approved' | 'rejected') => {
    if (!id) return;
    setUpdating(nextStatus);
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: nextStatus, validation_status: nextStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(nextStatus === 'approved' ? 'Imóvel aprovado com sucesso!' : 'Imóvel rejeitado.');
      navigate('/admin');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar o status do imóvel.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 p-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <p className="text-muted-foreground">Imóvel não encontrado.</p>
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mt-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  const statusLabel = property.status === 'pending' ? 'Pendente' : property.status === 'approved' ? 'Aprovado' : 'Rejeitado';
  const statusVariant = property.status === 'pending' ? 'secondary' : property.status === 'approved' ? 'default' : 'destructive';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>
        <Badge variant={statusVariant} className="text-sm px-3 py-1">{statusLabel}</Badge>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">{property.title}</h1>

      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{property.address || 'Endereço não informado'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">Campus:</span>
              <span>{property.campus || 'Não informado'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4 shrink-0" />
              <span className="font-semibold text-foreground">R$ {property.price.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <BedDouble className="h-4 w-4" /> {property.rooms ?? 1} quarto(s)
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Bath className="h-4 w-4" /> {property.bathrooms ?? 1} banheiro(s)
              </span>
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-2">
            {property.accepts_pet && (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                <PawPrint className="h-3 w-3 mr-1" /> Aceita Pet
              </Badge>
            )}
            {property.no_fiador && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                <ShieldCheck className="h-3 w-3 mr-1" /> Sem Fiador
              </Badge>
            )}
          </div>

          {/* Description */}
          {property.description && (
            <div>
              <p className="text-sm font-medium mb-1">Descrição</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{property.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amenities */}
      {property.amenities && property.amenities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comodidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((a) => (
                <Badge key={a} variant="outline">{a}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Gallery */}
      {property.images && property.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Galeria de Fotos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {property.images.map((img, i) => (
                <img
                  key={i}
                  src={resolveImageUrl(img)}
                  alt={`Foto ${i + 1} - ${property.title}`}
                  className="w-full h-40 object-cover rounded-lg border"
                  loading="lazy"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" /> Documentação Comprobatória
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum documento enviado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {doc.signedUrl ? (
                      <>
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.signedUrl} target="_blank" rel="noreferrer">
                            <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.signedUrl} download>
                            <Download className="h-3.5 w-3.5 mr-1" /> Baixar
                          </a>
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Indisponível</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sticky Footer Actions */}
      {property.status === 'pending' && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
          <div className="max-w-4xl mx-auto grid grid-cols-2 gap-3">
            <Button
              size="lg"
              disabled={!!updating}
              onClick={() => handleUpdateStatus('approved')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {updating === 'approved' ? 'Aprovando...' : 'Aprovar Anúncio'}
            </Button>
            <Button
              size="lg"
              variant="destructive"
              disabled={!!updating}
              onClick={() => handleUpdateStatus('rejected')}
            >
              {updating === 'rejected' ? 'Rejeitando...' : 'Rejeitar Anúncio'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
