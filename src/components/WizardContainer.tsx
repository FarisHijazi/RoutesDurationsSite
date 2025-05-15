import React from 'react';
import { useStore } from '../store';
// import SetupStep from './steps/SetupStep'; // Removed
import LocationStep from './steps/LocationStep';
import TimeSelectionStep from './steps/TimeSelectionStep';
import ResultsStep from './steps/ResultsStep';
import WizardNavigation from './WizardNavigation';

const WizardContainer: React.FC = () => {
  const { step } = useStore();

  const renderStep = () => {
    switch (step) {
      case 0: // Was SetupStep, now LocationStep
        return <LocationStep />;
      case 1: // Was LocationStep, now TimeSelectionStep
        return <TimeSelectionStep />;
      case 2: // Was TimeSelectionStep, now ResultsStep
        return <ResultsStep />;
      default: // Default to the first step (LocationStep)
        return <LocationStep />;
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex-1 p-6 min-h-[500px]">
        {renderStep()}
      </div>
      <WizardNavigation />
    </div>
  );
};

export default WizardContainer