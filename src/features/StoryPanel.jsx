// src/features/StoryPanel.jsx — Data-driven narrative with variable structure
import React, { useMemo } from "react";

const RESOURCE_LABELS = { water: "water", food: "food", energy: "energy", land: "land" };

/**
 * Generates a fully data-driven story with variable chapter count and content.
 * Chapters are created based on what actually happened, not fixed templates.
 */
function generateStory(history, collapsedStates) {
    const sections = [];
    const totalCycles = history.length;
    if (totalCycles === 0) return sections;

    const getStates = (h) => h.states || [];
    const getName = (id) => {
        const s = history[0]?.states?.find(x => x.id === id);
        return s?.name || id;
    };

    // ── Analyze the entire simulation to find interesting moments ────────
    const allEvents = history.filter(h => h.event).map(h => ({ cycle: h.cycle, ...h.event }));
    const allTrades = history.map(h => ({ cycle: h.cycle, count: (h.trades || []).length, trades: h.trades || [] }));
    const totalTrades = allTrades.reduce((s, t) => s + t.count, 0);
    const allianceCycles = history.filter(h => (h.alliances || []).length > 0);
    const firstAllianceCycle = allianceCycles.length > 0 ? allianceCycles[0].cycle : null;

    // Track dominant strategies over time
    const strategyShifts = {};
    const samplePoints = [
        Math.min(15, totalCycles - 1),
        Math.floor(totalCycles * 0.4),
        Math.floor(totalCycles * 0.7),
        totalCycles - 1
    ].filter((v, i, a) => v >= 0 && a.indexOf(v) === i);

    const stateIds = history[0]?.states?.map(s => s.id) || [];
    stateIds.forEach(id => {
        const strats = samplePoints.map(idx => {
            const s = history[idx]?.states?.find(x => x.id === id);
            if (!s?.strategy) return null;
            const top = Object.entries(s.strategy).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
            return top[0];
        }).filter(Boolean);
        if (strats.length >= 2 && strats[0] !== strats[strats.length - 1]) {
            strategyShifts[id] = { from: strats[0], to: strats[strats.length - 1], name: getName(id) };
        }
    });

    // Find peak and crisis moments
    const avgResources = history.map(h => {
        const alive = getStates(h).filter(s => s.alive !== false);
        if (alive.length === 0) return 0;
        return alive.reduce((sum, s) => {
            const r = s.resources || {};
            return sum + (r.water + r.food + r.energy + r.land) / 4;
        }, 0) / alive.length;
    });
    const peakCycle = avgResources.indexOf(Math.max(...avgResources));
    const troughCycle = avgResources.slice(5).reduce((minIdx, v, i) => v < avgResources[minIdx + 5] ? i : minIdx, 0) + 5;

    // Find most devastating event
    let worstEvent = null;
    allEvents.forEach(e => {
        if (!e.effects) return;
        const impact = Object.values(e.effects).reduce((s, v) => s + Math.min(0, v), 0);
        if (!worstEvent || impact < worstEvent.impact) {
            worstEvent = { ...e, impact };
        }
    });

    // Trade volume phases
    const earlyTrades = allTrades.slice(0, Math.min(25, totalCycles)).reduce((s, t) => s + t.count, 0);
    const lateTrades = totalCycles > 50 ? allTrades.slice(Math.floor(totalCycles * 0.6)).reduce((s, t) => s + t.count, 0) : 0;
    const tradeAccelerated = lateTrades > earlyTrades * 1.5;

    // Most active trader
    const traderCounts = {};
    history.forEach(h => {
        (h.trades || []).forEach(t => {
            traderCounts[t.from] = (traderCounts[t.from] || 0) + 1;
            traderCounts[t.to] = (traderCounts[t.to] || 0) + 1;
        });
    });
    const topTrader = Object.entries(traderCounts).sort((a, b) => b[1] - a[1])[0];

    // ── Build Sections Based on What Actually Happened ─────────────────

    // PROLOGUE — always present, describes initial conditions
    {
        const initial = getStates(history[0]);
        const richest = initial.reduce((a, b) => {
            const aAvg = a.resources ? (a.resources.water + a.resources.food + a.resources.energy + a.resources.land) / 4 : 0;
            const bAvg = b.resources ? (b.resources.water + b.resources.food + b.resources.energy + b.resources.land) / 4 : 0;
            return aAvg > bAvg ? a : b;
        });
        const poorest = initial.reduce((a, b) => {
            const aAvg = a.resources ? (a.resources.water + a.resources.food + a.resources.energy + a.resources.land) / 4 : 0;
            const bAvg = b.resources ? (b.resources.water + b.resources.food + b.resources.energy + b.resources.land) / 4 : 0;
            return aAvg < bAvg ? a : b;
        });
        const richRes = richest.resources ? Object.entries(richest.resources).reduce((a, b) => a[1] > b[1] ? a : b)[0] : "resources";
        const poorRes = poorest.resources ? Object.entries(poorest.resources).reduce((a, b) => a[1] < b[1] ? a : b)[0] : "resources";

        sections.push({
            title: "The Beginning",
            subtitle: "Cycle 1",
            text: `Eight AI governors took control of India's most diverse states. ${richest.name}, rich in ${RESOURCE_LABELS[richRes] || richRes}, held the strongest position, while ${poorest.name} began the simulation vulnerable \u2014 critically low on ${RESOURCE_LABELS[poorRes] || poorRes}. Each agent knew nothing about optimal strategy; they would have to learn through trial, error, and consequence.`,
            color: "amber",
        });
    }

    // FIRST CONTACT — if any trades happened early
    if (totalCycles > 10 && earlyTrades > 0) {
        const firstTradeH = history.find(h => (h.trades || []).length > 0);
        const firstTrade = firstTradeH?.trades?.[0];
        sections.push({
            title: "First Contact",
            subtitle: `Cycle ${firstTradeH?.cycle || '?'}`,
            text: firstTrade
                ? `The first trade emerged between ${getName(firstTrade.from)} and ${getName(firstTrade.to)} \u2014 ${firstTrade.gave.resource} exchanged for ${firstTrade.got.resource}. ${earlyTrades > 5 ? "A wave of cooperation followed as agents discovered the value of mutual aid." : "But trust was scarce; most states still fought alone."}`
                : `Early experiments in cooperation began, with ${earlyTrades} trades in the opening phase.`,
            color: "emerald",
        });
    } else if (totalCycles > 10) {
        sections.push({
            title: "Isolation",
            subtitle: "Cycles 1\u201325",
            text: "No state traded in the early phase. Each AI governor chose self-reliance, hoarding resources and hoping to outlast the others. This isolation would prove costly.",
            color: "gray",
        });
    }

    // CRISIS POINT — the worst event
    if (worstEvent && totalCycles > 15) {
        sections.push({
            title: "The Crisis",
            subtitle: `Cycle ${worstEvent.cycle}`,
            text: `"${worstEvent.headline}" \u2014 a devastating blow${worstEvent.stateId ? ` to ${getName(worstEvent.stateId)}` : " across all states"}. ${
                Math.abs(worstEvent.impact) > 30
                    ? "The impact was catastrophic, wiping out critical reserves and forcing immediate strategic pivots."
                    : "Resources shifted sharply, and agents scrambled to adapt their strategies."
            }${allEvents.length > 10 ? ` In total, ${allEvents.length} events reshaped the landscape throughout the simulation.` : ""}`,
            color: "red",
        });
    }

    // ALLIANCE FORMATION — if alliances formed
    if (firstAllianceCycle) {
        const allianceData = allianceCycles[0].alliances[0];
        sections.push({
            title: "The Alliance",
            subtitle: `Cycle ${firstAllianceCycle}`,
            text: `After sustained cooperation, ${allianceData ? `${getName(allianceData.states[0])} and ${getName(allianceData.states[1])} forged a formal alliance` : "a formal alliance emerged"} \u2014 trust exceeded 7, with ${allianceData?.trades || 'multiple'} successful trades behind them. Allied states gained preferential exchange rates, creating a positive feedback loop of prosperity.`,
            color: "violet",
        });
    }

    // STRATEGY EVOLUTION — if agents changed strategies
    const shifters = Object.values(strategyShifts);
    if (shifters.length > 0) {
        const examples = shifters.slice(0, 3);
        const shifts = examples.map(s => `${s.name} shifted from ${s.from} to ${s.to}`).join("; ");
        sections.push({
            title: "Adaptation",
            subtitle: `Observed across simulation`,
            text: `The AI agents didn't stay static \u2014 they evolved. ${shifts}. ${
                shifters.length > 3 ? `In total, ${shifters.length} of 8 states significantly changed their dominant strategy.` : ""
            } This adaptation is the core of reinforcement learning: agents that couldn't pivot to changing conditions fell behind.`,
            color: "purple",
        });
    }

    // TRADE DYNAMICS
    if (totalTrades > 5 && totalCycles > 30) {
        sections.push({
            title: tradeAccelerated ? "Trade Boom" : "Trade Patterns",
            subtitle: `${totalTrades} total trades`,
            text: tradeAccelerated
                ? `Trade volume surged in the later cycles \u2014 a clear sign that agents learned cooperation outperforms isolation. ${topTrader ? `${getName(topTrader[0])} emerged as the trade hub with ${topTrader[1]} exchanges, becoming the economic center of the network.` : ""}`
                : `Trade remained steady throughout the simulation with ${totalTrades} exchanges. ${topTrader ? `${getName(topTrader[0])} was the most active trader (${topTrader[1]} trades).` : ""} The agents that traded survived longer than those that didn't.`,
            color: "cyan",
        });
    }

    // COLLAPSE NARRATIVES — variable count based on actual data
    const fallen = collapsedStates || [];
    if (fallen.length > 0) {
        const earlyCollapses = fallen.filter(cs => (cs.cycle || cs.collapseCycle || 0) < totalCycles * 0.5);
        const lateCollapses = fallen.filter(cs => (cs.cycle || cs.collapseCycle || 0) >= totalCycles * 0.5);

        if (earlyCollapses.length > 0) {
            const names = earlyCollapses.map(cs => cs.name).join(", ");
            const reasons = earlyCollapses.map(cs => {
                const depleted = Object.entries(cs.resources || {}).filter(([, v]) => v <= 0).map(([k]) => k);
                return `${cs.name} (${depleted.length > 0 ? depleted.join(", ") + " depleted" : cs.reason || "resources exhausted"})`;
            }).join("; ");
            sections.push({
                title: `Early Collapse${earlyCollapses.length > 1 ? 's' : ''}`,
                subtitle: `${earlyCollapses.length} state${earlyCollapses.length > 1 ? 's' : ''} fell`,
                text: `${names} couldn't survive the first half of the simulation. Root causes: ${reasons}. These collapses reveal a critical insight \u2014 states that fail to diversify or trade early are the most vulnerable to resource shocks.`,
                color: "red",
            });
        }
        if (lateCollapses.length > 0) {
            const names = lateCollapses.map(cs => cs.name).join(", ");
            sections.push({
                title: "Late-Stage Decline",
                subtitle: `Cycle ${lateCollapses[0]?.cycle || lateCollapses[0]?.collapseCycle || '?'}+`,
                text: `Even with time to adapt, ${names} ultimately fell. Late collapses often result from cascading failures \u2014 losing a trade partner, compounded by an event, leading to a resource spiral that no strategy can fix.`,
                color: "orange",
            });
        }
    }

    // PEAK MOMENT
    if (totalCycles > 20 && peakCycle > 5) {
        sections.push({
            title: "Peak Prosperity",
            subtitle: `Cycle ${history[peakCycle]?.cycle || peakCycle}`,
            text: `Average resource levels peaked at cycle ${history[peakCycle]?.cycle || peakCycle} \u2014 the golden age of the simulation. ${
                peakCycle < totalCycles * 0.5
                    ? "But this prosperity was fragile. Resources declined steadily afterward as depletion outpaced regeneration."
                    : "Strong trade networks and adaptive strategies sustained the ecosystem into the later stages."
            }`,
            color: "emerald",
        });
    }

    // FINALE — always present, adapts to outcomes
    if (totalCycles > 30) {
        const final = getStates(history[totalCycles - 1]);
        const survivors = final.filter(s => s.alive !== false);
        const happiest = survivors.length > 0 ? survivors.reduce((a, b) => (a.happiness || 0) > (b.happiness || 0) ? a : b) : null;
        const richestFinal = survivors.length > 0 ? survivors.reduce((a, b) => (a.gdp || 0) > (b.gdp || 0) ? a : b) : null;

        let text = "";
        if (survivors.length === final.length) {
            text = `All ${final.length} states survived \u2014 a rare outcome that reflects strong adaptive strategies. `;
        } else if (survivors.length > 0) {
            text = `${survivors.length} of ${final.length} states endured to the end. ${fallen.length} fell to resource depletion. `;
        } else {
            text = `Total extinction \u2014 all states collapsed. A simulation that demonstrates how interconnected failure cascades when cooperation breaks down. `;
        }
        if (happiest && survivors.length > 0) {
            text += `${happiest.name} achieved the highest happiness (${happiest.happiness}), `;
        }
        if (richestFinal && survivors.length > 0) {
            text += `while ${richestFinal.name} built the largest economy (GDP ${richestFinal.gdp}). `;
        }
        if (totalTrades > 20 && survivors.length > 5) {
            text += "The simulation reveals that trade is the strongest predictor of survival \u2014 states that cooperated outlasted those that isolated.";
        } else if (fallen.length > 4) {
            text += "This simulation illustrates the fragility of resource-dependent economies \u2014 scarcity cascades are difficult to reverse once triggered.";
        } else if (shifters.length > 3) {
            text += "Adaptability proved decisive. States that shifted strategies in response to changing conditions outperformed those that stayed rigid.";
        } else {
            text += "The agents demonstrated that survival in a resource-scarce world demands both strategic flexibility and willingness to cooperate.";
        }

        sections.push({
            title: "The Verdict",
            subtitle: `After ${totalCycles} cycles`,
            text,
            color: survivors.length === final.length ? "emerald" : survivors.length > 4 ? "amber" : "red",
        });
    }

    return sections;
}

const COLOR_MAP = {
    amber: { ring: "from-amber-400/25 to-amber-500/10", border: "border-amber-400/40", text: "text-amber-300", connector: "from-amber-400/25" },
    emerald: { ring: "from-emerald-400/25 to-emerald-500/10", border: "border-emerald-400/40", text: "text-emerald-300", connector: "from-emerald-400/25" },
    red: { ring: "from-red-400/25 to-red-500/10", border: "border-red-400/40", text: "text-red-300", connector: "from-red-400/25" },
    violet: { ring: "from-violet-400/25 to-violet-500/10", border: "border-violet-400/40", text: "text-violet-300", connector: "from-violet-400/25" },
    purple: { ring: "from-purple-400/25 to-purple-500/10", border: "border-purple-400/40", text: "text-purple-300", connector: "from-purple-400/25" },
    cyan: { ring: "from-cyan-400/25 to-cyan-500/10", border: "border-cyan-400/40", text: "text-cyan-300", connector: "from-cyan-400/25" },
    orange: { ring: "from-orange-400/25 to-orange-500/10", border: "border-orange-400/40", text: "text-orange-300", connector: "from-orange-400/25" },
    gray: { ring: "from-gray-400/25 to-gray-500/10", border: "border-gray-400/40", text: "text-gray-300", connector: "from-gray-400/25" },
};

function StoryPanel({ history, collapsedStates }) {
    const story = useMemo(
        () => generateStory(history || [], collapsedStates || []),
        [history, collapsedStates]
    );

    if (story.length === 0) {
        return (
            <div className="glass-card-glow p-5">
                <h2 className="text-lg font-bold mb-3 text-amber-400 flex items-center gap-2.5 font-display">
                    Simulation Chronicle
                </h2>
                <p className="text-xs text-gray-500 italic">
                    The story will unfold as the simulation progresses...
                </p>
            </div>
        );
    }

    return (
        <div className="glass-card-glow p-5">
            <h2 className="text-lg font-bold mb-4 text-amber-400 flex items-center gap-2.5 font-display">
                Simulation Chronicle
            </h2>
            <div className="space-y-5">
                {story.map((section, idx) => {
                    const colors = COLOR_MAP[section.color] || COLOR_MAP.amber;
                    return (
                        <div key={idx} className="relative animate-slide-up" style={{ animationDelay: `${idx * 0.08}s` }}>
                            {idx < story.length - 1 && (
                                <div className={`absolute left-3.5 top-9 bottom-0 w-px bg-gradient-to-b ${colors.connector} to-transparent`} />
                            )}
                            <div className="flex items-start gap-3.5">
                                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${colors.ring} border ${colors.border}
                                flex items-center justify-center text-xs ${colors.text} font-bold mt-0.5 shrink-0 shadow-sm`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`text-sm font-bold ${colors.text} font-display`}>{section.title}</h3>
                                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{section.subtitle}</span>
                                    <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                                        {section.text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default StoryPanel;
