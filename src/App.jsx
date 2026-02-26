// src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import statesData from "./data/indiaStates.json";

// Gunjan's components
import Header from "./components/Header";
import IndiaMap from "./components/IndiaMap";
import ResourceDashboard from "./components/ResourceDashboard";
import TrendCharts from "./components/TrendCharts";
import EventLog from "./components/EventLog";
import StateDetail from "./components/StateDetail";
import TradeNetwork from "./components/TradeNetwork";

// Ansh's features
import GodMode from "./features/GodMode";
import WhatIfPanel from "./features/WhatIfPanel";
import AnalysisPanel from "./features/AnalysisPanel";
import StoryPanel from "./features/StoryPanel";
import ComparisonView from "./features/ComparisonView";

// Swayam's engine
import World from "./engine/World";

function App() {
  // Core simulation state
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

  // Run one cycle
  const runCycle = useCallback(() => {
    const result = world.tick();
    setCycle(result.cycle);
    setStates(result.states);
    if (result.event) setEvents((prev) => [...prev, result.event]);
    // Accumulate trades from last 5 cycles so Trade Network always has data
    setTrades((prev) => {
      const updated = [...prev, ...(result.trades || [])];
      // Keep only the most recent 20 trades to avoid clutter
      return updated.slice(-20);
    });
    setAlliances(result.alliances);
    setHistory((prev) => [...prev, result]);
  }, [world]);

  // Simulation loop — runs at speed-adjusted interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(runCycle, 1000 / speed);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, speed, runCycle]);

  // Initialize states on mount
  useEffect(() => {
    setStates(world.getState());
  }, [world]);

  // Reset handler
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

  // What-If scenario runner
  const handleRunScenario = useCallback(
    (scenario) => {
      // Pause current sim
      setIsRunning(false);

      // Create a fresh world with modifications
      const modifiedData = JSON.parse(JSON.stringify(statesData));

      // Separate global vs per-state changes
      const globalChanges = scenario.changes.global || {};

      // Apply per-state changes to data
      Object.entries(scenario.changes).forEach(([target, changes]) => {
        if (target === "global") return;
        const stateData = modifiedData.states.find((s) => s.id === target);
        if (stateData) {
          Object.entries(changes).forEach(([key, value]) => {
            if (key in stateData.resources) {
              stateData.resources[key] = value;
            } else {
              stateData[key] = value;
            }
          });
        }
      });

      // Run 100 cycles of the scenario in the background
      const scenarioWorld = new World(modifiedData);

      // Apply global settings to the scenario engine
      if (globalChanges.tradeDisabled) scenarioWorld.setTradeDisabled(true);
      if (globalChanges.eventRate !== undefined) scenarioWorld.setEventRate(globalChanges.eventRate);
      if (globalChanges.forceTrade) {
        // Force all agents to pick TRADE every cycle
        Object.keys(scenarioWorld.agents).forEach((id) => {
          scenarioWorld.agents[id].forceNextAction('TRADE');
        });
      }

      let survived = 0;
      let totalHappiness = 0;
      let totalTrades = 0;
      let totalGdp = 0;

      for (let i = 0; i < 100; i++) {
        // Re-force TRADE each cycle if forceTrade is on
        if (globalChanges.forceTrade) {
          Object.keys(scenarioWorld.agents).forEach((id) => {
            if (scenarioWorld.states[id]?.alive) {
              scenarioWorld.agents[id].forceNextAction('TRADE');
            }
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
        survived,
        total,
        avgHappiness: Math.round(totalHappiness / total),
        totalTrades,
        totalGdp: Math.round(totalGdp),
        comparison: `Scenario "${scenario.label}" resulted in ${survived}/${total} states surviving.`,
      });
    },
    []
  );

  // AI vs Random comparison runner
  const handleRunComparison = useCallback(() => {
    const runSim = (useAI) => {
      const simWorld = new World(JSON.parse(JSON.stringify(statesData)));
      let totalTrades = 0;

      for (let i = 0; i < 100; i++) {
        if (!useAI) {
          // Force random actions each cycle
          const ACTIONS = ['HARVEST', 'CONSERVE', 'TRADE', 'EXPAND', 'DEFEND', 'INNOVATE'];
          Object.keys(simWorld.agents).forEach((id) => {
            if (simWorld.states[id]?.alive) {
              const randomAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
              simWorld.agents[id].forceNextAction(randomAction);
            }
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
      return {
        survived,
        total,
        avgHappiness: Math.round(totalHappiness / total),
        totalTrades,
        totalGdp: Math.round(totalGdp),
      };
    };

    setComparisonData({
      ai: runSim(true),
      random: runSim(false),
    });
  }, []);

  return (
    <div className="min-h-screen p-4">
      <Header
        cycle={cycle}
        speed={speed}
        isRunning={isRunning}
        onStart={() => setIsRunning(true)}
        onPause={() => setIsRunning(false)}
        onReset={handleReset}
        onSpeedChange={setSpeed}
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Left Column: Map + Event Log */}
        <div className="col-span-4 space-y-4">
          <IndiaMap
            states={states}
            trades={trades}
            alliances={alliances}
            onStateClick={setSelectedState}
          />
          <EventLog events={events} />
        </div>

        {/* Center Column: Dashboard + Trends + Trade */}
        <div className="col-span-4 space-y-4">
          <ResourceDashboard states={states} />
          <TrendCharts history={history} />
          <TradeNetwork trades={trades} alliances={alliances} />
        </div>

        {/* Right Column: Features */}
        <div className="col-span-4 space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto">
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
          <ComparisonView
            aiResult={comparisonData.ai}
            randomResult={comparisonData.random}
            onRunComparison={handleRunComparison}
          />
        </div>
      </div>

      {/* State Detail Modal */}
      {selectedState && (
        <StateDetail
          state={states.find((s) => s.id === selectedState)}
          onClose={() => setSelectedState(null)}
        />
      )}
    </div>
  );
}

export default App;
