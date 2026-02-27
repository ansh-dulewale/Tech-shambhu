// src/features/WhatIfPanel.jsx
import React, { useState, useCallback } from "react";

const SCENARIOS = [
    {
        id: "no_water_rajasthan",
        label: "What if Rajasthan had no water?",
        description: "Rajasthan starts with water = 5",
        changes: { rajasthan: { water: 5 } },
        color: "#ff9100",
    },
    {
        id: "no_trade",
        label: "What if no trade allowed?",
        description: "All trade is disabled globally",
        changes: { global: { tradeDisabled: true } },
        color: "#ff1744",
    },
    {
        id: "double_disasters",
        label: "What if disasters doubled?",
        description: "Event rate increased to 60%",
        changes: { global: { eventRate: 0.6 } },
        color: "#ff5252",
    },
    {
        id: "full_cooperation",
        label: "What if all states cooperated?",
        description: "All states forced to trade every cycle",
        changes: { global: { forceTrade: true } },
        color: "#00e676",
    },
    {
        id: "double_population_up",
        label: "What if UP population doubled?",
        description: "Uttar Pradesh population starts at 1400",
        changes: { uttarpradesh: { population: 1400 } },
        color: "#40c4ff",
    },
];

const STATES_LIST = [
    { id: "punjab", name: "Punjab" },
    { id: "rajasthan", name: "Rajasthan" },
    { id: "gujarat", name: "Gujarat" },
    { id: "kerala", name: "Kerala" },
    { id: "jharkhand", name: "Jharkhand" },
    { id: "maharashtra", name: "Maharashtra" },
    { id: "tamilnadu", name: "Tamil Nadu" },
    { id: "uttarpradesh", name: "Uttar Pradesh" },
];

const DEFAULT_CUSTOM = {
    targetState: "rajasthan",
    water: 50,
    food: 50,
    energy: 50,
    land: 50,
    eventRate: 30,
    tradeDisabled: false,
};

function WhatIfPanel({ onRunScenario, scenarioResult }) {
    const [activeScenario, setActiveScenario] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [showBuilder, setShowBuilder] = useState(false);
    const [custom, setCustom] = useState({ ...DEFAULT_CUSTOM });

    const handleRun = (scenario) => {
        setActiveScenario(scenario.id);
        setIsRunning(true);
        onRunScenario(scenario);
        setTimeout(() => setIsRunning(false), 2000);
    };

    const handleSlider = useCallback((key, val) => {
        setCustom(prev => ({ ...prev, [key]: Number(val) }));
    }, []);

    const handleCustomRun = () => {
        const stateId = custom.targetState;
        const changes = {
            [stateId]: {
                water: custom.water,
                food: custom.food,
                energy: custom.energy,
                land: custom.land,
            },
            global: {
                eventRate: custom.eventRate / 100,
                tradeDisabled: custom.tradeDisabled,
            },
        };
        const scenario = {
            id: "custom_builder",
            label: `Custom: ${STATES_LIST.find(s => s.id === stateId)?.name || stateId}`,
            description: `W:${custom.water} F:${custom.food} E:${custom.energy} L:${custom.land} | Events:${custom.eventRate}%${custom.tradeDisabled ? " | No Trade" : ""}`,
            changes,
            color: "#a855f7",
        };
        handleRun(scenario);
    };

    const SliderRow = ({ label, value, onChange, min = 0, max = 100, color = "purple" }) => (
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 w-14 shrink-0">{label}</span>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className={`flex-1 h-1 rounded-full appearance-none cursor-pointer accent-${color}-400
                    [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-${color}-400
                    bg-gray-700`}
            />
            <span className="text-[10px] text-gray-300 font-mono w-7 text-right">{value}</span>
        </div>
    );

    return (
        <div className="glass-card-glow p-5">
            <h2 className="text-lg font-bold mb-4 text-purple-400 flex items-center gap-2.5 font-display">
                What-If Scenarios
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
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: scenario.color }} />
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

            {/* Custom Scenario Builder */}
            <div className="mt-4">
                <button
                    onClick={() => setShowBuilder(prev => !prev)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-300
                        border border-dashed border-purple-400/30 hover:border-purple-400/50
                        bg-purple-500/5 hover:bg-purple-500/10"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-purple-400 text-xs font-bold">{showBuilder ? "−" : "+"}</span>
                        <p className="font-medium text-purple-300 text-xs">Build Custom Scenario</p>
                    </div>
                </button>

                {showBuilder && (
                    <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-purple-900/15 to-violet-900/10
                        border border-purple-400/15 space-y-3 animate-scale-in">

                        {/* Target State Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 w-14 shrink-0">State</span>
                            <select
                                value={custom.targetState}
                                onChange={e => setCustom(prev => ({ ...prev, targetState: e.target.value }))}
                                className="flex-1 text-xs bg-gray-800/60 border border-gray-700/50 rounded-lg
                                    px-2 py-1.5 text-gray-200 focus:outline-none focus:border-purple-400/40"
                            >
                                {STATES_LIST.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Resource Sliders */}
                        <div className="space-y-2 pt-1">
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Starting Resources</p>
                            <SliderRow label="Water" value={custom.water} onChange={v => handleSlider("water", v)} color="cyan" />
                            <SliderRow label="Food" value={custom.food} onChange={v => handleSlider("food", v)} color="emerald" />
                            <SliderRow label="Energy" value={custom.energy} onChange={v => handleSlider("energy", v)} color="amber" />
                            <SliderRow label="Land" value={custom.land} onChange={v => handleSlider("land", v)} color="violet" />
                        </div>

                        {/* Global Controls */}
                        <div className="space-y-2 pt-1">
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Global Settings</p>
                            <SliderRow label="Events %" value={custom.eventRate} onChange={v => handleSlider("eventRate", v)} />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 w-14 shrink-0">Trade</span>
                                <button
                                    onClick={() => setCustom(prev => ({ ...prev, tradeDisabled: !prev.tradeDisabled }))}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                                        custom.tradeDisabled
                                            ? "bg-red-500/15 border-red-400/30 text-red-300"
                                            : "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                                    }`}
                                >
                                    {custom.tradeDisabled ? "Disabled" : "Enabled"}
                                </button>
                            </div>
                        </div>

                        {/* Run Button */}
                        <button
                            onClick={handleCustomRun}
                            disabled={isRunning}
                            className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold transition-all
                                bg-gradient-to-r from-purple-500/20 to-violet-500/15
                                border border-purple-400/30 text-purple-200
                                hover:from-purple-500/30 hover:to-violet-500/25 hover:border-purple-400/50
                                active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Run Custom Scenario
                        </button>
                    </div>
                )}
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
