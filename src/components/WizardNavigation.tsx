import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon, RotateCcwIcon } from 'lucide-react';
import { useStore } from '../store';

const WizardNavigation: React.FC = () => {
  const { step, setStep, locations, timeOptions, isCalculating, reset, apiKey } = useStore();
  
  const canGoNext = () => {
    if (step === 0 && !apiKey) return false;

    switch (step) {
      case 0: // Location selection (was SetupStep, then LocationStep)
        return locations.filter(l => l.isProperty).length > 0 && 
               locations.filter(l => !l.isProperty).length > 0;
      case 1: // Time selection (was LocationStep, then TimeSelectionStep)
        return timeOptions.some(t => t.selected);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canGoNext()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset? All data will be lost.')) {
      reset();
    }
  };

  // Progress indicator
  const totalSteps = 3; // Updated from 4 to 3 (0,1,2)
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className="border-t border-gray-200">
      {/* API Key Warning */}
      {step === 0 && !apiKey && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 text-sm" role="alert">
          <p className="font-bold">API Key Missing</p>
          <p>The Google Maps API key is not configured. Please set it in <code>src/store/index.ts</code>.</p>
        </div>
      )}
      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div 
          className="h-1 bg-blue-500 transition-all duration-300 ease-in-out" 
          style={{ width: `${progress}%` }} 
        />
      </div>
      
      <div className="px-6 py-4 flex justify-between items-center">
        <button
          onClick={handleBack}
          disabled={step === 0 || isCalculating}
          className={`flex items-center px-4 py-2 rounded-md ${
            step === 0 || isCalculating
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } transition duration-150`}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </button>
        
        <div className="flex space-x-3">
          {step === 2 && ( // Updated from step === 3 to step === 2 for ResultsStep
            <button
              onClick={handleReset}
              disabled={isCalculating}
              className={`flex items-center px-4 py-2 rounded-md ${
                isCalculating
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              } transition duration-150`}
            >
              <RotateCcwIcon className="h-4 w-4 mr-2" />
              Reset
            </button>
          )}
          
          {step < 2 && ( // Updated from step < 3 to step < 2
            <button
              onClick={handleNext}
              disabled={!canGoNext() || isCalculating}
              className={`flex items-center px-4 py-2 rounded-md ${
                !canGoNext() || isCalculating
                  ? 'bg-blue-300 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } transition duration-150`}
            >
              {step === 1 ? 'Calculate' : 'Next'} {/* Updated condition for 'Calculate' text (was step === 2) */}
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WizardNavigation