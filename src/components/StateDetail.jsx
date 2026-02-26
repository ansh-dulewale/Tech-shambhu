import React from 'react';

const RESOURCE_CONFIG = {
  water:  { color: '#00d4ff', label: 'Water' },
  food:   { color: '#00e676', label: 'Food' },
  energy: { color: '#ffab00', label: 'Energy' },
  land:   { color: '#8d6e63', label: 'Land' },
};

function StateDetail({ state, onClose }) {
  if (!state) return null;

  const avg = (state.resources.water + state.resources.food + state.resources.energy + state.resources.land) / 4;
  const healthStatus = !state.alive ? { label: 'COLLAPSED', color: 'text-gray-400' } :
    avg > 60 ? { label: 'HEALTHY', color: 'text-emerald-400' } :
    avg > 40 ? { label: 'AT RISK', color: 'text-amber-400' } :
    avg > 20 ? { label: 'CRITICAL', color: 'text-orange-400' } :
    { label: 'DANGER', color: 'text-red-400' };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
         onClick={onClose}>
      <div className="glass-card p-6 w-[420px] max-w-[95vw] max-h-[90vh] overflow-y-auto border-white/10"
           onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">{state.name}</h2>
            <p className="text-xs text-gray-500">{state.title}</p>
          </div>
          <span className={`text-[10px] font-semibold ${healthStatus.color} px-2 py-1 rounded-md border ${healthStatus.color.replace('text', 'border')}/20 uppercase tracking-wider`}>
            {healthStatus.label}
          </span>
        </div>

        {/* Resources */}
        <div className="mb-5">
          <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-medium">Resources</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(RESOURCE_CONFIG).map(([key, config]) => {
              const value = Math.round(state.resources[key]);
              const isLow = value <= 20;
              return (
                <div key={key} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{config.label}</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: isLow ? '#ff1744' : config.color }}>
                      {value}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(value, 2)}%`,
                        backgroundColor: isLow ? '#ff1744' : config.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="text-center p-2.5 rounded-lg bg-white/[0.03]">
            <div className="text-sm font-bold text-white tabular-nums">{state.population}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">Population</div>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-white/[0.03]">
            <div className="text-sm font-bold text-white tabular-nums">{state.happiness}%</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">Happiness</div>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-white/[0.03]">
            <div className="text-sm font-bold text-white tabular-nums">{state.gdp}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">GDP</div>
          </div>
        </div>

        {/* Strategy Breakdown */}
        {state.strategy && (
          <div className="mb-5">
            <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-medium">AI Strategy (Learned)</h3>
            <div className="space-y-1">
              {Object.entries(state.strategy)
                .sort(([, a], [, b]) => b - a)
                .map(([action, pct]) => (
                  <div key={action} className="flex items-center gap-2">
                    <span className="text-[10px] w-16 text-gray-400 uppercase tracking-wider">
                      {action}
                    </span>
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500/50 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-purple-400 w-7 text-right font-semibold tabular-nums">{Math.round(pct)}%</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Current Action */}
        {state.action && (
          <div className="mb-5 p-3 rounded-lg bg-purple-500/8 border border-purple-500/15">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Current Action </span>
            <span className="text-sm font-semibold text-purple-300 uppercase">{state.action}</span>
          </div>
        )}

        {/* Data Sources */}
        {state.sources && (
          <div className="mb-5">
            <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-medium">Data Sources</h3>
            <div className="text-[9px] text-gray-600 space-y-0.5">
              {Object.entries(state.sources).map(([key, src]) => (
                <div key={key}>
                  <span className="text-gray-500 uppercase">{RESOURCE_CONFIG[key]?.label}:</span> {src}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default StateDetail;
