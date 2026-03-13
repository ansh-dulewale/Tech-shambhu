import React from 'react';

function Header({ cycle, speed, isRunning, onStart, onPause, onReset, onSpeedChange, states = [], climateStress = 0, trades = [], alliances = [] }) {
  const alive = states.filter(s => s.alive !== false).length;
  const avgHappiness = states.length
    ? Math.round(states.filter(s => s.alive !== false).reduce((s, st) => s + (st.happiness || 0), 0) / Math.max(alive, 1))
    : 0;
  const totalPop = states.reduce((s, st) => s + (st.population || 0), 0);
  const totalGdp = states.reduce((s, st) => s + (st.gdp || 0), 0);
  const tradeCount = trades.length;
  const allianceCount = alliances.length;

  const statCards = [
    { value: `${alive}/8`, label: 'States Active', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'from-emerald-500/5 to-emerald-900/10' },
    { value: totalPop >= 1000 ? `${(totalPop / 1000).toFixed(1)}K` : totalPop, label: 'Total Population', color: 'text-sky-400', border: 'border-sky-500/30', bg: 'from-sky-500/5 to-sky-900/10' },
    { value: `${avgHappiness}%`, label: 'Avg Happiness', color: avgHappiness >= 50 ? 'text-emerald-400' : avgHappiness >= 30 ? 'text-amber-400' : 'text-rose-400', border: avgHappiness >= 50 ? 'border-emerald-500/40' : avgHappiness >= 30 ? 'border-amber-500/40' : 'border-rose-500/40', bg: avgHappiness >= 50 ? 'from-emerald-500/5 to-emerald-900/10' : avgHappiness >= 30 ? 'from-amber-500/5 to-amber-900/10' : 'from-rose-500/5 to-rose-900/10' },
    { value: totalGdp >= 1000 ? `${(totalGdp / 1000).toFixed(1)}K` : totalGdp, label: 'Total GDP', color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'from-cyan-500/5 to-cyan-900/10' },
    { value: tradeCount, label: 'Active Trades', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'from-purple-500/5 to-purple-900/10' },
    { value: allianceCount, label: 'Alliances', color: 'text-yellow-400', border: 'border-rose-500/30', bg: 'from-rose-500/5 to-rose-900/10' },
  ];

  return (
    <header className="flex-shrink-0">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-2.5 rounded-2xl bg-[#0d0b1a]/80 border border-white/[0.06] backdrop-blur-md">

        {/* ─── Left: Logo + Title ─── */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-violet-500/30">
            W
          </div>
          <div>
            <h1 className="text-[15px] font-extrabold text-white leading-tight tracking-tight">WorldSim India</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.15em] font-medium">Adaptive Resource Simulator</p>
          </div>
        </div>

        {/* ─── Center: Stat pills in even grid ─── */}
        <div className="grid grid-cols-6 gap-2 min-w-0">
          {statCards.map(card => (
            <div key={card.label}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br ${card.bg} border ${card.border}`}>
              <div className="min-w-0 flex items-baseline gap-1.5">
                <span className={`text-[15px] font-black tabular-nums font-mono ${card.color}`}>{card.value}</span>
                <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold hidden xl:inline">{card.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Right: Controls ─── */}
        <div className="flex items-center rounded-xl bg-white/[0.02] border border-white/[0.04] px-1.5 py-1.5 gap-1.5">
          {/* Cycle counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03]">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">Cycle</span>
            <span className="text-[15px] font-black text-white tabular-nums font-mono min-w-[2rem] text-center">{cycle}</span>
          </div>

          {/* Play / Pause */}
          {!isRunning ? (
            <button onClick={onStart}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-400/50 transition-all">
              ▶ Play
            </button>
          ) : (
            <button onClick={onPause}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 hover:border-amber-400/50 transition-all">
              ⏸ Pause
            </button>
          )}

          {/* Reset */}
          <button onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-800/40 border border-zinc-700/30 text-zinc-400 hover:text-white hover:bg-zinc-700/40 transition-all">
            ↻ Reset
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-zinc-700/30 mx-0.5" />

          {/* Speed */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03]">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">Speed</span>
            <input type="range" min="1" max="10" value={speed} onChange={(e) => onSpeedChange(Number(e.target.value))} className="w-16 accent-violet-500" />
            <span className="text-xs font-bold text-violet-400 tabular-nums font-mono w-6 text-right">{speed}x</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
