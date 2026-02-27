// src/features/AnalysisPanel.jsx
import React, { useMemo } from "react";

const STRATEGY_COLORS = {
    TRADE: "#00e676", CONSERVE: "#40c4ff", INNOVATE: "#ffab00",
    HARVEST: "#ff9100", EXPAND: "#e040fb", DEFEND: "#7c4dff",
};

const RESOURCE_LABELS = { water: "Water", food: "Food", energy: "Energy", land: "Land" };

function AnalysisPanel({ states, collapsedStates, history }) {
    // ── Sustainability Rankings ──────────────────────────────────
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
                (survivalLength / maxCycles) * 30 + (avgHappiness / 100) * 30 +
                Math.min((gdpGrowth / 2000) * 20, 20) + Math.min((tradeCount / 20) * 20, 20)
            );
            return { ...state, score, tradeCount, survivalLength };
        }).sort((a, b) => b.score - a.score);
    }, [states, history]);

    // ── Collapse Root-Cause Analysis ─────────────────────────────
    const collapseAnalysis = useMemo(() => {
        if (!collapsedStates || collapsedStates.length === 0) return [];
        return collapsedStates.map((cs) => {
            const depleted = Object.entries(cs.resources || {}).filter(([, v]) => v <= 0).map(([k]) => k);
            // Find what resource declined fastest before collapse
            const collapseIdx = history.findIndex(h => h.collapsed?.some(c => c.id === cs.id));
            let declineChain = '';
            if (collapseIdx > 10) {
                const early = history[Math.max(0, collapseIdx - 10)]?.states?.find(s => s.id === cs.id);
                const late = history[collapseIdx - 1]?.states?.find(s => s.id === cs.id);
                if (early && late) {
                    const drops = Object.keys(RESOURCE_LABELS).map(r => ({
                        res: r, drop: (early.resources?.[r] || 0) - (late.resources?.[r] || 0)
                    })).filter(d => d.drop > 0).sort((a, b) => b.drop - a.drop);
                    if (drops.length > 0) {
                        declineChain = drops.map(d => `${RESOURCE_LABELS[d.res]} -${Math.round(d.drop)}`).join(' then ');
                    }
                }
            }
            return { ...cs, depleted, declineChain, cycle: cs.cycle || cs.collapseCycle };
        });
    }, [collapsedStates, history]);

    // ── Strategy Convergence Over Time ───────────────────────────
    const convergenceData = useMemo(() => {
        if (history.length < 20) return null;
        const stateIds = history[0]?.states?.map(s => s.id) || [];
        const windows = []; // sample every 10 cycles
        for (let i = 9; i < history.length; i += 10) {
            const h = history[i];
            const snapshot = {};
            (h.states || []).forEach(s => {
                if (s.strategy && s.alive !== false) {
                    const top = Object.entries(s.strategy).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
                    snapshot[s.id] = { strategy: top[0], pct: top[1], name: s.name };
                }
            });
            windows.push({ cycle: h.cycle, data: snapshot });
        }
        // Detect convergence: did top strategy change between windows?
        const convergences = {};
        stateIds.forEach(id => {
            const strats = windows.map(w => w.data[id]?.strategy).filter(Boolean);
            const earlyStrat = strats.length > 1 ? strats[0] : null;
            const lateStrat = strats.length > 1 ? strats[strats.length - 1] : null;
            const latePct = windows[windows.length - 1]?.data[id]?.pct || 0;
            const name = windows[0]?.data[id]?.name || id;
            if (earlyStrat && lateStrat) {
                convergences[id] = {
                    name, earlyStrat, lateStrat, latePct,
                    converged: earlyStrat === lateStrat && latePct > 35,
                    shifted: earlyStrat !== lateStrat,
                };
            }
        });
        return convergences;
    }, [history]);

    // ── Resource Dependency Graph ────────────────────────────────
    const dependencyInsights = useMemo(() => {
        if (history.length < 20) return [];
        const insights = [];
        const lastStates = history[history.length - 1]?.states || [];
        lastStates.forEach(s => {
            if (s.alive === false) return;
            const r = s.resources || {};
            const lowest = Object.entries(r).reduce((a, b) => a[1] < b[1] ? a : b);
            const highest = Object.entries(r).reduce((a, b) => a[1] > b[1] ? a : b);
            if (lowest[1] < 25 && highest[1] > 60) {
                insights.push({
                    state: s.name, id: s.id,
                    vulnerability: `${RESOURCE_LABELS[lowest[0]]} (${Math.round(lowest[1])})`,
                    strength: `${RESOURCE_LABELS[highest[0]]} (${Math.round(highest[1])})`,
                    risk: lowest[1] < 15 ? 'high' : 'medium',
                });
            }
        });
        return insights;
    }, [history]);

    // ── Trade Network Topology ───────────────────────────────────
    const tradeTopology = useMemo(() => {
        if (history.length < 10) return null;
        const pairCounts = {};
        history.forEach(h => {
            (h.trades || []).forEach(t => {
                const key = [t.from, t.to].sort().join('_');
                pairCounts[key] = (pairCounts[key] || 0) + 1;
            });
        });
        // Find most traded pairs
        const sorted = Object.entries(pairCounts).sort((a, b) => b[1] - a[1]);
        // Count trades per state
        const stateTradeCounts = {};
        sorted.forEach(([key, count]) => {
            const [s1, s2] = key.split('_');
            stateTradeCounts[s1] = (stateTradeCounts[s1] || 0) + count;
            stateTradeCounts[s2] = (stateTradeCounts[s2] || 0) + count;
        });
        // Identify hub (most connected)
        const hubId = Object.entries(stateTradeCounts).sort((a, b) => b[1] - a[1])[0];
        // Identify isolated (zero trades)
        const stateIds = (history[0]?.states || []).map(s => s.id);
        const isolated = stateIds.filter(id => !stateTradeCounts[id]);
        return {
            topPairs: sorted.slice(0, 3),
            hub: hubId ? { id: hubId[0], trades: hubId[1] } : null,
            isolated,
            totalUniquePairs: sorted.length,
        };
    }, [history]);

    // ── Collapse Prediction ──────────────────────────────────────
    const collapseRisks = useMemo(() => {
        if (history.length < 15) return [];
        const recent = history.slice(-10);
        const risks = [];
        const currentStates = history[history.length - 1]?.states || [];
        currentStates.forEach(s => {
            if (s.alive === false) return;
            // Look at resource trends over last 10 cycles
            const trends = {};
            ['water', 'food', 'energy', 'land'].forEach(res => {
                const vals = recent.map(h => {
                    const st = h.states?.find(x => x.id === s.id);
                    return st?.resources?.[res] ?? 50;
                });
                const slope = vals.length > 1 ? (vals[vals.length - 1] - vals[0]) / vals.length : 0;
                trends[res] = { current: vals[vals.length - 1], slope };
            });
            // Predict cycles until any resource hits 0
            let minCyclesToZero = Infinity;
            let criticalRes = null;
            Object.entries(trends).forEach(([res, { current, slope }]) => {
                if (slope < -0.5 && current > 0) {
                    const cyclesToZero = Math.abs(current / slope);
                    if (cyclesToZero < minCyclesToZero) {
                        minCyclesToZero = cyclesToZero;
                        criticalRes = res;
                    }
                }
            });
            if (minCyclesToZero < 30) {
                risks.push({
                    name: s.name, id: s.id,
                    resource: RESOURCE_LABELS[criticalRes],
                    cyclesLeft: Math.round(minCyclesToZero),
                    severity: minCyclesToZero < 10 ? 'critical' : 'warning',
                });
            }
        });
        return risks.sort((a, b) => a.cyclesLeft - b.cyclesLeft);
    }, [history]);

    const getTopStrategy = (state) => {
        if (!state.strategy) return null;
        const entries = Object.entries(state.strategy);
        if (entries.length === 0) return null;
        return entries.reduce((a, b) => (a[1] > b[1] ? a : b));
    };

    const getRankLabel = (i) => i < 3 ? ['#1', '#2', '#3'][i] : `#${i + 1}`;
    const getScoreColor = (s) => s > 60 ? '#00e676' : s > 35 ? '#ffab00' : '#ff1744';
    const stateNameMap = useMemo(() => {
        const m = {};
        (states || []).forEach(s => { m[s.id] = s.name; });
        return m;
    }, [states]);

    return (
        <div className="glass-card p-5 animate-slide-up space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2.5 font-display">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-green-400 to-emerald-400" />
                Emergent Strategy Analysis
            </h2>

            {/* ── Sustainability Rankings ─────────────────────── */}
            <div>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                    <span className="w-1 h-3 rounded-full bg-gradient-to-b from-green-400/60 to-transparent" />
                    Sustainability Rankings
                </h3>
                <div className="space-y-1.5">
                    {rankings.map((state, idx) => (
                        <div key={state.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all
                            ${state.alive === false ? 'bg-red-900/10 border border-red-900/20 opacity-50 grayscale'
                            : 'bg-white/[0.02] border border-white/[0.04] hover:border-green-400/20 hover:bg-white/[0.04] hover:-translate-y-px'}`}>
                            <span className="text-sm w-7 text-center">{getRankLabel(idx)}</span>
                            <span className="flex-1 font-semibold text-gray-200">{state.name}</span>
                            <div className="w-24 h-2 rounded-full bg-white/[0.04] overflow-hidden" title={`Score: ${state.score}`}>
                                <div className="h-full rounded-full transition-all duration-700 animate-bar-fill"
                                    style={{ width: `${state.score}%`, background: `linear-gradient(90deg, ${getScoreColor(state.score)}80, ${getScoreColor(state.score)})`, boxShadow: `0 0 8px ${getScoreColor(state.score)}40` }} />
                            </div>
                            <span className="w-8 text-right font-mono font-bold text-gray-400 tabular-nums">{state.score}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Collapse Prediction ─────────────────────────── */}
            {collapseRisks.length > 0 && (
                <div>
                    <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                        <span className="w-1 h-3 rounded-full bg-gradient-to-b from-amber-400/60 to-transparent" />
                        Collapse Prediction
                    </h3>
                    <div className="space-y-1.5">
                        {collapseRisks.map((risk) => (
                            <div key={risk.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs border
                                ${risk.severity === 'critical' ? 'bg-red-900/15 border-red-500/20' : 'bg-amber-900/10 border-amber-500/15'}`}>
                                <span className={`w-2 h-2 rounded-full animate-pulse ${risk.severity === 'critical' ? 'bg-red-400' : 'bg-amber-400'}`} />
                                <span className="flex-1 font-semibold text-gray-200">{risk.name}</span>
                                <span className="text-[9px] text-gray-400">{risk.resource}</span>
                                <span className={`text-[10px] font-mono font-bold ${risk.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                                    ~{risk.cyclesLeft} cycles
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Collapse Root-Cause Analysis ────────────────── */}
            {collapseAnalysis.length > 0 && (
                <div>
                    <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                        <span className="w-1 h-3 rounded-full bg-gradient-to-b from-red-400/60 to-transparent" />
                        Collapse Root Cause
                    </h3>
                    <div className="space-y-2">
                        {collapseAnalysis.map((cs) => (
                            <div key={cs.id} className="p-3 rounded-xl bg-gradient-to-br from-red-900/15 to-red-900/5 border border-red-500/15">
                                <p className="text-xs font-bold text-red-300">{cs.name} <span className="text-gray-500 font-normal">cycle {cs.cycle}</span></p>
                                {cs.declineChain && (
                                    <p className="text-[10px] text-gray-400 mt-1">Decline chain: {cs.declineChain}</p>
                                )}
                                <div className="flex gap-1.5 mt-2">
                                    {cs.depleted.map((r) => (
                                        <span key={r} className="text-[9px] px-2 py-1 rounded-lg bg-red-500/10 text-red-300 font-semibold border border-red-500/10">
                                            {RESOURCE_LABELS[r] || r} depleted
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Strategy Convergence ────────────────────────── */}
            {convergenceData && (
                <div>
                    <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                        <span className="w-1 h-3 rounded-full bg-gradient-to-b from-purple-400/60 to-transparent" />
                        Strategy Convergence
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(convergenceData).map(([id, data]) => (
                            <div key={id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-purple-400/20 transition-all">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STRATEGY_COLORS[data.lateStrat] || '#888' }} />
                                    <span className="text-[11px] font-bold text-gray-200 truncate">{data.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {data.shifted ? (
                                        <>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-700/40 text-gray-500 line-through">{data.earlyStrat}</span>
                                            <span className="text-[8px] text-gray-600">-&gt;</span>
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg border"
                                                style={{ backgroundColor: (STRATEGY_COLORS[data.lateStrat] || '#888') + '15', color: STRATEGY_COLORS[data.lateStrat], borderColor: (STRATEGY_COLORS[data.lateStrat] || '#888') + '25' }}>
                                                {data.lateStrat}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg border"
                                            style={{ backgroundColor: (STRATEGY_COLORS[data.lateStrat] || '#888') + '15', color: STRATEGY_COLORS[data.lateStrat], borderColor: (STRATEGY_COLORS[data.lateStrat] || '#888') + '25' }}>
                                            {data.lateStrat}
                                        </span>
                                    )}
                                    <span className="text-[9px] text-gray-500 tabular-nums font-mono font-bold">{data.latePct}%</span>
                                    {data.converged && <span className="text-[8px] text-green-400/70 ml-auto">converged</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Resource Dependencies ───────────────────────── */}
            {dependencyInsights.length > 0 && (
                <div>
                    <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                        <span className="w-1 h-3 rounded-full bg-gradient-to-b from-cyan-400/60 to-transparent" />
                        Resource Vulnerabilities
                    </h3>
                    <div className="space-y-1.5">
                        {dependencyInsights.map((d) => (
                            <div key={d.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs border
                                ${d.risk === 'high' ? 'bg-red-900/10 border-red-500/15' : 'bg-amber-900/8 border-amber-500/12'}`}>
                                <span className="font-semibold text-gray-200 w-20 truncate">{d.state}</span>
                                <span className="text-[9px] text-red-400">Weak: {d.vulnerability}</span>
                                <span className="text-[8px] text-gray-600 mx-1">|</span>
                                <span className="text-[9px] text-green-400">Strong: {d.strength}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Trade Network Topology ──────────────────────── */}
            {tradeTopology && (
                <div>
                    <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                        <span className="w-1 h-3 rounded-full bg-gradient-to-b from-emerald-400/60 to-transparent" />
                        Trade Network Topology
                    </h3>
                    <div className="space-y-2">
                        {tradeTopology.hub && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-900/10 border border-emerald-500/15 text-xs">
                                <span className="text-emerald-400 font-bold">Hub:</span>
                                <span className="text-gray-200 font-semibold">{stateNameMap[tradeTopology.hub.id] || tradeTopology.hub.id}</span>
                                <span className="text-[9px] text-gray-500 ml-auto font-mono">{tradeTopology.hub.trades} trades</span>
                            </div>
                        )}
                        {tradeTopology.topPairs.length > 0 && (
                            <div className="text-[10px] text-gray-400">
                                <span className="text-gray-500">Top corridors: </span>
                                {tradeTopology.topPairs.map(([pair, count], i) => {
                                    const [s1, s2] = pair.split('_');
                                    return (
                                        <span key={pair}>
                                            {i > 0 && ' , '}
                                            <span className="text-gray-300">{stateNameMap[s1] || s1}</span>
                                            <span className="text-gray-600"> - </span>
                                            <span className="text-gray-300">{stateNameMap[s2] || s2}</span>
                                            <span className="text-gray-600"> ({count})</span>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                        {tradeTopology.isolated.length > 0 && (
                            <div className="text-[10px] text-red-400/70">
                                Isolated (0 trades): {tradeTopology.isolated.map(id => stateNameMap[id] || id).join(', ')}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnalysisPanel;
