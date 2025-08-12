# Incident Assignments Foreign Key Constraint Fix

## Problem Summary

The error message shows:
```
"Error assigning report: Database error: insert or update on table 'incident_assignments' violates foreign key constraint 'incident_assignments_assignee_id_fkey'"
```

This indicates that when trying to assign an incident to an assignee, the system is attempting to insert a record into the `incident_assignments` table with an `assignee_id` that doesn't exist in the referenced table.

## Root Cause Analysis

The issue stems from a **data type mismatch** between what the code is sending and what the database expects:

### What the Code Was Doing (INCORRECT)
- Using `user.id` (which is `auth.users.id`) for `reviewer_id` and `assignee_id`
- The `incident_assignments` table expects these fields to reference `profiles.id`

### What the Database Expects (CORRECT)
- `reviewer_id` should reference `profiles.id` (not `auth.users.id`)
- `assignee_id` should reference `profiles.id` (not `auth.users.id`)

### Database Schema
```sql
-- incident_assignments table structure
CREATE TABLE incident_assignments (
  id UUID PRIMARY KEY,
  incident_report_id UUID REFERENCES incident_reports(id),
  reviewer_id UUID REFERENCES profiles(id),  -- Should reference profiles.id
  assignee_id UUID REFERENCES profiles(id),  -- Should reference profiles.id
  -- ... other fields
);
```

## Fixes Applied

### 1. Code Fix (Frontend)
**File:** `src/components/IncidentReviewerDashboard.tsx`
**Change:** Updated the assignment creation to use `profile?.id` instead of `user.id`

```typescript
// BEFORE (INCORRECT)
reviewer_id: user.id, // This is auth.users.id

// AFTER (CORRECT)
reviewer_id: profile?.id, // This is profiles.id
```

### 2. Database Fix Scripts

#### A. Immediate Fix (`immediate_fix_incident_assignments.sql`)
- Temporarily disables RLS to see all data
- Identifies orphaned foreign key references
- Updates invalid references to use valid profile IDs
- Re-enables RLS

#### B. Comprehensive Fix (`fix_incident_assignments_root_cause.sql`)
- Analyzes the complete table structure and constraints
- Maps `auth.users.id` values to corresponding `profiles.id` values
- Fixes all foreign key violations systematically
- Provides detailed verification steps

#### C. Full Fix with RLS Policies (`fix_incident_assignments_foreign_key.sql`)
- Includes all the above fixes
- Adds proper RLS policies for the `incident_assignments` table
- Ensures proper access control after fixing the data

## How to Apply the Fix

### Option 1: Quick Fix (Recommended for immediate resolution)
1. Run `immediate_fix_incident_assignments.sql` in your Supabase SQL Editor
2. Test the incident assignment functionality

### Option 2: Comprehensive Fix (Recommended for production)
1. Run `fix_incident_assignments_root_cause.sql` in your Supabase SQL Editor
2. Run `fix_incident_assignments_foreign_key.sql` to add proper RLS policies
3. Test the incident assignment functionality

### Option 3: Manual Fix
1. Check your profiles table for valid assignee and reviewer profiles
2. Update any invalid `incident_assignments` records to use valid profile IDs
3. Ensure your frontend code uses `profile?.id` instead of `user.id`

## Verification Steps

After applying the fix, verify that:

1. **Foreign Key Constraints are Valid:**
   ```sql
   SELECT COUNT(*) FROM incident_assignments ia
   LEFT JOIN profiles p ON ia.assignee_id = p.id
   WHERE p.id IS NULL AND ia.assignee_id IS NOT NULL;
   -- Should return 0
   ```

2. **Can Create New Assignments:**
   - Try assigning an incident to an assignee
   - Check that no foreign key constraint errors occur

3. **Data Integrity:**
   ```sql
   SELECT 
     'Valid assignee_id: ' || COUNT(CASE WHEN assignee_id IN (SELECT id FROM profiles) THEN 1 END) as valid_assignee_count,
     'Valid reviewer_id: ' || COUNT(CASE WHEN reviewer_id IN (SELECT id FROM profiles) THEN 1 END) as valid_reviewer_count
   FROM incident_assignments;
   ```

## Prevention

To prevent this issue in the future:

1. **Always use `profile?.id`** when referencing profiles in database operations
2. **Never use `user.id`** for profile-related foreign keys
3. **Understand the difference:**
   - `user.id` = `auth.users.id` (authentication user ID)
   - `profile?.id` = `profiles.id` (user profile ID)

4. **Test foreign key constraints** when creating new tables or relationships

## Related Tables

- `incident_reports` - Stores incident reports (references `auth.users.id` for `user_id`)
- `incident_assignments` - Stores assignments (references `profiles.id` for `reviewer_id` and `assignee_id`)
- `profiles` - Stores user profiles (references `auth.users.id` for `user_id`)

## Support

If you continue to experience issues after applying these fixes:

1. Check the console for detailed error messages
2. Verify that all profiles have the correct roles assigned
3. Ensure RLS policies are properly configured
4. Check that the `incident_assignments` table exists and has the correct structure
