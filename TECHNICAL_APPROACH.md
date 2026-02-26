# WorldSim — Technical Approach Document

## 1. Architecture Overview

```
┌───────────────────────────────────────────────────────┐
│                    REACT APP (Vite)                     │
├──────────┬──────────┬──────────┬──────────────────────┤
│  Data    │  Engine  │  Visual  │  Features            │
│  Layer   │  Layer   │  Layer   │  Layer               │
├──────────┼──────────┼──────────┼──────────────────────┤
│ states   │ engine   │ IndiaMap │ GodMode              │
│ .json    │ .js      │ .jsx     │ .jsx                 │
│          │ agent.js │ Charts   │ WhatIf.jsx           │
│          │ trade.js │ .jsx     │ Comparison.jsx       │
│          │          │          │ Analysis.jsx         │
└──────────┴──────────┴──────────┴──────────────────────┘
```

---

## 2. Data Layer — Real Indian State Data

### Data Source Strategy

- **Not live API** — unreliable during hackathon demos
- **Not hardcoded in JS** — hard to maintain
- **Static JSON with real sources** — reliable + credible + swappable

### Data Sources Used

| Source                        | Data                                   | URL                        |
| ----------------------------- | -------------------------------------- | -------------------------- |
| data.gov.in                   | Crop production, land use              | https://data.gov.in        |
| India WRIS                    | Water resources, groundwater, rainfall | https://indiawris.gov.in   |
| Central Electricity Authority | Power generation per state             | https://cea.nic.in         |
| Census of India               | Land area, population density          | https://censusindia.gov.in |
| The Hindu, NDTV, ET           | News headlines for events              | Various                    |

### Data Format

```json
{
  "id": "punjab",
  "name": "Punjab",
  "resources": { "water": 55, "food": 95, "energy": 30, "land": 60 },
  "population": 600,
  "sources": {
    "water": "India WRIS, Central Ground Water Board 2024"
  },
  "news": [
    {
      "headline": "Punjab groundwater drops to critical",
      "source": "The Hindu, 2024",
      "effects": { "water": -25 },
      "type": "drought"
    }
  ]
}
```

---

## 3. AI Agent — Q-Learning Algorithm

### Why Q-Learning?

| Criteria              | Q-Learning | Deep Q-Network    | Policy Gradient |
| --------------------- | ---------- | ----------------- | --------------- |
| Runs in browser JS    | ✅         | ❌ (needs Python) | ❌              |
| Explainable to judges | ✅         | ❌ (black box)    | ❌              |
| Visible learning      | ✅         | ✅                | ⚠️              |
| Implementation time   | 2 hours    | 8+ hours          | 10+ hours       |
| Sufficient for demo   | ✅         | Overkill          | Overkill        |

### State Encoding

Resources are discretized into 5 levels across 4 resources = 5⁴ = 625 base states. With additional context (has_partners, recent_event), total state space ≈ 5,000. This provides enough granularity for nuanced emergent strategies while keeping the Q-table tractable.

```
Water:  0-15 = CRITICAL, 16-30 = LOW, 31-50 = MID, 51-75 = HIGH, 76-100 = SURPLUS
Food:   0-15 = CRITICAL, 16-30 = LOW, 31-50 = MID, 51-75 = HIGH, 76-100 = SURPLUS
Energy: 0-15 = CRITICAL, 16-30 = LOW, 31-50 = MID, 51-75 = HIGH, 76-100 = SURPLUS
Land:   0-15 = CRITICAL, 16-30 = LOW, 31-50 = MID, 51-75 = HIGH, 76-100 = SURPLUS
```

### Action Space (6 actions)

| Action   | Resource Effects                       | Condition        |
| -------- | -------------------------------------- | ---------------- |
| HARVEST  | Food +12, Water +8, Energy +5, Land -8 | Always available |
| CONSERVE | All depletion reduced 50%              | Always available |
| TRADE    | Queued for matching                    | Always available |
| EXPAND   | Population +10%, Resources -10%        | Always available |
| DEFEND   | Resources floor = current level        | Always available |
| INNOVATE | Energy -10, future efficiency +5%      | Always available |

### Reward Function (Smooth & Continuous)

```
Reward components (continuous gradients, no hard thresholds):
  - Resource gradient:    (avg - 40) / 10     → linear, centered at 40
  - Critical penalty:     -3 × (1 - tanh((v-5)/5))  per resource <15
  - Population (S-curve): 3 × tanh((pop - 350) / 200)
  - Happiness (linear):   (happiness - 50) / 25
  - Trade (sqrt):         2 × √(trade_count)   → diminishing returns
  - Innovation bonus:     innovation_level × 2
  - Balance penalty:      -1.5 × (1 - min/max) → penalize imbalance
  - Collapse:             -100 (terminal)

This produces a smooth gradient landscape that Q-Learning can
follow incrementally, instead of discrete jumps at arbitrary thresholds.
```

### Learning Parameters

```
Learning Rate (α):    0.1  → How fast Q-values update
Discount Factor (γ):  0.9  → How much future rewards matter
Exploration Rate (ε): Continuous exponential decay
  ε(t) = max(0.05, 0.3 × e^(-0.02t))
  Cycle 1:    ε ≈ 0.30 (explore 30%)
  Cycle 35:   ε ≈ 0.15
  Cycle 70:   ε ≈ 0.07
  Cycle 100+: ε ≈ 0.05 (minimum 5% exploration)

Q-table persisted to localStorage every 10 learning steps.
```

### Q-Update Rule

```
Q(s, a) ← Q(s, a) + α × [reward + γ × max(Q(s', a')) - Q(s, a)]

Where:
  s  = current state
  a  = action taken
  s' = next state (after action)
  a' = best action in next state
```

---

## 4. Trade System

### Matching Algorithm

```
1. Collect all states that chose TRADE
2. For each, identify SURPLUS (highest resource > 40) and NEED (lowest resource < 50)
3. Find complementary pairs (A’s surplus = B’s need OR B’s surplus = A’s need)
4. Score matches by trust level
5. Allied pairs (+5% exchange bonus for trust ≥ 7 and 5+ trades)
6. Execute top matches first
7. Unmatched states get no trade this cycle
```

### Trust Dynamics

```
Successful trade: trust += 1 (max 10)
No trade this cycle: trust -= 0.1 (natural decay)
Betrayal (partner refused): trust -= 0.5
Trust reaches 0: relationship removed
Alliance threshold: trust ≥ 7 AND trades ≥ 5
Alliance bonus: +5% better exchange rates (implemented)
```

---

## 5. Event System

### Probability Model

```
Each cycle:
  P(any event) = 0.30 (30%)
  If event triggers: 70% state-specific, 30% global
    => Effective: ~21% state event, ~9% global event

Cooldown: State events cannot repeat within 10 cycles
          Global events cannot repeat within 15 cycles
Events per state: 8 unique events
Global events: 8 unique events
Total pool: 72 events
```

---

## 6. Simulation Cycle (7 Steps)

```
Step 1: CONSUME
  resource -= population × consumption_rate × innovation_bonus
  Natural regeneration scaled by land factor (0.5x at land=0, 1.5x at land=100)

Step 2: EVENT
  Random event triggered based on probability
  Effects applied to target state(s)

Step 3: AGENTS DECIDE
  Each Q-Learning agent observes state → selects action
  Action effects applied

Step 4: TRADE RESOLUTION
  Match traders → execute exchanges → update trust
  Apply betrayal penalties for refused trades
  Decay trust for inactive pairs

Step 5: WORLD UPDATE
  Happiness = f(resources above survival threshold)
  Population = f(happiness, food, water)
  GDP = production function:
    labor    = √(population / 500)      → diminishing returns
    resource = (avg / 50)^0.6           → Cobb-Douglas style
    trade    = 1 + 0.15 × √(trades)    → openness multiplier
    innov    = 1 + innovation_bonus     → tech multiplier
    cycle_gdp = 50 × labor × resource × trade × innov
    GDP smoothed: 80% carry-over + 20% new production

Step 6: COLLAPSE CHECK
  If (≥2 resources = 0 AND pop < 150) OR (≥1 resource = 0 AND pop < 80) → COLLAPSE
  Collapsed state marked dead, recorded with reason and cycle

Step 7: AGENTS LEARN
  Q-update for each alive agent using reward signal
  Q-tables persisted to localStorage periodically
```

---

## 7. Visualization Strategy

### India Map (Canvas API)

- Real GeoJSON boundaries rendered on HTML5 Canvas
- Fill color = health gradient (green -> yellow -> orange -> red -> grey)
- Animated trade arcs and alliance lines between active partners
- Pulse effects on event triggers
- Zoom and pan controls for map-only navigation
- Hover tooltips with resource breakdowns

### Charts (Chart.js + react-chartjs-2)

- Resource dashboard: card grid with resource bars per state
- Line chart: population over time (8 lines)
- Line chart: happiness over time (8 lines)
- Line chart: avg resources over time (water/food/energy/land)
- Stacked area chart: strategy evolution (% of states per dominant action)
- Trade network list with trust bars and alliance labels

### Design System

- Dark obsidian background with glassmorphism cards
- Tailwind CSS v4 for utility-first styling
- Ember & Violet color palette (violet/fuchsia/rose/amber accents)
- CSS animations for state transitions and events
- Three.js animated particle background
- Inter font family from Google Fonts

---

## 8. Component Structure (React)

```
src/
├── App.jsx                    ← Main layout + simulation orchestrator
├── components/
│   ├── Header.jsx             ← Title, cycle counter, controls
│   ├── IndiaMap.jsx           ← Canvas-based GeoJSON map with zoom/pan
│   ├── ResourceDashboard.jsx  ← Resource card grid per state
│   ├── TrendCharts.jsx        ← Line charts (population, happiness, resources)
│   ├── EventLog.jsx           ← Scrolling event timeline
│   ├── StateDetail.jsx        ← Detail popup for state info
│   ├── TradeNetwork.jsx       ← Trade relationship list
│   └── ThreeBackground.jsx    ← Three.js animated particle background
├── features/
│   ├── AnalysisPanel.jsx      ← Strategy + collapse analysis
│   ├── StoryPanel.jsx         ← Auto-generated narrative
│   ├── GodMode.jsx            ← God mode controls
│   ├── WhatIfPanel.jsx        ← Scenario buttons
│   └── ComparisonView.jsx     ← AI vs Random comparison
├── engine/
│   ├── Agent.js               ← Q-Learning class
│   ├── World.js               ← Simulation engine + event system
│   └── TradeSystem.js         ← Trade matching + trust + decay
├── data/
│   └── indiaStates.json       ← 8 states + 72 events
```

---

## 9. Key Design Decisions

| Decision      | Choice          | Rationale                                      |
| ------------- | --------------- | ---------------------------------------------- |
| Framework     | React + Vite    | Fast dev, component-based, hot reload          |
| Styling       | Tailwind CSS v4 | Rapid iteration, consistent design tokens      |
| AI Algorithm  | Q-Learning      | Runs in browser, explainable, sufficient depth |
| Data Source   | Static JSON     | Reliable demo, real data, cited sources        |
| Map Rendering | HTML5 Canvas    | Smooth animations, no heavy dependencies       |
| Charts        | Chart.js        | Free, animated, well-documented                |
| No Backend    | Frontend only   | Zero deployment friction, instant demo         |

---

## 10. Emergent Strategy Patterns

| Strategy Pattern          | Discovered By Agent      | Analysis Insight |
| ------------------------- | ------------------------ | ---------------- |
| Trade surplus for needs   | Punjab, Kerala           | Converges to TRADE when resources diverge |
| Innovate under scarcity   | Rajasthan                | Energy investment pays off long-term |
| Conserve for future       | Multiple states          | Low-risk, plateaus in mid-game |
| Build trade alliances     | Punjab-Jharkhand         | Trust > 7 unlocks alliance bonus |
| Over-harvest → collapse   | Tamil Nadu (if isolated) | Land depletion cascades to food/water |
| Isolationism → stagnation | States that refuse trade | Betrayal penalties erode trust network |

---

## 11. Scalability & Future Scope

- **Swap JSON → Scale globally**: Replace `indiaStates.json` with `worldCountries.json`
- **Live API integration**: Connect to data.gov.in API for real-time updates
- **Deep RL upgrade**: Replace Q-table with neural network for richer learning
- **Multiplayer**: Let users control individual states and compete
- **Policy simulation**: Model real government schemes (MGNREGA, PM-KISAN) as actions
