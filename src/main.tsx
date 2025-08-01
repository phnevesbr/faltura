/**
 * Faltula - Sistema de Gestão Acadêmica
 * Desenvolvido Por PHNevs
 * Instagram: https://www.instagram.com/phnevs/
 * 
 * Arquivo principal de inicialização da aplicação React.
 * Configura o root do DOM e renderiza a aplicação em modo estrito.
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
