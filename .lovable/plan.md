

# Admin Property Review — Página de Dossiê Detalhado

## Resumo

Criar uma nova página `AdminPropertyReview.tsx` acessível via `/admin/properties/:id` que exibe o dossiê completo de um imóvel pendente. O `AdminDashboard` passa a ser apenas uma lista resumida com link "Revisar" — sem botões de aprovar/rejeitar inline.

## Arquivos a criar/editar

### 1. `src/pages/AdminPropertyReview.tsx` (NOVO)

Página que recebe o `id` via `useParams`, faz fetch do imóvel no Supabase (`properties` table), gera signed URLs para documentos do bucket privado `property-documents`, e exibe:

- **Header**: Botão voltar para `/admin`, título do imóvel, Badge de status "Pendente"
- **Dados de texto** (Card): Título, Endereço, Campus, Preço (formatado R$), Quartos, Banheiros, Descrição. Flags "Aceita Pet" e "Sem Fiador" como Badges coloridos
- **Comodidades**: Grid de Badge tags (Wi-Fi, Garagem, etc.)
- **Galeria de Fotos**: Grid responsivo 2-3 colunas com as imagens públicas do array `images`
- **Documentação Comprobatória**: Cards para cada `document_paths` entry com nome do arquivo e botão "Baixar/Visualizar" (usando signed URLs)
- **Rodapé fixo (sticky bottom)**: Dois botões grandes — "Aprovar Anúncio" (primary/green) e "Rejeitar Anúncio" (destructive). Chamam `supabase.from('properties').update({ status, validation_status })` e redirecionam para `/admin`

### 2. `src/pages/AdminDashboard.tsx` (EDITAR)

- Remover os botões "Aprovar" / "Rejeitar" de cada card
- Alterar o link "Ver anúncio" (`/marketplace/:id`) para "Revisar" apontando para `/admin/properties/:id`
- Manter a contagem e layout de lista resumida

### 3. `src/App.tsx` (EDITAR)

- Adicionar rota `/admin/properties/:id` dentro do `AppLayout`, protegida por `AdminRoute`:
  ```
  <Route path="/admin/properties/:id" element={<AdminRoute><AdminPropertyReview /></AdminRoute>} />
  ```

## Estrutura visual do AdminPropertyReview

```text
┌─────────────────────────────────────────┐
│ ← Voltar    Título do Imóvel   [Pendente]│
├─────────────────────────────────────────┤
│ Informações Gerais                       │
│  Endereço: ...   Campus: ...             │
│  Preço: R$ ...   Quartos: X  Banhos: Y   │
│  Descrição: ...                          │
│  [Aceita Pet] [Sem Fiador]               │
│                                          │
│ Comodidades                              │
│  [Wi-Fi] [Garagem] [Mobiliado] ...       │
├─────────────────────────────────────────┤
│ Galeria de Fotos                         │
│  ┌───┐ ┌───┐ ┌───┐                      │
│  │   │ │   │ │   │                      │
│  └───┘ └───┘ └───┘                      │
├─────────────────────────────────────────┤
│ Documentação Comprobatória               │
│  ┌─────────────────┐ ┌────────────────┐  │
│  │ Doc 1  [Baixar] │ │ Doc 2 [Baixar] │  │
│  └─────────────────┘ └────────────────┘  │
├─────────────────────────────────────────┤
│  [  Aprovar Anúncio  ] [Rejeitar Anúncio]│
└─────────────────────────────────────────┘
```

