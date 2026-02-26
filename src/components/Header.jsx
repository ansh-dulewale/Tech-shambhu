import React from 'react';

// ─── Animated SVG Logo ──────────────────────────────────────────────
function Logo() {
  return (
    <div className="relative w-11 h-11 mr-3.5 flex-shrink-0">
      {/* Glow backdrop */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-500 opacity-30 blur-xl animate-glow" />
      {/* Logo container */}
      <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-500 flex items-center justify-center overflow-hidden shadow-xl shadow-violet-500/30">
        {/* Globe SVG */}
        <svg width="28" height="28" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Globe circle */}
          <circle cx="13" cy="13" r="11" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" fill="none" />
          {/* Meridian lines */}
          <ellipse cx="13" cy="13" rx="6" ry="11" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" fill="none" />
          <ellipse cx="13" cy="13" rx="3" ry="11" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" fill="none" />
          {/* Latitude lines */}
          <line x1="2" y1="9" x2="24" y2="9" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
          <line x1="2" y1="17" x2="24" y2="17" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
          <line x1="4" y1="13" x2="22" y2="13" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
          {/* Circuit nodes */}
          <circle cx="8" cy="9" r="1.4" fill="#e879f9" />
          <circle cx="17" cy="13" r="1.4" fill="#a78bfa" />
          <circle cx="10" cy="17" r="1.4" fill="#fbbf24" />
          {/* Circuit lines connecting nodes */}
          <line x1="8" y1="9" x2="17" y2="13" stroke="#e879f9" strokeWidth="0.7" opacity="0.7" />
          <line x1="17" y1="13" x2="10" y2="17" stroke="#a78bfa" strokeWidth="0.7" opacity="0.7" />
          {/* Pulse dot - animated */}
          <circle cx="13" cy="6" r="1" fill="#fbbf24" opacity="0.8">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
            <animate attributeName="r" values="0.8;1.8;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
        {/* Rotating ring overlay */}
        <div className="absolute inset-0 rounded-2xl border border-white/10" style={{
          animation: 'spin 15s linear infinite',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.1) 10%, transparent 20%)'
        }} />
      </div>
    </div>
  );
}

function Header({ cycle, speed, isRunning, onStart, onPause, onReset, onSpeedChange, states = [] }) {
  const alive = states.filter(s => s.alive !== false).length;
  const avgHappiness = states.length
    ? Math.round(states.filter(s => s.alive !== false).reduce((s, st) => s + (st.happiness || 0), 0) / Math.max(alive, 1))
    : 0;
  const totalPop = states.reduce((s, st) => s + (st.population || 0), 0);
  const totalGdp = states.reduce((s, st) => s + (st.gdp || 0), 0);

  // Health indicator color
  const healthColor = alive >= 7 ? 'bg-emerald-500' : alive >= 5 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <header className="header-bar flex items-center justify-between px-5 py-2.5 rounded-2xl flex-shrink-0">
      {/* Left: Logo + Title */}
      <div className="flex items-center">
        <Logo />
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-extrabold tracking-tight text-gradient-aurora leading-tight font-display">WorldSim India</h1>
            {/* Live health dot */}
            {cycle > 0 && (
              <span className={`w-2.5 h-2.5 rounded-full ${healthColor} animate-pulse shadow-lg`} 
                    title={`${alive}/8 states alive`}
                    style={{ boxShadow: `0 0 8px ${alive >= 7 ? 'rgba(16,185,129,0.5)' : alive >= 5 ? 'rgba(245,158,11,0.5)' : 'rgba(244,63,94,0.5)'}` }} />
            )}
          </div>
          <p className="text-[9px] text-zinc-500 tracking-[0.2em] uppercase font-medium leading-tight mt-0.5">Adaptive Resource Scarcity Simulator</p>
        </div>
      </div>

      {/* Center: Cycle + Live Stats */}
      <div className="flex items-center gap-3">
        {/* Cycle counter with ring */}
        <div className="relative text-center px-5 py-1.5 rounded-2xl bg-gradient-to-b from-zinc-800/40 to-zinc-800/20 border border-zinc-700/30 shadow-inner">
          <span className="text-[8px] text-zinc-500 uppercase tracking-[0.25em] font-semibold block leading-tight">Cycle</span>
          <div className="text-2xl font-black text-white tabular-nums font-mono" key={cycle}
               style={{ textShadow: '0 0 20px rgba(167,139,250,0.3)' }}>{cycle}</div>
          {/* Progress ring for cycle */}
          {isRunning && (
            <div className="absolute -top-0.5 -right-0.5">
              <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="relative block w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
          )}
        </div>

        {cycle > 0 && (
          <div className="flex items-center rounded-2xl bg-gradient-to-b from-zinc-800/30 to-zinc-800/15 border border-zinc-700/20 overflow-hidden divide-x divide-zinc-700/20 shadow-inner">
            {[
              { label: 'Alive', value: `${alive}/8`, color: alive >= 6 ? 'text-emerald-400' : alive >= 4 ? 'text-amber-400' : 'text-rose-400', icon: '🏛️' },
              { label: 'Happy', value: `${avgHappiness}%`, color: avgHappiness >= 50 ? 'text-emerald-400' : avgHappiness >= 30 ? 'text-amber-400' : 'text-rose-400', icon: '😊' },
              { label: 'Pop', value: totalPop >= 1000 ? `${(totalPop / 1000).toFixed(1)}K` : totalPop, color: 'text-sky-400', icon: '👥' },
              { label: 'GDP', value: totalGdp >= 1000 ? `${(totalGdp / 1000).toFixed(0)}K` : totalGdp, color: 'text-amber-400', icon: '💰' },
            ].map((stat) => (
              <div key={stat.label} className="text-center px-3 py-1.5 group cursor-default hover:bg-white/[0.02] transition-colors">
                <span className="text-[8px] text-zinc-600 uppercase tracking-wider block leading-tight group-hover:text-zinc-400 transition-colors">
                  {stat.icon} {stat.label}
                </span>
                <span className={`text-sm font-bold tabular-nums font-mono ${stat.color} transition-all`}>{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <button
            onClick={onStart}
            className="group relative flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden
                       bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 border border-emerald-500/25 text-emerald-400 
                       hover:from-emerald-500/25 hover:to-cyan-500/15 hover:border-emerald-400/50 hover:shadow-xl hover:shadow-emerald-500/15 hover:-translate-y-px"
          >
            <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            Play
          </button>
        ) : (
          <button
            onClick={onPause}
            className="group flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300
                       bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/25 text-amber-400 
                       hover:from-amber-500/25 hover:to-orange-500/15 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/10"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            Pause
          </button>
        )}

        <button
          onClick={onReset}
          className="group p-2.5 rounded-xl bg-zinc-800/30 border border-zinc-700/30 text-zinc-400 hover:text-white hover:bg-zinc-700/30 hover:border-zinc-600/40 transition-all"
          title="Reset simulation"
        >
          <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-b from-zinc-800/25 to-zinc-800/15 border border-zinc-700/20">
          <span className="text-[10px] text-violet-400 font-semibold">⚡</span>
          <input type="range" min="1" max="10" value={speed} onChange={(e) => onSpeedChange(Number(e.target.value))} className="w-16" />
          <span className="text-xs text-violet-400 font-bold w-6 text-center tabular-nums font-mono">{speed}x</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
