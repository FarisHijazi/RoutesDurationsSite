import React, { useEffect, useState } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { useStore } from '../../store';
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
  
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'charts'>('summary');
  
  useEffect(() => {
    const property = locations.find(loc => loc.isProperty);
    const destinations = locations.filter(loc => !loc.isProperty);
    const selectedTimes = timeOptions.filter(t => t.selected).map(t => t.value);
    
    if (property && destinations.length > 0 && selectedTimes.length > 0 && routeResults.length === 0) {
      runCalculations(property, destinations, selectedTimes);
    }
  }, []);
  
  const runCalculations = async (
    property, 
    destinations, 
    selectedTimes
  ) => {
    setIsCalculating(true);
    try {
      const results = await calculateRoutes(property, destinations, selectedTimes);
      setRouteResults(results);
    } catch (error) {
      console.error('Error calculating routes:', error);
      setError('Failed to calculate routes. Please check your API key and try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const renderTabContent = () => {
    if (isCalculating) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2Icon className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Calculating Routes</h3>
          <p className="text-gray-500 text-center max-w-md">
            We're calculating routes between all your locations for the selected time periods.
            This may take a moment...
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'summary':
        return <ResultsSummary />;
      case 'details':
        return <ResultsDetails />;
      case 'charts':
        return <ResultsCharts />;
      default:
        return <ResultsSummary />;
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Results</h2>
      <p className="text-gray-600 mb-6">
        Analysis of travel times between your property and destinations.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <div className="bg-gray-100 rounded-lg overflow-hidden h-[400px]">
            <Wrapper apiKey={apiKey} libraries={['places']}>
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
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-3 text-sm font-medium ${
                    activeTab === 'summary'
                      ? 'text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-3 text-sm font-medium ${
                    activeTab === 'details'
                      ? 'text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('charts')}
                  className={`px-4 py-3 text-sm font-medium ${
                    activeTab === 'charts'
                      ? 'text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Charts
                </button>
              </nav>
            </div>
            
            <div className="p-4">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsStep;