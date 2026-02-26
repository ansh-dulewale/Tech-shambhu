import React from 'react';

const RESOURCE_CONFIG = {
  water:  { icon: '💧', color: '#00d4ff', label: 'Water' },
  food:   { icon: '🌾', color: '#00e676', label: 'Food' },
  energy: { icon: '⚡', color: '#ffab00', label: 'Energy' },
  land:   { icon: '🏔️', color: '#8d6e63', label: 'Land' },
};

function ResourceBar({ value, color, icon }) {
  const isLow = value <= 20;
  const isCritical = value <= 10;

  return (
    <div className="flex items-center gap-1.5 mb-0.5">
      <span className="text-[10px] w-4 text-center">{icon}</span>
      <div className="flex-1 h-3 bg-gray-800/80 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${isCritical ? 'animate-pulse' : ''}`}
          style={{
            width: `${Math.max(value, 2)}%`,
            backgroundColor: isLow ? '#ff1744' : color,
            boxShadow: isLow ? '0 0 8px rgba(255,23,68,0.5)' : 'none'
          }}
        />
      </div>
      <span
        className="text-[10px] w-6 text-right font-bold tabular-nums"
        style={{ color: isLow ? '#ff1744' : color }}
      >
        {Math.round(value)}
      </span>
    </div>
  );
}

function StateCard({ state }) {
  const avg = (state.resources.water + state.resources.food + state.resources.energy + state.resources.land) / 4;
  const borderColor = !state.alive ? 'border-gray-600' :
    avg > 60 ? 'border-emerald-500/30' :
    avg > 40 ? 'border-amber-500/30' :
    avg > 20 ? 'border-orange-500/30' : 'border-red-500/30';

  return (
    <div className={`p-3 rounded-xl bg-white/[0.03] border ${borderColor} transition-all duration-300 hover:bg-white/[0.06] ${!state.alive ? 'opacity-40' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{state.name}</span>
          {state.action && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/20">
              {state.action}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span>👥 {state.population}</span>
          <span>😊 {state.happiness}%</span>
        </div>
      </div>
      {Object.entries(RESOURCE_CONFIG).map(([key, config]) => (
        <ResourceBar
          key={key}
          value={state.resources[key]}
          color={config.color}
          icon={config.icon}
        />
      ))}
      {!state.alive && (
        <div className="text-center text-xs text-red-400 mt-1 font-bold">💀 COLLAPSED</div>
      )}
    </div>
  );
}

function ResourceDashboard({ states = [] }) {
  const aliveStates = states.filter(s => s.alive);
  const collapsedStates = states.filter(s => !s.alive);

  return (
    <div className="glass-card p-4 overflow-y-auto max-h-[480px]">
      <h2 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
        📊 <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">Resources</span>
        <span className="text-xs text-gray-500 font-normal ml-auto">{aliveStates.length}/8 alive</span>
      </h2>
      <div className="space-y-2">
        {aliveStates
          .sort((a, b) => {
            const avgA = (a.resources.water + a.resources.food + a.resources.energy + a.resources.land) / 4;
            const avgB = (b.resources.water + b.resources.food + b.resources.energy + b.resources.land) / 4;
            return avgB - avgA;
          })
          .map(state => (
            <StateCard key={state.id} state={state} />
          ))
        }
        {collapsedStates.map(state => (
          <StateCard key={state.id} state={state} />
        ))}
      </div>
    </div>
  );
}

export default ResourceDashboard;
