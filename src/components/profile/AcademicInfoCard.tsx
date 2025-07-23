import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { GraduationCap, Building, Clock, Calendar } from 'lucide-react';

interface AcademicInfoCardProps {
  isEditing: boolean;
  formData: any;
  profile: any;
  onFormDataChange: (data: any) => void;
}

const AcademicInfoCard: React.FC<AcademicInfoCardProps> = ({
  isEditing,
  formData,
  profile,
  onFormDataChange
}) => {
  const shiftLabels = {
    morning: 'Matutino',
    afternoon: 'Vespertino',
    night: 'Noturno'
  };

  const shiftIcons = {
    morning: '🌅',
    afternoon: '🌞',
    night: '🌙'
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <GraduationCap className="h-5 w-5" />
          Informações Acadêmicas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Curso */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Curso
            </Label>
            {isEditing ? (
              <Input
                value={formData.course}
                onChange={(e) => onFormDataChange({ ...formData, course: e.target.value })}
                placeholder="Ex: Engenharia de Software"
                className="h-11"
              />
            ) : (
              <div className="h-11 px-3 py-2 bg-muted/50 rounded-md border flex items-center">
                <span className="text-sm">
                  {profile?.course || 'Não informado'}
                </span>
              </div>
            )}
          </div>

          {/* Universidade */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Instituição
            </Label>
            {isEditing ? (
              <Input
                value={formData.university}
                onChange={(e) => onFormDataChange({ ...formData, university: e.target.value })}
                placeholder="Ex: Universidade Federal"
                className="h-11"
              />
            ) : (
              <div className="h-11 px-3 py-2 bg-muted/50 rounded-md border flex items-center">
                <span className="text-sm">
                  {profile?.university || 'Não informado'}
                </span>
              </div>
            )}
          </div>

          {/* Turno */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Turno
            </Label>
            {isEditing ? (
              <Select 
                value={formData.shift} 
                onValueChange={(value) => onFormDataChange({ ...formData, shift: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">🌅 Matutino</SelectItem>
                  <SelectItem value="afternoon">🌞 Vespertino</SelectItem>
                  <SelectItem value="night">🌙 Noturno</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="h-11 px-3 py-2 bg-muted/50 rounded-md border flex items-center gap-2">
                <span className="text-lg">
                  {shiftIcons[profile?.shift || 'morning']}
                </span>
                <span className="text-sm">
                  {shiftLabels[profile?.shift || 'morning']}
                </span>
              </div>
            )}
          </div>

          {/* Período do Semestre */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período Atual
            </Label>
            <div className="h-11 px-3 py-2 bg-muted/50 rounded-md border flex items-center">
              <span className="text-sm">
                {profile?.semesterStart && profile?.semesterEnd
                  ? `${new Date(profile.semesterStart).toLocaleDateString('pt-BR')} - ${new Date(profile.semesterEnd).toLocaleDateString('pt-BR')}`
                  : 'Não configurado'
                }
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AcademicInfoCard;