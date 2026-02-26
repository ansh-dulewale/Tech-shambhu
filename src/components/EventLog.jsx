import React, { useRef, useEffect } from 'react';

const EVENT_TYPE_CONFIG = {
  drought:          { icon: '🏜️', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  flood:            { icon: '🌊', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  earthquake:       { icon: '🌋', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  tech_breakthrough:{ icon: '🔬', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  harvest_boom:     { icon: '🌾', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  pandemic:         { icon: '🦠', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  pollution:        { icon: '🏭', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  dispute:          { icon: '⚖️', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  economic:         { icon: '💰', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  policy:           { icon: '📜', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  environmental:    { icon: '🌿', color: 'text-lime-400', bg: 'bg-lime-500/10', border: 'border-lime-500/20' },
  infrastructure:   { icon: '🏗️', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
  conflict:         { icon: '⚔️', color: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  discovery:        { icon: '🔎', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  climate:          { icon: '🌡️', color: 'text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  innovation:       { icon: '💡', color: 'text-yellow-300', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  production:       { icon: '⚙️', color: 'text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  conservation:     { icon: '🌳', color: 'text-green-300', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  crisis:           { icon: '🚨', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  demographic:      { icon: '👥', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  crop_failure:     { icon: '🥀', color: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

function getEffectBadges(effects) {
  const badges = [];
  const icons = { water: '💧', food: '🌾', energy: '⚡', land: '🏔️', population: '👥', happiness: '😊', gdp: '💰' };
  for (const [key, value] of Object.entries(effects)) {
    if (value !== 0) {
      const isPositive = value > 0;
      badges.push(
        <span
          key={key}
          className={`text-[9px] px-1 py-0.5 rounded ${isPositive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}
        >
          {icons[key] || key} {isPositive ? '+' : ''}{value}
        </span>
      );
    }
  }
  return badges;
}

function EventLog({ events = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
        📰 <span className="bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">News Feed</span>
        <span className="text-xs text-gray-500 font-normal ml-auto">{events.length} events</span>
      </h2>
      <div ref={scrollRef} className="overflow-y-auto max-h-52 space-y-1.5 pr-1">
        {events.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-6">
            No events yet. Start the simulation...
          </div>
        )}
        {events.map((event, idx) => {
          const config = EVENT_TYPE_CONFIG[event.type] || { icon: '📌', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' };
          return (
            <div
              key={idx}
              className={`p-2 rounded-lg ${config.bg} border ${config.border} transition-all duration-300 animate-[fadeIn_0.3s_ease-out]`}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-mono">C{event.cycle}</span>
                    <span className="text-[10px] text-gray-600">•</span>
                    <span className="text-[10px] text-gray-400 uppercase">{event.stateId || 'Global'}</span>
                  </div>
                  <p className={`text-xs ${config.color} font-medium leading-snug mt-0.5`}>
                    {event.headline}
                  </p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="text-[8px] text-gray-600 italic">{event.source}</span>
                    <span className="flex-1" />
                    {event.effects && getEffectBadges(event.effects)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EventLog;
