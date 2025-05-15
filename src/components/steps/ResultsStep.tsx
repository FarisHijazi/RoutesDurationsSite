import React, { useEffect, useCallback } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
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
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Results</h2>
      <p className="text-gray-600 mb-6">
        Analysis of travel times between your property and destinations.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <div className="bg-gray-100 rounded-lg overflow-hidden h-[400px]">
            <Wrapper apiKey={apiKey} libraries={['places', 'routes']}>
              <ResultsMap 
                locations={locations}
                results={routeResults}
                isLoading={isCalculating}
              />
            </Wrapper>
          </div>
        </div>
        
        <div className="lg:col-span-5">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 space-y-6">
              {isCalculating ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2Icon className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Calculating Routes</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    We're calculating routes between all your locations for the selected time periods.
                    This may take a moment...
                  </p>
                </div>
              ) : (
                <>
                  <ResultsSummary />
                  <ResultsDetails />
                  <ResultsCharts />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsStep;