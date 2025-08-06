import React, { useState, useEffect, useCallback } from 'react';
import { supabase, HazardReport, Assignment } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Users, Clock, CheckCircle, Eye } from 'lucide-react';
import { AssignmentForm } from './AssignmentForm';
import { ReviewForm } from './ReviewForm';
import { ReviewCompletedTasks } from './ReviewCompletedTasks';

export function ReviewerDashboard() {
  const [activeTab, setActiveTab] = useState<'reports' | 'assignments' | 'completed'>('reports');
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedReport, setSelectedReport] = useState<HazardReport | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const loadData = useCallback(async () => {
    try {
      console.log('🔍 Loading data for reviewer:', profile?.id);
      
      // Load unassigned reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('hazard_reports')
        .select('*')
        .eq('status', 'submitted')
        .order('created_at', { ascending: false });

      console.log('📊 Reports query result:', { reportsData, reportsError });

      if (reportsError) throw reportsError;

      // Load assignments created by this reviewer (excluding approved/rejected ones)
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          hazard_reports (*),
          profiles!assignments_assignee_id_fkey(full_name, email)
        `)
        .eq('reviewer_id', profile?.id)
        .or('review_status.is.null,review_status.eq.pending')
        .order('created_at', { ascending: false });

      console.log('📊 Assignments query result:', { assignmentsData, assignmentsError });

      if (assignmentsError) throw assignmentsError;

      setReports(reportsData || []);
      setAssignments(assignmentsData || []);
      
      console.log('✅ Set reports:', reportsData?.length || 0);
      console.log('✅ Set assignments:', assignmentsData?.length || 0);
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      loadData();
    }
  }, [profile?.id, loadData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'in_review': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDirectReview = async (report: HazardReport) => {
    try {
      console.log('🔄 Starting direct review for report:', report.id);
      
      // Update report status to 'in_review'
      const { error: updateError } = await supabase
        .from('hazard_reports')
        .update({ status: 'in_review' })
        .eq('id', report.id);

      if (updateError) throw updateError;

      // Create a direct review assignment
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert([
          {
            hazard_report_id: report.id,
            reviewer_id: profile?.id,
            assignee_id: profile?.id, // Self-assign for direct review
            action: 'Direct review by reviewer',
            target_completion_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
            remark: 'Direct review without assignee',
            completed_at: new Date().toISOString(), // Mark as completed immediately
            reviewed_at: new Date().toISOString(), // Mark as reviewed
          },
        ]);

      if (assignmentError) throw assignmentError;

      console.log('✅ Direct review completed');
      
      // Reload data
      await loadData();
    } catch (error) {
      console.error('❌ Error in direct review:', error);
    }
  };



  if (selectedReport) {
    console.log('📋 Loading AssignmentForm for report:', selectedReport);
    return (
      <AssignmentForm
        report={selectedReport}
        onBack={() => {
          console.log('🔙 Going back from AssignmentForm');
          setSelectedReport(null);
        }}
        onSuccess={() => {
          console.log('✅ AssignmentForm completed successfully');
          setSelectedReport(null);
          loadData();
        }}
      />
    );
  }

  if (selectedAssignment) {
    return (
      <ReviewForm
        assignment={selectedAssignment}
        onBack={() => setSelectedAssignment(null)}
        onSuccess={() => {
          setSelectedAssignment(null);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Reviewer Dashboard</h1>
          
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'reports'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              New Reports ({reports.length})
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'assignments'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              My Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'completed'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              Review Completed
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
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{report.hazard_title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {report.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Site:</strong> {report.site}</p>
                        <p><strong>Department:</strong> {report.department}</p>
                        <p><strong>Risk Level:</strong> {report.risk_level || 'Not specified'}</p>
                      </div>
                      
                      <p className="text-gray-700 mt-3 text-sm line-clamp-2">{report.description}</p>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🔵 Assign Task button clicked for report:', report.id);
                              setSelectedReport(report);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Assign Task →
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectReview(report);
                            }}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Review Directly →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
                            {assignment.hazard_reports?.hazard_title}
                          </h3>
                          <p className="text-gray-600">Assigned to: {assignment.profiles?.full_name}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Due: {new Date(assignment.target_completion_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{assignment.action}</p>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          {assignment.completed_at && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm">Completed</span>
                            </div>
                          )}
                          {assignment.is_approved !== null && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              assignment.is_approved 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {assignment.is_approved ? 'APPROVED' : 'REJECTED'}
                            </span>
                          )}
                        </div>
                        
                        {assignment.completed_at && assignment.is_approved === null && (
                          <button
                            onClick={() => setSelectedAssignment(assignment)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Review Completion →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <ReviewCompletedTasks />
            )}
          </div>
        )}
      </div>
    </div>
  );
}