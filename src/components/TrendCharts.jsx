import React, { useMemo } from 'react';
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
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const STATE_COLORS = {
  punjab: '#4CAF50',
  rajasthan: '#FF9800',
  gujarat: '#2196F3',
  kerala: '#00BCD4',
  jharkhand: '#795548',
  maharashtra: '#9C27B0',
  tamilnadu: '#E91E63',
  uttarpradesh: '#FF5722',
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 300 },
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        color: '#9e9e9e',
        font: { size: 9, family: 'Inter' },
        boxWidth: 8,
        padding: 8,
        usePointStyle: true,
      }
    },
    tooltip: {
      backgroundColor: 'rgba(20,20,40,0.9)',
      titleFont: { family: 'Inter', size: 11 },
      bodyFont: { family: 'Inter', size: 10 },
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 8,
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.03)' },
      ticks: { color: '#616161', font: { size: 8 }, maxTicksLimit: 10 },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.03)' },
      ticks: { color: '#616161', font: { size: 9 } },
      min: 0,
    }
  },
  elements: {
    point: { radius: 0, hoverRadius: 4 },
    line: { tension: 0.4, borderWidth: 1.5 },
  }
};

function TrendCharts({ history = [] }) {
  const populationData = useMemo(() => {
    if (history.length === 0) return null;

    const labels = history.map(h => h.cycle);
    const stateIds = history[0]?.states?.map(s => s.id) || [];

    return {
      labels,
      datasets: stateIds.map(id => ({
        label: history[0].states.find(s => s.id === id)?.name || id,
        data: history.map(h => {
          const state = h.states.find(s => s.id === id);
          return state ? state.population : 0;
        }),
        borderColor: STATE_COLORS[id] || '#888',
        backgroundColor: (STATE_COLORS[id] || '#888') + '10',
        fill: false,
      }))
    };
  }, [history]);

  const happinessData = useMemo(() => {
    if (history.length === 0) return null;

    const labels = history.map(h => h.cycle);
    const stateIds = history[0]?.states?.map(s => s.id) || [];

    return {
      labels,
      datasets: stateIds.map(id => ({
        label: history[0].states.find(s => s.id === id)?.name || id,
        data: history.map(h => {
          const state = h.states.find(s => s.id === id);
          return state ? state.happiness : 0;
        }),
        borderColor: STATE_COLORS[id] || '#888',
        fill: false,
      }))
    };
  }, [history]);

  if (history.length < 2) {
    return (
      <div className="glass-card p-4">
        <h2 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
          📈 <span className="bg-gradient-to-r from-amber-400 to-pink-400 bg-clip-text text-transparent">Trends</span>
        </h2>
        <div className="text-center text-sm text-gray-500 py-8">
          Run the simulation to see trends...
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
        📈 <span className="bg-gradient-to-r from-amber-400 to-pink-400 bg-clip-text text-transparent">Trends</span>
      </h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Population</h3>
          <div className="h-36">
            {populationData && <Line data={populationData} options={chartOptions} />}
          </div>
        </div>
        <div>
          <h3 className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Happiness</h3>
          <div className="h-36">
            {happinessData && <Line data={happinessData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 100 } } }} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrendCharts;
