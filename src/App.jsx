// src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import statesData from "./data/indiaStates.json";

// Components
import Header from "./components/Header";
import IndiaMap from "./components/IndiaMap";
import ResourceDashboard from "./components/ResourceDashboard";
import TrendCharts from "./components/TrendCharts";
import EventLog from "./components/EventLog";
import StateDetail from "./components/StateDetail";
import TradeNetwork from "./components/TradeNetwork";
import ThreeBackground from "./components/ThreeBackground";

// Features
import GodMode from "./features/GodMode";
import WhatIfPanel from "./features/WhatIfPanel";
import AnalysisPanel from "./features/AnalysisPanel";
import StoryPanel from "./features/StoryPanel";
import ComparisonView from "./features/ComparisonView";
import ExplainabilityPanel from "./features/ExplainabilityPanel";
import InsightsPanel from "./features/InsightsPanel";

// Engine
import World from "./engine/World";

// ─── Tab Button ─────────────────────────────────────────────────────
function TabBtn({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 py-3 rounded-xl text-sm font-bold transition-all text-center
        ${active
          ? 'bg-violet-500/15 border border-violet-400/30 text-violet-300 shadow-lg shadow-violet-500/10'
          : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:bg-white/[0.04]'
        }`}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" />
      )}
    </button>
  );
}

function App() {
  // ─── Core simulation state ──────────────────────────────────────
  const [world] = useState(() => new World(statesData));
  const [cycle, setCycle] = useState(0);
  const [states, setStates] = useState([]);
  const [events, setEvents] = useState([]);
  const [trades, setTrades] = useState([]);
  const [alliances, setAlliances] = useState([]);
  const [history, setHistory] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedState, setSelectedState] = useState(null);
  const [scenarioResult, setScenarioResult] = useState(null);
  const [comparisonData, setComparisonData] = useState({ ai: null, random: null });
  const [agentExplanations, setAgentExplanations] = useState([]);
  const [climateStress, setClimateStress] = useState(0);
  const [negotiations, setNegotiations] = useState([]);
  const [crossRunResults, setCrossRunResults] = useState(null);
  const [crossRunLoading, setCrossRunLoading] = useState(false);
  const intervalRef = useRef(null);

  // ─── Tab state ──────────────────────────────────────────────────
  const [rightTab, setRightTab] = useState('resources');  // resources | godmode | scenarios | explain
  const [bottomTab, setBottomTab] = useState('events');   // events | trends | trade | analysis

  // ─── Simulation logic (unchanged) ───────────────────────────────
  const runCycle = useCallback(() => {
    const result = world.tick();
    setCycle(result.cycle);
    setStates(result.states);
    if (result.event) setEvents((prev) => [...prev, result.event]);
    setTrades((prev) => {
      const updated = [...prev, ...(result.trades || [])];
      return updated.slice(-20);
    });
    setAlliances(result.alliances);
    setHistory((prev) => [...prev, result]);
    setAgentExplanations(world.getAgentExplanations());
    setClimateStress(result.climateStress || 0);
    setNegotiations(result.negotiations || []);
  }, [world]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(runCycle, 1000 / speed);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, speed, runCycle]);

  useEffect(() => { setStates(world.getState()); }, [world]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    world.reset(statesData);
    setCycle(0);
    setEvents([]);
    setHistory([]);
    setTrades([]);
    setAlliances([]);
    setScenarioResult(null);
    setSelectedState(null);
    setAgentExplanations([]);
    setClimateStress(0);
    setNegotiations([]);
    setStates(world.getState());
  }, [world]);

  // ─── What-If scenario runner ────────────────────────────────────
  const handleRunScenario = useCallback((scenario) => {
    setIsRunning(false);
    const modifiedData = JSON.parse(JSON.stringify(statesData));
    const globalChanges = scenario.changes.global || {};
    Object.entries(scenario.changes).forEach(([target, changes]) => {
      if (target === "global") return;
      const stateData = modifiedData.states.find((s) => s.id === target);
      if (stateData) {
        Object.entries(changes).forEach(([key, value]) => {
          if (key in stateData.resources) stateData.resources[key] = value;
          else stateData[key] = value;
        });
      }
    });
    const scenarioWorld = new World(modifiedData);
    if (globalChanges.tradeDisabled) scenarioWorld.setTradeDisabled(true);
    if (globalChanges.eventRate !== undefined) scenarioWorld.setEventRate(globalChanges.eventRate);
    if (globalChanges.forceTrade) {
      Object.keys(scenarioWorld.agents).forEach((id) => {
        scenarioWorld.agents[id].forceNextAction('TRADE');
      });
    }
    let survived = 0, totalHappiness = 0, totalTrades = 0, totalGdp = 0;
    for (let i = 0; i < 100; i++) {
      if (globalChanges.forceTrade) {
        Object.keys(scenarioWorld.agents).forEach((id) => {
          if (scenarioWorld.states[id]?.alive) scenarioWorld.agents[id].forceNextAction('TRADE');
        });
      }
      const r = scenarioWorld.tick();
      totalTrades += (r.trades || []).length;
    }
    const finalStates = scenarioWorld.getState();
    finalStates.forEach((s) => {
      if (s.alive !== false) survived++;
      totalHappiness += s.happiness || 0;
      totalGdp += s.gdp || 0;
    });
    const total = finalStates.length || 8;
    setScenarioResult({
      survived, total,
      avgHappiness: Math.round(totalHappiness / total),
      totalTrades, totalGdp: Math.round(totalGdp),
      comparison: `Scenario "${scenario.label}" resulted in ${survived}/${total} states surviving.`,
    });
  }, []);

  // ─── AI vs Random comparison ────────────────────────────────────
  const handleRunComparison = useCallback(() => {
    const runSim = (useAI) => {
      const simWorld = new World(JSON.parse(JSON.stringify(statesData)));
      let totalTrades = 0;
      for (let i = 0; i < 100; i++) {
        if (!useAI) {
          const ACTIONS = ['HARVEST', 'CONSERVE', 'TRADE', 'EXPAND', 'DEFEND', 'INNOVATE'];
          Object.keys(simWorld.agents).forEach((id) => {
            if (simWorld.states[id]?.alive)
              simWorld.agents[id].forceNextAction(ACTIONS[Math.floor(Math.random() * ACTIONS.length)]);
          });
        }
        const r = simWorld.tick();
        totalTrades += (r.trades || []).length;
      }
      const finalStates = simWorld.getState();
      let survived = 0, totalHappiness = 0, totalGdp = 0;
      finalStates.forEach((s) => {
        if (s.alive !== false) survived++;
        totalHappiness += s.happiness || 0;
        totalGdp += s.gdp || 0;
      });
      const total = finalStates.length || 8;
      return { survived, total, avgHappiness: Math.round(totalHappiness / total), totalTrades, totalGdp: Math.round(totalGdp) };
    };
    setComparisonData({ ai: runSim(true), random: runSim(false) });
  }, []);

  // ─── Cross-run statistical analysis (10 independent sims) ───────
  const handleCrossRunAnalysis = useCallback(() => {
    setCrossRunLoading(true);
    // Use setTimeout so UI updates before heavy computation
    setTimeout(() => {
      const results = [];
      for (let run = 0; run < 10; run++) {
        const simWorld = new World(JSON.parse(JSON.stringify(statesData)));
        let totalTrades = 0;
        for (let i = 0; i < 100; i++) {
          const r = simWorld.tick();
          totalTrades += (r.trades || []).length;
        }
        const finalStates = simWorld.getState();
        const survived = finalStates.filter(s => s.alive !== false).length;
        const total = finalStates.length || 8;
        const strategies = {};
        finalStates.filter(s => s.alive !== false).forEach(s => {
          if (s.strategy) {
            const top = Object.entries(s.strategy).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
            strategies[top[0]] = (strategies[top[0]] || 0) + 1;
          }
        });
        const topStrategy = Object.entries(strategies).sort((a, b) => b[1] - a[1])[0];
        results.push({
          survived, total, totalTrades,
          topStrategy: topStrategy ? topStrategy[0] : 'NONE',
          avgHappiness: Math.round(finalStates.reduce((s, st) => s + (st.happiness || 0), 0) / total),
          totalGdp: Math.round(finalStates.reduce((s, st) => s + (st.gdp || 0), 0)),
        });
      }
      setCrossRunResults(results);
      setCrossRunLoading(false);
    }, 50);
  }, []);

  // ─── Layout ─────────────────────────────────────────────────────
  return (
    <>
      <ThreeBackground />
      <div className="noise-overlay" />
      <div className="relative z-10 min-h-screen grid overflow-y-auto p-3 gap-3" style={{ gridTemplateRows: 'auto 1fr auto' }}>

        {/* ═══ ROW 1: Header ═══════════════════════════════════════ */}
        <Header
          cycle={cycle} speed={speed} isRunning={isRunning}
          onStart={() => setIsRunning(true)}
          onPause={() => setIsRunning(false)}
          onReset={handleReset}
          onSpeedChange={setSpeed}
          states={states}
          climateStress={climateStress}
          trades={trades}
          alliances={alliances}
        />

        {/* ═══ ROW 2: Map + Right Panel ════════════════════════════ */}
        <div className="grid grid-cols-12 gap-3 overflow-hidden" style={{ height: 'calc(100vh - 340px)', minHeight: '400px' }}>

          {/* ─── Left: Map (8 columns) ─────────────────── */}
          <div className="col-span-8 min-h-0 overflow-hidden">
            <IndiaMap
              states={states}
              trades={trades}
              alliances={alliances}
              activeEvent={events.length > 0 ? events[events.length - 1] : null}
              onStateClick={setSelectedState}
            />
          </div>

          {/* ─── Right: Tabbed Panel (4 columns) ─────────────────── */}
          <div className="col-span-4 flex flex-col min-h-0 overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center gap-2 mb-4 p-2 rounded-2xl bg-[#0d0b1a]/70 border border-white/[0.08] flex-shrink-0">
              <TabBtn active={rightTab === 'resources'} label="Resources" onClick={() => setRightTab('resources')} />
              <TabBtn active={rightTab === 'godmode'} label="God" onClick={() => setRightTab('godmode')} />
              <TabBtn active={rightTab === 'scenarios'} label="Stories" onClick={() => setRightTab('scenarios')} />
              <TabBtn active={rightTab === 'compare'} label="Battle" onClick={() => setRightTab('compare')} />
              <TabBtn active={rightTab === 'explain'} label="Why?" onClick={() => setRightTab('explain')} />
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <span className={`w-3 h-3 rounded-full ${states.filter(s => s.alive !== false).length >= 6 ? 'bg-emerald-400' : states.filter(s => s.alive !== false).length >= 4 ? 'bg-amber-400' : 'bg-rose-400'} animate-pulse`} />
                <span className="text-sm text-zinc-200 font-mono tabular-nums font-bold">{states.filter(s => s.alive !== false).length}/8</span>
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
              {rightTab === 'resources' && (
                <ResourceDashboard states={states} />
              )}
              {rightTab === 'godmode' && (
                <div className="space-y-3">
                  <GodMode
                    states={states}
                    onTriggerEvent={(sId, type) => world.triggerEvent(sId, type)}
                    onBlockTrade={(s1, s2) => world.blockTrade(s1, s2, 10)}
                    onGiveAid={(sId, res, amt) => world.giveAid(sId, res, amt)}
                    onForceAction={(sId, action) => world.forceAction(sId, action)}
                  />
                  <WhatIfPanel
                    onRunScenario={handleRunScenario}
                    scenarioResult={scenarioResult}
                  />
                </div>
              )}
              {rightTab === 'scenarios' && (
                <div className="space-y-3">
                  {cycle > 50 && (
                    <AnalysisPanel
                      states={states}
                      history={history}
                      collapsedStates={world.collapsedStates}
                    />
                  )}
                  {cycle > 30 && (
                    <InsightsPanel
                      history={history}
                      states={states}
                      collapsedStates={world.collapsedStates}
                      crossRunResults={crossRunResults}
                      onRunCrossAnalysis={handleCrossRunAnalysis}
                      crossRunLoading={crossRunLoading}
                    />
                  )}
                  {cycle > 30 && (
                    <StoryPanel
                      history={history}
                      collapsedStates={world.collapsedStates}
                    />
                  )}
                  {cycle <= 30 && (
                    <div className="glass-card p-10 text-center animate-scale-in">
                      <div className="text-3xl mb-3 opacity-50">...</div>
                      <p className="text-zinc-400 text-sm">Run the simulation past <span className="text-gradient font-bold">cycle 30</span> to unlock</p>
                      <p className="text-zinc-500 text-xs mt-1">Analysis, Insights & Story panels</p>
                    </div>
                  )}
                </div>
              )}
              {rightTab === 'compare' && (
                <ComparisonView
                  aiResult={comparisonData.ai}
                  randomResult={comparisonData.random}
                  onRunComparison={handleRunComparison}
                />
              )}
              {rightTab === 'explain' && (
                <ExplainabilityPanel agentExplanations={agentExplanations} />
              )}
            </div>
          </div>
        </div>

        {/* ═══ ROW 3: BOTTOM DOCK — Events / Trends / Trade ════════ */}
        <div className="glass-card-glow flex flex-col" style={{ minHeight: '350px' }}>
          {/* Bottom tab bar */}
          <div className="flex items-center gap-1 px-5 pt-3 pb-0 border-b border-white/[0.06] flex-shrink-0">
            {[
              { key: 'events', label: 'Events' },
              { key: 'trends', label: 'Trends' },
              { key: 'trade',  label: 'Trade Network' },
              ...(cycle > 50 ? [{ key: 'analysis', label: 'Analysis' }] : []),
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setBottomTab(tab.key)}
                className={`relative px-7 py-3 text-[13px] font-bold transition-all rounded-t-xl
                  ${bottomTab === tab.key
                    ? 'text-violet-300 bg-violet-500/[0.1] border border-b-0 border-violet-400/25'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:bg-white/[0.03]'
                  }`}
              >
                {tab.label}
                {bottomTab === tab.key && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" />
                )}
              </button>
            ))}
            <div className="flex-1" />
            {bottomTab === 'events' && (
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-[13px] text-zinc-300 font-mono tabular-nums font-semibold">{events.length} events</span>
              </div>
            )}
          </div>

          {/* Bottom content */}
          <div className="overflow-y-auto px-5 py-4" style={{ minHeight: '280px' }}>
            {bottomTab === 'events' && <EventLog events={events} negotiations={negotiations} />}
            {bottomTab === 'trends' && <TrendCharts history={history} />}
            {bottomTab === 'trade' && <TradeNetwork trades={trades} alliances={alliances} negotiations={negotiations} />}
            {bottomTab === 'analysis' && cycle > 50 && (
              <AnalysisPanel
                states={states}
                history={history}
                collapsedStates={world.collapsedStates}
              />
            )}
          </div>
        </div>

        {/* ═══ State Detail Modal ══════════════════════════════════ */}
        {selectedState && (
          <StateDetail
            state={states.find((s) => s.id === selectedState)}
            onClose={() => setSelectedState(null)}
          />
        )}
      </div>
    </>
  );
}

export default App;
