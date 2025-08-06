-- Add review status fields to assignments table
-- This allows reviewers to approve or reject completed tasks

-- Add review_status column (can be 'pending', 'approved', 'rejected')
ALTER TABLE assignments 
ADD COLUMN review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected'));

-- Add reviewed_at timestamp
ALTER TABLE assignments 
ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;

-- Add RLS policy for reviewers to update review status
CREATE POLICY "reviewers_can_update_review_status"
ON assignments FOR UPDATE
TO authenticated
USING (auth.uid() = reviewer_id)
WITH CHECK (auth.uid() = reviewer_id);

-- Update existing completed assignments to have pending review status
UPDATE assignments 
SET review_status = 'pending' 
WHERE completed_at IS NOT NULL AND review_status IS NULL; 