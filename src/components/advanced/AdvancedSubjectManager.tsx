import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  BookOpen, Plus, Trash2, Edit, CheckCircle, AlertTriangle, 
  XCircle, Clock, CalendarCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../ui/tabs';
import { CreateSubjectModal } from './CreateSubjectModal';
import { EditSubjectModal } from './EditSubjectModal';

const AdvancedSubjectManager: React.FC = () => {
  const { subjects, deleteSubject } = useData();

  const [activeTab, setActiveTab] = useState('all');
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleEdit = (subject: any) => {
    setEditingSubject(subject);
    setEditModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    deleteSubject(id);
    toast.success("Matéria removida", {
      description: `${name} foi removida da sua lista.`,
    });
  };

  const getAbsenceStatus = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return { status: 'failed', color: 'text-destructive', icon: XCircle, bg: 'bg-destructive/10' };
    if (percentage >= 90) return { status: 'danger', color: 'text-destructive', icon: AlertTriangle, bg: 'bg-destructive/10' };
    if (percentage >= 75) return { status: 'warning', color: 'text-yellow-600', icon: AlertTriangle, bg: 'bg-yellow-100 dark:bg-yellow-900/20' };
    return { status: 'ok', color: 'text-green-600', icon: CheckCircle, bg: 'bg-green-100 dark:bg-green-900/20' };
  };

  const filteredSubjects = subjects.filter(subject => {
    if (activeTab === 'all') return true;
    if (activeTab === 'danger') {
      const percentage = (subject.currentAbsences / subject.maxAbsences) * 100;
      return percentage >= 75;
    }
    if (activeTab === 'safe') {
      const percentage = (subject.currentAbsences / subject.maxAbsences) * 100;
      return percentage < 75;
    }
    return true;
  });

  // Group subjects by status for statistics
  const subjectStatistics = {
    total: subjects.length,
    danger: subjects.filter(s => (s.currentAbsences / s.maxAbsences) * 100 >= 90).length,
    warning: subjects.filter(s => {
      const percentage = (s.currentAbsences / s.maxAbsences) * 100;
      return percentage >= 75 && percentage < 90;
    }).length,
    safe: subjects.filter(s => (s.currentAbsences / s.maxAbsences) * 100 < 75).length,
  };

  return (
    <div className="space-y-6">
      {/* Statistics Tabs */}
      <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-0">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-primary" />
                Minhas Matérias
              </h2>
              <CreateSubjectModal>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Nova Matéria
                </Button>
              </CreateSubjectModal>
            </div>
            
            <div className="px-4 pb-2">
              <div className="grid grid-cols-4 gap-2 mb-4">
                <Card className="p-3 border border-primary/20 bg-primary/5">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-primary flex items-center">
                    <BookOpen className="h-4 w-4 mr-1 text-primary/70" />
                    {subjectStatistics.total}
                  </p>
                </Card>
                <Card className="p-3 border border-green-500/20 bg-green-500/5">
                  <p className="text-xs text-muted-foreground">Seguras</p>
                  <p className="text-xl font-bold text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1 text-green-500/70" />
                    {subjectStatistics.safe}
                  </p>
                </Card>
                <Card className="p-3 border border-yellow-500/20 bg-yellow-500/5">
                  <p className="text-xs text-muted-foreground">Atenção</p>
                  <p className="text-xl font-bold text-yellow-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500/70" />
                    {subjectStatistics.warning}
                  </p>
                </Card>
                <Card className="p-3 border border-destructive/20 bg-destructive/5">
                  <p className="text-xs text-muted-foreground">Críticas</p>
                  <p className="text-xl font-bold text-destructive flex items-center">
                    <XCircle className="h-4 w-4 mr-1 text-destructive/70" />
                    {subjectStatistics.danger}
                  </p>
                </Card>
              </div>
            </div>
            
            <TabsList className="grid grid-cols-3 mx-4 mb-4">
              <TabsTrigger value="all" className="rounded-md">Todas ({subjects.length})</TabsTrigger>
              <TabsTrigger value="danger" className="rounded-md">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Risco ({subjectStatistics.danger + subjectStatistics.warning})
              </TabsTrigger>
              <TabsTrigger value="safe" className="rounded-md">
                <CheckCircle className="h-3 w-3 mr-1" />
                Seguras ({subjectStatistics.safe})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Subject List Content */}
      <div className="space-y-4">
        {filteredSubjects.length === 0 ? (
          <Card className="overflow-hidden border shadow-sm">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Nenhuma matéria encontrada</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {activeTab === 'all' 
                    ? 'Você ainda não cadastrou nenhuma matéria. Adicione suas matérias para começar a organizar sua grade horária.'
                    : activeTab === 'danger' 
                      ? 'Todas as suas matérias estão em situação normal de faltas. Continue assim!'
                      : 'Você não tem matérias cadastradas em situação segura de faltas.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSubjects.map(subject => {
              const { status, color, icon: Icon, bg } = getAbsenceStatus(subject.currentAbsences, subject.maxAbsences);
              const percentage = Math.round((subject.currentAbsences / subject.maxAbsences) * 100);
              
              return (
                <Card 
                  key={subject.id} 
                  className={`overflow-hidden border-t-4 shadow-sm hover:shadow-md transition-shadow animate-fade-in ${bg}`}
                  style={{ borderTopColor: subject.color }}
                >
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center" 
                            style={{ backgroundColor: subject.color }}
                          >
                            <BookOpen className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg leading-tight">{subject.name}</h3>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{subject.weeklyHours} aula{subject.weeklyHours > 1 ? 's' : ''}/semana</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline"
                            className="font-medium border-none text-white"
                            style={{ backgroundColor: subject.color }}
                          >
                            {subject.weeklyHours}h
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <CalendarCheck className="h-3 w-3" />
                            <span>Limite de faltas:</span>
                          </div>
                          <div className={`flex items-center ${color}`}>
                            <Icon className="h-4 w-4 mr-1" />
                            <span className="font-semibold">
                              {subject.currentAbsences}/{subject.maxAbsences}
                            </span>
                          </div>
                        </div>
                        
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              percentage >= 100 ? 'bg-destructive' :
                              percentage >= 90 ? 'bg-destructive' :
                              percentage >= 75 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                        
                        <p className={`text-xs leading-tight ${
                          percentage >= 100 ? 'text-destructive font-semibold' :
                          percentage >= 90 ? 'text-destructive' :
                          percentage >= 75 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {percentage >= 100 ? 'REPROVADO POR FALTA' :
                           percentage >= 90 ? 'PERIGO: Muito próximo do limite!' :
                           percentage >= 75 ? 'ATENÇÃO: Próximo do limite de faltas' :
                           'Situação normal de frequência'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-t flex divide-x">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(subject)}
                        className="flex-1 rounded-none h-11"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(subject.id, subject.name)}
                        className="flex-1 rounded-none h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Subject Modal */}
      <EditSubjectModal 
        subject={editingSubject}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      />
    </div>
  );
};

export default AdvancedSubjectManager;