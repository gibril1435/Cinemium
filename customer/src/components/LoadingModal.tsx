import React from 'react';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ isOpen, message = 'Processing your order...' }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75">
      <div className="flex flex-col items-center justify-center rounded-lg bg-gray-800 p-8 shadow-xl">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-yellow-500 border-t-transparent"></div>
        <p className="mt-4 text-lg font-medium text-white">{message}</p>
      </div>
    </div>
  );
};

export default LoadingModal; 