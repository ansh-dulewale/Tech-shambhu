// src/features/AnalysisPanel.jsx
import React, { useMemo } from "react";

const STRATEGY_PARALLELS = {
    TRADE: { label: "Trade Hub", color: "#00e676", desc: "Commerce-driven growth" },
    CONSERVE: { label: "Preserver", color: "#40c4ff", desc: "Stability through conservation" },
    INNOVATE: { label: "Innovator", color: "#ffab00", desc: "Technology-led development" },
    HARVEST: { label: "Producer", color: "#ff9100", desc: "Agriculture-heavy strategy" },
    EXPAND: { label: "Expansionist", color: "#e040fb", desc: "Aggressive growth strategy" },
    DEFEND: { label: "Fortress", color: "#7c4dff", desc: "Defensive stability priority" },
};

const RESOURCE_ICONS = {
    water: "", food: "", energy: "", land: "",
};

function AnalysisPanel({ states, collapsedStates, history }) {
    const rankings = useMemo(() => {
        if (!states || states.length === 0) return [];

        return states.map((state) => {
            const survivalLength = state.alive !== false ? history.length : (
                history.findIndex((h) => h.collapsed && h.collapsed.some((c) => c.id === state.id)) || history.length
            );
            const avgHappiness = state.happiness || 0;
            const gdpGrowth = state.gdp || 0;
            const tradeCount = history.reduce((count, h) => {
                if (!h.trades) return count;
                return count + h.trades.filter((t) => t.from === state.id || t.to === state.id).length;
            }, 0);

            const maxCycles = Math.max(history.length, 1);
            const score = Math.round(
                (survivalLength / maxCycles) * 30 +
                (avgHappiness / 100) * 30 +
                Math.min((gdpGrowth / 2000) * 20, 20) +
                Math.min((tradeCount / 20) * 20, 20)
            );
            return { ...state, score, tradeCount, survivalLength };
        }).sort((a, b) => b.score - a.score);
    }, [states, history]);

    const collapseReasons = useMemo(() => {
        if (!collapsedStates || collapsedStates.length === 0) return [];
        return collapsedStates.map((cs) => {
            const criticalResources = [];
            if (cs.resources) {
                Object.entries(cs.resources).forEach(([key, val]) => {
                    if (val <= 0) criticalResources.push(key);
                });
            }
            return { ...cs, criticalResources, reason: cs.reason || `${criticalResources.map(r => RESOURCE_ICONS[r] || r).join(" ")} depleted` };
        });
    }, [collapsedStates]);

    const getTopStrategy = (state) => {
        if (!state.strategy) return null;
        const entries = Object.entries(state.strategy);
        if (entries.length === 0) return null;
        return entries.reduce((a, b) => (a[1] > b[1] ? a : b));
    };

    const getRankLabel = (index) => {
        if (index === 0) return "#1";
        if (index === 1) return "#2";
        if (index === 2) return "#3";
        return `#${index + 1}`;
    };

    const getScoreColor = (score) => {
        if (score > 60) return "#00e676";
        if (score > 35) return "#ffab00";
        return "#ff1744";
    };

    return (
        <div className="glass-card p-5 animate-slide-up">
            <h2 className="text-sm font-bold mb-4 text-white uppercase tracking-wider flex items-center gap-2.5 font-display">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-green-400 to-emerald-400" />
                Analysis
            </h2>

            {/* Sustainability Rankings */}
            <div className="mb-5">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                    <span className="w-1 h-3 rounded-full bg-gradient-to-b from-green-400/60 to-transparent" />
                    Sustainability Rankings
                </h3>
                <div className="space-y-1.5">
                    {rankings.map((state, idx) => (
                        <div
                            key={state.id}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all
                                ${state.alive === false
                                    ? "bg-red-900/10 border border-red-900/20 opacity-50 grayscale"
                                    : "bg-white/[0.02] border border-white/[0.04] hover:border-green-400/20 hover:bg-white/[0.04] hover:-translate-y-px"
                                }`}
                        >
                            <span className="text-sm w-7 text-center">{getRankLabel(idx)}</span>
                            <span className="flex-1 font-semibold text-gray-200">{state.name}</span>
                            <div className="w-24 h-2 rounded-full bg-white/[0.04] overflow-hidden" title={`Score: ${state.score}`}>
                                <div
                                    className="h-full rounded-full transition-all duration-700 animate-bar-fill"
                                    style={{ width: `${state.score}%`, background: `linear-gradient(90deg, ${getScoreColor(state.score)}80, ${getScoreColor(state.score)})`, boxShadow: `0 0 8px ${getScoreColor(state.score)}40` }}
                                />
                            </div>
                            <span className="w-8 text-right font-mono font-bold text-gray-400 tabular-nums">{state.score}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Collapse Analysis */}
            {collapseReasons.length > 0 && (
                <div className="mb-5">
                    <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                        <span className="w-1 h-3 rounded-full bg-gradient-to-b from-red-400/60 to-transparent" />
                        Collapse Analysis
                    </h3>
                    <div className="space-y-2">
                        {collapseReasons.map((cs) => (
                            <div key={cs.id} className="p-3 rounded-xl bg-gradient-to-br from-red-900/15 to-red-900/5 border border-red-500/15">
                                <p className="text-xs font-bold text-red-300">{cs.name}</p>
                                <p className="text-[10px] text-gray-500 mt-1">{cs.reason}</p>
                                {cs.criticalResources.length > 0 && (
                                    <div className="flex gap-1.5 mt-2">
                                        {cs.criticalResources.map((r) => (
                                            <span key={r} className="text-[9px] px-2 py-1 rounded-lg bg-red-500/10 text-red-300 font-semibold border border-red-500/10">
                                                {RESOURCE_ICONS[r]} {r}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Strategy Breakdown */}
            <div>
                <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                    <span className="w-1 h-3 rounded-full bg-gradient-to-b from-purple-400/60 to-transparent" />
                    AI Strategies
                </h3>
                <div className="grid grid-cols-2 gap-2">
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
                                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-purple-400/20 transition-all hover:-translate-y-px"
                                >
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: parallel.color }} />
                                        <span className="text-[11px] font-bold text-gray-200 truncate">{state.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            className="text-[9px] font-bold px-2 py-0.5 rounded-lg border"
                                            style={{ backgroundColor: parallel.color + '15', color: parallel.color, borderColor: parallel.color + '25' }}
                                        >
                                            {parallel.label}
                                        </span>
                                        <span className="text-[9px] text-gray-500 tabular-nums font-mono font-bold">{stratPct}%</span>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}

export default AnalysisPanel;
