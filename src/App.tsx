import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { UserDashboard } from './components/UserDashboard';
import { ReviewerDashboard } from './components/ReviewerDashboard';
import { AssigneeDashboard } from './components/AssigneeDashboard';
import { DeveloperMode } from './components/DeveloperMode';
import { LogOut } from 'lucide-react';

function AppContent() {
  const { user, profile, loading, signOut, isDeveloper, currentRole } = useAuth();

  console.log('🎯 AppContent Debug:', {
    user: user?.id,
    profile: profile?.id,
    loading,
    isDeveloper,
    currentRole,
    profileRole: profile?.role
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (isDeveloper) {
    return <DeveloperMode />;
  }

  if (!user || !profile) {
    console.log('🚫 No user or profile, showing login');
    return <Login />;
  }

  console.log('✅ User and profile found, rendering dashboard');

  const renderDashboard = () => {
    const role = currentRole || profile.role;
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Hazard Reporting System</h1>
              <p className="text-sm text-gray-600">
                Welcome, {profile.full_name} ({profile.role})
              </p>
            </div>
            <button
              onClick={() => {
                console.log('Sign Out button clicked.');
                signOut();
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderDashboard()}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
