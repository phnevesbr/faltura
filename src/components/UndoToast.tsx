/**
 * Faltula - Sistema de Gestão Acadêmica
 * Desenvolvido Por PHNevs
 * Instagram: https://www.instagram.com/phnevs/
 * 
 * Componente de toast para desfazer ações.
 * Permite ao usuário reverter operações recém-executadas
 * como exclusões ou modificações de dados.
 */

import React from 'react';
import { Button } from './ui/button';
import { Undo2, X } from 'lucide-react';
import { useGesturesContext } from '../contexts/GesturesContext';
import { cn } from '../lib/utils';

export const UndoToast: React.FC = () => {
  const { undoActions, executeUndo, removeUndoAction } = useGesturesContext();

  if (undoActions.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 space-y-2">
      {undoActions.map((action) => (
        <div
          key={action.id}
          className={cn(
            "flex items-center justify-between p-3 rounded-lg shadow-lg",
            "bg-gray-900 text-white animate-slide-in-bottom"
          )}
        >
          <div className="flex items-center space-x-2">
            <Undo2 className="h-4 w-4" />
            <span className="text-sm">
              {action.type === 'delete' ? 'Item deletado' : 'Ação realizada'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => executeUndo(action.id)}
              className="h-8 px-2 text-white hover:bg-gray-700"
            >
              Desfazer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeUndoAction(action.id)}
              className="h-8 w-8 p-0 text-white hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};