import React, { useMemo, useState } from 'react';
import { useStore, Location } from '../../store';
import { AlertCircleIcon } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ResultsCharts: React.FC = () => {
  const { locations, routeResults, timeOptions } = useStore();
  const [selectedDestination, setSelectedDestination] = useState<string | null>(
    locations.find(loc => !loc.isProperty)?.id || null
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
  
  // Find property
  const property = locations.find(loc => loc.isProperty);
  
  if (!property) {
    return <div>No property location found.</div>;
  }
  
  // Find destinations
  const destinations = locations.filter(loc => !loc.isProperty);
  
  if (destinations.length === 0) {
    return <div>No destinations found.</div>;
  }
  
  // If no destination is selected, select the first one
  if (!selectedDestination && destinations.length > 0) {
    setSelectedDestination(destinations[0].id);
  }
  
  // Get selected destination
  const selectedDestinationObj = destinations.find(d => d.id === selectedDestination);
  
  // Filter results for selected destination (all times)
  const destinationResults = useMemo(() => {
    if (!selectedDestination || !property) return [];
    return routeResults.filter(
      r => r.fromId === property.id && r.toId === selectedDestination
    ).sort((a, b) => {
      // Sort by time option (hour)
      const timeA = a.timeOption.split(':')[0];
      const timeB = b.timeOption.split(':')[0];
      return parseInt(timeA) - parseInt(timeB);
    });
  }, [routeResults, selectedDestination, property]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    if (destinationResults.length === 0) return null;
    const labels = destinationResults.map(r => {
      const timeOption = timeOptions.find(t => t.value === r.timeOption);
      return timeOption?.label || r.timeOption;
    });
    const durations = destinationResults.map(r => Math.round(r.durationValue / 60)); // Convert to minutes
    return {
      labels,
      datasets: [
        {
          label: 'Travel Time (minutes)',
          data: durations,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [destinationResults, timeOptions]);
  
  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: selectedDestinationObj 
          ? `Travel Time to ${selectedDestinationObj.name}` 
          : 'Travel Time by Time of Day',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Minutes'
        }
      }
    }
  };
  
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-800 mb-4">Travel Time Analysis</h3>
      
      <div className="mb-4">
        <label htmlFor="destinationSelect" className="block text-sm font-medium text-gray-700 mb-1">
          Select Destination:
        </label>
        <select
          id="destinationSelect"
          value={selectedDestination || ''}
          onChange={(e) => setSelectedDestination(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          {destinations.map((destination) => (
            <option key={destination.id} value={destination.id}>
              {destination.name}
            </option>
          ))}
        </select>
      </div>
      
      {chartData ? (
        <div className="mt-4">
          <Bar data={chartData} options={chartOptions} />
          
          <div className="mt-4 text-sm text-gray-600">
            <h4 className="font-medium mb-1">Analysis:</h4>
            <p>
              The chart shows travel times from {property.name} to {selectedDestinationObj?.name} at different times of day.
              {destinationResults.length > 0 && (
                <>
                  {' '}The best time to travel is at{' '}
                  {timeOptions.find(t => t.value === 
                    destinationResults.reduce((best, current) => 
                      current.durationValue < best.durationValue ? current : best
                    ).timeOption
                  )?.label || 'N/A'}.
                </>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          No chart data available.
        </div>
      )}
    </div>
  );
};

export default ResultsCharts;