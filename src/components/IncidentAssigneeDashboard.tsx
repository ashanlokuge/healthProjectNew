import React, { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, CheckCircle, Upload, X, ArrowLeft } from 'lucide-react';

interface IncidentAssignment {
  id: string;
  incident_report_id: string;
  assignee_id: string;
  action: string;
  target_completion_date: string;
  completed_at: string | null;
  review_status: string | null;
  review_reason: string | null;
  remark: string | null;
  created_at: string;
  incident_reports?: {
    incident_title: string;
    description: string;
    site: string;
    department: string;
    location: string;
    date_of_incident: string;
    time_of_incident: string;
    incident_category: string;
    severity_level: string;
  };
}

export function IncidentAssigneeDashboard() {
  const [assignments, setAssignments] = useState<IncidentAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<IncidentAssignment | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { profile } = useAuth();

  const loadAssignments = useCallback(async () => {
    try {
      console.log('🔍 Loading incident assignments for assignee:', profile?.id);
      
      const { data, error } = await supabase
        .from('incident_assignments')
        .select(`
          *,
          incident_reports (*)
        `)
        .eq('assignee_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('📊 Incident assignments loaded:', data);
      setAssignments(data || []);
    } catch (error) {
      console.error('Error loading incident assignments:', error);
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
    
    e.target.value = '';
  };

  const removeEvidence = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleResubmitTask = async () => {
    if (!selectedAssignment) return;

    console.log('🔄 Starting incident resubmission...', { selectedAssignment, evidenceFiles });
    setSubmitting(true);
    try {
      // Upload evidence files (optional)
      if (evidenceFiles.length > 0) {
        try {
          for (const file of evidenceFiles) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            
            const { error } = await supabase.storage
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

            // Store evidence record
            await supabaseAdmin
              .from('evidences')
              .insert([{
                assignment_id: selectedAssignment.id,
                file_name: file.name,
                file_url: publicUrl,
                uploaded_at: new Date().toISOString()
              }]);
          }
        } catch (error) {
          console.error('Error uploading evidence files:', error);
        }
      }

      // Update assignment status
      const { error: updateError } = await supabaseAdmin
        .from('incident_assignments')
        .update({
          completed_at: completionDate,
          review_status: 'submitted',
          review_reason: null
        })
        .eq('id', selectedAssignment.id);

      if (updateError) throw updateError;

      alert('Incident task resubmitted successfully!');
      setSelectedAssignment(null);
      setEvidenceFiles([]);
      setCompletionDate(new Date().toISOString().split('T')[0]);
      loadAssignments();
    } catch (error) {
      console.error('Error resubmitting incident task:', error);
      alert('Error resubmitting task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCompletion = async () => {
    if (!selectedAssignment) return;

    console.log('✅ Submitting incident completion...', { selectedAssignment, evidenceFiles });
    setSubmitting(true);
    try {
      // Upload evidence files (optional)
      if (evidenceFiles.length > 0) {
        try {
          for (const file of evidenceFiles) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            
            const { error } = await supabase.storage
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

            // Store evidence record
            await supabaseAdmin
              .from('evidences')
              .insert([{
                assignment_id: selectedAssignment.id,
                file_name: file.name,
                file_url: publicUrl,
                uploaded_at: new Date().toISOString()
              }]);
          }
        } catch (error) {
          console.error('Error uploading evidence files:', error);
        }
      }

      // Update assignment status (don't set review_status, let reviewer handle it)
      const { data, error: updateError } = await supabaseAdmin
        .from('incident_assignments')
        .update({
          completed_at: completionDate
        })
        .eq('id', selectedAssignment.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Database error:', updateError);
        throw new Error(`Database error: ${updateError.message}`);
      }

      console.log('✅ Incident task completed successfully:', data);
      alert('Incident task completed successfully!');
      setSelectedAssignment(null);
      setEvidenceFiles([]);
      setCompletionDate(new Date().toISOString().split('T')[0]);
      loadAssignments();
    } catch (error) {
      console.error('❌ Error completing incident task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error completing task: ${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = (targetDate: string) => {
    return new Date(targetDate) < new Date();
  };

  if (selectedAssignment) {
    console.log('📋 Selected assignment details:', selectedAssignment);
    console.log('📋 Incident report data:', selectedAssignment.incident_reports);
    
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedAssignment.incident_reports?.incident_title || 'Untitled Incident'}
                  </h2>
                  <p className="text-gray-600 mt-1">Complete incident-related task</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Incident Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Site:</span>
                    <span className="ml-2 text-gray-900">{selectedAssignment.incident_reports?.site || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Department:</span>
                    <span className="ml-2 text-gray-900">{selectedAssignment.incident_reports?.department || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-900">{selectedAssignment.incident_reports?.location || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-900">{selectedAssignment.incident_reports?.incident_category || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Severity:</span>
                    <span className="ml-2 text-gray-900">{selectedAssignment.incident_reports?.severity_level || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Action Required:</span>
                    <p className="mt-1 text-gray-900">{selectedAssignment.action}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Due Date:</span>
                    <span className={`ml-2 ${isOverdue(selectedAssignment.target_completion_date) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {new Date(selectedAssignment.target_completion_date).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedAssignment.remark && (
                    <div>
                      <span className="font-medium text-gray-700">Remark:</span>
                      <p className="mt-1 text-gray-900">{selectedAssignment.remark}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-700">{selectedAssignment.incident_reports?.description || 'No description provided'}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Completion Date
              </label>
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence Files (Optional)
              </label>
              <input
                type="file"
                multiple
                onChange={handleEvidenceUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum 3 files, 100MB each</p>
              
              {evidenceFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {evidenceFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        onClick={() => removeEvidence(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {selectedAssignment.review_status === 'rejected' ? (
                <button
                  onClick={handleResubmitTask}
                  disabled={submitting}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Resubmitting...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Resubmit Task</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSubmitCompletion}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Complete Task</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="bg-indigo-100 p-3 rounded-full flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-indigo-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-2.623-4.176 9.263 9.263 0 00-1.186-.08 9.38 9.38 0 00-2.625.372m-10.5-1.122a9.374 9.374 0 01-4.252-1.122 4.125 4.125 0 01-2.623-4.176 9.263 9.263 0 01-1.186-.08 9.38 9.38 0 01-2.625.372m.561-1.122a9.374 9.374 0 00-4.252-1.122 4.125 4.125 0 00-2.623-4.176 9.263 9.263 0 00-1.186-.08 9.38 9.38 0 00-2.625.372" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Assignments</h2>
              <p className="text-gray-600">Complete assigned incident tasks and submit evidence</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments</h3>
              <p className="text-gray-600">You don't have any incident assignments yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                    <div className="mb-2 sm:mb-0">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {assignment.action}
                      </h3>
                      {assignment.incident_reports?.incident_title && (
                        <p className="text-sm text-gray-500 mt-1">
                          Related to: {assignment.incident_reports.incident_title}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm flex-shrink-0">
                      <Clock className={`w-4 h-4 ${isOverdue(assignment.target_completion_date) ? 'text-red-500' : 'text-gray-400'}`} />
                      <span className={`font-medium ${isOverdue(assignment.target_completion_date) ? 'text-red-600' : 'text-gray-600'}`}>
                        Due: {new Date(assignment.target_completion_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {assignment.remark && (
                    <div className="mb-4 text-gray-700 text-sm">
                      <span className="font-medium">Remark:</span> {assignment.remark}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-gray-100 mt-4">
                    <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                      {assignment.completed_at && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" /> Completed
                        </span>
                      )}
                      {assignment.review_status && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
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

                    {!assignment.completed_at || assignment.review_status === 'rejected' ? (
                      <button
                        onClick={() => setSelectedAssignment(assignment)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
                          ${assignment.review_status === 'rejected'
                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                      >
                        {assignment.review_status === 'rejected' ? 'Resubmit Task' : 'Complete Task'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedAssignment(assignment)}
                        className="px-4 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200"
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
      </main>
    </div>
  );
}
