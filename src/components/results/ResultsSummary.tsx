import React from 'react';
import { useStore, Location } from '../../store';
import { Clock3Icon, MapPinIcon, AlertCircleIcon } from 'lucide-react';
import LoadingIndicator from '../common/LoadingIndicator';

const ResultsSummary: React.FC = () => {
  const { locations, routeResults, isCalculating, calculationTime, timeOptions } = useStore();
  
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

  // Helper to calculate stats
  const processResults = (results: typeof routeResults) => {
    const bestGuessResults = results.filter(r => r.trafficModel === 'best_guess');
    const optimisticResults = results.filter(r => r.trafficModel === 'optimistic');
    const pessimisticResults = results.filter(r => r.trafficModel === 'pessimistic');

    const totalDuration = bestGuessResults.reduce((sum, r) => sum + r.durationValue, 0);
    const avgDuration = totalDuration / bestGuessResults.length;

    const bestResult = optimisticResults.sort((a, b) => a.durationValue - b.durationValue)[0];
    const worstResult = pessimisticResults.sort((a, b) => a.durationValue - b.durationValue)[pessimisticResults.length - 1];

    return {
      avgDuration,
      bestTime: bestResult.timeOption,
      worstTime: worstResult.timeOption,
      bestDuration: bestResult.durationValue,
      worstDuration: worstResult.durationValue
    };
  };
  
  // Group results by destination and direction
  const destinationGroups: { [key: string]: {
    name: string,
    avgDuration: number,
    bestTime: string,
    worstTime: string,
    bestDuration: number,
    worstDuration: number
  }} = {};
  
  locations.filter(loc => !loc.isProperty).forEach(destination => {
    // Process outbound trips (property -> destination)
    const resultsTo = routeResults.filter(
      r => r.fromId === property.id && r.toId === destination.id
    );
    if (resultsTo.length > 0) {
      const { avgDuration, bestTime, worstTime, bestDuration, worstDuration } = processResults(resultsTo);
      destinationGroups[destination.id] = { name: destination.name, avgDuration, bestTime, worstTime, bestDuration, worstDuration };
    }
    
    // Process return trips (destination -> property)
    const resultsFrom = routeResults.filter(
      r => r.fromId === destination.id && r.toId === property.id
    );
    if (resultsFrom.length > 0) {
      const { avgDuration, bestTime, worstTime, bestDuration, worstDuration } = processResults(resultsFrom);
      destinationGroups[`${destination.id}-return`] = { name: `${destination.name} (Return)`, avgDuration, bestTime, worstTime, bestDuration, worstDuration };
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

  const destinationCount = locations.filter(loc => !loc.isProperty).length;
  const timeCount = timeOptions.filter(t => t.selected).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800">Travel Summary</h3>
        {calculationTime && (
          <p className="text-sm text-gray-500">
            Searched {destinationCount} locations and {timeCount} time periods in {(calculationTime / 1000).toFixed(1)} seconds.
          </p>
        )}
      </div>
      
      {sortedDestinationGroups.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No destination data available.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDestinationGroups.map(({ name, avgDuration, bestTime, worstTime, bestDuration, worstDuration }, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800">{name}</h4>
                  
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