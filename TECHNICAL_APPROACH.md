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

Resources are discretized into 3 levels (LOW/MED/HIGH) across 4 resources = 3⁴ = 81 possible states. With additional context (has_partners, recent_event), total states ≈ 200-300. This keeps the Q-table manageable.

```
Water: 0-30 = LOW, 31-60 = MED, 61-100 = HIGH
Food:  0-30 = LOW, 31-60 = MED, 61-100 = HIGH
Energy: 0-30 = LOW, 31-60 = MED, 61-100 = HIGH
Land:  0-30 = LOW, 31-60 = MED, 61-100 = HIGH
```

### Action Space (6 actions)

| Action   | Resource Effects                       | Condition        |
| -------- | -------------------------------------- | ---------------- |
| HARVEST  | Food +12, Water +8, Energy +5, Land -8 | Always available |
| CONSERVE | All depletion reduced 50%              | Always available |
| TRADE    | Queued for matching                    | Always available |
| EXPAND   | Population +10%, Resources -10%        | Population > 200 |
| DEFEND   | Resources floor = current level        | Always available |
| INNOVATE | Energy -10, future efficiency +5%      | Energy > 15      |

### Reward Function

```
R = w1 × ΔPopulation + w2 × ΔHappiness + w3 × ResourceStability + w4 × TradeSuccess

Where:
  w1 = 0.3 (population growth weight)
  w2 = 0.3 (happiness weight)
  w3 = 0.25 (resource stability — penalize any resource < 15)
  w4 = 0.15 (trade success bonus)

Collapse penalty: -100
```

### Learning Parameters

```
Learning Rate (α):    0.1  → How fast Q-values update
Discount Factor (γ):  0.9  → How much future rewards matter
Exploration Rate (ε): 0.3 → 0.1 (decays over cycles)
  Cycle 1-30:   ε = 0.3 (explore 30% of the time)
  Cycle 31-70:  ε = 0.15
  Cycle 71+:    ε = 0.10
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
2. For each, identify SURPLUS (highest resource > 50) and NEED (lowest resource < 30)
3. Find complementary pairs (A's surplus = B's need AND B's surplus = A's need)
4. Score matches by trust level
5. Execute top matches first
6. Unmatched states get no trade this cycle
```

### Trust Dynamics

```
Successful trade: trust += 1 (max 10)
No trade this cycle: trust -= 0.1 (natural decay)
Trust reaches 0: relationship removed
Alliance threshold: trust ≥ 7 AND trades ≥ 5
Alliance bonus: +5% better exchange rates
```

---

## 5. Event System

### Probability Model

```
Each cycle:
  P(state event)  = 0.30 (30%)
  P(global event) = 0.10 (10%)
  P(no event)     = 0.60 (60%)

Cooldown: Same event cannot repeat within 10 cycles
Events per state: 8 unique events
Global events: 8 unique events
Total pool: 72 events
```

---

## 6. Simulation Cycle (6 Steps)

```
Step 1: CONSUME
  resource -= population × consumption_rate
  Small natural regeneration applied

Step 2: EVENT
  Random event triggered based on probability
  Effects applied to target state(s)

Step 3: AGENTS DECIDE
  Each Q-Learning agent observes state → selects action
  Action effects applied

Step 4: TRADE RESOLUTION
  Match traders → execute exchanges → update trust

Step 5: WORLD UPDATE
  Happiness = f(resources above survival threshold)
  Population = f(happiness, food, water)
  GDP = f(trade_activity, surplus, population)

Step 6: COLLAPSE CHECK
  If any resource = 0 AND population < 100 → COLLAPSE
  Collapsed state marked dead, recorded with reason and cycle
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

## 10. Real-World Parallels Mapping

| Strategy Pattern          | Real Country | Discovered By Agent      |
| ------------------------- | ------------ | ------------------------ |
| Trade surplus for needs   | Singapore    | Punjab, Kerala           |
| Innovate under scarcity   | Israel       | Rajasthan                |
| Conserve for future       | Norway       | Multiple states          |
| Build trade alliances     | Japan        | Punjab-Jharkhand         |
| Over-harvest → collapse   | Venezuela    | Tamil Nadu (if isolated) |
| Isolationism → stagnation | North Korea  | States that refuse trade |

---

## 11. Scalability & Future Scope

- **Swap JSON → Scale globally**: Replace `indiaStates.json` with `worldCountries.json`
- **Live API integration**: Connect to data.gov.in API for real-time updates
- **Deep RL upgrade**: Replace Q-table with neural network for richer learning
- **Multiplayer**: Let users control individual states and compete
- **Policy simulation**: Model real government schemes (MGNREGA, PM-KISAN) as actions
