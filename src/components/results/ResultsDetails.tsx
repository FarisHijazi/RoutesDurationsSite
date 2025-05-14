import React, { useState } from 'react';
import { useStore, Location } from '../../store';
import { AlertCircleIcon } from 'lucide-react';

const ResultsDetails: React.FC = () => {
  const { locations, routeResults, timeOptions } = useStore();
  const [selectedTimeOption, setSelectedTimeOption] = useState<string>(
    timeOptions.find(t => t.selected)?.value || ''
  );
  
  if (routeResults.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircleIcon className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">No Results Available</h3>
        <p className="text-gray-600">
          There are no calculation results to display. Please try again.
        </p>
      </div>
    );
  }
  
  // Get selected time label
  const selectedTimeLabel = timeOptions.find(t => t.value === selectedTimeOption)?.label || '';
  
  // Filter results for selected time
  const filteredResults = routeResults.filter(r => r.timeOption === selectedTimeOption);
  
  // Format time in minutes
  const formatTime = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };
  
  // Find location by ID
  const findLocation = (id: string): Location | undefined => {
    return locations.find(loc => loc.id === id);
  };
  
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-800 mb-4">Trip Details</h3>
      
      <div className="mb-4">
        <label htmlFor="timeSelect" className="block text-sm font-medium text-gray-700 mb-1">
          Select Time:
        </label>
        <select
          id="timeSelect"
          value={selectedTimeOption}
          onChange={(e) => setSelectedTimeOption(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          {timeOptions.filter(t => t.selected).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {filteredResults.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No data available for selected time.
        </div>
      ) : (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">
            Routes at {selectedTimeLabel}:
          </h4>
          
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Distance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResults.map((result, idx) => {
                  const fromLocation = findLocation(result.fromId);
                  const toLocation = findLocation(result.toId);
                  
                  if (!fromLocation || !toLocation) return null;
                  
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">
                        {fromLocation.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">
                        {toLocation.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800 text-right">
                        {formatTime(result.durationValue)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800 text-right">
                        {result.distance}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <p className="mt-4 text-xs text-gray-500">
            Note: Travel times may vary based on traffic conditions, weather, and other factors.
          </p>
        </div>
      )}
    </div>
  );
};

export default ResultsDetails;