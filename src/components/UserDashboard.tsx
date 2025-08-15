import React, { useState, useEffect, useCallback } from 'react';
import { supabase, HazardReport } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, FileText, Calendar, MapPin, Eye, X } from 'lucide-react';
import { HazardForm } from './HazardForm';

export function UserDashboard() {
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<HazardReport | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { profile } = useAuth();

  // Helper function to parse image URLs from different data formats
  const parseImageUrls = (imageData: unknown): string[] => {
    console.log('🔍 parseImageUrls called with:', imageData);

    if (!imageData) {
      console.log('❌ No image data provided');
      return [];
    }

    // If it's already an array of strings, return it
    if (Array.isArray(imageData) && imageData.every(url => typeof url === 'string')) {
      console.log('✅ Found array of strings:', imageData);
      return imageData;
    }

    // If it's a JSON string, try to parse it
    if (typeof imageData === 'string') {
      try {
        const parsed = JSON.parse(imageData);
        if (Array.isArray(parsed) && parsed.every(url => typeof url === 'string')) {
          console.log('✅ Parsed JSON string to array:', parsed);
          return parsed;
        }
      } catch {
        console.warn('⚠️ Failed to parse image data as JSON:', imageData);
      }
    }

    // If it's a single string URL, wrap it in an array
    if (typeof imageData === 'string' && imageData.startsWith('http')) {
      console.log('✅ Found single URL string:', imageData);
      return [imageData];
    }

    console.warn('❌ Unexpected image data format:', imageData);
    return [];
  };

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

                {/* View Details Button */}
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="w-full bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center space-x-2 text-sm font-medium border border-blue-200 hover:border-blue-300"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report Details Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-blue-200">
                <h2 className="text-2xl font-bold text-blue-900">Hazard Report Details</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-blue-400 hover:text-blue-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Title and Status */}
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold text-blue-900">{selectedReport.hazard_title}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Location and Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Site</p>
                      <p className="text-blue-700">{selectedReport.site}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Reported Date</p>
                      <p className="text-blue-700">{new Date(selectedReport.date_of_reporting).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Department */}
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-2">Department</p>
                  <p className="text-blue-700">{selectedReport.department}</p>
                </div>

                {/* Description */}
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-2">Description</p>
                  <p className="text-blue-700 leading-relaxed">{selectedReport.description}</p>
                </div>

                {/* Risk Level */}
                {selectedReport.risk_level && (
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-2">Risk Level</p>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {selectedReport.risk_level}
                    </span>
                  </div>
                )}

                {/* Images */}
                {(() => {
                  const parsedImageUrls = parseImageUrls(selectedReport.image_urls);
                  console.log('🖼️ Parsed image URLs:', parsedImageUrls);
                  console.log('🖼️ Original image_urls:', selectedReport.image_urls);

                  return parsedImageUrls.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-3">Submitted Images</p>



                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {parsedImageUrls.map((imageUrl, index) => {
                          console.log(`🖼️ Rendering image ${index + 1}:`, imageUrl);
                          return (
                            <div key={index} className="relative group">


                              <img
                                src={imageUrl}
                                alt={`Hazard image ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-blue-200 hover:border-blue-300 transition-colors cursor-pointer"
                                onClick={() => {
                                  console.log('🖼️ Image clicked:', imageUrl);
                                  setSelectedImage(imageUrl);
                                }}
                                onError={(e) => {
                                  console.error('❌ Image failed to load:', imageUrl);
                                  // Handle image loading errors
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                                onLoad={() => {
                                  console.log(`✅ Image ${index + 1} loaded successfully:`, imageUrl);
                                }}
                              />
                              {/* Fallback for broken images */}
                              <div className="hidden w-full h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 text-xs">
                                <div className="text-center">
                                  <FileText className="w-6 h-6 mx-auto mb-1" />
                                  <span>Image not available</span>
                                </div>
                              </div>
                              {/* Hover overlay */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Eye className="w-6 h-6 text-white drop-shadow-lg" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-xs text-blue-500 mt-2">Click on any image to view it in full size</p>
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-blue-200 rounded-lg bg-blue-50">
                      <FileText className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                      <p className="text-blue-600 text-sm">No images were submitted with this report</p>
                    </div>
                  );
                })()}

                {/* Created Date */}
                <div className="pt-4 border-t border-blue-100">
                  <p className="text-sm text-blue-500">
                    Report created on: {new Date(selectedReport.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end p-6 border-t border-blue-200">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Size Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4 z-[9999]"
            onClick={() => {
              console.log('🖼️ Closing full-size modal');
              setSelectedImage(null);
            }}
          >
            <div className="relative max-w-[95vw] max-h-[95vh] group">
              <img
                src={selectedImage}
                alt="Full size hazard image"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => {
                  console.log('🖼️ Image clicked in full-size modal');
                  e.stopPropagation();
                }}
                onLoad={() => {
                  console.log('✅ Full-size image loaded successfully:', selectedImage);
                }}
                onError={() => {
                  console.error('❌ Full-size image failed to load:', selectedImage);
                }}
              />

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('🖼️ Close button clicked');
                  setSelectedImage(null);
                }}
                className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-40 text-white rounded-full p-3 transition-all duration-200 backdrop-blur-sm group-hover:bg-opacity-30 z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Image info */}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
                <span>Click outside or press X to close</span>
              </div>

              {/* Download button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('🖼️ Download button clicked for:', selectedImage);
                  const link = document.createElement('a');
                  link.href = selectedImage;
                  link.download = `hazard-image-${Date.now()}.jpg`;
                  link.click();
                }}
                className="absolute top-4 left-4 bg-white bg-opacity-20 hover:bg-opacity-40 text-white rounded-full p-3 transition-all duration-200 backdrop-blur-sm group-hover:bg-opacity-30 z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}