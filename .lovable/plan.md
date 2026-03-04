

# Validacao Full-Stack: Wizard de Imoveis + Auto-Save no Perfil

## Problema Atual

1. **PropertyWizard**: O botao "Avancar" nao valida nada — usuario pode publicar imovel sem titulo, sem foto, sem preco. Docs vao para o bucket publico `property-images`.
2. **Profile.tsx**: Exige clique manual em "Salvar Preferencias" — nao tem auto-save.

## Plano

### 1. Migration SQL: Bucket privado `property-documents` + RLS

```sql
-- Criar bucket privado
INSERT INTO storage.buckets (id, name, public) VALUES ('property-documents', 'property-documents', false);

-- RLS: owner pode fazer upload
CREATE POLICY "Owners can upload docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: owner pode ler seus docs
CREATE POLICY "Owners can read own docs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'property-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: owner pode deletar seus docs
CREATE POLICY "Owners can delete own docs" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'property-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 2. `src/components/PropertyWizard.tsx` — Validacao por etapa + reordenar steps

**Reordenar etapas** para match com o prompt:
- Step 0: Localizacao (titulo, endereco, campus — todos obrigatorios)
- Step 1: Caracteristicas (quartos, banheiros, >= 1 comodidade, descricao — obrigatorios; pet/fiador opcionais)
- Step 2: Documentacao e Preco (>= 1 doc, preco — obrigatorios; fiador opcional). Docs upload vai para `property-documents` bucket
- Step 3: Fotos (>= 1 foto — obrigatoria para publicar)

**Logica de validacao**: funcao `validateStep(step)` retorna `string | null` (mensagem de erro ou null se valido). O botao "Avancar" chama `validateStep` — se retornar erro, exibe `toast.error()` e nao avanca.

**Upload de docs**: Na `handlePublish`, fazer upload dos docs para `property-documents` (privado) em vez de `property-images`. Salvar os paths no campo description ou em um campo futuro (por ora, apenas upload seguro).

### 3. `src/pages/Profile.tsx` — Auto-save com debounce

- Remover o botao "Salvar Preferencias"
- No `useProfile`, o `updateProfile` ja faz `.update()` no Supabase imediatamente (linha 80). Atualmente o Profile chama `updateProfile` no `onChange` de cada input — isso ja salva automaticamente.
- Problema: cada keystroke dispara um UPDATE. Solucao: adicionar debounce de 800ms no `useProfile.updateProfile` usando um `useRef` com `setTimeout`.
- Adicionar um indicador sutil "Salvo automaticamente" que aparece brevemente apos cada save.

### 4. `src/hooks/useProfile.ts` — Debounced auto-save

Refatorar `updateProfile` para:
1. Atualizar state local imediatamente (responsividade)
2. Agendar o `.update()` do Supabase com debounce de 800ms
3. Retornar uma flag `isSaving` para feedback visual

### Resumo de arquivos editados
- **Migration SQL**: bucket `property-documents` + RLS policies
- **`src/hooks/useProfile.ts`**: debounce no updateProfile + isSaving flag
- **`src/pages/Profile.tsx`**: remover botao "Salvar", adicionar indicador auto-save
- **`src/components/PropertyWizard.tsx`**: validacao por etapa, reordenar steps, upload docs para bucket privado

