import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface TaskStatusDisplayProps {
  status: 'approved' | 'rejected' | 'pending' | 'completed';
  assignmentId: string;
  hazardTitle: string;
  assigneeName: string;
  reviewerName: string;
  reviewReason?: string;
  reviewedAt?: string;
  onBack: () => void;
}

export function TaskStatusDisplay({ 
  status, 
  assignmentId, 
  hazardTitle, 
  assigneeName, 
  reviewerName, 
  reviewReason, 
  reviewedAt, 
  onBack 
}: TaskStatusDisplayProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: 'Task Approved',
          subtitle: 'The task has been successfully approved',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: 'Task Rejected',
          subtitle: 'The task has been rejected and needs rework',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      case 'completed':
        return {
          icon: <Clock className="w-16 h-16 text-blue-500" />,
          title: 'Task Completed',
          subtitle: 'The task has been completed and is awaiting review',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        };
      default:
        return {
          icon: <AlertCircle className="w-16 h-16 text-yellow-500" />,
          title: 'Task Pending',
          subtitle: 'The task is currently pending',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className={`${statusConfig.bgColor} border ${statusConfig.borderColor} rounded-lg p-8 text-center`}>
          <div className="flex justify-center mb-6">
            {statusConfig.icon}
          </div>
          
          <h1 className={`text-3xl font-bold ${statusConfig.textColor} mb-2`}>
            {statusConfig.title}
          </h1>
          
          <p className={`text-lg ${statusConfig.textColor} mb-8`}>
            {statusConfig.subtitle}
          </p>

          <div className="bg-white rounded-lg p-6 mb-6 text-left">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Task Details</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Task ID:</span>
                <span className="font-medium">{assignmentId}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Hazard Title:</span>
                <span className="font-medium">{hazardTitle}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Assignee:</span>
                <span className="font-medium">{assigneeName}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Reviewer:</span>
                <span className="font-medium">{reviewerName}</span>
              </div>
              
              {reviewedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reviewed At:</span>
                  <span className="font-medium">
                    {new Date(reviewedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {reviewReason && (
            <div className="bg-white rounded-lg p-6 mb-6 text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Comments</h3>
              <p className="text-gray-700">{reviewReason}</p>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            <button
              onClick={onBack}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>
            
            {status === 'approved' && (
              <div className="px-6 py-2 bg-green-100 text-green-800 rounded-md">
                ✅ Task is now complete
              </div>
            )}
            
            {status === 'rejected' && (
              <div className="px-6 py-2 bg-red-100 text-red-800 rounded-md">
                ⚠️ Task needs rework
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 