import { useState, useEffect, useCallback } from 'react';
import { supabase, HazardReport, Assignment } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Users, Clock, CheckCircle, Eye, AlertTriangle, Calendar, User } from 'lucide-react';
import { AssignmentForm } from './AssignmentForm';
import { ReviewForm } from './ReviewForm';

export function ReviewerDashboard() {
  const [activeTab, setActiveTab] = useState<'reports' | 'assignments' | 'pending_review' | 'review_history'>('reports');
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pendingReviewTasks, setPendingReviewTasks] = useState<Assignment[]>([]);
  const [reviewedTasks, setReviewedTasks] = useState<Assignment[]>([]);
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

      if (reportsError) throw reportsError;

      // Load assignments created by this reviewer (exclude approved/rejected tasks)
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          hazard_reports (*),
          profiles!assignments_assignee_id_fkey(full_name, email)
        `)
        .eq('reviewer_id', profile?.id)
        .not('review_status', 'in', '("approved","rejected")')
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Load tasks pending review
      const { data: pendingReviewData, error: pendingReviewError } = await supabase
        .from('assignments')
        .select(`
          *,
          hazard_reports (*),
          profiles!assignments_assignee_id_fkey(full_name, email)
        `)
        .eq('reviewer_id', profile?.id)
        .not('completed_at', 'is', null)
        .is('review_status', null)
        .order('completed_at', { ascending: false });

      if (pendingReviewError) throw pendingReviewError;

      // Load reviewed tasks
      const { data: reviewedData, error: reviewedError } = await supabase
        .from('assignments')
        .select(`
          *,
          hazard_reports (*),
          profiles!assignments_assignee_id_fkey(full_name, email)
        `)
        .eq('reviewer_id', profile?.id)
        .in('review_status', ['approved', 'rejected'])
        .order('reviewed_at', { ascending: false });

      if (reviewedError) throw reviewedError;

      setReports(reportsData || []);
      setAssignments(assignmentsData || []);
      setPendingReviewTasks(pendingReviewData || []);
      setReviewedTasks(reviewedData || []);
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

  const handleDirectReview = async (report: HazardReport) => {
    try {
      const { error: updateError } = await supabase
        .from('hazard_reports')
        .update({ status: 'in_review' })
        .eq('id', report.id);

      if (updateError) throw updateError;

      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert([
          {
            hazard_report_id: report.id,
            reviewer_id: profile?.id,
            assignee_id: profile?.id,
            action: 'Direct review by reviewer',
            target_completion_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            remark: 'Direct review without assignee',
            completed_at: new Date().toISOString(),
            reviewed_at: new Date().toISOString(),
          },
        ]);

      if (assignmentError) throw assignmentError;
      await loadData();
    } catch (error) {
      console.error('❌ Error in direct review:', error);
    }
  };

  if (selectedReport) {
    return (
      <AssignmentForm
        report={selectedReport}
        onBack={() => setSelectedReport(null)}
        onSuccess={() => {
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

  const tabConfig = [
    {
      id: 'reports',
      label: 'New Reports',
      icon: FileText,
      count: reports.length,
      color: 'blue'
    },
    {
      id: 'assignments',
      label: 'My Assignments',
      icon: Users,
      count: assignments.length,
      color: 'purple'
    },
    {
      id: 'pending_review',
      label: 'Tasks to Review',
      icon: Clock,
      count: pendingReviewTasks.length,
      color: 'orange'
    },
    {
      id: 'review_history',
      label: 'Review History',
      icon: Eye,
      count: reviewedTasks.length,
      color: 'green'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reviewer Dashboard</h1>
                <p className="text-gray-600">Manage hazard reports and review assignments</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-200">
                Active Reviewer
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
            <div className="grid grid-cols-4 gap-4">
              {tabConfig.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'reports' | 'assignments' | 'pending_review' | 'review_history')}
                    className={`p-4 rounded-lg transition-all duration-200 ${isActive
                      ? 'bg-white shadow-md border border-gray-200'
                      : 'hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isActive
                        ? tab.color === 'blue' ? 'bg-blue-500 text-white' :
                          tab.color === 'purple' ? 'bg-purple-500 text-white' :
                            tab.color === 'orange' ? 'bg-orange-500 text-white' :
                              'bg-green-500 text-white'
                        : tab.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                          tab.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                            tab.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                              'bg-green-100 text-green-600'
                        }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <span className={`text-sm font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                          {tab.label}
                        </span>
                        <div className={`text-xs font-bold px-2 py-1 rounded-full mt-1 ${isActive
                          ? tab.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                            tab.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                              tab.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                          }`}>
                          {tab.count} items
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg font-medium">Loading your dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === 'reports' && (
              <div>
                {reports.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No New Reports</h3>
                    <p className="text-gray-600 text-lg">All reports have been assigned or reviewed</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {reports.map((report, index) => (
                      <div
                        key={report.id}
                        className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                              <AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{report.hazard_title}</h3>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                {report.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="font-semibold">Site:</span>
                            <span>{report.site}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="font-semibold">Department:</span>
                            <span>{report.department}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="font-semibold">Risk Level:</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${report.risk_level === 'Critical' ? 'bg-red-100 text-red-700' :
                              report.risk_level === 'High' ? 'bg-orange-100 text-orange-700' :
                                report.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                              }`}>
                              {report.risk_level || 'Not specified'}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">{report.description}</p>

                        {/* Images */}
                        {report.image_urls && report.image_urls.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Evidence Photos:</p>
                            <div className="grid grid-cols-3 gap-2">
                              {report.image_urls.slice(0, 3).map((imageUrl, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={imageUrl}
                                  alt={`Hazard ${imgIndex + 1}`}
                                  className="w-full h-16 object-cover rounded border cursor-pointer hover:border-blue-400 transition-colors"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                />
                              ))}
                            </div>
                            {report.image_urls.length > 3 && (
                              <p className="text-xs text-gray-500 mt-1">
                                +{report.image_urls.length - 3} more photos
                              </p>
                            )}
                          </div>
                        )}

                        <div className="pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                          >
                            Assign Task
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'assignments' && (
              <div>
                {assignments.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                      <Users className="w-12 h-12 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No Active Assignments</h3>
                    <p className="text-gray-600 text-lg">You haven't created any assignments yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {assignments.map((assignment, index) => (
                      <div
                        key={assignment.id}
                        className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {assignment.hazard_reports?.hazard_title}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">Assigned to: {assignment.profiles?.full_name}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Due: {new Date(assignment.target_completion_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <p className="text-gray-700 font-medium">{assignment.action}</p>
                        </div>

                        {/* Images for assignments */}
                        {assignment.hazard_reports?.image_urls && assignment.hazard_reports.image_urls.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Hazard Photos:</p>
                            <div className="grid grid-cols-4 gap-2">
                              {assignment.hazard_reports.image_urls.slice(0, 4).map((imageUrl, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={imageUrl}
                                  alt={`Hazard ${imgIndex + 1}`}
                                  className="w-full h-16 object-cover rounded border cursor-pointer hover:border-purple-400 transition-colors"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            {assignment.completed_at && (
                              <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-semibold">Completed</span>
                              </div>
                            )}
                            {assignment.review_status && assignment.review_status !== 'pending' && (
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${assignment.review_status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}>
                                {assignment.review_status.toUpperCase()}
                              </span>
                            )}
                          </div>

                          {assignment.completed_at && (!assignment.review_status || assignment.review_status === 'pending') && (
                            <button
                              onClick={() => setSelectedAssignment(assignment)}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                              Review Completion
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pending_review' && (
              <div>
                {pendingReviewTasks.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                      <Clock className="w-12 h-12 text-orange-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No Tasks to Review</h3>
                    <p className="text-gray-600 text-lg">All completed tasks have been reviewed</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingReviewTasks.map((assignment, index) => (
                      <div
                        key={assignment.id}
                        className="bg-white rounded-xl p-6 shadow-md border-l-4 border-orange-400 hover:shadow-lg transition-all duration-200"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                              <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {assignment.hazard_reports?.hazard_title}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">Completed by: {assignment.profiles?.full_name}</span>
                              </div>
                              <p className="text-sm text-gray-500">
                                Completed on: {new Date(assignment.completed_at!).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold border border-orange-300">
                            AWAITING REVIEW
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <p className="text-gray-700 font-medium">{assignment.action}</p>
                        </div>

                        {/* Images for pending review */}
                        {assignment.hazard_reports?.image_urls && assignment.hazard_reports.image_urls.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Hazard Photos:</p>
                            <div className="grid grid-cols-4 gap-2">
                              {assignment.hazard_reports.image_urls.slice(0, 4).map((imageUrl, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={imageUrl}
                                  alt={`Hazard ${imgIndex + 1}`}
                                  className="w-full h-16 object-cover rounded border cursor-pointer hover:border-orange-400 transition-colors"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {assignment.remark && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-blue-800">
                              <span className="font-semibold">Remark:</span> {assignment.remark}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-semibold">Task Completed</span>
                          </div>

                          <button
                            onClick={() => setSelectedAssignment(assignment)}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                          >
                            Review Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'review_history' && (
              <div>
                {reviewedTasks.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                      <Eye className="w-12 h-12 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No Review History</h3>
                    <p className="text-gray-600 text-lg">You haven't reviewed any tasks yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviewedTasks.map((assignment, index) => (
                      <div
                        key={assignment.id}
                        className={`bg-white rounded-xl p-6 shadow-md border-l-4 hover:shadow-lg transition-all duration-200 ${assignment.review_status === 'approved' ? 'border-green-400' : 'border-red-400'
                          }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${assignment.review_status === 'approved'
                              ? 'bg-green-500'
                              : 'bg-red-500'
                              }`}>
                              {assignment.review_status === 'approved' ? (
                                <CheckCircle className="w-5 h-5 text-white" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {assignment.hazard_reports?.hazard_title}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">Assignee: {assignment.profiles?.full_name}</span>
                              </div>
                              <p className="text-sm text-gray-500">
                                Reviewed on: {assignment.reviewed_at ? new Date(assignment.reviewed_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-bold border ${assignment.review_status === 'approved'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-red-100 text-red-700 border-red-300'
                            }`}>
                            {assignment.review_status === 'approved' ? 'APPROVED' : 'REJECTED'}
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <p className="text-gray-700 font-medium">{assignment.action}</p>
                        </div>

                        {/* Images for review history */}
                        {assignment.hazard_reports?.image_urls && assignment.hazard_reports.image_urls.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Hazard Photos:</p>
                            <div className="grid grid-cols-4 gap-2">
                              {assignment.hazard_reports.image_urls.slice(0, 4).map((imageUrl, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={imageUrl}
                                  alt={`Hazard ${imgIndex + 1}`}
                                  className="w-full h-16 object-cover rounded border cursor-pointer hover:border-green-400 transition-colors"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {assignment.review_comment && (
                          <div className={`border rounded-lg p-4 ${assignment.review_status === 'approved'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                            }`}>
                            <p className={assignment.review_status === 'approved' ? 'text-green-800' : 'text-red-800'}>
                              <span className="font-semibold">Review Comment:</span> {assignment.review_comment}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}