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
        color: '#757575',
        font: { size: 9, family: 'Inter, system-ui' },
        boxWidth: 6,
        padding: 8,
        usePointStyle: true,
        pointStyleWidth: 6,
      }
    },
    tooltip: {
      backgroundColor: 'rgba(15,15,30,0.95)',
      titleFont: { family: 'Inter, system-ui', size: 11 },
      bodyFont: { family: 'Inter, system-ui', size: 10 },
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      cornerRadius: 6,
      padding: 8,
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.02)' },
      ticks: { color: '#4a4a4a', font: { size: 8 }, maxTicksLimit: 10 },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.02)' },
      ticks: { color: '#4a4a4a', font: { size: 9 } },
      min: 0,
    }
  },
  elements: {
    point: { radius: 0, hoverRadius: 3 },
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
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Trends</h2>
        <div className="text-center text-xs text-gray-600 py-8">
          Run the simulation to see trend data.
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Trends</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest">Population</h3>
          <div className="h-36">
            {populationData && <Line data={populationData} options={chartOptions} />}
          </div>
        </div>
        <div>
          <h3 className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest">Happiness</h3>
          <div className="h-36">
            {happinessData && <Line data={happinessData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 100 } } }} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrendCharts;
