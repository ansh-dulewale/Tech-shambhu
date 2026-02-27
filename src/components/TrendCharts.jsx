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
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.restore();
    }
  }
};
ChartJS.register(crosshairPlugin);

const STATE_COLORS = {
  punjab: { border: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  rajasthan: { border: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  gujarat: { border: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  kerala: { border: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
  jharkhand: { border: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  maharashtra: { border: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
  tamilnadu: { border: '#fb7185', bg: 'rgba(251,113,133,0.12)' },
  uttarpradesh: { border: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
};

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 350, easing: 'easeOutQuart' },
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        color: 'rgba(255,255,255,0.45)',
        font: { size: 10, family: "'Inter', system-ui, sans-serif", weight: '500' },
        boxWidth: 6,
        boxHeight: 6,
        padding: 14,
        usePointStyle: true,
        pointStyle: 'circle',
      }
    },
    tooltip: {
      backgroundColor: 'rgba(10,10,30,0.96)',
      titleFont: { family: "'Inter', system-ui", size: 11, weight: '600' },
      bodyFont: { family: "'Inter', system-ui", size: 10, weight: '400' },
      titleColor: 'rgba(255,255,255,0.9)',
      bodyColor: 'rgba(255,255,255,0.65)',
      borderColor: 'rgba(139,92,246,0.2)',
      borderWidth: 1,
      cornerRadius: 10,
      padding: { top: 10, bottom: 10, left: 14, right: 14 },
      mode: 'index',
      intersect: false,
      displayColors: true,
      boxWidth: 6,
      boxHeight: 6,
      boxPadding: 4,
      usePointStyle: true,
    }
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.02)', drawBorder: false },
      border: { display: false },
      ticks: {
        color: 'rgba(255,255,255,0.25)',
        font: { size: 9, family: "'Inter', system-ui" },
        maxTicksLimit: 12,
        padding: 6,
      },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.025)', drawBorder: false },
      border: { display: false },
      ticks: {
        color: 'rgba(255,255,255,0.25)',
        font: { size: 9, family: "'Inter', system-ui" },
        padding: 8,
      },
      min: 0,
    }
  },
  elements: {
    point: { radius: 0, hoverRadius: 4, hoverBackgroundColor: '#fff', hoverBorderWidth: 2 },
    line: { tension: 0.35, borderWidth: 2 },
  }
};

/* ─── Section Card Wrapper ─── */
function ChartSection({ title, subtitle, accentColor, badge, children }) {
  return (
    <div className="rounded-2xl bg-[#0d0b1a]/60 border border-white/[0.04] overflow-hidden transition-all hover:border-white/[0.07]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 rounded-full" style={{ background: accentColor }} />
          <div>
            <h3 className="text-[13px] font-semibold text-white/90 tracking-tight">{title}</h3>
            {subtitle && <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-wider">{subtitle}</p>}
          </div>
        </div>
        {badge && (
          <span className="text-[9px] px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wider"
            style={{ background: accentColor + '15', color: accentColor, border: `1px solid ${accentColor}20` }}>
            {badge}
          </span>
        )}
      </div>
      {/* Chart area */}
      <div className="px-4 py-4">
        {children}
      </div>
    </div>
  );
}

/* ─── Stat Chip ─── */
function StatChip({ label, value, subValue, color }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">{label}</span>
      <span className="text-[11px] font-bold tabular-nums font-mono" style={{ color }}>{value}</span>
      {subValue !== undefined && (
        <span className="text-[9px] text-zinc-600 font-mono tabular-nums">({subValue})</span>
      )}
    </div>
  );
}

function TrendCharts({ history = [] }) {
  /* ─── Population: Area chart per state ─── */
  const populationData = useMemo(() => {
    if (history.length === 0) return null;
    const step = Math.max(1, Math.floor(history.length / 80));
    const sampled = history.filter((_, i) => i % step === 0 || i === history.length - 1);
    const labels = sampled.map(h => `C${h.cycle}`);
    const stateIds = history[0]?.states?.map(s => s.id) || [];
    return {
      labels,
      datasets: stateIds.map(id => {
        const sc = STATE_COLORS[id] || { border: '#888', bg: 'rgba(136,136,136,0.12)' };
        return {
          label: history[0].states.find(s => s.id === id)?.name || id,
          data: sampled.map(h => {
            const state = h.states.find(s => s.id === id);
            return state ? state.population : 0;
          }),
          borderColor: sc.border,
          backgroundColor: sc.bg,
          fill: true,
          borderWidth: 1.8,
          pointRadius: 0,
          pointHoverRadius: 4,
        };
      })
    };
  }, [history]);

  /* ─── Population summary stats ─── */
  const popStats = useMemo(() => {
    if (history.length === 0) return null;
    const latest = history[history.length - 1];
    const alive = (latest.states || []).filter(s => s.alive !== false);
    const total = alive.reduce((s, st) => s + (st.population || 0), 0);
    const max = alive.reduce((best, st) => (st.population || 0) > (best.population || 0) ? st : best, alive[0]);
    const min = alive.reduce((worst, st) => (st.population || 0) < (worst.population || 0) ? st : worst, alive[0]);
    const avg = alive.length ? Math.round(total / alive.length) : 0;
    return { total, avg, max, min };
  }, [history]);

  /* ─── Happiness: Horizontal bar ─── */
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
          if (h >= 70) return 'rgba(52, 211, 153, 0.35)';
          if (h >= 40) return 'rgba(251, 191, 36, 0.35)';
          return 'rgba(248, 113, 113, 0.35)';
        }),
        borderColor: sorted.map(s => {
          const h = s.happiness || 0;
          if (h >= 70) return 'rgba(52, 211, 153, 0.8)';
          if (h >= 40) return 'rgba(251, 191, 36, 0.8)';
          return 'rgba(248, 113, 113, 0.8)';
        }),
        borderWidth: 1,
        borderRadius: 8,
        barThickness: 18,
      }]
    };
  }, [history]);

  /* ─── Avg Resources: Smooth gradient area ─── */
  const resourceData = useMemo(() => {
    if (history.length === 0) return null;
    const step = Math.max(1, Math.floor(history.length / 80));
    const sampled = history.filter((_, i) => i % step === 0 || i === history.length - 1);
    const labels = sampled.map(h => `C${h.cycle}`);
    const resources = ['water', 'food', 'energy', 'land'];
    const colors = {
      water: { border: '#67e8f9', bg: 'rgba(103, 232, 249, 0.10)' },
      food: { border: '#6ee7b7', bg: 'rgba(110, 231, 183, 0.10)' },
      energy: { border: '#fcd34d', bg: 'rgba(252, 211, 77, 0.10)' },
      land: { border: '#c4b5fd', bg: 'rgba(196, 181, 253, 0.10)' },
    };
    return {
      labels,
      datasets: resources.map(res => ({
        label: res.charAt(0).toUpperCase() + res.slice(1),
        data: sampled.map(h => {
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

  /* ─── Resource summary stats ─── */
  const resStats = useMemo(() => {
    if (history.length === 0) return null;
    const latest = history[history.length - 1];
    const alive = (latest.states || []).filter(s => s.alive !== false);
    if (alive.length === 0) return null;
    const avgs = {};
    ['water', 'food', 'energy', 'land'].forEach(r => {
      avgs[r] = Math.round(alive.reduce((s, st) => s + (st.resources?.[r] || 0), 0) / alive.length);
    });
    const overallAvg = Math.round(Object.values(avgs).reduce((a, b) => a + b, 0) / 4);
    const lowestRes = Object.entries(avgs).reduce((a, b) => a[1] < b[1] ? a : b);
    return { avgs, overallAvg, lowestRes };
  }, [history]);

  /* ─── Strategy evolution: stacked area ─── */
  const strategyData = useMemo(() => {
    if (history.length < 5) return null;
    const ACTIONS = ['HARVEST', 'CONSERVE', 'TRADE', 'EXPAND', 'DEFEND', 'INNOVATE'];
    const ACTION_COLORS = {
      HARVEST: { border: 'rgba(74,222,128,0.9)', bg: 'rgba(74,222,128,0.25)' },
      CONSERVE: { border: 'rgba(96,165,250,0.9)', bg: 'rgba(96,165,250,0.25)' },
      TRADE: { border: 'rgba(251,191,36,0.9)', bg: 'rgba(251,191,36,0.25)' },
      EXPAND: { border: 'rgba(251,113,133,0.9)', bg: 'rgba(251,113,133,0.25)' },
      DEFEND: { border: 'rgba(167,139,250,0.9)', bg: 'rgba(167,139,250,0.25)' },
      INNOVATE: { border: 'rgba(192,132,252,0.9)', bg: 'rgba(192,132,252,0.25)' },
    };
    const step = Math.max(1, Math.floor(history.length / 60));
    const sampled = history.filter((_, i) => i % step === 0 || i === history.length - 1);
    const labels = sampled.map(h => `C${h.cycle}`);

    return {
      labels,
      datasets: ACTIONS.map(action => ({
        label: action.charAt(0) + action.slice(1).toLowerCase(),
        data: sampled.map(h => {
          const alive = (h.states || []).filter(s => s.alive !== false);
          if (alive.length === 0) return 0;
          let count = 0;
          alive.forEach(s => {
            if (s.strategy) {
              const top = Object.entries(s.strategy).reduce((a, b) => a[1] > b[1] ? a : b, ['', -1]);
              if (top[0] === action) count++;
            }
          });
          return Math.round((count / alive.length) * 100);
        }),
        borderColor: ACTION_COLORS[action].border,
        backgroundColor: ACTION_COLORS[action].bg,
        fill: true,
        borderWidth: 1.5,
        pointRadius: 0,
      })),
    };
  }, [history]);

  const stackedOptions = useMemo(() => ({
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      tooltip: {
        ...baseOptions.plugins.tooltip,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`,
        },
      },
    },
    scales: {
      ...baseOptions.scales,
      y: {
        ...baseOptions.scales.y,
        stacked: true,
        max: 100,
        ticks: { ...baseOptions.scales.y.ticks, callback: v => v + '%' },
      },
      x: { ...baseOptions.scales.x, stacked: true },
    },
  }), []);

  const happinessBarOptions = useMemo(() => ({
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...baseOptions.plugins.tooltip,
        callbacks: {
          label: (ctx) => ` Happiness: ${ctx.parsed.x}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.02)', drawBorder: false },
        border: { display: false },
        ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 9 }, callback: v => v + '%' },
        min: 0,
        max: 100,
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10, family: "'Inter', system-ui", weight: '500' }, padding: 4 },
      },
    },
  }), []);

  const resourceChartOptions = useMemo(() => ({
    ...baseOptions,
    scales: {
      ...baseOptions.scales,
      y: { ...baseOptions.scales.y, max: 100, ticks: { ...baseOptions.scales.y.ticks, callback: v => v } },
    },
  }), []);

  /* ─── Empty state ─── */
  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500 font-medium">No trend data yet</p>
          <p className="text-[11px] text-zinc-600 mt-1">Start the simulation to see charts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ═══ Population Chart ═══ */}
      <ChartSection
        title="Population Trends"
        subtitle="per-state population over time"
        accentColor="#a78bfa"
        badge="Live"
      >
        {/* Mini stat chips */}
        {popStats && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <StatChip label="Total" value={popStats.total >= 1000 ? `${(popStats.total / 1000).toFixed(1)}K` : popStats.total} color="#a78bfa" />
            <StatChip label="Avg" value={popStats.avg} color="#818cf8" />
            <StatChip label="Top" value={popStats.max?.name} subValue={popStats.max?.population} color="#4ade80" />
            <StatChip label="Lowest" value={popStats.min?.name} subValue={popStats.min?.population} color="#fb7185" />
          </div>
        )}
        <div className="h-52">
          {populationData && <Line data={populationData} options={baseOptions} />}
        </div>
      </ChartSection>

      {/* ═══ Happiness Chart ═══ */}
      <ChartSection
        title="Happiness Index"
        subtitle="current state of well-being"
        accentColor="#34d399"
        badge="Snapshot"
      >
        <div className="h-56">
          {happinessBarData && <Bar data={happinessBarData} options={happinessBarOptions} />}
        </div>
      </ChartSection>

      {/* ═══ Avg Resources Chart ═══ */}
      <ChartSection
        title="Average Resources"
        subtitle="mean resource levels across alive states"
        accentColor="#22d3ee"
        badge="Trend"
      >
        {/* Resource stat chips */}
        {resStats && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <StatChip label="Overall" value={`${resStats.overallAvg}%`} color="#22d3ee" />
            <StatChip label="Water" value={`${resStats.avgs.water}`} color="#67e8f9" />
            <StatChip label="Food" value={`${resStats.avgs.food}`} color="#6ee7b7" />
            <StatChip label="Energy" value={`${resStats.avgs.energy}`} color="#fcd34d" />
            <StatChip label="Land" value={`${resStats.avgs.land}`} color="#c4b5fd" />
            <span className="text-[9px] text-zinc-600 ml-1">
              ⚠ Lowest: <span className="text-amber-400 font-semibold capitalize">{resStats.lowestRes[0]}</span>
            </span>
          </div>
        )}
        <div className="h-52">
          {resourceData && <Line data={resourceData} options={resourceChartOptions} />}
        </div>
      </ChartSection>

      {/* ═══ Strategy Evolution Chart ═══ */}
      {strategyData && (
        <ChartSection
          title="Strategy Evolution"
          subtitle="dominant action distribution over time"
          accentColor="#c084fc"
          badge="Stacked"
        >
          <div className="h-52">
            <Line data={strategyData} options={stackedOptions} />
          </div>
        </ChartSection>
      )}
    </div>
  );
}

export default TrendCharts;
