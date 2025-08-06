import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../lib/supabase';
import { UserDashboard } from './UserDashboard';
import { ReviewerDashboard } from './ReviewerDashboard';
import { AssigneeDashboard } from './AssigneeDashboard';
import { Code, User, Shield, Users, LogOut } from 'lucide-react';

export function DeveloperMode() {
  const [activeView, setActiveView] = useState<UserRole>('user');
  const { setDeveloperMode, setCurrentRole } = useAuth();

  const exitDeveloperMode = () => {
    setDeveloperMode(false);
    setCurrentRole(null);
  };

  const handleViewChange = (role: UserRole) => {
    setActiveView(role);
    setCurrentRole(role);
  };

  const views = [
    { role: 'user' as UserRole, label: 'User Dashboard', icon: User, component: UserDashboard },
    { role: 'reviewer' as UserRole, label: 'Reviewer Dashboard', icon: Shield, component: ReviewerDashboard },
    { role: 'assignee' as UserRole, label: 'Assignee Dashboard', icon: Users, component: AssigneeDashboard },
  ];

  const ActiveComponent = views.find(v => v.role === activeView)?.component || UserDashboard;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Developer Mode Header */}
      <div className="bg-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Code className="w-6 h-6" />
              <span className="font-semibold">Developer Mode</span>
              <span className="text-purple-200">|</span>
              <span className="text-purple-200">View all user interfaces</span>
            </div>
            <button
              onClick={exitDeveloperMode}
              className="flex items-center space-x-2 bg-purple-700 hover:bg-purple-800 px-3 py-1 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Selector */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {views.map(({ role, label, icon: Icon }) => (
              <button
                key={role}
                onClick={() => handleViewChange(role)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeView === role
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Component */}
      <ActiveComponent />
    </div>
  );
}