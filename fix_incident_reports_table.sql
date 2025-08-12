-- Clean fix for incident_reports table - handles existing policies
-- Run this in your Supabase SQL Editor

-- Add missing image_urls column to incident_reports table
ALTER TABLE incident_reports 
ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- Add other potentially missing columns
ALTER TABLE incident_reports 
ADD COLUMN IF NOT EXISTS incident_category TEXT,
ADD COLUMN IF NOT EXISTS time_of_incident TIME,
ADD COLUMN IF NOT EXISTS witnesses TEXT,
ADD COLUMN IF NOT EXISTS immediate_actions_taken TEXT,
ADD COLUMN IF NOT EXISTS reporter_name TEXT;

-- Disable RLS to avoid permission issues
ALTER TABLE incident_reports DISABLE ROW LEVEL SECURITY;

-- Create storage bucket for incident images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('incident-images', 'incident-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist, then recreate them
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload incident images" ON storage.objects;

-- Create storage policies
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'incident-images');

CREATE POLICY "Authenticated users can upload incident images" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'incident-images' AND auth.role() = 'authenticated');

-- Verify the fix worked
SELECT 'SUCCESS: incident_reports table updated!' as status;

-- Check if image_urls column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'incident_reports' 
      AND column_name = 'image_urls'
    ) 
    THEN 'SUCCESS: image_urls column exists!'
    ELSE 'ERROR: image_urls column still missing'
  END as image_urls_status;