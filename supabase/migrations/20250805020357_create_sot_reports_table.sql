-- Create sot_reports table for SOT (Start of Task) reporting
CREATE TABLE IF NOT EXISTS sot_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  site TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  personal_category TEXT NOT NULL,
  details_if_observation TEXT,
  date DATE NOT NULL,
  date_of_reporting DATE NOT NULL,
  time_duration TEXT,
  type_of_work TEXT NOT NULL,
  add_action TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sot_reports_user_id ON sot_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_sot_reports_status ON sot_reports(status);
CREATE INDEX IF NOT EXISTS idx_sot_reports_created_at ON sot_reports(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE sot_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own reports
CREATE POLICY "Users can view own SOT reports" ON sot_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own reports
CREATE POLICY "Users can insert own SOT reports" ON sot_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports (if not yet reviewed)
CREATE POLICY "Users can update own SOT reports" ON sot_reports
  FOR UPDATE USING (auth.uid() = user_id AND status = 'submitted');

-- Reviewers can view all reports
CREATE POLICY "Reviewers can view all SOT reports" ON sot_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'reviewer'
    )
  );

-- Reviewers can update report status
CREATE POLICY "Reviewers can update SOT report status" ON sot_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'reviewer'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sot_reports_updated_at 
  BEFORE UPDATE ON sot_reports 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
