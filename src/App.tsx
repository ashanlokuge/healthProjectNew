import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { MainDashboard } from './components/MainDashboard';
import { DeveloperMode } from './components/DeveloperMode';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DebugInfo } from './components/DebugInfo';

function AppContent() {
  const { user, profile, loading, isDeveloper, currentRole } = useAuth();

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

  return <MainDashboard />;
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
          {import.meta.env.DEV && <DebugInfo />}
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
