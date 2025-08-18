import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, FileText, Calendar, MapPin, AlertTriangle, Image } from 'lucide-react';
import { IncidentForm } from './IncidentForm';

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
  status: string;
  image_urls?: string[] | null;
  created_at: string;
}

export function IncidentUserDashboard() {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const loadReports = useCallback(async () => {
    try {
      console.log('🔍 Loading incident reports for user:', profile?.id);
      
      const { data, error } = await supabase
        .from('incident_reports')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('📊 Incident reports loaded:', data);
      setReports(data || []);
    } catch (error) {
      console.error('Error loading incident reports:', error);
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
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showForm) {
    return <IncidentForm onBack={() => setShowForm(false)} onSuccess={() => {
      setShowForm(false);
      loadReports();
    }} />;
  }

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Incident Reports</h1>
              <p className="text-gray-600 mt-1">Submit and track workplace incident reports</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Incident Report</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading incident reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No incident reports yet</h3>
            <p className="text-gray-600 mb-4">Get started by submitting your first incident report</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Submit Incident Report
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => {
              const hasImages = report.image_urls && report.image_urls.length > 0;
              
              console.log(`🔍 Report ${report.id} (${report.incident_title}):`, {
                imageUrls: report.image_urls,
                hasImages,
                imageCount: report.image_urls?.length || 0
              });
              
              return (
                <div key={report.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{report.incident_title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{report.site} - {report.department}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Incident: {new Date(report.date_of_incident).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Reported: {new Date(report.date_of_reporting).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mt-3 text-sm line-clamp-2">{report.description}</p>
                  
                  {report.location && (
                    <div className="mt-4">
                      <span className="text-xs font-medium text-gray-500">Location:</span>
                      <span className="text-sm text-gray-900 ml-1">{report.location}</span>
                    </div>
                  )}

                  {/* Evidence Images Section */}
                  {hasImages && (
                    <div className="mt-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Image className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-medium text-gray-500">
                          Evidence ({report.image_urls!.length} image{report.image_urls!.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {report.image_urls!.slice(0, 4).map((imageUrl, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                            <img
                              src={imageUrl}
                              alt={`Evidence ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Failed to load image:', imageUrl);
                                e.currentTarget.style.display = 'none';
                              }}
                              onLoad={() => {
                                console.log('✅ Image loaded successfully:', imageUrl);
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 