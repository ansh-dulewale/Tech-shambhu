// src/features/GodMode.jsx
import React, { useState } from "react";

const ACTIONS = ["HARVEST", "CONSERVE", "TRADE", "EXPAND", "DEFEND", "INNOVATE"];
const RESOURCES = ["water", "food", "energy", "land"];

const EVENT_TYPES = [
  { id: "drought", label: "Drought", color: "#ff9100" },
  { id: "flood", label: "Flood", color: "#00d4ff" },
  { id: "earthquake", label: "Earthquake", color: "#ff1744" },
  { id: "pandemic", label: "Pandemic", color: "#e040fb" },
  { id: "tech_breakthrough", label: "Tech Boost", color: "#00e676" },
  { id: "economic", label: "Economic Boom", color: "#ffab00" },
  { id: "conflict", label: "Conflict", color: "#ff5252" },
  { id: "policy", label: "Policy Change", color: "#40c4ff" },
];

const RESOURCE_ICONS = {
  water: "W",
  food: "F",
  energy: "E",
  land: "L",
};

const ACTION_ICONS = {
  HARVEST: "HRV",
  CONSERVE: "CON",
  TRADE: "TRD",
  EXPAND: "EXP",
  DEFEND: "DEF",
  INNOVATE: "INN",
};

function GodMode({
  states,
  onTriggerEvent,
  onBlockTrade,
  onGiveAid,
  onForceAction,
}) {
  const [selectedState, setSelectedState] = useState("");
  const [activePanel, setActivePanel] = useState(null); // 'event' | 'block' | 'aid' | 'force'

  // Block Trade state
  const [blockState1, setBlockState1] = useState("");
  const [blockState2, setBlockState2] = useState("");

  // Give Aid state
  const [aidResource, setAidResource] = useState("water");
  const [aidAmount, setAidAmount] = useState(20);

  // Force Action state
  const [forceAction, setForceAction] = useState("HARVEST");

  const aliveStates = (states || []).filter((s) => s.alive !== false);

  const togglePanel = (panel) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  return (
    <div className="glass-card-glow p-5">
      <h2 className="text-lg font-bold mb-4 text-yellow-400 flex items-center gap-2.5 font-display">
        God Mode
      </h2>

      {/* State Selector */}
      <div className="mb-4">
        <label className="text-[10px] text-gray-400 block mb-1.5 uppercase tracking-wider font-semibold">Target State</label>
        <select
          id="god-mode-state-select"
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700/60 text-white text-sm
                     focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 transition-all"
        >
          <option value="">Select a state...</option>
          {aliveStates.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <button
          id="god-mode-trigger-event"
          onClick={() => togglePanel("event")}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300
            ${activePanel === "event"
              ? "bg-gradient-to-r from-orange-500/25 to-orange-500/15 border border-orange-400 text-orange-300 shadow-lg shadow-orange-500/15"
              : "bg-gray-800/40 border border-gray-700/60 text-gray-300 hover:border-orange-400/50 hover:text-orange-300 hover:bg-orange-500/5"
            }`}
        >
          Trigger Event
        </button>

        <button
          id="god-mode-block-trade"
          onClick={() => togglePanel("block")}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300
            ${activePanel === "block"
              ? "bg-gradient-to-r from-red-500/25 to-red-500/15 border border-red-400 text-red-300 shadow-lg shadow-red-500/15"
              : "bg-gray-800/40 border border-gray-700/60 text-gray-300 hover:border-red-400/50 hover:text-red-300 hover:bg-red-500/5"
            }`}
        >
          Block Trade
        </button>

        <button
          id="god-mode-give-aid"
          onClick={() => togglePanel("aid")}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300
            ${activePanel === "aid"
              ? "bg-gradient-to-r from-green-500/25 to-green-500/15 border border-green-400 text-green-300 shadow-lg shadow-green-500/15"
              : "bg-gray-800/40 border border-gray-700/60 text-gray-300 hover:border-green-400/50 hover:text-green-300 hover:bg-green-500/5"
            }`}
        >
          Give Aid
        </button>

        <button
          id="god-mode-force-action"
          onClick={() => togglePanel("force")}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300
            ${activePanel === "force"
              ? "bg-gradient-to-r from-purple-500/25 to-purple-500/15 border border-purple-400 text-purple-300 shadow-lg shadow-purple-500/15"
              : "bg-gray-800/40 border border-gray-700/60 text-gray-300 hover:border-purple-400/50 hover:text-purple-300 hover:bg-purple-500/5"
            }`}
        >
          Force Action
        </button>
      </div>

      {/* Trigger Event Panel */}
      {activePanel === "event" && (
        <div className="bg-gray-900/50 rounded-xl p-4 border border-orange-400/20 space-y-3 animate-scale-in">
          <p className="text-xs text-orange-300 font-semibold">Choose event type:</p>
          <div className="grid grid-cols-2 gap-2">
            {EVENT_TYPES.map((evt) => (
              <button
                key={evt.id}
                onClick={() => {
                  if (selectedState) {
                    onTriggerEvent(selectedState, evt.id);
                    setActivePanel(null);
                  }
                }}
                disabled={!selectedState}
                className="px-3 py-2 rounded-xl text-xs transition-all duration-200
                           bg-gray-800/40 border border-gray-700/50 hover:border-orange-400/40 hover:bg-orange-500/5
                           disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] hover:-translate-y-px font-medium"
                style={{ color: evt.color }}
              >
                {evt.label}
              </button>
            ))}
          </div>
          {!selectedState && (
            <p className="text-xs text-red-400 mt-1">Select a state first</p>
          )}
        </div>
      )}

      {/* Block Trade Panel */}
      {activePanel === "block" && (
        <div className="bg-gray-900/50 rounded-xl p-4 border border-red-400/20 space-y-3 animate-scale-in">
          <p className="text-xs text-red-300 font-semibold">Block trade between:</p>
          <div className="flex gap-2.5 items-center">
            <select
              id="god-mode-block-state1"
              value={blockState1}
              onChange={(e) => setBlockState1(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700/60
                         text-white text-xs focus:outline-none focus:border-red-400/50 transition-all"
            >
              <option value="">State 1</option>
              {aliveStates.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <span className="text-red-400 text-sm font-bold">✕</span>
            <select
              id="god-mode-block-state2"
              value={blockState2}
              onChange={(e) => setBlockState2(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700/60
                         text-white text-xs focus:outline-none focus:border-red-400/50 transition-all"
            >
              <option value="">State 2</option>
              {aliveStates.filter((s) => s.id !== blockState1).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <button
            id="god-mode-block-confirm"
            onClick={() => {
              if (blockState1 && blockState2) {
                onBlockTrade(blockState1, blockState2);
                setActivePanel(null);
                setBlockState1("");
                setBlockState2("");
              }
            }}
            disabled={!blockState1 || !blockState2}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all
                       bg-gradient-to-r from-red-500/15 to-red-500/10 border border-red-500/40 text-red-300
                       hover:from-red-500/25 hover:to-red-500/15 hover:border-red-400 hover:-translate-y-px
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Block Trade
          </button>
        </div>
      )}

      {/* Give Aid Panel */}
      {activePanel === "aid" && (
        <div className="bg-gray-900/50 rounded-xl p-4 border border-green-400/20 space-y-3 animate-scale-in">
          <p className="text-xs text-green-300 font-semibold">Send aid to {selectedState || "..."}:</p>

          <div className="flex gap-2">
            {RESOURCES.map((res) => (
              <button
                key={res}
                onClick={() => setAidResource(res)}
                className={`flex-1 px-2.5 py-2 rounded-xl text-xs transition-all font-medium
                  ${aidResource === res
                    ? "bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-400/60 scale-105 text-green-300"
                    : "bg-gray-800/40 border border-gray-700/50 hover:border-green-400/30 text-gray-300"
                  }`}
              >
                {RESOURCE_ICONS[res]} {res}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-gray-400 font-medium">Amount: <span className="text-green-300 font-bold">{aidAmount}</span></label>
            <input
              id="god-mode-aid-amount"
              type="range"
              min="5"
              max="50"
              step="5"
              value={aidAmount}
              onChange={(e) => setAidAmount(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-green-400
                         bg-gray-700"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-medium">
              <span>5</span>
              <span>50</span>
            </div>
          </div>

          <button
            id="god-mode-aid-confirm"
            onClick={() => {
              if (selectedState) {
                onGiveAid(selectedState, aidResource, aidAmount);
                setActivePanel(null);
              }
            }}
            disabled={!selectedState}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all
                       bg-gradient-to-r from-green-500/15 to-green-500/10 border border-green-500/40 text-green-300
                       hover:from-green-500/25 hover:to-green-500/15 hover:border-green-400 hover:-translate-y-px
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send +{aidAmount} {aidResource}
          </button>
          {!selectedState && (
            <p className="text-xs text-red-400">Select a state first</p>
          )}
        </div>
      )}

      {/* Force Action Panel */}
      {activePanel === "force" && (
        <div className="bg-gray-900/50 rounded-xl p-4 border border-purple-400/20 space-y-3 animate-scale-in">
          <p className="text-xs text-purple-300 font-semibold">
            Override AI decision for {selectedState || "..."}:
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => setForceAction(action)}
                className={`px-2.5 py-2 rounded-xl text-xs transition-all font-medium
                  ${forceAction === action
                    ? "bg-gradient-to-r from-purple-500/20 to-purple-500/10 border border-purple-400/60 text-purple-300 scale-105"
                    : "bg-gray-800/40 border border-gray-700/50 text-gray-400 hover:border-purple-400/30"
                  }`}
              >
                {ACTION_ICONS[action]} {action}
              </button>
            ))}
          </div>
          <button
            id="god-mode-force-confirm"
            onClick={() => {
              if (selectedState && forceAction) {
                onForceAction(selectedState, forceAction);
                setActivePanel(null);
              }
            }}
            disabled={!selectedState}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all
                       bg-gradient-to-r from-purple-500/15 to-purple-500/10 border border-purple-500/40 text-purple-300
                       hover:from-purple-500/25 hover:to-purple-500/15 hover:border-purple-400 hover:-translate-y-px
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Force {forceAction}
          </button>
          {!selectedState && (
            <p className="text-xs text-red-400">Select a state first</p>
          )}
        </div>
      )}
    </div>
  );
}

export default GodMode;
