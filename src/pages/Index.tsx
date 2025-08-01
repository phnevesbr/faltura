/**
 * Faltula - Sistema de Gestão Acadêmica
 * Desenvolvido Por PHNevs
 * Instagram: https://www.instagram.com/phnevs/
 * 
 * Página principal (Index) que renderiza:
 * - Aviso de verificação de email (se necessário)
 * - Dashboard principal baseado no tipo de usuário
 */

import React from 'react';
import Dashboard from '../components/Dashboard';
import EmailVerificationWarning from '../components/EmailVerificationWarning';

const Index = () => {
  return (
    <>
      <EmailVerificationWarning />
      <Dashboard />
    </>
  );
};

export default Index;