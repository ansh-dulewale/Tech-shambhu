// src/features/ExplainabilityPanel.jsx — Agent Q-Value Explainability Panel
import React, { useMemo, useState } from "react";

const ACTIONS = ['HARVEST', 'CONSERVE', 'TRADE', 'EXPAND', 'DEFEND', 'INNOVATE'];

const ACTION_COLORS = {
  HARVEST: { bar: 'bg-emerald-400', text: 'text-emerald-400', glow: 'shadow-emerald-400/20' },
  CONSERVE: { bar: 'bg-blue-400', text: 'text-blue-400', glow: 'shadow-blue-400/20' },
  TRADE: { bar: 'bg-amber-400', text: 'text-amber-400', glow: 'shadow-amber-400/20' },
  EXPAND: { bar: 'bg-pink-400', text: 'text-pink-400', glow: 'shadow-pink-400/20' },
  DEFEND: { bar: 'bg-orange-400', text: 'text-orange-400', glow: 'shadow-orange-400/20' },
  INNOVATE: { bar: 'bg-violet-400', text: 'text-violet-400', glow: 'shadow-violet-400/20' },
};

const ACTION_SHORT = {
  HARVEST: 'HRV',
  CONSERVE: 'CON',
  TRADE: 'TRD',
  EXPAND: 'EXP',
  DEFEND: 'DEF',
  INNOVATE: 'INV',
};

function QBar({ action, value, maxAbsValue, isChosen }) {
  const colors = ACTION_COLORS[action];
  // Normalize bar width to 0-100% based on max absolute value
  const pct = maxAbsValue > 0 ? Math.abs(value) / maxAbsValue * 100 : 0;
  const isPositive = value >= 0;

  return (
    <div className={`flex items-center gap-1.5 py-[3px] ${isChosen ? 'opacity-100' : 'opacity-60'}`}>
      <span className={`text-[9px] font-mono w-7 shrink-0 ${isChosen ? colors.text + ' font-bold' : 'text-gray-500'}`}>
        {ACTION_SHORT[action]}
      </span>
      <div className="flex-1 h-[6px] bg-gray-800/60 rounded-full overflow-hidden relative">
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${isPositive ? colors.bar : 'bg-red-400/60'} ${isChosen ? 'shadow-sm ' + colors.glow : ''}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className={`text-[9px] font-mono w-10 text-right tabular-nums ${value > 0 ? 'text-emerald-300/70' : value < 0 ? 'text-red-300/70' : 'text-gray-600'}`}>
        {value > 0 ? '+' : ''}{value.toFixed(1)}
      </span>
      {isChosen && (
        <span className="text-[8px] text-violet-400 font-bold ml-0.5">*</span>
      )}
    </div>
  );
}

function AgentCard({ agent }) {
  const { name, stateCode, qValues, chosenAction, explorationRate, totalReward, statesVisited } = agent;
  
  const maxAbsValue = useMemo(() => {
    const vals = Object.values(qValues).map(Math.abs);
    return Math.max(...vals, 0.1); // avoid div by zero
  }, [qValues]);

  // Find the best action (highest Q-value)
  const bestAction = useMemo(() => {
    let best = ACTIONS[0];
    let bestVal = -Infinity;
    ACTIONS.forEach(a => {
      if (qValues[a] > bestVal) { bestVal = qValues[a]; best = a; }
    });
    return best;
  }, [qValues]);

  const wasExploring = chosenAction !== bestAction;

  return (
    <div className="p-3 rounded-xl bg-gray-800/20 border border-gray-700/30 hover:border-gray-600/40 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-200">{name}</span>
          {wasExploring && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/20 font-medium">
              EXPLORING
            </span>
          )}
        </div>
        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${ACTION_COLORS[chosenAction]?.text || 'text-gray-400'} border-current/20`}>
          {chosenAction || '—'}
        </span>
      </div>

      {/* Q-Value Bars */}
      <div className="space-y-0">
        {ACTIONS.map(action => (
          <QBar
            key={action}
            action={action}
            value={qValues[action] || 0}
            maxAbsValue={maxAbsValue}
            isChosen={action === chosenAction}
          />
        ))}
      </div>

      {/* Agent Metadata */}
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-700/20">
        <span className="text-[8px] text-gray-500">
          Reward: <span className={`font-mono ${totalReward > 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>{totalReward.toFixed(0)}</span>
        </span>
        <span className="text-[8px] text-gray-500">
          Explore: <span className="text-amber-400/70 font-mono">{(explorationRate * 100).toFixed(0)}%</span>
        </span>
        <span className="text-[8px] text-gray-500">
          States: <span className="text-violet-400/70 font-mono">{statesVisited}</span>
        </span>
      </div>

      {/* State encoding */}
      <div className="mt-1">
        <span className="text-[8px] text-gray-600 font-mono tracking-wider">{stateCode}</span>
      </div>
    </div>
  );
}

function ExplainabilityPanel({ agentExplanations }) {
  const [expanded, setExpanded] = useState(true);

  if (!agentExplanations || agentExplanations.length === 0) {
    return (
      <div className="glass-card-glow p-5">
        <h2 className="text-lg font-bold mb-3 text-violet-400 flex items-center gap-2.5 font-display">
          Agent Explainability
        </h2>
        <p className="text-xs text-gray-500 italic">Run the simulation to see agent decision-making...</p>
      </div>
    );
  }

  // Summary stats
  const avgExplore = agentExplanations.reduce((s, a) => s + a.explorationRate, 0) / agentExplanations.length;
  const totalStates = agentExplanations.reduce((s, a) => s + a.statesVisited, 0);
  const exploringCount = agentExplanations.filter(a => {
    const bestAction = ACTIONS.reduce((best, action) =>
      (a.qValues[action] || 0) > (a.qValues[best] || 0) ? action : best, ACTIONS[0]);
    return a.chosenAction !== bestAction;
  }).length;

  return (
    <div className="glass-card-glow p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-violet-400 flex items-center gap-2.5 font-display">
          Agent Explainability
        </h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center gap-4 mb-4 p-2.5 rounded-xl bg-violet-500/5 border border-violet-400/10">
        <div className="text-center">
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Exploring</p>
          <p className="text-sm font-bold text-amber-300">{exploringCount}/{agentExplanations.length}</p>
        </div>
        <div className="w-px h-6 bg-gray-700/30" />
        <div className="text-center">
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Avg Epsilon</p>
          <p className="text-sm font-bold text-violet-300">{(avgExplore * 100).toFixed(0)}%</p>
        </div>
        <div className="w-px h-6 bg-gray-700/30" />
        <div className="text-center">
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">Q-States</p>
          <p className="text-sm font-bold text-cyan-300">{totalStates}</p>
        </div>
      </div>

      {/* Q-Value explanation */}
      <div className="mb-3 p-2 rounded-lg bg-gray-800/20 border border-gray-700/15">
        <p className="text-[9px] text-gray-400 leading-relaxed">
          Each bar shows the learned Q-value for that action in the agent's current state.
          The starred (*) action is what the agent chose. If marked <span className="text-amber-300">EXPLORING</span>,
          the agent randomly sampled instead of picking the best action.
        </p>
      </div>

      {/* Agent Cards Grid */}
      {expanded && (
        <div className="grid grid-cols-2 gap-2.5 animate-slide-up">
          {agentExplanations.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ExplainabilityPanel;
