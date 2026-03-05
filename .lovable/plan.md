

# Dashboard Favorites + Contact Reveal Flow

## Build Error Fix

The `npm:stripe@^14.16.0` import fails because there's no `deno.json` with `nodeModulesDir` config. Fix by adding an import map for the edge functions.

**Create `supabase/functions/deno.json`** with:
```json
{ "nodeModulesDir": "auto" }
```

This resolves the npm specifier error for both `create-highlight-checkout` and `stripe-webhook`.

## Feature Changes

### 1. `src/components/MarketplacePropertyPanel.tsx` — Contact reveal flow

- Add `const [showContact, setShowContact] = useState(false)` state
- Replace the always-visible "Fale com o Proprietário" section with:
  - When `showContact === false`: Show a prominent purple "Tenho Interesse" button
  - When `showContact === true`: Animate in (Tailwind `animate-in fade-in slide-in-from-bottom-2`) the "Contato do Proprietário" section with:
    - Green WhatsApp button linking to `https://wa.me/55{digits}` (target `_blank`)
    - Social link below if `contactSocial` exists
  - Never display `owner_email` or `owner_cpf_cnpj`
- Reset `showContact` to `false` when `property` changes (via useEffect)

### 2. `src/pages/Dashboard.tsx` — Open modal instead of navigating

- Import `MarketplacePropertyPanel` and add local state for `selectedProperty` and `detailsOpen`
- Change `onOpenDetails` from `navigate(...)` to setting the selected property and opening the panel
- The favorites query already works: `useProperties()` fetches approved properties, then filters by `favoriteIds`. This is correct as long as favorites exist in the DB.

### 3. Files summary

| File | Action |
|------|--------|
| `supabase/functions/deno.json` | CREATE — fix npm import |
| `src/components/MarketplacePropertyPanel.tsx` | EDIT — add contact reveal |
| `src/pages/Dashboard.tsx` | EDIT — open panel instead of navigate |

