import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Upload, X } from 'lucide-react';

interface IncidentFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function IncidentForm({ onBack, onSuccess }: IncidentFormProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    incident_title: '',
    description: '',
    site: '',
    department: '',
    location: '',
    date_of_incident: '',
    time_of_incident: '',
    date_of_reporting: new Date().toISOString().split('T')[0],
    severity_level: '',
    incident_type: '',
    witnesses: '',
    immediate_actions_taken: '',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting incident report submission...', { profile });

      if (!user?.id) {
        throw new Error('No user found. Please sign in again.');
      }

      // Upload images first
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        console.log('Uploading image:', file.name);

        // Create unique filename with timestamp and random string
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('incident-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Error uploading image:', error);
          throw new Error(`Image upload failed: ${error.message}`);
        }

        console.log('Image uploaded successfully:', data);

        const { data: { publicUrl } } = supabase.storage
          .from('incident-images')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
        console.log('Public URL generated:', publicUrl);
      }

      console.log('All images uploaded:', imageUrls);

      // Create incident report with all fields (using null for empty optional fields)
      const reportData = {
        user_id: user.id,
        incident_title: formData.incident_title,
        description: formData.description,
        site: formData.site,
        department: formData.department,
        location: formData.location,
        date_of_incident: formData.date_of_incident,
        date_of_reporting: formData.date_of_reporting,
        time_of_incident: formData.time_of_incident || null,
        severity_level: formData.severity_level || null,
        incident_type: formData.incident_type || null,
        incident_category: null, // This field was missing and causing the error
        witnesses: formData.witnesses || null,
        immediate_actions_taken: formData.immediate_actions_taken || null,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        status: 'submitted',
        reporter_name: profile?.full_name || profile?.email || 'Unknown',
      };

      console.log('Submitting incident report:', reportData);

      const { data, error } = await supabase
        .from('incident_reports')
        .insert([reportData])
        .select();

      if (error) {
        console.error('Error creating incident report:', error);
        throw new Error(`Failed to create incident report: ${error.message}`);
      }

      console.log('Incident report created successfully:', data);
      onSuccess();
    } catch (error) {
      console.error('Error submitting incident report:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit incident report');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Submit Incident Report</h1>
                <p className="text-sm text-gray-600">Report workplace incidents and safety concerns</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Incident Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Incident Title *
                  </label>
                  <input
                    type="text"
                    name="incident_title"
                    value={formData.incident_title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the incident"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Incident Type *
                  </label>
                  <select
                    name="incident_type"
                    value={formData.incident_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select incident type</option>
                    <option value="injury">Injury</option>
                    <option value="near_miss">Near Miss</option>
                    <option value="property_damage">Property Damage</option>
                    <option value="environmental">Environmental</option>
                    <option value="security">Security</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Detailed Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide a detailed description of what happened..."
              />
            </div>

            {/* Location Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Location Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site *
                  </label>
                  <input
                    type="text"
                    name="site"
                    value={formData.site}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Site name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Department"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specific Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Specific location details"
                  />
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Date and Time</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Incident *
                  </label>
                  <input
                    type="date"
                    name="date_of_incident"
                    value={formData.date_of_incident}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time of Incident *
                  </label>
                  <input
                    type="time"
                    name="time_of_incident"
                    value={formData.time_of_incident}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Reporting
                  </label>
                  <input
                    type="date"
                    name="date_of_reporting"
                    value={formData.date_of_reporting}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity Level *
                  </label>
                  <select
                    name="severity_level"
                    value={formData.severity_level}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select severity level</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Witnesses
                  </label>
                  <input
                    type="text"
                    name="witnesses"
                    value={formData.witnesses}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Names of witnesses (if any)"
                  />
                </div>
              </div>
            </div>

            {/* Immediate Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Immediate Actions Taken
              </label>
              <textarea
                name="immediate_actions_taken"
                value={formData.immediate_actions_taken}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe any immediate actions taken to address the incident..."
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload images or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </label>
              </div>

              {imageFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Images:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Incident Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


