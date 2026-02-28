# Sprint 3: Conexão Social — Matches e Chat

## O que muda

Adicionar página de Mensagens com chat mockado, melhorar o perfil com aba de "Foto para Match" e hábitos toggle, e refinar o feed de matches com botão "Pedir Conexão" com estado pendente.

## Arquivos novos

### 1. `src/pages/Messages.tsx`

- Layout duas colunas (desktop): lista de contatos à esquerda, janela de chat à direita
- Mobile: lista de contatos full-width, ao clicar abre o chat (estado interno `selectedContact`)
- Contatos = conexões aceitas do `useMatches()` hook
- Mensagens mockadas por contato (array local de `{ sender: 'me' | 'them', text, time }`)
- Input de mensagem com botão enviar (adiciona ao estado local)
- Bolhas de chat estilizadas (roxo para "me", cinza para "them")
- Botão voltar no mobile para retornar à lista

### 2. `src/data/mockMessages.ts`

- Map de `studentId → Message[]` com 3-5 mensagens mockadas por conversa
- Temas: dividir aluguel, hábitos, visitar imóvel

## Arquivos modificados

### 3. `src/pages/Profile.tsx` — Adicionar aba "Foto para Match"

- Usar `Tabs` component com duas abas: "Dados Pessoais" (conteúdo atual) e "Foto para Match"
- Aba "Foto para Match": área de upload visual (simulado, mostra avatar atual com botão trocar)
- Manter hábitos toggles e preview de badges como estão

### 4. `src/pages/MatchPage.tsx` — Refinar com "Pedir Conexão"

- Ao clicar, status muda para "pending" com texto "Pendente" e botão desabilitado
- Adicionar estado `pending` ao hook `useMatches`
- Na lista de conexões, adicionar botão "Mensagem" que navega para `/messages`

### 5. `src/hooks/useMatches.ts` — Adicionar status "pending"

- `connect()` agora seta status `'pending'` primeiro
- Novo método `acceptConnection()` seta `'connected'`
- Auto-aceitar após 1.5s (simulação) para demo

### 6. `src/components/AppLayout.tsx` — Adicionar "Mensagens" à navegação

- Adicionar item `{ title: 'Mensagens', url: '/messages', icon: MessageSquare }` ao `navItems`
- Atualizar dropdown do UserMenu: "Mensagens" navega para `/messages` ao invés de toast

### 7. `src/App.tsx` — Nova rota

- Adicionar `/messages` → `Messages`