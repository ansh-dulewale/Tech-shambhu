import React from 'react';

function Header({ cycle, speed, isRunning, onStart, onPause, onReset, onSpeedChange }) {
  return (
    <header className="flex items-center justify-between px-6 py-3 glass-card mb-4">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
          WS
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
            WorldSim India
          </h1>
          <p className="text-[11px] text-gray-500 tracking-wide uppercase">Adaptive Resource Scarcity Simulator</p>
        </div>
      </div>

      {/* Center: Cycle Counter */}
      <div className="text-center px-6 py-2 rounded-xl bg-white/5 border border-white/10">
        <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">Cycle</span>
        <div className="text-2xl font-extrabold text-white tabular-nums">{cycle}</div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <button
            onClick={onStart}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 transition-all duration-200 cursor-pointer text-sm font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            Play
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 hover:bg-amber-500/25 transition-all duration-200 cursor-pointer text-sm font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            Pause
          </button>
        )}

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer text-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Reset
        </button>

        {/* Speed */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 ml-1">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Speed</span>
          <input
            type="range"
            min="1"
            max="10"
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-16 h-1 accent-purple-500 cursor-pointer"
          />
          <span className="text-xs text-purple-400 font-semibold w-5 text-center tabular-nums">{speed}x</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
