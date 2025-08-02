import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'teacher' | 'student'
          first_name: string
          last_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'admin' | 'teacher' | 'student'
          first_name: string
          last_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'teacher' | 'student'
          first_name?: string
          last_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          name: string
          description: string
          teacher_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          teacher_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          teacher_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          student_id: string
          course_id: string
          enrolled_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          enrolled_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          enrolled_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          student_id: string
          course_id: string
          date: string
          status: 'present' | 'absent' | 'late'
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          date: string
          status: 'present' | 'absent' | 'late'
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          date?: string
          status?: 'present' | 'absent' | 'late'
          created_at?: string
        }
      }
      grades: {
        Row: {
          id: string
          student_id: string
          course_id: string
          assignment_name: string
          score: number
          max_score: number
          grade_date: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          assignment_name: string
          score: number
          max_score: number
          grade_date: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          assignment_name?: string
          score?: number
          max_score?: number
          grade_date?: string
          created_at?: string
        }
      }
    }
  }
} 