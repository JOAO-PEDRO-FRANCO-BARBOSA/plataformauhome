import { PropertyFilters, Campus } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PawPrint } from 'lucide-react';

interface SidebarFiltersProps {
  filters: PropertyFilters;
  onChange: (filters: PropertyFilters) => void;
}

const campuses: (Campus | 'todos')[] = ['todos', 'Santa Mônica', 'Umuarama', 'Pontal', 'Glória'];

export function SidebarFilters({ filters, onChange }: SidebarFiltersProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Campus</Label>
        <Select value={filters.campus} onValueChange={(v) => onChange({ ...filters, campus: v as Campus | 'todos' })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {campuses.map((c) => (
              <SelectItem key={c} value={c}>{c === 'todos' ? 'Todos os campus' : c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">
          Preço máximo: R$ {filters.priceRange[1]}
        </Label>
        <Slider
          min={200}
          max={2500}
          step={50}
          value={[filters.priceRange[1]]}
          onValueChange={(v) => onChange({ ...filters, priceRange: [200, v[0]] })}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Quartos</Label>
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

      <div className="flex items-center justify-between">
        <Label className="text-sm flex items-center gap-2 cursor-pointer">
          <PawPrint className="w-4 h-4 text-amber-500" />
          Aceita Pet
        </Label>
        <Switch
          checked={filters.acceptsPet === true}
          onCheckedChange={(checked) => onChange({ ...filters, acceptsPet: checked ? true : null })}
        />
      </div>
    </div>
  );
}
