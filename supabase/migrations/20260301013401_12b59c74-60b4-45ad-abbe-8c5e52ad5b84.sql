
-- Fix all RESTRICTIVE policies to be PERMISSIVE

-- profiles
DROP POLICY IF EXISTS "Perfis são visíveis publicamente" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar o próprio perfil" ON profiles;

CREATE POLICY "Perfis são visíveis publicamente" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Usuários podem atualizar o próprio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);

-- connections
DROP POLICY IF EXISTS "Users see own connections" ON connections;
DROP POLICY IF EXISTS "Users can request connections" ON connections;
DROP POLICY IF EXISTS "Receiver can update connection" ON connections;

CREATE POLICY "Users see own connections" ON connections FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can request connections" ON connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Receiver can update connection" ON connections FOR UPDATE USING (auth.uid() = receiver_id);

-- messages
DROP POLICY IF EXISTS "Users see messages in own connections" ON messages;
DROP POLICY IF EXISTS "Users can send messages in accepted connections" ON messages;

CREATE POLICY "Users see messages in own connections" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM connections c WHERE c.id = messages.connection_id AND (c.requester_id = auth.uid() OR c.receiver_id = auth.uid()) AND c.status = 'accepted')
);
CREATE POLICY "Users can send messages in accepted connections" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM connections c WHERE c.id = messages.connection_id AND (c.requester_id = auth.uid() OR c.receiver_id = auth.uid()) AND c.status = 'accepted')
);

-- properties
DROP POLICY IF EXISTS "Anyone can view properties" ON properties;
DROP POLICY IF EXISTS "Owners can insert properties" ON properties;
DROP POLICY IF EXISTS "Owners can update own properties" ON properties;

CREATE POLICY "Anyone can view properties" ON properties FOR SELECT USING (true);
CREATE POLICY "Owners can insert properties" ON properties FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update own properties" ON properties FOR UPDATE USING (auth.uid() = owner_id);

-- Create trigger for auto-creating profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Storage RLS for property-images bucket
CREATE POLICY "Anyone can view property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own property images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
