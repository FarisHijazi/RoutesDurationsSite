import React from 'react';
import { Loader2Icon } from 'lucide-react';

interface LoadingIndicatorProps {
  text?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ text = 'Calculating...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
      <Loader2Icon className="h-10 w-10 animate-spin text-blue-500 mb-4" />
      <p className="text-lg font-medium">{text}</p>
      <p className="text-sm">Please wait while we fetch the travel data.</p>
    </div>
  );
};

export default LoadingIndicator; 