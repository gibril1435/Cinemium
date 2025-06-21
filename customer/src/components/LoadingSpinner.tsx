import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className="h-12 w-12">
          <div className="absolute h-12 w-12 rounded-full border-4 border-solid border-gray-200"></div>
          <div className="absolute h-12 w-12 rounded-full border-4 border-solid border-yellow-500 border-t-transparent animate-spin"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 