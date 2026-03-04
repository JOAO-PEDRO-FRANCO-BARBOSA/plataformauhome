import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PendingProperty {
  id: string;
  owner_id: string;
  title: string;
  address: string | null;
  campus: string | null;
  price: number;
  images: string[] | null;
  created_at: string;
  status: string;
  iptuUrl: string | null;
  identidadeUrl: string | null;
}

type UpdatingState = Record<string, 'approved' | 'rejected' | null>;

export default function AdminDashboard() {
  const [properties, setProperties] = useState<PendingProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<UpdatingState>({});

  const resolveDocumentLinks = useCallback(async (ownerId: string) => {
    try {
      const { data: files, error } = await supabase.storage
        .from('property-documents')
        .list(ownerId, { limit: 20, sortBy: { column: 'created_at', order: 'desc' } });

      if (error || !files || files.length === 0) {
        return { iptuUrl: null, identidadeUrl: null };
      }

      const [iptuFile, identidadeFile] = files;
      const iptuPath = iptuFile ? `${ownerId}/${iptuFile.name}` : null;
      const identidadePath = identidadeFile ? `${ownerId}/${identidadeFile.name}` : null;

      const [iptuSigned, identidadeSigned] = await Promise.all([
        iptuPath
          ? supabase.storage.from('property-documents').createSignedUrl(iptuPath, 60 * 60)
          : Promise.resolve({ data: null, error: null }),
        identidadePath
          ? supabase.storage.from('property-documents').createSignedUrl(identidadePath, 60 * 60)
          : Promise.resolve({ data: null, error: null }),
      ]);

      return {
        iptuUrl: iptuSigned.data?.signedUrl ?? null,
        identidadeUrl: identidadeSigned.data?.signedUrl ?? null,
      };
    } catch {
      return { iptuUrl: null, identidadeUrl: null };
    }
  }, []);

  const fetchPendingProperties = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, owner_id, title, address, campus, price, images, created_at, status')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const pendingRows = data ?? [];
      const propertiesWithDocs = await Promise.all(
        pendingRows.map(async (item) => {
          const docs = await resolveDocumentLinks(item.owner_id);
          return {
            id: item.id,
            owner_id: item.owner_id,
            title: item.title,
            address: item.address,
            campus: item.campus,
            price: Number(item.price),
            images: item.images,
            created_at: item.created_at,
            status: item.status,
            iptuUrl: docs.iptuUrl,
            identidadeUrl: docs.identidadeUrl,
          };
        }),
      );

      setProperties(propertiesWithDocs);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível carregar os imóveis pendentes.');
    } finally {
      setLoading(false);
    }
  }, [resolveDocumentLinks]);

  useEffect(() => {
    fetchPendingProperties();
  }, [fetchPendingProperties]);

  const handleUpdateStatus = async (propertyId: string, nextStatus: 'approved' | 'rejected') => {
    setUpdating((prev) => ({ ...prev, [propertyId]: nextStatus }));
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: nextStatus, validation_status: nextStatus })
        .eq('id', propertyId);

      if (error) throw error;

      setProperties((prev) => prev.filter((property) => property.id !== propertyId));
      toast.success(nextStatus === 'approved' ? 'Imóvel aprovado com sucesso.' : 'Imóvel rejeitado.');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível atualizar o status do imóvel.');
    } finally {
      setUpdating((prev) => ({ ...prev, [propertyId]: null }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Painel Admin - Aprovação de Anúncios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Imóveis aguardando validação manual: {properties.length}</p>
        </CardContent>
      </Card>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Nenhum imóvel pendente no momento.</CardContent>
        </Card>
      ) : (
        properties.map((property) => {
          const currentUpdate = updating[property.id];
          const isUpdating = Boolean(currentUpdate);

          return (
            <Card key={property.id}>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold truncate">{property.title}</h2>
                    <p className="text-sm text-muted-foreground truncate">{property.address ?? 'Endereço não informado'}</p>
                  </div>
                  <Badge variant="secondary">Pendente</Badge>
                </div>

                <div className="text-sm text-muted-foreground flex flex-wrap gap-x-5 gap-y-1">
                  <span>Campus: {property.campus ?? 'Não informado'}</span>
                  <span>Preço: R$ {property.price.toFixed(2)}</span>
                  <Link to={`/marketplace/${property.id}`} className="text-primary hover:underline">
                    Ver anúncio
                  </Link>
                </div>

                <div className="rounded-lg border p-3 text-sm space-y-1">
                  <p className="font-medium">Documentos</p>
                  <p>
                    IPTU:{' '}
                    {property.iptuUrl ? (
                      <a href={property.iptuUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        Abrir documento
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Não enviado</span>
                    )}
                  </p>
                  <p>
                    Identidade:{' '}
                    {property.identidadeUrl ? (
                      <a href={property.identidadeUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        Abrir documento
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Não enviado</span>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(property.id, 'approved')}
                  >
                    {currentUpdate === 'approved' ? 'Aprovando...' : 'Aprovar'}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={isUpdating}
                    onClick={() => handleUpdateStatus(property.id, 'rejected')}
                  >
                    {currentUpdate === 'rejected' ? 'Rejeitando...' : 'Rejeitar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
