import React from 'react';
import AbsenceForm from './absence/AbsenceForm';
import AbsenceList from './absence/AbsenceList';
import AbsenceInstructions from './absence/AbsenceInstructions';

const AbsenceManager: React.FC = () => {
  return (
    <div className="space-y-6">
      <AbsenceForm />
      <AbsenceList />
      <AbsenceInstructions />
    </div>
  );
};

export default AbsenceManager;