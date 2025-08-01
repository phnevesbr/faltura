
export interface SharedGradeData {
  id: string;
  version: string;
  createdAt: string;
  authorName?: string;
  data: {
    subjects: any[];
    schedule: any[];
    timeSlots: any[];
    metadata: {
      totalClasses: number;
      subjectsCount: number;
      authorName?: string;
    };
  };
}

export interface ShareOptions {
  includeSubjects: boolean;
  includeSchedule: boolean;
  includeTimeSlots: boolean;
  authorName?: string;
}

class ShareService {
  // Gerar dados para exportação
  generateExportData(subjects: any[], schedule: any[], timeSlots: any[], options: ShareOptions): SharedGradeData {
    const now = new Date();

    return {
      id: `FALTULA-${Date.now()}`,
      version: '1.0',
      createdAt: now.toISOString(),
      authorName: options.authorName,
      data: {
        subjects: options.includeSubjects ? subjects : [],
        schedule: options.includeSchedule ? schedule : [],
        timeSlots: options.includeTimeSlots ? timeSlots : [],
        metadata: {
          totalClasses: schedule.length,
          subjectsCount: subjects.length,
          authorName: options.authorName,
        }
      }
    };
  }

  // Exportar como arquivo para download
  exportAsFile(subjects: any[], schedule: any[], timeSlots: any[], options: ShareOptions): void {
    const data = this.generateExportData(subjects, schedule, timeSlots, options);
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `faltula-grade-${new Date().toISOString().split('T')[0]}.faltula`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Importar de arquivo
  async importFromFile(file: File): Promise<SharedGradeData> {
    return new Promise((resolve, reject) => {
      if (!file.name.endsWith('.faltula')) {
        reject(new Error('Arquivo deve ter extensão .faltula'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content) as SharedGradeData;
          
          if (!this.validateImportData(data)) {
            reject(new Error('Arquivo com formato inválido'));
            return;
          }
          
          resolve(data);
        } catch (error) {
          reject(new Error('Erro ao ler o arquivo. Verifique se é um arquivo válido do Faltula.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo'));
      };
      
      reader.readAsText(file);
    });
  }

  // Validar estrutura de dados importados
  validateImportData(data: any): data is SharedGradeData {
    try {
      return (
        data &&
        typeof data === 'object' &&
        data.id &&
        data.version &&
        data.data &&
        Array.isArray(data.data.subjects) &&
        Array.isArray(data.data.schedule) &&
        Array.isArray(data.data.timeSlots) &&
        data.data.metadata &&
        typeof data.data.metadata === 'object'
      );
    } catch {
      return false;
    }
  }

  // Helper method to create subject mapping for import
  createSubjectMapping(importedSubjects: any[], existingSubjects: any[]): { [oldId: string]: string } {
    const mapping: { [oldId: string]: string } = {};
    
    importedSubjects.forEach(importedSubject => {
      // Try to find existing subject with same name
      const existingSubject = existingSubjects.find(existing => 
        existing.name === importedSubject.name
      );
      
      if (existingSubject) {
        mapping[importedSubject.id] = existingSubject.id;
      } else {
        // Subject will be newly created, map to its imported id for now
        mapping[importedSubject.id] = importedSubject.id;
      }
    });
    
    return mapping;
  }
}

export const shareService = new ShareService();
