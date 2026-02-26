import React from 'react';

const RESOURCE_CONFIG = {
  water: { color: '#67e8f9', label: 'Water' },
  food: { color: '#6ee7b7', label: 'Food' },
  energy: { color: '#fcd34d', label: 'Energy' },
  land: { color: '#c4b5fd', label: 'Land' },
};

function ResourceBar({ value, color, label }) {
  const isLow = value <= 20;
  const isCritical = value <= 10;

  return (
    <div className="flex items-center gap-2.5 mb-1.5">
      <span className="text-[10px] text-gray-500 w-12 text-right uppercase tracking-wider font-medium">{label}</span>
      <div className="flex-1 h-[7px] bg-gray-800/80 rounded-full overflow-hidden relative">
        {value > 0 ? (
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out animate-bar-fill ${isCritical ? 'animate-pulse' : ''}`}
            style={{
              width: `${Math.max(value, 4)}%`,
              background: isLow ? 'linear-gradient(90deg, #ff1744, #ff5252)' : `linear-gradient(90deg, ${color}dd, ${color})`,
              boxShadow: isLow ? '0 0 10px rgba(255,23,68,0.5)' : `0 0 8px ${color}30`
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-[7px] text-red-500/60 font-bold uppercase tracking-wider">depleted</span>
          </div>
        )}
      </div>
      <span
        className="text-[11px] w-7 text-right font-bold tabular-nums font-mono"
        style={{ color: isLow ? '#ff1744' : color }}
      >
        {Math.round(value)}
      </span>
    </div>
  );
}

function StateCard({ state }) {
  const avg = (state.resources.water + state.resources.food + state.resources.energy + state.resources.land) / 4;
  const borderColor = !state.alive ? 'border-gray-700/30' :
    avg > 60 ? 'border-emerald-500/20' :
      avg > 40 ? 'border-amber-500/20' :
        avg > 20 ? 'border-orange-500/20' : 'border-red-500/20';
  const glowColor = !state.alive ? '' :
    avg > 60 ? 'hover:shadow-emerald-500/5' :
      avg > 40 ? 'hover:shadow-amber-500/5' :
        avg > 20 ? 'hover:shadow-orange-500/5' : 'hover:shadow-red-500/5';

  return (
    <div className={`card-entrance p-3.5 rounded-2xl bg-white/[0.02] border ${borderColor} transition-all duration-300 hover:bg-white/[0.05] hover:shadow-lg ${glowColor} hover:-translate-y-px ${!state.alive ? 'opacity-30 grayscale' : ''}`}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${avg > 60 ? 'bg-emerald-400' : avg > 40 ? 'bg-amber-400' : avg > 20 ? 'bg-orange-400' : 'bg-red-400'} ${state.alive ? 'shadow-sm' : ''}`}
               style={state.alive ? { boxShadow: `0 0 6px ${avg > 60 ? 'rgba(52,211,153,0.4)' : avg > 40 ? 'rgba(251,191,36,0.4)' : avg > 20 ? 'rgba(251,146,60,0.4)' : 'rgba(248,113,113,0.4)'}` } : {}} />
          <span className="text-sm font-bold text-white tracking-tight">{state.name}</span>
          {state.action && (
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 text-violet-300 font-semibold uppercase tracking-wider border border-violet-500/10">
              {state.action}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">👥 {state.population}</span>
          <span className="flex items-center gap-1">😊 {state.happiness}%</span>
        </div>
      </div>
      {Object.entries(RESOURCE_CONFIG).map(([key, config]) => (
        <ResourceBar
          key={key}
          value={state.resources[key]}
          color={config.color}
          label={config.label}
        />
      ))}
      {!state.alive && (
        <div className="text-center text-xs text-red-400/80 mt-2 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
          <span className="w-4 h-px bg-red-500/30" /> Collapsed <span className="w-4 h-px bg-red-500/30" />
        </div>
      )}
    </div>
  );
}

function ResourceDashboard({ states = [] }) {
  const aliveStates = states.filter(s => s.alive);
  const collapsedStates = states.filter(s => !s.alive);

  return (
    <div className="glass-card p-5 overflow-y-auto max-h-[520px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-display">
          <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-fuchsia-400 to-violet-400 inline-block" />
          Resource Overview
        </h2>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-gray-400 font-mono tabular-nums font-medium">{aliveStates.length}/8 active</span>
        </div>
      </div>
      <div className="space-y-2">
        {aliveStates
          .sort((a, b) => {
            const avgA = (a.resources.water + a.resources.food + a.resources.energy + a.resources.land) / 4;
            const avgB = (b.resources.water + b.resources.food + b.resources.energy + b.resources.land) / 4;
            return avgB - avgA;
          })
          .map(state => <StateCard key={state.id} state={state} />)
        }
        {collapsedStates.map(state => <StateCard key={state.id} state={state} />)}
      </div>
    </div>
  );
}

export default ResourceDashboard;
