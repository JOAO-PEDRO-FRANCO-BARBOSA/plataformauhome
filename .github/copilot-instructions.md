# UHOME - Diretrizes de Desenvolvimento para o GitHub Copilot

## 1. Contexto do Projeto
O projeto é o **UHOME**, um marketplace de moradia estudantil focado nos alunos da UFU (Universidade Federal de Uberlândia). O diferencial do UHOME é eliminar a burocracia (zero fiador) e atuar como uma rede de conexões (match de perfis) para a formação de repúblicas baseada em compatibilidade de hábitos.
O sistema possui um fluxo de "Conta Única": usuários podem atuar como inquilinos ou anfitriões (proprietários) na mesma conta.

## 2. Stack Tecnológica
- **Front-end:** React (Vite), TypeScript, Tailwind CSS.
- **UI Components:** shadcn/ui (use os componentes de `src/components/ui/` sempre que possível).
- **Ícones:** `lucide-react`.
- **Roteamento:** React Router DOM.
- **Back-end/BaaS:** Supabase (Auth, PostgreSQL Database, Storage, Realtime).

## 3. Padrões de Código e UI/UX
- **Tipagem Forte:** Use TypeScript rigorosamente baseando-se no arquivo `src/integrations/supabase/types.ts`. Evite usar `any`.
- **Estilização:** Use Tailwind CSS. O design é estritamente **Mobile-First**. A paleta de cores principal é focada em tons de roxo vibrante, com botões e textos em alto contraste.
- **Componentização:** Mantenha os componentes modulares. Separe a lógica de negócio (Hooks customizados na pasta `src/hooks/`) da interface (Componentes visuais).
- **Sem Dados Mockados:** Não gere arrays estáticos a menos que explicitamente solicitado. Assuma que os dados vêm do Supabase.

## 4. Regras Críticas de Integração com Supabase
- **Tratamento de Erros:** TODA chamada ao Supabase (`.select()`, `.insert()`, `.update()`) deve ser envolvida em `try/catch`. Erros devem ser exibidos ao usuário através de `toast` do shadcn/ui. Nunca deixe falhas silenciosas.
- **Estados de Loading:** Botões de ação devem possuir estado de carregamento (`disabled={loading}`) para evitar duplos cliques.
- **Criação de Perfil:** Quando um usuário é criado no Supabase Auth, um *Database Trigger* insere automaticamente uma linha vazia na tabela `profiles`. Na tela de Onboarding, **use SEMPRE `.update()`** baseado no `auth.uid()`, e nunca `.insert()`.
- **Buckets de Storage:** Fotos de imóveis e fotos de perfil vão para o bucket público `property-images`.

## 5. Estrutura do Banco de Dados (Schema)
O Schema abaixo reflete as tipagens exatas do banco. Baseie-se nele para queries e interfaces:

### Tabela `profiles` (Vinculada ao auth.users)
- `id` (uuid, primary key)
- `full_name` (text), `avatar_url` (text), `match_photo_url` (text)
- `age` (number), `bio` (text), `habits` (jsonb)
- `role` (text, default 'user')
- `is_lister` (boolean) -- Identifica se o usuário já anunciou imóveis
- `course` (text), `campus` (text), `semester` (number), `college_period` (text)
- `search_type` (text), `price_range_min` (number), `price_range_max` (number)

### Tabela `properties` (Imóveis)
- `id` (uuid, primary key)
- `owner_id` (uuid, fk -> profiles.id)
- `title` (text), `description` (text), `price` (numeric)
- `property_type` (text), `location_neighborhood` (text) -- Filtros de busca
- `status` (text - ex: 'available', 'rented')
- `validation_status` (text - 'pending_docs', 'approved', 'rejected')
- `rejection_reason` (text)
- `images` (text array), `document_paths` (text array)
- `campus` (text), `address` (text)
- `rooms` (number), `bathrooms` (number)
- `no_fiador` (boolean), `verified` (boolean), `accepts_pet` (boolean)
- `amenities` (text array)
- `contact_whatsapp` (text), `contact_social` (text)
- `owner_email` (text), `owner_cpf_cnpj` (text)
- `featured_until` (text/date)

### Tabela `reservations` (Reservas/Checkout)
- `id` (uuid, primary key)
- `tenant_id` (uuid, fk -> profiles.id)
- `owner_id` (uuid, fk -> profiles.id)
- `property_id` (uuid, fk -> properties.id)
- `amount` (number)
- `status` (text)
- `stripe_checkout_id` (text)

### Tabela `favorites` (Favoritos do Usuário)
- `id` (uuid, primary key)
- `user_id` (uuid, fk -> profiles.id)
- `property_id` (uuid, fk -> properties.id)

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
- `is_edited` (boolean), `reply_to_id` (uuid, fk -> messages.id)
- `created_at` (timestamptz)

## 6. Segurança RLS (Row Level Security)
As tabelas possuem políticas RLS ativas. 
- Operações de `UPDATE` em `profiles` e `properties` validam se o `auth.uid()` corresponde ao proprietário do registro.
- A leitura em `messages` é restrita apenas aos usuários que possuem uma conexão ativa na tabela `connections`.
- Ao desenvolver para usuários Deslogados (Guests), garanta que requisições (ex: lista de propriedades públicas) estejam de acordo com as permissões de leitura (SELECT) do RLS para a role `anon`.

### ⚠️ Avisos e Boas Práticas

* **Diferença de "Type":** No comando `verifyOtp`, o `type` pode ser `'email'`, `'signup'`, `'magiclink'` ou `'recovery'`. Para o fluxo de novos anfitriões (listers), geralmente usa-se `'email'` ou `'signup'`. Se o código falhar com "invalid token", peça ao Copilot para testar trocar o `type` para `'signup'`.
* **Limitação de Testes:** Lembre-se que o Supabase limita o envio de e-mails (rate limit). Se você solicitar o código muitas vezes seguidas, ele pode parar de enviar por uma hora.
* **Persistência de Sessão:** Após o `verifyOtp` ter sucesso, o Supabase autentica automaticamente o usuário. Certifique-se de que o `AuthContext` capture essa nova sessão para que o usuário consiga salvar o imóvel no banco de dados no final do Wizard, respeitando as políticas de RLS.