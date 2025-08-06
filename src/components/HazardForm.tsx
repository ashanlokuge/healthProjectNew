import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Upload, X } from 'lucide-react';

interface HazardFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function HazardForm({ onBack, onSuccess }: HazardFormProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    site: '',
    department: '',
    location: '',
    description: '',
    hazardTitle: '',
    hazardDescription: '',
    dateOfFinding: '',
    dateOfReporting: new Date().toISOString().split('T')[0],
    riskLevel: '',
    hazardCharacteristics: '',
    responsibleDepartment: '',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting hazard report submission...', { profile });
      
      if (!profile?.id) {
        throw new Error('No user profile found. Please sign in again.');
      }

      // Upload images first
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        console.log('Uploading image:', file.name);
        
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('hazard-images')
          .upload(fileName, file);

        if (error) {
          console.error('Error uploading image:', error);
          throw error;
        }
        
        console.log('Image uploaded successfully:', data);
        
        const { data: { publicUrl } } = supabase.storage
          .from('hazard-images')
          .getPublicUrl(fileName);
        
        imageUrls.push(publicUrl);
      }

      console.log('All images uploaded:', imageUrls);

      // Create hazard report
      const reportData = {
        user_id: profile.id,
        site: formData.site,
        department: formData.department,
        location: formData.location,
        description: formData.description,
        hazard_title: formData.hazardTitle,
        hazard_description: formData.hazardDescription,
        date_of_finding: formData.dateOfFinding,
        date_of_reporting: formData.dateOfReporting,
        risk_level: formData.riskLevel,
        hazard_characteristics: formData.hazardCharacteristics,
        responsible_department: formData.responsibleDepartment,
        image_urls: imageUrls,
        status: 'submitted' as const,
      };

      console.log('Creating hazard report:', reportData);

      const { data: report, error } = await supabase
        .from('hazard_reports')
        .insert([reportData])
        .select()
        .single();

      if (error) {
        console.error('Error creating hazard report:', error);
        throw error;
      }

      console.log('Hazard report created successfully:', report);
      onSuccess();
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(prev => [...prev, ...files].slice(0, 3));
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
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
            <h1 className="text-2xl font-bold text-blue-600">Hazard Reporting</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <input
                  type="text"
                  value={formData.site}
                  onChange={(e) => setFormData({...formData, site: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Finding</label>
                <input
                  type="date"
                  value={formData.dateOfFinding}
                  onChange={(e) => setFormData({...formData, dateOfFinding: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Reporting</label>
                <input
                  type="date"
                  value={formData.dateOfReporting}
                  onChange={(e) => setFormData({...formData, dateOfReporting: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                <select
                  value={formData.riskLevel}
                  onChange={(e) => setFormData({...formData, riskLevel: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Risk Level</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hazard Title</label>
                <input
                  type="text"
                  value={formData.hazardTitle}
                  onChange={(e) => setFormData({...formData, hazardTitle: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hazard Characteristics</label>
                <textarea
                  value={formData.hazardCharacteristics}
                  onChange={(e) => setFormData({...formData, hazardCharacteristics: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Images (up to 3)</label>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 h-32">
                    {imageFiles[index] ? (
                      <div className="relative h-full">
                        <img
                          src={URL.createObjectURL(imageFiles[index])}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500">Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsible Department</label>
              <input
                type="text"
                value={formData.responsibleDepartment}
                onChange={(e) => setFormData({...formData, responsibleDepartment: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}