# Faltura - Controle De Faltas 🚀

![Faltura Screenshot](https://i.postimg.cc/DwcYRDtj/wmremove-transformed.png) <!-- TIRE UM PRINT BONITO OU FAÇA UM GIF! -->

**Live Demo:** [Clique aqui](https://faltura.vercel.app/) 

## 📝 Sobre o Projeto

Faltula é uma plataforma web moderna, intuitiva e responsiva desenvolvida para ajudar alunos a organizarem suas aulas e controlarem suas faltas de forma automática, visual e eficiente. Simplifique sua vida acadêmica e nunca mais perca o controle do seu limite de faltas.

## ✨ Features Principais

** 🔐 Autenticação & Dados
*   **Autenticação de Usuários:** Sistema seguro de registro e login, com persistência de sessão utilizando o armazenamento local do navegador (localStorage).
*   **Login Seguro:** Registro e autenticação com persistência de sessão via localStorage.
*   **Persistência Híbrida:** Todos os dados são armazenados localmente no navegador e sincronizados com o Supabase, permitindo uso offline e online.

** 📚 Organização Acadêmica
*   **Gerenciamento de Matérias:** Adicione, edite e remova matérias, configurando carga horária semanal e limite de faltas individual.
*   **Grade Horária Interativa:** Monte sua grade semanal de aulas visualmente, alocando matérias por dia e horário.
*   **Controle Automatizado de Faltas:** Registre faltas por data e o sistema calcula automaticamente quais matérias foram impactadas.
*   **Alertas de Risco:** Notificações visuais ao atingir 75%, 90% ou 100% das faltas permitidas.

** 📊 Dashboard & Visualização
*   **Painel Inteligente:** Visão geral do seu desempenho, matérias em risco e progresso geral.
*   **Gestão de Tarefas:** Crie e gerencie tarefas com checklist, prioridade e status de conclusão.

** 🎮 Gamificação & Comunidade
*   **Sistema de XP e Níveis:** Ganhe experiência ao interagir com a plataforma e suba de nível.
*   **Conquistas (Achievements):** Desbloqueie badges com diferentes raridades.
*   **Leaderboard Global:** Ranking com sistema de tiers para promover engajamento.
*   **Classes/Turmas:** Participe de turmas colaborativas com visão compartilhada.

** 🛠️ Administração & Segurança
*   **Painel Administrativo Completo:** Controle de usuários, matérias, turmas e atividades da plataforma.
*   **Rate Limiting:** Bloqueio automático de ações abusivas ou spam.
*   **Sistema de Banimento:** Ferramentas de moderação de usuários.
*   **Logs de Auditoria:** Histórico completo de ações administrativas para transparência.

** 📱 Interface & Personalização
*   **Design Responsivo:** Interface moderna, adaptada para desktops, tablets e smartphones (mobile-first).
*   **Temas Customizáveis:** Escolha ou crie temas visuais para personalizar sua experiência.

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** 
    *   React (para a construção da interface do usuário)
    *   TypeScript (para tipagem estática e maior robustez do código)
    *   Tailwind CSS (para estilização rápida e responsiva)
    *   Shadcn/ui (biblioteca de componentes UI acessíveis e personalizáveis)
    *   TanStack Query (para gerenciamento de estado assíncrono e cache)
    *   React Router DOM (para navegação e roteamento no SPA)
    *   React Hook Form (para validação e gerenciamento de formulários)
    *   Lucide React (para ícones vetoriais)
    *   Sonner (para notificações toast amigáveis)
    *   date-fns (para manipulação de datas)
    *   Supabase (PostgreSQL, Auth, Real-time)
*   **Build Tool:** 
    *   Vite (servidor de desenvolvimento rápido e otimizador de build)
*   **Outras Ferramentas:** 
    *   ESLint (para garantir a qualidade do código)
    *   lovable-tagger (plugin Vite para desenvolvimento)

## 🛡️ Destaques Técnicos e de Segurança

*   **Arquitetura Frontend-Centric:** O projeto é totalmente construído no frontend, utilizando localStorage para persistência de dados. Isso permite carregamento instantâneo e funcionalidade offline dentro do navegador.
*   **Código Modular e Reutilizável:** Com a organização de componentes (especialmente shadcn/ui) e hooks customizados, o código é fácil de manter e expandir.
*   **Segurança e Consistência com TypeScript:** O uso do TypeScript em todo o projeto garante tipagem forte, reduzindo erros em tempo de desenvolvimento e melhorando a manutenibilidade.
*   **Experiência de Desenvolvimento Otimizada:** Vite proporciona um ambiente de desenvolvimento ágil com Hot Module Replacement (HMR) e uma build otimizada para produção.
*   **Design Responsivo Avançado:** O Tailwind CSS permite um controle granular sobre o estilo, garantindo que a interface se adapte perfeitamente a qualquer tamanho de tela, com otimizações mobile-first.
