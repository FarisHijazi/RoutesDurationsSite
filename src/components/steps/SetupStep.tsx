import React, { useState } from 'react';
import { KeyIcon, AlertCircleIcon } from 'lucide-react';
import { useStore } from '../../store';

const SetupStep: React.FC = () => {
  const { apiKey, setApiKey, setStep } = useStore();
  const [inputKey, setInputKey] = useState(apiKey);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputKey.trim()) {
      setError('API key is required');
      return;
    }
    
    // Basic validation - Google API keys are typically ~39 characters
    if (inputKey.length < 20) {
      setError('API key appears to be invalid');
      return;
    }
    
    setApiKey(inputKey.trim());
    setError(null);
    setStep(1);
  };

  return (
    <div className="max-w-lg mx-auto py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to OptimalRoute</h2>
      <p className="text-gray-600 mb-6">
        Find the optimal property location based on your commute to important destinations.
      </p>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-blue-700 text-sm">
          To use this tool, you'll need a Google Maps API key with the following APIs enabled:
        </p>
        <ul className="list-disc ml-5 mt-2 text-sm text-blue-700">
          <li>Maps JavaScript API</li>
          <li>Distance Matrix API</li>
          <li>Directions API</li>
        </ul>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            Google Maps API Key
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="apiKey"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your Google Maps API key"
            />
          </div>
          {error && (
            <div className="mt-2 flex items-center text-sm text-red-600">
              <AlertCircleIcon className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Your API key is stored only in your browser and is never sent to our servers.
          </p>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-150"
          >
            Get Started
          </button>
        </div>
      </form>
    </div>
  );
};

export default SetupStep;