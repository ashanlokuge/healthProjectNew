-- Add the missing review_status column to assignments table
-- This will fix the "column assignments.review_status does not exist" error

-- 1. Add the review_status column
ALTER TABLE assignments 
ADD COLUMN review_status text DEFAULT 'pending';

-- 2. Add the reviewed_at column if it doesn't exist
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- 3. Add the review_reason column if it doesn't exist
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS review_reason text;

-- 4. Update existing assignments to have 'pending' status
UPDATE assignments 
SET review_status = 'pending' 
WHERE review_status IS NULL;

-- 5. Verify the column was added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'assignments' 
AND column_name IN ('review_status', 'reviewed_at', 'review_reason')
ORDER BY column_name;

-- 6. Test that we can now query assignments
SELECT COUNT(*) as total_assignments FROM assignments; 