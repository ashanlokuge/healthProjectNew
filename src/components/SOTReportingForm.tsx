import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SOTReportingFormProps {
  onBack: () => void;
}

const SOTReportingForm: React.FC<SOTReportingFormProps> = ({ onBack }) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    site: '',
    department: '',
    location: '',
    personalCategory: '',
    detailsIfObservation: '',
    date: '',
    dateOfReporting: '',
    timeDuration: '',
    typeOfWork: '',
    addAction: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id) {
      setMessage({ type: 'error', text: 'User not authenticated. Please sign in again.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Prepare the data for Supabase
      const sotData = {
        user_id: profile.id,
        site: formData.site,
        department: formData.department,
        location: formData.location,
        personal_category: formData.personalCategory,
        details_if_observation: formData.detailsIfObservation,
        date: formData.date,
        date_of_reporting: formData.dateOfReporting,
        time_duration: formData.timeDuration,
        type_of_work: formData.typeOfWork,
        add_action: formData.addAction,
        status: 'submitted',
        created_at: new Date().toISOString(),
      };

      console.log('Submitting SOT report:', sotData);

      // Insert data into Supabase
      const { data, error } = await supabase
        .from('sot_reports')
        .insert([sotData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        throw error;
      }

      console.log('SOT report submitted successfully:', data);
      setMessage({ type: 'success', text: 'SOT report submitted successfully!' });
      
      // Reset form after successful submission
      setFormData({
        site: '',
        department: '',
        location: '',
        personalCategory: '',
        detailsIfObservation: '',
        date: '',
        dateOfReporting: '',
        timeDuration: '',
        typeOfWork: '',
        addAction: '',
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);

    } catch (error) {
      console.error('Error submitting SOT report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage({ type: 'error', text: `Failed to submit report: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Professional Header */}
      <div className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-all duration-200 p-3 hover:bg-slate-100 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Dashboard</span>
              </button>
              <div className="h-8 w-px bg-slate-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SOT Reporting System</h1>
                <p className="text-slate-600 mt-1 font-medium">Submit Start of Task reports and observations</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-500 font-medium">System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-5xl mx-auto py-8 px-6">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">SOT Report Form</h2>
                <p className="text-blue-100 text-sm">Complete all required fields to submit your report</p>
              </div>
            </div>
          </div>
          
          {/* Message Display */}
          {message && (
            <div className={`mx-8 mt-6 p-4 rounded-xl border-l-4 ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-500 text-green-800' 
                : 'bg-red-50 border-red-500 text-red-800'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {message.type === 'success' ? (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="font-semibold">{message.text}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="px-8 py-6">
              {/* Basic Information Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column Fields */}
                  <div className="space-y-5">
                    <div className="group">
                      <label htmlFor="site" className="block text-sm font-semibold text-slate-700 mb-2 group-hover:text-blue-600 transition-colors">
                        Site <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="site"
                        name="site"
                        required
                        value={formData.site}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 placeholder-slate-400"
                        placeholder="Enter site name"
                      />
                    </div>
                    <div className="group">
                      <label htmlFor="department" className="block text-sm font-semibold text-slate-700 mb-2 group-hover:text-blue-600 transition-colors">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="department"
                        name="department"
                        required
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 placeholder-slate-400"
                        placeholder="Enter department name"
                      />
                    </div>
                    <div className="group">
                      <label htmlFor="location" className="block text-sm font-semibold text-slate-700 mb-2 group-hover:text-blue-600 transition-colors">
                        Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        required
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 placeholder-slate-400"
                        placeholder="Enter specific location"
                      />
                    </div>
                    <div className="group">
                      <label htmlFor="personalCategory" className="block text-sm font-semibold text-slate-700 mb-2 group-hover:text-blue-600 transition-colors">
                        Personal Category <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="personalCategory"
                        name="personalCategory"
                        required
                        value={formData.personalCategory}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 placeholder-slate-400"
                        placeholder="Enter personal category"
                      />
                    </div>
                  </div>

                  {/* Right Column Fields */}
                  <div className="space-y-5">
                    <div className="group">
                      <label htmlFor="date" className="block text-sm font-semibold text-slate-700 mb-2 group-hover:text-blue-600 transition-colors">
                        Task Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        required
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400"
                      />
                    </div>
                    <div className="group">
                      <label htmlFor="dateOfReporting" className="block text-sm font-semibold text-slate-700 mb-2 group-hover:text-blue-600 transition-colors">
                        Reporting Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="dateOfReporting"
                        name="dateOfReporting"
                        required
                        value={formData.dateOfReporting}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400"
                      />
                    </div>
                    <div className="group">
                      <label htmlFor="timeDuration" className="block text-sm font-semibold text-slate-700 mb-2 group-hover:text-blue-600 transition-colors">
                        Time Duration
                      </label>
                      <input
                        type="text"
                        id="timeDuration"
                        name="timeDuration"
                        value={formData.timeDuration}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 placeholder-slate-400"
                        placeholder="e.g., 2 hours, 30 minutes"
                      />
                    </div>
                    <div className="group">
                      <label htmlFor="typeOfWork" className="block text-sm font-semibold text-slate-700 mb-2 group-hover:text-blue-600 transition-colors">
                        Type of Work <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="typeOfWork"
                        name="typeOfWork"
                        required
                        value={formData.typeOfWork}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 placeholder-slate-400"
                        placeholder="Enter type of work"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Observation Details Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Observation Details
                </h3>
                <div className="space-y-5">
                  <div className="group">
                    <label htmlFor="detailsIfObservation" className="block text-sm font-semibold text-slate-700 mb-2 group-hover:text-green-600 transition-colors">
                      Details if Observation
                    </label>
                    <textarea
                      id="detailsIfObservation"
                      name="detailsIfObservation"
                      rows={4}
                      value={formData.detailsIfObservation}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-slate-400 placeholder-slate-400 resize-none"
                      placeholder="Provide detailed observations, safety concerns, or any notable findings..."
                    ></textarea>
                    <p className="text-xs text-slate-500 mt-1">Describe any safety observations, hazards, or important details</p>
                  </div>
                </div>
              </div>

              {/* Action Items Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  Action Items
                </h3>
                <div className="space-y-5">
                  <div className="group">
                    <label htmlFor="addAction" className="block text-sm font-semibold text-slate-700 mb-2 group-hover:text-orange-600 transition-colors">
                      Add Action <span className="text-slate-500 text-xs font-normal">(If any, same as hazard reporting)</span>
                    </label>
                    <textarea
                      id="addAction"
                      name="addAction"
                      rows={3}
                      value={formData.addAction}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-slate-400 placeholder-slate-400 resize-none"
                      placeholder="Enter any required actions, recommendations, or follow-up items..."
                    ></textarea>
                    <p className="text-xs text-slate-500 mt-1">Specify any actions needed to address identified issues</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Footer */}
            <div className="bg-slate-50 px-8 py-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  <span className="text-red-500">*</span> Required fields
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Submitting Report...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Submit SOT Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SOTReportingForm;
