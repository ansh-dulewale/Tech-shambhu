# WorldSim — Adaptive Resource Scarcity & Agent Strategy Simulator

## 🌍 Overview

WorldSim is a browser-based simulation platform where AI agents govern 8 real Indian states, managing finite resources — water, food, energy, and land. Using reinforcement learning (Q-Learning), autonomous agents learn survival strategies through trial and error, forming trade alliances, adapting to real-world news events, and competing for scarce resources.

The platform offers both a **Dashboard Mode** (real-time resource intelligence view) and a **Simulation Mode** (AI-driven world evolution), making it both an analytical tool and an interactive playground.

---

## 🎯 Problem Statement

Design a simulation engine with:

- Regions with distinct, finite resources (water, food, energy, land)
- Autonomous AI agents that learn strategies via reinforcement learning
- Evolving world with resource depletion, climatic events, and trade dynamics
- Analysis of emergent strategies — what works, what fails, and why
- Rich visualization of the evolving world state

---

## 🇮🇳 Our Approach: Real India, Real Data

Instead of fictional regions, we simulate **8 real Indian states** with **real resource profiles** sourced from government data (data.gov.in, India WRIS, CEA reports). Events are driven by **72 real news headlines** from authentic sources like The Hindu, NDTV, Economic Times, and Times of India.

### The 8 States

| State         | 💧 Water | 🌾 Food | ⚡ Energy | 🏔️ Land | Archetype             |
| ------------- | -------- | ------- | --------- | ------- | --------------------- |
| Punjab        | 55       | 95      | 30        | 60      | Food Exporter         |
| Rajasthan     | 15       | 35      | 80        | 90      | Energy from Desert    |
| Gujarat       | 40       | 55      | 75        | 65      | Industrial Powerhouse |
| Kerala        | 85       | 60      | 25        | 20      | Water Rich, Land Poor |
| Jharkhand     | 45       | 30      | 85        | 50      | Mining Capital        |
| Maharashtra   | 50       | 55      | 60        | 70      | Balanced but Uneven   |
| Tamil Nadu    | 35       | 65      | 55        | 45      | Water Dependent       |
| Uttar Pradesh | 65       | 85      | 35        | 80      | Population Giant      |

---

## 🧠 AI Agent — Q-Learning

Each state is governed by an independent AI agent using **Q-Learning**:

1. **Observe**: Agent reads its current resource levels, population, happiness
2. **Decide**: Picks from 6 actions — HARVEST, CONSERVE, TRADE, EXPAND, DEFEND, INNOVATE
3. **Act**: Action effects apply to the state's resources
4. **Learn**: Gets a reward (positive for growth, negative for decline), updates Q-table
5. **Adapt**: Over 100+ cycles, agents discover optimal strategies unique to their state

### Emergent Strategies Observed

- **Punjab** → Learns to TRADE food for energy/water (like Singapore)
- **Rajasthan** → Learns to INNOVATE under water scarcity (like Israel)
- **Kerala** → Becomes a water exporter (like Canada)
- **Tamil Nadu** → Struggles without trade partners (vulnerability exposed)

---

## 🌪️ Event System — Real News-Driven

72 real news headlines drive the simulation:

- 8 events per state (state-specific impacts)
- 8 global events (affect all states)
- Events are sourced from The Hindu, NDTV, Economic Times, IMD, etc.

**Example**: "Punjab groundwater drops to critical" → The Hindu, 2024 → Water -25 for Punjab

---

## 🤝 Trade & Alliance System

- Agents propose trades based on surplus/deficit analysis
- Trust builds through successful trades (1-10 scale)
- Trust decays naturally (-0.1/cycle) for inactive partnerships
- Betrayal penalty (-0.5 trust) when a partner refuses to trade
- Alliances form organically when trust > 7 and trades > 5
- Allied pairs get +5% exchange rate bonus
- Trust can reach 0 and relationships are removed entirely

---

## 🎮 Interactive Features

### God Mode 🌩️

- Trigger events manually (drought, flood, etc.)
- Block trade between specific states (simulate sanctions)
- Give resource aid to struggling states
- Force an agent to take a specific action

### What-If Scenarios 🔮

- "What if Rajasthan had no water?"
- "What if interstate trade was banned?"
- "What if climate disasters doubled?"
- "What if everyone cooperated?"
- "What if Kerala lost its coastline?"

### Comparison Mode ⚔️

- AI agents vs Random agents (100 headless cycles each)
- Same initial conditions, different decision-making
- Side-by-side metric cards proving AI learning produces measurably better outcomes

---

## 📊 Analysis & Insights

- **Sustainability Rankings**: Composite score from survival length, happiness, GDP, trade activity
- **Collapse Prediction**: Trend-based forecasting of which states may collapse (cycles remaining)
- **Collapse Root-Cause Analysis**: Decline chain showing which resources fell fastest before failure
- **Strategy Convergence**: Whether agents settled on a dominant strategy or shifted over time
- **Resource Vulnerabilities**: Identifies imbalanced states (high surplus + critical weakness)
- **Trade Network Topology**: Hub identification, top corridors, isolated states
- **Auto-Generated Story**: Data-driven narrative of the simulation in 4 chapters

---

## 🛠️ Tech Stack

| Component          | Technology                               |
| ------------------ | ---------------------------------------- |
| Frontend Framework | React 19 + Vite                          |
| Styling            | Tailwind CSS v4                          |
| Charts             | Chart.js + react-chartjs-2               |
| World Map          | HTML5 Canvas                             |
| AI Engine          | Q-Learning (JavaScript)                  |
| Data               | Static JSON with real government sources |
| Design             | Dark glassmorphism theme                 |

---

## 👥 Team

| Member   | Role          | Responsibilities                                       |
| -------- | ------------- | ------------------------------------------------------ |
| Member 1 | Engine Person | AI Agent (Q-Learning), Simulation Engine, Trade System |
| Member 2 | Visual Person | UI/UX, India Map, Charts, Animations                   |
| Member 3 | Connector     | Data, Events, Scenarios, Analysis, Integration         |

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📜 License

MIT License — Built for hackathon by Team Tech-Shambhu
