import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { MobileSubjectCard } from './MobileSubjectCard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BookOpen, Plus, Edit2, Trash2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import ColorPicker from '../ColorPicker';

const MobileSubjectManager: React.FC = () => {
  const { subjects, addSubject, updateSubject, deleteSubject } = useData();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    weeklyHours: 1,
    maxAbsences: 5,
    color: '#8B5CF6'
  });

  const generateRandomColor = () => {
    const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'];
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
    
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome da matéria.",
        variant: "destructive",
      });
      return;
    }

    if (editingId) {
      updateSubject(editingId, formData);
      toast({ title: "Matéria atualizada!" });
      setEditingId(null);
    } else {
      addSubject(formData);
      toast({ title: "Matéria adicionada!" });
    }
    
    setFormData({ name: '', weeklyHours: 1, maxAbsences: 5, color: generateRandomColor() });
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
    toast({ title: `${name} removida` });
  };

  const getAbsenceStatus = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return { status: 'failed', color: 'text-red-500', icon: XCircle };
    if (percentage >= 90) return { status: 'danger', color: 'text-red-500', icon: AlertTriangle };
    if (percentage >= 75) return { status: 'warning', color: 'text-orange-500', icon: AlertTriangle };
    return { status: 'ok', color: 'text-green-500', icon: CheckCircle };
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header com botão de adicionar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Matérias</h1>
          <p className="text-sm text-gray-500">{subjects.length} cadastradas</p>
          {subjects.filter(s => (s.currentAbsences / s.maxAbsences) * 100 >= 75).length > 0 && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs mt-1">
              <BookOpen className="h-3 w-3" />
              <span>{subjects.filter(s => (s.currentAbsences / s.maxAbsences) * 100 >= 75).length} próximas</span>
            </div>
          )}
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1" />
              Nova
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Matéria' : 'Nova Matéria'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome da matéria"
                  className="text-base"
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
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-gray-600">Cor da Matéria:</span>
                <div className="flex items-center space-x-2">
                  <ColorPicker
                    selectedColor={formData.color}
                    onColorChange={(color) => setFormData(prev => ({ ...prev, color }))}
                  />
                  <span className="text-xs text-gray-500">Toque para escolher</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button type="submit" data-action="create-subject" className="flex-1">
                  {editingId ? 'Salvar' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de matérias */}
      <div className="space-y-3">
        {subjects.length === 0 ? (
          <Card className="bg-gray-50">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500 text-center text-sm">
                Nenhuma matéria cadastrada
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowForm(true)}
                data-action="add-first-subject"
                className="mt-2 text-primary"
              >
                Adicionar primeira matéria
              </Button>
            </CardContent>
          </Card>
        ) : (
          subjects.map(subject => (
            <MobileSubjectCard
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

export default MobileSubjectManager;