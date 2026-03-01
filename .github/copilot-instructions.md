# UHOME - Diretrizes de Desenvolvimento para o GitHub Copilot

## 1. Contexto do Projeto
O projeto é o **UHOME**, um marketplace de moradia estudantil focado nos alunos da UFU (Universidade Federal de Uberlândia). O diferencial do UHOME é eliminar a burocracia (zero fiador) e atuar como uma rede de conexões (match de perfis) para a formação de repúblicas baseada em compatibilidade de hábitos.
O sistema possui um fluxo de "Conta Única": usuários podem atuar como inquilinos ou anfitriões (proprietários) na mesma conta.

## 2. Stack Tecnológica
- **Front-end:** React (Vite), TypeScript, Tailwind CSS.
- **Ícones:** `lucide-react`.
- **Roteamento:** React Router DOM.
- **Back-end/BaaS:** Supabase (Auth, PostgreSQL Database, Storage, Realtime).

## 3. Padrões de Código e UI/UX
- **Tipagem Forte:** Use TypeScript rigorosamente. Crie interfaces/types para todos os componentes e respostas do Supabase. Evite usar `any`.
- **Estilização:** Use Tailwind CSS. O design é estritamente **Mobile-First**. A paleta de cores principal é focada em tons de roxo vibrante, com botões e textos em alto contraste (branco/cinza).
- **Componentização:** Mantenha os componentes pequenos e modulares. Separe a lógica de negócio (Hooks customizados) da interface (Componentes visuais).
- **Sem Dados Mockados:** Não gere arrays estáticos ou dados mockados a menos que explicitamente solicitado. Assuma que os dados vêm do Supabase.

## 4. Regras Críticas de Integração com Supabase
- **Tratamento de Erros:** TODA chamada ao Supabase (`.select()`, `.insert()`, `.update()`, `.delete()`) deve ser envolvida em um bloco `try/catch`. Erros devem ser exibidos ao usuário através de componentes visuais (ex: `toast.error`). Nunca deixe falhas silenciosas.
- **Estados de Loading:** Botões de ação (Salvar, Enviar, Conectar) devem possuir estado de carregamento (`disabled={loading}`) para evitar cliques duplos durante chamadas ao banco.
- **Criação de Perfil (Trigger Automático):** Quando um usuário é criado no Supabase Auth, um *Database Trigger* insere automaticamente uma linha vazia na tabela `profiles`. Portanto, na tela de Onboarding/Configuração de Perfil, **use SEMPRE `.update()`** baseado no `auth.uid()`, e nunca `.insert()`.
- **Buckets de Storage:** Fotos de imóveis e fotos de perfil vão para o bucket público chamado `property-images`.

## 5. Estrutura do Banco de Dados (Schema)
Assuma a seguinte estrutura de banco de dados do PostgreSQL ao escrever queries e tipos:

### Tabela `profiles` (Vinculada ao auth.users)
- `id` (uuid, primary key)
- `full_name` (text)
- `avatar_url` (text)
- `match_photo_url` (text)
- `role` (text, default 'user')
- `course` (text)
- `campus` (text)
- `semester` (integer)
- `bio` (text)
- `habits` (jsonb)
- `search_type` (text)
- `price_range_min` (integer)
- `price_range_max` (integer)

### Tabela `properties` (Imóveis)
- `id` (uuid, primary key)
- `owner_id` (uuid, fk -> profiles.id)
- `title` (text)
- `description` (text)
- `price` (numeric)
- `validation_status` (text - 'pending_docs', 'approved', 'rejected')
- `images` (text array)
- `campus` (text)
- `address` (text)
- `rooms` (integer)
- `bathrooms` (integer)
- `no_fiador` (boolean)
- `verified` (boolean)
- `amenities` (text array)
- `accepts_pet` (boolean)

### Tabela `connections` (Match de Estudantes)
- `id` (uuid, primary key)
- `requester_id` (uuid, fk -> profiles.id)
- `receiver_id` (uuid, fk -> profiles.id)
- `status` (text - 'pending', 'accepted', 'rejected')

### Tabela `messages` (Chat Realtime)
- `id` (uuid, primary key)
- `connection_id` (uuid, fk -> connections.id)
- `sender_id` (uuid, fk -> profiles.id)
- `content` (text)
- `created_at` (timestamptz)

## 6. Segurança RLS (Row Level Security)
As tabelas possuem políticas RLS ativas para o grupo `authenticated`. 
- Operações de `UPDATE` e `INSERT` em `profiles` e `properties` validam se o `auth.uid()` corresponde ao proprietário do registro.
- A leitura (`SELECT`) em `messages` é restrita apenas aos usuários que possuem uma conexão aceita na tabela `connections`.