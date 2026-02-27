// src/features/ExplainabilityPanel.jsx — Agent Decision Explainability Panel
import React, { useState } from "react";

const ACTIONS = ['HARVEST', 'CONSERVE', 'TRADE', 'EXPAND', 'DEFEND', 'INNOVATE'];

const ACTION_META = {
  HARVEST:  { emoji: 'H', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', desc: 'Gather resources' },
  CONSERVE: { emoji: 'C', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', desc: 'Preserve resources' },
  TRADE:    { emoji: 'T', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', desc: 'Exchange surplus' },
  EXPAND:   { emoji: 'E', color: '#fb7185', bg: 'rgba(251,113,133,0.12)', desc: 'Grow territory' },
  DEFEND:   { emoji: 'D', color: '#fb923c', bg: 'rgba(251,146,60,0.12)', desc: 'Protect reserves' },
  INNOVATE: { emoji: 'I', color: '#c084fc', bg: 'rgba(192,132,252,0.12)', desc: 'Invest in tech' },
};

const RESOURCE_ICONS = { water: 'W', food: 'F', energy: 'E', land: 'L' };

/* ─── Resource mini bar ─── */
function MiniBar({ value, icon, label }) {
  const color = value <= 15 ? '#f87171' : value <= 30 ? '#fbbf24' : value <= 50 ? '#60a5fa' : '#4ade80';
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] w-4 text-center shrink-0">{icon}</span>
      <span className="text-[9px] text-zinc-500 w-10 capitalize shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(value, 3)}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-mono tabular-nums w-5 text-right shrink-0" style={{ color }}>{Math.round(value)}</span>
    </div>
  );
}

/* ─── Q-Value rankings ─── */
function QValueMini({ qValues, chosenAction, bestAction }) {
  const maxAbs = Math.max(...Object.values(qValues).map(Math.abs), 0.1);
  const sorted = [...ACTIONS].sort((a, b) => (qValues[b] || 0) - (qValues[a] || 0));

  return (
    <div>
      <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1.5 font-medium">Q-Value Rankings</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {sorted.map((action) => {
          const val = qValues[action] || 0;
          const pct = maxAbs > 0 ? (Math.abs(val) / maxAbs) * 100 : 0;
          const isChosen = action === chosenAction;
          const isBest = action === bestAction;
          const meta = ACTION_META[action];
          return (
            <div key={action} className={`flex items-center gap-1 py-[2px] ${isChosen ? 'opacity-100' : 'opacity-40'}`}>
              <span className="text-[8px]">{meta.emoji}</span>
              <span className={`text-[9px] w-12 font-medium truncate ${isChosen ? 'text-white' : 'text-zinc-500'}`}>
                {action.charAt(0) + action.slice(1).toLowerCase()}
              </span>
              <div className="flex-1 h-[3px] bg-white/[0.03] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: isChosen ? meta.color : 'rgba(255,255,255,0.12)' }} />
              </div>
              <span className={`text-[8px] font-mono tabular-nums w-8 text-right ${val > 0 ? 'text-emerald-400/70' : val < 0 ? 'text-red-400/60' : 'text-zinc-600'}`}>
                {val > 0 ? '+' : ''}{val.toFixed(1)}
              </span>
              {isChosen && <span className="text-[6px] text-violet-400 font-bold w-5">✓</span>}
              {isBest && !isChosen && <span className="text-[6px] text-emerald-400/50 font-bold w-5">★</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Strategy breakdown pills ─── */
function StrategyBreakdown({ breakdown }) {
  const sorted = ACTIONS.filter(a => (breakdown[a] || 0) > 0).sort((a, b) => (breakdown[b] || 0) - (breakdown[a] || 0));
  return (
    <div>
      <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1.5 font-medium">Strategy History</div>
      <div className="grid grid-cols-3 gap-1">
        {sorted.map(action => {
          const pct = breakdown[action] || 0;
          const meta = ACTION_META[action];
          return (
            <div key={action} className="flex items-center justify-center gap-1 px-1.5 py-1 rounded-md" style={{ background: meta.bg }}>
              <span className="text-[8px]">{meta.emoji}</span>
              <span className="text-[9px] font-bold font-mono tabular-nums" style={{ color: meta.color }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Single Agent Card ─── */
function AgentCard({ agent, isExpanded, onToggle }) {
  const meta = ACTION_META[agent.chosenAction] || ACTION_META.HARVEST;
  const healthColor = agent.avgResources > 60 ? '#4ade80' : agent.avgResources > 40 ? '#fbbf24' : agent.avgResources > 20 ? '#fb923c' : '#f87171';

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer
        ${agent.wasExploring
          ? 'bg-amber-500/[0.03] border-amber-500/15 hover:border-amber-500/25'
          : 'bg-white/[0.015] border-white/[0.05] hover:border-white/[0.1]'
        }`}
      onClick={onToggle}
    >
      {/* ─── Header ─── */}
      <div className="px-3 py-2.5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
          style={{ background: meta.bg, border: `1px solid ${meta.color}25` }}>
          {meta.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold text-white truncate">{agent.name}</span>
            {agent.wasExploring && (
              <span className="text-[7px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/15 font-bold uppercase">
                Exploring
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] font-semibold" style={{ color: meta.color }}>{agent.chosenAction}</span>
            <span className="text-[8px] text-zinc-600">·</span>
            <span className="text-[8px] text-zinc-500 italic truncate">{meta.desc}</span>
          </div>
        </div>
        <div className="text-center shrink-0 w-10">
          <div className="text-[7px] text-zinc-600 uppercase">Health</div>
          <div className="text-xs font-black font-mono tabular-nums" style={{ color: healthColor }}>{agent.avgResources}%</div>
        </div>
        <svg className={`w-3.5 h-3.5 text-zinc-600 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* ─── Reasoning (always visible) ─── */}
      <div className="px-3 pb-2.5 -mt-0.5">
        <div className="space-y-0.5">
          {agent.reasons.map((reason, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[8px] mt-0.5 shrink-0">{i === 0 ? '>' : '→'}</span>
              <span className="text-[10px] text-zinc-300 leading-snug">{reason}</span>
            </div>
          ))}
        </div>
        {agent.critical.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/[0.08] border border-red-500/15">
            <span className="text-[9px] text-red-400 font-bold">!</span>
            <span className="text-[9px] text-red-300 font-medium">
              Critical: {agent.critical.map(r => `${RESOURCE_ICONS[r]} ${r}`).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* ─── Expanded section ─── */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-2 border-t border-white/[0.04] space-y-3">
          {/* Resources — full width */}
          <div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1.5 font-medium">Resources</div>
            <div className="space-y-1">
              {Object.entries(agent.resources).map(([key, val]) => (
                <MiniBar key={key} label={key} value={val} icon={RESOURCE_ICONS[key]} />
              ))}
            </div>
          </div>

          {/* Stats — 3-column grid */}
          <div className="grid grid-cols-3 gap-1">
            <MiniStat icon="P" label="Pop" value={agent.population} color="#60a5fa" />
            <MiniStat icon="H" label="Happy" value={`${agent.happiness}%`} color={agent.happiness >= 50 ? '#4ade80' : '#fbbf24'} />
            <MiniStat icon="G" label="GDP" value={agent.gdp} color="#22d3ee" />
            <MiniStat icon="T" label="Trades" value={agent.activeTrades} color="#c084fc" />
            <MiniStat icon="E" label="Epsilon" value={`${(agent.explorationRate * 100).toFixed(0)}%`} color="#fbbf24" />
            <MiniStat icon="R" label="Reward" value={agent.totalReward.toFixed(0)} color={agent.totalReward > 0 ? '#4ade80' : '#f87171'} />
          </div>

          {/* Q-Values + Strategy side by side */}
          <div className="grid grid-cols-2 gap-3">
            <QValueMini qValues={agent.qValues} chosenAction={agent.chosenAction} bestAction={agent.bestAction} />
            <div className="space-y-3">
              <StrategyBreakdown breakdown={agent.strategyBreakdown} />
              <div>
                <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-medium">Encoding</div>
                <code className="text-[8px] text-violet-400/60 font-mono bg-violet-500/[0.06] px-1.5 py-0.5 rounded block truncate">{agent.stateCode}</code>
                <span className="text-[7px] text-zinc-600 mt-0.5 block">{agent.statesVisited} states learned</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Compact stat box for grid ─── */
function MiniStat({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-white/[0.02] border border-white/[0.04]">
      <span className="text-[8px]">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[7px] text-zinc-600 uppercase leading-none">{label}</div>
        <div className="text-[9px] font-bold font-mono tabular-nums truncate" style={{ color }}>{value}</div>
      </div>
    </div>
  );
}

/* ─── Summary stat for header ─── */
function SummaryStat({ icon, label, value, color, wide }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] ${wide ? 'col-span-2' : ''}`}>
      <span className="text-sm shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[7px] text-zinc-600 uppercase tracking-wider leading-none">{label}</div>
        <div className="text-[11px] font-bold font-mono tabular-nums truncate" style={{ color }}>{value}</div>
      </div>
    </div>
  );
}

/* ═══ Main Panel ═══ */
function ExplainabilityPanel({ agentExplanations }) {
  const [expandedSet, setExpandedSet] = useState(new Set());

  const toggleAgent = (id) => {
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!agentExplanations || agentExplanations.length === 0) {
    return (
      <div className="rounded-2xl bg-[#0d0b1a]/60 border border-white/[0.04] overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.04]">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-400" />
          <div>
            <h2 className="text-[13px] font-semibold text-white/90">AI Decision Explainer</h2>
            <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-wider">why each agent chose its action</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-14 px-5">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-violet-500/[0.06] border border-violet-500/10 flex items-center justify-center text-xl text-violet-400 font-bold">AI</div>
            <p className="text-sm text-zinc-500 font-medium">No agent data yet</p>
            <p className="text-[11px] text-zinc-600 mt-1">Start the simulation to see agent reasoning</p>
          </div>
        </div>
      </div>
    );
  }

  // Summary stats
  const exploringCount = agentExplanations.filter(a => a.wasExploring).length;
  const avgHealth = Math.round(agentExplanations.reduce((s, a) => s + a.avgResources, 0) / agentExplanations.length);
  const criticalStates = agentExplanations.filter(a => a.critical.length >= 2);
  const totalReward = agentExplanations.reduce((s, a) => s + a.totalReward, 0);
  const actionCounts = {};
  agentExplanations.forEach(a => { actionCounts[a.chosenAction] = (actionCounts[a.chosenAction] || 0) + 1; });
  const dominantAction = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-3">
      {/* ─── Header ─── */}
      <div className="rounded-2xl bg-[#0d0b1a]/60 border border-white/[0.04] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-400" />
            <div>
              <h2 className="text-[13px] font-semibold text-white/90">AI Decision Explainer</h2>
              <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-wider">why each agent chose its action</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (expandedSet.size > 0) setExpandedSet(new Set());
              else setExpandedSet(new Set(agentExplanations.map(a => a.id)));
            }}
            className="text-[9px] px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all font-medium uppercase tracking-wider"
          >
            {expandedSet.size > 0 ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* ─── Summary Grid: 2x2 + optional full-width row ─── */}
        <div className="px-4 py-3 grid grid-cols-2 gap-1.5">
          <SummaryStat icon="E" label="Exploring" value={`${exploringCount} / ${agentExplanations.length} agents`} color="#fbbf24" />
          <SummaryStat icon="H" label="Avg Health" value={`${avgHealth}%`} color={avgHealth > 50 ? '#4ade80' : '#fbbf24'} />
          <SummaryStat icon="R" label="Total Reward" value={Math.round(totalReward)} color={totalReward > 0 ? '#4ade80' : '#f87171'} />
          {dominantAction && (
            <SummaryStat
              icon={ACTION_META[dominantAction[0]]?.emoji || 'D'}
              label="Dominant Action"
              value={`${dominantAction[0]} (${dominantAction[1]})`}
              color={ACTION_META[dominantAction[0]]?.color || '#888'}
            />
          )}
          {criticalStates.length > 0 && (
            <SummaryStat
              icon="!"
              label={`At Risk (${criticalStates.length})`}
              value={criticalStates.map(a => a.name).join(', ')}
              color="#f87171"
              wide
            />
          )}
        </div>
      </div>

      {/* ─── Agent Cards: 2-column grid ─── */}
      <div className="grid grid-cols-2 gap-2">
        {agentExplanations.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isExpanded={expandedSet.has(agent.id)}
            onToggle={() => toggleAgent(agent.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default ExplainabilityPanel;
