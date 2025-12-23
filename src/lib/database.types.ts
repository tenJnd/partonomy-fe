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
    | Json[];

export type RoleEnum = "owner" | "admin" | "member";
export type JobStatusEnum = "queued" | "running" | "success" | "error";
export type DocumentStatusEnum = "queued" | "processing" | "success" | "error";
export type ComplexityEnum = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
export type RiskEnum = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
export type FitLevelEnum = "GOOD" | "PARTIAL" | "COOPERATION" | "LOW" | "UNKNOWN";
export type TierEnum = "free" | "trial" | "starter" | "pro" | "enterprise";
export type WorkflowStatusEnum = 'new' | 'in_progress' | 'done' | 'ignored';
export type PriorityEnum = 'low' | 'normal' | 'high' | 'hot';
export type ProjectStatusEnum = 'open' | 'in_progress' | 'closed' | 'archived'
export type ProjectPriorityEnum = 'low' | 'normal' | 'high' | 'hot';


export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: {
                    id: string;
                    name: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    created_at?: string;
                };
            };
            organization_members: {
                Row: {
                    org_id: string;
                    user_id: string;
                    role: RoleEnum;
                };
                Insert: {
                    org_id: string;
                    user_id: string;
                    role: RoleEnum;
                };
                Update: {
                    org_id?: string;
                    user_id?: string;
                    role?: RoleEnum;
                };
            };
            organization_profiles: {
                Row: {
                    org_id: string;
                    report_lang: string | null;
                    profile_text: string | null;
                };
                Insert: {
                    org_id: string;
                    report_lang?: string | null;
                    profile_text?: string | null;
                };
                Update: {
                    org_id?: string;
                    report_lang?: string | null;
                    profile_text?: string | null;
                };
            };
            organization_invites: {
                Row: {
                    id: string;
                    org_id: string;
                    token: string;
                    invited_by_user_id: string;
                    invited_email: string | null;
                    role: RoleEnum;
                    expires_at: string;
                    accepted_at: string | null;
                    accepted_by_user_id: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    org_id: string;
                    token: string;
                    invited_by_user_id: string;
                    invited_email?: string | null;
                    role: RoleEnum;
                    expires_at: string;
                    accepted_at?: string | null;
                    accepted_by_user_id?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    org_id?: string;
                    token?: string;
                    invited_by_user_id?: string;
                    invited_email?: string | null;
                    role?: RoleEnum;
                    expires_at?: string;
                    accepted_at?: string | null;
                    accepted_by_user_id?: string | null;
                    created_at?: string;
                };
            };
            documents: {
                Row: {
                    id: string;
                    org_id: string;
                    user_id: string;
                    file_name: string;
                    raw_bucket: string;
                    raw_storage_key: string;
                    thumbnail_bucket: string | null;
                    thumbnail_storage_key: string | null;
                    page_count: number | null;
                    last_status: DocumentStatusEnum;
                    last_error: string | null;
                    last_processed_at: string | null;
                    last_job_id: string | null;
                    detected_parts_count: number | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    org_id: string;
                    user_id: string;
                    file_name: string;
                    raw_bucket?: string;
                    raw_storage_key: string;
                    thumbnail_bucket?: string | null;
                    thumbnail_storage_key?: string | null;
                    page_count?: number | null;
                    last_status?: DocumentStatusEnum;
                    last_error?: string | null;
                    last_processed_at?: string | null;
                    last_job_id?: string | null;
                    detected_parts_count?: number | null;
                    created_at?: string;
                };
                Update: Partial<
                    Omit<Database["public"]["Tables"]["documents"]["Insert"], "id">
                >;
            };
            parts: {
                Row: {
                    id: string;
                    org_id: string;
                    part_number: string | null;
                    revision: string | null;
                    display_name: string | null;
                    material: string | null;
                    envelope: Json | null;
                    overall_complexity: ComplexityEnum | null;
                    report_json: Json | null;
                    user_overrides: Json | null;
                    render_bucket: string | null;
                    render_storage_key: string | null;
                    created_at: string;
                    last_updated: string;
                    workflow_status: WorkflowStatusEnum | null;
                    priority: PriorityEnum | null;
                    fit_level: FitLevelEnum | null;
                };
                Insert: {
                    id?: string;
                    org_id: string;
                    part_number?: string | null;
                    revision?: string | null;
                    display_name?: string | null;
                    material?: string | null;
                    envelope?: Json | null;
                    overall_complexity?: ComplexityEnum | null;
                    report_json?: Json | null;
                    user_overrides?: Json | null;
                    render_bucket?: string | null;
                    render_storage_key?: string | null;
                    created_at?: string;
                    last_updated?: string;
                    workflow_status?: WorkflowStatusEnum | null;
                    priority?: PriorityEnum | null;
                };
                Update: Partial<
                    Omit<Database["public"]["Tables"]["parts"]["Insert"], "id">
                >;
            };

            /**
             * NEW: link table pro document–part vztah
             * (používáš v DocumentDetail: from('document_parts')...)
             */
            document_parts: {
                Row: {
                    document_id: string;
                    part_id: string;
                    org_id: string;
                    created_at: string;
                };
                Insert: {
                    document_id: string;
                    part_id: string;
                    org_id: string;
                    created_at?: string;
                };
                Update: {
                    document_id?: string;
                    part_id?: string;
                    org_id?: string;
                    created_at?: string;
                };
            };

            /**
             * NEW: komentáře k partům
             */
            part_comments: {
                Row: {
                    id: string;
                    org_id: string;
                    part_id: string;
                    user_id: string;
                    author_name: string | null;
                    body: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    org_id: string;
                    part_id: string;
                    user_id: string;
                    author_name?: string | null;
                    body: string;
                    created_at?: string; // server_default now()
                    updated_at?: string; // server_default now()
                };
                Update: {
                    id?: string;
                    org_id?: string;
                    part_id?: string;
                    user_id?: string;
                    author_name?: string | null;
                    body?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            part_tags: {
                Row: {
                    id: string;
                    org_id: string;
                    part_id: string;
                    label: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    org_id: string;
                    part_id: string;
                    label: string;
                    created_at?: string;
                };
                Update: Partial<Omit<Database["public"]["Tables"]["part_tags"]["Insert"], "id">>;
            };
            part_favorites: {
                Row: {
                    id: string;
                    org_id: string;
                    part_id: string;
                    user_id: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    org_id: string;
                    part_id: string;
                    user_id: string;
                    created_at?: string;
                };
                Update: Partial<Omit<Database["public"]["Tables"]["part_favorites"]["Insert"], "id">>;
            };
            projects: {
                Row: {
                    id: string;
                    org_id: string;
                    created_by_user_id: string;
                    name: string;
                    description: string | null;
                    customer_name: string | null;
                    external_ref: string | null;
                    status: ProjectStatusEnum;
                    priority: ProjectPriorityEnum;
                    due_date: string | null;   // timestamptz -> string | null
                    meta: Json | null;         // JSONB z Python modelu
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;               // UUID default v DB
                    org_id: string;
                    created_by_user_id: string;
                    name: string;
                    description?: string | null;
                    customer_name?: string | null;
                    external_ref?: string | null;
                    status?: ProjectStatusEnum;        // default 'open'
                    priority?: ProjectPriorityEnum;    // default 'normal'
                    due_date?: string | null;
                    meta?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<
                    Omit<Database["public"]["Tables"]["projects"]["Insert"], "id">
                >;
            };
            project_parts: {
                Row: {
                    id: string;
                    org_id: string;
                    project_id: string;
                    part_id: string;
                    added_by_user_id: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;          // UUID generovaný v DB
                    org_id: string;
                    project_id: string;
                    part_id: string;
                    added_by_user_id: string;
                    created_at?: string;
                };
                Update: Partial<
                    Omit<Database["public"]["Tables"]["project_parts"]["Insert"], "id">
                >;
            };
            Views: {
                [_ in never]: never;
            };
            Functions: {
                [_ in never]: never;
            };
            Enums: {
                role_enum: RoleEnum;
                job_status_enum: JobStatusEnum;
                document_status_enum: DocumentStatusEnum;
                complexity_enum: ComplexityEnum;
                risk_enum: RiskEnum;
                fit_level_enum: FitLevelEnum;
                tier_enum: TierEnum;
                part_workflow_status_enum: WorkflowStatusEnum,
                part_priority_enum: PriorityEnum,
                project_status_enum: ProjectStatusEnum,
                project_priority_enum: ProjectPriorityEnum
            };
        };
    }
}