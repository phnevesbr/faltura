import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, CalendarX, Trash2, Clock, BookOpen } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdvancedAbsenceList: React.FC = () => {
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
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="bg-gradient-to-r from-destructive/10 to-background p-6">
        <CardTitle className="flex items-center text-2xl">
          <Calendar className="h-6 w-6 mr-2 text-destructive" />
          Histórico de Faltas ({absences.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {absences.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma falta registrada</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Você ainda não registrou nenhuma falta. Quando registrar suas faltas, elas aparecerão aqui para acompanhar sua frequência.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAbsences.map(absence => {
              const date = new Date(absence.date + 'T00:00:00');
              
              return (
                <Card key={absence.id} className="border-l-4 border-l-destructive bg-destructive/5 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <CalendarX className="h-5 w-5 text-destructive mr-2" />
                          <h3 className="font-semibold text-lg">
                            {format(date, 'EEEE, dd/MM/yyyy', { locale: ptBR })}
                          </h3>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <BookOpen className="h-4 w-4 mr-2" />
                            <span>Matérias afetadas:</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {absence.subjects && absence.subjects.length > 0 ? (
                              absence.subjects.map(({ subjectId, classCount }) => {
                                const subject = subjects.find(s => s.id === subjectId);
                                if (!subject) {
                                  console.warn('Matéria não encontrada:', subjectId);
                                  return (
                                    <Badge key={subjectId} variant="secondary" className="text-xs">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Matéria removida ({classCount} aula{classCount > 1 ? 's' : ''})
                                    </Badge>
                                  );
                                }
                                
                                return (
                                  <Badge
                                    key={subjectId}
                                    className="text-white border-none text-xs font-medium px-3 py-1"
                                    style={{ backgroundColor: subject.color }}
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    {subject.name} ({classCount} aula{classCount > 1 ? 's' : ''})
                                  </Badge>
                                );
                              })
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Nenhuma matéria registrada
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                            Total de faltas registradas neste dia: {' '}
                            <span className="font-semibold">
                              {absence.subjects ? absence.subjects.reduce((total, s) => total + s.classCount, 0) : 0}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveAbsence(absence.id, absence.date)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 ml-4 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
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

export default AdvancedAbsenceList;