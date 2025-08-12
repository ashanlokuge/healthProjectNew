import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug environment variables in development
if (import.meta.env.DEV) {
  console.log('🔧 Environment Variables Debug:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'Set' : 'Missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Set' : 'Missing',
    NODE_ENV: import.meta.env.MODE,
  });
}

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Set' : 'Missing',
  });
  
  // In production, show a user-friendly error
  if (import.meta.env.PROD) {
    throw new Error('Application configuration error. Please contact support.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client for admin operations (bypasses RLS)
// Note: This should only be used for server-side operations
// For now, we'll use it to fix the evidence upload issue
export const supabaseAdmin = createClient(
  supabaseUrl,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
);

export type UserRole = 'user' | 'reviewer' | 'assignee';
export type ReportStatus = 'submitted' | 'assigned' | 'in_progress' | 'completed' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface HazardReport {
  id: string;
  user_id: string;
  site: string;
  department: string;
  location: string;
  description: string;
  hazard_title: string;
  hazard_description?: string;
  date_of_finding: string;
  date_of_reporting: string;
  risk_level?: string;
  hazard_characteristics?: string;
  responsible_department?: string;
  image_urls?: string[];
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  hazard_report_id: string;
  reviewer_id: string;
  assignee_id: string;
  action: string;
  target_completion_date: string;
  remark?: string;
  assigned_at: string;
  completed_at?: string;
  reviewed_at?: string;
  review_status?: 'pending' | 'approved' | 'rejected';
  is_approved?: boolean;
  review_reason?: string;
  created_at: string;
  updated_at: string;
  hazard_reports?: HazardReport;
  profiles?: Profile;
}

export interface Evidence {
  id: string;
  assignment_id: string;
  file_url: string;
  file_name: string;
  file_type?: string;
  uploaded_at: string;
}

export interface SOTReport {
  id: string;
  user_id: string;
  site: string;
  department: string;
  location: string;
  personal_category: string;
  details_if_observation?: string;
  date: string;
  date_of_reporting: string;
  time_duration?: string;
  type_of_work: string;
  add_action?: string;
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface License {
  id: string;
  user_id: string;
  license_name: string;
  responsible_person: string;
  authority: string;
  validity_days: number;
  apply_before_days: number;
  date_of_renewal: string;
  next_renewal_date?: string;
  remark?: string;
  document_submission?: string;
  reminder: boolean;
  escalation01: boolean;
  escalation02: boolean;
  status: 'active' | 'expired' | 'pending_renewal' | 'suspended';
  created_at: string;
  updated_at: string;
}