import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, CalendarX, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AbsenceList: React.FC = () => {
  const { subjects, absences, removeAbsence } = useData();
  const { toast } = useToast();

  const handleRemoveAbsence = (id: string, date: string) => {
    removeAbsence(id);
    toast({
      title: "Falta removida",
      description: `Falta do dia ${format(new Date(date), 'dd/MM/yyyy')} foi removida.`,
    });
  };

  const sortedAbsences = [...absences].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Histórico de Faltas ({absences.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {absences.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhuma falta registrada</p>
            <p className="text-sm text-gray-400">
              Registre suas faltas para acompanhar sua frequência.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAbsences.map(absence => {
              const date = new Date(absence.date + 'T00:00:00');
              
              return (
                <Card key={absence.id} className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <CalendarX className="h-4 w-4 text-red-500 mr-2" />
                          <h3 className="font-semibold">
                            {format(date, 'EEEE, dd/MM/yyyy', { locale: ptBR })}
                          </h3>
                        </div>
                        
                         <div className="space-y-2">
                          <p className="text-sm text-gray-600">Matérias afetadas:</p>
                          <div className="flex flex-wrap gap-2">
                            {absence.subjects && absence.subjects.length > 0 ? (
                              absence.subjects.map(({ subjectId, classCount }) => {
                                const subject = subjects.find(s => s.id === subjectId);
                                if (!subject) {
                                  console.warn('Matéria não encontrada:', subjectId);
                                  return (
                                    <Badge key={subjectId} variant="secondary">
                                      Matéria removida ({classCount} aula{classCount > 1 ? 's' : ''})
                                    </Badge>
                                  );
                                }
                                
                                return (
                                  <Badge
                                    key={subjectId}
                                    className="text-white border-none"
                                    style={{ backgroundColor: subject.color }}
                                  >
                                    {subject.name} ({classCount} aula{classCount > 1 ? 's' : ''})
                                  </Badge>
                                );
                              })
                            ) : (
                              <Badge variant="secondary">
                                Nenhuma matéria registrada
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveAbsence(absence.id, absence.date)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 ml-4"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AbsenceList;