import React from 'react';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ isOpen, message = 'Processing...' }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60">
      <div className="flex flex-col items-center justify-center rounded-lg bg-white p-8 shadow-xl">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-t-transparent"></div>
        <p className="mt-4 text-lg font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
};

export default LoadingModal; 