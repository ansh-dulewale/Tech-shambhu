# 🌍 WorldSim — Adaptive Resource Scarcity & Agent Strategy Simulator

> **Team Tech-Shambhu** | Built with React + Vite + Tailwind CSS v4

AI agents govern 8 real Indian states, learning survival strategies through Q-Learning. Real news events drive the simulation. Dashboard + Simulation + Analysis — all in the browser.

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

---

## 📁 Project Structure

```
src/
├── data/
│   └── indiaStates.json          ✅ DONE — 8 states + 72 news events
├── engine/                        👤 SWAYAM
│   ├── Agent.js                   — Q-Learning AI agent
│   ├── World.js                   — Simulation engine (cycle logic)
│   └── TradeSystem.js             — Trade matching + trust
├── components/                    👤 GUNJAN
│   ├── Header.jsx                 — Title bar + controls
│   ├── IndiaMap.jsx               — Canvas hex map of India
│   ├── ResourceDashboard.jsx      — Bar charts per state
│   ├── TrendCharts.jsx            — Population/happiness line charts
│   ├── EventLog.jsx               — Scrolling news timeline
│   ├── StateDetail.jsx            — Popup when clicking a state
│   └── TradeNetwork.jsx           — Trade lines visualization
├── features/                      
│   ├── GodMode.jsx                — Manual intervention controls
│   ├── WhatIfPanel.jsx            — Scenario buttons
│   ├── ComparisonView.jsx         — AI vs Random split screen
│   ├── AnalysisPanel.jsx          — Strategy + collapse analysis
│   └── StoryPanel.jsx             — Auto-generated narrative
├── App.jsx                        👤 ANSH (integration)
├── App.css                        👤 GUNJAN
├── index.css                      ✅ DONE — Tailwind + theme
└── main.jsx                       ✅ DONE
```

---

# 👥 TEAM WORK DIVISION

---

## 👤 SWAYAM — Engine Person (Backend Brain)

### Your Job

Build the simulation engine — the AI brain, world logic, and trade system. Your code runs the entire simulation. Gunjan and Ansh will use YOUR functions to display and analyze data.

### Files to Create

### 📄 `src/engine/Agent.js`

**What it does**: One Q-Learning AI agent that learns which actions work best.

```javascript
// src/engine/Agent.js

const ACTIONS = [
  "HARVEST",
  "CONSERVE",
  "TRADE",
  "EXPAND",
  "DEFEND",
  "INNOVATE",
];

class Agent {
  constructor(stateId) {
    this.stateId = stateId;
    this.qTable = {}; // The "brain" — stores scores for each state-action pair
    this.learningRate = 0.1; // How fast it learns
    this.discountFactor = 0.9; // How much future matters
    this.explorationRate = 0.3; // Start exploring 30%
    this.actionHistory = []; // Track what actions were taken
  }

  // Convert resource levels to a simple state code
  // Example: water=25, food=71, energy=12, land=54 → "LOW_HIGH_LOW_MED"
  encodeState(resources, hasPartners, recentEvent) {
    const level = (val) => (val <= 30 ? "L" : val <= 60 ? "M" : "H");
    const key = `${level(resources.water)}_${level(resources.food)}_${level(resources.energy)}_${level(resources.land)}_${hasPartners ? "P" : "N"}_${recentEvent ? "E" : "X"}`;
    return key;
  }

  // Pick an action using epsilon-greedy strategy
  // 90% of time: pick best known action
  // 10% of time: try something random (exploration)
  chooseAction(stateCode) {
    // TODO:
    // 1. If random() < explorationRate → pick random action
    // 2. Else → look up qTable[stateCode] → pick action with highest score
    // 3. If stateCode not in qTable yet → initialize all actions to 0
    // 4. Return the chosen action string
  }

  // After action is done, calculate reward and update Q-table
  // reward = how good was the outcome
  learn(oldStateCode, action, reward, newStateCode) {
    // TODO: Q-Learning update formula:
    // Q(s,a) = Q(s,a) + α × [reward + γ × max(Q(s',a')) - Q(s,a)]
    // Where:
    //   α = this.learningRate
    //   γ = this.discountFactor
    //   s = oldStateCode, a = action
    //   s' = newStateCode
    //   max(Q(s',a')) = best score in new state
  }

  // Decay exploration rate over time (explore less as agent gets smarter)
  decayExploration(cycle) {
    // TODO: Reduce explorationRate gradually
    // Cycle 1-30: 0.3, Cycle 31-70: 0.15, Cycle 71+: 0.10
  }

  // Get strategy breakdown: { HARVEST: 42%, TRADE: 28%, ... }
  getStrategyBreakdown() {
    // TODO: Count actionHistory and return percentages
  }
}

export default Agent;
```

---

### 📄 `src/engine/World.js`

**What it does**: The main simulation. Runs one cycle, manages all 8 states.

```javascript
// src/engine/World.js
import Agent from "./Agent.js";
import TradeSystem from "./TradeSystem.js";

class World {
  constructor(statesData) {
    this.cycle = 0;
    this.states = {}; // All 8 states with their current data
    this.agents = {}; // One Agent per state
    this.tradeSystem = new TradeSystem();
    this.history = []; // Record of all cycles for charts
    this.eventLog = []; // All events that happened
    this.collapsedStates = [];

    // Initialize from JSON data
    // TODO: Loop through statesData.states, create state objects and agents
  }

  // Run ONE complete cycle — returns everything that happened
  tick() {
    this.cycle++;
    const cycleResult = {
      cycle: this.cycle,
      states: [],
      event: null,
      trades: [],
      collapsed: [],
      alliances: [],
    };

    // STEP 1: CONSUME — resources deplete based on population
    // TODO: For each alive state:
    //   water  -= population * 0.05
    //   food   -= population * 0.04
    //   energy -= population * 0.03
    //   land   -= population * 0.005
    //   Add small regeneration: water += 3, food += 2, energy += 1
    //   Clamp all values between 0 and 100

    // STEP 2: TRIGGER EVENT — 30% chance of news event
    // TODO: Random roll, if < 0.3, pick a random news event
    //   Apply effects to the target state
    //   Set cycleResult.event = the event object

    // STEP 3: AGENTS DECIDE — each AI picks an action
    // TODO: For each alive state:
    //   stateCode = agent.encodeState(resources, hasPartners, hadEvent)
    //   action = agent.chooseAction(stateCode)
    //   Apply action effects (see ACTION EFFECTS table below)

    // STEP 4: RESOLVE TRADES
    // TODO: Collect states that chose TRADE
    //   Call tradeSystem.matchAndExecute(tradingStates)
    //   Update cycleResult.trades

    // STEP 5: UPDATE WORLD
    // TODO: For each state:
    //   happiness = calculate based on resources
    //   population += if happy, -= if not
    //   gdp += trade bonus + surplus bonus

    // STEP 6: COLLAPSE CHECK
    // TODO: If any resource = 0 AND population < 100 → collapse
    //   Remove from alive states
    //   Add to collapsedStates with reason

    // STEP 7: AGENTS LEARN
    // TODO: For each alive agent:
    //   Calculate reward based on what happened
    //   Call agent.learn(oldState, action, reward, newState)

    // Save to history
    this.history.push({ ...cycleResult });
    return cycleResult;
  }

  // ACTION EFFECTS — what each action does to resources
  // HARVEST:   food +12, water +8, energy +5, land -8
  // CONSERVE:  all depletion reduced 50% this cycle
  // TRADE:     queued for trade matching (handled in step 4)
  // EXPAND:    population +10%, all resources -10%
  // DEFEND:    resources can't drop below current level this cycle
  // INNOVATE:  energy -10, future efficiency +5%

  // Get current state of all regions (for visualization)
  getState() {
    // TODO: Return array of all state objects with current values
  }

  // Reset everything to starting values
  reset(statesData) {
    // TODO: Reinitialize all states, agents, clear history
  }

  // GOD MODE functions
  forceAction(stateId, action) {
    // TODO: Override agent's next action
  }

  triggerEvent(stateId, eventType) {
    // TODO: Manually trigger a specific event
  }

  blockTrade(stateId1, stateId2, cycles) {
    // TODO: Prevent two states from trading
  }

  giveAid(stateId, resource, amount) {
    // TODO: Add resources to a state
  }
}

export default World;
```

---

### 📄 `src/engine/TradeSystem.js`

**What it does**: Matches trading states, executes exchanges, tracks trust.

```javascript
// src/engine/TradeSystem.js

class TradeSystem {
  constructor() {
    this.trustMatrix = {}; // trust['punjab_jharkhand'] = 5
    this.tradeHistory = [];
    this.blockedPairs = []; // God mode: blocked trades
  }

  // Find which states can trade with each other
  matchAndExecute(tradingStates, allStates) {
    const trades = [];

    // TODO:
    // 1. For each trading state, find:
    //    SURPLUS = resource with highest value above 50
    //    NEED = resource with lowest value below 40
    //
    // 2. Find complementary pairs:
    //    A's surplus matches B's need AND B's surplus matches A's need
    //
    // 3. Check if pair is blocked (God Mode)
    //
    // 4. Calculate exchange amount based on trust:
    //    trust 0-3: exchange 10, trust 4-6: exchange 15, trust 7-10: exchange 20
    //
    // 5. Execute: A gives surplus, B gives surplus
    //    Update both states' resources
    //
    // 6. Update trust: +1 for success

    return trades;
  }

  // Get trust level between two states
  getTrust(stateId1, stateId2) {
    const key = [stateId1, stateId2].sort().join("_");
    return this.trustMatrix[key] || 0;
  }

  // Update trust after trade
  updateTrust(stateId1, stateId2, delta) {
    const key = [stateId1, stateId2].sort().join("_");
    this.trustMatrix[key] = Math.max(
      0,
      Math.min(10, (this.trustMatrix[key] || 0) + delta),
    );
  }

  // Check if alliance formed (trust > 7 and 5+ trades)
  getAlliances() {
    // TODO: Return array of alliance pairs
  }

  // God Mode: block trades between two states
  blockPair(stateId1, stateId2, cycles) {
    // TODO: Add to blocked list with cycle countdown
  }
}

export default TradeSystem;
```

### ✅ Swayam's Checklist

- [ ] `Agent.js` — encodeState, chooseAction, learn, decayExploration, getStrategyBreakdown
- [ ] `World.js` — constructor, tick (all 7 steps), getState, reset, God Mode functions
- [ ] `TradeSystem.js` — matchAndExecute, getTrust, updateTrust, getAlliances, blockPair
- [ ] Test: Create a world, run 10 ticks, verify resources change and agents learn

### ⚡ Quick Test (Swayam can test independently)

```javascript
// Test in browser console or a temp file
import World from "./engine/World.js";
import statesData from "./data/indiaStates.json";

const world = new World(statesData);
for (let i = 0; i < 10; i++) {
  const result = world.tick();
  console.log(
    `Cycle ${result.cycle}:`,
    result.states[0].resources,
    result.event,
  );
}
```

---

## 👤 GUNJAN — Visual Person (UI + Map + Charts)

### Your Job

Build everything the user SEES — the layout, India map, charts, animations. You'll receive data from Swayam's engine and display it beautifully.

### Files to Create

### 📄 `src/components/Header.jsx`

**What it does**: Top bar with title, cycle counter, speed slider, play/pause/reset buttons.

```jsx
// src/components/Header.jsx
import React from "react";

function Header({
  cycle,
  speed,
  isRunning,
  onStart,
  onPause,
  onReset,
  onSpeedChange,
}) {
  return (
    <header className="flex items-center justify-between px-6 py-3 glass-card mb-4">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🌍</span>
        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          WorldSim India
        </h1>
      </div>

      {/* Center: Cycle Counter */}
      <div className="text-center">
        <span className="text-sm text-gray-400">Cycle</span>
        <div className="text-2xl font-bold text-white">{cycle}</div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {/* TODO: Play/Pause button */}
        {/* TODO: Reset button */}
        {/* TODO: Speed slider (1x to 10x) */}
      </div>
    </header>
  );
}

export default Header;
```

---

### 📄 `src/components/IndiaMap.jsx`

**What it does**: Canvas-based hex map showing 8 Indian states with colors, trade lines, and event effects.

```jsx
// src/components/IndiaMap.jsx
import React, { useRef, useEffect } from "react";

function IndiaMap({ states, trades, alliances, onStateClick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // TODO: Draw each state as a hexagon at its position
    // Color based on health: green (healthy) → yellow → orange → red → grey (collapsed)
    //
    // Health = average of (water + food + energy + land) / 4
    //   > 60 = green (#00c853)
    //   > 40 = yellow (#ffab00)
    //   > 20 = orange (#ff6d00)
    //   > 0  = red (#ff1744)
    //   collapsed = grey (#424242)
    //
    // Draw state name inside each hexagon
    // Draw population number below name

    // TODO: Draw trade lines between trading states
    // Thicker line = higher trust
    // Animated dashes for active trades

    // TODO: Draw alliance sparkle effects
    // Golden glow around allied state pairs
  }, [states, trades, alliances]);

  const handleClick = (e) => {
    // TODO: Detect which hexagon was clicked based on x,y coordinates
    // Call onStateClick(stateId) when a state is clicked
  };

  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-semibold mb-3 text-white">
        🗺️ India Resource Map
      </h2>
      <canvas
        ref={canvasRef}
        width={500}
        height={600}
        onClick={handleClick}
        className="w-full cursor-pointer rounded-lg"
        style={{ background: "rgba(10, 14, 39, 0.8)" }}
      />
    </div>
  );
}

export default IndiaMap;
```

---

### 📄 `src/components/ResourceDashboard.jsx`

**What it does**: Horizontal bar charts showing water/food/energy/land for each state.

```jsx
// src/components/ResourceDashboard.jsx
import React from "react";

const RESOURCE_COLORS = {
  water: "#00d4ff",
  food: "#00e676",
  energy: "#ffab00",
  land: "#8d6e63",
};

const RESOURCE_ICONS = {
  water: "💧",
  food: "🌾",
  energy: "⚡",
  land: "🏔️",
};

function ResourceBar({ label, value, color, icon }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xs w-5">{icon}</span>
      <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs w-8 text-right" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function ResourceDashboard({ states }) {
  return (
    <div className="glass-card p-4 overflow-y-auto max-h-96">
      <h2 className="text-lg font-semibold mb-3 text-white">📊 Resources</h2>
      {/* TODO: Loop through states, show ResourceBar for each resource */}
      {/* Show state name, then 4 bars (water, food, energy, land) */}
      {/* Grey out collapsed states */}
    </div>
  );
}

export default ResourceDashboard;
```

---

### 📄 `src/components/TrendCharts.jsx`

**What it does**: Line charts showing population and happiness over time using Chart.js.

```jsx
// src/components/TrendCharts.jsx
import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

function TrendCharts({ history }) {
  // TODO: Build chart data from history array
  // history = [{ cycle: 1, states: [{id, population, happiness, gdp}, ...] }, ...]
  //
  // Create one line per state for Population chart
  // Create one line per state for Happiness chart
  // Use each state's color for its line
  //
  // Chart.js options: dark background, transparent legends, smooth curves

  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-semibold mb-3 text-white">📈 Trends</h2>
      {/* TODO: <Line data={populationData} options={chartOptions} /> */}
      {/* TODO: <Line data={happinessData} options={chartOptions} /> */}
    </div>
  );
}

export default TrendCharts;
```

---

### 📄 `src/components/EventLog.jsx`

**What it does**: Scrolling timeline of news events that happened.

```jsx
// src/components/EventLog.jsx
import React, { useRef, useEffect } from "react";

function EventLog({ events }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new event arrives
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-semibold mb-3 text-white">📰 News Feed</h2>
      <div ref={scrollRef} className="overflow-y-auto max-h-48 space-y-2">
        {/* TODO: Map through events array */}
        {/* Each event: cycle number, headline, source, impact badges */}
        {/* Color code: red for disasters, green for positive */}
      </div>
    </div>
  );
}

export default EventLog;
```

---

### 📄 `src/components/StateDetail.jsx`

**What it does**: Modal popup when user clicks a state on the map.

```jsx
// src/components/StateDetail.jsx
import React from "react";

function StateDetail({ state, agent, onClose }) {
  if (!state) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="glass-card p-6 w-96 max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TODO: Show state name, title */}
        {/* TODO: 4 resource bars with values */}
        {/* TODO: Population, Happiness, GDP */}
        {/* TODO: Agent strategy breakdown (HARVEST 42%, TRADE 28%, ...) */}
        {/* TODO: Trade partners list */}
        {/* TODO: Close button */}
      </div>
    </div>
  );
}

export default StateDetail;
```

---

### 📄 `src/components/TradeNetwork.jsx`

**What it does**: Shows active trade relationships and trust levels.

```jsx
// src/components/TradeNetwork.jsx
import React from "react";

function TradeNetwork({ trades, alliances }) {
  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-semibold mb-3 text-white">
        🤝 Trade Network
      </h2>
      {/* TODO: List active trade pairs with trust bars */}
      {/* TODO: Highlight alliances with golden border */}
      {/* TODO: Show what was traded (food ↔ energy) */}
    </div>
  );
}

export default TradeNetwork;
```

### ✅ Gunjan's Checklist

- [ ] `Header.jsx` — play/pause/reset buttons, speed slider, cycle counter
- [ ] `IndiaMap.jsx` — draw hexagons, colors by health, trade lines, click handler
- [ ] `ResourceDashboard.jsx` — resource bars for all 8 states
- [ ] `TrendCharts.jsx` — population + happiness line charts
- [ ] `EventLog.jsx` — scrolling news with auto-scroll
- [ ] `StateDetail.jsx` — modal with full state info
- [ ] `TradeNetwork.jsx` — trade pairs + trust levels
- [ ] `App.css` — any extra CSS beyond Tailwind

### 🎨 Design Rules for Gunjan

- Background: `#0a0e27` (deep navy)
- Cards: Use `glass-card` class (already in index.css)
- Water = `#00d4ff` (cyan), Food = `#00e676` (green), Energy = `#ffab00` (amber), Land = `#8d6e63` (brown)
- All transitions should be 300-500ms ease-out
- Font: Inter (already loaded via CSS)

---

## 👤 ANSH — Connector + Features Person

### Your Job

Build the special features (God Mode, What-If, Analysis, Story) AND connect Swayam's engine to Gunjan's visuals in `App.jsx`. You are the glue.

### Files to Create

### 📄 `src/features/GodMode.jsx`

**What it does**: Panel with buttons to manually intervene in the simulation.

```jsx
// src/features/GodMode.jsx
import React, { useState } from "react";

function GodMode({
  states,
  onTriggerEvent,
  onBlockTrade,
  onGiveAid,
  onForceAction,
}) {
  const [selectedState, setSelectedState] = useState("");
  const [selectedAction, setSelectedAction] = useState("");

  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-semibold mb-3 text-yellow-400">
        🌩️ God Mode
      </h2>

      {/* TODO: Dropdown to select state */}
      {/* TODO: Button row: */}
      {/*   ⚡ Trigger Event — opens event type selector */}
      {/*   🚫 Block Trade — select 2 states to block */}
      {/*   🎁 Give Aid — select resource + amount */}
      {/*   🎯 Force Action — select action to force */}
      {/* Each button calls the corresponding callback */}
    </div>
  );
}

export default GodMode;
```

---

### 📄 `src/features/WhatIfPanel.jsx`

**What it does**: Pre-built scenario buttons that rerun the simulation with different conditions.

```jsx
// src/features/WhatIfPanel.jsx
import React from "react";

const SCENARIOS = [
  {
    id: "no_water_rajasthan",
    label: "What if Rajasthan had no water?",
    changes: { rajasthan: { water: 5 } },
  },
  {
    id: "no_trade",
    label: "What if no trade allowed?",
    changes: { global: { tradeDisabled: true } },
  },
  {
    id: "double_disasters",
    label: "What if disasters doubled?",
    changes: { global: { eventRate: 0.6 } },
  },
  {
    id: "full_cooperation",
    label: "What if all states cooperated?",
    changes: { global: { forceTrade: true } },
  },
  {
    id: "double_population_up",
    label: "What if UP population doubled?",
    changes: { uttarpradesh: { population: 1400 } },
  },
];

function WhatIfPanel({ onRunScenario, scenarioResult }) {
  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-semibold mb-3 text-purple-400">
        🔮 What-If Scenarios
      </h2>
      {/* TODO: Render buttons for each scenario */}
      {/* On click: call onRunScenario(scenario) */}
      {/* Show comparison results if scenarioResult exists */}
    </div>
  );
}

export default WhatIfPanel;
```

---

### 📄 `src/features/AnalysisPanel.jsx`

**What it does**: Shows sustainability rankings, collapse reasons, strategy breakdowns.

```jsx
// src/features/AnalysisPanel.jsx
import React from "react";

function AnalysisPanel({ states, agents, collapsedStates, history }) {
  // TODO: Calculate sustainability score for each state
  // Score = (survivalLength × 0.3) + (avgHappiness × 0.3) + (gdpGrowth × 0.2) + (tradeCount × 0.2)

  // TODO: For collapsed states, trace back why they collapsed
  // Which resource hit 0? What events made it worse? Did they trade?

  // TODO: Map strategies to real-world parallels
  // TRADE heavy → "Like Singapore"
  // CONSERVE heavy → "Like Norway"
  // INNOVATE heavy → "Like Israel"

  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-semibold mb-3 text-green-400">📋 Analysis</h2>
      {/* TODO: Sustainability rankings table */}
      {/* TODO: Collapse analysis cards */}
      {/* TODO: Strategy breakdown per state */}
      {/* TODO: Real-world parallels */}
    </div>
  );
}

export default AnalysisPanel;
```

---

### 📄 `src/features/StoryPanel.jsx`

**What it does**: Auto-generates a narrative of what happened in the simulation.

```jsx
// src/features/StoryPanel.jsx
import React from "react";

function generateStory(history, collapsedStates) {
  const chapters = [];

  // TODO: Chapter 1 "Early Days" (cycles 1-25)
  // Which states started strong? First trades formed?
  // Template: "[State], blessed with abundant [resource], began by [action]..."

  // TODO: Chapter 2 "First Crisis" (cycles 25-50)
  // Major events, how agents adapted
  // Template: "When [event] struck [state], its AI agent [response]..."

  // TODO: Chapter 3 "Alliances & Rivalries" (cycles 50-75)
  // Trade networks, who partnered whom
  // Template: "A powerful alliance formed between [state1] and [state2]..."

  // TODO: Chapter 4 "The Outcome" (cycles 75-100)
  // Survivors, collapsed, final analysis
  // Template: "[State] collapsed because [reason]. Real-world parallel: [comparison]"

  return chapters;
}

function StoryPanel({ history, collapsedStates }) {
  const story = generateStory(history, collapsedStates);

  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-semibold mb-3 text-amber-400">📖 Story</h2>
      {/* TODO: Render each chapter with title and paragraphs */}
    </div>
  );
}

export default StoryPanel;
```

---

### 📄 `src/features/ComparisonView.jsx`

**What it does**: Split-screen showing AI agents vs Random agents.

```jsx
// src/features/ComparisonView.jsx
import React from "react";

function ComparisonView({ aiResult, randomResult }) {
  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-semibold mb-3 text-red-400">
        ⚔️ AI vs Random
      </h2>
      {/* TODO: Two columns side by side */}
      {/* LEFT: AI agent results — states alive, avg happiness, trades, GDP */}
      {/* RIGHT: Random agent results — same metrics */}
      {/* BOTTOM: Conclusion — "AI was X% better" */}
    </div>
  );
}

export default ComparisonView;
```

---

### 📄 `src/App.jsx` — THE INTEGRATION FILE

**What it does**: Connects Swayam's engine to Gunjan's components + Ansh's features.

```jsx
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
  // State
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
  const [showAnalysis, setShowAnalysis] = useState(false);
  const intervalRef = useRef(null);

  // Run one cycle
  const runCycle = useCallback(() => {
    const result = world.tick();
    setCycle(result.cycle);
    setStates(result.states);
    if (result.event) setEvents((prev) => [...prev, result.event]);
    setTrades(result.trades);
    setAlliances(result.alliances);
    setHistory((prev) => [...prev, result]);
  }, [world]);

  // Simulation loop
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(runCycle, 1000 / speed);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, speed, runCycle]);

  // Initialize
  useEffect(() => {
    setStates(world.getState());
  }, [world]);

  return (
    <div className="min-h-screen p-4">
      <Header
        cycle={cycle}
        speed={speed}
        isRunning={isRunning}
        onStart={() => setIsRunning(true)}
        onPause={() => setIsRunning(false)}
        onReset={() => {
          world.reset(statesData);
          setCycle(0);
          setEvents([]);
          setHistory([]);
          setStates(world.getState());
        }}
        onSpeedChange={setSpeed}
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Left: Map + Event Log */}
        <div className="col-span-5 space-y-4">
          <IndiaMap
            states={states}
            trades={trades}
            alliances={alliances}
            onStateClick={setSelectedState}
          />
          <EventLog events={events} />
        </div>

        {/* Right: Dashboard + Trends + Trade */}
        <div className="col-span-4 space-y-4">
          <ResourceDashboard states={states} />
          <TrendCharts history={history} />
          <TradeNetwork trades={trades} alliances={alliances} />
        </div>

        {/* Far Right: Features */}
        <div className="col-span-3 space-y-4">
          <GodMode
            states={states}
            onTriggerEvent={(sId, type) => world.triggerEvent(sId, type)}
            onBlockTrade={(s1, s2) => world.blockTrade(s1, s2, 10)}
            onGiveAid={(sId, res, amt) => world.giveAid(sId, res, amt)}
            onForceAction={(sId, action) => world.forceAction(sId, action)}
          />
          <WhatIfPanel
            onRunScenario={(s) => console.log("TODO: run scenario", s)}
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
```

### ✅ Ansh's Checklist

- [ ] `GodMode.jsx` — 4 intervention buttons with dropdowns
- [ ] `WhatIfPanel.jsx` — 5 scenario buttons + comparison display
- [ ] `AnalysisPanel.jsx` — rankings, collapse reasons, parallels
- [ ] `StoryPanel.jsx` — 4-chapter auto-generated narrative
- [ ] `ComparisonView.jsx` — AI vs Random split view
- [ ] `App.jsx` — Wire everything together (after Swayam + Gunjan finish)

---

# 🔗 INTEGRATION GUIDE

## Step 1: Everyone Works Independently (3-4 hours)

```
Swayam → engine/Agent.js, engine/World.js, engine/TradeSystem.js
Gunjan → components/Header.jsx, IndiaMap.jsx, ResourceDashboard.jsx, etc.
Ansh  → features/GodMode.jsx, WhatIfPanel.jsx, AnalysisPanel.jsx, etc.
```

## Step 2: Integration (30 min)

```
1. Ansh pulls Swayam's and Gunjan's code
2. Ansh updates App.jsx imports to connect engine → components
3. Quick test: npm run dev → verify map shows, simulation runs
```

## Step 3: Bug Fix + Polish (30 min)

```
Everyone together:
- Fix any data format mismatches
- Adjust colors/animations
- Test God Mode and What-If
```

## Data Format Contract (CRITICAL — Everyone Must Follow)

### State Object (Swayam outputs this, Gunjan + Ansh consume it):

```javascript
{
  id: "punjab",
  name: "Punjab",
  title: "India's Bread Basket",
  resources: { water: 45, food: 71, energy: 30, land: 54 },
  population: 612,
  happiness: 72,
  gdp: 1050,
  alive: true,
  action: "TRADE",
  color: "#4CAF50",
  position: { x: 220, y: 100 },
  strategy: { HARVEST: 15, CONSERVE: 28, TRADE: 42, EXPAND: 5, DEFEND: 0, INNOVATE: 10 }
}
```

### Event Object:

```javascript
{
  cycle: 12,
  headline: "Punjab groundwater drops to critical",
  source: "The Hindu, 2024",
  stateId: "punjab",
  effects: { water: -25 },
  type: "drought"
}
```

### Trade Object:

```javascript
{
  from: "punjab",
  to: "jharkhand",
  gave: { resource: "food", amount: 15 },
  got: { resource: "energy", amount: 20 },
  trust: 6
}
```

---

## 📜 License

MIT — Team Tech-Shambhu
