

# Fix: Password Recovery Redirects to Dashboard

## Problem

When Supabase sends a PASSWORD_RECOVERY event, the auth listener treats it as a normal login (sets session), so the user lands on `/dashboard` instead of a password update form.

## Changes

### 1. Create `src/pages/UpdatePassword.tsx`
- New page at `/update-password` with "Nova Senha" and "Confirmar Nova Senha" fields
- Reuse `getPasswordErrors` / `isPasswordStrong` from `src/lib/passwordValidation.ts`
- Show/hide password toggles (same pattern as `ResetPassword.tsx`)
- Submit calls `supabase.auth.updateUser({ password })`, then signs out and redirects to `/login` with a success toast
- Same visual style as existing auth pages (Card, logo, gradient background)

### 2. Update `src/contexts/AuthContext.tsx`
- In `onAuthStateChange`, check if `_event === 'PASSWORD_RECOVERY'`
- When detected, still set the session (needed for `updateUser` to work), but set a flag (e.g. `isPasswordRecovery`) to `true`
- Export `isPasswordRecovery` from the context so routes can use it

### 3. Update `src/App.tsx`
- Add route `<Route path="/update-password" element={<UpdatePassword />} />`
- Create a wrapper component (or modify `RootRedirect` / `AppLayout`) that checks `isPasswordRecovery` from auth context — if `true`, redirect to `/update-password`
- Add a `PasswordRecoveryGuard` inside the `AppLayout` route that intercepts authenticated users with the recovery flag before they reach `/dashboard`

### Files

| File | Change |
|------|--------|
| `src/pages/UpdatePassword.tsx` | New page — password update form with strong validation |
| `src/contexts/AuthContext.tsx` | Detect `PASSWORD_RECOVERY` event, expose flag |
| `src/App.tsx` | Add `/update-password` route + guard to intercept recovery users |

