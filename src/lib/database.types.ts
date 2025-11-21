/**
 * Database type definitions based on the Python SQLAlchemy models
 *
 * This matches your actual database schema with organization-based multi-tenancy
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type RoleEnum = 'owner' | 'admin' | 'member';
export type JobStatusEnum = 'queued' | 'running' | 'success' | 'error';
export type DocumentStatusEnum = 'queued' | 'processing' | 'success' | 'error';
export type ComplexityEnum = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
export type RiskEnum = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
export type FitLevelEnum = 'GOOD' | 'PARTIAL' | 'COOPERATION' | 'LOW' | 'UNKNOWN';

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      organization_members: {
        Row: {
          org_id: string
          user_id: string
          role: RoleEnum
        }
        Insert: {
          org_id: string
          user_id: string
          role: RoleEnum
        }
        Update: {
          org_id?: string
          user_id?: string
          role?: RoleEnum
        }
      }
      organization_profiles: {
            Row: {
              org_id: string
              report_lang: string | null
              profile_text: string | null
            }
            Insert: {
              org_id: string
              report_lang?: string | null
              profile_text?: string | null
            }
            Update: {
              org_id?: string
              report_lang?: string | null
              profile_text?: string | null
            }
          }
      documents: {
        Row: {
          id: string
          org_id: string
          user_id: string
          file_name: string
          raw_bucket: string
          raw_storage_key: string
          thumbnail_bucket: string | null
          thumbnail_storage_key: string | null
          page_count: number | null
          last_status: DocumentStatusEnum
          last_error: string | null
          last_processed_at: string | null
          last_job_id: string | null
          primary_part_id: string | null
          detected_parts_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          file_name: string
          raw_bucket?: string
          raw_storage_key: string
          thumbnail_bucket?: string | null
          thumbnail_storage_key?: string | null
          page_count?: number | null
          last_status?: DocumentStatusEnum
          last_error?: string | null
          last_processed_at?: string | null
          last_job_id?: string | null
          primary_part_id?: string | null
          detected_parts_count?: number | null
          created_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['documents']['Insert'], 'id'>>
      }
      parts: {
        Row: {
          id: string
          org_id: string
          part_number: string | null
          revision: string | null
          display_name: string | null
          material: string | null
          envelope: Json | null
          overall_complexity: ComplexityEnum | null
          report_json: Json | null
          user_overrides: Json | null
          render_bucket: string | null
          render_storage_key: string | null
          created_at: string
          last_updated: string
        }
        Insert: {
          id?: string
          org_id: string
          part_number?: string | null
          revision?: string | null
          display_name?: string | null
          material?: string | null
          envelope?: Json | null
          overall_complexity?: ComplexityEnum | null
          report_json?: Json | null
          user_overrides?: Json | null
          render_bucket?: string | null
          render_storage_key?: string | null
          created_at?: string
          last_updated?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['parts']['Insert'], 'id'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      role_enum: RoleEnum
      job_status_enum: JobStatusEnum
      document_status_enum: DocumentStatusEnum
      complexity_enum: ComplexityEnum
      risk_enum: RiskEnum
      fit_level_enum: FitLevelEnum
    }
  }
}
