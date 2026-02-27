import { PropertyFilters, Campus } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface FilterBarProps {
  filters: PropertyFilters;
  onChange: (filters: PropertyFilters) => void;
}

const campuses: (Campus | 'todos')[] = ['todos', 'Santa Mônica', 'Umuarama', 'Pontal', 'Glória'];

export function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg border">
      <div className="flex-1 min-w-[140px]">
        <Label className="text-xs text-muted-foreground mb-1 block">Campus</Label>
        <Select value={filters.campus} onValueChange={(v) => onChange({ ...filters, campus: v as Campus | 'todos' })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {campuses.map((c) => (
              <SelectItem key={c} value={c}>{c === 'todos' ? 'Todos os campus' : c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 min-w-[180px]">
        <Label className="text-xs text-muted-foreground mb-1 block">
          Preço: R$ {filters.priceRange[0]} – R$ {filters.priceRange[1]}
        </Label>
        <Slider
          min={200}
          max={2500}
          step={50}
          value={filters.priceRange}
          onValueChange={(v) => onChange({ ...filters, priceRange: v as [number, number] })}
          className="mt-2"
        />
      </div>
      <div className="min-w-[120px]">
        <Label className="text-xs text-muted-foreground mb-1 block">Quartos</Label>
        <Select
          value={filters.rooms?.toString() ?? 'todos'}
          onValueChange={(v) => onChange({ ...filters, rooms: v === 'todos' ? null : Number(v) })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="1">1 quarto</SelectItem>
            <SelectItem value="2">2 quartos</SelectItem>
            <SelectItem value="3">3+ quartos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
