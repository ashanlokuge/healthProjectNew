import React, { useState, useEffect, useCallback } from 'react';
import { supabase, HazardReport } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, FileText, Calendar, MapPin } from 'lucide-react';
import { HazardForm } from './HazardForm';

export function UserDashboard() {
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const loadReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('hazard_reports')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      loadReports();
    }
  }, [profile?.id, loadReports]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-blue-100 text-blue-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (showForm) {
    return <HazardForm onBack={() => setShowForm(false)} onSuccess={() => {
      setShowForm(false);
      loadReports();
    }} />;
  }

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-900">My Hazard Reports</h1>
              <p className="text-blue-600 mt-1">Submit and track workplace safety reports</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Report</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-blue-600 mt-4">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-blue-900 mb-2">No reports yet</h3>
            <p className="text-blue-600 mb-4">Get started by submitting your first hazard report</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
            >
              Submit Report
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-blue-100 hover:border-blue-200">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 truncate">{report.hazard_title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-blue-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{report.site} - {report.department}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Reported: {new Date(report.date_of_reporting).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <p className="text-blue-700 mt-3 text-sm line-clamp-2">{report.description}</p>
                
                {report.risk_level && (
                  <div className="mt-4">
                    <span className="text-xs font-medium text-blue-500">Risk Level:</span>
                    <span className="text-sm text-blue-900 ml-1">{report.risk_level}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}