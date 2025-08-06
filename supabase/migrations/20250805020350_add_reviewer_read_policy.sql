-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Reviewers can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Reviewers can read assignee profiles" ON profiles; -- Ensure this specific one is dropped if it existed

-- Policy 1: Allow authenticated users to read their own profile
CREATE POLICY "profiles_read_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Allow authenticated users with 'reviewer' role to read 'assignee' profiles
CREATE POLICY "profiles_read_assignees_by_reviewer"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'reviewer'
    )
    AND role = 'assignee'
  );
