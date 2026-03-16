

# 3 Ajustes Frontend: Senha Forte, Confirmação de E-mail, Título SEO

## Changes

### 1. `index.html` — Atualizar title e meta tags
- `<title>Uhome | Moradia Universitária</title>`
- Update `og:title` and `twitter:title` to match
- Update `og:description` and `twitter:description` to "Encontre sua moradia universitária ideal"

### 2. Shared password validation helper
Create a small utility (or inline in both components) with a regex-based validator:
```ts
const STRONG_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
```
Used in both Register and ResetPassword to:
- Show a red warning below the password input listing unmet rules
- Disable the submit button when password is invalid

### 3. `src/pages/Register.tsx` — Senha forte + fluxo de confirmação
- Replace the `password.length < 6` validation with the strong password regex
- Add real-time password strength feedback below the input (red text listing requirements not met)
- Update placeholder to "Mínimo 8 caracteres, maiúscula, número e especial"
- Disable submit button when password doesn't meet requirements OR passwords don't match
- **Confirmation flow**: Add a `success` state. After successful `register()`, instead of `navigate('/dashboard')`, set `success = true` and render a success card with a CheckCircle icon and the message: "Conta criada! Enviamos um link de confirmação para o seu e-mail. Por favor, verifique sua caixa de entrada (e o spam) para ativar sua conta antes de fazer login." with a "Ir para Login" button

### 4. `src/pages/ResetPassword.tsx` — Senha forte
- Same strong password validation as Register
- Update the `newPassword.length < 6` check to use the regex
- Add real-time password strength feedback below the input
- Update placeholder text

### Files

| File | Change |
|------|--------|
| `index.html` | Update title + OG/Twitter meta tags |
| `src/pages/Register.tsx` | Strong password validation + email confirmation success screen |
| `src/pages/ResetPassword.tsx` | Strong password validation |

