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

  // Resource trend: compute average across all alive states for each resource
  const resourceData = useMemo(() => {
    if (history.length === 0) return null;
    const labels = history.map(h => h.cycle);
    const resources = ['water', 'food', 'energy', 'land'];
    const colors = { water: '#67e8f9', food: '#6ee7b7', energy: '#fcd34d', land: '#c4b5fd' };
    return {
      labels,
      datasets: resources.map(res => ({
        label: res.charAt(0).toUpperCase() + res.slice(1),
        data: history.map(h => {
          const alive = (h.states || []).filter(s => s.alive !== false);
          if (alive.length === 0) return 0;
          return Math.round(alive.reduce((sum, s) => sum + (s.resources?.[res] || 0), 0) / alive.length);
        }),
        borderColor: colors[res],
        fill: false,
      }))
    };
  }, [history]);

  // Strategy evolution: stacked area chart showing dominant action distribution
  const strategyData = useMemo(() => {
    if (history.length < 5) return null;
    const stateIds = history[0]?.states?.map(s => s.id) || [];
    const ACTIONS = ['HARVEST', 'CONSERVE', 'TRADE', 'EXPAND', 'DEFEND', 'INNOVATE'];
    const ACTION_COLORS = {
      HARVEST: 'rgba(76, 175, 80, 0.7)',
      CONSERVE: 'rgba(33, 150, 243, 0.7)',
      TRADE: 'rgba(255, 152, 0, 0.7)',
      EXPAND: 'rgba(233, 30, 99, 0.7)',
      DEFEND: 'rgba(121, 85, 72, 0.7)',
      INNOVATE: 'rgba(156, 39, 176, 0.7)',
    };
    // Sample every Nth cycle for performance
    const step = Math.max(1, Math.floor(history.length / 60));
    const sampled = history.filter((_, i) => i % step === 0 || i === history.length - 1);
    const labels = sampled.map(h => h.cycle);

    return {
      labels,
      datasets: ACTIONS.map(action => ({
        label: action.charAt(0) + action.slice(1).toLowerCase(),
        data: sampled.map(h => {
          const alive = (h.states || []).filter(s => s.alive !== false);
          if (alive.length === 0) return 0;
          // Count how many states have this action as dominant
          let count = 0;
          alive.forEach(s => {
            if (s.strategy) {
              const top = Object.entries(s.strategy).reduce((a, b) => a[1] > b[1] ? a : b, ['', -1]);
              if (top[0] === action) count++;
            }
          });
          return Math.round((count / alive.length) * 100);
        }),
        borderColor: ACTION_COLORS[action],
        backgroundColor: ACTION_COLORS[action].replace('0.7', '0.35'),
        fill: true,
        borderWidth: 1,
      })),
    };
  }, [history]);

  const stackedOptions = useMemo(() => ({
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        mode: 'index',
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
        },
      },
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        stacked: true,
        max: 100,
        ticks: { ...chartOptions.scales.y.ticks, callback: v => v + '%' },
      },
      x: {
        ...chartOptions.scales.x,
        stacked: true,
      },
    },
  }), []);

  if (history.length < 2) {
    return (
      <div>
        <div className="text-center text-xs text-gray-600 py-10">
          <div className="text-2xl mb-2 opacity-40">--</div>
          Run the simulation to see trend data.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        <div>
          <h3 className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400/60" /> Population
          </h3>
          <div className="h-36">
            {populationData && <Line data={populationData} options={chartOptions} />}
          </div>
        </div>
        <div>
          <h3 className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400/60" /> Happiness
          </h3>
          <div className="h-36">
            {happinessData && <Line data={happinessData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 100 } } }} />}
          </div>
        </div>
        <div>
          <h3 className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400/60" /> Avg Resources
          </h3>
          <div className="h-36">
            {resourceData && <Line data={resourceData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 100 } } }} />}
          </div>
        </div>
        {strategyData && (
          <div>
            <h3 className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400/60" /> Strategy Evolution
            </h3>
            <div className="h-44">
              <Line data={strategyData} options={stackedOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrendCharts;
