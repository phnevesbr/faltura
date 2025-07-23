// Utility functions for safe subject property access
export const getSubjectName = (subject: any): string => {
  if (!subject) return 'Matéria não encontrada';
  if (typeof subject.name === 'string' && subject.name.trim()) {
    return subject.name;
  }
  return 'Matéria sem nome';
};

export const getSubjectColor = (subject: any): string => {
  if (!subject) return '#3B82F6';
  if (typeof subject.color === 'string' && subject.color.trim()) {
    return subject.color;
  }
  return '#3B82F6';
};

export const isValidSubject = (subject: any): boolean => {
  return subject && 
         typeof subject === 'object' &&
         typeof subject.id === 'string' &&
         typeof subject.name === 'string' &&
         subject.name.trim().length > 0;
};

export const filterValidSubjects = (subjects: any[]): any[] => {
  if (!Array.isArray(subjects)) return [];
  return subjects.filter(isValidSubject);
};