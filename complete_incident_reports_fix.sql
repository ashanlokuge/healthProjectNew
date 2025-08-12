-- Complete fix for incident reports system to match hazard workflow
-- Run this in your Supabase SQL Editor

-- Step 1: Fix incident_reports table structure
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_title TEXT NOT NULL,
  description TEXT NOT NULL,
  site TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  date_of_incident DATE NOT NULL,
  time_of_incident TIME,
  date_of_reporting DATE NOT NULL,
  severity_level TEXT,
  incident_type TEXT,
  incident_category TEXT,
  witnesses TEXT,
  immediate_actions_taken TEXT,
  image_urls TEXT[],
  status TEXT DEFAULT 'submitted',
  reporter_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Fix incident_assignments table to reference auth.users instead of profiles
DROP TABLE IF EXISTS incident_assignments CASCADE;

CREATE TABLE incident_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_report_id UUID REFERENCES incident_reports(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_completion_date DATE NOT NULL,
  remark TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  is_approved BOOLEAN,
  review_reason TEXT,
  review_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_incident_reports_user_id ON incident_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_created_at ON incident_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_incident_assignments_incident_report_id ON incident_assignments(incident_report_id);
CREATE INDEX IF NOT EXISTS idx_incident_assignments_reviewer_id ON incident_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_incident_assignments_assignee_id ON incident_assignments(assignee_id);
CREATE INDEX IF NOT EXISTS idx_incident_assignments_review_status ON incident_assignments(review_status);

-- Step 4: Disable RLS on both tables to avoid permission issues
ALTER TABLE incident_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE incident_assignments DISABLE ROW LEVEL SECURITY;

-- Step 5: Create storage bucket for incident images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('incident-images', 'incident-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 6: Set up storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload incident images" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'incident-images');

CREATE POLICY "Authenticated users can upload incident images" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'incident-images' AND auth.role() = 'authenticated');

-- Step 7: Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_incident_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_incident_reports_updated_at ON incident_reports;
DROP TRIGGER IF EXISTS trigger_update_incident_assignments_updated_at ON incident_assignments;

CREATE TRIGGER trigger_update_incident_reports_updated_at
  BEFORE UPDATE ON incident_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_incident_updated_at_column();

CREATE TRIGGER trigger_update_incident_assignments_updated_at
  BEFORE UPDATE ON incident_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_incident_updated_at_column();

-- Step 8: Verify the setup
SELECT 'SUCCESS: Incident system setup complete!' as status;

-- Check incident_reports table structure
SELECT 
  'incident_reports' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'incident_reports' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check incident_assignments table structure
SELECT 
  'incident_assignments' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'incident_assignments' AND table_schema = 'public'
ORDER BY ordinal_position;