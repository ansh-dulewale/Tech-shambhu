// src/features/StoryPanel.jsx
import React, { useMemo } from "react";

function generateStory(history, collapsedStates) {
    const chapters = [];
    const totalCycles = history.length;
    if (totalCycles === 0) return chapters;

    // Helper: get states from a history entry
    const getStates = (h) => h.states || [];

    // Helper: find top state by a metric in a range
    const topStateInRange = (start, end, metric) => {
        const slice = history.slice(start, Math.min(end, totalCycles));
        if (slice.length === 0) return null;
        const lastEntry = slice[slice.length - 1];
        const states = getStates(lastEntry);
        if (states.length === 0) return null;
        return states.reduce((best, s) => {
            const val = metric(s);
            return val > metric(best) ? s : best;
        }, states[0]);
    };

    // Helper: count events in range
    const eventsInRange = (start, end) => {
        return history.slice(start, Math.min(end, totalCycles))
            .filter((h) => h.event)
            .map((h) => h.event);
    };

    // Helper: count trades in range
    const tradesInRange = (start, end) => {
        return history.slice(start, Math.min(end, totalCycles))
            .reduce((count, h) => count + (h.trades ? h.trades.length : 0), 0);
    };

    // CHAPTER 1: Early Days (cycles 1–25)
    if (totalCycles >= 1) {
        const early = Math.min(25, totalCycles);
        const strongState = topStateInRange(0, early, (s) =>
            s.resources ? (s.resources.water + s.resources.food + s.resources.energy + s.resources.land) / 4 : 0
        );
        const earlyTrades = tradesInRange(0, early);
        const earlyEvents = eventsInRange(0, early);

        let text = "";
        if (strongState) {
            const topResource = strongState.resources
                ? Object.entries(strongState.resources).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
                : "resources";
            text += `${strongState.name}, blessed with abundant ${topResource}, emerged as an early leader. `;
        }
        if (earlyTrades > 0) {
            text += `${earlyTrades} trade${earlyTrades > 1 ? "s" : ""} were formed in the opening rounds, hinting at early cooperation. `;
        } else {
            text += "States focused inward, building their own reserves before reaching out. ";
        }
        if (earlyEvents.length > 0) {
            text += `The first news events began shaking the landscape — "${earlyEvents[0].headline}."`;
        }

        chapters.push({
            title: "🌅 Chapter 1: Early Days",
            subtitle: `Cycles 1–${early}`,
            text: text.trim(),
        });
    }

    // CHAPTER 2: First Crisis (cycles 25–50)
    if (totalCycles > 25) {
        const crisisEvents = eventsInRange(25, 50);
        const worstHit = topStateInRange(25, Math.min(50, totalCycles), (s) =>
            s.resources ? -(s.resources.water + s.resources.food + s.resources.energy + s.resources.land) / 4 : 0
        );

        let text = "";
        if (crisisEvents.length > 0) {
            const bigEvent = crisisEvents[0];
            text += `When "${bigEvent.headline}" struck${bigEvent.stateId ? ` ${bigEvent.stateId}` : ""}, the AI agents were forced to adapt. `;
        }
        if (worstHit) {
            text += `${worstHit.name} found itself under the most pressure, with resources dwindling rapidly. `;
        }
        const midTrades = tradesInRange(25, 50);
        text += midTrades > 3
            ? "Trade networks intensified as states scrambled for survival."
            : "Cooperation remained scarce, and states relied on their own reserves.";

        chapters.push({
            title: "⚡ Chapter 2: First Crisis",
            subtitle: "Cycles 25–50",
            text: text.trim(),
        });
    }

    // CHAPTER 3: Alliances & Rivalries (cycles 50–75)
    if (totalCycles > 50) {
        const alliances = history.slice(50, Math.min(75, totalCycles))
            .flatMap((h) => h.alliances || []);
        const lateTrades = tradesInRange(50, 75);

        let text = "";
        if (alliances.length > 0) {
            text += `A powerful alliance formed, reshaping the balance of power. `;
        }
        if (lateTrades > 10) {
            text += "Trade became the lifeblood of the surviving states — those who traded thrived, those who didn't withered. ";
        } else {
            text += "Trade remained limited; self-reliance was the dominant strategy. ";
        }
        const collapsed = (collapsedStates || []).filter(
            (cs) => cs.collapseCycle && cs.collapseCycle >= 50 && cs.collapseCycle < 75
        );
        if (collapsed.length > 0) {
            text += `${collapsed.map((c) => c.name).join(" and ")} fell during this period, unable to sustain their populations.`;
        }

        chapters.push({
            title: "🤝 Chapter 3: Alliances & Rivalries",
            subtitle: "Cycles 50–75",
            text: text.trim(),
        });
    }

    // CHAPTER 4: The Outcome (cycles 75–100)
    if (totalCycles > 75) {
        const finalStates = getStates(history[totalCycles - 1]);
        const survivors = finalStates.filter((s) => s.alive !== false);
        const fallen = collapsedStates || [];

        let text = "";
        if (survivors.length === finalStates.length) {
            text += "Against all odds, every state survived the full simulation. Cooperation and adaptation proved essential. ";
        } else if (survivors.length > 0) {
            text += `${survivors.length} of ${finalStates.length} states survived. `;
            if (survivors.length > 0) {
                const champion = survivors.reduce((a, b) =>
                    (a.happiness || 0) > (b.happiness || 0) ? a : b
                );
                text += `${champion.name} emerged as the most prosperous, with the highest happiness. `;
            }
        } else {
            text += "Complete collapse — no state survived the full simulation. A sobering outcome. ";
        }

        if (fallen.length > 0) {
            fallen.forEach((cs) => {
                text += `${cs.name} collapsed${cs.reason ? ` because ${cs.reason}` : ""}. `;
            });
        }

        chapters.push({
            title: "🏁 Chapter 4: The Outcome",
            subtitle: `Cycles 75–${totalCycles}`,
            text: text.trim(),
        });
    }

    return chapters;
}

function StoryPanel({ history, collapsedStates }) {
    const story = useMemo(
        () => generateStory(history || [], collapsedStates || []),
        [history, collapsedStates]
    );

    if (story.length === 0) {
        return (
            <div className="glass-card p-4">
                <h2 className="text-lg font-semibold mb-3 text-amber-400 flex items-center gap-2">
                    <span className="animate-glow">📖</span> Story
                </h2>
                <p className="text-xs text-gray-500 italic">
                    The story will unfold as the simulation progresses...
                </p>
            </div>
        );
    }

    return (
        <div className="glass-card p-4">
            <h2 className="text-lg font-semibold mb-3 text-amber-400 flex items-center gap-2">
                <span className="animate-glow">📖</span> Story
            </h2>
            <div className="space-y-4">
                {story.map((chapter, idx) => (
                    <div key={idx} className="relative">
                        {/* Timeline connector */}
                        {idx < story.length - 1 && (
                            <div className="absolute left-3 top-8 bottom-0 w-px bg-amber-400/20" />
                        )}
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400/40
                            flex items-center justify-center text-xs text-amber-300 mt-0.5 shrink-0">
                                {idx + 1}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-amber-300">{chapter.title}</h3>
                                <span className="text-xs text-gray-500">{chapter.subtitle}</span>
                                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                                    {chapter.text}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default StoryPanel;
