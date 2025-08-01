import React from 'react';
import { Card, CardContent } from '../ui/card';
import { AlertTriangle } from 'lucide-react';

const AbsenceInstructions: React.FC = () => {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <h4 className="font-semibold text-blue-900 mb-1">Como funciona o registro de faltas:</h4>
            <ul className="text-blue-800 space-y-1 list-disc list-inside">
              <li>Selecione o dia em que você faltou às aulas</li>
              <li>Escolha especificamente quais aulas você perdeu</li>
              <li>Cada aula selecionada será contada como uma falta individual</li>
              <li>Você pode selecionar todas as aulas do dia ou apenas algumas</li>
              <li>Alertas são exibidos quando você atinge 75% e 90% do limite de faltas</li>
              <li>Ao atingir 100% do limite, você é considerado reprovado por falta</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AbsenceInstructions;