import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Download, Eye, MapPin, BedDouble, Bath, DollarSign, PawPrint, ShieldCheck, FileText } from 'lucide-react';
import { ImageLightbox } from '@/components/ImageLightbox';

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
  images: string[];
  document_paths: string[] | null;
  rejection_reason: string | null;
  status: string;
  created_at: string;
}

interface DocumentLink {
  name: string;
  path: string;
  previewUrl: string | null;
  downloadUrl: string | null;
  isImage: boolean;
}

export default function AdminPropertyReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentLink[]>([]);
  const [updating, setUpdating] = useState<'approved' | 'rejected' | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [docsOpen, setDocsOpen] = useState(false);
  const [docsIndex, setDocsIndex] = useState(0);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const resolveImageUrl = (pathOrUrl: string) =>
    pathOrUrl.startsWith('http')
      ? pathOrUrl
      : supabase.storage.from('property-images').getPublicUrl(pathOrUrl).data.publicUrl;

  const isImagePath = (path: string) => /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(path);

  const fetchProperty = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, address, campus, price, rooms, bathrooms, description, amenities, accepts_pet, no_fiador, images, document_paths, rejection_reason, status, created_at')
        .eq('id', id)
        .single();

      if (error) throw error;

      const imageUrls = ((data.images as string[] | null) ?? []).map(resolveImageUrl);

      setProperty({
        ...data,
        price: Number(data.price),
        images: imageUrls,
      });

      if (data.document_paths && data.document_paths.length > 0) {
        const docs = await Promise.all(
          data.document_paths.map(async (path: string, index: number) => {
            const fileName = path.split('/').pop() || `Documento ${index + 1}`;

            const [previewSigned, downloadSigned] = await Promise.all([
              supabase.storage.from('property-documents').createSignedUrl(path, 60 * 60),
              supabase.storage.from('property-documents').createSignedUrl(path, 60 * 60, { download: true }),
            ]);

            return {
              name: fileName,
              path,
              previewUrl: previewSigned.data?.signedUrl ?? null,
              downloadUrl: downloadSigned.data?.signedUrl ?? null,
              isImage: isImagePath(path),
            };
          }),
        );

        setDocuments(docs);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível carregar os detalhes do imóvel.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  const documentImageUrls = useMemo(
    () => documents.filter((doc) => doc.isImage && doc.previewUrl).map((doc) => doc.previewUrl as string),
    [documents],
  );

  const handleUpdateStatus = async (nextStatus: 'approved' | 'rejected', reason?: string) => {
    if (!id) return;

    setUpdating(nextStatus);
    try {
      const payload = nextStatus === 'rejected'
        ? { status: nextStatus, rejection_reason: reason ?? null }
        : { status: nextStatus, rejection_reason: null };

      const { error } = await supabase
        .from('properties')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      toast.success(nextStatus === 'approved' ? 'Imóvel aprovado com sucesso!' : 'Imóvel rejeitado.');
      navigate('/admin');
    } catch (error) {
      console.error(error);
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
  const requestedAt = new Date(property.created_at).toLocaleDateString('pt-BR');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>
        <Badge variant={statusVariant} className="text-sm px-3 py-1">{statusLabel}</Badge>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">{property.title}</h1>
      <p className="text-sm text-muted-foreground">Solicitado em: {requestedAt}</p>

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

          {property.description && (
            <div>
              <p className="text-sm font-medium mb-1">Descrição</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{property.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {property.status === 'rejected' && property.rejection_reason && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Motivo da Rejeição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{property.rejection_reason}</p>
          </CardContent>
        </Card>
      )}

      {property.amenities && property.amenities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comodidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((amenity) => (
                <Badge key={amenity} variant="outline">{amenity}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {property.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Galeria de Fotos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {property.images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Foto ${index + 1} - ${property.title}`}
                  className="w-full h-40 object-cover rounded-lg border cursor-zoom-in"
                  loading="lazy"
                  onClick={() => {
                    setGalleryIndex(index);
                    setGalleryOpen(true);
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {doc.previewUrl ? (
                      <>
                        {doc.isImage ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const lightboxDocIndex = documentImageUrls.findIndex((url) => url === doc.previewUrl);
                              setDocsIndex(lightboxDocIndex < 0 ? 0 : lightboxDocIndex);
                              setDocsOpen(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" asChild>
                            <a href={doc.previewUrl} target="_blank" rel="noreferrer">
                              <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                            </a>
                          </Button>
                        )}
                        {doc.downloadUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={doc.downloadUrl} download>
                              <Download className="h-3.5 w-3.5 mr-1" /> Baixar
                            </a>
                          </Button>
                        )}
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
              onClick={() => setRejectDialogOpen(true)}
            >
              {updating === 'rejected' ? 'Rejeitando...' : 'Rejeitar Anúncio'}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar anúncio</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. Esse texto será salvo para orientar o proprietário.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            className="w-full min-h-28 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            placeholder="Descreva claramente o que precisa ser corrigido..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={updating === 'rejected'}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={updating === 'rejected'}
              onClick={async () => {
                const reason = rejectionReason.trim();
                if (!reason) {
                  toast.error('Informe o motivo da rejeição.');
                  return;
                }
                await handleUpdateStatus('rejected', reason);
              }}
            >
              {updating === 'rejected' ? 'Enviando...' : 'Enviar Rejeição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageLightbox
        open={galleryOpen}
        images={property.images}
        initialIndex={galleryIndex}
        onClose={() => setGalleryOpen(false)}
      />

      <ImageLightbox
        open={docsOpen}
        images={documentImageUrls}
        initialIndex={docsIndex}
        onClose={() => setDocsOpen(false)}
      />
    </div>
  );
}
