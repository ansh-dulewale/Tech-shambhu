import React from 'react';

function Header({ cycle, speed, isRunning, onStart, onPause, onReset, onSpeedChange }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 glass-card mb-5">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <span className="text-white font-extrabold text-sm tracking-tight">WS</span>
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gradient-primary tracking-tight leading-tight">
            WorldSim India
          </h1>
          <p className="text-xs text-gray-400 tracking-widest uppercase mt-0.5">
            Adaptive Resource Scarcity Simulator
          </p>
        </div>
      </div>

      {/* Center: Cycle Counter */}
      <div className="text-center px-8 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] border-glow-purple">
        <span className="text-xs text-gray-400 uppercase tracking-[0.2em] font-medium block mb-1">Cycle</span>
        <div className="text-3xl font-black text-white tabular-nums leading-none">{cycle}</div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {!isRunning ? (
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 
                       hover:bg-emerald-500/25 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10
                       transition-all duration-300 cursor-pointer text-sm font-semibold active:scale-95"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            Play
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 
                       hover:bg-amber-500/25 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/10
                       transition-all duration-300 cursor-pointer text-sm font-semibold active:scale-95"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            Pause
          </button>
        )}

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-400 
                     hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15]
                     transition-all duration-300 cursor-pointer text-sm font-medium active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Reset
        </button>

        {/* Speed Control */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] ml-1">
          <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">Speed</span>
          <input
            type="range"
            min="1"
            max="10"
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-20 h-1.5 accent-purple-500 cursor-pointer rounded-full"
          />
          <span className="text-sm text-purple-400 font-bold w-6 text-center tabular-nums">{speed}x</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
