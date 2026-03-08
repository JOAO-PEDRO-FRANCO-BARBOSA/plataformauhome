import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Trash2, Edit, Loader2, Home, Plus, AlertTriangle, Eye, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MediaCarousel } from '@/components/MediaCarousel';
import { ImageLightbox } from '@/components/ImageLightbox';

interface Property {
  id: string;
  title: string;
  price: number;
  address: string | null;
  images: string[] | null;
  status: string | null;
  validation_status: string | null;
  rejection_reason: string | null;
  rooms: number | null;
  campus: string | null;
  created_at: string;
  featured_until: string | null;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  pending_docs: { label: 'Pendente', variant: 'secondary' },
  approved: { label: 'Aprovado', variant: 'default' },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
};

export default function MyProperties() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [featuredModalProp, setFeaturedModalProp] = useState<Property | null>(null);
  const [highlightLoading, setHighlightLoading] = useState(false);

  useEffect(() => {
    const fetchMyProperties = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('id, title, price, address, images, status, validation_status, rejection_reason, rooms, campus, created_at, featured_until')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProperties(data ?? []);
      } catch (error: any) {
        toast.error(error.message || 'Erro ao carregar seus imóveis.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyProperties();
  }, [user]);

  const handleDelete = async (id: string, status: string | null) => {
    if (status === 'pending') {
      toast.error('Não é possível excluir um anúncio em análise.');
      return;
    }

    setDeleting(id);
    try {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) throw error;
      setProperties((prev) => prev.filter((p) => p.id !== id));
      toast.success('Imóvel excluído com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir imóvel');
    } finally {
      setDeleting(null);
    }
  };

  const handleHighlightPayment = async () => {
    if (!featuredModalProp) return;

    setHighlightLoading(true);
    try {
      console.log("Enviando ID:", featuredModalProp.id);
      const { data, error } = await supabase.functions.invoke('create-highlight-checkout', {
        body: { propertyId: featuredModalProp.id },
      });

      if (error) throw error;

      const checkoutUrl = data?.url as string | undefined;
      if (!checkoutUrl) throw new Error(data?.error || 'URL do checkout não retornada.');

      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error('Erro no pagamento:', error);
      toast.error(error.message || 'Não foi possível iniciar o pagamento do destaque.');
    } finally {
      setHighlightLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-4">
        <Home className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">Nenhum imóvel anunciado</h1>
        <p className="text-muted-foreground">Você ainda não publicou nenhum imóvel ou vaga.</p>
        <Button onClick={() => navigate('/host/new')} className="gap-2">
          <Plus className="h-4 w-4" /> Anunciar Imóvel
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus Imóveis</h1>
        <Button size="sm" onClick={() => navigate('/host/new')} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Anúncio
        </Button>
      </div>

      <div className="space-y-4">
        {properties.map((prop) => {
          const propertyStatus = prop.status ?? prop.validation_status ?? 'pending';
          const status = statusLabels[propertyStatus] ?? statusLabels.pending;
          const isPending = propertyStatus === 'pending' || propertyStatus === 'pending_docs';
          const isApproved = propertyStatus === 'approved';
          const isRejected = propertyStatus === 'rejected';
          const isFeatured = !!(prop.featured_until && new Date(prop.featured_until) > new Date());
          const mediaItems = (prop.images?.length ? prop.images : ['/placeholder.svg']).map((url, index) => ({
            url,
            alt: `${prop.title} - imagem ${index + 1}`,
          }));
          const requestedAt = new Date(prop.created_at).toLocaleDateString('pt-BR');

          return (
            <Card key={prop.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-56 p-2">
                    <MediaCarousel
                      items={mediaItems}
                      className="h-full"
                      onItemClick={(index) => {
                        setLightboxImages(mediaItems.map((item) => item.url));
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                      }}
                    />
                  </div>
                  <div className="flex-1 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">{prop.title}</h3>
                        <p className="text-sm text-muted-foreground">{prop.address || 'Sem endereço'}</p>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-bold text-foreground text-base">R$ {Number(prop.price).toLocaleString('pt-BR')}</span>
                      {prop.rooms && <span>{prop.rooms} quarto(s)</span>}
                      {prop.campus && <span>• {prop.campus}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">Solicitado em: {requestedAt}</p>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 w-fit"
                      onClick={() => navigate(`/my-properties/${prop.id}`)}
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver Anúncio
                    </Button>

                    {isRejected && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>
                          <span className="font-medium">Motivo da recusa:</span>{' '}
                          {prop.rejection_reason?.trim() || 'Não informado pelo administrador.'}
                        </p>
                      </div>
                    )}

                    {isApproved && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {isFeatured ? (
                          <Badge className="bg-amber-500/15 text-amber-700 border border-amber-300 text-xs gap-1">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            Em destaque até {new Date(prop.featured_until!).toLocaleDateString('pt-BR')}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-amber-400 text-amber-700 hover:bg-amber-50"
                            onClick={() => setFeaturedModalProp(prop)}
                          >
                            <Star className="h-3.5 w-3.5" /> Destacar Anúncio
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => navigate(`/host/edit/${prop.id}`)}
                        >
                          <Edit className="h-3.5 w-3.5" /> Editar
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="gap-1.5" disabled={deleting === prop.id}>
                              {deleting === prop.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir imóvel?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O anúncio "{prop.title}" será removido permanentemente. Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(prop.id, propertyStatus)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Sim, excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}

                    {isRejected && (
                      <div className="flex gap-2 pt-1">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="gap-1.5" disabled={deleting === prop.id}>
                              {deleting === prop.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir imóvel?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O anúncio "{prop.title}" será removido permanentemente. Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(prop.id, propertyStatus)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Sim, excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}

                    {isPending && (
                      <p className="text-xs text-muted-foreground">
                        Em análise: edição e exclusão ficam bloqueadas até a revisão do admin.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ImageLightbox
        open={lightboxOpen}
        images={lightboxImages}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />

      <Dialog open={!!featuredModalProp} onOpenChange={(open) => !open && setFeaturedModalProp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Star className="h-8 w-8 text-amber-500 fill-amber-500" />
            </div>
            <DialogTitle className="text-xl">Destacar Anúncio</DialogTitle>
            <DialogDescription className="text-base">
              Coloque <span className="font-semibold">"{featuredModalProp?.title}"</span> no topo das buscas e atraia mais interessados!
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-accent/30 p-4 space-y-2 text-sm">
            <p className="flex items-center gap-2"><span className="text-amber-500">✦</span> Apareça no topo das buscas por <strong>7 dias</strong></p>
            <p className="flex items-center gap-2"><span className="text-amber-500">✦</span> Badge <strong>"🌟 Destaque"</strong> visível no card</p>
            <p className="flex items-center gap-2"><span className="text-amber-500">✦</span> Borda dourada que chama atenção</p>
          </div>

          <div className="text-center py-2">
            <span className="text-3xl font-bold text-foreground">R$ 29,90</span>
            <p className="text-xs text-muted-foreground mt-1">Pagamento único · 7 dias de destaque</p>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2"
              onClick={handleHighlightPayment}
              disabled={highlightLoading}
            >
              {highlightLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Redirecionando...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4" /> Ir para Pagamento
                </>
              )}
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" className="w-full">Cancelar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
