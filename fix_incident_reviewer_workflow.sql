-- Comprehensive Fix for Incident Reviewer Workflow Issues
-- Run this in your Supabase SQL Editor

-- 1. Check if incident_assignments table exists
SELECT '=== CHECKING INCIDENT_ASSIGNMENTS TABLE ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'incident_assignments';

-- 2. Create incident_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS incident_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_report_id uuid REFERENCES incident_reports(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_completion_date date NOT NULL,
  remark text,
  assigned_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  reviewed_at timestamptz,
  review_status text DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  review_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Check current table structure
SELECT '=== CURRENT INCIDENT_ASSIGNMENTS TABLE STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'incident_assignments' 
ORDER BY ordinal_position;

-- 4. Ensure all necessary columns exist
DO $$ 
BEGIN
    -- Add reviewer_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incident_assignments' AND column_name = 'reviewer_id'
    ) THEN
        ALTER TABLE incident_assignments ADD COLUMN reviewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added reviewer_id column to incident_assignments table';
    ELSE
        RAISE NOTICE 'reviewer_id column already exists in incident_assignments table';
    END IF;

    -- Add review_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incident_assignments' AND column_name = 'review_status'
    ) THEN
        ALTER TABLE incident_assignments ADD COLUMN review_status text DEFAULT 'pending';
        RAISE NOTICE 'Added review_status column to incident_assignments table';
    ELSE
        RAISE NOTICE 'review_status column already exists in incident_assignments table';
    END IF;

    -- Add reviewed_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incident_assignments' AND column_name = 'reviewed_at'
    ) THEN
        ALTER TABLE incident_assignments ADD COLUMN reviewed_at timestamptz;
        RAISE NOTICE 'Added reviewed_at column to incident_assignments table';
    ELSE
        RAISE NOTICE 'reviewed_at column already exists in incident_assignments table';
    END IF;

    -- Add review_reason column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incident_assignments' AND column_name = 'review_reason'
    ) THEN
        ALTER TABLE incident_assignments ADD COLUMN review_reason text;
        RAISE NOTICE 'Added review_reason column to incident_assignments table';
    ELSE
        RAISE NOTICE 'review_reason column already exists in incident_assignments table';
    END IF;
END $$;

-- 5. Update existing assignments to have proper review_status
UPDATE incident_assignments 
SET review_status = 'pending' 
WHERE completed_at IS NOT NULL AND review_status IS NULL;

-- 6. Enable RLS on incident_assignments table
ALTER TABLE incident_assignments ENABLE ROW LEVEL SECURITY;

-- 7. Check current RLS policies
SELECT '=== CURRENT RLS POLICIES ===' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'incident_assignments' 
AND schemaname = 'public'
ORDER BY policyname;

-- 8. Drop and recreate RLS policies for incident_assignments table
-- First, drop all existing policies
DROP POLICY IF EXISTS "Reviewers can create incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Reviewers can read incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Reviewers can update incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Assignees can read their incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Assignees can update their incident assignments" ON incident_assignments;

-- Create comprehensive policies for incident_assignments
-- Policy for reviewers to create incident assignments
CREATE POLICY "Reviewers can create incident assignments"
  ON incident_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

-- Policy for reviewers to read all incident assignments (needed for dashboard)
CREATE POLICY "Reviewers can read incident assignments"
  ON incident_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

-- Policy for reviewers to update incident assignments they created
CREATE POLICY "Reviewers can update incident assignments"
  ON incident_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

-- Policy for assignees to read their incident assignments
CREATE POLICY "Assignees can read their incident assignments"
  ON incident_assignments FOR SELECT
  TO authenticated
  USING (
    assignee_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Policy for assignees to update their incident assignments
CREATE POLICY "Assignees can update their incident assignments"
  ON incident_assignments FOR UPDATE
  TO authenticated
  USING (
    assignee_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    assignee_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- 9. Check current data to understand the state
SELECT '=== CURRENT INCIDENT_ASSIGNMENTS DATA ===' as info;
SELECT 
    a.id,
    a.incident_report_id,
    a.reviewer_id,
    a.assignee_id,
    a.completed_at,
    a.review_status,
    a.reviewed_at,
    ir.incident_title,
    ir.status as report_status,
    reviewer.email as reviewer_email,
    assignee.email as assignee_email
FROM incident_assignments a
LEFT JOIN incident_reports ir ON a.incident_report_id = ir.id
LEFT JOIN profiles reviewer ON a.reviewer_id = reviewer.id
LEFT JOIN profiles assignee ON a.assignee_id = assignee.id
ORDER BY a.created_at DESC
LIMIT 10;

-- 10. Test the policies by checking what the current user can see
SELECT '=== TESTING CURRENT USER PERMISSIONS ===' as info;
SELECT 
    'Current user can read incident assignments: ' || 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM incident_assignments 
            WHERE assignee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
            OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer')
        ) THEN 'YES'
        ELSE 'NO'
    END as read_permission,
    'Current user can update incident assignments: ' || 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM incident_assignments 
            WHERE assignee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
            OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer')
        ) THEN 'YES'
        ELSE 'NO'
    END as update_permission;

-- 11. Show final table structure
SELECT '=== FINAL INCIDENT_ASSIGNMENTS TABLE STRUCTURE ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'incident_assignments' 
ORDER BY ordinal_position;

-- 12. Show final RLS policies
SELECT '=== FINAL RLS POLICIES ===' as info;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'incident_assignments' 
AND schemaname = 'public'
ORDER BY policyname;

-- 13. Check if incident_reports table exists and has proper structure
SELECT '=== CHECKING INCIDENT_REPORTS TABLE ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'incident_reports';

-- 14. Create incident_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_title text NOT NULL,
  description text NOT NULL,
  site text NOT NULL,
  department text NOT NULL,
  location text NOT NULL,
  date_of_incident date NOT NULL,
  time_of_incident text,
  date_of_reporting date NOT NULL,
  reporter_name text,
  incident_category text,
  severity_level text,
  status text DEFAULT 'submitted',
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 15. Enable RLS on incident_reports table
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- 16. Create RLS policies for incident_reports
DROP POLICY IF EXISTS "Users can create incident reports" ON incident_reports;
DROP POLICY IF EXISTS "Users can read their incident reports" ON incident_reports;
DROP POLICY IF EXISTS "Reviewers can read all incident reports" ON incident_reports;
DROP POLICY IF EXISTS "Reviewers can update incident reports" ON incident_reports;

CREATE POLICY "Users can create incident reports"
  ON incident_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can read their incident reports"
  ON incident_reports FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Reviewers can read all incident reports"
  ON incident_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

CREATE POLICY "Reviewers can update incident reports"
  ON incident_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  ); 