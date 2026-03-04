import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaCarouselItem {
  url: string;
  alt: string;
}

interface MediaCarouselProps {
  items: MediaCarouselItem[];
  className?: string;
  onItemClick?: (index: number) => void;
  emptyLabel?: string;
}

export function MediaCarousel({
  items,
  className,
  onItemClick,
  emptyLabel = 'Nenhuma imagem disponível',
}: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length === 0) {
      setCurrentIndex(0);
      return;
    }

    if (currentIndex > items.length - 1) {
      setCurrentIndex(0);
    }
  }, [items.length, currentIndex]);

  const currentItem = useMemo(() => items[currentIndex], [items, currentIndex]);

  const goPrev = () => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const goNext = () => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  if (items.length === 0) {
    return (
      <div className={cn('rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground', className)}>
        <ImageOff className="mx-auto mb-2 h-5 w-5" />
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="relative overflow-hidden rounded-xl border bg-muted/20">
        <div className="aspect-[4/3] w-full">
          <img
            src={currentItem.url}
            alt={currentItem.alt}
            className={cn('h-full w-full object-cover', onItemClick && 'cursor-zoom-in')}
            onClick={() => onItemClick?.(currentIndex)}
            loading="lazy"
          />
        </div>

        {items.length > 1 && (
          <>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
              onClick={goPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
              onClick={goNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {items.map((item, index) => (
            <button
              type="button"
              key={`${item.url}-${index}`}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'h-2 rounded-full transition-all',
                index === currentIndex ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30',
              )}
              aria-label={`Ir para imagem ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
