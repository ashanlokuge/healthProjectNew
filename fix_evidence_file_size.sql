-- Fix Evidence File Size Limit
-- Run this script in your Supabase SQL Editor

-- Update the evidence-files bucket to allow larger files (100MB)
UPDATE storage.buckets 
SET file_size_limit = 104857600  -- 100MB in bytes
WHERE name = 'evidence-files';

-- Also update hazard-images bucket to allow larger files (100MB) 
UPDATE storage.buckets 
SET file_size_limit = 104857600  -- 100MB in bytes
WHERE name = 'hazard-images';

-- Verify the updated limits
SELECT '=== UPDATED STORAGE BUCKET LIMITS ===' as info;
SELECT 
    name,
    public,
    file_size_limit,
    file_size_limit / 1024 / 1024 as size_limit_mb,
    allowed_mime_types
FROM storage.buckets 
WHERE name IN ('hazard-images', 'evidence-files');