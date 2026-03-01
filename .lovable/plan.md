

# Fix: Botão "Finalizar" do Onboarding

## Problema

A função `handleFinish` no `Onboarding.tsx` não captura erros da chamada Supabase. Se o `.update()` falhar (ex: RLS policy restritiva, perfil ainda não criado pelo trigger), a falha é silenciosa — sem feedback ao usuário.

Além disso, as RLS policies nas tabelas estão todas como **RESTRICTIVE** em vez de **PERMISSIVE**, o que pode bloquear operações mesmo quando o usuário está autenticado.

## Plano

### 1. Migration: Corrigir RLS policies para PERMISSIVE

As policies atuais na tabela `profiles` são `RESTRICTIVE`. Precisamos recriá-las como `PERMISSIVE` para que o UPDATE funcione corretamente:

```sql
DROP POLICY IF EXISTS "Usuários podem atualizar o próprio perfil" ON profiles;
CREATE POLICY "Usuários podem atualizar o próprio perfil" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Perfis são visíveis publicamente" ON profiles;
CREATE POLICY "Perfis são visíveis publicamente" ON profiles FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
```

Same fix for `connections`, `messages`, and `properties` policies.

### 2. `src/pages/Onboarding.tsx` — Adicionar try/catch

Envolver a chamada `.update()` em try/catch:
- Se `error` retornado pelo Supabase, exibir `toast.error(error.message)`
- Se sucesso, `toast.success` + `navigate('/dashboard')`
- `setSaving(false)` no bloco `finally`
- Botão já tem `disabled={saving}` e loading spinner — está correto

Mudança mínima, apenas na função `handleFinish` (linhas 38-61).

