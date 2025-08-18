import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, X, Eye, Search, FileText, Users, Clock } from 'lucide-react';

interface IncidentReport {
  id: string;
  incident_title: string;
  description: string;
  site: string;
  department: string;
  location: string;
  date_of_incident: string;
  time_of_incident: string;
  date_of_reporting: string;
  reporter_name: string;
  incident_category: string;
  severity_level: string;
  status: string;
  image_urls?: string[] | null;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

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
  profiles?: {
    full_name: string;
    email: string;
  };
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
    image_urls?: string[] | null;
  };
}

interface Evidence {
  id: string;
  assignment_id: string;
  file_url: string;
  file_name: string;
  file_type?: string;
  uploaded_at: string;
}

export function IncidentReviewerDashboard() {
  const [activeTab, setActiveTab] = useState<'reports' | 'assignments' | 'pending_review' | 'review_history'>('reports');
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [assignments, setAssignments] = useState<IncidentAssignment[]>([]);
  const [pendingReviewTasks, setPendingReviewTasks] = useState<IncidentAssignment[]>([]);
  const [reviewedTasks, setReviewedTasks] = useState<IncidentAssignment[]>([]);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<IncidentAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [assignees, setAssignees] = useState<{ id: string, full_name: string, email: string }[]>([]);
  const [filteredAssignees, setFilteredAssignees] = useState<{ id: string, full_name: string, email: string }[]>([]);
  const [emailSearch, setEmailSearch] = useState('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<Evidence[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const { user, profile } = useAuth();

  const loadData = useCallback(async () => {
    try {

      // Load unassigned incident reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('status', 'submitted')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;



      // Load incident assignments created by this reviewer (exclude approved/rejected and pending review tasks)
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('incident_assignments')
        .select(`
          *,
          incident_reports (*)
        `)
        .eq('reviewer_id', user?.id)
        .not('review_status', 'in', '("approved","rejected","pending")')
        .order('created_at', { ascending: false });



      if (assignmentsError) throw assignmentsError;

      // Load tasks pending review (completed by assignees, waiting for reviewer approval)
      const { data: pendingReviewData, error: pendingReviewError } = await supabase
        .from('incident_assignments')
        .select(`
          *,
          incident_reports (*)
        `)
        .eq('reviewer_id', user?.id)
        .not('completed_at', 'is', null)
        .eq('review_status', 'pending') // Look for completed tasks with pending review status
        .order('completed_at', { ascending: false });



      if (pendingReviewError) throw pendingReviewError;

      // Load reviewed tasks (only approved/rejected, exclude pending)
      const { data: reviewedData, error: reviewedError } = await supabase
        .from('incident_assignments')
        .select(`
          *,
          incident_reports (*)
        `)
        .eq('reviewer_id', user?.id)
        .in('review_status', ['approved', 'rejected'])
        .order('created_at', { ascending: false });



      if (reviewedError) throw reviewedError;

      setReports(reportsData || []);
      setAssignments(assignmentsData || []);
      setPendingReviewTasks(pendingReviewData || []);
      setReviewedTasks(reviewedData || []);


    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadAssignees = useCallback(async () => {
    try {


      const { data: allProfiles, error: allError } = await supabase
        .from('profiles')
        .select('*');

      if (allError) {
        console.error('❌ Error loading all profiles:', allError);
        setAssignees([]);
        setFilteredAssignees([]);
        return;
      }

      if (allProfiles) {
        const assigneeProfiles = allProfiles.filter(p => p.role === 'assignee');

        setAssignees(assigneeProfiles);
        setFilteredAssignees(assigneeProfiles);
      }
    } catch (error) {
      console.error('💥 Error loading assignees:', error);
      setAssignees([]);
      setFilteredAssignees([]);
    }
  }, []);

  const loadEvidence = useCallback(async (assignmentId: string) => {
    try {
      console.log('🔍 Loading evidence for incident assignment:', assignmentId);
      const { data, error } = await supabase
        .from('incident_evidences')
        .select('*')
        .eq('incident_assignment_id', assignmentId);

      console.log('📊 Evidence query result:', { data, error });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error loading evidence:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    if (profile?.id) {
      loadData();
      loadAssignees();
    }
  }, [profile?.id, loadData, loadAssignees]);

  // Load evidence when an assignment is selected for review
  useEffect(() => {
    const loadEvidenceForAssignment = async () => {
      if (selectedAssignment?.id) {
        setLoadingEvidence(true);
        try {
          const evidence = await loadEvidence(selectedAssignment.id);
          setEvidenceFiles(evidence);
          console.log('✅ Loaded evidence files for incident assignment:', evidence);
        } catch (error) {
          console.error('❌ Error loading evidence:', error);
          setEvidenceFiles([]);
        } finally {
          setLoadingEvidence(false);
        }
      }
    };

    loadEvidenceForAssignment();
  }, [selectedAssignment?.id, loadEvidence]);

  useEffect(() => {
    if (!emailSearch.trim()) {
      setFilteredAssignees(assignees);
    } else {
      const filtered = assignees.filter(assignee =>
        assignee.email.toLowerCase().includes(emailSearch.toLowerCase()) ||
        assignee.full_name?.toLowerCase().includes(emailSearch.toLowerCase())
      );
      setFilteredAssignees(filtered);
    }
  }, [emailSearch, assignees]);

  const handleAssignToAssignee = async () => {
    if (!selectedReport) return;

    if (!selectedAssigneeId) {
      alert('Please select an assignee');
      return;
    }

    setSubmitting(true);
    try {


      // First, update the report status to 'assigned'
      const { error: reportError } = await supabase
        .from('incident_reports')
        .update({ status: 'assigned' })
        .eq('id', selectedReport.id);

      if (reportError) {
        console.error('❌ Database error updating report:', reportError);
        throw new Error(`Database error: ${reportError.message}`);
      }

      // Current user's ID is available from the useAuth hook
      if (!user?.id) {
        throw new Error('User ID is not available.');
      }

      // Create an assignment for the assignee
      const { error: assignmentError } = await supabase
        .from('incident_assignments')
        .insert([{
          incident_report_id: selectedReport.id,
          reviewer_id: profile?.id, // Use profile.id for profiles reference
          assignee_id: selectedAssigneeId,
          action: 'Investigate and resolve the incident',
          target_completion_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          review_status: 'pending',
          remark: 'Please investigate this incident and provide a detailed report.'
        }]);

      if (assignmentError) {
        console.error('❌ Database error creating assignment:', assignmentError);
        throw new Error(`Database error: ${assignmentError.message}`);
      }


      alert('Incident report assigned to assignee successfully!');
      setSelectedReport(null);
      setSelectedAssigneeId('');
      setEmailSearch('');
      loadData();
    } catch (error) {
      console.error('❌ Error assigning report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error assigning report: ${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveAssignment = async () => {
    if (!selectedAssignment) return;

    setSubmitting(true);
    try {
      const updateData = {
        review_status: 'approved',
        review_reason: reviewReason,
        reviewed_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('incident_assignments')
        .update(updateData)
        .eq('id', selectedAssignment.id)
        .select();

      console.log('📝 Assignment update result:', { data, error });

      if (error) {
        console.error('❌ Update error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ Assignment updated successfully:', data);

      // Update incident report status
      const { error: reportError } = await supabase
        .from('incident_reports')
        .update({ status: 'approved' })
        .eq('id', selectedAssignment.incident_report_id);

      console.log('📝 Incident report update result:', { reportError });

      if (reportError) throw reportError;

      alert('✅ Task approved successfully!');
      setSelectedAssignment(null);
      setReviewReason('');
      await loadData(); // Ensure data reloads completely
    } catch (error) {
      console.error('❌ Error approving assignment:', error);
      alert('Failed to process approval. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectAssignment = async () => {
    if (!selectedAssignment || !reviewReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setSubmitting(true);
    try {
      const updateData = {
        review_status: 'rejected',
        review_reason: reviewReason,
        reviewed_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('incident_assignments')
        .update(updateData)
        .eq('id', selectedAssignment.id)
        .select();

      console.log('📝 Assignment update result:', { data, error });

      if (error) {
        console.error('❌ Update error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ Assignment updated successfully:', data);

      // Update incident report status
      const { error: reportError } = await supabase
        .from('incident_reports')
        .update({ status: 'rejected' })
        .eq('id', selectedAssignment.incident_report_id);

      console.log('📝 Incident report update result:', { reportError });

      if (reportError) throw reportError;

      alert('❌ Task rejected. Assignee will need to rework.');
      setSelectedAssignment(null);
      setReviewReason('');
      await loadData(); // Ensure data reloads completely
    } catch (error) {
      console.error('❌ Error rejecting assignment:', error);
      alert('Failed to process rejection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Assignment Form Modal
  if (selectedReport) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Assign Incident Report</h2>
                <p className="text-gray-600 mt-1">{selectedReport.incident_title}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
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
                    <span className="ml-2 text-gray-900">{selectedReport.site || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Department:</span>
                    <span className="ml-2 text-gray-900">{selectedReport.department || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-900">{selectedReport.location || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-900">{selectedReport.incident_category || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Severity:</span>
                    <span className="ml-2 text-gray-900">{selectedReport.severity_level || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Reporter:</span>
                    <span className="ml-2 text-gray-900">{selectedReport.reporter_name || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Date of Incident:</span>
                    <span className="ml-2 text-gray-900">{selectedReport.date_of_incident ? new Date(selectedReport.date_of_incident).toLocaleDateString() : 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Time of Incident:</span>
                    <span className="ml-2 text-gray-900">{selectedReport.time_of_incident || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Date of Reporting:</span>
                    <span className="ml-2 text-gray-900">{selectedReport.date_of_reporting ? new Date(selectedReport.date_of_reporting).toLocaleDateString() : 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-700">{selectedReport.description}</p>
            </div>

            {/* Original Incident Images */}
            {selectedReport.image_urls && selectedReport.image_urls.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📸 Original Incident Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedReport.image_urls.map((imageUrl, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={imageUrl}
                        alt={`Incident Image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Failed to load incident image:', imageUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedReport.image_urls.length} image{selectedReport.image_urls.length !== 1 ? 's' : ''} uploaded with this incident report
                </p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Assignee by Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  placeholder="Type email to search assignees..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Assignee *
              </label>
              <select
                value={selectedAssigneeId}
                onChange={(e) => setSelectedAssigneeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select an assignee ({filteredAssignees.length} found)</option>
                {filteredAssignees.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>
                    {assignee.full_name || 'No Name'} ({assignee.email})
                  </option>
                ))}
              </select>
              {assignees.length === 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 mb-2">
                    No assignees found. Please make sure there are users with the assignee role in the system.
                  </p>
                  <button
                    onClick={loadAssignees}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                  >
                    🔄 Refresh Assignees
                  </button>
                </div>
              )}
              {assignees.length > 0 && filteredAssignees.length === 0 && emailSearch && (
                <p className="mt-2 text-sm text-gray-500">
                  No assignees found matching "{emailSearch}". Try a different search term.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignToAssignee}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Assign to Assignee</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Review Form Modal
  if (selectedAssignment) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Review Incident Assignment</h2>
                <p className="text-gray-600 mt-1">Task completion review</p>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Assignee:</span>
                    <span className="ml-2 text-gray-900">{selectedAssignment.profiles?.full_name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Action:</span>
                    <p className="mt-1 text-gray-900">{selectedAssignment.action}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Due Date:</span>
                    <span className="ml-2 text-gray-900">{new Date(selectedAssignment.target_completion_date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Completed:</span>
                    <span className="ml-2 text-gray-900">{selectedAssignment.completed_at ? new Date(selectedAssignment.completed_at).toLocaleDateString() : 'Not completed'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Status</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Current Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAssignment.review_status || '')}`}>
                      {selectedAssignment.review_status?.toUpperCase() || 'PENDING'}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason (if rejecting)
              </label>
              <textarea
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide a reason for rejection..."
              />
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Evidence Files</h3>
              {loadingEvidence ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading evidence files...</p>
                </div>
              ) : evidenceFiles.length === 0 ? (
                <p className="text-gray-600">No evidence files uploaded for this assignment.</p>
              ) : (
                <div className="grid gap-4">
                  {evidenceFiles.map((file) => (
                    <div key={file.id} className="bg-gray-50 p-3 rounded-md flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-500 mr-2" />
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {file.file_name}
                        </a>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(file.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Original Incident Images */}
            {selectedAssignment.incident_reports && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📸 Original Incident Images</h3>
                {selectedAssignment.incident_reports.image_urls && selectedAssignment.incident_reports.image_urls.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedAssignment.incident_reports.image_urls.map((imageUrl, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                        <img
                          src={imageUrl}
                          alt={`Incident Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Failed to load incident image:', imageUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No images were uploaded with the original incident report.</p>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectAssignment}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>Reject Assignment</span>
                  </>
                )}
              </button>
              <button
                onClick={handleApproveAssignment}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve Assignment</span>
                  </>
                )}
              </button>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Incident Reviewer Dashboard</h1>

          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'reports'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              New Reports ({reports.length})
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'assignments'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              My Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('pending_review')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'pending_review'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Tasks to Review ({pendingReviewTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('review_history')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'review_history'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              Review History ({reviewedTasks.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        ) : (
          <div>
            {activeTab === 'reports' ? (
              reports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No new reports</h3>
                  <p className="text-gray-600">All reports have been assigned</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {reports.map((report) => {
                    const hasImages = report.image_urls && report.image_urls.length > 0;
                    
                    return (
                      <div
                        key={report.id}
                        className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{report.incident_title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <p><strong>Site:</strong> {report.site || 'Not specified'}</p>
                          <p><strong>Department:</strong> {report.department || 'Not specified'}</p>
                          <p><strong>Category:</strong> {report.incident_category || 'Not specified'}</p>
                          <p><strong>Severity:</strong> {report.severity_level || 'Not specified'}</p>
                        </div>

                        <p className="text-gray-700 mt-3 text-sm line-clamp-2">{report.description}</p>

                        {/* Original Incident Images */}
                        {hasImages && (
                          <div className="mt-4">
                            <div className="flex items-center space-x-2 mb-3">
                              <span className="text-xs font-medium text-gray-500">
                                📸 Original Images ({report.image_urls!.length})
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              {report.image_urls!.slice(0, 4).map((imageUrl, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                                  <img
                                    src={imageUrl}
                                    alt={`Incident Image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      console.error('Failed to load incident image:', imageUrl);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                    onLoad={() => {
                                      console.log('✅ Incident image loaded successfully:', imageUrl);
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                            
                            {report.image_urls!.length > 4 && (
                              <div className="mt-2 text-center">
                                <span className="text-xs text-gray-500">
                                  +{report.image_urls!.length - 4} more image{report.image_urls!.length - 4 !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Assign Task →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : activeTab === 'assignments' ? (
              assignments.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments</h3>
                  <p className="text-gray-600">You haven't created any assignments yet</p>
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
                            {assignment.incident_reports?.incident_title || 'Untitled Incident'}
                          </h3>
                          <p className="text-gray-600 mt-1">{assignment.action}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.review_status || '')}`}>
                            {assignment.review_status?.toUpperCase() || 'PENDING'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Assignee:</strong> {assignment.profiles?.full_name || 'Unknown'}</p>
                          <p><strong>Due Date:</strong> {new Date(assignment.target_completion_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p><strong>Created:</strong> {new Date(assignment.created_at).toLocaleDateString()}</p>
                          {assignment.completed_at && (
                            <p><strong>Completed:</strong> {new Date(assignment.completed_at).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>

                      {assignment.remark && (
                        <p className="text-gray-700 mt-3 bg-gray-50 p-3 rounded-md">
                          <span className="font-medium">Remark:</span> {assignment.remark}
                        </p>
                      )}

                      {/* Original Incident Images */}
                      {assignment.incident_reports?.image_urls && assignment.incident_reports.image_urls.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-xs font-medium text-gray-500">
                              📸 Original Images ({assignment.incident_reports.image_urls.length})
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {assignment.incident_reports.image_urls.slice(0, 4).map((imageUrl, index) => (
                              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                                <img
                                  src={imageUrl}
                                  alt={`Incident Image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error('Failed to load incident image:', imageUrl);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          
                          {assignment.incident_reports.image_urls.length > 4 && (
                            <div className="mt-2 text-center">
                              <span className="text-xs text-gray-500">
                                +{assignment.incident_reports.image_urls.length - 4} more image{assignment.incident_reports.image_urls.length - 4 !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : activeTab === 'pending_review' ? (
              pendingReviewTasks.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks to review</h3>
                  <p className="text-gray-600">All completed tasks have been reviewed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingReviewTasks.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {assignment.incident_reports?.incident_title || 'Untitled Incident'}
                          </h3>
                          <p className="text-gray-600 mt-1">{assignment.action}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            PENDING REVIEW
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Assignee:</strong> {assignment.profiles?.full_name || 'Unknown'}</p>
                          <p><strong>Due Date:</strong> {new Date(assignment.target_completion_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p><strong>Completed:</strong> {new Date(assignment.completed_at!).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {assignment.remark && (
                        <p className="text-gray-700 mt-3 bg-gray-50 p-3 rounded-md">
                          <span className="font-medium">Remark:</span> {assignment.remark}
                        </p>
                      )}

                      {/* Original Incident Images */}
                      {assignment.incident_reports?.image_urls && assignment.incident_reports.image_urls.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-xs font-medium text-gray-500">
                              📸 Original Images ({assignment.incident_reports.image_urls.length})
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {assignment.incident_reports.image_urls.slice(0, 4).map((imageUrl, index) => (
                              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                                <img
                                  src={imageUrl}
                                  alt={`Incident Image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error('Failed to load incident image:', imageUrl);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          
                          {assignment.incident_reports.image_urls.length > 4 && (
                            <div className="mt-2 text-center">
                              <span className="text-xs text-gray-500">
                                +{assignment.incident_reports.image_urls.length - 4} more image{assignment.incident_reports.image_urls.length - 4 !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setSelectedAssignment(assignment)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Review Task →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : activeTab === 'review_history' ? (
              reviewedTasks.length === 0 ? (
                <div className="text-center py-12">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No review history</h3>
                  <p className="text-gray-600">You haven't reviewed any tasks yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewedTasks.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {assignment.incident_reports?.incident_title || 'Untitled Incident'}
                          </h3>
                          <p className="text-gray-600 mt-1">{assignment.action}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${assignment.review_status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {assignment.review_status?.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Assignee:</strong> {assignment.profiles?.full_name || 'Unknown'}</p>
                          <p><strong>Due Date:</strong> {new Date(assignment.target_completion_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p><strong>Completed:</strong> {assignment.completed_at ? new Date(assignment.completed_at).toLocaleDateString() : 'Not completed'}</p>
                        </div>
                      </div>

                      {assignment.remark && (
                        <p className="text-gray-700 mt-3 bg-gray-50 p-3 rounded-md">
                          <span className="font-medium">Remark:</span> {assignment.remark}
                        </p>
                      )}

                      {assignment.review_reason && (
                        <p className="text-red-700 mt-3 bg-red-50 p-3 rounded-md">
                          <span className="font-medium">Rejection Reason:</span> {assignment.review_reason}
                        </p>
                      )}

                      {/* Original Incident Images */}
                      {assignment.incident_reports?.image_urls && assignment.incident_reports.image_urls.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-xs font-medium text-gray-500">
                              📸 Original Images ({assignment.incident_reports.image_urls.length})
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {assignment.incident_reports.image_urls.slice(0, 4).map((imageUrl, index) => (
                              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                                <img
                                  src={imageUrl}
                                  alt={`Incident Image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error('Failed to load incident image:', imageUrl);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          
                          {assignment.incident_reports.image_urls.length > 4 && (
                            <div className="mt-2 text-center">
                              <span className="text-xs text-gray-500">
                                +{assignment.incident_reports.image_urls.length - 4} more image{assignment.incident_reports.image_urls.length - 4 !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
