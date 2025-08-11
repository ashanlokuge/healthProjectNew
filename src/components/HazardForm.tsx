import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Upload, X, AlertTriangle } from 'lucide-react';

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
        
        // Create unique filename with timestamp and random string
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('hazard-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Error uploading image:', error);
          console.error('Error details:', {
            message: error.message,
            statusCode: error.statusCode,
            error: error.error
          });
          
          // Provide more specific error messages
          if (error.message.includes('Bucket not found')) {
            throw new Error('Storage bucket not configured. Please contact administrator.');
          } else if (error.message.includes('Policy')) {
            throw new Error('Storage permissions not configured. Please contact administrator.');
          } else {
            throw new Error(`Image upload failed: ${error.message}`);
          }
        }
        
        console.log('Image uploaded successfully:', data);
        
        const { data: { publicUrl } } = supabase.storage
          .from('hazard-images')
          .getPublicUrl(fileName);
        
        imageUrls.push(publicUrl);
        console.log('Public URL generated:', publicUrl);
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
    const maxFileSize = 100 * 1024 * 1024; // 100MB in bytes
    
    // Filter out files that are too large
    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        alert(`File "${file.name}" is too large. Maximum file size is 100MB.`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles].slice(0, 3));
    }
    
    // Reset the input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="card animate-slide-in">
          <div className="card-header">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gradient">Hazard Reporting</h1>
                  <p className="text-slate-600 text-sm">Report workplace hazards and safety concerns</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="animate-fade-in">
                  <label className="form-label">🏢 Site Location</label>
                  <input
                    type="text"
                    value={formData.site}
                    onChange={(e) => setFormData({...formData, site: e.target.value})}
                    className="form-input"
                    placeholder="Enter site location"
                    required
                  />
                </div>

                <div className="animate-fade-in">
                  <label className="form-label">📅 Date of Finding</label>
                  <input
                    type="date"
                    value={formData.dateOfFinding}
                    onChange={(e) => setFormData({...formData, dateOfFinding: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div className="animate-fade-in">
                  <label className="form-label">🏬 Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="form-input"
                    placeholder="Enter department name"
                    required
                  />
                </div>

                <div className="animate-fade-in">
                  <label className="form-label">📋 Date of Reporting</label>
                  <input
                    type="date"
                    value={formData.dateOfReporting}
                    onChange={(e) => setFormData({...formData, dateOfReporting: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div className="animate-fade-in">
                  <label className="form-label">📍 Specific Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="form-input"
                    placeholder="Describe the exact location"
                    required
                  />
                </div>

                <div className="animate-fade-in">
                  <label className="form-label">⚠️ Risk Level</label>
                  <select
                    value={formData.riskLevel}
                    onChange={(e) => setFormData({...formData, riskLevel: e.target.value})}
                    className="form-input appearance-none bg-white"
                  >
                    <option value="">Select Risk Level</option>
                    <option value="Low">🟢 Low Risk</option>
                    <option value="Medium">🟡 Medium Risk</option>
                    <option value="High">🟠 High Risk</option>
                    <option value="Critical">🔴 Critical Risk</option>
                  </select>
                </div>

                <div className="md:col-span-2 animate-fade-in">
                  <label className="form-label">📝 Hazard Title</label>
                  <input
                    type="text"
                    value={formData.hazardTitle}
                    onChange={(e) => setFormData({...formData, hazardTitle: e.target.value})}
                    className="form-input"
                    placeholder="Brief title describing the hazard"
                    required
                  />
                </div>

                <div className="md:col-span-2 animate-fade-in">
                  <label className="form-label">📄 Detailed Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    className="form-input resize-none"
                    placeholder="Provide a detailed description of the hazard..."
                    required
                  />
                </div>

                <div className="md:col-span-2 animate-fade-in">
                  <label className="form-label">🔍 Hazard Characteristics</label>
                  <textarea
                    value={formData.hazardCharacteristics}
                    onChange={(e) => setFormData({...formData, hazardCharacteristics: e.target.value})}
                    rows={3}
                    className="form-input resize-none"
                    placeholder="Describe specific characteristics, conditions, or factors..."
                  />
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="animate-fade-in">
                <label className="form-label">📸 Evidence Images (up to 3)</label>
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 h-40 hover:border-slate-400 transition-colors">
                      {imageFiles[index] ? (
                        <div className="relative h-full group">
                          <img
                            src={URL.createObjectURL(imageFiles[index])}
                            alt={`Evidence ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg shadow-md"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200"></div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full cursor-pointer group">
                          <div className="w-12 h-12 bg-slate-100 group-hover:bg-slate-200 rounded-xl flex items-center justify-center mb-3 transition-colors">
                            <Upload className="w-6 h-6 text-slate-500" />
                          </div>
                          <span className="text-sm font-medium text-slate-600 group-hover:text-slate-700 transition-colors">
                            Upload Image
                          </span>
                          <span className="text-xs text-slate-400 mt-1">
                            Max 100MB
                          </span>
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
                <p className="text-xs text-slate-500 mt-2">
                  💡 Tip: Clear photos help reviewers understand the hazard better
                </p>
              </div>

              {/* Responsible Department */}
              <div className="animate-fade-in">
                <label className="form-label">🏢 Responsible Department (Optional)</label>
                <input
                  type="text"
                  value={formData.responsibleDepartment}
                  onChange={(e) => setFormData({...formData, responsibleDepartment: e.target.value})}
                  className="form-input"
                  placeholder="Which department should handle this?"
                />
              </div>
            </form>
          </div>

          {/* Form Actions */}
          <div className="card-footer">
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={onBack}
                className="btn btn-outline px-6 py-3"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className="btn btn-primary px-8 py-3 font-semibold"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="spinner w-5 h-5 mr-2"></div>
                    Submitting Report...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Submit Hazard Report
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}