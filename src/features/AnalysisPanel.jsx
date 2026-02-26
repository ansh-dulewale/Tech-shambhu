// src/features/AnalysisPanel.jsx
import React, { useMemo } from "react";

const STRATEGY_PARALLELS = {
    TRADE: { country: "Singapore", emoji: "🇸🇬", desc: "Trade-driven growth" },
    CONSERVE: { country: "Norway", emoji: "🇳🇴", desc: "Resource preservation" },
    INNOVATE: { country: "Israel", emoji: "🇮🇱", desc: "Innovation-led development" },
    HARVEST: { country: "Brazil", emoji: "🇧🇷", desc: "Agriculture superpower" },
    EXPAND: { country: "China", emoji: "🇨🇳", desc: "Aggressive expansion" },
    DEFEND: { country: "Switzerland", emoji: "🇨🇭", desc: "Defensive stability" },
};

const RESOURCE_ICONS = {
    water: "💧",
    food: "🌾",
    energy: "⚡",
    land: "🏔️",
};

function AnalysisPanel({ states, agents, collapsedStates, history }) {
    // Calculate sustainability score for each state
    const rankings = useMemo(() => {
        if (!states || states.length === 0) return [];

        return states
            .map((state) => {
                const survivalLength = state.alive !== false ? history.length : (
                    history.findIndex((h) =>
                        h.collapsed && h.collapsed.some((c) => c.id === state.id)
                    ) || history.length
                );

                const avgHappiness = state.happiness || 0;
                const gdpGrowth = state.gdp || 0;

                // Count trades this state participated in
                const tradeCount = history.reduce((count, h) => {
                    if (!h.trades) return count;
                    return count + h.trades.filter(
                        (t) => t.from === state.id || t.to === state.id
                    ).length;
                }, 0);

                const maxCycles = Math.max(history.length, 1);
                const score = Math.round(
                    (survivalLength / maxCycles) * 30 +
                    (avgHappiness / 100) * 30 +
                    Math.min((gdpGrowth / 2000) * 20, 20) +
                    Math.min((tradeCount / 20) * 20, 20)
                );

                return { ...state, score, tradeCount, survivalLength };
            })
            .sort((a, b) => b.score - a.score);
    }, [states, history]);

    // Collapse analysis
    const collapseReasons = useMemo(() => {
        if (!collapsedStates || collapsedStates.length === 0) return [];

        return collapsedStates.map((cs) => {
            // Find which resource hit 0
            const criticalResources = [];
            if (cs.resources) {
                Object.entries(cs.resources).forEach(([key, val]) => {
                    if (val <= 0) criticalResources.push(key);
                });
            }

            return {
                ...cs,
                criticalResources,
                reason: cs.reason || `${criticalResources.map(r => RESOURCE_ICONS[r] || r).join(" ")} depleted`,
            };
        });
    }, [collapsedStates]);

    // Determine dominant strategy per state
    const getTopStrategy = (state) => {
        if (!state.strategy) return null;
        const entries = Object.entries(state.strategy);
        if (entries.length === 0) return null;
        return entries.reduce((a, b) => (a[1] > b[1] ? a : b));
    };

    const getMedalEmoji = (index) => {
        if (index === 0) return "🥇";
        if (index === 1) return "🥈";
        if (index === 2) return "🥉";
        return `#${index + 1}`;
    };

    return (
        <div className="glass-card p-4">
            <h2 className="text-lg font-semibold mb-3 text-green-400 flex items-center gap-2">
                📋 Analysis
            </h2>

            {/* Sustainability Rankings */}
            <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Sustainability Rankings
                </h3>
                <div className="space-y-1.5">
                    {rankings.map((state, idx) => {
                        const topStrat = getTopStrategy(state);
                        return (
                            <div
                                key={state.id}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all
                  ${state.alive === false
                                        ? "bg-gray-800/30 border border-gray-700/50 opacity-60"
                                        : "bg-gray-800/50 border border-gray-700/50 hover:border-green-400/30"
                                    }`}
                            >
                                <span className="text-sm w-6 text-center">{getMedalEmoji(idx)}</span>
                                <span className="flex-1 font-medium text-gray-200">{state.name}</span>
                                <div
                                    className="w-16 h-1.5 rounded-full bg-gray-700 overflow-hidden"
                                    title={`Score: ${state.score}`}
                                >
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${state.score}%`,
                                            background: state.score > 60
                                                ? "#00e676"
                                                : state.score > 35
                                                    ? "#ffab00"
                                                    : "#ff1744",
                                        }}
                                    />
                                </div>
                                <span className="w-7 text-right text-gray-400">{state.score}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Collapse Analysis */}
            {collapseReasons.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
                        💀 Collapse Analysis
                    </h3>
                    <div className="space-y-2">
                        {collapseReasons.map((cs) => (
                            <div
                                key={cs.id}
                                className="p-2.5 rounded-lg bg-red-900/15 border border-red-500/20"
                            >
                                <p className="text-xs font-semibold text-red-300">{cs.name}</p>
                                <p className="text-xs text-gray-400 mt-1">{cs.reason}</p>
                                {cs.criticalResources.length > 0 && (
                                    <div className="flex gap-1 mt-1.5">
                                        {cs.criticalResources.map((r) => (
                                            <span
                                                key={r}
                                                className="text-xs px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-300"
                                            >
                                                {RESOURCE_ICONS[r]} {r} = 0
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Strategy Breakdown + Real-World Parallels */}
            <div>
                <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
                    🌍 Strategy Parallels
                </h3>
                <div className="space-y-1.5">
                    {rankings
                        .filter((s) => s.alive !== false)
                        .map((state) => {
                            const topStrat = getTopStrategy(state);
                            if (!topStrat) return null;
                            const [stratName, stratPct] = topStrat;
                            const parallel = STRATEGY_PARALLELS[stratName];
                            if (!parallel) return null;

                            return (
                                <div
                                    key={state.id}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg
                             bg-gray-800/40 border border-gray-700/50 text-xs"
                                >
                                    <span className="font-medium text-gray-200 flex-1">{state.name}</span>
                                    <span className="text-gray-400">{stratName} {stratPct}%</span>
                                    <span className="text-sm">{parallel.emoji}</span>
                                    <span className="text-purple-300 text-xs">Like {parallel.country}</span>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}

export default AnalysisPanel;
