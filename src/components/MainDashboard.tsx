import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HazardReporting } from './HazardReporting';
import { IncidentReporting } from './IncidentReporting';
import SOTReportingForm from './SOTReportingForm'; // Import the new component
import LicenseManagement from './LicenseManagement'; // Import the License Management component
import { LogOut, AlertTriangle, FileText, Shield, Clock, Settings, User, Bell } from 'lucide-react';

type MenuOption = 
  | 'hazard-reporting'
  | 'sot-reporting'
  | 'incident-reporting'
  | 'license-documents'
  | 'employee-man-hours'
  | 'my-actions'
  | 'action-closing';

export function MainDashboard() {
  const [selectedMenu, setSelectedMenu] = useState<MenuOption | null>(null);
  const { profile, signOut } = useAuth();

  const menuOptions = [
    {
      id: 'hazard-reporting' as MenuOption,
      label: 'Hazard Reporting',
      description: 'Submit and manage hazard reports',
      icon: AlertTriangle,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600'
    },
    {
      id: 'sot-reporting' as MenuOption,
      label: 'SOT Reporting',
      description: 'Safe Operating Task reporting',
      icon: Shield,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600'
    },
    {
      id: 'incident-reporting' as MenuOption,
      label: 'Incident Reporting',
      description: 'Report workplace incidents',
      icon: FileText,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600'
    },
    {
      id: 'license-documents' as MenuOption,
      label: 'License Documents',
      description: 'Manage license documentation',
      icon: FileText,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600'
    },
    {
      id: 'employee-man-hours' as MenuOption,
      label: 'Employee Man Hours',
      description: 'Track employee work hours',
      icon: Clock,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600'
    },
    {
      id: 'my-actions' as MenuOption,
      label: 'My Actions',
      description: 'View assigned actions',
      icon: User,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600'
    },
    {
      id: 'action-closing' as MenuOption,
      label: 'Action Closing',
      description: 'Close and audit actions',
      icon: Shield,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600'
    }
  ];

  const handleMenuClick = (menuId: MenuOption) => {
    setSelectedMenu(menuId);
  };

  const handleBackToMenu = () => {
    setSelectedMenu(null);
  };

  if (selectedMenu === 'hazard-reporting') {
    return <HazardReporting onBack={handleBackToMenu} />;
  }

  if (selectedMenu === 'incident-reporting') {
    return <IncidentReporting onBack={handleBackToMenu} />;
  }

  if (selectedMenu === 'sot-reporting') {
    return <SOTReportingForm onBack={handleBackToMenu} />; // Render SOTReportingForm with back function
  }

  if (selectedMenu === 'license-documents') {
    return <LicenseManagement onBack={handleBackToMenu} />; // Render LicenseManagement with back function
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">Safety Management System</h1>
                <p className="text-slate-600 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Welcome, {profile?.full_name}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {profile?.role?.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-slide-in">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            <span>Workplace Safety Dashboard</span>
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Choose Your <span className="text-blue-600">Safety Module</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Access comprehensive safety management tools designed to keep your workplace secure and compliant
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
          {menuOptions.map((option, index) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => handleMenuClick(option.id)}
                className={`group card hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 p-4 h-40 flex flex-col justify-between ${option.bgColor} border-2 ${option.borderColor} hover:border-opacity-50`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex-1 flex flex-col justify-center">
                  {/* Icon */}
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-blue-600 rounded-lg">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-slate-800 transition-colors">
                    {option.label}
                  </h3>
                  
                  {/* Description */}
                  <p className={`text-xs ${option.textColor} group-hover:text-opacity-80 transition-colors leading-relaxed`}>
                    {option.description}
                  </p>
                </div>

                {/* Action Indicator */}
                <div className="flex justify-center mt-3">
                  <div className="w-6 h-1 bg-blue-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
