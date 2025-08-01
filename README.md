# Faltura - Controle De Faltas 🚀

![Faltura Screenshot](https://i.postimg.cc/DwcYRDtj/wmremove-transformed.png) <!-- TIRE UM PRINT BONITO OU FAÇA UM GIF! -->

**Live Demo:** [Clique aqui](https://faltura.vercel.app/) 

## 📝 Sobre o Projeto

Faltura é uma plataforma web moderna, gamificada e colaborativa para o gerenciamento de faltas, organização acadêmica e integração entre estudantes. Com foco em usabilidade, produtividade e motivação, o sistema oferece alertas automáticos, gamificação, estatísticas e ferramentas colaborativas, tudo isso com suporte ao uso offline via PWA.

## ✨ Features Principais

*   **🔐 Autenticação & Dados**
    *   Autenticação via Supabase com verificação obrigatória por e-mail
    *   Sistema completo de permissões com papéis distintos (admin, moderador, usuário)
    *   Banimento de usuários e logs de auditoria
    *   Rate limiting para prevenir abusos (login, registro, spam)
    *   Segurança com PostgreSQL RLS (Row Level Security)
    *   Auditoria em tempo real das ações administrativas

*   **📚 Gestão Acadêmica**
    *   Matérias com carga horária e cor personalizável
    *   Grade horária visual interativa
    *   Registro automatizado de faltas por data e hora
    *   Alertas em 75%, 90% e 100% do limite
    *   Histórico completo de semestres
    *   Importação/exportação de dados com segurança
 
*   **👥 Turmas & Comunidade**
    *   Criação e gerenciamento de turmas
    *   Convite de membros por email
    *   Líderes com permissões especiais
    *   Notificações automáticas de faltas entre os membros
    *   Compartilhamento de evidências (texto/imagem)
    *   Limite configurável de turmas por usuário

*   **🏆 Gamificação**
    *   Sistema de níveis com XP (50+ ações que geram experiência)
    *   Tiers de usuários: Calouro, Veterano, Expert, Lenda
    *   Achievements divididos em: Integração, Consistência e Segredo
    *   4 raridades: Common, Rare, Epic, Legendary
    *   Leaderboard global com ranking ao vivo

*   **📝 Sistema de Tarefas e Notas**
    *   Criação de tarefas com checklist
    *   Priorização e categorização
    *   Integração com o sistema de XP
    *   Notificações e lembretes para pendências

*   **📊 Estatísticas & Relatórios**
    *   Gráficos dinâmicos de frequência e desempenho
    *   Tendências semanais/mensais
    *   Relatórios de uso por usuário e turma
    *   Análise de comportamento e engajamento

*   **🛠️ Painel Administrativo**
    *   Analytics em tempo real
    *   Gerenciamento completo de usuários, turmas e conteúdos
    *   Logs detalhados de ações (auditoria)
    *   Permissões granularizadas
    *   Ajustes de sistema direto no painel
    *   Monitoramento de crescimento e retenção

*   **🎨 Interface e UX**
    *   Design mobile-first otimizado para qualquer tela
    *   Temas claro e escuro personalizáveis
    *   Animações fluidas e responsivas
    *   Suporte a gestos mobile
    *   Aplicativo PWA com funcionalidade offline

## 🧠 Tecnologias Utilizadas

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

*   **Backend** 
    *   Supabase (Auth, PostgreSQL, RLS, Realtime, Storage, Edge Functions)
    *   PostgreSQL com segurança por linha (Row Level Security)
    *   Edge Functions para lógica customizada
    *   Realtime Subscriptions para sincronização ao vivo
    *   Rate Limiting embutido

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
*   **Row Level Security (RLS):** Proteção por nível de linha de dados no PostgreSQL, garantindo que cada usuário só acesse seus próprios dados
*   **Rate Limiting Inteligente:** Proteção contra spam e ataques com limites configuráveis por ação (login, signup, etc.)
*   **Sistema de Banimento:** Moderação de usuários com logs de auditoria completos
*   **Autenticação JWT:** Tokens seguros com refresh automático via Supabase Auth
