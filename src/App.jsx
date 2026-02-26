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

// Engine
import World from "./engine/World";

// ─── Tab Button ─────────────────────────────────────────────────────
function TabBtn({ active, label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`tab-pill relative px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap tracking-wide
        ${active
          ? 'active bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 border border-violet-400/25 text-violet-300 shadow-md shadow-violet-500/8'
          : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-white/[0.06]'
        }`}
    >
      {icon && <span className="mr-1.5 text-sm">{icon}</span>}{label}
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" />
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
  const intervalRef = useRef(null);

  // ─── Tab state ──────────────────────────────────────────────────
  const [rightTab, setRightTab] = useState('resources');  // resources | godmode | scenarios
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

  // ─── Layout ─────────────────────────────────────────────────────
  return (
    <>
      <ThreeBackground />
      <div className="noise-overlay" />
      <div className="relative z-10 h-screen flex flex-col overflow-hidden p-3 gap-3">

        {/* ═══ TOP: Header ═══════════════════════════════════════════ */}
        <Header
          cycle={cycle} speed={speed} isRunning={isRunning}
          onStart={() => setIsRunning(true)}
          onPause={() => setIsRunning(false)}
          onReset={handleReset}
          onSpeedChange={setSpeed}
          states={states}
        />

        {/* ═══ MIDDLE: Map + Right Panel ════════════════════════════ */}
        <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">

          {/* ─── Left: Map (large, 7 columns) ────────────────────── */}
          <div className="col-span-7 flex flex-col gap-3 min-h-0">
            <div className="flex-1 min-h-0">
              <IndiaMap
                states={states}
                trades={trades}
                alliances={alliances}
                onStateClick={setSelectedState}
              />
            </div>
          </div>

          {/* ─── Right: Tabbed Panel (5 columns) ─────────────────── */}
          <div className="col-span-5 flex flex-col min-h-0">
            {/* Tab bar with glass background */}
            <div className="flex items-center gap-1.5 mb-3 p-1 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <TabBtn active={rightTab === 'resources'} label="Resources" onClick={() => setRightTab('resources')} />
              <TabBtn active={rightTab === 'godmode'} label="God Mode" onClick={() => setRightTab('godmode')} />
              <TabBtn active={rightTab === 'scenarios'} label="Scenarios" onClick={() => setRightTab('scenarios')} />
              <TabBtn active={rightTab === 'compare'} label="AI Battle" onClick={() => setRightTab('compare')} />
              <div className="flex-1" />
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03]">
                <span className={`w-2 h-2 rounded-full ${states.filter(s => s.alive !== false).length >= 6 ? 'bg-emerald-400' : states.filter(s => s.alive !== false).length >= 4 ? 'bg-amber-400' : 'bg-rose-400'} animate-pulse`} />
                <span className="text-[10px] text-zinc-400 font-mono tabular-nums font-medium">{states.filter(s => s.alive !== false).length}/8</span>
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
                    <StoryPanel
                      history={history}
                      collapsedStates={world.collapsedStates}
                    />
                  )}
                  {cycle <= 50 && (
                    <div className="glass-card p-10 text-center animate-scale-in">
                      <div className="text-3xl mb-3 opacity-50">...</div>
                      <p className="text-zinc-400 text-sm">Run the simulation past <span className="text-gradient font-bold">cycle 50</span> to unlock</p>
                      <p className="text-zinc-500 text-xs mt-1">Analysis & Story panels</p>
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
            </div>
          </div>
        </div>

        {/* ═══ BOTTOM DOCK: Events / Trends / Trade ════════════════ */}
        <div className="glass-card-glow flex flex-col" style={{ height: '230px', minHeight: '230px' }}>
          {/* Bottom tab bar */}
          <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 border-b border-white/[0.04]">
            <TabBtn active={bottomTab === 'events'} label="Event Feed" onClick={() => setBottomTab('events')} />
            <TabBtn active={bottomTab === 'trends'} label="Trends" onClick={() => setBottomTab('trends')} />
            <TabBtn active={bottomTab === 'trade'} label="Trade Network" onClick={() => setBottomTab('trade')} />
            {cycle > 50 && (
              <TabBtn active={bottomTab === 'analysis'} label="Analysis" onClick={() => setBottomTab('analysis')} />
            )}
            <div className="flex-1" />
            {bottomTab === 'events' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03]">
                <span className="text-[10px] text-zinc-500 font-mono tabular-nums">{events.length} events</span>
              </div>
            )}
          </div>

          {/* Bottom content */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {bottomTab === 'events' && <EventLog events={events} />}
            {bottomTab === 'trends' && <TrendCharts history={history} />}
            {bottomTab === 'trade' && <TradeNetwork trades={trades} alliances={alliances} />}
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
