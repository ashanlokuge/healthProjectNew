/*
  # Hazard Reporting System Database Schema

  1. New Tables
    - `profiles` - User profiles with roles
    - `hazard_reports` - Hazard reports submitted by users
    - `assignments` - Task assignments from reviewers to assignees
    - `evidences` - Evidence files uploaded by assignees

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'reviewer', 'assignee');
CREATE TYPE report_status AS ENUM ('submitted', 'assigned', 'in_progress', 'in_review', 'completed', 'approved', 'rejected');

-- Profiles table for user roles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role user_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Hazard reports table
CREATE TABLE IF NOT EXISTS hazard_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  site text NOT NULL,
  department text NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  hazard_title text NOT NULL,
  hazard_description text,
  date_of_finding date NOT NULL,
  date_of_reporting date NOT NULL,
  risk_level text,
  hazard_characteristics text,
  responsible_department text,
  image_urls text[],
  status report_status DEFAULT 'submitted',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hazard_report_id uuid REFERENCES hazard_reports(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_completion_date date NOT NULL,
  remark text,
  assigned_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  reviewed_at timestamptz,
  is_approved boolean,
  review_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Evidence table
CREATE TABLE IF NOT EXISTS evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  uploaded_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hazard_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidences ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Hazard reports policies
CREATE POLICY "Users can create own reports"
  ON hazard_reports FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can read own reports"
  ON hazard_reports FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Reviewers can read all reports"
  ON hazard_reports FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'));

CREATE POLICY "Reviewers can update reports"
  ON hazard_reports FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'));

-- Assignments policies
CREATE POLICY "Reviewers can create assignments"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'));

CREATE POLICY "Reviewers can read assignments they created"
  ON assignments FOR SELECT
  TO authenticated
  USING (reviewer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Assignees can read their assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (assignee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Assignees can update their assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING (assignee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Evidence policies
CREATE POLICY "Assignees can create evidence"
  ON evidences FOR INSERT
  TO authenticated
  WITH CHECK (assignment_id IN (
    SELECT id FROM assignments 
    WHERE assignee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can read evidence for their assignments"
  ON evidences FOR SELECT
  TO authenticated
  USING (assignment_id IN (
    SELECT a.id FROM assignments a
    JOIN profiles p ON (a.assignee_id = p.id OR a.reviewer_id = p.id)
    WHERE p.user_id = auth.uid()
  ));