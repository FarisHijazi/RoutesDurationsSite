import React from 'react';
import { useStore } from '../store';
import LocationStep from './steps/LocationStep';
import TimeSelectionStep from './steps/TimeSelectionStep';
import ResultsStep from './steps/ResultsStep';
import WizardNavigation from './WizardNavigation';

const WizardContainer: React.FC = () => {
  const { step } = useStore();

  const renderStep = () => {
    switch (step) {
      case 0:
        return <LocationStep />;
      case 1:
        return <TimeSelectionStep />;
      case 2:
        return <ResultsStep />;
      default:
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