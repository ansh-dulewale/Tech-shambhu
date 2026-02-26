import React from 'react';

function Header({ cycle, speed, isRunning, onStart, onPause, onReset, onSpeedChange }) {
  return (
    <header className="flex items-center justify-between px-6 py-3 glass-card mb-4">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <span className="text-3xl animate-float">🌍</span>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            WorldSim India
          </h1>
          <p className="text-xs text-gray-500">Adaptive Resource Scarcity Simulator</p>
        </div>
      </div>

      {/* Center: Cycle Counter */}
      <div className="text-center px-6 py-2 rounded-xl bg-white/5 border border-white/10">
        <span className="text-xs text-gray-400 uppercase tracking-wider">Cycle</span>
        <div className="text-3xl font-extrabold text-white tabular-nums">{cycle}</div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {/* Play / Pause */}
        {!isRunning ? (
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all duration-300 cursor-pointer"
          >
            <span>▶</span> <span className="text-sm font-medium">Play</span>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-all duration-300 cursor-pointer"
          >
            <span>⏸</span> <span className="text-sm font-medium">Pause</span>
          </button>
        )}

        {/* Reset */}
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all duration-300 cursor-pointer"
        >
          <span>🔄</span> <span className="text-sm font-medium">Reset</span>
        </button>

        {/* Speed Slider */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <span className="text-xs text-gray-400">🐢</span>
          <input
            type="range"
            min="1"
            max="10"
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-20 h-1 accent-purple-500 cursor-pointer"
          />
          <span className="text-xs text-gray-400">🐇</span>
          <span className="text-xs text-purple-400 font-bold w-6 text-center">{speed}x</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
