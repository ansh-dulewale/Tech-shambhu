import React from 'react';

const RESOURCE_CONFIG = {
  water:  { color: '#67e8f9', label: 'Water' },
  food:   { color: '#6ee7b7', label: 'Food' },
  energy: { color: '#fcd34d', label: 'Energy' },
  land:   { color: '#c4b5fd', label: 'Land' },
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
         onClick={onClose}>
      <div className="glass-card-glow p-7 w-[440px] max-w-[95vw] max-h-[90vh] overflow-y-auto animate-scale-in"
           onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-white font-display tracking-tight">{state.name}</h2>
            <p className="text-xs text-violet-300/50 mt-0.5">{state.title}</p>
          </div>
          <span className={`text-[10px] font-bold ${healthStatus.color} px-3 py-1.5 rounded-xl border ${healthStatus.color.replace('text', 'border')}/20 uppercase tracking-widest`}
                style={{ textShadow: '0 0 10px currentColor' }}>
            {healthStatus.label}
          </span>
        </div>

        {/* Resources */}
        <div className="mb-6">
          <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 font-semibold flex items-center gap-2">
            <span className="w-3 h-px bg-gradient-to-r from-violet-500 to-transparent" />
            Resources
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {Object.entries(RESOURCE_CONFIG).map(([key, config]) => {
              const value = Math.round(state.resources[key]);
              const isLow = value <= 20;
              return (
                <div key={key} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all hover:border-white/10">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{config.label}</span>
                    <span className="text-base font-black tabular-nums font-mono" style={{ color: isLow ? '#ff1744' : config.color }}>
                      {value}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800/80 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 animate-bar-fill"
                      style={{
                        width: `${Math.max(value, 2)}%`,
                        background: isLow ? 'linear-gradient(90deg, #ff1744, #ff5252)' : `linear-gradient(90deg, ${config.color}dd, ${config.color})`,
                        boxShadow: `0 0 8px ${isLow ? 'rgba(255,23,68,0.4)' : config.color + '30'}`
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
                        className="h-full rounded-full bg-violet-500/50 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-violet-400 w-7 text-right font-semibold tabular-nums">{Math.round(pct)}%</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Current Action */}
        {state.action && (
          <div className="mb-5 p-3 rounded-lg bg-violet-500/8 border border-violet-500/15">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Current Action </span>
            <span className="text-sm font-semibold text-violet-300 uppercase">{state.action}</span>
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
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-white/5 to-white/[0.03] border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer font-semibold"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default StateDetail;
