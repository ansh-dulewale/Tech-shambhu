// src/features/ComparisonView.jsx
import React from "react";

function MetricCard({ label, aiValue, randomValue }) {
    const aiNum = typeof aiValue === "number" ? aiValue : 0;
    const randNum = typeof randomValue === "number" ? randomValue : 0;
    const diff = aiNum - randNum;
    const pctDiff = randNum !== 0 ? Math.round((diff / randNum) * 100) : 0;

    return (
        <div className="p-2.5 rounded-lg bg-gray-800/40 border border-gray-700/50">
            <p className="text-xs text-gray-400 mb-1.5">{label}</p>
            <div className="flex items-end justify-between">
                {/* AI side */}
                <div className="text-center">
                    <p className="text-lg font-bold text-cyan-400">{aiValue ?? "—"}</p>
                    <p className="text-xs text-cyan-400/60">AI</p>
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
                    <p className="text-lg font-bold text-orange-400">{randomValue ?? "—"}</p>
                    <p className="text-xs text-orange-400/60">Random</p>
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
            <div className="glass-card p-4">
                <h2 className="text-lg font-semibold mb-3 text-red-400 flex items-center gap-2">
                    ⚔️ AI vs Random
                </h2>
                <p className="text-xs text-gray-500 italic text-center pt-3 pb-2">
                    Run 100 cycles each: Q-Learning AI vs Random agents — same world, different brains.
                </p>
                <button
                    id="comparison-run-btn"
                    onClick={onRunComparison}
                    className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300
                               bg-gradient-to-r from-cyan-500/20 to-orange-500/20
                               border border-cyan-400/30 text-white
                               hover:from-cyan-500/30 hover:to-orange-500/30 hover:border-cyan-400/50
                               hover:shadow-lg hover:shadow-cyan-500/10
                               active:scale-[0.98]"
                >
                    ⚔️ Run Comparison (100 cycles)
                </button>
            </div>
        );
    }

    return (
        <div className="glass-card p-4">
            <h2 className="text-lg font-semibold mb-3 text-red-400 flex items-center gap-2">
                ⚔️ AI vs Random
            </h2>

            {/* Header labels */}
            <div className="flex justify-between mb-3 px-1">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="text-xs font-medium text-cyan-400">Q-Learning AI</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-orange-400">Random Agent</span>
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-2">
                <MetricCard
                    label="🏠 States Survived"
                    aiValue={aiResult?.survived}
                    randomValue={randomResult?.survived}
                />
                <MetricCard
                    label="😊 Avg Happiness"
                    aiValue={aiResult?.avgHappiness}
                    randomValue={randomResult?.avgHappiness}
                />
                <MetricCard
                    label="🤝 Total Trades"
                    aiValue={aiResult?.totalTrades}
                    randomValue={randomResult?.totalTrades}
                />
                <MetricCard
                    label="💰 Total GDP"
                    aiValue={aiResult?.totalGdp}
                    randomValue={randomResult?.totalGdp}
                />
            </div>

            {/* Conclusion */}
            {advantage && (
                <div
                    className={`mt-3 p-2.5 rounded-lg text-center text-sm font-semibold border
            ${advantage.winner === "AI"
                            ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-300"
                            : advantage.winner === "Random"
                                ? "bg-orange-500/10 border-orange-400/30 text-orange-300"
                                : "bg-gray-500/10 border-gray-400/30 text-gray-300"
                        }`}
                >
                    {advantage.winner === "AI" && `🏆 AI wins ${advantage.score}/${advantage.total} metrics!`}
                    {advantage.winner === "Random" && `😱 Random wins ${advantage.score}/${advantage.total} metrics!`}
                    {advantage.winner === "Tie" && `🤝 It's a tie — ${advantage.score}/${advantage.total} each!`}
                </div>
            )}
        </div>
    );
}

export default ComparisonView;
