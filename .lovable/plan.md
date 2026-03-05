

# Anúncios em Destaque — Card Premium + Upsell Modal

## Build errors to fix first

1. **`supabase/functions/notify-property-status/index.ts:60-61`**: Cast `error` to `Error` — `(error as Error).message`
2. **`src/pages/Dashboard.tsx:77`**: Add missing `onOpenDetails` prop to `PropertyCard`

## Feature changes

### 1. `src/components/PropertyCard.tsx` — Estilo premium

- Add a helper: `const isFeatured = property.featured_until && new Date(property.featured_until) > new Date()`
- If featured, apply to the Card: `border-amber-400 border-2 shadow-amber-100` classes
- Add a "🌟 Destaque" Badge (amber/gold) in the top-left corner alongside existing badges
- Add `featured_until` as optional field to the `Property` type in `src/types/index.ts`

### 2. `src/pages/MyProperties.tsx` — Botão "Destacar Anúncio" + Modal

- Fetch `featured_until` alongside existing columns
- Add it to the local `Property` interface
- For approved properties, add a "⭐ Destacar Anúncio" button (amber styled) next to Edit/Delete
- If already featured (future date), show disabled badge "Em destaque até DD/MM"
- Create an inline `Dialog` modal with:
  - Attractive header with star icon
  - Benefit text: "Apareça no topo das buscas por 7 dias"
  - Price: "R$ 29,90"
  - "Ir para Pagamento" button (onClick empty/noop)
  - Cancel button

### 3. `src/pages/Dashboard.tsx` — Fix build error

- Add `onOpenDetails` prop with a navigate to `/marketplace` or property details

### 4. `supabase/functions/notify-property-status/index.ts` — Fix TS error

- Cast catch variable: `(error as Error).message`

### Files edited
- `src/types/index.ts` — add `featured_until?: string`
- `src/components/PropertyCard.tsx` — premium styling
- `src/pages/MyProperties.tsx` — upsell button + modal
- `src/pages/Dashboard.tsx` — fix missing prop
- `supabase/functions/notify-property-status/index.ts` — fix TS error

