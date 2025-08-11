import { useState, useEffect, useCallback } from 'react';
import { supabase, HazardReport, Assignment } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Users, Clock, CheckCircle, Eye, AlertTriangle, Calendar, User, Star } from 'lucide-react';
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
      color: 'blue',
      emoji: '📄'
    },
    {
      id: 'assignments',
      label: 'My Assignments',
      icon: Users,
      count: assignments.length,
      color: 'purple',
      emoji: '👥'
    },
    {
      id: 'pending_review',
      label: 'Tasks to Review',
      icon: Clock,
      count: pendingReviewTasks.length,
      color: 'orange',
      emoji: '⏰'
    },
    {
      id: 'review_history',
      label: 'Review History',
      icon: Eye,
      count: reviewedTasks.length,
      color: 'green',
      emoji: '👁️'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b border-slate-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Star className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Reviewer Dashboard
                </h1>
                <p className="text-slate-600 text-lg font-medium">Manage hazard reports and review assignments</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-semibold border border-blue-200">
                🎯 Active Reviewer
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Modern Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-xl border border-slate-200/50">
            <div className="grid grid-cols-4 gap-2">
              {tabConfig.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'reports' | 'assignments' | 'pending_review' | 'review_history')}
                    className={`relative p-4 rounded-xl transition-all duration-300 ${isActive
                      ? 'bg-white shadow-lg scale-105 border border-slate-200'
                      : 'hover:bg-white/50 hover:scale-102'
                      }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive
                        ? `bg-gradient-to-br from-${tab.color}-500 to-${tab.color}-600 shadow-lg`
                        : `bg-${tab.color}-100`
                        }`}>
                        <Icon className={`w-6 h-6 ${isActive ? 'text-white' : `text-${tab.color}-600`}`} />
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-lg">{tab.emoji}</span>
                          <span className={`text-sm font-semibold ${isActive ? 'text-slate-900' : 'text-slate-600'
                            }`}>
                            {tab.label}
                          </span>
                        </div>
                        <div className={`text-xs font-bold px-2 py-1 rounded-full mt-1 ${isActive
                          ? `bg-${tab.color}-100 text-${tab.color}-700`
                          : 'bg-slate-100 text-slate-600'
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
              <p className="text-slate-600 text-lg font-medium">Loading your dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === 'reports' && (
              <div>
                {reports.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No New Reports</h3>
                    <p className="text-slate-600 text-lg">All reports have been assigned or reviewed</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {reports.map((report, index) => (
                      <div
                        key={report.id}
                        className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                              <AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">{report.hazard_title}</h3>
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                {report.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <span className="font-semibold">🏢 Site:</span>
                            <span>{report.site}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <span className="font-semibold">🏬 Department:</span>
                            <span>{report.department}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <span className="font-semibold">⚠️ Risk Level:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${report.risk_level === 'Critical' ? 'bg-red-100 text-red-700' :
                              report.risk_level === 'High' ? 'bg-orange-100 text-orange-700' :
                                report.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                              }`}>
                              {report.risk_level || 'Not specified'}
                            </span>
                          </div>
                        </div>

                        <p className="text-slate-700 text-sm mb-4 line-clamp-2">{report.description}</p>

                        {/* Images */}
                        {report.image_urls && report.image_urls.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-slate-700 mb-2">📸 Evidence Photos:</p>
                            <div className="grid grid-cols-3 gap-2">
                              {report.image_urls.slice(0, 3).map((imageUrl, imgIndex) => (
                                <div key={imgIndex} className="relative group">
                                  <img
                                    src={imageUrl}
                                    alt={`Hazard ${imgIndex + 1}`}
                                    className="w-full h-16 object-cover rounded-lg border-2 border-slate-200 cursor-pointer group-hover:border-blue-400 transition-colors"
                                    onClick={() => window.open(imageUrl, '_blank')}
                                  />
                                </div>
                              ))}
                            </div>
                            {report.image_urls.length > 3 && (
                              <p className="text-xs text-slate-500 mt-1">
                                +{report.image_urls.length - 3} more photos
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex space-x-2 pt-4 border-t border-slate-200">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            📋 Assign Task
                          </button>
                          <button
                            onClick={() => handleDirectReview(report)}
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            ✅ Review Now
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
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Users className="w-12 h-12 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No Active Assignments</h3>
                    <p className="text-slate-600 text-lg">You haven't created any assignments yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {assignments.map((assignment, index) => (
                      <div
                        key={assignment.id}
                        className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50 hover:shadow-2xl transition-all duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">
                                {assignment.hazard_reports?.hazard_title}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <User className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-600">Assigned to: {assignment.profiles?.full_name}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-600">
                              Due: {new Date(assignment.target_completion_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 mb-4">
                          <p className="text-slate-700 font-medium">{assignment.action}</p>
                        </div>

                        {/* Images for assignments */}
                        {assignment.hazard_reports?.image_urls && assignment.hazard_reports.image_urls.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-slate-700 mb-2">📸 Hazard Photos:</p>
                            <div className="grid grid-cols-4 gap-2">
                              {assignment.hazard_reports.image_urls.slice(0, 4).map((imageUrl, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={imageUrl}
                                  alt={`Hazard ${imgIndex + 1}`}
                                  className="w-full h-16 object-cover rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
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
                              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              🔍 Review Completion
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
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Clock className="w-12 h-12 text-orange-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No Tasks to Review</h3>
                    <p className="text-slate-600 text-lg">All completed tasks have been reviewed</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingReviewTasks.map((assignment, index) => (
                      <div
                        key={assignment.id}
                        className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-l-4 border-orange-400 hover:shadow-2xl transition-all duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                              <Clock className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">
                                {assignment.hazard_reports?.hazard_title}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <User className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-600">Completed by: {assignment.profiles?.full_name}</span>
                              </div>
                              <p className="text-sm text-slate-500">
                                Completed on: {new Date(assignment.completed_at!).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 rounded-full text-sm font-bold border border-orange-300">
                            ⏰ AWAITING REVIEW
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 mb-4">
                          <p className="text-slate-700 font-medium">{assignment.action}</p>
                        </div>

                        {/* Images for pending review */}
                        {assignment.hazard_reports?.image_urls && assignment.hazard_reports.image_urls.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-slate-700 mb-2">📸 Hazard Photos:</p>
                            <div className="grid grid-cols-4 gap-2">
                              {assignment.hazard_reports.image_urls.slice(0, 4).map((imageUrl, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={imageUrl}
                                  alt={`Hazard ${imgIndex + 1}`}
                                  className="w-full h-16 object-cover rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {assignment.remark && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                            <p className="text-blue-800">
                              <span className="font-semibold">💬 Remark:</span> {assignment.remark}
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
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            🔍 Review Now
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
                    <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Eye className="w-12 h-12 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No Review History</h3>
                    <p className="text-slate-600 text-lg">You haven't reviewed any tasks yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviewedTasks.map((assignment, index) => (
                      <div
                        key={assignment.id}
                        className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-l-4 hover:shadow-2xl transition-all duration-300 ${assignment.review_status === 'approved' ? 'border-green-400' : 'border-red-400'
                          }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${assignment.review_status === 'approved'
                              ? 'bg-gradient-to-br from-green-500 to-green-600'
                              : 'bg-gradient-to-br from-red-500 to-red-600'
                              }`}>
                              {assignment.review_status === 'approved' ? (
                                <CheckCircle className="w-6 h-6 text-white" />
                              ) : (
                                <AlertTriangle className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">
                                {assignment.hazard_reports?.hazard_title}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <User className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-600">Assignee: {assignment.profiles?.full_name}</span>
                              </div>
                              <p className="text-sm text-slate-500">
                                Reviewed on: {assignment.reviewed_at ? new Date(assignment.reviewed_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className={`px-4 py-2 rounded-full text-sm font-bold ${assignment.review_status === 'approved'
                            ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border border-green-300'
                            : 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border border-red-300'
                            }`}>
                            {assignment.review_status === 'approved' ? '✅ APPROVED' : '❌ REJECTED'}
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 mb-4">
                          <p className="text-slate-700 font-medium">{assignment.action}</p>
                        </div>

                        {/* Images for review history */}
                        {assignment.hazard_reports?.image_urls && assignment.hazard_reports.image_urls.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-slate-700 mb-2">📸 Hazard Photos:</p>
                            <div className="grid grid-cols-4 gap-2">
                              {assignment.hazard_reports.image_urls.slice(0, 4).map((imageUrl, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={imageUrl}
                                  alt={`Hazard ${imgIndex + 1}`}
                                  className="w-full h-16 object-cover rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {assignment.review_reason && (
                          <div className={`rounded-xl p-4 mb-4 border ${assignment.review_status === 'approved'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                            }`}>
                            <p className={assignment.review_status === 'approved' ? 'text-green-800' : 'text-red-800'}>
                              <span className="font-semibold">💬 Review Comment:</span> {assignment.review_reason}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-semibold">Completed & Reviewed</span>
                          </div>

                          <span className="text-sm text-slate-500 font-medium">
                            Completed: {assignment.completed_at ? new Date(assignment.completed_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
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