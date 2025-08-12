-- Create incident_reports table to replace hazard_reports
-- Run this in your Supabase SQL Editor

-- Create incident_reports table with all required fields
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_incident_reports_user_id ON incident_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_created_at ON incident_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_incident_reports_date_of_incident ON incident_reports(date_of_incident);

-- Disable RLS to avoid permission issues (like we did with licenses)
ALTER TABLE incident_reports DISABLE ROW LEVEL SECURITY;

-- Create incident_assignments table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS incident_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_report_id UUID REFERENCES incident_reports(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Create indexes for incident_assignments
CREATE INDEX IF NOT EXISTS idx_incident_assignments_incident_report_id ON incident_assignments(incident_report_id);
CREATE INDEX IF NOT EXISTS idx_incident_assignments_reviewer_id ON incident_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_incident_assignments_assignee_id ON incident_assignments(assignee_id);
CREATE INDEX IF NOT EXISTS idx_incident_assignments_review_status ON incident_assignments(review_status);

-- Disable RLS on incident_assignments too
ALTER TABLE incident_assignments DISABLE ROW LEVEL SECURITY;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_incident_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
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

-- Migrate data from hazard_reports to incident_reports (if hazard_reports exists and has data)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'hazard_reports') THEN
    INSERT INTO incident_reports (
      id, user_id, incident_title, description, site, department, location,
      date_of_incident, date_of_reporting, severity_level, incident_type,
      image_urls, status, created_at, updated_at
    )
    SELECT 
      id, user_id, hazard_title, description, site, department, location,
      date_of_finding, date_of_reporting, risk_level, hazard_characteristics,
      image_urls, status, created_at, updated_at
    FROM hazard_reports
    WHERE NOT EXISTS (
      SELECT 1 FROM incident_reports WHERE incident_reports.id = hazard_reports.id
    );
    
    -- Migrate assignments if they exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assignments') THEN
      INSERT INTO incident_assignments (
        id, incident_report_id, reviewer_id, assignee_id, action,
        target_completion_date, remark, assigned_at, completed_at,
        reviewed_at, is_approved, review_reason, created_at, updated_at
      )
      SELECT 
        id, hazard_report_id, reviewer_id, assignee_id, action,
        target_completion_date, remark, assigned_at, completed_at,
        reviewed_at, is_approved, review_reason, created_at, updated_at
      FROM assignments
      WHERE NOT EXISTS (
        SELECT 1 FROM incident_assignments WHERE incident_assignments.id = assignments.id
      );
    END IF;
  END IF;
END $$;

-- Verify the setup
SELECT 'incident_reports table created successfully!' as status;

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'incident_reports' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if image_urls column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'incident_reports' 
      AND column_name = 'image_urls'
    ) 
    THEN 'image_urls column exists - incident submission should work!'
    ELSE 'image_urls column missing - there may be an issue'
  END as image_urls_status;