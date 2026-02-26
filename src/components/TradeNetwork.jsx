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
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Trade Network</h2>
      </div>

      {trades.length === 0 && alliances.length === 0 && (
        <div className="text-center text-xs text-gray-600 py-4">
          No active trades yet.
        </div>
      )}

      <div className="space-y-1.5">
        {trades.map((trade, idx) => {
          const tradeKey = [trade.from, trade.to].sort().join('_');
          const isAlliance = allianceKeys.has(tradeKey);

          return (
            <div
              key={idx}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isAlliance
                  ? 'bg-amber-500/8 border border-amber-500/15'
                  : 'bg-white/[0.02] border border-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-white w-20 truncate capitalize">
                  {trade.from}
                </span>
                <div className="flex-1 flex items-center justify-center gap-1.5">
                  <span className="text-[9px] text-gray-400 font-mono">
                    {RESOURCE_LABELS[trade.gave?.resource]} {trade.gave?.amount}
                  </span>
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  <span className="text-[9px] text-gray-400 font-mono">
                    {RESOURCE_LABELS[trade.got?.resource]} {trade.got?.amount}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-white w-20 truncate text-right capitalize">
                  {trade.to}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] text-gray-600 uppercase tracking-wider">Trust</span>
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
                <span className={`text-[9px] font-semibold tabular-nums ${getTrustColor(trade.trust || 0)}`}>
                  {trade.trust || 0}/10
                </span>
                <span className={`text-[8px] px-1 py-0.5 rounded font-medium ${
                  isAlliance ? 'bg-amber-500/15 text-amber-400' : 'bg-white/5 text-gray-500'
                }`}>
                  {isAlliance ? 'Alliance' : getTrustLabel(trade.trust || 0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {(trades.length > 0 || alliances.length > 0) && (
        <div className="flex justify-around mt-3 pt-3 border-t border-white/5 text-center">
          <div>
            <div className="text-sm font-semibold text-white tabular-nums">{trades.length}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Trades</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-amber-400 tabular-nums">{alliances.length}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Alliances</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-purple-400 tabular-nums">
              {trades.length > 0 ? Math.round(trades.reduce((sum, t) => sum + (t.trust || 0), 0) / trades.length * 10) / 10 : 0}
            </div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Avg Trust</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TradeNetwork;
