-- Allow assignees to read incident reports associated with their assignments
CREATE POLICY "Assignees can read associated incident reports"
  ON incident_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM incident_assignments
      WHERE incident_report_id = incident_reports.id
      AND assignee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );
