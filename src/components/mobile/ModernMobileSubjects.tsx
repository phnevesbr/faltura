import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import ModernSubjectCard from './ModernSubjectCard';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Users,
  Star
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import ColorPicker from '../ColorPicker';
import { cn } from '../../lib/utils';

const ModernMobileSubjects: React.FC = () => {
  const { subjects, addSubject, updateSubject, deleteSubject } = useData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    weeklyHours: 2,
    maxAbsences: 10,
    color: '#8B5CF6'
  });

  const generateRandomColor = () => {
    const colors = [
      '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', 
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getDefaultMaxAbsences = (weeklyHours: number): number => {
    if (weeklyHours >= 4) return 20;
    if (weeklyHours === 3) return 15;
    if (weeklyHours === 2) return 10;
    return 5;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome da matéria.",
        variant: "destructive",
      });
      return;
    }

    if (editingId) {
      updateSubject(editingId, formData);
      toast({ 
        title: "✨ Matéria atualizada!",
        description: `${formData.name} foi atualizada com sucesso.`
      });
      setEditingId(null);
    } else {
      addSubject(formData);
      toast({ 
        title: "🎉 Nova matéria adicionada!",
        description: `${formData.name} foi adicionada à sua lista.`
      });
      
      console.log('📚 Subject created successfully, checking onboarding...');
      // Avançar onboarding se estiver ativo
      if ((window as any).onboardingNextStep) {
        console.log('📚 Calling onboarding next step...');
        setTimeout(() => {
          (window as any).onboardingNextStep();
          console.log('📚 Onboarding next step called!');
        }, 500);
      } else {
        console.log('📚 No onboarding function found');
      }
    }
    
    setFormData({ 
      name: '', 
      weeklyHours: 2, 
      maxAbsences: 10, 
      color: generateRandomColor() 
    });
    setShowForm(false);
  };

  const handleEdit = (subject: any) => {
    setFormData({
      name: subject.name,
      weeklyHours: subject.weeklyHours,
      maxAbsences: subject.maxAbsences,
      color: subject.color
    });
    setEditingId(subject.id);
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    deleteSubject(id);
    toast({ 
      title: "🗑️ Matéria removida",
      description: `${name} foi removida da sua lista.`
    });
  };

  // Filter subjects based on search and status
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject?.name && typeof subject.name === 'string' 
      ? subject.name.toLowerCase().includes(searchTerm.toLowerCase()) 
      : false;
    const absencePercentage = (subject.currentAbsences / subject.maxAbsences) * 100;
    
    let matchesFilter = true;
    if (filterStatus === 'warning') {
      matchesFilter = absencePercentage >= 75 && absencePercentage < 100;
    } else if (filterStatus === 'critical') {
      matchesFilter = absencePercentage >= 100;
    } else if (filterStatus === 'ok') {
      matchesFilter = absencePercentage < 75;
    }
    
    return matchesSearch && matchesFilter;
  });

  // Statistics
  const criticalSubjects = subjects.filter(s => (s.currentAbsences / s.maxAbsences) * 100 >= 100).length;
  const warningSubjects = subjects.filter(s => {
    const percentage = (s.currentAbsences / s.maxAbsences) * 100;
    return percentage >= 75 && percentage < 100;
  }).length;
  const okSubjects = subjects.filter(s => (s.currentAbsences / s.maxAbsences) * 100 < 75).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{okSubjects}</div>
            <div className="text-xs text-green-600 font-medium">Em dia</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-orange-700">{warningSubjects}</div>
            <div className="text-xs text-orange-600 font-medium">Atenção</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-red-700">{criticalSubjects}</div>
            <div className="text-xs text-red-600 font-medium">Crítico</div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Matérias</h1>
          <p className="text-sm text-gray-600">
            {subjects.length} disciplinas cadastradas
          </p>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="rounded-xl shadow-sm bg-gradient-to-r from-blue-500 to-purple-600"
              data-action="add-subject"
              onClick={() => {
                console.log('📚 Button clicked, opening modal...');
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nova
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md rounded-2xl z-[60]">
            <DialogHeader>
              <DialogTitle className="text-center">
                {editingId ? '✏️ Editar Matéria' : '➕ Nova Matéria'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome da matéria"
                  className="text-base rounded-xl h-12"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Select
                    value={formData.weeklyHours.toString()}
                    onValueChange={(value) => {
                      const hours = parseInt(value);
                      setFormData(prev => ({
                        ...prev,
                        weeklyHours: hours,
                        maxAbsences: getDefaultMaxAbsences(hours)
                      }));
                    }}
                  >
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue placeholder="Aulas/semana" />
                    </SelectTrigger>
                    <SelectContent 
                      className="z-[80]"
                      onCloseAutoFocus={(e) => e.preventDefault()}
                      side="bottom"
                      align="start"
                    >
                      <SelectItem value="1">1 aula/sem</SelectItem>
                      <SelectItem value="2">2 aulas/sem</SelectItem>
                      <SelectItem value="3">3 aulas/sem</SelectItem>
                      <SelectItem value="4">4+ aulas/sem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.maxAbsences}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxAbsences: parseInt(e.target.value) || 1 }))}
                    placeholder="Max faltas"
                    className="rounded-xl h-12"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="font-medium text-gray-700">Cor da Matéria:</span>
                <ColorPicker
                  selectedColor={formData.color}
                  onColorChange={(color) => setFormData(prev => ({ ...prev, color }))}
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button 
                  type="submit" 
                  className="flex-1 rounded-xl h-12"
                  data-action="create-subject"
                >
                  {editingId ? '💾 Salvar' : '🎉 Criar'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                  className="rounded-xl h-12"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar matérias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl h-12"
          />
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={filterStatus === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus('all')}
            className="rounded-full whitespace-nowrap"
          >
            Todas ({subjects.length})
          </Button>
          <Button
            variant={filterStatus === 'ok' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus('ok')}
            className="rounded-full whitespace-nowrap"
          >
            <Star className="h-3 w-3 mr-1" />
            Em dia ({okSubjects})
          </Button>
          <Button
            variant={filterStatus === 'warning' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus('warning')}
            className="rounded-full whitespace-nowrap"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Atenção ({warningSubjects})
          </Button>
          <Button
            variant={filterStatus === 'critical' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus('critical')}
            className="rounded-full whitespace-nowrap"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Crítico ({criticalSubjects})
          </Button>
        </div>
      </div>

      {/* Subjects List */}
      <div className="space-y-4">
        {filteredSubjects.length === 0 ? (
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-dashed border-2 border-blue-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-4">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'all' ? 'Nenhuma matéria encontrada' : 'Comece adicionando suas matérias'}
              </h3>
              <p className="text-gray-600 text-center text-sm mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Tente ajustar os filtros ou termo de busca'
                  : 'Adicione as disciplinas que você está cursando para começar o controle de faltas'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Button 
                  onClick={(e) => {
                    console.log('📚 Subject Button: Add first subject clicked');
                    setShowForm(true);
                    
                    // Check if this click is from onboarding
                    const isOnboardingClick = (e.target as HTMLElement)?.closest('[data-onboarding-highlighted]');
                    if (isOnboardingClick) {
                      console.log('📚 Subject Button: Onboarding click detected, modal will open');
                    }
                  }}
                  data-action="add-first-subject"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar primeira matéria
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredSubjects.map(subject => (
            <ModernSubjectCard
              key={subject.id}
              subject={subject}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ModernMobileSubjects;