import React, { useEffect, useCallback, useState } from 'react';
import { useStore, Location } from '../../store';
import ResultsMap from '../map/ResultsMap';
import { calculateRoutes } from '../../services/mapService';
import ResultsSummary from '../results/ResultsSummary';
import ResultsDetails from '../results/ResultsDetails';
import ResultsCharts from '../results/ResultsCharts';
import { Loader2Icon, PrinterIcon } from 'lucide-react';

const ResultsStep: React.FC = () => {
  const { 
    apiKey, 
    locations, 
    timeOptions, 
    routeResults, 
    setRouteResults, 
    isCalculating, 
    setIsCalculating,
    setCalculationTime,
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
    setCalculationTime(null);
    const startTime = performance.now();
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
      const endTime = performance.now();
      setCalculationTime(endTime - startTime);
      setIsCalculating(false);
    }
  }, [setIsCalculating, setError, setRouteResults, setCalculationTime]);

  useEffect(() => {
    const property = locations.find(loc => loc.isProperty);
    const destinations = locations.filter(loc => !loc.isProperty);
    const selectedTimes = timeOptions.filter(t => t.selected).map(t => t.value);
    
    if (property && destinations.length > 0 && selectedTimes.length > 0 && routeResults.length === 0 && !isCalculating) {
      runCalculations(property, destinations, selectedTimes);
    }
  }, [locations, timeOptions, routeResults, isCalculating, runCalculations]);

  return (
    <div className="results-container flex flex-col gap-8 w-full">
      <div className="no-print flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Analysis Report</h2>
        <button
          onClick={() => window.print()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
        >
          <PrinterIcon className="h-4 w-4 mr-2" />
          Print Report
        </button>
      </div>

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
          className="no-print px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-800 font-medium mb-2"
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