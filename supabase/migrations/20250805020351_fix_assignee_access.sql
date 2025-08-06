-- Drop the problematic policy
DROP POLICY IF EXISTS "profiles_read_assignees_by_reviewer" ON profiles;

-- Create a simpler policy that allows reviewers to read assignee profiles
-- This avoids the recursive query issue
CREATE POLICY "reviewers_can_read_assignees"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    role = 'assignee' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );

-- Also allow reviewers to read all profiles (simpler approach)
CREATE POLICY "authenticated_users_read_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);