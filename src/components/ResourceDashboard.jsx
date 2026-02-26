import React from 'react';

const RESOURCE_CONFIG = {
  water:  { color: '#00d4ff', label: 'Water' },
  food:   { color: '#00e676', label: 'Food' },
  energy: { color: '#ffab00', label: 'Energy' },
  land:   { color: '#8d6e63', label: 'Land' },
};

function ResourceBar({ value, color, label }) {
  const isLow = value <= 20;
  const isCritical = value <= 10;

  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-[10px] text-gray-500 w-10 text-right uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-800/80 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${isCritical ? 'animate-pulse' : ''}`}
          style={{
            width: `${Math.max(value, 2)}%`,
            backgroundColor: isLow ? '#ff1744' : color,
            boxShadow: isLow ? '0 0 8px rgba(255,23,68,0.4)' : 'none'
          }}
        />
      </div>
      <span
        className="text-[10px] w-6 text-right font-semibold tabular-nums"
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

  return (
    <div className={`p-3 rounded-xl bg-white/[0.02] border ${borderColor} transition-all duration-300 hover:bg-white/[0.05] ${!state.alive ? 'opacity-30' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{state.name}</span>
          {state.action && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 font-medium uppercase tracking-wider">
              {state.action}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span>Pop {state.population}</span>
          <span>{state.happiness}%</span>
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
        <div className="text-center text-[10px] text-red-400/80 mt-1 font-semibold uppercase tracking-wider">Collapsed</div>
      )}
    </div>
  );
}

function ResourceDashboard({ states = [] }) {
  const aliveStates = states.filter(s => s.alive);
  const collapsedStates = states.filter(s => !s.alive);

  return (
    <div className="glass-card p-4 overflow-y-auto max-h-[480px]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Resource Overview</h2>
        <span className="text-[10px] text-gray-500 tabular-nums">{aliveStates.length}/8 active</span>
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
