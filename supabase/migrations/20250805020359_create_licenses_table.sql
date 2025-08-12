-- Create licenses table for license management system
CREATE TABLE IF NOT EXISTS licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  license_name TEXT NOT NULL,
  responsible_person TEXT NOT NULL,
  authority TEXT NOT NULL,
  validity_days INTEGER NOT NULL,
  apply_before_days INTEGER NOT NULL,
  date_of_renewal DATE NOT NULL,
  next_renewal_date DATE,
  remark TEXT,
  document_submission TEXT,
  reminder BOOLEAN DEFAULT false,
  escalation01 BOOLEAN DEFAULT false,
  escalation02 BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending_renewal', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_next_renewal_date ON licenses(next_renewal_date);
CREATE INDEX IF NOT EXISTS idx_licenses_reminder ON licenses(reminder);

-- Enable Row Level Security
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view/edit their own licenses
CREATE POLICY "Users can view own licenses" ON licenses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own licenses" ON licenses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own licenses" ON licenses
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own licenses" ON licenses
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Reviewers can view all licenses
CREATE POLICY "Reviewers can view all licenses" ON licenses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'reviewer'
    )
  );

-- Create function to automatically calculate next renewal date
CREATE OR REPLACE FUNCTION calculate_next_renewal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_of_renewal IS NOT NULL AND NEW.validity_days > 0 THEN
    NEW.next_renewal_date = NEW.date_of_renewal + INTERVAL '1 day' * NEW.validity_days;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate next renewal date
CREATE TRIGGER trigger_calculate_next_renewal
  BEFORE INSERT OR UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION calculate_next_renewal();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
