import React from 'react';

const RESOURCE_ICONS = { water: '💧', food: '🌾', energy: '⚡', land: '🏔️' };

function getTrustColor(trust) {
  if (trust >= 7) return 'text-emerald-400';
  if (trust >= 4) return 'text-amber-400';
  return 'text-red-400';
}

function getTrustLabel(trust) {
  if (trust >= 7) return 'Alliance';
  if (trust >= 4) return 'Partner';
  return 'New';
}

function TradeNetwork({ trades = [], alliances = [] }) {
  // Combine current trades and alliances
  const allianceKeys = new Set(
    alliances.map(a => a.states?.sort().join('_')).filter(Boolean)
  );

  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
        🤝 <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Trade Network</span>
      </h2>

      {trades.length === 0 && alliances.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-4">
          No active trades yet...
        </div>
      )}

      {/* Active Trades */}
      <div className="space-y-1.5">
        {trades.map((trade, idx) => {
          const tradeKey = [trade.from, trade.to].sort().join('_');
          const isAlliance = allianceKeys.has(tradeKey);

          return (
            <div
              key={idx}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isAlliance
                  ? 'bg-yellow-500/10 border border-yellow-500/20'
                  : 'bg-white/[0.03] border border-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                {/* From */}
                <span className="text-xs font-semibold text-white w-20 truncate">
                  {trade.from?.charAt(0).toUpperCase() + trade.from?.slice(1)}
                </span>

                {/* Arrow with resources */}
                <div className="flex-1 flex items-center justify-center gap-1">
                  <span className="text-[10px] text-gray-400">
                    {RESOURCE_ICONS[trade.gave?.resource]} {trade.gave?.amount}
                  </span>
                  <span className="text-gray-600">⇄</span>
                  <span className="text-[10px] text-gray-400">
                    {RESOURCE_ICONS[trade.got?.resource]} {trade.got?.amount}
                  </span>
                </div>

                {/* To */}
                <span className="text-xs font-semibold text-white w-20 truncate text-right">
                  {trade.to?.charAt(0).toUpperCase() + trade.to?.slice(1)}
                </span>
              </div>

              {/* Trust bar */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-gray-500">Trust</span>
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(trade.trust || 0) * 10}%`,
                      backgroundColor: (trade.trust || 0) >= 7 ? '#00c853' :
                        (trade.trust || 0) >= 4 ? '#ffab00' : '#ff1744'
                    }}
                  />
                </div>
                <span className={`text-[9px] font-bold ${getTrustColor(trade.trust || 0)}`}>
                  {trade.trust || 0}/10
                </span>
                <span className={`text-[8px] px-1 py-0.5 rounded ${
                  isAlliance ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-gray-500'
                }`}>
                  {isAlliance ? '⭐ Alliance' : getTrustLabel(trade.trust || 0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      {(trades.length > 0 || alliances.length > 0) && (
        <div className="flex justify-around mt-3 pt-3 border-t border-white/5 text-center">
          <div>
            <div className="text-sm font-bold text-white">{trades.length}</div>
            <div className="text-[10px] text-gray-500">Trades</div>
          </div>
          <div>
            <div className="text-sm font-bold text-yellow-400">{alliances.length}</div>
            <div className="text-[10px] text-gray-500">Alliances</div>
          </div>
          <div>
            <div className="text-sm font-bold text-purple-400">
              {trades.length > 0 ? Math.round(trades.reduce((sum, t) => sum + (t.trust || 0), 0) / trades.length * 10) / 10 : 0}
            </div>
            <div className="text-[10px] text-gray-500">Avg Trust</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TradeNetwork;
