import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserDashboard } from './UserDashboard';
import { AssigneeDashboard } from './AssigneeDashboard';
import { ReviewerDashboard } from './ReviewerDashboard';
import { ArrowLeft } from 'lucide-react';

interface HazardReportingProps {
  onBack: () => void;
}

export function HazardReporting({ onBack }: HazardReportingProps) {
  const { profile, currentRole } = useAuth();

  const renderRoleSpecificUI = () => {
    const role = currentRole || profile?.role;
    
    switch (role) {
      case 'reviewer':
        return <ReviewerDashboard />;
      case 'assignee':
        return <AssigneeDashboard />;
      default:
        return <UserDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
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
                <h1 className="text-xl font-semibold text-gray-900">Hazard Reporting System</h1>
                <p className="text-sm text-gray-600">
                  {profile?.full_name} ({profile?.role})
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-specific content */}
      {renderRoleSpecificUI()}
    </div>
  );
} 