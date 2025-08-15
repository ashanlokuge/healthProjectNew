import React, { useState, useEffect, useCallback } from 'react';
import { supabase, HazardReport, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Search } from 'lucide-react';

interface AssignmentFormProps {
  report: HazardReport;
  onBack: () => void;
  onSuccess: () => void;
}

export function AssignmentForm({ report, onBack, onSuccess }: AssignmentFormProps) {
  const { profile } = useAuth();
  const [assignees, setAssignees] = useState<Profile[]>([]);
  const [filteredAssignees, setFilteredAssignees] = useState<Profile[]>([]);
  const [emailSearch, setEmailSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    action: '',
    targetDate: '',
    remark: '',
    assigneeId: '',
  });

  const loadAssignees = useCallback(async () => {
    try {
      console.log('🔍 Loading assignees...');

      const { data: allProfiles, error: allError } = await supabase
        .from('profiles')
        .select('*');

      console.log('📊 All profiles query:', { allProfiles, allError });

      if (allError) {
        console.error('❌ Error loading all profiles:', allError);
        setAssignees([]);
        setFilteredAssignees([]);
        return;
      }

      if (allProfiles) {
        console.log('📊 Total profiles found:', allProfiles.length);

        const roleCounts = allProfiles.reduce((acc, p) => {
          acc[p.role] = (acc[p.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log('📊 Role distribution:', roleCounts);

        const assigneeProfiles = allProfiles.filter(p => p.role === 'assignee');
        console.log('📊 Assignee profiles found:', assigneeProfiles);

        setAssignees(assigneeProfiles);
        setFilteredAssignees(assigneeProfiles);
      }
    } catch (error) {
      console.error('💥 Error loading assignees:', error);
      setAssignees([]);
      setFilteredAssignees([]);
    }
  }, []);

  useEffect(() => {
    loadAssignees();
  }, [loadAssignees]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedAssignee = assignees.find(a => a.id === formData.assigneeId);

      if (!selectedAssignee) {
        alert('Please select an assignee');
        setLoading(false);
        return;
      }

      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          hazard_report_id: report.id,
          reviewer_id: profile?.id,
          assignee_id: selectedAssignee.id,
          action: formData.action,
          target_completion_date: formData.targetDate,
          remark: formData.remark
        });

      if (assignmentError) {
        console.error('❌ Error creating assignment:', assignmentError);
        alert('Failed to assign task. Please try again.');
        setLoading(false);
        return;
      }

      const { error: reportError } = await supabase
        .from('hazard_reports')
        .update({ status: 'assigned' })
        .eq('id', report.id);

      if (reportError) {
        console.error('❌ Error updating report status:', reportError);
      }

      console.log('✅ Task assigned successfully to:', selectedAssignee.email);
      alert(`Task assigned successfully to ${selectedAssignee.email}`);
      onSuccess();
    } catch (error) {
      console.error('💥 Error assigning task:', error);
      alert('Failed to assign task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Assign Task</h2>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Report Details</h3>
        <p className="text-blue-800"><strong>Title:</strong> {report.hazard_title}</p>
        <p className="text-blue-800"><strong>Description:</strong> {report.description}</p>
        <p className="text-blue-800"><strong>Location:</strong> {report.location}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Assignee by Email *
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
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Assignee *
          </label>
          <select
            value={formData.assigneeId}
            onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Action Required *
          </label>
          <textarea
            value={formData.action}
            onChange={(e) => setFormData({ ...formData, action: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Describe what action needs to be taken..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Date *
          </label>
          <input
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Remarks
          </label>
          <textarea
            value={formData.remark}
            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Any additional notes or instructions..."
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || filteredAssignees.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Assigning...' : 'Assign Task'}
          </button>
        </div>
      </form>


    </div>
  );
} 