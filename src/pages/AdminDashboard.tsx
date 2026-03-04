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
  title: string;
  address: string | null;
  campus: string | null;
  price: number;
  thumbnailUrl: string | null;
  created_at: string;
  status: string;
}


export default function AdminDashboard() {
  const [properties, setProperties] = useState<PendingProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<UpdatingState>({});

  const resolveDocumentLinks = useCallback(async (paths: string[] | null) => {
    try {
      if (!paths || paths.length === 0) {
        return { iptuUrl: null, identidadeUrl: null };
      }

      const normalize = (value: string) => value.toLowerCase();

      const iptuPath = paths.find((path) => normalize(path).includes('iptu')) ?? paths[0] ?? null;
      const identidadePath = paths.find((path) => {
        const lowerPath = normalize(path);
        return (
          lowerPath.includes('identidade') ||
          lowerPath.includes('documento') ||
          lowerPath.includes('rg') ||
          lowerPath.includes('cpf')
        );
      }) ?? paths[1] ?? null;

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
        .select('id, title, address, campus, price, images, document_paths, created_at, status')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const pendingRows = data ?? [];
      const propertiesWithDocs = await Promise.all(
        pendingRows.map(async (item) => {
          const docs = await resolveDocumentLinks(item.document_paths);
          const firstImage = item.images?.[0] ?? null;
          const thumbnailUrl = firstImage
            ? (firstImage.startsWith('http')
              ? firstImage
              : supabase.storage.from('property-images').getPublicUrl(firstImage).data.publicUrl)
            : null;

          return {
            id: item.id,
            title: item.title,
            address: item.address,
            campus: item.campus,
            price: Number(item.price),
            images: item.images,
            thumbnailUrl,
            document_paths: item.document_paths,
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
                  <div className="min-w-0 flex items-center gap-3">
                    {property.thumbnailUrl ? (
                      <img
                        src={property.thumbnailUrl}
                        alt={property.title}
                        className="h-14 w-14 rounded-md object-cover border shrink-0"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-md border bg-muted flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
                        Sem foto
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="font-semibold truncate">{property.title}</h2>
                      <p className="text-sm text-muted-foreground truncate">{property.address ?? 'Endereço não informado'}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Pendente</Badge>
                </div>

                <div className="text-sm text-muted-foreground flex flex-wrap gap-x-5 gap-y-1">
                  <span>Campus: {property.campus ?? 'Não informado'}</span>
                  <span>Preço: R$ {property.price.toFixed(2)}</span>
                </div>

                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={`/admin/properties/${property.id}`}>Revisar</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
