-- Fix Storage Buckets and Policies for Image Uploads
-- Run this script in your Supabase SQL Editor

-- 1. Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('hazard-images', 'hazard-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]),
  ('evidence-files', 'evidence-files', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain']::text[])
ON CONFLICT (id) DO NOTHING;

-- 2. Create RLS policies for hazard-images bucket
-- Allow authenticated users to upload images
CREATE POLICY "hazard_images_upload_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'hazard-images');

CREATE POLICY "hazard_images_read_policy" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'hazard-images');

CREATE POLICY "hazard_images_update_policy" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'hazard-images');

CREATE POLICY "hazard_images_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'hazard-images');

-- 3. Create RLS policies for evidence-files bucket
-- Allow authenticated users to upload evidence files
CREATE POLICY "evidence_files_upload_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence-files');

CREATE POLICY "evidence_files_read_policy" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'evidence-files');

CREATE POLICY "evidence_files_update_policy" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'evidence-files');

CREATE POLICY "evidence_files_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'evidence-files');

-- 4. Verify buckets were created
SELECT '=== STORAGE BUCKETS CREATED ===' as info;
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name IN ('hazard-images', 'evidence-files');

-- 5. Verify RLS policies were created
SELECT '=== STORAGE POLICIES CREATED ===' as info;
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
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%hazard_images%' OR policyname LIKE '%evidence_files%'
ORDER BY policyname;