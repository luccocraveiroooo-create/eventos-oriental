# EVENTOS ORIENTAL - Painel de Chaveamento para GM (Perfect World Oriental)

## 📌 Visão Geral do Projeto
Aplicação Web completa voltada para Game Masters (GMs) de eventos do servidor **Perfect World Oriental**. O sistema gerencia torneios PvP 1v1, GvG e eventos competitivos, sorteia chaveamentos e exibe o bracket interativo estilo e-sports.

## 🔐 Credenciais Administrativas de GM
- **Login:** `admin`
- **Senha:** `Oriental@2026Admin`

## 🛠️ Tecnologias Utilizadas
- **HTML5 & CSS3 moderno** (com Tailwind CSS e paleta temática do Oriental PW: tons escuros, azul ciano místico `#00d2ff`, dourado e cinza metálico).
- **JavaScript Vanilla modular (`app.js`)**: Lógica do bracket, avanço automático de fase, persistência no `localStorage`.
- **Lucide Icons**: Ícones minimalistas gamers.
- **html2canvas**: Exportação do chaveamento em alta resolução (.PNG) para envio no Discord / WhatsApp.
- **Canvas-Confetti**: Efeito comemorativo ao coroar o Grande Campeão.

## 🎮 Funcionalidades Principais
1. **Modo Visitante / Jogador:** Acesso público em tempo real para acompanhar as lutas e o chaveamento sem permissão de edição.
2. **Painel de Controle do GM:**
   - Botão para criar novo torneio com qualquer quantidade de participantes.
   - Sorteio automático (modo embaralhar) ou manutenção de seeds manuais.
   - Suporte inteligente a preliminares (Fase 1) para potências não exatas (ex: 10 players com layout idêntico ao clássico do print).
   - Clique direto no lutador para declarar vitória imediata.
   - Modal com placares e opção de reset recursivo da chave.
   - Exportação em imagem PNG com data, logo e título do evento.
   - Modo Tela Cheia para transmissão ao vivo / stream.

## 📁 Estrutura de Arquivos
- `index.html`: Interface principal do bracket e modais administrativos.
- `app.js`: Mecanismo do chaveamento, autenticação e regras de avanço.
- `assets/logo.jpg`: Logo oficial do Oriental Perfect World.
- `GEMINI.md`: Este arquivo com o histórico, contexto e regras do projeto.
