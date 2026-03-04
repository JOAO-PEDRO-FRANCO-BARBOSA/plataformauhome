import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, BedDouble, Bath, Trash2, Edit, AlertTriangle, Download, Eye, FileText } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ImageLightbox } from '@/components/ImageLightbox';
import { MediaCarousel } from '@/components/MediaCarousel';

interface UserProperty {
  id: string;
  owner_id: string;
  title: string;
  address: string | null;
  campus: string | null;
  price: number;
  rooms: number | null;
  bathrooms: number | null;
  description: string | null;
  amenities: string[] | null;
  images: string[];
  document_paths: string[] | null;
  status: string | null;
  validation_status: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface DocumentLink {
  name: string;
  previewUrl: string | null;
  downloadUrl: string | null;
  isImage: boolean;
}

const statusLabelMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  pending_docs: { label: 'Pendente', variant: 'secondary' },
  approved: { label: 'Aprovado', variant: 'default' },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
};

export default function UserPropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState<UserProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [documents, setDocuments] = useState<DocumentLink[]>([]);
  const [docsLightboxOpen, setDocsLightboxOpen] = useState(false);
  const [docsLightboxIndex, setDocsLightboxIndex] = useState(0);

  const resolveImageUrl = (pathOrUrl: string) =>
    pathOrUrl.startsWith('http')
      ? pathOrUrl
      : supabase.storage.from('property-images').getPublicUrl(pathOrUrl).data.publicUrl;

  const isImagePath = (path: string) => /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(path);

  const fetchProperty = useCallback(async () => {
    if (!id || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, owner_id, title, address, campus, price, rooms, bathrooms, description, amenities, images, document_paths, status, validation_status, rejection_reason, created_at')
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;

      setProperty({
        ...data,
        price: Number(data.price),
        images: ((data.images as string[] | null) ?? []).map(resolveImageUrl),
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
      toast.error('Não foi possível carregar o anúncio.');
      navigate('/my-properties');
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  const handleDelete = async () => {
    if (!property) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from('properties').delete().eq('id', property.id).eq('owner_id', property.owner_id);
      if (error) throw error;

      toast.success('Anúncio excluído com sucesso.');
      navigate('/my-properties');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir anúncio.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 p-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!property) return null;

  const status = property.status ?? property.validation_status ?? 'pending';
  const statusInfo = statusLabelMap[status] ?? statusLabelMap.pending;
  const isPending = status === 'pending' || status === 'pending_docs';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  const requestedAt = new Date(property.created_at).toLocaleDateString('pt-BR');
  const documentImageUrls = documents.filter((doc) => doc.isImage && doc.previewUrl).map((doc) => doc.previewUrl as string);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8 p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate('/my-properties')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">{property.title}</h1>
      <p className="text-sm text-muted-foreground">Solicitado em: {requestedAt}</p>

      {isRejected && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            <span className="font-medium">Motivo da recusa:</span>{' '}
            {property.rejection_reason?.trim() || 'Não informado pelo administrador.'}
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados do anúncio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{property.address || 'Endereço não informado'}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">Campus:</span> {property.campus || 'Não informado'}
            </div>
            <div>
              <span className="font-medium text-foreground">Valor:</span> R$ {property.price.toFixed(2)}
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" /> {property.rooms ?? 1} quarto(s)</span>
              <span className="flex items-center gap-1"><Bath className="h-4 w-4" /> {property.bathrooms ?? 1} banheiro(s)</span>
            </div>
          </div>

          {property.description && (
            <div>
              <p className="text-sm font-medium mb-1">Descrição</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{property.description}</p>
            </div>
          )}

          {property.amenities && property.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((amenity) => (
                <Badge key={amenity} variant="outline">{amenity}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {property.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fotos</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaCarousel
              items={property.images.map((url, index) => ({ url, alt: `Foto ${index + 1}` }))}
              onItemClick={(index) => {
                setLightboxIndex(index);
                setLightboxOpen(true);
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" /> Documentação enviada
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum documento enviado.</p>
          ) : (
            <div className="space-y-4">
              {documentImageUrls.length > 0 && (
                <MediaCarousel
                  items={documentImageUrls.map((url, index) => ({ url, alt: `Documento ${index + 1}` }))}
                  onItemClick={(index) => {
                    setDocsLightboxIndex(index);
                    setDocsLightboxOpen(true);
                  }}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                    <p className="text-xs sm:text-sm font-medium truncate">{doc.name}</p>
                    <div className="flex gap-1 shrink-0">
                      {doc.previewUrl && !doc.isImage && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={doc.previewUrl} target="_blank" rel="noreferrer">
                            <Eye className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                      {doc.downloadUrl && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={doc.downloadUrl} download title="Baixar Arquivo Original">
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {isApproved && (
          <Button onClick={() => navigate(`/host/edit/${property.id}`)} className="gap-1.5">
            <Edit className="h-4 w-4" /> Editar Anúncio
          </Button>
        )}

        {(isApproved || isRejected) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-1.5" disabled={deleting}>
                <Trash2 className="h-4 w-4" /> {deleting ? 'Excluindo...' : 'Excluir Anúncio'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação remove o anúncio permanentemente da sua lista.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Confirmar Exclusão
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {isPending && (
          <p className="text-sm text-muted-foreground">
            Anúncio em análise. Aguarde a revisão do admin para novas ações.
          </p>
        )}
      </div>

      <ImageLightbox
        open={lightboxOpen}
        images={property.images}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />

      <ImageLightbox
        open={docsLightboxOpen}
        images={documentImageUrls}
        initialIndex={docsLightboxIndex}
        onClose={() => setDocsLightboxOpen(false)}
      />
    </div>
  );
}
