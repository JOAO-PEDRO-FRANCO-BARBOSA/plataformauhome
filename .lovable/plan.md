

# Sprint 4: Funil do Anfitrião — Cadastro de Imóveis

## O que muda

Criar formulário multi-step para anunciar imóveis, componente drag-and-drop para fotos, e dashboard "Meus Anúncios" com status visuais.

## Arquivos novos

### 1. `src/components/PropertyWizard.tsx`
- Formulário 4 etapas com barra de progresso (`Progress` component)
- **Etapa 1 — Localização**: Endereço (input), Campus (select com 4 opções UFU)
- **Etapa 2 — Características**: Quartos, Banheiros (number inputs), Comodidades (checkbox grid: Wi-Fi, Garagem, Mobiliado, Lavanderia, Academia, Portaria 24h, Área gourmet, Quintal)
- **Etapa 3 — Fotos**: `DragDropZone` para arrastar imagens (simulado com `URL.createObjectURL`)
- **Etapa 4 — Documentação**: Upload de PDF/foto do contrato (mesmo DragDropZone), toggles "Sem Fiador" e "Verificado", preço (input)
- Botões Voltar/Avançar, último passo "Publicar" → loading 2s → tela de sucesso com confetti visual e botão "Ver Meus Anúncios"
- Abre como Dialog/page acessível pelo CTA "Anunciar Imóvel / Vaga" no header

### 2. `src/components/DragDropZone.tsx`
- Área com borda tracejada, ícone Upload, texto "Arraste arquivos ou clique para selecionar"
- Aceita drag-and-drop (`onDragOver`, `onDrop`) e click (`input[type=file]` hidden)
- Preview de thumbnails dos arquivos selecionados com botão remover
- Props: `accept` (image/* ou .pdf), `multiple`, `maxFiles`, `onFilesChange`

### 3. `src/pages/HostDashboard.tsx`
- Lista "Meus Anúncios" com 2-3 imóveis mockados do usuário
- Cada card: imagem thumbnail, título, preço, badge de status ("Em Análise" amarelo, "Ativo" verde, "Pausado" cinza)
- Contador simulado de "Interessados" por imóvel
- Botão "Novo Anúncio" no topo → abre PropertyWizard

## Arquivos modificados

### 4. `src/components/AppLayout.tsx`
- CTA "Anunciar Imóvel / Vaga" agora navega para `/host` ou abre o wizard

### 5. `src/App.tsx`
- Adicionar rota `/host` → `HostDashboard`
- Adicionar rota `/host/new` → página com `PropertyWizard`

