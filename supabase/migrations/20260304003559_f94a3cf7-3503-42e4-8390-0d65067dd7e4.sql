
-- Drop the overly permissive public SELECT policy
DROP POLICY "Perfis são visíveis publicamente" ON profiles;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT TO authenticated
  USING (true);
