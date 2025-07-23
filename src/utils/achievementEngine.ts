// Sistema avançado de verificação de conquistas
import type { Achievement } from '../contexts/AchievementsContext';

export interface AchievementCondition {
  type: 'data' | 'time' | 'action' | 'sequence' | 'cumulative';
  field?: string;
  operator: 'equals' | 'greater' | 'less' | 'between' | 'exists' | 'not_exists' | 'contains' | 'consecutive';
  value?: any;
  timeframe?: number; // em dias
  action?: string;
  dependencies?: string[]; // IDs de outras conquistas necessárias
}

export interface AchievementRequirement {
  id: string;
  conditions: AchievementCondition[];
  logic: 'AND' | 'OR'; // Como combinar as condições
  cooldown?: number; // Tempo mínimo entre verificações (em ms)
}

// Definição avançada dos requisitos das conquistas
export const achievementRequirements: Record<string, AchievementRequirement> = {
  first_steps: {
    id: 'first_steps',
    conditions: [
      {
        type: 'action',
        operator: 'equals',
        action: 'subject_created'
      }
    ],
    logic: 'AND'
  },

  schedule_builder: {
    id: 'schedule_builder',
    conditions: [
      {
        type: 'cumulative',
        field: 'schedule_slots_added',
        operator: 'greater',
        value: 9 // >= 10
      }
    ],
    logic: 'AND',
    cooldown: 5000
  },

  color_artist: {
    id: 'color_artist',
    conditions: [
      {
        type: 'cumulative',
        field: 'unique_colors_used',
        operator: 'greater',
        value: 2 // >= 3
      }
    ],
    logic: 'AND',
    cooldown: 2000
  },

  data_manager: {
    id: 'data_manager',
    conditions: [
      {
        type: 'action',
        operator: 'equals',
        action: 'grade_imported'
      }
    ],
    logic: 'AND'
  },

  profile_perfectionist: {
    id: 'profile_perfectionist',
    conditions: [
      {
        type: 'data',
        field: 'profile.course',
        operator: 'exists'
      },
      {
        type: 'data',
        field: 'profile.university',
        operator: 'exists'
      },
      {
        type: 'data',
        field: 'profile.shift',
        operator: 'exists'
      },
      {
        type: 'data',
        field: 'profile.semesterStart',
        operator: 'exists'
      },
      {
        type: 'data',
        field: 'profile.semesterEnd',
        operator: 'exists'
      }
    ],
    logic: 'AND',
    cooldown: 3000
  },

  complete_explorer: {
    id: 'complete_explorer',
    conditions: [
      {
        type: 'cumulative',
        field: 'sections_visited',
        operator: 'contains',
        value: ['schedule', 'subjects', 'absences', 'notes', 'stats', 'profile', 'achievements']
      }
    ],
    logic: 'AND',
    cooldown: 5000
  },

  perfect_week: {
    id: 'perfect_week',
    conditions: [
      {
        type: 'sequence',
        field: 'consecutive_weekdays_without_absence',
        operator: 'greater',
        value: 4, // 5 dias
        timeframe: 7
      },
      {
        type: 'time',
        field: 'day_of_week',
        operator: 'greater',
        value: 4 // Sexta ou fim de semana
      }
    ],
    logic: 'AND',
    cooldown: 24 * 60 * 60 * 1000 // 24 horas
  },

  monthly_champion: {
    id: 'monthly_champion',
    conditions: [
      {
        type: 'cumulative',
        field: 'monthly_absences',
        operator: 'less',
        value: 3,
        timeframe: 30
      },
      {
        type: 'time',
        field: 'day_of_month',
        operator: 'greater',
        value: 27 // Fim do mês
      }
    ],
    logic: 'AND',
    cooldown: 24 * 60 * 60 * 1000
  },

  attendance_guardian: {
    id: 'attendance_guardian',
    conditions: [
      {
        type: 'sequence',
        field: 'subject_zero_absences_days',
        operator: 'greater',
        value: 29, // 30 dias
        timeframe: 30
      }
    ],
    logic: 'AND',
    cooldown: 24 * 60 * 60 * 1000
  },

  early_bird: {
    id: 'early_bird',
    conditions: [
      {
        type: 'cumulative',
        field: 'early_classes_attended',
        operator: 'greater',
        value: 9, // >= 10
        timeframe: 90 // 3 meses
      }
    ],
    logic: 'AND',
    cooldown: 24 * 60 * 60 * 1000
  },

  friday_warrior: {
    id: 'friday_warrior',
    conditions: [
      {
        type: 'sequence',
        field: 'consecutive_fridays_without_absence',
        operator: 'greater',
        value: 3, // 4 semanas
        timeframe: 28
      }
    ],
    logic: 'AND',
    cooldown: 7 * 24 * 60 * 60 * 1000 // 7 dias
  },

  semester_legend: {
    id: 'semester_legend',
    conditions: [
      {
        type: 'data',
        field: 'all_subjects_attendance_rate',
        operator: 'greater',
        value: 0.9 // 90%
      }
    ],
    logic: 'AND',
    cooldown: 24 * 60 * 60 * 1000
  },

  night_owl: {
    id: 'night_owl',
    conditions: [
      {
        type: 'time',
        field: 'hour',
        operator: 'between',
        value: [2, 5]
      }
    ],
    logic: 'AND',
    cooldown: 24 * 60 * 60 * 1000
  },

  rainbow_collector: {
    id: 'rainbow_collector',
    conditions: [
      {
        type: 'cumulative',
        field: 'unique_colors_used',
        operator: 'greater',
        value: 6 // >= 7
      }
    ],
    logic: 'AND',
    cooldown: 5000
  },

  quick_regret: {
    id: 'quick_regret',
    conditions: [
      {
        type: 'action',
        operator: 'equals',
        action: 'quick_absence_removal'
      }
    ],
    logic: 'AND'
  },

  schedule_architect: {
    id: 'schedule_architect',
    conditions: [
      {
        type: 'data',
        field: 'schedule.length',
        operator: 'equals',
        value: 25
      }
    ],
    logic: 'AND',
    cooldown: 10000
  },

  // Nova conquista: Designer de Interface
  designer_interface: {
    id: 'designer_interface',
    conditions: [
      {
        type: 'cumulative',
        field: 'theme_changes',
        operator: 'greater',
        value: 2 // >= 3
      }
    ],
    logic: 'AND',
    cooldown: 5000
  },

  // Nova conquista: Escritor Prolífico
  prolific_writer: {
    id: 'prolific_writer',
    conditions: [
      {
        type: 'cumulative',
        field: 'notes_created',
        operator: 'greater',
        value: 19 // >= 20
      }
    ],
    logic: 'AND',
    cooldown: 5000
  },

  // Nova conquista: Networking
  networking: {
    id: 'networking',
    conditions: [
      {
        type: 'action',
        operator: 'equals',
        action: 'joined_class'
      }
    ],
    logic: 'AND'
  },

  // Nova conquista: Analista de Dados
  data_analyst: {
    id: 'data_analyst',
    conditions: [
      {
        type: 'cumulative',
        field: 'total_experience',
        operator: 'greater',
        value: 999 // >= 1000
      }
    ],
    logic: 'AND',
    cooldown: 5000
  },

  // Nova conquista: Mente Suprema
  supreme_mind: {
    id: 'supreme_mind',
    conditions: [
      {
        type: 'cumulative',
        field: 'total_experience',
        operator: 'greater',
        value: 39999 // >= 40000
      }
    ],
    logic: 'AND',
    cooldown: 5000
  },

  // Nova conquista: Rei da Academia
  academia_king: {
    id: 'academia_king',
    conditions: [
      {
        type: 'cumulative',
        field: 'class_members',
        operator: 'greater',
        value: 40 // >= 41
      }
    ],
    logic: 'AND',
    cooldown: 5000
  },

  // Nova conquista secreta: Minimalista
  minimalist: {
    id: 'minimalist',
    conditions: [
      {
        type: 'cumulative',
        field: 'unique_colors_used',
        operator: 'equals',
        value: 2
      }
    ],
    logic: 'AND',
    cooldown: 5000
  },

  // Nova conquista secreta: Imperador das Turmas
  emperor_of_classes: {
    id: 'emperor_of_classes',
    conditions: [
      {
        type: 'cumulative',
        field: 'classes_led',
        operator: 'greater',
        value: 4 // >= 5
      }
    ],
    logic: 'AND',
    cooldown: 5000
  },

  // Nova conquista secreta: Maestro das Cores
  color_maestro: {
    id: 'color_maestro',
    conditions: [
      {
        type: 'cumulative',
        field: 'theme_changes',
        operator: 'greater',
        value: 49 // >= 50
      }
    ],
    logic: 'AND',
    cooldown: 5000
  },

  // Nova conquista secreta: Estudante Natalino
  christmas_student: {
    id: 'christmas_student',
    conditions: [
      {
        type: 'time',
        field: 'christmas_day',
        operator: 'equals',
        value: true
      }
    ],
    logic: 'AND',
    cooldown: 24 * 60 * 60 * 1000
  },

  // Nova conquista secreta: Ano Novo, Eu Novo
  new_year_new_me: {
    id: 'new_year_new_me',
    conditions: [
      {
        type: 'time',
        field: 'new_year_day',
        operator: 'equals',
        value: true
      }
    ],
    logic: 'AND',
    cooldown: 24 * 60 * 60 * 1000
  }
};

// Dados cumulativos de ações do usuário
export interface UserActionData {
  schedule_slots_added: number;
  unique_colors_used: Set<string>;
  sections_visited: Set<string>;
  monthly_absences: { date: string; count: number }[];
  early_classes_attended: number;
  consecutive_weekdays_without_absence: number;
  consecutive_fridays_without_absence: number;
  subject_zero_absences_tracking: Record<string, { startDate: string; days: number }>;
  last_verification: Record<string, number>; // Para cooldowns
  theme_changes: number;
  notes_created: number;
  total_experience: number;
  class_members: number;
  classes_led: number;
}

// Sistema de verificação de conquistas
export class AchievementEngine {
  private userActionData: UserActionData;
  private currentData: any;

  constructor() {
    this.userActionData = {
      schedule_slots_added: 0,
      unique_colors_used: new Set(),
      sections_visited: new Set(),
      monthly_absences: [],
      early_classes_attended: 0,
      consecutive_weekdays_without_absence: 0,
      consecutive_fridays_without_absence: 0,
      subject_zero_absences_tracking: {},
      last_verification: {},
      theme_changes: 0,
      notes_created: 0,
      total_experience: 0,
      class_members: 0,
      classes_led: 0
    };
  }

  setCurrentData(data: any) {
    this.currentData = data;
  }

  loadUserActionData(data: Partial<UserActionData>) {
    this.userActionData = {
      ...this.userActionData,
      ...data,
      unique_colors_used: new Set(data.unique_colors_used || []),
      sections_visited: new Set(data.sections_visited || [])
    };
  }

  getUserActionData() {
    return {
      ...this.userActionData,
      unique_colors_used: Array.from(this.userActionData.unique_colors_used),
      sections_visited: Array.from(this.userActionData.sections_visited)
    };
  }

  updateExperience(totalXp: number) {
    this.userActionData.total_experience = totalXp;
  }

  updateClassMembers(memberCount: number) {
    this.userActionData.class_members = memberCount;
  }

  updateClassesLed(classCount: number) {
    this.userActionData.classes_led = classCount;
  }

  resetAllData() {
    this.userActionData = {
      schedule_slots_added: 0,
      unique_colors_used: new Set(),
      sections_visited: new Set(),
      monthly_absences: [],
      early_classes_attended: 0,
      consecutive_weekdays_without_absence: 0,
      consecutive_fridays_without_absence: 0,
      subject_zero_absences_tracking: {},
      last_verification: {},
      theme_changes: 0,
      notes_created: 0,
      total_experience: 0,
      class_members: 0,
      classes_led: 0
    };
  }

  // Registra ações do usuário
  trackAction(action: string, data?: any) {
    const now = Date.now();

    switch (action) {
      case 'subject_created':
        // Não precisa tracking especial, é baseado em evento
        break;

      case 'schedule_slot_added':
        this.userActionData.schedule_slots_added++;
        break;

      case 'color_changed':
        if (data?.color) {
          this.userActionData.unique_colors_used.add(data.color);
        }
        break;

      case 'section_visited':
        if (data?.section) {
          this.userActionData.sections_visited.add(data.section);
        }
        break;

      case 'grade_imported':
        // Evento único, sem tracking necessário
        break;

      case 'absence_added':
        if (data?.date) {
          const month = new Date(data.date).toISOString().slice(0, 7);
          const existing = this.userActionData.monthly_absences.find(m => m.date === month);
          if (existing) {
            existing.count++;
          } else {
            this.userActionData.monthly_absences.push({ date: month, count: 1 });
          }
        }
        break;

      case 'early_class_attended':
        this.userActionData.early_classes_attended++;
        break;

      case 'quick_absence_removal':
        // Evento único, baseado em ação
        break;

      case 'theme_changed':
        this.userActionData.theme_changes++;
        break;

      case 'note_created':
        this.userActionData.notes_created++;
        break;

      case 'joined_class':
        // Evento único, baseado em ação
        break;
    }
  }

  // Verifica se uma conquista deve ser desbloqueada
  canUnlockAchievement(achievementId: string): boolean {
    const requirement = achievementRequirements[achievementId];
    if (!requirement) return false;

    // Verifica cooldown
    const lastCheck = this.userActionData.last_verification[achievementId] || 0;
    const now = Date.now();
    if (requirement.cooldown && (now - lastCheck) < requirement.cooldown) {
      return false;
    }

    // Verifica condições
    const results = requirement.conditions.map(condition => this.evaluateCondition(condition));
    
    // Aplicar lógica AND/OR
    const canUnlock = requirement.logic === 'AND' 
      ? results.every(r => r) 
      : results.some(r => r);

    if (canUnlock) {
      this.userActionData.last_verification[achievementId] = now;
    }

    return canUnlock;
  }

  private evaluateCondition(condition: AchievementCondition): boolean {
    const now = new Date();

    switch (condition.type) {
      case 'data':
        return this.evaluateDataCondition(condition);

      case 'time':
        return this.evaluateTimeCondition(condition, now);

      case 'action':
        // Actions são verificadas externamente através de eventos
        return true; // Allow action-based achievements to pass this check

      case 'cumulative':
        return this.evaluateCumulativeCondition(condition);

      case 'sequence':
        return this.evaluateSequenceCondition(condition, now);

      default:
        return false;
    }
  }

  private evaluateDataCondition(condition: AchievementCondition): boolean {
    if (!condition.field || !this.currentData) return false;

    const value = this.getNestedValue(this.currentData, condition.field);

    switch (condition.operator) {
      case 'exists':
        return value !== undefined && value !== null && value !== '';
      case 'not_exists':
        return value === undefined || value === null || value === '';
      case 'equals':
        return value === condition.value;
      case 'greater':
        return typeof value === 'number' && value > condition.value;
      case 'less':
        return typeof value === 'number' && value < condition.value;
      default:
        return false;
    }
  }

  private evaluateTimeCondition(condition: AchievementCondition, now: Date): boolean {
    const saoPauloTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

    switch (condition.field) {
      case 'hour':
        const hour = saoPauloTime.getHours();
        if (condition.operator === 'between' && Array.isArray(condition.value)) {
          const [min, max] = condition.value;
          return hour >= min && hour <= max;
        }
        return hour === condition.value;

      case 'day_of_week':
        const dayOfWeek = saoPauloTime.getDay();
        return condition.operator === 'greater' 
          ? dayOfWeek >= condition.value 
          : dayOfWeek === condition.value;

      case 'day_of_month':
        const dayOfMonth = saoPauloTime.getDate();
        return condition.operator === 'greater' 
          ? dayOfMonth >= condition.value 
          : dayOfMonth === condition.value;

      case 'christmas_day':
        return saoPauloTime.getDate() === 25 && saoPauloTime.getMonth() === 11;

      case 'new_year_day':
        return saoPauloTime.getDate() === 1 && saoPauloTime.getMonth() === 0;

      default:
        return false;
    }
  }

  private evaluateCumulativeCondition(condition: AchievementCondition): boolean {
    switch (condition.field) {
      case 'schedule_slots_added':
        return condition.operator === 'greater' 
          ? this.userActionData.schedule_slots_added > condition.value
          : this.userActionData.schedule_slots_added === condition.value;

      case 'unique_colors_used':
        const colorCount = this.userActionData.unique_colors_used.size;
        return condition.operator === 'greater' 
          ? colorCount > condition.value
          : colorCount === condition.value;

      case 'sections_visited':
        if (condition.operator === 'contains' && Array.isArray(condition.value)) {
          return condition.value.every(section => this.userActionData.sections_visited.has(section));
        }
        return false;

      case 'monthly_absences':
        if (condition.timeframe) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - condition.timeframe);
          const month = cutoffDate.toISOString().slice(0, 7);
          const monthData = this.userActionData.monthly_absences.find(m => m.date === month);
          const count = monthData?.count || 0;
          return condition.operator === 'less' ? count < condition.value : count === condition.value;
        }
        return false;

      case 'early_classes_attended':
        return condition.operator === 'greater' 
          ? this.userActionData.early_classes_attended > condition.value
          : this.userActionData.early_classes_attended === condition.value;

      case 'theme_changes':
        return condition.operator === 'greater' 
          ? this.userActionData.theme_changes > condition.value
          : this.userActionData.theme_changes === condition.value;

      case 'notes_created':
        return condition.operator === 'greater' 
          ? this.userActionData.notes_created > condition.value
          : this.userActionData.notes_created === condition.value;

      case 'total_experience':
        return condition.operator === 'greater' 
          ? this.userActionData.total_experience > condition.value
          : this.userActionData.total_experience === condition.value;

      case 'class_members':
        return condition.operator === 'greater' 
          ? this.userActionData.class_members > condition.value
          : this.userActionData.class_members === condition.value;

      case 'classes_led':
        return condition.operator === 'greater' 
          ? this.userActionData.classes_led > condition.value
          : this.userActionData.classes_led === condition.value;

      default:
        return false;
    }
  }

  private evaluateSequenceCondition(condition: AchievementCondition, now: Date): boolean {
    // Implementação simplificada - em um sistema real, seria mais complexa
    switch (condition.field) {
      case 'consecutive_weekdays_without_absence':
        return this.userActionData.consecutive_weekdays_without_absence > condition.value;

      case 'consecutive_fridays_without_absence':
        return this.userActionData.consecutive_fridays_without_absence > condition.value;

      case 'subject_zero_absences_days':
        // Verifica se alguma matéria tem 30 dias sem faltas
        return Object.values(this.userActionData.subject_zero_absences_tracking)
          .some(tracking => tracking.days > condition.value);

      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Atualiza dados de sequência baseado no estado atual
  updateSequenceData() {
    if (!this.currentData) return;

    const { absences, subjects, schedule } = this.currentData;
    const now = new Date();

    // Atualizar dados de sequência para verificações futuras
    this.updateConsecutiveWeekdays(absences, now);
    this.updateFridayStreak(absences, now);
    this.updateSubjectZeroAbsences(subjects, absences, now);
  }

  private updateConsecutiveWeekdays(absences: any[], now: Date) {
    // Implementação da lógica de dias consecutivos sem falta
    const today = new Date(now);
    let consecutiveDays = 0;
    
    for (let i = 0; i < 5; i++) { // Últimos 5 dias úteis
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      // Pula fins de semana
      if (checkDate.getDay() === 0 || checkDate.getDay() === 6) continue;
      
      const hasAbsence = absences.some(absence => {
        const absenceDate = new Date(absence.date);
        return absenceDate.toDateString() === checkDate.toDateString();
      });
      
      if (!hasAbsence) {
        consecutiveDays++;
      } else {
        break;
      }
    }
    
    this.userActionData.consecutive_weekdays_without_absence = consecutiveDays;
  }

  private updateFridayStreak(absences: any[], now: Date) {
    // Implementação da lógica de sextas consecutivas sem falta
    const today = new Date(now);
    let consecutiveFridays = 0;
    
    for (let i = 0; i < 4; i++) { // Últimas 4 sextas
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - (today.getDay() + 2 + i * 7) % 7);
      
      const hasAbsence = absences.some(absence => {
        const absenceDate = new Date(absence.date);
        return absenceDate.toDateString() === checkDate.toDateString();
      });
      
      if (!hasAbsence) {
        consecutiveFridays++;
      } else {
        break;
      }
    }
    
    this.userActionData.consecutive_fridays_without_absence = consecutiveFridays;
  }

  private updateSubjectZeroAbsences(subjects: any[], absences: any[], now: Date) {
    // Atualiza tracking de matérias com zero faltas
    subjects.forEach(subject => {
      if (subject.currentAbsences === 0) {
        if (!this.userActionData.subject_zero_absences_tracking[subject.id]) {
          this.userActionData.subject_zero_absences_tracking[subject.id] = {
            startDate: now.toISOString(),
            days: 1
          };
        } else {
          const tracking = this.userActionData.subject_zero_absences_tracking[subject.id];
          const startDate = new Date(tracking.startDate);
          const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          tracking.days = daysDiff + 1;
        }
      } else {
        // Reset se a matéria tem faltas
        delete this.userActionData.subject_zero_absences_tracking[subject.id];
      }
    });
  }

  // Método para resetar todos os dados de tracking
  reset() {
    this.userActionData = {
      schedule_slots_added: 0,
      unique_colors_used: new Set<string>(),
      sections_visited: new Set<string>(),
      monthly_absences: [],
      early_classes_attended: 0,
      consecutive_weekdays_without_absence: 0,
      consecutive_fridays_without_absence: 0,
      subject_zero_absences_tracking: {},
      last_verification: {},
      theme_changes: 0,
      notes_created: 0,
      total_experience: 0,
      class_members: 0,
      classes_led: 0
    };
    this.currentData = {};
  }
}