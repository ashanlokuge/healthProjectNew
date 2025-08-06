-- Add policy for reviewers to read assignee profiles
CREATE POLICY "Reviewers can read assignee profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (
      -- Allow reviewers to read assignee profiles
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role = 'reviewer'
      )
      AND
      role = 'assignee'
    )
    OR
    -- Users can still read their own profiles
    auth.uid() = user_id
  );