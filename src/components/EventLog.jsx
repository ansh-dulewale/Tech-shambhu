import React, { useRef, useEffect } from 'react';

const EVENT_TYPE_COLORS = {
  drought:          { color: 'text-red-400', bg: 'bg-red-500/8', border: 'border-red-500/15' },
  flood:            { color: 'text-blue-400', bg: 'bg-blue-500/8', border: 'border-blue-500/15' },
  earthquake:       { color: 'text-orange-400', bg: 'bg-orange-500/8', border: 'border-orange-500/15' },
  tech_breakthrough:{ color: 'text-green-400', bg: 'bg-green-500/8', border: 'border-green-500/15' },
  harvest_boom:     { color: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/15' },
  pandemic:         { color: 'text-purple-400', bg: 'bg-purple-500/8', border: 'border-purple-500/15' },
  pollution:        { color: 'text-gray-400', bg: 'bg-gray-500/8', border: 'border-gray-500/15' },
  dispute:          { color: 'text-yellow-400', bg: 'bg-yellow-500/8', border: 'border-yellow-500/15' },
  economic:         { color: 'text-cyan-400', bg: 'bg-cyan-500/8', border: 'border-cyan-500/15' },
  policy:           { color: 'text-indigo-400', bg: 'bg-indigo-500/8', border: 'border-indigo-500/15' },
  environmental:    { color: 'text-lime-400', bg: 'bg-lime-500/8', border: 'border-lime-500/15' },
  infrastructure:   { color: 'text-teal-400', bg: 'bg-teal-500/8', border: 'border-teal-500/15' },
  conflict:         { color: 'text-red-300', bg: 'bg-red-500/8', border: 'border-red-500/15' },
  discovery:        { color: 'text-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/15' },
  climate:          { color: 'text-orange-300', bg: 'bg-orange-500/8', border: 'border-orange-500/15' },
  innovation:       { color: 'text-yellow-300', bg: 'bg-yellow-500/8', border: 'border-yellow-500/15' },
  production:       { color: 'text-blue-300', bg: 'bg-blue-500/8', border: 'border-blue-500/15' },
  conservation:     { color: 'text-green-300', bg: 'bg-green-500/8', border: 'border-green-500/15' },
  crisis:           { color: 'text-red-500', bg: 'bg-red-500/8', border: 'border-red-500/15' },
  demographic:      { color: 'text-pink-400', bg: 'bg-pink-500/8', border: 'border-pink-500/15' },
  crop_failure:     { color: 'text-red-300', bg: 'bg-red-500/8', border: 'border-red-500/15' },
};

const EFFECT_LABELS = { water: 'W', food: 'F', energy: 'E', land: 'L', population: 'Pop', happiness: 'Hap', gdp: 'GDP' };

function getEffectBadges(effects) {
  const badges = [];
  for (const [key, value] of Object.entries(effects)) {
    if (value !== 0) {
      const isPositive = value > 0;
      badges.push(
        <span
          key={key}
          className={`text-[8px] px-1 py-0.5 rounded font-medium ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
        >
          {EFFECT_LABELS[key] || key} {isPositive ? '+' : ''}{value}
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Event Feed</h2>
        <span className="text-[10px] text-gray-500 tabular-nums">{events.length} events</span>
      </div>
      <div ref={scrollRef} className="overflow-y-auto max-h-52 space-y-1.5 pr-1">
        {events.length === 0 && (
          <div className="text-center text-xs text-gray-600 py-6">
            No events yet. Start the simulation to begin.
          </div>
        )}
        {events.map((event, idx) => {
          const config = EVENT_TYPE_COLORS[event.type] || { color: 'text-gray-400', bg: 'bg-gray-500/8', border: 'border-gray-500/15' };
          return (
            <div
              key={idx}
              className={`p-2 rounded-lg ${config.bg} border ${config.border} transition-all duration-300`}
            >
              <div className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${config.color.replace('text-', 'bg-')}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] text-gray-500 font-mono tabular-nums">C{event.cycle}</span>
                    <span className="text-[9px] text-gray-700">|</span>
                    <span className="text-[9px] text-gray-400 uppercase tracking-wider">{event.stateId || 'Global'}</span>
                  </div>
                  <p className={`text-[11px] ${config.color} font-medium leading-snug`}>
                    {event.headline}
                  </p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="text-[8px] text-gray-600">{event.source}</span>
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
