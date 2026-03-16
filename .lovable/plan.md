

# Meus Imóveis + Filtro de Preço + Sidebar

## Alterações

### 1. `src/pages/MyProperties.tsx` — Already exists, minor tweaks
The page already exists with proper empty state, CTA, loading, and delete functionality. It's well-implemented. No major changes needed — it already queries `properties` by `owner_id`, shows empty state with "Anunciar Imóvel" CTA, and lists properties with status badges.

### 2. `src/components/SidebarFilters.tsx` — Single-value price slider
- Change the price slider from a dual-thumb range `[min, max]` to a single-thumb "Preço máximo" slider
- Label changes from "Preço: R$ X – R$ Y" to "Preço máximo: R$ Y"
- The slider value becomes a single number; the filter passes `[200, maxValue]` as the priceRange to keep backward compatibility with `useProperties`

### 3. `src/types/index.ts` — No changes needed
The `PropertyFilters.priceRange` stays as `[number, number]` for backward compatibility.

### 4. `src/components/AppLayout.tsx` — Add "Meus Imóveis" to sidebar
- Add a `Building2` nav item `{ title: 'Meus Imóveis', url: '/my-properties', icon: Building2 }` to the `navItems` array in the desktop sidebar
- This makes it always visible in the sidebar (matching the reference screenshot pattern), while the dropdown menu keeps the conditional logic already in place

### Summary of files to edit
- `src/components/SidebarFilters.tsx` — single-thumb price slider
- `src/components/AppLayout.tsx` — add "Meus Imóveis" to sidebar navItems

