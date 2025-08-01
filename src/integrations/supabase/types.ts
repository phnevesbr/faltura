export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      absence_notifications: {
        Row: {
          absence_date: string
          class_id: string
          content_photos: string[] | null
          content_sender_id: string | null
          content_sent: boolean
          content_sent_at: string | null
          content_text: string | null
          created_at: string
          id: string
          subjects: string[]
          user_id: string
        }
        Insert: {
          absence_date: string
          class_id: string
          content_photos?: string[] | null
          content_sender_id?: string | null
          content_sent?: boolean
          content_sent_at?: string | null
          content_text?: string | null
          created_at?: string
          id?: string
          subjects: string[]
          user_id: string
        }
        Update: {
          absence_date?: string
          class_id?: string
          content_photos?: string[] | null
          content_sender_id?: string | null
          content_sent?: boolean
          content_sent_at?: string | null
          content_text?: string | null
          created_at?: string
          id?: string
          subjects?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "absence_notifications_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      absence_subjects: {
        Row: {
          absence_id: string
          class_count: number
          created_at: string
          id: string
          subject_id: string
        }
        Insert: {
          absence_id: string
          class_count?: number
          created_at?: string
          id?: string
          subject_id: string
        }
        Update: {
          absence_id?: string
          class_count?: number
          created_at?: string
          id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "absence_subjects_absence_id_fkey"
            columns: ["absence_id"]
            isOneToOne: false
            referencedRelation: "absences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      absences: {
        Row: {
          created_at: string
          date: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      achievement_tracking: {
        Row: {
          created_at: string
          date_tracked: string
          id: string
          subject_id: string | null
          tracking_data: Json
          tracking_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_tracked?: string
          id?: string
          subject_id?: string | null
          tracking_data?: Json
          tracking_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_tracked?: string
          id?: string
          subject_id?: string | null
          tracking_data?: Json
          tracking_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          achievement_id: string
          category: string
          description: string
          experience_reward: number | null
          icon: string
          id: string
          is_secret: boolean
          name: string
          rarity: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          category: string
          description: string
          experience_reward?: number | null
          icon: string
          id?: string
          is_secret?: boolean
          name: string
          rarity: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          category?: string
          description?: string
          experience_reward?: number | null
          icon?: string
          id?: string
          is_secret?: boolean
          name?: string
          rarity?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          target_id: string | null
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          target_id?: string | null
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          target_id?: string | null
          target_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_roles: {
        Row: {
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          permissions: Json
          revoked_at: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          permissions?: Json
          revoked_at?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          permissions?: Json
          revoked_at?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          note_id: string
          text: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          note_id: string
          text: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          note_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_alerts: {
        Row: {
          class_id: string
          created_at: string
          id: string
          message: string
          priority: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_alerts_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_invites: {
        Row: {
          class_id: string
          created_at: string
          id: string
          invitee_email: string
          invitee_id: string | null
          inviter_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          invitee_email: string
          invitee_id?: string | null
          inviter_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          invitee_email?: string
          invitee_id?: string | null
          inviter_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_invites_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_members: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          leader_id: string
          max_members: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          leader_id: string
          max_members?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          leader_id?: string
          max_members?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      gamification_settings: {
        Row: {
          action_type: string
          category: string
          created_at: string
          description: string | null
          id: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          action_type: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          action_type?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      level_config: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          level_number: number
          tier: string
          title: string
          updated_at: string
          xp_required: number
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          level_number: number
          tier?: string
          title: string
          updated_at?: string
          xp_required: number
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          level_number?: number
          tier?: string
          title?: string
          updated_at?: string
          xp_required?: number
        }
        Relationships: []
      }
      notes: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          description: string | null
          id: string
          priority: string
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          course: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_skipped: boolean | null
          semester_end: string | null
          semester_start: string | null
          shift: string | null
          university: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar?: string | null
          course?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_skipped?: boolean | null
          semester_end?: string | null
          semester_start?: string | null
          shift?: string | null
          university?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar?: string | null
          course?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_skipped?: boolean | null
          semester_end?: string | null
          semester_start?: string | null
          shift?: string | null
          university?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          attempts: number
          created_at: string
          id: string
          ip_address: unknown | null
          updated_at: string
          user_id: string | null
          window_end: string
          window_start: string
        }
        Insert: {
          action_type: string
          attempts?: number
          created_at?: string
          id?: string
          ip_address?: unknown | null
          updated_at?: string
          user_id?: string | null
          window_end: string
          window_start?: string
        }
        Update: {
          action_type?: string
          attempts?: number
          created_at?: string
          id?: string
          ip_address?: unknown | null
          updated_at?: string
          user_id?: string | null
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      schedule_slots: {
        Row: {
          created_at: string
          day: number
          id: string
          subject_id: string
          time_slot: number
          user_id: string
        }
        Insert: {
          created_at?: string
          day: number
          id?: string
          subject_id: string
          time_slot: number
          user_id: string
        }
        Update: {
          created_at?: string
          day?: number
          id?: string
          subject_id?: string
          time_slot?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_slots_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      semester_history: {
        Row: {
          absences_data: Json | null
          achievements_data: Json | null
          course: string | null
          created_at: string
          grades_data: Json | null
          id: string
          notes_data: Json | null
          semester_end: string
          semester_start: string
          shift: string | null
          subjects_data: Json | null
          university: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          absences_data?: Json | null
          achievements_data?: Json | null
          course?: string | null
          created_at?: string
          grades_data?: Json | null
          id?: string
          notes_data?: Json | null
          semester_end: string
          semester_start: string
          shift?: string | null
          subjects_data?: Json | null
          university?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          absences_data?: Json | null
          achievements_data?: Json | null
          course?: string | null
          created_at?: string
          grades_data?: Json | null
          id?: string
          notes_data?: Json | null
          semester_end?: string
          semester_start?: string
          shift?: string | null
          subjects_data?: Json | null
          university?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_grades: {
        Row: {
          assessment_id: string
          created_at: string
          feedback: string | null
          graded_at: string | null
          id: string
          score: number | null
          student_id: string
          submission_status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          id?: string
          score?: number | null
          student_id: string
          submission_status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          id?: string
          score?: number | null
          student_id?: string
          submission_status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_grades_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "teacher_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string
          created_at: string
          current_absences: number
          id: string
          max_absences: number
          name: string
          updated_at: string
          user_id: string
          weekly_hours: number
        }
        Insert: {
          color: string
          created_at?: string
          current_absences?: number
          id?: string
          max_absences?: number
          name: string
          updated_at?: string
          user_id: string
          weekly_hours?: number
        }
        Update: {
          color?: string
          created_at?: string
          current_absences?: number
          id?: string
          max_absences?: number
          name?: string
          updated_at?: string
          user_id?: string
          weekly_hours?: number
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          editable_by: string[]
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          editable_by?: string[]
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          editable_by?: string[]
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      teacher_assessments: {
        Row: {
          assessment_date: string
          assessment_type: string
          class_id: string
          created_at: string
          description: string | null
          id: string
          max_score: number
          title: string
          updated_at: string
        }
        Insert: {
          assessment_date: string
          assessment_type: string
          class_id: string
          created_at?: string
          description?: string | null
          id?: string
          max_score?: number
          title: string
          updated_at?: string
        }
        Update: {
          assessment_date?: string
          assessment_type?: string
          class_id?: string
          created_at?: string
          description?: string | null
          id?: string
          max_score?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assessments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "teacher_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_class_students: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_class_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "teacher_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_classes: {
        Row: {
          class_code: string
          class_name: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_students: number
          maximum_grade: number | null
          minimum_grade: number | null
          subject_name: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          class_code: string
          class_name: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_students?: number
          maximum_grade?: number | null
          minimum_grade?: number | null
          subject_name: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          class_code?: string
          class_name?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_students?: number
          maximum_grade?: number | null
          minimum_grade?: number | null
          subject_name?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_subjects: {
        Row: {
          created_at: string
          id: string
          subject_name: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          subject_name: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          subject_name?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_description: string
          badge_icon: string
          badge_id: string
          badge_name: string
          badge_type: string
          created_at: string
          earned_date: string
          expires_at: string | null
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          badge_description: string
          badge_icon: string
          badge_id: string
          badge_name: string
          badge_type: string
          created_at?: string
          earned_date: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          badge_description?: string
          badge_icon?: string
          badge_id?: string
          badge_name?: string
          badge_type?: string
          created_at?: string
          earned_date?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_bans: {
        Row: {
          ban_type: string
          banned_at: string
          banned_by: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          reason: string
          revoked_at: string | null
          revoked_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ban_type?: string
          banned_at?: string
          banned_by: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason: string
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ban_type?: string
          banned_at?: string
          banned_by?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_levels: {
        Row: {
          created_at: string
          current_tier: string
          experience_points: number
          id: string
          level: number
          level_progress: number
          total_experience: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_tier?: string
          experience_points?: number
          id?: string
          level?: number
          level_progress?: number
          total_experience?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_tier?: string
          experience_points?: number
          id?: string
          level?: number
          level_progress?: number
          total_experience?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          absences: boolean
          achievements: boolean
          created_at: string
          grade: boolean
          id: string
          notes: boolean
          profile: boolean
          reminders: boolean
          subjects: boolean
          updated_at: string
          user_id: string
          xp_rewards: boolean
        }
        Insert: {
          absences?: boolean
          achievements?: boolean
          created_at?: string
          grade?: boolean
          id?: string
          notes?: boolean
          profile?: boolean
          reminders?: boolean
          subjects?: boolean
          updated_at?: string
          user_id: string
          xp_rewards?: boolean
        }
        Update: {
          absences?: boolean
          achievements?: boolean
          created_at?: string
          grade?: boolean
          id?: string
          notes?: boolean
          profile?: boolean
          reminders?: boolean
          subjects?: boolean
          updated_at?: string
          user_id?: string
          xp_rewards?: boolean
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          theme_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          theme_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          theme_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_time_slots: {
        Row: {
          created_at: string
          duration: number
          end_time: string
          id: string
          slot_order: number
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration: number
          end_time: string
          id?: string
          slot_order?: number
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number
          end_time?: string
          id?: string
          slot_order?: number
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_level: {
        Args: { total_xp: number }
        Returns: Json
      }
      check_admin_permissions: {
        Args: { user_id_param: string; required_permission?: string }
        Returns: boolean
      }
      check_admin_status_safe: {
        Args: { user_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_user_id?: string
          p_ip_address?: unknown
        }
        Returns: boolean
      }
      check_student_access: {
        Args: { user_id_param: string; class_id_param: string }
        Returns: boolean
      }
      check_teacher_access: {
        Args: { user_id_param: string; teacher_id_check: string }
        Returns: boolean
      }
      check_user_admin_status: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      clear_all_absence_notifications: {
        Args: { class_id_param: string }
        Returns: number
      }
      clear_old_absence_notifications: {
        Args: { class_id_param: string; days_old?: number }
        Returns: number
      }
      gen_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_class_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_class_code_safe: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_leaderboard_with_profiles: {
        Args: { limit_count?: number }
        Returns: {
          user_id: string
          level: number
          total_experience: number
          current_tier: string
          email: string
          course: string
          avatar: string
        }[]
      }
      get_system_analytics: {
        Args: { days_back?: number }
        Returns: Json
      }
      get_user_class_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_user_class_memberships: {
        Args: { user_id_param: string }
        Returns: string[]
      }
      get_user_logs: {
        Args: {
          limit_count?: number
          offset_count?: number
          filter_user_id?: string
          filter_action?: string
          filter_entity_type?: string
        }
        Returns: {
          id: string
          user_id: string
          user_email: string
          action: string
          entity_type: string
          entity_id: string
          details: Json
          ip_address: unknown
          user_agent: string
          created_at: string
        }[]
      }
      get_user_rank: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_user_statistics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      has_pending_invite: {
        Args: { class_id: string; user_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_admin_safe: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_admin_safe_teacher: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_admin_ultra_safe: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_bootstrap_admin: {
        Args: { user_email: string }
        Returns: boolean
      }
      is_class_leader: {
        Args: { class_id: string; user_id: string }
        Returns: boolean
      }
      is_class_member: {
        Args: { class_id: string; user_id: string }
        Returns: boolean
      }
      is_super_admin_safe: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_teacher: {
        Args: { user_id_param?: string }
        Returns: boolean
      }
      is_teacher_role: {
        Args: { user_id_param?: string }
        Returns: boolean
      }
      is_teacher_safe: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      log_user_action: {
        Args: {
          user_id: string
          action: string
          entity_type: string
          entity_id?: string
          details?: Json
        }
        Returns: undefined
      }
      reset_user_rankings: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_user_level: {
        Args: { user_id_param: string; xp_gained: number }
        Returns: Json
      }
      user_can_access_class: {
        Args: { class_id_param: string }
        Returns: boolean
      }
      user_has_accepted_invite: {
        Args: { class_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
