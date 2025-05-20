import React from 'react';
import { useStore, Location } from '../../store';
import { AlertCircleIcon } from 'lucide-react';

const ResultsDetails: React.FC = () => {
  const { locations, routeResults, timeOptions } = useStore();
  
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

  // Group results by timeOption
  const resultsByTime = timeOptions.filter(t => t.selected).map((time) => ({
    time,
    results: routeResults.filter(r => r.timeOption === time.value)
  }));

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-800 mb-4">Trip Details</h3>
      {resultsByTime.map(({ time, results }) => (
        <div key={time.value} className="mb-8">
          <h4 className="text-sm font-medium text-gray-500 mb-2">
            Routes at {time.label}:
          </h4>
          {results.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No data available for this time.
            </div>
          ) : (
            <div className="overflow-x-auto w-full border border-gray-200 rounded-lg">
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
                  {results.map((result, idx) => {
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
          )}
        </div>
      ))}
      <p className="mt-4 text-xs text-gray-500">
        Note: Travel times may vary based on traffic conditions, weather, and other factors.
      </p>
    </div>
  );
};

export default ResultsDetails;