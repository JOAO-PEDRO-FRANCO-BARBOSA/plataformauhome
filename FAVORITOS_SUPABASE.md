# Sincronização de Favoritos com Supabase - Guia de Implementação

## Resumo das Alterações

A funcionalidade de favoritos foi completamente sincronizada com o backend do Supabase. Agora, quando um usuário marca um imóvel como favorito, a ação persiste no banco de dados e é carregada corretamente em todas as páginas.

---

## Arquivos Modificados

### 1. **src/hooks/useFavorites.ts** (Reescrito completamente)

**O que mudou:**
- Substitui o estado mockado por chamadas reais ao Supabase
- Carrega a lista de favoritos do usuário ao inicializar o hook
- Realiza insert/delete na tabela `favorites` conforme necessário
- Adicionado estado de `loading` para gerenciar requisições
- Toast notifications automáticas

**Funcionalidades principais:**
```typescript
export function useFavorites() {
  // Carrega favoritos ao inicializar
  useEffect(() => {
    const loadFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', user.id);
      setFavoriteIds(data?.map((fav) => fav.property_id) || []);
    };
  }, []);

  // Toggle assíncrono (insert/delete)
  const toggle = useCallback(async (id: string) => {
    if (isFav) {
      await supabase.from('favorites').delete()...
    } else {
      await supabase.from('favorites').insert([...])
    }
  }, []);

  return { favoriteIds, toggle, isFavorite, loading };
}
```

**Breaking Change:**
- `onToggleFavorite` agora é uma função **assíncrona** que retorna `Promise<void>`

---

### 2. **src/components/PropertyCard.tsx**

**O que mudou:**
- Tipagem da propriedade `onToggleFavorite` alterada para `(id: string) => Promise<void>`
- Adicionado estado local `isSavingFavorite` para gerenciar loading do botão
- Novo handler `handleToggleFavorite` que aguarda a promise antes de finalizar
- Botão desabilitar e com feedback visual durante a requisição

**Código-chave:**
```typescript
const [isSavingFavorite, setIsSavingFavorite] = useState(false);

const handleToggleFavorite = async (e: React.MouseEvent) => {
  e.stopPropagation();
  setIsSavingFavorite(true);
  try {
    await onToggleFavorite(property.id);
  } finally {
    setIsSavingFavorite(false);
  }
};

<button
  onClick={handleToggleFavorite}
  disabled={isSavingFavorite}
  className="... disabled:opacity-70 disabled:cursor-not-allowed"
>
```

---

### 3. **src/pages/Marketplace.tsx**

**O que mudou:**
- Removido a função `handleToggleFavorite` que fazia toast manual
- Removida importação de `sonner` (toast agora é automático)
- Agora passa `toggle` diretamente como `onToggleFavorite`

**Antes:**
```typescript
const handleToggleFavorite = (id: string) => {
  toggle(id);
  toast.success(isFavorite(id) ? 'Removido dos favoritos' : 'Imóvel salvo nos favoritos! 💜');
};

<PropertyCard onToggleFavorite={handleToggleFavorite} />
```

**Depois:**
```typescript
<PropertyCard onToggleFavorite={toggle} />
```

---

### 4. **src/pages/Dashboard.tsx** (Sem alterações necessárias)

O Dashboard já está funcionando corretamente porque:
- Usa `useFavorites()` que agora carrega dados do Supabase
- Filtra `properties` baseado em `favoriteIds` que são atualizados em tempo real
- Passa `toggle` como `onToggleFavorite` (agora assíncrono)

---

## Fluxo de Funcionamento

### 1️⃣ **Carregamento Inicial** (Marketplace/Dashboard)
```
usuário abre a página
  ↓
useFavorites() é inicializado
  ↓
useEffect carrega favoriteIds do Supabase
  ↓
PropertyCard renderiza com isFavorite correto
```

### 2️⃣ **Ao Clicar no Coração**
```
usuário clica no botão de favorito
  ↓
handleToggleFavorite aguarda a promise
  ↓
toggle() faz insert/delete no Supabase
  ↓
favoriteIds é atualizado no estado local
  ↓
Toast notification exibida
  ↓
UI refatora com novo estado
```

---

## Tratamento de Erros

Todos os erros são capturados e exibidos ao usuário via toast:

```typescript
try {
  // operação...
} catch (err) {
  console.error('Erro ao atualizar favorito:', err);
  toast({
    title: 'Erro',
    description: 'Não foi possível atualizar o favorito',
    variant: 'destructive',
  });
}
```

---

## Requisitos do Banco de Dados

A tabela `favorites` no Supabase deve ter:

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key → profiles.id |
| `property_id` | uuid | Foreign key → properties.id |
| `created_at` | timestamptz | Auto-generated |

---

## Testes Recomendados

1. ✅ Clicar no coração para favoritar um imóvel
2. ✅ Clicar novamente para remover dos favoritos
3. ✅ Verificar que a alteração persiste ao recarregar a página
4. ✅ Validar toast notifications
5. ✅ Verificar que o Dashboard mostra os favoritos corretos
6. ✅ Testar com múltiplas abas abertas (sincronização em tempo real)

---

## Melhorias Futuras

- Agregar listeners realtime do Supabase para sincronizar múltiplas abas
- Adicionar animações de transição ao coração
- Implementar batch operations se houver muitos favoritos

