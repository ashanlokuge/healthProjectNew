-- Fix RLS Policies for Evidences Table
-- This script ensures assignees can insert evidence for their assignments

-- First, let's check current policies
SELECT '=== CURRENT EVIDENCE POLICIES ===' as info;
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
WHERE tablename = 'evidences';

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS evidence_insert_policy ON evidences;
DROP POLICY IF EXISTS evidence_read_policy ON evidences;
DROP POLICY IF EXISTS evidence_update_policy ON evidences;
DROP POLICY IF EXISTS evidence_delete_policy ON evidences;

-- Create secure INSERT policy for assignees
CREATE POLICY evidence_insert_policy ON evidences
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM assignments a
            WHERE a.id = evidences.assignment_id
            AND a.assignee_id = auth.uid()
        )
    );

-- Create READ policy for assignees and reviewers
CREATE POLICY evidence_read_policy ON evidences
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM assignments a
            WHERE a.id = evidences.assignment_id
            AND (
                a.assignee_id = auth.uid() OR  -- Assignee can read their own evidence
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role = 'reviewer'
                )  -- Reviewer can read all evidence
            )
        )
    );

-- Create UPDATE policy for assignees (only for their own evidence)
CREATE POLICY evidence_update_policy ON evidences
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM assignments a
            WHERE a.id = evidences.assignment_id
            AND a.assignee_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM assignments a
            WHERE a.id = evidences.assignment_id
            AND a.assignee_id = auth.uid()
        )
    );

-- Create DELETE policy for assignees (only for their own evidence)
CREATE POLICY evidence_delete_policy ON evidences
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM assignments a
            WHERE a.id = evidences.assignment_id
            AND a.assignee_id = auth.uid()
        )
    );

-- Verify the new policies
SELECT '=== NEW EVIDENCE POLICIES ===' as info;
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
WHERE tablename = 'evidences';

-- Test the policies with current user context
SELECT '=== CURRENT USER CONTEXT ===' as info;
SELECT 
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email;

-- Check if current user is assignee for any assignments
SELECT '=== CURRENT USER ASSIGNMENTS ===' as info;
SELECT 
    id,
    assignee_id,
    action,
    completed_at,
    review_status
FROM assignments 
WHERE assignee_id = auth.uid()
LIMIT 5; 