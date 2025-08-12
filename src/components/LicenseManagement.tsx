import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LicenseData {
  id?: string;
  licenseName: string;
  responsiblePerson: string;
  authority: string;
  validityDays: number;
  applyBeforeDays: number;
  dateOfRenewal: string;
  nextRenewalDate: string;
  remark: string;
  documentSubmission: string;
  reminder: boolean;
  escalation01: boolean;
  escalation02: boolean;
}

interface LicenseManagementProps {
  onBack: () => void;
}

const LicenseManagement: React.FC<LicenseManagementProps> = ({ onBack }) => {
  const { user, profile } = useAuth();
  const [licenses, setLicenses] = useState<LicenseData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<LicenseData>({
    licenseName: '',
    responsiblePerson: '',
    authority: '',
    validityDays: 0,
    applyBeforeDays: 0,
    dateOfRenewal: '',
    nextRenewalDate: '',
    remark: '',
    documentSubmission: '',
    reminder: false,
    escalation01: false,
    escalation02: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setMessage({ type: 'error', text: 'User not authenticated. Please sign in again.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const licenseData = {
        license_name: formData.licenseName,
        responsible_person: formData.responsiblePerson,
        authority: formData.authority,
        validity_days: formData.validityDays,
        apply_before_days: formData.applyBeforeDays,
        date_of_renewal: formData.dateOfRenewal,
        next_renewal_date: formData.nextRenewalDate,
        remark: formData.remark,
        document_submission: formData.documentSubmission,
        reminder: formData.reminder,
        escalation01: formData.escalation01,
        escalation02: formData.escalation02,
        user_id: user.id,
      };

      if (editingId) {
        // Update existing license
        const { error } = await supabase
          .from('licenses')
          .update(licenseData)
          .eq('id', editingId);

        if (error) throw error;
        setMessage({ type: 'success', text: 'License updated successfully!' });
      } else {
        // Insert new license
        const { error } = await supabase
          .from('licenses')
          .insert([licenseData]);

        if (error) throw error;
        setMessage({ type: 'success', text: 'License added successfully!' });
      }

      // Reset form and refresh data
      setFormData({
        licenseName: '',
        responsiblePerson: '',
        authority: '',
        validityDays: 0,
        applyBeforeDays: 0,
        dateOfRenewal: '',
        nextRenewalDate: '',
        remark: '',
        documentSubmission: '',
        reminder: false,
        escalation01: false,
        escalation02: false,
      });
      setEditingId(null);
      setShowForm(false);
      fetchLicenses();

    } catch (error) {
      console.error('Error saving license:', error);

      // Enhanced error handling for Supabase errors
      let errorMessage = 'Unknown error occurred';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = (error as any).message;
        }
        if ('details' in error && (error as any).details) {
          errorMessage += ` Details: ${(error as any).details}`;
        }
        if ('hint' in error && (error as any).hint) {
          errorMessage += ` Hint: ${(error as any).hint}`;
        }
      }

      setMessage({ type: 'error', text: `Failed to save license: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  const fetchLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map database column names to component interface
      const mappedData = (data || []).map(item => ({
        id: item.id,
        licenseName: item.license_name,
        responsiblePerson: item.responsible_person,
        authority: item.authority,
        validityDays: item.validity_days,
        applyBeforeDays: item.apply_before_days,
        dateOfRenewal: item.date_of_renewal,
        nextRenewalDate: item.next_renewal_date,
        remark: item.remark,
        documentSubmission: item.document_submission,
        reminder: item.reminder,
        escalation01: item.escalation01,
        escalation02: item.escalation02,
      }));

      setLicenses(mappedData);
    } catch (error) {
      console.error('Error fetching licenses:', error);
    }
  };

  const handleEdit = (license: LicenseData) => {
    setFormData(license);
    setEditingId(license.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this license?')) {
      try {
        const { error } = await supabase
          .from('licenses')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'License deleted successfully!' });
        fetchLicenses();
      } catch (error) {
        console.error('Error deleting license:', error);
        setMessage({ type: 'error', text: 'Failed to delete license' });
      }
    }
  };


  React.useEffect(() => {
    if (user?.id) {
      fetchLicenses();
    }
  }, [user?.id]);

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
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">License Management System</h1>
                <p className="text-slate-600 mt-1 font-medium">Track and manage all licenses and renewals</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-500 font-medium">System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className={`p-4 rounded-xl border-l-4 ${message.type === 'success'
            ? 'bg-green-50 border-green-500 text-green-800'
            : 'bg-red-50 border-red-500 text-red-800'
            }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
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
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">License Registry</h2>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New License
          </button>
        </div>

        {/* License Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 mb-8 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit License' : 'Add New License'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* License Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    License Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="licenseName"
                    required
                    value={formData.licenseName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter license name"
                  />
                </div>

                {/* Responsible Person */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Responsible Person/Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="responsiblePerson"
                    required
                    value={formData.responsiblePerson}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter responsible person"
                  />
                </div>

                {/* Authority */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Authority (External) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="authority"
                    required
                    value={formData.authority}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter authority name"
                  />
                </div>

                {/* Validity Days */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Validity (Days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="validityDays"
                    required
                    value={formData.validityDays}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter validity days"
                  />
                </div>

                {/* Apply Before Days */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Apply Before (Days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="applyBeforeDays"
                    required
                    value={formData.applyBeforeDays}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter apply before days"
                  />
                </div>

                {/* Date of Renewal */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date of Renewal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfRenewal"
                    required
                    value={formData.dateOfRenewal}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Next Renewal Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Next Renewal Date
                  </label>
                  <input
                    type="date"
                    name="nextRenewalDate"
                    value={formData.nextRenewalDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Remark */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Remark
                  </label>
                  <input
                    type="text"
                    name="remark"
                    value={formData.remark}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter remarks"
                  />
                </div>

                {/* Document Submission */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Document Submission
                  </label>
                  <input
                    type="text"
                    name="documentSubmission"
                    value={formData.documentSubmission}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter document details"
                  />
                </div>
              </div>

              {/* Checkboxes Row */}
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Notification Settings</h4>
                <div className="flex space-x-8">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="reminder"
                      checked={formData.reminder}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Reminder</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="escalation01"
                      checked={formData.escalation01}
                      onChange={handleChange}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-slate-700">Escalation 01</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="escalation02"
                      checked={formData.escalation02}
                      onChange={handleChange}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-slate-700">Escalation 02</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      licenseName: '',
                      responsiblePerson: '',
                      authority: '',
                      validityDays: 0,
                      applyBeforeDays: 0,
                      dateOfRenewal: '',
                      nextRenewalDate: '',
                      remark: '',
                      documentSubmission: '',
                      reminder: false,
                      escalation01: false,
                      escalation02: false,
                    });
                  }}
                  className="px-4 py-2 text-slate-700 border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {loading ? 'Saving...' : (editingId ? 'Update License' : 'Save License')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* License Table */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">License Name</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Responsible Person/Department</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Authority (External)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Validity (Days)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Apply Before (Days)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date of Renewal</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Next Renewal Date</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Remark</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Document Submission</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Reminder</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Escalation 01</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Escalation 02</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {licenses.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center space-y-3">
                        <FileText className="w-16 h-16 text-slate-300" />
                        <p className="text-xl font-semibold text-slate-700">No licenses found</p>
                        <p className="text-base text-slate-500">Start by adding your first license</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  licenses.map((license) => (
                    <tr key={license.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{license.licenseName}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{license.responsiblePerson}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{license.authority}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{license.validityDays}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{license.applyBeforeDays}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{license.dateOfRenewal}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{license.nextRenewalDate}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{license.remark}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{license.documentSubmission}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {license.reminder ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {license.escalation01 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {license.escalation02 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(license)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => license.id && handleDelete(license.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseManagement;
