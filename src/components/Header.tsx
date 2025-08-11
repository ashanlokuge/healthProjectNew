import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  backLink: string;
}

export function Header({ title, subtitle, backLink }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center">
          <a href={backLink} className="text-gray-500 hover:text-gray-700 flex items-center">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </a>
          <div className="border-l border-gray-300 h-6 mx-4"></div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
