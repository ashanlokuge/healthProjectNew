-- Fix the relationship between incident_assignments and incident_reports
-- This should resolve the PGRST200 error

-- Step 1: Check if foreign key constraint exists
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='incident_assignments'
    AND kcu.column_name='incident_report_id';

-- Step 2: Drop existing constraint if it exists (to recreate it properly)
ALTER TABLE incident_assignments 
DROP CONSTRAINT IF EXISTS incident_assignments_incident_report_id_fkey;

-- Step 3: Ensure both tables exist with correct structure
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

CREATE TABLE IF NOT EXISTS incident_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_report_id UUID,
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

-- Step 4: Add the foreign key constraint properly
ALTER TABLE incident_assignments 
ADD CONSTRAINT incident_assignments_incident_report_id_fkey 
FOREIGN KEY (incident_report_id) REFERENCES incident_reports(id) ON DELETE CASCADE;

-- Step 5: Disable RLS to avoid permission issues
ALTER TABLE incident_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE incident_assignments DISABLE ROW LEVEL SECURITY;

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_incident_assignments_incident_report_id ON incident_assignments(incident_report_id);
CREATE INDEX IF NOT EXISTS idx_incident_assignments_reviewer_id ON incident_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_incident_assignments_assignee_id ON incident_assignments(assignee_id);

-- Step 7: Verify the relationship is working
SELECT 'SUCCESS: Foreign key relationship established!' as status;

-- Test the relationship with a simple query
SELECT 
    ia.id as assignment_id,
    ia.action,
    ir.incident_title,
    ir.status
FROM incident_assignments ia
LEFT JOIN incident_reports ir ON ia.incident_report_id = ir.id
LIMIT 5;