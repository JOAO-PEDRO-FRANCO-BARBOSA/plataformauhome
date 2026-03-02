

# Gestão de Imóveis e Exclusão de Conta

## Alterações

### 1. `src/pages/Profile.tsx` — Avatar upload + Exclusão de conta

**Avatar upload fix:**
- Wrap the Camera button in a `<label>` with a hidden `<input type="file">` so clicking the avatar triggers file selection
- Upload to `property-images` bucket under `{user.id}/avatar-{timestamp}`
- Call `updateProfile({ avatar_url: publicUrl })` + `refreshProfile()` to update navbar instantly

**Exclusão de conta:**
- Add a danger zone Card at the bottom with "Excluir Conta Permanentemente" button (destructive variant)
- On click, open an AlertDialog with warning text about irreversibility
- On confirm: delete profile row via edge function (RLS doesn't allow DELETE on profiles), then `supabase.auth.signOut()`, navigate to `/login`
- Loading state on the confirm button

### 2. Edge Function `delete-account` (NEW)
- Since RLS doesn't permit DELETE on profiles (and we need to also delete from `auth.users`), create an edge function
- Receives the user's JWT, verifies it, deletes from `profiles` and `properties` where `owner_id = user.id`, then deletes the auth user via admin API using `SUPABASE_SERVICE_ROLE_KEY`
- This is the secure way to handle full account deletion

### 3. Migration: Add DELETE policy for properties
- Allow owners to delete their own properties: `CREATE POLICY "Owners can delete own properties" ON properties FOR DELETE USING (auth.uid() = owner_id)`

### 4. `src/pages/MyProperties.tsx` (NEW)
- Fetch properties where `owner_id = user.id` (same as HostDashboard but with edit/delete actions)
- Each card shows: thumbnail, title, price, status badge, "Interessados" counter
- Delete button with confirmation dialog — calls `supabase.from('properties').delete().eq('id', id)`
- Edit button navigates to a future edit page (placeholder for now)
- Route: `/my-properties`

### 5. `src/components/AppLayout.tsx` — Conditional "Meus Imóveis" menu item
- In `UserMenu`, run a count query `supabase.from('properties').select('id', { count: 'exact', head: true }).eq('owner_id', user.id)` on mount
- If count > 0, show "Meus Imóveis" item in dropdown navigating to `/my-properties`

### 6. `src/App.tsx` — Add routes
- `/my-properties` → `MyProperties`

