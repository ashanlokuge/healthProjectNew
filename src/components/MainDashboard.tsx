import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HazardReporting } from './HazardReporting';
import { IncidentReporting } from './IncidentReporting';
import { LogOut, AlertTriangle, FileText, Shield, Clock, UserCheck, CheckCircle, Settings } from 'lucide-react';

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
      label: 'HAZARD\nReporting',
      description: 'Submit and manage hazard reports',
      icon: AlertTriangle
    },
    {
      id: 'sot-reporting' as MenuOption,
      label: 'SOT\nReporting',
      description: 'Safe Operating Task reporting',
      icon: Shield
    },
    {
      id: 'incident-reporting' as MenuOption,
      label: 'Incident\nReporting',
      description: 'Report workplace incidents',
      icon: FileText
    },
    {
      id: 'license-documents' as MenuOption,
      label: 'License\nDocuments',
      description: 'Manage license documentation',
      icon: Shield
    },
    {
      id: 'employee-man-hours' as MenuOption,
      label: 'Employee\nMan Hours',
      description: 'Track employee work hours',
      icon: Clock
    },
    {
      id: 'my-actions' as MenuOption,
      label: 'My\nActions',
      description: 'View assigned actions',
      icon: UserCheck
    },
    {
      id: 'action-closing' as MenuOption,
      label: 'Action Closing\n(Audit reports)',
      description: 'Close and audit actions',
      icon: CheckCircle
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Safety Management System</h1>
              <p className="text-sm text-gray-600">
                Welcome, {profile?.full_name} ({profile?.role})
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

             <div className="max-w-7xl mx-auto px-6 py-12">
         <div className="text-center mb-12">
           <h2 className="text-4xl font-bold text-gray-900 mb-3">Safety Management Dashboard</h2>
           <p className="text-lg text-gray-600">Select a module to get started</p>
         </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-6xl mx-auto justify-items-center items-center">
            {menuOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                                 <button
                   key={option.id}
                   onClick={() => handleMenuClick(option.id)}
                   className="group bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-800 font-medium py-8 px-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 w-full h-48 flex flex-col justify-center"
                 >
                   <div className="text-center">
                     <div className="flex justify-center mb-4">
                       <div className="p-3 bg-blue-100 group-hover:bg-blue-200 rounded-full transition-colors duration-300">
                         <IconComponent className="w-8 h-8 text-blue-600" />
                       </div>
                     </div>
                     <div className="text-lg font-bold text-gray-900 mb-2 whitespace-pre-line leading-tight">
                       {option.label}
                     </div>
                     <div className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                       {option.description}
                     </div>
                   </div>
                 </button>
              );
            })}
          </div>
      </div>
    </div>
  );
} 