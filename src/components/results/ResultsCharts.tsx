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
  const [visible, setVisible] = useState<{ [id: string]: boolean }>({});
  const [hovered, setHovered] = useState<string | null>(null);

  // Assign a unique, persistent color to each destination based on its ID
  function getColorMap(bands: ConfidenceBandData[]): Record<string, string> {
    const colorMap: Record<string, string> = {};
    bands.forEach((band, idx) => {
      colorMap[band.destinationId] = COLORS[idx % COLORS.length];
    });
    return colorMap;
  }

  // Prepare data for confidence band plot
  const confidenceBandData: ConfidenceBandData[] = useMemo(() => {
    const property = locations.find(loc => loc.isProperty);
    const destinations = locations.filter(loc => !loc.isProperty);
    if (!property || destinations.length === 0) return [];
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
  }, [locations, routeResults, timeOptions]);

  // Assign persistent colors to each destination
  const colorMap = useMemo(() => getColorMap(confidenceBandData), [confidenceBandData]);

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
    const color = colorMap[band.destinationId] || COLORS[0];
    const baseAlpha = hovered && hovered !== band.destinationId ? '0.10' : '0.25';
    const strongAlpha = hovered === band.destinationId ? '0.5' : baseAlpha;
    // Index of Best Case dataset (will be datasets.length before push)
    const bestCaseIndex = datasets.length;
    // Best Case (min)
    datasets.push({
      label: `${band.destinationName} (Best Case)`,
      data: band.min,
      fill: false,
      backgroundColor: color.replace('1)', `${baseAlpha})`),
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
      fill: { target: bestCaseIndex, above: color.replace('1)', `${strongAlpha})`), below: color.replace('1)', `${strongAlpha})`) },
      backgroundColor: color.replace('1)', `${strongAlpha})`),
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
      borderColor: hovered === band.destinationId ? color : color.replace('1)', `${baseAlpha})`),
      backgroundColor: hovered === band.destinationId ? color : color.replace('1)', `${baseAlpha})`),
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
      <h3 className="text-lg font-medium text-gray-800 mb-4">Travel Time Analysis</h3>
      <div className="flex flex-wrap gap-4 mb-4">
        {confidenceBandData.map((band) => (
          <label key={band.destinationId} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={visible[band.destinationId] ?? true}
              onChange={e => setVisible(v => ({ ...v, [band.destinationId]: e.target.checked }))}
            />
            <span style={{ color: colorMap[band.destinationId] || COLORS[0] }}>{band.destinationName}</span>
          </label>
        ))}
      </div>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default ResultsCharts;