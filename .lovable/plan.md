

# Sprint 1: Auth e Layout — Fundação Universal

## O que muda

Adicionar telas de autenticação (Login, Cadastro, Recuperação de Senha) com estado mockado, e refatorar o header/navbar para incluir avatar com dropdown e botão CTA "Anunciar Imóvel / Vaga".

## Arquivos novos

### 1. `src/contexts/AuthContext.tsx`
- Context com `isLoggedIn`, `user` (mockCurrentUser), `login()`, `logout()`, `register()`
- Estado local via `useState`, sem backend
- Provider wrapping the app

### 2. `src/pages/Login.tsx`
- Formulário limpo: E-mail + Senha
- Botão "Entrar" (chama `login()` do context, navega para `/dashboard`)
- Link "Criar conta" → `/register`
- Link "Esqueci minha senha" → `/forgot-password`
- Logo Uhome no topo, fundo com gradiente roxo sutil

### 3. `src/pages/Register.tsx`
- Formulário: Nome, E-mail, Senha
- Sem seleção de tipo de usuário (conta única universal)
- Botão "Criar Conta" → chama `register()`, navega para `/onboarding`
- Link "Já tenho conta" → `/login`

### 4. `src/pages/ForgotPassword.tsx`
- Campo E-mail + botão "Enviar link de recuperação"
- Toast de sucesso simulado
- Link "Voltar ao login"

## Arquivos modificados

### 5. `src/components/AppLayout.tsx` — Refatorar header
- Header: lado esquerdo = logo + sidebar trigger
- Header lado direito:
  - Se logado: botão CTA roxo "Anunciar Imóvel / Vaga" (com ícone `Plus`) + Avatar do usuário
  - Avatar clicável abre `DropdownMenu` com: "Meu Perfil" (→ `/profile`), "Mensagens" (toast placeholder), "Sair" (chama `logout()`, navega `/login`)
- Mobile: CTA aparece como ícone compacto no header; dropdown igual

### 6. `src/App.tsx` — Rotas
- Adicionar rotas `/login`, `/register`, `/forgot-password`
- Wrap com `AuthProvider`
- Rota `/` redireciona para `/login` se não logado, `/dashboard` se logado

## Fluxo de navegação
```text
/login ──→ /dashboard (após login)
/register ──→ /onboarding (após cadastro)
/forgot-password ──→ /login (após enviar)
Header avatar dropdown "Sair" ──→ /login
```

## Detalhes técnicos
- Formulários usam `useState` local, validação básica inline
- Sem integração Supabase — tudo mockado
- Design mobile-first com cards centralizados nas telas de auth
- Paleta roxa vibrante nos botões primários e gradientes sutis nos fundos

