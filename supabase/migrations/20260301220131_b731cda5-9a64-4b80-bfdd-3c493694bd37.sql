-- Fix profiles policies to PERMISSIVE
DROP POLICY IF EXISTS "Usuários podem atualizar o próprio perfil" ON profiles;
CREATE POLICY "Usuários podem atualizar o próprio perfil" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Perfis são visíveis publicamente" ON profiles;
CREATE POLICY "Perfis são visíveis publicamente" ON profiles FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Fix connections policies to PERMISSIVE
DROP POLICY IF EXISTS "Users see own connections" ON connections;
CREATE POLICY "Users see own connections" ON connections FOR SELECT TO authenticated USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can request connections" ON connections;
CREATE POLICY "Users can request connections" ON connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Receiver can update connection" ON connections;
CREATE POLICY "Receiver can update connection" ON connections FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- Fix messages policies to PERMISSIVE
DROP POLICY IF EXISTS "Users see messages in own connections" ON messages;
CREATE POLICY "Users see messages in own connections" ON messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM connections c WHERE c.id = messages.connection_id AND (c.requester_id = auth.uid() OR c.receiver_id = auth.uid()) AND c.status = 'accepted'));

DROP POLICY IF EXISTS "Users can send messages in accepted connections" ON messages;
CREATE POLICY "Users can send messages in accepted connections" ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM connections c WHERE c.id = messages.connection_id AND (c.requester_id = auth.uid() OR c.receiver_id = auth.uid()) AND c.status = 'accepted'));

-- Fix properties policies to PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view properties" ON properties;
CREATE POLICY "Anyone can view properties" ON properties FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can insert properties" ON properties;
CREATE POLICY "Owners can insert properties" ON properties FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update own properties" ON properties;
CREATE POLICY "Owners can update own properties" ON properties FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);