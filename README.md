# Faltura - Controle De Faltas 🚀

![Faltura Screenshot](https://i.postimg.cc/DwcYRDtj/wmremove-transformed.png) <!-- TIRE UM PRINT BONITO OU FAÇA UM GIF! -->

**Live Demo:** [Clique aqui](https://faltura.vercel.app/) 

## 📝 Sobre o Projeto

Faltula é uma plataforma web moderna, intuitiva e responsiva desenvolvida para ajudar alunos a organizarem suas aulas e controlarem suas faltas de forma automática, visual e eficiente. Simplifique sua vida acadêmica e nunca mais perca o controle do seu limite de faltas.

## ✨ Features Principais

*   **Autenticação de Usuários:** Sistema seguro de registro e login, com persistência de sessão utilizando o armazenamento local do navegador (localStorage).
*   **Gerenciamento de Matérias:** Adicione, edite e remova suas matérias, especificando a carga horária semanal e definindo limites personalizados de faltas para cada uma.
*   **Grade Horária Semanal:** Monte sua grade de aulas de forma visual e intuitiva, alocando matérias em dias e horários específicos.
*   **Controle de Faltas Automatizado:** Registre suas faltas por data, e o sistema automaticamente calculará e atribuirá essas faltas às matérias que você teria naquele dia.
*   **Alertas de Risco:** Receba notificações claras e visuais quando suas faltas se aproximarem (75%, 90%) ou atingirem (100%) o limite permitido, ajudando a evitar reprovações por frequência.
*   **Dashboard Inteligente:** Tenha uma visão geral rápida do número de matérias, matérias em risco e informações do seu curso.
*   **Persistência de Dados Local:** Todos os seus dados (usuário, matérias, grade e histórico de faltas) são salvos de forma segura diretamente no seu navegador, garantindo acesso rápido e offline.
*   **Interface Responsiva:** Design moderno e totalmente adaptado para proporcionar uma excelente experiência em desktops, tablets e smartphones.

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
