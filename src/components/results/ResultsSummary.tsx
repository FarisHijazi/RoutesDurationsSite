import React from 'react';
import { useStore, Location } from '../../store';
import { Clock3Icon, MapPinIcon, AlertCircleIcon } from 'lucide-react';
import LoadingIndicator from '../common/LoadingIndicator';

const ResultsSummary: React.FC = () => {
  const { locations, routeResults, isCalculating } = useStore();
  
  if (isCalculating) {
    return <LoadingIndicator text="Calculating travel summary..." />;
  }

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
  
  // Find property
  const property = locations.find(loc => loc.isProperty);
  
  if (!property) {
    return <div>No property location found.</div>;
  }
  
  // Group results by destination
  const destinationGroups: { [key: string]: {
    destination: Location,
    avgDuration: number,
    bestTime: string,
    worstTime: string,
    bestDuration: number,
    worstDuration: number
  }} = {};
  
  locations.filter(loc => !loc.isProperty).forEach(destination => {
    // Get all results for this property-destination pair
    const resultsToDestination = routeResults.filter(
      r => r.fromId === property.id && r.toId === destination.id
    );
    
    if (resultsToDestination.length > 0) {
      // Calculate average duration
      const totalDuration = resultsToDestination.reduce(
        (sum, r) => sum + r.durationValue, 0
      );
      const avgDuration = totalDuration / resultsToDestination.length;
      
      // Find best and worst times
      const sortedResults = [...resultsToDestination].sort(
        (a, b) => a.durationValue - b.durationValue
      );
      
      const bestResult = sortedResults[0];
      const worstResult = sortedResults[sortedResults.length - 1];
      
      destinationGroups[destination.id] = {
        destination,
        avgDuration,
        bestTime: bestResult.timeOption,
        worstTime: worstResult.timeOption,
        bestDuration: bestResult.durationValue,
        worstDuration: worstResult.durationValue
      };
    }
  });
  
  // Format time in minutes
  const formatTime = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };
  
  // Format time option (convert 24h to 12h)
  const formatTimeOption = (timeOption: string) => {
    const [hours, minutes] = timeOption.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
  // Sort destination groups by average duration (best to worst)
  const sortedDestinationGroups = Object.values(destinationGroups).sort((a, b) => a.avgDuration - b.avgDuration);

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-800 mb-4">Travel Summary</h3>
      
      {sortedDestinationGroups.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No destination data available.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDestinationGroups.map(({ destination, avgDuration, bestTime, worstTime, bestDuration, worstDuration }) => (
            <div key={destination.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800">{destination.name}</h4>
                  
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <div>Best: {formatTime(bestDuration)}</div>
                    </div>
                    <div>at {formatTimeOption(bestTime)}</div>
                    
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <div>Worst: {formatTime(worstDuration)}</div>
                    </div>
                    <div>at {formatTimeOption(worstTime)}</div>
                    
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <div>Average: {formatTime(avgDuration)}</div>
                    </div>
                    <div></div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500 flex items-center">
                    <Clock3Icon className="h-3 w-3 mr-1" />
                    Variance: {Math.round((worstDuration - bestDuration) / 60)} minutes
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsSummary;