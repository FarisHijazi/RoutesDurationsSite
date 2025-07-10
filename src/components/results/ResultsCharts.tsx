import React, { useMemo, useState } from 'react';
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
import LoadingIndicator from '../common/LoadingIndicator';
import { RouteResult, TimeOption, Location } from '../../store';

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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ConfidenceBandData {
  destinationId: string;
  destinationName: string;
  color: string;
  min: number[]; // optimistic
  max: number[]; // pessimistic
  avg: number[]; // best_guess
}

const processTrip = (
  fromId: string,
  toId: string,
  routeResults: RouteResult[],
  timeOptions: TimeOption[]
) => {
  const min: number[] = [];
  const max: number[] = [];
  const avg: number[] = [];
  let hasData = false;
  timeOptions.forEach(time => {
    const optimistic = routeResults.find(r => r.fromId === fromId && r.toId === toId && r.timeOption === time.value && r.trafficModel === 'optimistic');
    const pessimistic = routeResults.find(r => r.fromId === fromId && r.toId === toId && r.timeOption === time.value && r.trafficModel === 'pessimistic');
    const bestGuess = routeResults.find(r => r.fromId === fromId && r.toId === toId && r.timeOption === time.value && r.trafficModel === 'best_guess');
    
    min.push(optimistic ? optimistic.durationValue / 60 : 0);
    max.push(pessimistic ? pessimistic.durationValue / 60 : 0);
    avg.push(bestGuess ? bestGuess.durationValue / 60 : 0);
    if(optimistic || pessimistic || bestGuess) hasData = true;
  });
  return hasData ? { min, max, avg } : null;
};

const ResultsCharts: React.FC = () => {
  const { locations, routeResults, timeOptions, isCalculating } = useStore();
  const [visible, setVisible] = useState<{ [id: string]: boolean }>({});
  const [hovered, setHovered] = useState<string | null>(null);

  // Prepare data for confidence band plot
  const confidenceBandData: ConfidenceBandData[] = useMemo(() => {
    const property = locations.find(loc => loc.isProperty);
    const destinations = locations.filter(loc => !loc.isProperty);
    if (!property || destinations.length === 0) return [];
    
    const bands: ConfidenceBandData[] = [];

    destinations.forEach(dest => {
      // Outbound trip
      const outbound = processTrip(property.id, dest.id, routeResults, timeOptions);
      if (outbound) {
        bands.push({
          destinationId: dest.id,
          destinationName: dest.name,
          color: dest.color,
          ...outbound,
        });
      }

      // Return trip
      const inbound = processTrip(dest.id, property.id, routeResults, timeOptions);
      if (inbound) {
        bands.push({
          destinationId: `${dest.id}-return`,
          destinationName: `${dest.name} (Return)`,
          color: dest.color,
          ...inbound,
        });
      }
    });
    return bands.sort((a, b) => {
      const aAvg = a.avg.reduce((sum, v) => sum + v, 0) / a.avg.length;
      const bAvg = b.avg.reduce((sum, v) => sum + v, 0) / b.avg.length;
      return aAvg - bAvg;
    });
  }, [locations, routeResults, timeOptions]);

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
    if (!isFinite(min)) min = 0;
    if (!isFinite(max)) max = 100;
    min = Math.floor(min * 0.95);
    max = Math.ceil(max * 1.05);
    return { globalMin: min, globalMax: max };
  }, [confidenceBandData]);

  // Checkbox state: default all visible
  React.useEffect(() => {
    if (Object.keys(visible).length === 0 && confidenceBandData.length > 0) {
      const initial: { [id: string]: boolean } = {};
      confidenceBandData.forEach(b => { initial[b.destinationId] = true; });
      setVisible(initial);
    }
  }, [confidenceBandData, visible]);

  // Build datasets for all visible destinations
  const visibleBands = confidenceBandData.filter(band => visible[band.destinationId]);
  // Build datasets and keep track of Best Case indices
  const datasets: any[] = [];
  visibleBands.forEach((band) => {
    const color = band.color || '#333';
    const baseAlpha = hovered && hovered !== band.destinationId ? 0.1 : 0.2;
    const strongAlpha = hovered === band.destinationId ? 0.4 : baseAlpha;
    // Index of Best Case dataset (will be datasets.length before push)
    const bestCaseIndex = datasets.length;
    // Best Case (min)
    datasets.push({
      label: `${band.destinationName} (Best Case)`,
      data: band.min,
      fill: false,
      backgroundColor: hexToRgba(color, baseAlpha),
      borderColor: 'rgba(0,0,0,0)',
      pointRadius: 0,
      type: 'line' as const,
      order: 1,
      tension: 0.3,
      showLine: false,
      datakey: band.destinationId + '-min',
    });
    // Worst Case (max) - fill to Best Case
    datasets.push({
      label: `${band.destinationName} (Worst Case)`,
      data: band.max,
      fill: { target: bestCaseIndex, above: hexToRgba(color, strongAlpha), below: hexToRgba(color, strongAlpha) },
      backgroundColor: hexToRgba(color, strongAlpha),
      borderColor: 'rgba(0,0,0,0)',
      pointRadius: 0,
      type: 'line' as const,
      order: hovered === band.destinationId ? 99 : 2,
      tension: 0.3,
      showLine: false,
      datakey: band.destinationId + '-max',
    });
    // Average (best_guess)
    datasets.push({
      label: `${band.destinationName} (Average)`,
      data: band.avg,
      fill: false,
      borderColor: hovered === band.destinationId ? color : hexToRgba(color, 0.5),
      backgroundColor: hovered === band.destinationId ? color : hexToRgba(color, 0.5),
      pointRadius: 3,
      type: 'line' as const,
      order: hovered === band.destinationId ? 100 : 3,
      tension: 0.3,
      datakey: band.destinationId + '-avg',
    });
  });

  const chartData = {
    labels: timeLabels,
    datasets,
  };

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
    onHover: (event, chartElements, chart) => {
      if (chartElements && chartElements.length > 0) {
        const datasetIndex = chartElements[0].datasetIndex;
        const label = chart.data.datasets[datasetIndex]?.label;
        if (label) {
          const match = label.match(/^(.*) \((Best|Worst|Average) Case\)$/);
          if (match) {
            const destName = match[1];
            const band = confidenceBandData.find(b => b.destinationName === destName);
            if (band) setHovered(band.destinationId);
          }
        }
      } else {
        setHovered(null);
      }
    },
  };

  // Early returns after all hooks
  if (isCalculating) {
    return <LoadingIndicator text="Generating travel charts..." />;
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
  const property = locations.find(loc => loc.isProperty);
  if (!property) {
    return <div>No property location found.</div>;
  }
  const destinations = locations.filter(loc => !loc.isProperty);
  if (destinations.length === 0) {
    return <div>No destinations found.</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-800 mb-4">Your day at a glance</h3>
      <div className="flex flex-wrap gap-4 mb-4">
        {confidenceBandData.map((band) => (
          <label key={band.destinationId} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={visible[band.destinationId] ?? true}
              onChange={e => setVisible(v => ({ ...v, [band.destinationId]: e.target.checked }))}
            />
            <span style={{ color: band.color || '#333' }}>{band.destinationName}</span>
          </label>
        ))}
      </div>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default ResultsCharts;