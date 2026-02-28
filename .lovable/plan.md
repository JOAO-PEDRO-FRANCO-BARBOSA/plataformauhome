

# Sprint 2: Marketplace Vitrine QuintoAndar

## O que muda

Upgrade completo do Marketplace: adicionar `images[]` e `acceptsPet` aos dados, carrossel de imagens nos cards, filtro "Aceita Pet", sidebar de filtros colapsável no mobile, e página de detalhes do imóvel com hero de imagens + comodidades em grid.

## Alterações

### 1. `src/types/index.ts` — Expandir Property
- `image: string` → `images: string[]` (array de 3-4 fotos Unsplash)
- Adicionar `acceptsPet: boolean`
- Adicionar `acceptsPet` ao `PropertyFilters`

### 2. `src/data/mockData.ts` — Enriquecer mock data
- Cada propriedade ganha `images: string[]` (3-4 URLs Unsplash variadas) e `acceptsPet`
- Manter campo `image` como `images[0]` para compatibilidade ou migrar todos os usos

### 3. `src/components/PropertyCard.tsx` — Carrossel no card
- Substituir `<img>` por mini carrossel navegável (setas esquerda/direita) dentro do card
- Indicadores de dots no carrossel
- Manter badges, favorito e botão "Tenho Interesse"
- Clique no card (fora dos botões) navega para `/marketplace/:id`

### 4. `src/components/FilterBar.tsx` → `src/components/SidebarFilters.tsx`
- Refatorar para layout vertical (sidebar style)
- Adicionar toggle "Aceita Pet" (com ícone PawPrint)
- Desktop: sidebar fixa à esquerda
- Mobile: botão flutuante "Filtros" abre Sheet/Drawer com os filtros

### 5. `src/pages/Marketplace.tsx` — Layout sidebar + grid
- Layout flex: sidebar de filtros à esquerda (desktop) + grid de cards à direita
- Mobile: filtros em Sheet, botão "Filtros" fixo
- Contador de resultados ("X imóveis encontrados")

### 6. `src/pages/PropertyDetails.tsx` — Nova página de detalhes
- Hero section: galeria de imagens grande (carrossel ou grid)
- Seção de descrição completa
- Grid de comodidades com ícones (Wifi, Car, Dumbbell, Shield, etc.)
- Card lateral fixo (desktop) / inferior fixo (mobile) com preço + botão "Tenho Interesse" → ContactModal
- Badges "Sem Fiador" e "Verificado"
- Botão voltar para marketplace

### 7. `src/hooks/useProperties.ts` — Filtro acceptsPet
- Adicionar lógica de filtro para `acceptsPet`

### 8. `src/App.tsx` — Nova rota
- Adicionar `/marketplace/:id` → `PropertyDetails`

### 9. Atualizar referências
- `Dashboard.tsx` e qualquer outro uso de `property.image` → `property.images[0]`

