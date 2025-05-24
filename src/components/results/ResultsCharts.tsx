import React, { useMemo } from 'react';
import { useStore } from '../../store';
import { AlertCircleIcon } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ConfidenceBandData {
  destinationId: string;
  destinationName: string;
  min: number[]; // optimistic
  max: number[]; // pessimistic
  avg: number[]; // best_guess
}

const COLORS = [
  'rgba(59, 130, 246, 1)', // blue
  'rgba(16, 185, 129, 1)', // green
  'rgba(234, 179, 8, 1)',  // yellow
  'rgba(239, 68, 68, 1)',  // red
  'rgba(168, 85, 247, 1)', // purple
  'rgba(251, 191, 36, 1)', // amber
  'rgba(52, 211, 153, 1)', // teal
];

const ResultsCharts: React.FC = () => {
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

  // Prepare data for confidence band plot
  const confidenceBandData: ConfidenceBandData[] = useMemo(() => {
    return destinations.map(dest => {
      const min: number[] = [];
      const max: number[] = [];
      const avg: number[] = [];
      timeOptions.forEach(time => {
        // Find the three models for this property->destination at this time
        const optimistic = routeResults.find(r =>
          r.fromId === property.id &&
          r.toId === dest.id &&
          r.timeOption === time.value &&
          r.trafficModel === 'optimistic'
        );
        const pessimistic = routeResults.find(r =>
          r.fromId === property.id &&
          r.toId === dest.id &&
          r.timeOption === time.value &&
          r.trafficModel === 'pessimistic'
        );
        const bestGuess = routeResults.find(r =>
          r.fromId === property.id &&
          r.toId === dest.id &&
          r.timeOption === time.value &&
          r.trafficModel === 'best_guess'
        );
        min.push(optimistic ? optimistic.durationValue / 60 : 0);
        max.push(pessimistic ? pessimistic.durationValue / 60 : 0);
        avg.push(bestGuess ? bestGuess.durationValue / 60 : 0);
      });
      return {
        destinationId: dest.id,
        destinationName: dest.name,
        min,
        max,
        avg,
      };
    });
  }, [destinations, property, routeResults, timeOptions]);

  // X-axis labels
  const timeLabels = timeOptions.map(t => t.label);

  // Calculate global min and max for Y-axis
  const { globalMin, globalMax } = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    confidenceBandData.forEach(band => {
      band.min.forEach(v => { if (v < min) min = v; });
      band.max.forEach(v => { if (v > max) max = v; });
      band.avg.forEach(v => { if (v < min) min = v; });
      band.avg.forEach(v => { if (v > max) max = v; });
    });
    // If no data, default to 0-100
    if (!isFinite(min)) min = 0;
    if (!isFinite(max)) max = 100;
    // Add a little padding
    min = Math.floor(min * 0.95);
    max = Math.ceil(max * 1.05);
    return { globalMin: min, globalMax: max };
  }, [confidenceBandData]);

  // Chart options (shared)
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
        text: '',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} min`;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: false,
        min: globalMin,
        max: globalMax,
        title: {
          display: true,
          text: 'Minutes',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time of Day',
        },
      },
    },
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-800 mb-4">Travel Time Analysis</h3>
      {confidenceBandData.map((band, i) => {
        const color = COLORS[i % COLORS.length];
        const datasets = [
          // Best Case (min) line
          {
            label: 'Best Case',
            data: band.min,
            fill: false,
            backgroundColor: color.replace('1)', '0.15)'),
            borderColor: 'rgba(0,0,0,0)',
            pointRadius: 0,
            type: 'line' as const,
            order: 1,
            tension: 0.3,
            showLine: false,
          },
          // Worst Case (max) line, fill to Best Case
          {
            label: 'Worst Case',
            data: band.max,
            fill: { target: 0, above: color.replace('1)', '0.15)'), below: color.replace('1)', '0.15)') },
            backgroundColor: color.replace('1)', '0.15)'),
            borderColor: 'rgba(0,0,0,0)',
            pointRadius: 0,
            type: 'line' as const,
            order: 2,
            tension: 0.3,
            showLine: false,
          },
          // Average line
          {
            label: 'Average',
            data: band.avg,
            fill: false,
            borderColor: color,
            backgroundColor: color,
            pointRadius: 3,
            type: 'line' as const,
            order: 3,
            tension: 0.3,
          },
        ];
        return (
          <div key={band.destinationId} className="mb-8">
            <h4 className="text-md font-semibold text-gray-700 mb-2">{band.destinationName}</h4>
            <Line data={{ labels: timeLabels, datasets }} options={chartOptions} />
          </div>
        );
      })}
    </div>
  );
};

export default ResultsCharts;