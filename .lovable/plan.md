

# Integração Front-end + Backend (Supabase)

## Escopo

Substituir todos os dados mockados por chamadas reais ao Supabase, conectando Auth, Matches, Chat e Imóveis às tabelas existentes.

## Pré-requisitos: Migrações de Schema

As tabelas atuais estão incompletas. Precisamos adicionar colunas faltantes:

### Migration 1 — profiles (adicionar campos de perfil)
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS course text,
  ADD COLUMN IF NOT EXISTS campus text,
  ADD COLUMN IF NOT EXISTS semester integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS habits jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS search_type text DEFAULT 'republica',
  ADD COLUMN IF NOT EXISTS price_range_min integer DEFAULT 400,
  ADD COLUMN IF NOT EXISTS price_range_max integer DEFAULT 800;

-- INSERT policy (auto-create on signup via trigger)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### Migration 2 — properties (adicionar campos faltantes)
```sql
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS campus text,
  ADD COLUMN IF NOT EXISTS address text DEFAULT '',
  ADD COLUMN IF NOT EXISTS rooms integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bathrooms integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS no_fiador boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS accepts_pet boolean DEFAULT false;

-- RLS policies
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view properties" ON properties FOR SELECT USING (true);
CREATE POLICY "Owners can insert properties" ON properties FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update own properties" ON properties FOR UPDATE USING (auth.uid() = owner_id);
```

### Migration 3 — connections RLS
```sql
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own connections" ON connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can request connections" ON connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Receiver can update connection" ON connections FOR UPDATE
  USING (auth.uid() = receiver_id);
```

### Migration 4 — messages RLS + realtime
```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see messages in own connections" ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM connections c
    WHERE c.id = connection_id
    AND (c.requester_id = auth.uid() OR c.receiver_id = auth.uid())
    AND c.status = 'accepted'
  ));
CREATE POLICY "Users can send messages in accepted connections" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM connections c
    WHERE c.id = connection_id
    AND (c.requester_id = auth.uid() OR c.receiver_id = auth.uid())
    AND c.status = 'accepted'
  ));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### Migration 5 — Trigger auto-create profile
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Migration 6 — Storage bucket for photos
Create a `property-images` storage bucket (public) for property photos and match photos.

---

## Alterações no Código

### 1. `src/contexts/AuthContext.tsx` — Supabase Auth
- Replace mock auth with `supabase.auth.signInWithPassword`, `signUp`, `signOut`
- `signUp` passes `full_name` in `options.data` (trigger creates profile)
- Use `onAuthStateChange` listener + `getSession` for session state
- Expose `session`, `user`, `profile` (fetched from profiles table)
- `isLoggedIn` derived from session existence

### 2. `src/pages/Login.tsx` — Real login
- Call `supabase.auth.signInWithPassword({ email, password })`
- Handle error states (invalid credentials, etc.)
- Add loading state to prevent double-clicks

### 3. `src/pages/Register.tsx` — Real registration
- Call `supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })`
- Add loading state

### 4. `src/pages/ForgotPassword.tsx` — Real password reset
- Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`

### 5. NEW `src/pages/ResetPassword.tsx`
- Form to set new password
- Check for `type=recovery` in URL hash
- Call `supabase.auth.updateUser({ password })`
- Register route `/reset-password` in App.tsx

### 6. `src/hooks/useProfile.ts` — Fetch/update from Supabase
- Fetch profile from `profiles` table using auth user ID
- `updateProfile` calls `supabase.from('profiles').update(...)`
- Handle match_photo_url upload via storage bucket

### 7. `src/pages/Profile.tsx` — Real photo upload
- "Trocar Foto de Match" uploads to storage, updates `match_photo_url` in profiles
- "Salvar Preferências" writes habits JSON, course, campus, etc. to profiles table

### 8. `src/hooks/useMatches.ts` — Supabase connections
- Fetch all profiles (excluding self) as potential matches
- Calculate compatibility client-side from habits JSON
- `connect()` inserts row into `connections` table with status `pending`
- Fetch pending/connected from `connections` table
- Listen for realtime changes on connections table for instant status updates

### 9. `src/pages/Messages.tsx` — Supabase Realtime chat
- Fetch accepted connections as contact list (join profiles for names/avatars)
- Fetch messages for selected connection from `messages` table
- Send message inserts into `messages` table
- Subscribe to realtime `postgres_changes` on messages table for instant delivery
- Unsubscribe on cleanup

### 10. `src/components/PropertyWizard.tsx` — Insert into properties
- `handlePublish` uploads photos to storage bucket, gets URLs
- Inserts row into `properties` table with `owner_id = auth.uid()`, `validation_status = 'pending_docs'`
- Loading state on publish button

### 11. `src/hooks/useProperties.ts` — Fetch from Supabase
- Replace mock data with `supabase.from('properties').select('*')`
- Apply filters via Supabase query or client-side
- Keep loading states

### 12. `src/pages/PropertyDetails.tsx` — Fetch single property
- Fetch by ID from `properties` table instead of mockProperties

### 13. `src/pages/HostDashboard.tsx` — Fetch owner's properties
- Query `properties` where `owner_id = auth.uid()`
- Display real status badges from `validation_status`

### 14. `src/pages/Dashboard.tsx` — Use real data
- Replace mock profile/matches/properties with real hooks

### 15. `src/components/AppLayout.tsx` — Real avatar
- UserMenu fetches `avatar_url` from profile in AuthContext

### 16. `src/App.tsx` — Add reset-password route
- Add `/reset-password` → `ResetPassword`

---

## Observações Técnicas

- O arquivo `types.ts` do Supabase não reflete as tabelas atuais (está vazio). Usaremos tipagem manual com `.from('table').select()` e type assertions até o próximo sync.
- Dados mockados (`mockData.ts`, `mockMessages.ts`) serão mantidos como fallback mas não importados pelos hooks.
- Realtime do Supabase requer que a publicação `supabase_realtime` inclua a tabela `messages`.
- Storage bucket `property-images` precisa ser criado com policy pública de leitura.

