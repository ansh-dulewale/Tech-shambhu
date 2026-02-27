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
    { icon: '🏛️', value: `${alive}/8`, label: 'States Active', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'from-emerald-500/5 to-emerald-900/10' },
    { icon: '👥', value: totalPop >= 1000 ? `${(totalPop / 1000).toFixed(1)}K` : totalPop, label: 'Total Population', color: 'text-sky-400', border: 'border-sky-500/30', bg: 'from-sky-500/5 to-sky-900/10' },
    { icon: '😊', value: `${avgHappiness}%`, label: 'Avg Happiness', color: avgHappiness >= 50 ? 'text-emerald-400' : avgHappiness >= 30 ? 'text-amber-400' : 'text-rose-400', border: avgHappiness >= 50 ? 'border-emerald-500/40' : avgHappiness >= 30 ? 'border-amber-500/40' : 'border-rose-500/40', bg: avgHappiness >= 50 ? 'from-emerald-500/5 to-emerald-900/10' : avgHappiness >= 30 ? 'from-amber-500/5 to-amber-900/10' : 'from-rose-500/5 to-rose-900/10' },
    { icon: '💰', value: totalGdp >= 1000 ? `${(totalGdp / 1000).toFixed(1)}K` : totalGdp, label: 'Total GDP', color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'from-cyan-500/5 to-cyan-900/10' },
    { icon: '💛', value: tradeCount, label: 'Active Trades', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'from-purple-500/5 to-purple-900/10' },
    { icon: '⭐', value: allianceCount, label: 'Alliances', color: 'text-yellow-400', border: 'border-rose-500/30', bg: 'from-rose-500/5 to-rose-900/10' },
  ];

  return (
    <header className="flex-shrink-0 space-y-2">
      {/* ─── Top bar: Logo + Title + Controls ─── */}
      <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-[#0d0b1a]/80 border border-white/[0.06] backdrop-blur-md">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-violet-500/30">
            W
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white leading-tight tracking-tight">WorldSim India</h1>
            <p className="text-[9px] text-zinc-500 uppercase tracking-[0.15em] font-medium">Adaptive Resource Simulator</p>
          </div>
        </div>

        {/* Center: Cycle + Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">Cycle</span>
            <span className="text-lg font-black text-white tabular-nums font-mono">{cycle}</span>
          </div>

          <div className="h-5 w-px bg-zinc-700/40" />

          {!isRunning ? (
            <button onClick={onStart}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-400/50 transition-all">
              <span>▶</span> Play
            </button>
          ) : (
            <button onClick={onPause}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 hover:border-amber-400/50 transition-all">
              ⏸ Pause
            </button>
          )}

          <button onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800/40 border border-zinc-700/30 text-zinc-400 hover:text-white hover:bg-zinc-700/40 transition-all">
            ↻ Reset
          </button>

          <div className="h-5 w-px bg-zinc-700/40" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">Speed</span>
            <input type="range" min="1" max="10" value={speed} onChange={(e) => onSpeedChange(Number(e.target.value))} className="w-20 accent-violet-500" />
            <span className="text-xs font-bold text-violet-400 tabular-nums font-mono w-5">{speed}x</span>
          </div>
        </div>

        {/* Right spacer for balance */}
        <div className="w-24" />
      </div>

      {/* ─── Stat Cards Row ─── */}
      <div className="grid grid-cols-6 gap-2">
        {statCards.map(card => (
          <div key={card.label}
            className={`rounded-xl bg-gradient-to-br ${card.bg} border ${card.border} px-4 py-3 transition-all hover:scale-[1.02] hover:shadow-lg`}>
            <div className="text-lg mb-0.5">{card.icon}</div>
            <div className={`text-xl font-black tabular-nums font-mono ${card.color}`}>{card.value}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Section Title ─── */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-sm">🖥️</span>
        <div>
          <h2 className="text-sm font-bold text-white leading-tight">Command Center</h2>
          <p className="text-[10px] text-zinc-500">Real-time map, resources & event monitoring</p>
        </div>
      </div>
    </header>
  );
}

export default Header;
