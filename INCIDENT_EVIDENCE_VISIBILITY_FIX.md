# Incident Evidence Visibility Fix

## Problem Description
The user reported: "there is a small error the assignee upload the image but not receive that to reviewer why he cant see it"

This issue occurred because the incident reporting system was trying to use the same evidence handling as the hazard reporting system, but with incompatible table structures.

## Root Cause Analysis

### 1. Table Structure Mismatch
- **Hazard System**: Uses `evidences` table with `assignment_id` referencing `assignments.id`
- **Incident System**: Uses `incident_assignments` table, but was trying to insert into `evidences` table
- **Result**: Evidence records were being created with `assignment_id` pointing to non-existent assignments in the hazard system

### 2. Missing Evidence Display
- The `IncidentReviewerDashboard` was missing evidence display functionality
- When reviewers clicked "Review Task", they couldn't see uploaded evidence files
- No evidence loading or display logic was implemented

### 3. Storage and RLS Issues
- Storage bucket policies might not have been properly configured
- RLS policies were referencing the wrong table relationships

## Fixes Applied

### 1. Created Dedicated Incident Evidence Table
```sql
CREATE TABLE IF NOT EXISTS incident_evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_assignment_id uuid REFERENCES incident_assignments(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  uploaded_at timestamptz DEFAULT now()
);
```

### 2. Updated IncidentAssigneeDashboard
- Changed evidence upload from `evidences` table to `incident_evidences` table
- Updated field name from `assignment_id` to `incident_assignment_id`
- Added proper error handling and logging

### 3. Enhanced IncidentReviewerDashboard
- Added evidence loading functionality
- Added evidence display in the review modal
- Implemented proper state management for evidence files
- Added loading states and error handling

### 4. Implemented Proper RLS Policies
- **Insert Policy**: Assignees can only insert evidence for their own assignments
- **Read Policy**: Both assignees and reviewers can read evidence for assignments they're involved in
- **Update Policy**: Assignees can update their own evidence
- **Delete Policy**: Assignees can delete their own evidence

### 5. Storage Bucket Configuration
- Ensured `evidence-files` bucket has proper upload and read policies
- Configured public read access for evidence files
- Set up authenticated user upload permissions

## How the Fix Works

### Evidence Upload Flow
1. **Assignee** uploads evidence files when completing a task
2. **Files** are stored in Supabase storage (`evidence-files` bucket)
3. **Metadata** is saved in `incident_evidences` table with proper foreign key relationships
4. **RLS policies** ensure only authorized users can access evidence

### Evidence Display Flow
1. **Reviewer** clicks "Review Task" on a pending assignment
2. **Evidence loading** is triggered automatically
3. **Evidence files** are fetched from `incident_evidences` table
4. **Files** are displayed with download links and metadata
5. **Reviewer** can see all uploaded evidence before making approval/rejection decision

## Files Modified

### 1. `src/components/IncidentAssigneeDashboard.tsx`
- Updated evidence upload to use `incident_evidences` table
- Fixed field mapping and error handling

### 2. `src/components/IncidentReviewerDashboard.tsx`
- Added evidence state management
- Implemented evidence loading functionality
- Added evidence display in review modal
- Enhanced user experience with loading states

### 3. Database Schema
- Created `incident_evidences` table
- Implemented proper RLS policies
- Ensured storage bucket configuration

## Testing the Fix

### 1. Run the Database Script
```sql
-- Execute this in Supabase SQL Editor
-- Copy and paste the contents of fix_incident_evidence_visibility.sql
```

### 2. Verify Table Creation
- Check that `incident_evidences` table exists
- Verify RLS is enabled
- Confirm RLS policies are in place

### 3. Test Evidence Upload
- Assign an incident to an assignee
- Have assignee upload evidence files
- Verify files are stored in storage bucket
- Confirm evidence records are created in database

### 4. Test Evidence Visibility
- Have assignee complete the task
- Login as reviewer
- Navigate to "Tasks to Review"
- Click "Review Task"
- Verify evidence files are displayed

## Expected Results

After applying this fix:
- ✅ Assignees can upload evidence files successfully
- ✅ Evidence files are stored with proper metadata
- ✅ Reviewers can see all uploaded evidence when reviewing tasks
- ✅ Evidence files are accessible via download links
- ✅ RLS policies ensure proper security and access control
- ✅ Storage bucket policies allow proper file upload and retrieval

## Troubleshooting

### If Evidence Still Not Visible
1. **Check Database**: Verify `incident_evidences` table exists and has data
2. **Check RLS**: Ensure RLS policies are properly configured
3. **Check Storage**: Verify storage bucket policies are set correctly
4. **Check Console**: Look for JavaScript errors in browser console
5. **Check Network**: Verify API calls are successful in browser dev tools

### Common Issues
- **Table not created**: Run the SQL script again
- **RLS blocking access**: Check user roles and policy definitions
- **Storage errors**: Verify bucket exists and policies are configured
- **Frontend errors**: Check for JavaScript errors and component state

## Summary

This fix resolves the evidence visibility issue by:
1. Creating a dedicated evidence table for incidents
2. Implementing proper evidence upload and storage
3. Adding evidence display functionality to the reviewer dashboard
4. Ensuring proper security through RLS policies
5. Configuring storage bucket access correctly

The incident reporting system now has a complete evidence workflow that matches the functionality of the hazard reporting system, allowing assignees to upload evidence and reviewers to see it during task review.
