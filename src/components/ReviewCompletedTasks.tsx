import React, { useState, useEffect, useCallback } from 'react';
import { supabase, Assignment, HazardReport } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Eye, Download, Clock } from 'lucide-react';
import { TaskStatusDisplay } from './TaskStatusDisplay';
import { Evidence } from '../lib/supabase'; // Import Evidence type

interface AssignmentWithDetails extends Assignment {
  hazard_reports: HazardReport;
  assignee_profile?: {
    email: string;
    full_name: string;
  };
}

// Define StatusData interface
interface StatusData {
  status: 'approved' | 'rejected' | 'pending' | undefined;
  assignmentId: string;
  hazardTitle: string;
  assigneeName: string;
  reviewerName: string;
  reviewReason?: string | null; // Make optional and allow null
  reviewedAt?: string; // Make optional as it might not always be present for existing data
}

export function ReviewCompletedTasks() {
  const { profile } = useAuth();
  const [completedAssignments, setCompletedAssignments] = useState<AssignmentWithDetails[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<Evidence[]>([]); // Use Evidence type
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [showStatusDisplay, setShowStatusDisplay] = useState(false);
  const [statusData, setStatusData] = useState<StatusData | null>(null); // Use StatusData type

  const loadEvidence = useCallback(async (assignmentId: string) => {
    try {
      console.log('🔍 Loading evidence for assignment:', assignmentId);
      const { data, error } = await supabase
        .from('evidences')
        .select('*')
        .eq('assignment_id', assignmentId);

      console.log('📊 Evidence query result:', { data, error });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error loading evidence:', error);
      return [];
    }
  }, []); // Empty dependency array as it doesn't depend on component props/state

  const loadCompletedAssignments = useCallback(async () => {
    try {
      console.log('🔍 Loading completed assignments for reviewer:', profile?.id);
      
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          hazard_reports (*),
          assignee_profile:profiles!assignments_assignee_id_fkey (
            email,
            full_name
          )
        `)
        .eq('reviewer_id', profile?.id)
        .or('review_status.eq.approved,review_status.eq.rejected')
        .order('completed_at', { ascending: false });

      console.log('📊 Completed assignments query result:', { data, error });

      if (error) throw error;
      setCompletedAssignments(data || []);
      console.log('✅ Set completed assignments:', data?.length || 0);
    } catch (error) {
      console.error('❌ Error loading completed assignments:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadCompletedAssignments();
  }, [loadCompletedAssignments]);

  // Refactored useEffect for loading evidence
  useEffect(() => {
    const loadEvidenceForAssignment = async () => {
      if (selectedAssignment?.id) {
        setLoadingEvidence(true);
        try {
          const evidence = await loadEvidence(selectedAssignment.id);
          setEvidenceFiles(evidence);
          console.log('✅ Loaded evidence files:', evidence);
        } catch (error) {
          console.error('❌ Error loading evidence:', error);
          setEvidenceFiles([]);
        } finally {
          setLoadingEvidence(false);
        }
      }
    };

    loadEvidenceForAssignment();
  }, [selectedAssignment?.id, loadEvidence]); // Added loadEvidence to dependencies

  const handleAccept = async (assignment: AssignmentWithDetails) => {
    console.log('✅ Accepting assignment:', assignment.id);
    setReviewing(true);
    try {
      // Update assignment status
      const { error: assignmentError } = await supabase
        .from('assignments')
        .update({ 
          review_status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      console.log('📝 Assignment update result:', { assignmentError });

      if (assignmentError) throw assignmentError;

      // Update hazard report status
      const { error: reportError } = await supabase
        .from('hazard_reports')
        .update({ status: 'approved' })
        .eq('id', assignment.hazard_report_id);

      console.log('📝 Hazard report update result:', { reportError });

      if (reportError) throw reportError;

      // Show status display
      setStatusData({
        status: 'approved',
        assignmentId: assignment.id,
        hazardTitle: assignment.hazard_reports.hazard_title,
        assigneeName: assignment.assignee_profile?.full_name || 'Unknown',
        reviewerName: profile?.full_name || 'Unknown',
        reviewReason: 'Task approved successfully',
        reviewedAt: new Date().toISOString()
      });
      setShowStatusDisplay(true);
    } catch (error) {
      console.error('❌ Error approving task:', error);
      alert('Failed to approve task. Please try again.');
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async (assignment: AssignmentWithDetails) => {
    console.log('❌ Rejecting assignment:', assignment.id);
    setReviewing(true);
    try {
      // Update assignment status
      const { error: assignmentError } = await supabase
        .from('assignments')
        .update({ 
          review_status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      console.log('📝 Assignment update result:', { assignmentError });

      if (assignmentError) throw assignmentError;

      // Update hazard report status back to assigned for rework
      const { error: reportError } = await supabase
        .from('hazard_reports')
        .update({ status: 'assigned' })
        .eq('id', assignment.hazard_report_id);

      console.log('📝 Hazard report update result:', { reportError });

      if (reportError) throw reportError;

      // Show status display
      setStatusData({
        status: 'rejected',
        assignmentId: assignment.id,
        hazardTitle: assignment.hazard_reports.hazard_title,
        assigneeName: assignment.assignee_profile?.full_name || 'Unknown',
        reviewerName: profile?.full_name || 'Unknown',
        reviewReason: 'Task rejected. Assignee will need to rework.',
        reviewedAt: new Date().toISOString()
      });
      setShowStatusDisplay(true);
    } catch (error) {
      console.error('❌ Error rejecting task:', error);
      alert('Failed to reject task. Please try again.');
    } finally {
      setReviewing(false);
    }
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
          loadCompletedAssignments();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading completed tasks...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Removed conditional useEffect block for selectedAssignment
  // The useEffect for loading evidence is now at the top level

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {selectedAssignment && ( // Render selected assignment details if available
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-blue-600">Review Completed Task</h1>
              <button
                onClick={() => {
                  setSelectedAssignment(null);
                  setEvidenceFiles([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Hazard Report Details</h3>
                  <div className="space-y-2">
                    <p><strong>Title:</strong> {selectedAssignment.hazard_reports.hazard_title}</p>
                    <p><strong>Description:</strong> {selectedAssignment.hazard_reports.description}</p>
                    <p><strong>Location:</strong> {selectedAssignment.hazard_reports.location}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Assignment Details</h3>
                  <div className="space-y-2">
                    <p><strong>Assignee:</strong> {selectedAssignment.assignee_profile?.full_name || 'Unknown'} ({selectedAssignment.assignee_profile?.email})</p>
                    <p><strong>Action Required:</strong> {selectedAssignment.action}</p>
                    <p><strong>Target Date:</strong> {selectedAssignment.target_completion_date ? new Date(selectedAssignment.target_completion_date).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Completed Date:</strong> {selectedAssignment.completed_at ? new Date(selectedAssignment.completed_at).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Remark:</strong> {selectedAssignment.remark || 'No remarks'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Evidence Files</h3>
                {loadingEvidence ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading evidence...</span>
                  </div>
                ) : evidenceFiles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {evidenceFiles.map((evidence, index) => (
                      <div key={evidence.id || index} className="p-4 border border-gray-200 rounded-lg"> {/* Use evidence.id for key */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {evidence.file_name || `Evidence ${index + 1}`}
                          </span>
                          <button
                            onClick={() => {
                              // Handle file download
                              console.log('📥 Downloading evidence:', evidence);
                              // You can implement file download logic here
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                        {evidence.file_url && (
                          <img 
                            src={evidence.file_url} 
                            alt="Evidence" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <Download className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No evidence files uploaded</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  onClick={() => handleReject(selectedAssignment)}
                  disabled={reviewing}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {reviewing ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleAccept(selectedAssignment)}
                  disabled={reviewing}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {reviewing ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedAssignment && ( // Only render the list if no assignment is selected
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-blue-600">Review Completed Tasks</h1>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">{completedAssignments.length} tasks</span>
              </div>
            </div>

            {completedAssignments.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No completed tasks to review</h3>
                <p className="text-gray-500">When assignees complete tasks, they will appear here for your review.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedAssignments.map((assignment) => (
                  <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {assignment.hazard_reports.hazard_title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Completed by: {assignment.assignee_profile?.full_name || 'Unknown'} ({assignment.assignee_profile?.email})
                        </p>
                        <p className="text-sm text-gray-500">
                          Completed on: {assignment.completed_at ? new Date(assignment.completed_at).toLocaleDateString() : 'N/A'}
                        </p>
                        {assignment.review_status && (
                          <div className="mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              assignment.review_status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : assignment.review_status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {assignment.review_status.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {assignment.review_status === 'approved' || assignment.review_status === 'rejected' ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🔍 View status clicked for assignment:', assignment.id);
                              setStatusData({
                                status: assignment.review_status,
                                assignmentId: assignment.id,
                                hazardTitle: assignment.hazard_reports.hazard_title,
                                assigneeName: assignment.assignee_profile?.full_name || 'Unknown',
                                reviewerName: profile?.full_name || 'Unknown',
                                reviewReason: assignment.review_reason || 'No review comments',
                                reviewedAt: assignment.reviewed_at || 'N/A' // Fallback for reviewedAt
                              });
                              setShowStatusDisplay(true);
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Status
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🔍 Review button clicked for assignment:', assignment.id);
                              console.log('📊 Assignment data:', assignment);
                              setSelectedAssignment(assignment);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review Completion →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
