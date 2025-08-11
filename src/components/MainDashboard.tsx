import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HazardReporting } from './HazardReporting';
import { IncidentReporting } from './IncidentReporting';
import SOTReportingForm from './SOTReportingForm'; // Import the new component
import { LogOut, AlertTriangle, FileText, Shield, Clock, UserCheck, CheckCircle, Settings, User, Bell } from 'lucide-react';

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
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-600',
      emoji: '⚠️'
    },
    {
      id: 'sot-reporting' as MenuOption,
      label: 'SOT Reporting',
      description: 'Safe Operating Task reporting',
      icon: Shield,
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-600',
      emoji: '🛡️'
    },
    {
      id: 'incident-reporting' as MenuOption,
      label: 'Incident Reporting',
      description: 'Report workplace incidents',
      icon: FileText,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-600',
      emoji: '📋'
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
      textColor: 'text-blue-600',
      emoji: '📄'
    },
    {
      id: 'employee-man-hours' as MenuOption,
      label: 'Employee Man Hours',
      description: 'Track employee work hours',
      icon: Clock,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600',
      emoji: '⏰'
    },
    {
      id: 'my-actions' as MenuOption,
      label: 'My Actions',
      description: 'View assigned actions',
      icon: UserCheck,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-600',
      emoji: '✅'
    },
    {
      id: 'action-closing' as MenuOption,
      label: 'Action Closing',
      description: 'Close and audit actions',
      icon: CheckCircle,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-600',
      emoji: '🎯'
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
        <div className="text-center mb-16 animate-slide-in">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            <span>Workplace Safety Dashboard</span>
          </div>
          <h2 className="text-5xl font-bold text-slate-900 mb-4">
            Choose Your <span className="text-gradient">Safety Module</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Access comprehensive safety management tools designed to keep your workplace secure and compliant
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
          {menuOptions.map((option, index) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => handleMenuClick(option.id)}
                className={`group card hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 p-6 h-56 flex flex-col justify-between ${option.bgColor} border-2 ${option.borderColor} hover:border-opacity-50`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex-1 flex flex-col justify-center">
                  {/* Icon and Emoji */}
                  <div className="flex justify-center mb-4">
                    <div className={`relative p-4 bg-gradient-to-br ${option.gradient} rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                      <IconComponent className="w-8 h-8 text-white" />
                      <div className="absolute -top-2 -right-2 text-2xl">
                        {option.emoji}
                      </div>
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-800 transition-colors">
                    {option.label}
                  </h3>
                  
                  {/* Description */}
                  <p className={`text-sm ${option.textColor} group-hover:text-opacity-80 transition-colors leading-relaxed`}>
                    {option.description}
                  </p>
                </div>

                {/* Action Indicator */}
                <div className="flex justify-center mt-4">
                  <div className={`w-8 h-1 bg-gradient-to-r ${option.gradient} rounded-full opacity-60 group-hover:opacity-100 transition-opacity`}></div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in">
          <div className="card card-body text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Safe & Secure</h3>
            <p className="text-slate-600">Enterprise-grade security for all your safety data</p>
          </div>
          
          <div className="card card-body text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Compliance Ready</h3>
            <p className="text-slate-600">Built to meet industry safety standards and regulations</p>
          </div>
          
          <div className="card card-body text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">User Friendly</h3>
            <p className="text-slate-600">Intuitive interface designed for all skill levels</p>
          </div>
        </div>
      </div>
    </div>
  );
}
