import React, { useState, useEffect, useCallback } from 'react';
import { supabase, Assignment, Evidence } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';

interface ReviewFormProps {
  assignment: Assignment;
  onBack: () => void;
  onSuccess: () => void;
}

export function ReviewForm({ assignment, onBack, onSuccess }: ReviewFormProps) {
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [reviewReason, setReviewReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadEvidences = useCallback(async () => {
    try {
      console.log('🔍 Loading evidences for assignment:', assignment.id);
      const { data, error } = await supabase
        .from('evidences')
        .select('*')
        .eq('assignment_id', assignment.id);

      console.log('📊 Evidence query result:', { data, error });
      if (error) throw error;
      setEvidences(data || []);
      console.log('✅ Set evidences:', data?.length || 0);
    } catch (error) {
      console.error('❌ Error loading evidences:', error);
    } finally {
      setLoading(false);
    }
  }, [assignment.id]);

  useEffect(() => {
    loadEvidences();
  }, [loadEvidences]);

  const handleReview = async (approved: boolean) => {
    setSubmitting(true);
    try {
      console.log('✅ Processing review:', { 
        approved, 
        assignmentId: assignment.id,
        reviewStatus: approved ? 'approved' : 'rejected',
        reviewReason: reviewReason
      });
      
      const updateData = {
        review_status: approved ? 'approved' : 'rejected',
        review_reason: reviewReason,
        reviewed_at: new Date().toISOString(),
      };
      
      console.log('📝 Update data:', updateData);
      
      const { data, error } = await supabase
        .from('assignments')
        .update(updateData)
        .eq('id', assignment.id)
        .select(); // Add select to see what was actually updated

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

      // Update hazard report status
      const { error: reportError } = await supabase
        .from('hazard_reports')
        .update({ status: approved ? 'approved' : 'rejected' })
        .eq('id', assignment.hazard_report_id);

      console.log('📝 Hazard report update result:', { reportError });

      if (reportError) throw reportError;

      alert(approved ? '✅ Task approved successfully!' : '❌ Task rejected. Assignee will need to rework.');
      onSuccess();
    } catch (error) {
      console.error('❌ Error reviewing assignment:', error);
      alert('Failed to process review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-blue-600">Action Review by the OHS Person/ HAzard reporter</h1>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading evidence...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <div className="p-3 bg-gray-100 rounded-md">
                  {assignment.action}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Completion Date</label>
                <div className="p-3 bg-gray-100 rounded-md">
                  {new Date(assignment.target_completion_date).toLocaleDateString()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                <div className="p-3 bg-gray-100 rounded-md">
                  {assignment.remark || 'No remarks'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action Completed Date</label>
                <div className="p-3 bg-gray-100 rounded-md">
                  {assignment.completed_at ? new Date(assignment.completed_at).toLocaleDateString() : 'Not completed'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Evidence</label>
                <div className="grid grid-cols-3 gap-4">
                  {console.log('🔍 Rendering evidences:', evidences)}
                  {evidences.map((evidence, index) => (
                    <div key={evidence.id} className="border rounded-lg p-4 h-32">
                      {console.log('🔍 Evidence item:', evidence)}
                      {evidence.file_type?.startsWith('image/') ? (
                        <img
                          src={evidence.file_url}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-full object-cover rounded-md"
                          onError={(e) => {
                            console.error('❌ Image failed to load:', evidence.file_url);
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('✅ Image loaded successfully:', evidence.file_url);
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="text-2xl mb-2">📄</div>
                          <span className="text-xs text-gray-600 text-center">
                            {evidence.file_name}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {evidences.length === 0 && (
                    <div className="col-span-3 text-center text-gray-500 py-8">
                      No evidence uploaded (Debug: evidences array length = {evidences.length})
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  rows={4}
                  placeholder="Enter reason for approval/rejection"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleReview(false)}
                    disabled={submitting}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleReview(true)}
                    disabled={submitting}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Processing...' : 'Approve'}
                  </button>
                </div>
                
                <button
                  onClick={onBack}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}