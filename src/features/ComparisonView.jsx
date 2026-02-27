// src/features/ComparisonView.jsx
import React from "react";

function MetricCard({ label, aiValue, randomValue }) {
    const aiNum = typeof aiValue === "number" ? aiValue : 0;
    const randNum = typeof randomValue === "number" ? randomValue : 0;
    const diff = aiNum - randNum;
    const pctDiff = randNum !== 0 ? Math.round((diff / randNum) * 100) : 0;

    return (
        <div className="p-3 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-800/30 border border-gray-700/40 hover:border-gray-600/50 transition-all">
            <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">{label}</p>
            <div className="flex items-end justify-between">
                {/* AI side */}
                <div className="text-center">
                    <p className="text-xl font-black text-violet-400 font-mono tabular-nums">{aiValue ?? "—"}</p>
                    <p className="text-[10px] text-violet-400/60 font-semibold uppercase tracking-wider">AI</p>
                </div>

                {/* Diff indicator */}
                <div className="text-center px-2">
                    {diff !== 0 && (
                        <span
                            className={`text-xs font-semibold px-1.5 py-0.5 rounded-full
                ${diff > 0
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                        >
                            {diff > 0 ? "+" : ""}{pctDiff}%
                        </span>
                    )}
                </div>

                {/* Random side */}
                <div className="text-center">
                    <p className="text-xl font-black text-orange-400 font-mono tabular-nums">{randomValue ?? "—"}</p>
                    <p className="text-[10px] text-orange-400/60 font-semibold uppercase tracking-wider">Random</p>
                </div>
            </div>
        </div>
    );
}

function ComparisonView({ aiResult, randomResult, onRunComparison }) {
    // Compute overall advantage
    const computeAdvantage = () => {
        if (!aiResult || !randomResult) return null;

        let aiScore = 0;
        let randScore = 0;

        if ((aiResult.survived || 0) > (randomResult.survived || 0)) aiScore++;
        else if ((aiResult.survived || 0) < (randomResult.survived || 0)) randScore++;

        if ((aiResult.avgHappiness || 0) > (randomResult.avgHappiness || 0)) aiScore++;
        else if ((aiResult.avgHappiness || 0) < (randomResult.avgHappiness || 0)) randScore++;

        if ((aiResult.totalTrades || 0) > (randomResult.totalTrades || 0)) aiScore++;
        else if ((aiResult.totalTrades || 0) < (randomResult.totalTrades || 0)) randScore++;

        if ((aiResult.totalGdp || 0) > (randomResult.totalGdp || 0)) aiScore++;
        else if ((aiResult.totalGdp || 0) < (randomResult.totalGdp || 0)) randScore++;

        if (aiScore > randScore) return { winner: "AI", score: aiScore, total: 4 };
        if (randScore > aiScore) return { winner: "Random", score: randScore, total: 4 };
        return { winner: "Tie", score: aiScore, total: 4 };
    };

    const advantage = computeAdvantage();

    // Placeholder when no data
    if (!aiResult && !randomResult) {
        return (
            <div className="glass-card-glow p-5">
                <h2 className="text-lg font-bold mb-4 text-red-400 flex items-center gap-2.5 font-display">
                    AI vs Random
                </h2>
                <p className="text-xs text-gray-500 italic text-center pt-2 pb-4">
                    Run 100 cycles each: Q-Learning AI vs Random agents — same world, different brains.
                </p>
                <button
                    id="comparison-run-btn"
                    onClick={onRunComparison}
                    className="w-full px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300
                               bg-gradient-to-r from-violet-500/15 via-fuchsia-500/10 to-orange-500/15
                               border border-violet-400/25 text-white
                               hover:from-violet-500/25 hover:via-fuchsia-500/15 hover:to-orange-500/25 hover:border-violet-400/50
                               hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-px
                               active:scale-[0.98]"
                >
                    Run Comparison (100 cycles)
                </button>
            </div>
        );
    }

    return (
        <div className="glass-card-glow p-5">
            <h2 className="text-lg font-bold mb-4 text-red-400 flex items-center gap-2.5 font-display">
                AI vs Random
            </h2>

            {/* Header labels */}
            <div className="flex justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-violet-400 to-violet-500 shadow-sm shadow-violet-400/30" />
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Q-Learning AI</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Random Agent</span>
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 shadow-sm shadow-orange-400/30" />
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-2">
                <MetricCard
                    label="States Survived"
                    aiValue={aiResult?.survived}
                    randomValue={randomResult?.survived}
                />
                <MetricCard
                    label="Avg Happiness"
                    aiValue={aiResult?.avgHappiness}
                    randomValue={randomResult?.avgHappiness}
                />
                <MetricCard
                    label="Total Trades"
                    aiValue={aiResult?.totalTrades}
                    randomValue={randomResult?.totalTrades}
                />
                <MetricCard
                    label="Total GDP"
                    aiValue={aiResult?.totalGdp}
                    randomValue={randomResult?.totalGdp}
                />
            </div>

            {/* Conclusion */}
            {advantage && (
                <div
                    className={`mt-4 p-3.5 rounded-xl text-center text-sm font-bold border animate-scale-in
            ${advantage.winner === "AI"
                            ? "bg-gradient-to-r from-violet-500/10 to-violet-500/5 border-violet-400/30 text-violet-300"
                            : advantage.winner === "Random"
                                ? "bg-gradient-to-r from-orange-500/10 to-orange-500/5 border-orange-400/30 text-orange-300"
                                : "bg-gray-500/10 border-gray-400/30 text-gray-300"
                        }`}
                    style={{ textShadow: '0 0 12px currentColor' }}
                >
                    {advantage.winner === "AI" && `AI wins ${advantage.score}/${advantage.total} metrics!`}
                    {advantage.winner === "Random" && `Random wins ${advantage.score}/${advantage.total} metrics!`}
                    {advantage.winner === "Tie" && `It's a tie — ${advantage.score}/${advantage.total} each!`}
                </div>
            )}
        </div>
    );
}

export default ComparisonView;
