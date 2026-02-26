// src/features/WhatIfPanel.jsx
import React, { useState } from "react";

const SCENARIOS = [
    {
        id: "no_water_rajasthan",
        label: "What if Rajasthan had no water?",
        emoji: "🏜️",
        description: "Rajasthan starts with water = 5",
        changes: { rajasthan: { water: 5 } },
        color: "#ff9100",
    },
    {
        id: "no_trade",
        label: "What if no trade allowed?",
        emoji: "🚫",
        description: "All trade is disabled globally",
        changes: { global: { tradeDisabled: true } },
        color: "#ff1744",
    },
    {
        id: "double_disasters",
        label: "What if disasters doubled?",
        emoji: "💥",
        description: "Event rate increased to 60%",
        changes: { global: { eventRate: 0.6 } },
        color: "#ff5252",
    },
    {
        id: "full_cooperation",
        label: "What if all states cooperated?",
        emoji: "🤝",
        description: "All states forced to trade every cycle",
        changes: { global: { forceTrade: true } },
        color: "#00e676",
    },
    {
        id: "double_population_up",
        label: "What if UP population doubled?",
        emoji: "👥",
        description: "Uttar Pradesh population starts at 1400",
        changes: { uttarpradesh: { population: 1400 } },
        color: "#40c4ff",
    },
];

function WhatIfPanel({ onRunScenario, scenarioResult }) {
    const [activeScenario, setActiveScenario] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    const handleRun = (scenario) => {
        setActiveScenario(scenario.id);
        setIsRunning(true);
        onRunScenario(scenario);
        // Simulation completes externally, isRunning reset via scenarioResult
        setTimeout(() => setIsRunning(false), 2000);
    };

    return (
        <div className="glass-card-glow p-5">
            <h2 className="text-lg font-bold mb-4 text-purple-400 flex items-center gap-2.5 font-display">
                <span className="animate-glow text-xl">🔮</span> What-If Scenarios
            </h2>

            <div className="space-y-2.5">
                {SCENARIOS.map((scenario) => (
                    <button
                        key={scenario.id}
                        id={`whatif-${scenario.id}`}
                        onClick={() => handleRun(scenario)}
                        disabled={isRunning}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-300
              border group relative overflow-hidden
              ${activeScenario === scenario.id && scenarioResult
                                ? "bg-gradient-to-r from-purple-500/15 to-violet-500/10 border-purple-400/40"
                                : "bg-gray-800/30 border-gray-700/50 hover:border-purple-400/30 hover:bg-purple-500/5"
                            }
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:scale-[1.01] hover:-translate-y-px active:scale-[0.99]`}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{scenario.emoji}</span>
                            <div className="flex-1">
                                <p className="font-medium text-gray-200 text-xs">{scenario.label}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{scenario.description}</p>
                            </div>
                            <span
                                className="text-xs px-2 py-0.5 rounded-full border transition-colors"
                                style={{
                                    borderColor: `${scenario.color}40`,
                                    color: scenario.color,
                                }}
                            >
                                Run
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Comparison Results */}
            {scenarioResult && (
                <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-purple-900/20 to-violet-900/15 border border-purple-400/20 animate-scale-in">
                    <h3 className="text-xs font-bold text-purple-300 mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-purple-400 to-violet-400" />
                        Scenario Result
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-md bg-gray-800/40">
                            <span className="text-gray-400">Survived</span>
                            <p className="text-white font-bold">
                                {scenarioResult.survived || 0}/{scenarioResult.total || 8}
                            </p>
                        </div>
                        <div className="p-2 rounded-md bg-gray-800/40">
                            <span className="text-gray-400">Avg Happiness</span>
                            <p className="text-white font-bold">
                                {scenarioResult.avgHappiness || "—"}
                            </p>
                        </div>
                        <div className="p-2 rounded-md bg-gray-800/40">
                            <span className="text-gray-400">Total Trades</span>
                            <p className="text-white font-bold">
                                {scenarioResult.totalTrades || 0}
                            </p>
                        </div>
                        <div className="p-2 rounded-md bg-gray-800/40">
                            <span className="text-gray-400">Total GDP</span>
                            <p className="text-white font-bold">
                                {scenarioResult.totalGdp || "—"}
                            </p>
                        </div>
                    </div>
                    {scenarioResult.comparison && (
                        <p className="text-xs text-purple-300 mt-2 text-center">
                            {scenarioResult.comparison}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default WhatIfPanel;
