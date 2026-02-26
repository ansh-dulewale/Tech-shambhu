import React, { useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// Crosshair plugin — draws a vertical line at the hovered x position
const crosshairPlugin = {
  id: 'crosshair',
  afterDraw(chart) {
    if (chart.tooltip?._active?.length) {
      const ctx = chart.ctx;
      const x = chart.tooltip._active[0].element.x;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.restore();
    }
  }
};
ChartJS.register(crosshairPlugin);

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
        font: { size: 10, family: 'Inter, system-ui' },
        boxWidth: 8,
        padding: 10,
        usePointStyle: true,
        pointStyleWidth: 6,
      }
    },
    tooltip: {
      backgroundColor: 'rgba(15,15,30,0.95)',
      titleFont: { family: 'Inter, system-ui', size: 12 },
      bodyFont: { family: 'Inter, system-ui', size: 11 },
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      cornerRadius: 6,
      padding: 8,
      mode: 'index',
      intersect: false,
    }
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.02)' },
      ticks: { color: '#4a4a4a', font: { size: 10 }, maxTicksLimit: 10 },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.02)' },
      ticks: { color: '#4a4a4a', font: { size: 10 } },
      min: 0,
    }
  },
  elements: {
    point: { radius: 0, hoverRadius: 5, hoverBackgroundColor: '#fff', hoverBorderWidth: 2 },
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
        backgroundColor: (STATE_COLORS[id] || '#888') + '18',
        fill: true,
        borderWidth: 1.5,
      }))
    };
  }, [history]);

  // Happiness: horizontal bar chart showing latest snapshot per state
  const happinessBarData = useMemo(() => {
    if (history.length === 0) return null;
    const latest = history[history.length - 1];
    const aliveStates = (latest.states || []).filter(s => s.alive !== false);
    const sorted = [...aliveStates].sort((a, b) => (b.happiness || 0) - (a.happiness || 0));
    return {
      labels: sorted.map(s => s.name),
      datasets: [{
        label: 'Happiness',
        data: sorted.map(s => s.happiness || 0),
        backgroundColor: sorted.map(s => {
          const h = s.happiness || 0;
          if (h >= 70) return 'rgba(52, 211, 153, 0.5)';
          if (h >= 40) return 'rgba(251, 191, 36, 0.5)';
          return 'rgba(248, 113, 113, 0.5)';
        }),
        borderColor: sorted.map(s => {
          const h = s.happiness || 0;
          if (h >= 70) return 'rgba(52, 211, 153, 0.9)';
          if (h >= 40) return 'rgba(251, 191, 36, 0.9)';
          return 'rgba(248, 113, 113, 0.9)';
        }),
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 16,
      }]
    };
  }, [history]);

  // Resource trend: gradient-filled area chart
  const resourceData = useMemo(() => {
    if (history.length === 0) return null;
    const labels = history.map(h => h.cycle);
    const resources = ['water', 'food', 'energy', 'land'];
    const colors = {
      water: { border: '#67e8f9', bg: 'rgba(103, 232, 249, 0.15)' },
      food: { border: '#6ee7b7', bg: 'rgba(110, 231, 183, 0.15)' },
      energy: { border: '#fcd34d', bg: 'rgba(252, 211, 77, 0.15)' },
      land: { border: '#c4b5fd', bg: 'rgba(196, 181, 253, 0.15)' },
    };
    return {
      labels,
      datasets: resources.map(res => ({
        label: res.charAt(0).toUpperCase() + res.slice(1),
        data: history.map(h => {
          const alive = (h.states || []).filter(s => s.alive !== false);
          if (alive.length === 0) return 0;
          return Math.round(alive.reduce((sum, s) => sum + (s.resources?.[res] || 0), 0) / alive.length);
        }),
        borderColor: colors[res].border,
        backgroundColor: colors[res].bg,
        fill: true,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
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

  // Options for horizontal happiness bar chart
  const happinessBarOptions = useMemo(() => ({
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: (ctx) => `Happiness: ${ctx.parsed.x}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.02)' },
        ticks: { color: '#4a4a4a', font: { size: 8 } },
        min: 0,
        max: 100,
      },
      y: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { size: 9, family: 'Inter, system-ui' } },
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
      <div className="space-y-6">
        <div>
          <h3 className="text-xs text-gray-500 mb-2 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400/60" /> Population
            <span className="text-[8px] text-gray-600 font-normal ml-auto">Area Chart</span>
          </h3>
          <div className="h-56">
            {populationData && <Line data={populationData} options={chartOptions} />}
          </div>
        </div>
        <div>
          <h3 className="text-xs text-gray-500 mb-2 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400/60" /> Happiness
            <span className="text-[8px] text-gray-600 font-normal ml-auto">Current Snapshot</span>
          </h3>
          <div className="h-60">
            {happinessBarData && <Bar data={happinessBarData} options={happinessBarOptions} />}
          </div>
        </div>
        <div>
          <h3 className="text-xs text-gray-500 mb-2 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400/60" /> Avg Resources
            <span className="text-[8px] text-gray-600 font-normal ml-auto">Filled Area</span>
          </h3>
          <div className="h-56">
            {resourceData && <Line data={resourceData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 100 } } }} />}
          </div>
        </div>
        {strategyData && (
          <div>
            <h3 className="text-xs text-gray-500 mb-2 uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400/60" /> Strategy Evolution
            </h3>
            <div className="h-56">
              <Line data={strategyData} options={stackedOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrendCharts;
