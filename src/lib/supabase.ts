import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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