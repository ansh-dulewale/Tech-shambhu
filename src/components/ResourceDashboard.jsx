import React, { useState } from 'react';

const RESOURCE_CONFIG = {
  water: { color: '#67e8f9', glow: 'rgba(103,232,249,0.3)', icon: '💧', label: 'Water' },
  food:  { color: '#6ee7b7', glow: 'rgba(110,231,183,0.3)', icon: '🌾', label: 'Food' },
  energy:{ color: '#fcd34d', glow: 'rgba(252,211,77,0.3)',  icon: '⚡', label: 'Energy' },
  land:  { color: '#c4b5fd', glow: 'rgba(196,181,253,0.3)', icon: '🏔️', label: 'Land' },
};

function getStatusInfo(avg) {
  if (avg > 60) return { label: 'Healthy', color: '#34d399', bg: 'from-emerald-500/8 to-emerald-900/5', border: 'border-emerald-500/20' };
  if (avg > 40) return { label: 'At Risk', color: '#fbbf24', bg: 'from-amber-500/8 to-amber-900/5', border: 'border-amber-500/20' };
  if (avg > 20) return { label: 'Critical', color: '#fb923c', bg: 'from-orange-500/8 to-orange-900/5', border: 'border-orange-500/20' };
  return { label: 'Danger', color: '#f87171', bg: 'from-red-500/8 to-red-900/5', border: 'border-red-500/20' };
}

/* ─── Circular progress ring for overall health ─── */
function HealthRing({ value, color, size = 44 }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold font-mono tabular-nums" style={{ color }}>
          {Math.round(value)}
        </span>
      </div>
    </div>
  );
}

/* ─── Resource bar with gradient fill ─── */
function ResourceBar({ value, resourceKey }) {
  const config = RESOURCE_CONFIG[resourceKey];
  const isLow = value <= 20;
  const isCritical = value <= 10;
  const barColor = isLow ? '#ff1744' : config.color;
  const barGlow = isLow ? 'rgba(255,23,68,0.4)' : config.glow;

  return (
    <div className="group flex items-center gap-3">
      {/* Icon + label */}
      <div className="flex items-center gap-1.5 w-16">
        <span className="text-[10px]">{config.icon}</span>
        <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{config.label}</span>
      </div>

      {/* Bar track */}
      <div className="flex-1 h-2 bg-white/[0.03] rounded-full overflow-hidden relative">
        {value > 0 ? (
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${isCritical ? 'animate-pulse' : ''}`}
            style={{
              width: `${Math.max(value, 3)}%`,
              background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
              boxShadow: `0 0 8px ${barGlow}`,
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-[7px] text-red-500/50 font-bold uppercase tracking-widest">depleted</span>
          </div>
        )}
      </div>

      {/* Value */}
      <span
        className="text-[11px] w-8 text-right font-bold tabular-nums font-mono transition-colors"
        style={{ color: barColor }}
      >
        {Math.round(value)}
      </span>
    </div>
  );
}

/* ─── State Card ─── */
function StateCard({ state, isExpanded, onToggle }) {
  const avg = (state.resources.water + state.resources.food + state.resources.energy + state.resources.land) / 4;
  const status = getStatusInfo(avg);

  if (!state.alive) {
    return (
      <div className="rounded-xl bg-white/[0.01] border border-zinc-800/40 p-3.5 opacity-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-zinc-600" />
            <span className="text-sm font-semibold text-zinc-600 line-through">{state.name}</span>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-red-500/10 text-red-400/60 font-bold uppercase tracking-wider border border-red-500/10">
            Collapsed
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${status.bg} border ${status.border} overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/20 cursor-pointer`}
      onClick={onToggle}
    >
      {/* Top row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Health ring */}
        <HealthRing value={avg} color={status.color} />

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-white tracking-tight">{state.name}</span>
            <span
              className="text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider"
              style={{ background: status.color + '18', color: status.color, border: `1px solid ${status.color}25` }}
            >
              {status.label}
            </span>
          </div>
          {state.action && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1 h-1 rounded-full bg-violet-400/50" />
              <span className="text-[9px] text-violet-300/70 font-semibold uppercase tracking-wider">{state.action}</span>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-3 text-[10px]">
          <div className="text-center">
            <div className="text-zinc-500 uppercase tracking-wider text-[8px] mb-0.5">Pop</div>
            <div className="text-white font-bold font-mono tabular-nums">{state.population}</div>
          </div>
          <div className="w-px h-6 bg-white/[0.06]" />
          <div className="text-center">
            <div className="text-zinc-500 uppercase tracking-wider text-[8px] mb-0.5">Happy</div>
            <div className="font-bold font-mono tabular-nums" style={{ color: state.happiness >= 50 ? '#34d399' : state.happiness >= 30 ? '#fbbf24' : '#f87171' }}>
              {state.happiness}%
            </div>
          </div>
          <div className="w-px h-6 bg-white/[0.06]" />
          <div className="text-center">
            <div className="text-zinc-500 uppercase tracking-wider text-[8px] mb-0.5">GDP</div>
            <div className="text-cyan-400 font-bold font-mono tabular-nums">{state.gdp}</div>
          </div>
        </div>

        {/* Expand arrow */}
        <svg
          className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded: Resource bars */}
      {isExpanded && (
        <div className="px-4 pb-3.5 pt-1 space-y-2 border-t border-white/[0.04]">
          {Object.keys(RESOURCE_CONFIG).map(key => (
            <ResourceBar key={key} value={state.resources[key]} resourceKey={key} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Global Summary Strip ─── */
function GlobalSummary({ states }) {
  const alive = states.filter(s => s.alive !== false);
  const totalPop = alive.reduce((s, st) => s + (st.population || 0), 0);
  const avgHappy = alive.length ? Math.round(alive.reduce((s, st) => s + (st.happiness || 0), 0) / alive.length) : 0;
  const totalGdp = alive.reduce((s, st) => s + (st.gdp || 0), 0);
  const avgRes = alive.length ? Math.round(
    alive.reduce((s, st) => s + (st.resources.water + st.resources.food + st.resources.energy + st.resources.land) / 4, 0) / alive.length
  ) : 0;

  const items = [
    { label: 'Alive', value: `${alive.length}/8`, color: '#34d399' },
    { label: 'Population', value: totalPop >= 1000 ? `${(totalPop / 1000).toFixed(1)}K` : totalPop, color: '#60a5fa' },
    { label: 'Happiness', value: `${avgHappy}%`, color: avgHappy >= 50 ? '#34d399' : '#fbbf24' },
    { label: 'GDP', value: totalGdp >= 1000 ? `${(totalGdp / 1000).toFixed(1)}K` : totalGdp, color: '#22d3ee' },
    { label: 'Resources', value: `${avgRes}%`, color: avgRes > 50 ? '#34d399' : avgRes > 30 ? '#fbbf24' : '#f87171' },
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-[8px] text-zinc-600 uppercase tracking-wider font-medium">{item.label}</span>
          <span className="text-[11px] font-bold tabular-nums font-mono" style={{ color: item.color }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Dashboard ─── */
function ResourceDashboard({ states = [] }) {
  const [expandedStates, setExpandedStates] = useState(new Set());

  const toggleState = (id) => {
    setExpandedStates(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const aliveIds = states.filter(s => s.alive !== false).map(s => s.id);
    if (expandedStates.size === aliveIds.length) {
      setExpandedStates(new Set());
    } else {
      setExpandedStates(new Set(aliveIds));
    }
  };

  const sorted = [...states].sort((a, b) => {
    if (a.alive !== false && b.alive === false) return -1;
    if (a.alive === false && b.alive !== false) return 1;
    const avgA = (a.resources.water + a.resources.food + a.resources.energy + a.resources.land) / 4;
    const avgB = (b.resources.water + b.resources.food + b.resources.energy + b.resources.land) / 4;
    return avgB - avgA;
  });

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-2xl bg-[#0d0b1a]/60 border border-white/[0.04] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-fuchsia-400 to-violet-500" />
            <div>
              <h2 className="text-[13px] font-semibold text-white/90 tracking-tight">Resource Overview</h2>
              <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-wider">all states status & resources</p>
            </div>
          </div>
          <button
            onClick={expandAll}
            className="text-[9px] px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all font-medium uppercase tracking-wider"
          >
            {expandedStates.size > 0 ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* Global summary */}
        <div className="px-5 py-3">
          <GlobalSummary states={states} />
        </div>
      </div>

      {/* State cards */}
      <div className="space-y-2">
        {sorted.map(state => (
          <StateCard
            key={state.id}
            state={state}
            isExpanded={expandedStates.has(state.id)}
            onToggle={() => toggleState(state.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default ResourceDashboard;
