

# Fix Build Error + Payment Button

## Problem

Two issues:

1. **Build error** in `create-highlight-checkout/index.ts:55-57`: `error` is of type `unknown` — needs casting to `(error as Error).message`.
2. **Payment button** in `MyProperties.tsx:98`: sends `property_id` but the edge function also accepts `propertyId`. The code is actually correct (the function handles both), but we should add the `console.log` and ensure proper error display as requested.

## Changes

### 1. `supabase/functions/create-highlight-checkout/index.ts` (lines 55-57)
Cast `error` to `Error`:
```ts
} catch (error) {
    const msg = (error as Error).message ?? 'Erro desconhecido';
    console.error('ERRO CRÍTICO:', msg)
    return new Response(JSON.stringify({ error: msg }), {
```

### 2. `src/pages/MyProperties.tsx` (lines 92-113)
- Add `console.log("Enviando ID:", featuredModalProp.id)` before the invoke
- Keep using `supabase.functions.invoke` (it's correct)
- Improve error handling to show the real message from the edge function response

```ts
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
```

### Files
| File | Change |
|------|--------|
| `supabase/functions/create-highlight-checkout/index.ts` | Cast `error as Error` (fixes build) |
| `src/pages/MyProperties.tsx` | Add console.log, improve error display |

