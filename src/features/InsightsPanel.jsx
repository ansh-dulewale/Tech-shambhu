// src/features/InsightsPanel.jsx — Real-world parallels, quantitative strategy analysis, cross-run stats
import React, { useMemo, useState, useCallback } from "react";

const STRATEGY_COLORS = {
    TRADE: "#00e676", CONSERVE: "#40c4ff", INNOVATE: "#ffab00",
    HARVEST: "#ff9100", EXPAND: "#e040fb", DEFEND: "#7c4dff",
};

const RESOURCE_LABELS = { water: "Water", food: "Food", energy: "Energy", land: "Land" };

// ── Real-World Parallel Database ─────────────────────────────────
const PARALLELS = {
    isolation_collapse: {
        icon: "🇰🇵",
        title: "North Korea Effect",
        real: "Similar to how North Korea's self-imposed isolation led to the 1990s famine that killed ~3 million, isolated states in our simulation collapsed significantly faster.",
        match: (d) =>
            d.isolatedCollapsed > 0 &&
            d.isolatedCollapseRate > d.tradingCollapseRate,
        stat: (d) =>
            `Isolated states collapsed ${d.isolatedVsTradingFactor}x faster than trading states.`,
    },
    trade_prosperity: {
        icon: "🇸🇬",
        title: "Singapore Model",
        real: "This mirrors Singapore's transformation — a resource-poor city-state that became wealthy through aggressive trade networks and strategic partnerships.",
        match: (d) => d.topTrader && d.topTrader.survived && d.topTrader.trades > 5,
        stat: (d) =>
            `${d.topTrader.name} replicated this by building ${d.topTrader.trades} trade connections — surviving with ${d.topTrader.happiness}% happiness.`,
    },
    water_crisis: {
        icon: "🏜️",
        title: "Rajasthan / Israel Water Parallel",
        real: "Echoes Rajasthan's chronic water crisis and Israel's real-world struggle — where water scarcity drives agricultural failure and population decline without technological intervention.",
        match: (d) => d.waterCollapses > 0,
        stat: (d) =>
            `${d.waterCollapses} state${d.waterCollapses > 1 ? "s" : ""} collapsed primarily due to water depletion — mirroring real arid-region failures.`,
    },
    breadbasket: {
        icon: "🌾",
        title: "Punjab Breadbasket Effect",
        real: "Parallels Punjab's real-world role as India's breadbasket — food-surplus states that traded became economic stabilizers for the entire network.",
        match: (d) => d.foodSurplusTraders.length > 0,
        stat: (d) =>
            `${d.foodSurplusTraders.join(", ")} acted as breadbasket${d.foodSurplusTraders.length > 1 ? "s" : ""}, sustaining the ecosystem through food exports.`,
    },
    alliance_eu: {
        icon: "🇪🇺",
        title: "EU Common Market",
        real: "Like the European Union's economic integration, allied states in the simulation achieved mutual prosperity through preferential trade agreements and trust-building.",
        match: (d) => d.allianceCount > 0,
        stat: (d) =>
            `${d.allianceCount} alliance${d.allianceCount > 1 ? "s" : ""} formed — allied states had ${d.allianceSurvivalPct}% survival vs ${d.nonAllianceSurvivalPct}% for non-allied states.`,
    },
    climate_cascade: {
        icon: "🌡️",
        title: "IPCC Climate Projections",
        real: "Mirrors IPCC climate models — progressive environmental stress doesn't just add linear damage; it creates non-linear cascading failures as ecosystems cross tipping points.",
        match: (d) => d.climateEvents > 3,
        stat: (d) =>
            `${d.climateEvents} climate-driven disasters occurred, with intensity escalating ${d.climateIntensityRatio}x from early to late simulation.`,
    },
    resource_curse: {
        icon: "🛢️",
        title: "Dutch Disease / Resource Curse",
        real: "Similar to Venezuela's oil dependence or the 'Dutch Disease' — states with high initial resources but poor strategy diversification collapsed when those resources depleted.",
        match: (d) => d.richCollapsed.length > 0,
        stat: (d) =>
            `${d.richCollapsed.join(", ")} started resource-rich but collapsed — demonstrating the 'resource curse' phenomenon.`,
    },
};

// ── Section 1: Real-World Parallels ──────────────────────────────
function computeParallelData(history, states, collapsedStates) {
    const data = {};
    const allTrades = history.flatMap((h) => h.trades || []);
    const stateTradeCount = {};
    allTrades.forEach((t) => {
        stateTradeCount[t.from] = (stateTradeCount[t.from] || 0) + 1;
        stateTradeCount[t.to] = (stateTradeCount[t.to] || 0) + 1;
    });

    const allIds = history[0]?.states?.map((s) => s.id) || [];
    const nameMap = {};
    (history[0]?.states || []).forEach((s) => (nameMap[s.id] = s.name));
    const isolatedIds = allIds.filter((id) => !stateTradeCount[id]);
    const tradingIds = allIds.filter((id) => stateTradeCount[id] > 0);
    const collapsedIds = new Set((collapsedStates || []).map((c) => c.id));

    data.isolatedCollapsed = isolatedIds.filter((id) => collapsedIds.has(id)).length;
    data.tradingCollapsed = tradingIds.filter((id) => collapsedIds.has(id)).length;
    data.isolatedCollapseRate =
        isolatedIds.length > 0 ? data.isolatedCollapsed / isolatedIds.length : 0;
    data.tradingCollapseRate =
        tradingIds.length > 0 ? data.tradingCollapsed / tradingIds.length : 0;
    data.isolatedVsTradingFactor =
        data.tradingCollapseRate > 0
            ? Math.round((data.isolatedCollapseRate / data.tradingCollapseRate) * 10) / 10
            : data.isolatedCollapsed > 0
                ? "∞"
                : 0;

    // Top trader
    const topTraderId = Object.entries(stateTradeCount).sort((a, b) => b[1] - a[1])[0];
    if (topTraderId) {
        const st = states.find((s) => s.id === topTraderId[0]);
        data.topTrader = {
            name: nameMap[topTraderId[0]] || topTraderId[0],
            trades: topTraderId[1],
            survived: st?.alive !== false,
            happiness: st?.happiness || 0,
        };
    }

    // Water collapses
    data.waterCollapses = (collapsedStates || []).filter(
        (c) => c.resources && c.resources.water <= 0
    ).length;

    // Food surplus traders
    const foodSurplusTraders = [];
    (states || []).forEach((s) => {
        if (s.resources?.food > 55 && stateTradeCount[s.id] > 3) {
            foodSurplusTraders.push(s.name);
        }
    });
    data.foodSurplusTraders = foodSurplusTraders;

    // Alliances
    const lastAlliances = history[history.length - 1]?.alliances || [];
    data.allianceCount = lastAlliances.length;
    const alliedIds = new Set(lastAlliances.flatMap((a) => a.states || []));
    const aliveStates = (states || []).filter((s) => s.alive !== false);
    const alliedAlive = aliveStates.filter((s) => alliedIds.has(s.id)).length;
    const nonAlliedAlive = aliveStates.filter((s) => !alliedIds.has(s.id)).length;
    const alliedTotal = allIds.filter((id) => alliedIds.has(id)).length;
    const nonAlliedTotal = allIds.filter((id) => !alliedIds.has(id)).length;
    data.allianceSurvivalPct =
        alliedTotal > 0 ? Math.round((alliedAlive / alliedTotal) * 100) : 0;
    data.nonAllianceSurvivalPct =
        nonAlliedTotal > 0 ? Math.round((nonAlliedAlive / nonAlliedTotal) * 100) : 0;

    // Climate events
    const events = history.filter((h) => h.event).map((h) => h.event);
    const climateTypes = ["drought", "flood", "heatwave", "deforestation"];
    const climateEvents = events.filter((e) => climateTypes.includes(e.type) || e.source === "climate-system");
    data.climateEvents = climateEvents.length;
    const halfIdx = Math.floor(climateEvents.length / 2);
    const earlyClimate = climateEvents.slice(0, Math.max(halfIdx, 1)).length;
    const lateClimate = climateEvents.slice(halfIdx).length;
    data.climateIntensityRatio =
        earlyClimate > 0 ? Math.round((lateClimate / earlyClimate) * 10) / 10 : lateClimate;

    // Rich states that collapsed (resource curse)
    const initialStates = history[0]?.states || [];
    const richCollapsed = [];
    initialStates.forEach((s) => {
        const avg = s.resources
            ? (s.resources.water + s.resources.food + s.resources.energy + s.resources.land) / 4
            : 0;
        if (avg > 55 && collapsedIds.has(s.id)) {
            richCollapsed.push(s.name);
        }
    });
    data.richCollapsed = richCollapsed;

    return data;
}

// ── Section 2: Quantitative Strategy Analysis ────────────────────
function computeStrategyStats(history, states, collapsedStates) {
    if (history.length < 30) return null;
    const stateIds = history[0]?.states?.map((s) => s.id) || [];
    const nameMap = {};
    (history[0]?.states || []).forEach((s) => (nameMap[s.id] = s.name));

    // Determine dominant strategy for each state (over the full sim)
    const dominantStrategy = {};
    stateIds.forEach((id) => {
        const actionCounts = {};
        history.forEach((h) => {
            const st = (h.states || []).find((s) => s.id === id);
            if (st?.strategy) {
                Object.entries(st.strategy).forEach(([action, pct]) => {
                    actionCounts[action] = (actionCounts[action] || 0) + pct;
                });
            }
        });
        const top = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0];
        if (top) dominantStrategy[id] = top[0];
    });

    // Find when each state collapsed (or survived full sim)
    const survivalCycles = {};
    const collapsedIds = new Set((collapsedStates || []).map((c) => c.id));
    stateIds.forEach((id) => {
        if (collapsedIds.has(id)) {
            const cs = (collapsedStates || []).find((c) => c.id === id);
            survivalCycles[id] = cs?.cycle || cs?.collapseCycle || history.length;
        } else {
            survivalCycles[id] = history.length;
        }
    });

    // Group by strategy
    const strategyGroups = {};
    Object.entries(dominantStrategy).forEach(([id, strat]) => {
        if (!strategyGroups[strat]) strategyGroups[strat] = [];
        strategyGroups[strat].push({
            id,
            name: nameMap[id] || id,
            survived: survivalCycles[id],
            alive: !collapsedIds.has(id),
            happiness: (states || []).find((s) => s.id === id)?.happiness || 0,
            gdp: (states || []).find((s) => s.id === id)?.gdp || 0,
        });
    });

    // Compute per-strategy metrics
    const insights = [];
    const maxCycles = history.length;
    const stratEntries = Object.entries(strategyGroups).sort(
        (a, b) => b[1].length - a[1].length
    );

    stratEntries.forEach(([strat, members]) => {
        const avgSurvival = Math.round(
            members.reduce((s, m) => s + m.survived, 0) / members.length
        );
        const survivalPct = Math.round((avgSurvival / maxCycles) * 100);
        const aliveCount = members.filter((m) => m.alive).length;
        const avgHappiness = Math.round(
            members.reduce((s, m) => s + m.happiness, 0) / members.length
        );
        const avgGdp = Math.round(
            members.reduce((s, m) => s + m.gdp, 0) / members.length
        );
        insights.push({
            strategy: strat,
            count: members.length,
            states: members.map((m) => m.name),
            avgSurvival,
            survivalPct,
            aliveCount,
            avgHappiness,
            avgGdp,
        });
    });

    // Generate comparative statements
    const comparisons = [];
    if (insights.length >= 2) {
        const sorted = [...insights].sort((a, b) => b.avgSurvival - a.avgSurvival);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];
        if (best.strategy !== worst.strategy) {
            const pctBetter = Math.round(
                ((best.avgSurvival - worst.avgSurvival) / Math.max(worst.avgSurvival, 1)) * 100
            );
            comparisons.push(
                `States that used ${best.strategy} as primary strategy survived ${pctBetter}% longer on average than ${worst.strategy}-dominant states.`
            );
        }
        const happiest = [...insights].sort((a, b) => b.avgHappiness - a.avgHappiness)[0];
        if (happiest.avgHappiness > 0) {
            comparisons.push(
                `${happiest.strategy}-dominant states achieved the highest average happiness at ${happiest.avgHappiness}%.`
            );
        }
        const richest = [...insights].sort((a, b) => b.avgGdp - a.avgGdp)[0];
        if (richest.avgGdp > 0) {
            comparisons.push(
                `${richest.strategy} strategy produced the most GDP (avg ${richest.avgGdp}) — ${richest.states.join(", ")}.`
            );
        }
    }

    return { insights, comparisons };
}

// ══════════════════════════════════════════════════════════════════
// InsightsPanel Component
// ══════════════════════════════════════════════════════════════════
function InsightsPanel({
    history,
    states,
    collapsedStates,
    crossRunResults,
    onRunCrossAnalysis,
    crossRunLoading,
}) {
    // ── Real-world parallels ──────────────────────────────────────
    const parallels = useMemo(() => {
        if (!history || history.length < 30) return [];
        const data = computeParallelData(history, states || [], collapsedStates || []);
        return Object.values(PARALLELS).filter((p) => p.match(data)).map((p) => ({
            ...p,
            statText: p.stat(data),
        }));
    }, [history, states, collapsedStates]);

    // ── Quantitative strategy analysis ────────────────────────────
    const strategyStats = useMemo(
        () => computeStrategyStats(history || [], states || [], collapsedStates || []),
        [history, states, collapsedStates]
    );

    // ── Cross-run aggregation (derived from results) ──────────────
    const crossRunAgg = useMemo(() => {
        if (!crossRunResults || crossRunResults.length === 0) return null;
        const N = crossRunResults.length;
        const stratWins = {};
        let totalSurvived = 0;
        let totalTrades = 0;
        let totalGdp = 0;
        let totalHappiness = 0;
        crossRunResults.forEach((r) => {
            stratWins[r.topStrategy] = (stratWins[r.topStrategy] || 0) + 1;
            totalSurvived += r.survived;
            totalTrades += r.totalTrades;
            totalGdp += r.totalGdp;
            totalHappiness += r.avgHappiness;
        });
        const sortedStrats = Object.entries(stratWins).sort((a, b) => b[1] - a[1]);
        const bestStrat = sortedStrats[0];
        return {
            runs: N,
            stratWins: sortedStrats,
            bestStrategy: bestStrat ? bestStrat[0] : "N/A",
            bestWins: bestStrat ? bestStrat[1] : 0,
            avgSurvived: Math.round((totalSurvived / N) * 10) / 10,
            avgTrades: Math.round(totalTrades / N),
            avgGdp: Math.round(totalGdp / N),
            avgHappiness: Math.round(totalHappiness / N),
            allResults: crossRunResults,
        };
    }, [crossRunResults]);

    return (
        <div className="glass-card p-5 animate-slide-up space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2.5 font-display">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-400 to-blue-500" />
                Simulation Insights & Proof
            </h2>

            {/* ── Section 1: Real-World Parallels ──────────────── */}
            {parallels.length > 0 && (
                <div>
                    <h3 className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1 h-3 rounded-full bg-gradient-to-b from-sky-400/60 to-transparent" />
                        Real-World Parallels
                    </h3>
                    <div className="space-y-2.5">
                        {parallels.map((p, i) => (
                            <div
                                key={i}
                                className="p-3 rounded-xl bg-sky-900/10 border border-sky-500/15 hover:border-sky-400/30 transition-all card-entrance"
                                style={{ animationDelay: `${i * 0.08}s` }}
                            >
                                <div className="flex items-start gap-2.5">
                                    <span className="text-lg mt-0.5">{p.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-sky-300">{p.title}</h4>
                                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                                            {p.real}
                                        </p>
                                        <p className="text-[10px] text-sky-400/80 mt-1.5 font-medium bg-sky-500/8 px-2 py-1 rounded-lg inline-block">
                                            📊 {p.statText}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {parallels.length === 0 && history && history.length >= 30 && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                    <p className="text-xs text-zinc-500">
                        No strong real-world parallels detected yet. Run the simulation longer
                        for more data.
                    </p>
                </div>
            )}

            {/* ── Section 2: Quantitative Strategy Analysis ────── */}
            {strategyStats && (
                <div>
                    <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1 h-3 rounded-full bg-gradient-to-b from-amber-400/60 to-transparent" />
                        Strategy X worked Y% Better
                    </h3>

                    {/* Comparative statements */}
                    {strategyStats.comparisons.length > 0 && (
                        <div className="space-y-1.5 mb-3">
                            {strategyStats.comparisons.map((c, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-900/10 border border-amber-500/12 card-entrance"
                                    style={{ animationDelay: `${i * 0.06}s` }}
                                >
                                    <span className="text-amber-400 text-xs mt-0.5">▸</span>
                                    <p className="text-[11px] text-amber-200 font-medium leading-relaxed">
                                        {c}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Strategy breakdown table */}
                    <div className="space-y-1.5">
                        {strategyStats.insights.map((s) => (
                            <div
                                key={s.strategy}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all text-xs"
                            >
                                <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: STRATEGY_COLORS[s.strategy] || "#888" }}
                                />
                                <span
                                    className="font-bold w-20 text-[11px]"
                                    style={{ color: STRATEGY_COLORS[s.strategy] || "#aaa" }}
                                >
                                    {s.strategy}
                                </span>
                                <span className="text-[10px] text-gray-500 w-10">
                                    {s.count} state{s.count > 1 ? "s" : ""}
                                </span>
                                <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${s.survivalPct}%`,
                                            backgroundColor: STRATEGY_COLORS[s.strategy] || "#888",
                                            opacity: 0.7,
                                        }}
                                    />
                                </div>
                                <span className="text-[10px] font-mono font-bold text-gray-400 w-12 text-right tabular-nums">
                                    {s.survivalPct}% surv
                                </span>
                                <span className="text-[10px] font-mono text-gray-500 w-10 text-right tabular-nums">
                                    H{s.avgHappiness}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Section 3: Cross-Run Statistical Analysis ────── */}
            <div>
                <h3 className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1 h-3 rounded-full bg-gradient-to-b from-violet-400/60 to-transparent" />
                    Cross-Run Statistical Proof
                    <span className="text-[8px] text-zinc-600 font-normal ml-1">(10 independent simulations)</span>
                </h3>

                {!crossRunAgg && (
                    <button
                        onClick={onRunCrossAnalysis}
                        disabled={crossRunLoading}
                        className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border
              ${crossRunLoading
                                ? "bg-violet-900/20 border-violet-500/15 text-violet-400/50 cursor-wait"
                                : "bg-violet-500/10 border-violet-500/20 text-violet-300 hover:bg-violet-500/20 hover:border-violet-400/30 hover:shadow-lg hover:shadow-violet-500/10 active:scale-[0.98]"
                            }`}
                    >
                        {crossRunLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-3 h-3 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                                Running 10 simulations...
                            </span>
                        ) : (
                            "🔬 Run 10x Cross-Run Analysis"
                        )}
                    </button>
                )}

                {crossRunAgg && (
                    <div className="space-y-3 animate-slide-up">
                        {/* Headline result */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-violet-900/20 to-purple-900/10 border border-violet-500/20">
                            <div className="text-center mb-3">
                                <p className="text-sm font-bold text-violet-300">
                                    <span
                                        className="text-lg"
                                        style={{ color: STRATEGY_COLORS[crossRunAgg.bestStrategy] || "#fff" }}
                                    >
                                        {crossRunAgg.bestStrategy}
                                    </span>{" "}
                                    strategy won{" "}
                                    <span className="text-white text-lg font-mono">
                                        {crossRunAgg.bestWins}/{crossRunAgg.runs}
                                    </span>{" "}
                                    runs
                                </p>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    Dominant strategy among surviving states across {crossRunAgg.runs}{" "}
                                    independent simulations
                                </p>
                            </div>

                            {/* Strategy win distribution */}
                            <div className="flex items-end justify-center gap-2 h-20 mb-2">
                                {crossRunAgg.stratWins.map(([strat, wins]) => (
                                    <div key={strat} className="flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-mono font-bold text-gray-300">
                                            {wins}
                                        </span>
                                        <div
                                            className="w-8 rounded-t-lg transition-all"
                                            style={{
                                                height: `${(wins / crossRunAgg.runs) * 100}%`,
                                                backgroundColor: STRATEGY_COLORS[strat] || "#888",
                                                minHeight: "4px",
                                                opacity: 0.8,
                                            }}
                                        />
                                        <span
                                            className="text-[8px] font-bold"
                                            style={{ color: STRATEGY_COLORS[strat] || "#888" }}
                                        >
                                            {strat}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Aggregate stats */}
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { label: "Avg Survival", value: `${crossRunAgg.avgSurvived}/8`, color: "text-emerald-400" },
                                { label: "Avg Trades", value: crossRunAgg.avgTrades, color: "text-cyan-400" },
                                { label: "Avg GDP", value: crossRunAgg.avgGdp, color: "text-amber-400" },
                                { label: "Avg Happy", value: `${crossRunAgg.avgHappiness}%`, color: "text-pink-400" },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="text-center p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                                >
                                    <div className={`text-sm font-bold font-mono tabular-nums ${stat.color}`}>
                                        {stat.value}
                                    </div>
                                    <div className="text-[8px] text-gray-500 uppercase tracking-wider mt-0.5">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Per-run breakdown */}
                        <div>
                            <h4 className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5 font-bold">
                                Per-Run Results
                            </h4>
                            <div className="grid grid-cols-5 gap-1.5">
                                {crossRunAgg.allResults.map((r, i) => (
                                    <div
                                        key={i}
                                        className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center card-entrance"
                                        style={{ animationDelay: `${i * 0.04}s` }}
                                        title={`Run ${i + 1}: ${r.survived}/8 survived, top strategy: ${r.topStrategy}`}
                                    >
                                        <div className="text-[9px] text-gray-600 font-mono">R{i + 1}</div>
                                        <div className="text-[11px] font-bold text-gray-300 font-mono">
                                            {r.survived}/8
                                        </div>
                                        <div
                                            className="text-[8px] font-bold mt-0.5"
                                            style={{ color: STRATEGY_COLORS[r.topStrategy] || "#888" }}
                                        >
                                            {r.topStrategy}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Re-run button */}
                        <button
                            onClick={onRunCrossAnalysis}
                            disabled={crossRunLoading}
                            className="w-full py-2 rounded-lg text-[10px] font-semibold text-violet-400/70 bg-violet-500/5 border border-violet-500/10 hover:bg-violet-500/10 transition-all"
                        >
                            ↻ Re-run Analysis
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default InsightsPanel;
