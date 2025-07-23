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