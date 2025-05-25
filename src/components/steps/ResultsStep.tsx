import React, { useEffect, useCallback, useState } from 'react';
import { useStore, Location } from '../../store';
import ResultsMap from '../map/ResultsMap';
import { calculateRoutes } from '../../services/mapService';
import ResultsSummary from '../results/ResultsSummary';
import ResultsDetails from '../results/ResultsDetails';
import ResultsCharts from '../results/ResultsCharts';
import { Loader2Icon } from 'lucide-react';

const ResultsStep: React.FC = () => {
  const { 
    apiKey, 
    locations, 
    timeOptions, 
    routeResults, 
    setRouteResults, 
    isCalculating, 
    setIsCalculating, 
    setError 
  } = useStore();
  
  const [showDetails, setShowDetails] = useState(false);

  const runCalculations = useCallback(async (
    property: Location, 
    destinations: Location[], 
    selectedTimes: string[]
  ) => {
    setIsCalculating(true);
    setError(null);
    try {
      const results = await calculateRoutes(property, destinations, selectedTimes);
      setRouteResults(results);
    } catch (error) {
      console.error('Error calculating routes:', error);
      let errorMessage = 'Failed to calculate routes. Please check your API key and ensure the required APIs are enabled.';
      if (error instanceof Error) {
        if (error.message.includes('API key not valid') || error.message.includes('InvalidKeyMapError')) {
            errorMessage = 'The provided Google Maps API key is invalid or missing required permissions.';
        } else if (error.message.includes('ApiNotActivatedMapError')) {
            errorMessage = 'The Google Maps JavaScript API is not activated for your key. Please enable it in the Google Cloud Console.';
        } else if (error.message.includes('REQUEST_DENIED')) {
            errorMessage = 'Request denied by Google Maps API. This could be due to an invalid API key, billing issues, or incorrect API configuration.';
        } else if (error.message) {
            errorMessage = `Calculation error: ${error.message}`;
        }
      }
      setError(errorMessage);
    } finally {
      setIsCalculating(false);
    }
  }, [setIsCalculating, setError, setRouteResults]);

  useEffect(() => {
    const property = locations.find(loc => loc.isProperty);
    const destinations = locations.filter(loc => !loc.isProperty);
    const selectedTimes = timeOptions.filter(t => t.selected).map(t => t.value);
    
    if (property && destinations.length > 0 && selectedTimes.length > 0 && routeResults.length === 0 && !isCalculating) {
      runCalculations(property, destinations, selectedTimes);
    }
  }, [locations, timeOptions, routeResults, isCalculating, runCalculations]);

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="bg-gray-100 rounded-lg overflow-hidden h-[400px] w-full">
        <ResultsMap 
          locations={locations}
          results={routeResults}
          isLoading={isCalculating}
        />
      </div>
      <ResultsSummary />
      <ResultsCharts />
      <div className="mt-4">
        <button
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-800 font-medium mb-2"
          onClick={() => setShowDetails(v => !v)}
        >
          {showDetails ? 'Hide' : 'Show'} Trip detailed times
        </button>
        {showDetails && (
          <div className="mt-2">
            <ResultsDetails />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsStep;