import React from 'react';
import { ClockIcon, CheckCircleIcon } from 'lucide-react';
import { useStore } from '../../store';

const TimeSelectionStep: React.FC = () => {
  const { timeOptions, toggleTimeOption } = useStore();

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Time Periods</h2>
      <p className="text-gray-600 mb-6">
        Choose the time periods you're interested in calculating travel times for.
      </p>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <ClockIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Traffic conditions vary greatly by time of day. Select multiple times to understand how
              your commute might change throughout the day.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {timeOptions.map((option) => (
          <TimeOption
            key={option.value}
            value={option.value}
            label={option.label}
            selected={option.selected}
            onToggle={toggleTimeOption}
          />
        ))}
      </div>
      
      <div className="mt-8 border-t border-gray-200 pt-6 text-gray-600">
        <h3 className="font-medium text-gray-700 mb-2">What happens next?</h3>
        <p className="mb-4">
          After selecting your preferred time periods, click "Calculate" to generate:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span>Travel times from your property to all destinations</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span>Traffic condition analysis for each time period</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span>Visual representation of optimal routes on the map</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span>Detailed comparison of all possible routes</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

interface TimeOptionProps {
  value: string;
  label: string;
  selected: boolean;
  onToggle: (value: string) => void;
}

const TimeOption: React.FC<TimeOptionProps> = ({ value, label, selected, onToggle }) => {
  return (
    <div 
      onClick={() => onToggle(value)}
      className={`
        border rounded-lg p-4 text-center cursor-pointer transition-all duration-200
        ${selected 
          ? 'bg-blue-50 border-blue-300 shadow-sm' 
          : 'bg-white border-gray-200 hover:border-gray-300'
        }
      `}
    >
      <ClockIcon className={`h-6 w-6 mx-auto mb-2 ${selected ? 'text-blue-500' : 'text-gray-400'}`} />
      <div className={selected ? 'text-blue-700 font-medium' : 'text-gray-700'}>
        {label}
      </div>
      
      {selected && (
        <div className="mt-2 text-xs text-blue-600 font-medium">Selected</div>
      )}
    </div>
  );
};

export default TimeSelectionStep;