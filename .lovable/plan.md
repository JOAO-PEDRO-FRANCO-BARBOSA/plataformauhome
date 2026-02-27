

# Uhome — Área Logada Completa

## Setup Inicial
- Copiar logo (`Logo_Uhome.png`) para `src/assets/`
- Definir paleta roxa vibrante no Tailwind config (CSS variables)
- Criar tipos TypeScript: `Property`, `StudentProfile`, `Match`, `HabitProfile`
- Criar `src/data/mockData.ts` com 6+ imóveis e 8+ perfis de estudantes realistas (cursos UFU, fotos placeholder, hábitos variados)

## Hooks Customizados (preparados para Supabase)
- `useProperties()` — lista, filtra imóveis com loading states
- `useMatches()` — perfis compatíveis com cálculo de % match
- `useProfile()` — dados do usuário logado
- `useFavorites()` — gerenciar favoritos

## Layout & Navegação
- **Layout compartilhado** com sidebar/bottom nav responsiva (mobile: bottom tab bar, desktop: sidebar)
- Header com logo Uhome, nome do usuário e avatar
- Footer institucional minimalista (Instagram, WhatsApp, Email, "Desenvolvido por alunos da UFU")
- React Router: `/dashboard`, `/marketplace`, `/match`, `/profile`, `/onboarding`

## Páginas

### 1. Onboarding (Step 1-2-3)
- Step 1: Foto + curso na UFU
- Step 2: Preferências de hábitos (toggles: fuma, festas, pet, organização, horário)
- Step 3: Tipo de busca (quarto/república) + campus preferido + faixa de preço
- Progress bar visual, botões Voltar/Próximo

### 2. Dashboard (`/dashboard`)
- Mensagem de boas-vindas personalizada
- Card resumo: últimos matches com % compatibilidade
- Carrossel horizontal de imóveis favoritados (Embla Carousel)
- Quick actions: "Buscar imóveis", "Encontrar colegas"

### 3. Marketplace (`/marketplace`)
- Filtros dinâmicos sem reload: Campus (Santa Mônica, Umuarama, Pontal, Glória), faixa de preço (slider), nº quartos
- Grid responsivo de cards com: foto, preço, localização, badges "Sem Fiador" (verde) e "Verificado" (roxo)
- Botão favoritar (coração) e "Tenho Interesse"
- Loading skeleton states

### 4. Match de República (`/match`)
- Interface estilo Tinder: card central com foto, nome, curso, % match, hábitos comparados visualmente
- Botões X (pular) e ❤️ (conectar) com animação de swipe
- Lista lateral/abaixo dos matches já feitos

### 5. Perfil (`/profile`)
- Avatar editável, nome, curso UFU
- Formulário de preferências de moradia (reutiliza campos do onboarding)
- Toast de feedback "Preferências atualizadas!"

## Componentes Compartilhados
- `PropertyCard` — card reutilizável de imóvel
- `MatchCard` — card de perfil estilo swipe
- `ContactModal` — modal com links WhatsApp e Instagram
- `HabitBadges` — badges visuais de hábitos
- `FilterBar` — barra de filtros do marketplace
- Toasts via Sonner para feedback visual

