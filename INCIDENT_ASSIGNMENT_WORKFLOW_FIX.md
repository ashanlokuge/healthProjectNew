# Incident Assignment Workflow Fix Summary

## Problem Description

When an assignee submits a completed incident task, it was not being properly sent to the reviewer for approval/rejection. The workflow was broken because:

1. **Missing Review Status**: The assignee was only setting `completed_at` but not setting `review_status` to indicate the task needed review
2. **Incorrect Query Logic**: The reviewer dashboard was looking for tasks with `review_status IS NULL` instead of `review_status = 'pending'`
3. **Missing Status Updates**: The incident report status was not being updated to indicate it was ready for review

## Root Cause

The incident assignment system was not following the same workflow pattern as the hazard reporting system:

- **Hazard System**: Assignee submits → `review_status = 'pending'` → Reviewer sees in "Tasks to Review" → Approve/Reject
- **Incident System**: Assignee submits → `review_status` not set → Reviewer doesn't see task → No approval/rejection possible

## Fixes Applied

### 1. Fixed Assignee Task Submission (`IncidentAssigneeDashboard.tsx`)

**Before:**
```typescript
// Only set completed_at, no review_status
.update({
  completed_at: completionDate
})
```

**After:**
```typescript
// Set both completed_at and review_status for proper workflow
.update({
  completed_at: completionDate,
  review_status: 'pending' // Set to pending so reviewer knows it needs review
})

// Also update incident report status
.update({ status: 'in_review' })
```

### 2. Fixed Resubmission Logic

**Before:**
```typescript
review_status: 'submitted' // Invalid status
```

**After:**
```typescript
review_status: 'pending' // Correct status for review
```

### 3. Fixed Reviewer Dashboard Queries (`IncidentReviewerDashboard.tsx`)

**Before:**
```typescript
// Looking for tasks with no review status
.is('review_status', null)

// Excluding only approved/rejected from assignments
.not('review_status', 'in', '("approved","rejected")')
```

**After:**
```typescript
// Looking for tasks with pending review status
.eq('review_status', 'pending')

// Excluding pending review tasks from assignments tab
.not('review_status', 'in', '("approved","rejected","pending")')
```

## How the Fixed Workflow Works

### Step 1: Assignee Completes Task
1. Assignee fills out completion form
2. System sets `completed_at` timestamp
3. System sets `review_status = 'pending'`
4. System updates incident report status to `'in_review'`

### Step 2: Reviewer Sees Pending Task
1. Task appears in "Tasks to Review" tab
2. Reviewer can see completion details and evidence
3. Reviewer can approve or reject the task

### Step 3: Review Decision
1. **If Approved**: 
   - `review_status = 'approved'`
   - Incident report status = `'approved'`
2. **If Rejected**:
   - `review_status = 'rejected'`
   - Incident report status = `'rejected'`
   - Assignee can resubmit (resets to `'pending'`)

## Status Flow

```
Submitted → Assigned → In Progress → Completed → Pending Review → Approved/Rejected
   ↓           ↓          ↓           ↓           ↓              ↓
submitted   assigned   in_progress  in_review   pending      approved/rejected
```

## Testing the Fix

1. **Create an incident report** (status: `submitted`)
2. **Assign to assignee** (status: `assigned`)
3. **Assignee completes task** (status: `in_review`, assignment: `review_status = 'pending'`)
4. **Reviewer sees task** in "Tasks to Review" tab
5. **Reviewer approves/rejects** (status: `approved`/`rejected`)

## Files Modified

- `src/components/IncidentAssigneeDashboard.tsx` - Fixed task submission workflow
- `src/components/IncidentReviewerDashboard.tsx` - Fixed query logic for pending tasks

## Database Requirements

The system requires these fields to work properly:

- `incident_assignments.review_status` (pending/approved/rejected)
- `incident_assignments.completed_at` (timestamp when task completed)
- `incident_reports.status` (submitted/assigned/in_review/approved/rejected)

## Result

✅ **Incident assignments now follow the same workflow as hazard reports**
✅ **Reviewers can see and approve/reject completed tasks**
✅ **Assignees can resubmit rejected tasks**
✅ **Status tracking works end-to-end**
