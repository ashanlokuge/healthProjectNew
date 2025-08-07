import React, { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseAdmin, Assignment } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, CheckCircle, Upload, X } from 'lucide-react';
import { TaskStatusDisplay } from './TaskStatusDisplay';

export function AssigneeDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showStatusDisplay, setShowStatusDisplay] = useState(false);
  const [statusData, setStatusData] = useState<unknown>(null);
  const { profile } = useAuth();

  const loadAssignments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          hazard_reports (*)
        `)
        .eq('assignee_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFileSize = 100 * 1024 * 1024; // 100MB in bytes
    
    // Filter out files that are too large
    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        alert(`File "${file.name}" is too large. Maximum file size is 100MB.`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      setEvidenceFiles(prev => [...prev, ...validFiles].slice(0, 3));
    }
    
    // Reset the input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeEvidence = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleResubmitTask = async () => {
    if (!selectedAssignment) return;

    console.log('🔄 Starting resubmission...', { selectedAssignment, evidenceFiles });
    setSubmitting(true);
    try {
      // Upload evidence files (optional)
      const evidenceUrls: string[] = [];
      if (evidenceFiles.length > 0) {
        try {
          for (const file of evidenceFiles) {
            // Create unique filename with timestamp and random string
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            
            const { data, error } = await supabase.storage
              .from('evidence-files')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (error) {
              console.warn('⚠️ Could not upload evidence file:', error);
              continue;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('evidence-files')
              .getPublicUrl(fileName);

            evidenceUrls.push(publicUrl);

            // Store evidence record
            try {
              await supabaseAdmin
                .from('evidences')
                .insert([
                  {
                    assignment_id: selectedAssignment.id,
                    file_url: publicUrl,
                    file_name: file.name,
                    file_type: file.type,
                  },
                ]);
            } catch (evidenceError) {
              console.warn('⚠️ Could not save evidence record:', evidenceError);
            }
          }
        } catch (storageError) {
          console.warn('⚠️ Storage bucket not available, continuing without evidence files:', storageError);
        }
      }

      // Reset assignment for resubmission
      console.log('📝 Resubmitting assignment:', selectedAssignment.id);
      const { error: updateError } = await supabase
        .from('assignments')
        .update({
          completed_at: new Date().toISOString(),
          review_status: null, // Reset review status to allow re-review
          review_reason: null, // Clear previous rejection reason
          reviewed_at: null, // Clear previous review date
        })
        .eq('id', selectedAssignment.id);

      if (updateError) {
        console.error('❌ Assignment resubmission error:', updateError);
        throw updateError;
      }

      // Update hazard report status back to 'completed'
      console.log('📝 Updating hazard report:', selectedAssignment.hazard_report_id, 'to completed status');
      const { error: reportError } = await supabase
        .from('hazard_reports')
        .update({ status: 'completed' })
        .eq('id', selectedAssignment.hazard_report_id);

      if (reportError) {
        console.error('❌ Hazard report update error:', reportError);
        throw reportError;
      }

      console.log('✅ Resubmission successful!');
      alert('Task resubmitted successfully! It will be reviewed again.');
      setSelectedAssignment(null);
      setEvidenceFiles([]);
      loadAssignments();
    } catch (error) {
      console.error('❌ Error resubmitting task:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to resubmit task: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCompletion = async () => {
    if (!selectedAssignment) return;

    console.log('🚀 Starting submission...', { selectedAssignment, evidenceFiles });
    setSubmitting(true);
    try {
      // Upload evidence files (optional)
      const evidenceUrls: string[] = [];
      if (evidenceFiles.length > 0) {
        try {
          for (const file of evidenceFiles) {
            // Create unique filename with timestamp and random string
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            
            const { data, error } = await supabase.storage
              .from('evidence-files')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (error) {
              console.warn('⚠️ Could not upload evidence file:', error);
              console.warn('Error details:', {
                message: error.message,
                statusCode: error.statusCode,
                error: error.error
              });
              // Continue without this file
              continue;
            }

            console.log('Evidence file uploaded successfully:', data);

            const { data: { publicUrl } } = supabase.storage
              .from('evidence-files')
              .getPublicUrl(fileName);

            evidenceUrls.push(publicUrl);
            console.log('Evidence public URL generated:', publicUrl);

            // Store evidence record using admin client to bypass RLS
            try {
              const { data: evidenceData, error: evidenceError } = await supabaseAdmin
                .from('evidences')
                .insert([
                  {
                    assignment_id: selectedAssignment.id,
                    file_url: publicUrl,
                    file_name: file.name,
                    file_type: file.type,
                  },
                ])
                .select();

              if (evidenceError) {
                console.warn('⚠️ Could not save evidence record:', evidenceError);
                // Continue without saving evidence record
              } else {
                console.log('✅ Evidence record saved successfully:', evidenceData);
              }
            } catch (evidenceError) {
              console.warn('⚠️ Could not save evidence record:', evidenceError);
              // Continue without saving evidence record
            }
          }
        } catch (storageError) {
          console.warn('⚠️ Storage bucket not available, continuing without evidence files:', storageError);
          // Continue without evidence files
        }
      }

      // Update assignment as completed
      console.log('📝 Updating assignment:', selectedAssignment.id, 'with completion date:', completionDate);
      const { error: updateError } = await supabase
        .from('assignments')
        .update({
          completed_at: new Date().toISOString(),
        })
        .eq('id', selectedAssignment.id);

      if (updateError) {
        console.error('❌ Assignment update error:', updateError);
        throw updateError;
      }

      // Update hazard report status to 'completed' when assignee submits completion
      console.log('📝 Updating hazard report:', selectedAssignment.hazard_report_id, 'to completed status');
      const { error: reportError } = await supabase
        .from('hazard_reports')
        .update({ status: 'completed' })
        .eq('id', selectedAssignment.hazard_report_id);

      if (reportError) {
        console.error('❌ Hazard report update error:', reportError);
        throw reportError;
      }

      console.log('✅ Submission successful!');
      alert('Task completed successfully!');
      setSelectedAssignment(null);
      setEvidenceFiles([]);
      loadAssignments();
    } catch (error) {
      console.error('❌ Error submitting completion:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to submit completion: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = (targetDate: string) => {
    return new Date(targetDate) < new Date();
  };

  const showTaskStatus = (assignment: Assignment) => {
    let status: 'approved' | 'rejected' | 'pending' | 'completed' = 'pending';
    
    if (assignment.review_status === 'approved') {
      status = 'approved';
    } else if (assignment.review_status === 'rejected') {
      status = 'rejected';
    } else if (assignment.completed_at) {
      status = 'completed';
    }

    setStatusData({
      status,
      assignmentId: assignment.id,
      hazardTitle: assignment.hazard_reports?.hazard_title || 'Unknown',
      assigneeName: profile?.full_name || 'Unknown',
      reviewerName: 'Reviewer', // We don't have reviewer name in this context
      reviewReason: assignment.review_reason || 'No review comments',
      reviewedAt: assignment.reviewed_at
    });
    setShowStatusDisplay(true);
  };

  if (showStatusDisplay && statusData) {
    return (
      <TaskStatusDisplay
        status={statusData.status}
        assignmentId={statusData.assignmentId}
        hazardTitle={statusData.hazardTitle}
        assigneeName={statusData.assigneeName}
        reviewerName={statusData.reviewerName}
        reviewReason={statusData.reviewReason}
        reviewedAt={statusData.reviewedAt}
        onBack={() => {
          setShowStatusDisplay(false);
          setStatusData(null);
          loadAssignments();
        }}
      />
    );
  }

  if (selectedAssignment) {
      return (
    <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-blue-600">
                {selectedAssignment.review_status === 'rejected' ? 'Task Resubmission' : 'Action Completion'}
              </h1>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Show rejection notice for resubmissions */}
            {selectedAssignment.review_status === 'rejected' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <X className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Task was rejected</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        <strong>Rejection reason:</strong> {selectedAssignment.review_reason || 'No reason provided'}
                      </p>
                      <p className="mt-1">Please address the feedback and resubmit your work.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <div className="p-3 bg-gray-100 rounded-md">
                  {selectedAssignment.action}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Completion Date</label>
                <div className="p-3 bg-gray-100 rounded-md">
                  {new Date(selectedAssignment.target_completion_date).toLocaleDateString()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                <div className="p-3 bg-gray-100 rounded-md">
                  {selectedAssignment.remark || 'No remarks'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action Completed Date</label>
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Evidence (up to 3 files)</label>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 h-32">
                      {evidenceFiles[index] ? (
                        <div className="relative h-full">
                          {evidenceFiles[index].type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(evidenceFiles[index])}
                              alt={`Evidence ${index + 1}`}
                              className="w-full h-full object-cover rounded-md"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                              <div className="text-2xl mb-2">📄</div>
                              <span className="text-xs text-gray-600 text-center">
                                {evidenceFiles[index].name}
                              </span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeEvidence(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                          <Upload className="w-6 h-6 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500">Upload File</span>
                          <input
                            type="file"
                            accept="image/*,.pdf,.doc,.docx"
                            onChange={handleEvidenceUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={selectedAssignment.review_status === 'rejected' ? handleResubmitTask : handleSubmitCompletion}
                  disabled={submitting}
                  className={`px-6 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    selectedAssignment.review_status === 'rejected' 
                      ? 'bg-orange-600 hover:bg-orange-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {submitting 
                    ? (selectedAssignment.review_status === 'rejected' ? 'Resubmitting...' : 'Submitting...') 
                    : (selectedAssignment.review_status === 'rejected' ? 'Resubmit Task' : 'Submit Completion')
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Assignments</h1>
          <p className="text-gray-600">Complete assigned safety tasks</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments</h3>
            <p className="text-gray-600">You don't have any assignments yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {assignment.hazard_reports?.hazard_title}
                    </h3>
                    <p className="text-gray-600 mt-1">{assignment.action}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className={`w-4 h-4 ${isOverdue(assignment.target_completion_date) ? 'text-red-500' : 'text-gray-400'}`} />
                    <span className={`text-sm ${isOverdue(assignment.target_completion_date) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      Due: {new Date(assignment.target_completion_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {assignment.remark && (
                  <p className="text-gray-700 mb-4 bg-gray-50 p-3 rounded-md">
                    <span className="font-medium">Remark:</span> {assignment.remark}
                  </p>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    {assignment.completed_at && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Completed</span>
                      </div>
                    )}
                    {assignment.review_status && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        assignment.review_status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : assignment.review_status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {assignment.review_status.toUpperCase()}
                      </span>
                    )}
                    {assignment.review_status === 'rejected' && assignment.review_reason && (
                      <span className="text-sm text-red-600">
                        Reason: {assignment.review_reason}
                      </span>
                    )}
                  </div>

                  {!assignment.completed_at ? (
                    <button
                      onClick={() => setSelectedAssignment(assignment)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Complete Task
                    </button>
                  ) : assignment.review_status === 'rejected' ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => showTaskStatus(assignment)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
                      >
                        View Status
                      </button>
                      <button
                        onClick={() => setSelectedAssignment(assignment)}
                        className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors text-sm"
                      >
                        Resubmit Task
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => showTaskStatus(assignment)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      View Status
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}