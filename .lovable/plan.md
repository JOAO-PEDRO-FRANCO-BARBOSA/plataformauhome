

# Fix Build Error + Refine Reset Password Flow

## Problem

1. **Build error**: `supabase/functions/deno.json` was not created (file not found). The `npm:stripe` import in both edge functions fails without `nodeModulesDir: "auto"`.
2. **ResetPassword.tsx** is missing a "Confirmar Senha" (confirm password) field and redirects to `/dashboard` instead of `/login` as requested.
3. Everything else (ForgotPassword, Login link, routes, AuthContext) is already fully implemented and correct.

## Changes

### 1. Create `supabase/functions/deno.json`
```json
{ "nodeModulesDir": "auto" }
```
This resolves the `npm:stripe` import error for both `create-highlight-checkout` and `stripe-webhook`.

### 2. Update `src/pages/ResetPassword.tsx`
- Add `confirmPassword` state field
- Add "Confirmar Senha" input with Lock icon
- Validate passwords match before submitting
- Change redirect from `/dashboard` to `/login` after success
- Keep existing premium UI style

### No other files need changes
- `ForgotPassword.tsx` — already complete with correct flow
- `Login.tsx` — already has "Esqueci minha senha" link
- `App.tsx` — already has `/forgot-password` and `/reset-password` routes
- `AuthContext.tsx` — already has `resetPassword` method with correct `redirectTo`

