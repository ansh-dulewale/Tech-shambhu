import React from 'react';

const RESOURCE_CONFIG = {
  water:  { icon: '💧', color: '#00d4ff', label: 'Water' },
  food:   { icon: '🌾', color: '#00e676', label: 'Food' },
  energy: { icon: '⚡', color: '#ffab00', label: 'Energy' },
  land:   { icon: '🏔️', color: '#8d6e63', label: 'Land' },
};

const ACTION_ICONS = {
  HARVEST: '🌾', CONSERVE: '🛡️', TRADE: '🤝',
  EXPAND: '📈', DEFEND: '⚔️', INNOVATE: '💡'
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">{state.name}</h2>
            <p className="text-xs text-gray-400">{state.title}</p>
          </div>
          <div className="text-right">
            <span className={`text-xs font-bold ${healthStatus.color} px-2 py-1 rounded-full border ${healthStatus.color.replace('text', 'border')}/30`}>
              {healthStatus.label}
            </span>
          </div>
        </div>

        {/* Resources */}
        <div className="mb-4">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Resources</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(RESOURCE_CONFIG).map(([key, config]) => {
              const value = Math.round(state.resources[key]);
              const isLow = value <= 20;
              return (
                <div key={key} className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{config.icon} {config.label}</span>
                    <span className="text-sm font-bold" style={{ color: isLow ? '#ff1744' : config.color }}>
                      {value}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
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
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-white/[0.03]">
            <span className="text-lg">👥</span>
            <div className="text-sm font-bold text-white">{state.population}</div>
            <div className="text-[10px] text-gray-500">Population</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/[0.03]">
            <span className="text-lg">😊</span>
            <div className="text-sm font-bold text-white">{state.happiness}%</div>
            <div className="text-[10px] text-gray-500">Happiness</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/[0.03]">
            <span className="text-lg">💰</span>
            <div className="text-sm font-bold text-white">{state.gdp}</div>
            <div className="text-[10px] text-gray-500">GDP</div>
          </div>
        </div>

        {/* Strategy Breakdown */}
        {state.strategy && (
          <div className="mb-4">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">🧠 AI Strategy (Learned)</h3>
            <div className="space-y-1">
              {Object.entries(state.strategy)
                .sort(([, a], [, b]) => b - a)
                .map(([action, pct]) => (
                  <div key={action} className="flex items-center gap-2">
                    <span className="text-xs w-16 text-gray-400">
                      {ACTION_ICONS[action] || ''} {action}
                    </span>
                    <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500/60 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-purple-400 w-8 text-right font-bold">{Math.round(pct)}%</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Current Action */}
        {state.action && (
          <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <span className="text-xs text-gray-400">Current Action: </span>
            <span className="text-sm font-bold text-purple-300">
              {ACTION_ICONS[state.action]} {state.action}
            </span>
          </div>
        )}

        {/* Data Sources */}
        {state.sources && (
          <div className="mb-4">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-1">📚 Data Sources</h3>
            <div className="text-[10px] text-gray-600 space-y-0.5">
              {Object.entries(state.sources).map(([key, src]) => (
                <div key={key}>
                  <span className="text-gray-500">{RESOURCE_CONFIG[key]?.icon} {RESOURCE_CONFIG[key]?.label}:</span> {src}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close */}
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
