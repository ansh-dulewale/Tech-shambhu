import React from 'react';

const RESOURCE_LABELS = { water: 'W', food: 'F', energy: 'E', land: 'L' };

function getTrustColor(trust) {
  if (trust >= 7) return 'text-emerald-400';
  if (trust >= 4) return 'text-amber-400';
  return 'text-gray-400';
}

function getTrustLabel(trust) {
  if (trust >= 7) return 'Alliance';
  if (trust >= 4) return 'Partner';
  return 'New';
}

function TradeNetwork({ trades = [], alliances = [] }) {
  const allianceKeys = new Set(
    alliances.map(a => a.states?.sort().join('_')).filter(Boolean)
  );

  return (
    <div>
      {trades.length === 0 && alliances.length === 0 && (
        <div className="text-center text-xs text-gray-600 py-8">
          <div className="text-2xl mb-2 opacity-40">🤝</div>
          No active trades yet. Start the simulation.
        </div>
      )}

      <div className="space-y-1.5">
        {trades.map((trade, idx) => {
          const tradeKey = [trade.from, trade.to].sort().join('_');
          const isAlliance = allianceKeys.has(tradeKey);

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-[1.01] card-entrance ${isAlliance
                  ? 'bg-gradient-to-r from-amber-500/8 to-amber-500/5 border border-amber-500/20'
                  : 'bg-white/[0.02] border border-white/5 hover:border-white/10'
                }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white w-24 truncate capitalize">
                  {trade.from}
                </span>
                <div className="flex-1 flex items-center justify-center gap-1.5">
                  <span className="text-[11px] text-gray-400 font-mono">
                    {RESOURCE_LABELS[trade.gave?.resource]} {trade.gave?.amount}
                  </span>
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {RESOURCE_LABELS[trade.got?.resource]} {trade.got?.amount}
                  </span>
                </div>
                <span className="text-xs font-medium text-white w-24 truncate text-right capitalize">
                  {trade.to}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-600 uppercase tracking-wider">Trust</span>
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(trade.trust || 0) * 10}%`,
                      backgroundColor: (trade.trust || 0) >= 7 ? '#00c853' :
                        (trade.trust || 0) >= 4 ? '#ffab00' : '#616161'
                    }}
                  />
                </div>
                <span className={`text-[11px] font-semibold tabular-nums ${getTrustColor(trade.trust || 0)}`}>
                  {trade.trust || 0}/10
                </span>
                <span className={`text-[10px] px-1 py-0.5 rounded font-medium ${isAlliance ? 'bg-amber-500/15 text-amber-400' : 'bg-white/5 text-gray-500'
                  }`}>
                  {isAlliance ? 'Alliance' : getTrustLabel(trade.trust || 0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {(trades.length > 0 || alliances.length > 0) && (
        <div className="flex justify-around mt-4 pt-3 border-t border-white/5 text-center">
          <div className="group">
            <div className="text-base font-bold text-white tabular-nums font-mono">{trades.length}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider group-hover:text-gray-400 transition-colors">Trades</div>
          </div>
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="group">
            <div className="text-base font-bold text-amber-400 tabular-nums font-mono">{alliances.length}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider group-hover:text-gray-400 transition-colors">Alliances</div>
          </div>
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="group">
            <div className="text-base font-bold text-purple-400 tabular-nums font-mono">
              {trades.length > 0 ? Math.round(trades.reduce((sum, t) => sum + (t.trust || 0), 0) / trades.length * 10) / 10 : 0}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider group-hover:text-gray-400 transition-colors">Avg Trust</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TradeNetwork;
