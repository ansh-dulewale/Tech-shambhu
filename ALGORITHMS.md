# WorldSim India — Algorithms & Technical Deep Dive

## Table of Contents

1. [Q-Learning (Reinforcement Learning Agent)](#1-q-learning-reinforcement-learning-agent)
2. [State Encoding & Discretization](#2-state-encoding--discretization)
3. [Epsilon-Greedy Exploration Strategy](#3-epsilon-greedy-exploration-strategy)
4. [Multi-Component Reward Function](#4-multi-component-reward-function)
5. [Resource Consumption & Cross-Dependency Model](#5-resource-consumption--cross-dependency-model)
6. [Trade Matching Algorithm](#6-trade-matching-algorithm)
7. [Multi-Agent Negotiation Protocol](#7-multi-agent-negotiation-protocol)
8. [Trust Dynamics & Alliance Formation](#8-trust-dynamics--alliance-formation)
9. [Climate Change Progression Model](#9-climate-change-progression-model)
10. [GDP Production Function (Cobb-Douglas)](#10-gdp-production-function-cobb-douglas)
11. [Population & Happiness Dynamics](#11-population--happiness-dynamics)
12. [Collapse Detection Algorithm](#12-collapse-detection-algorithm)
13. [Simulation Cycle Pipeline](#13-simulation-cycle-pipeline)
14. [Algorithm Complexity Analysis](#14-algorithm-complexity-analysis)

---

## 1. Q-Learning (Reinforcement Learning Agent)

### Overview

Each of the 8 Indian states is governed by an independent **Q-Learning agent** — a model-free, off-policy reinforcement learning algorithm. The agent learns an optimal action-selection policy by iteratively updating a Q-value table that maps (state, action) pairs to expected cumulative rewards.

### Why Q-Learning?

- **Runs natively in browser JavaScript** — no Python backend or GPU required
- **Fully explainable** — Q-values are inspectable, decisions are traceable
- **Convergence guarantee** — with sufficient exploration, Q-Learning converges to optimal policy (Watkins & Dayan, 1992)
- **Tractable state space** — 5,000 discrete states fit in a lookup table

### The Bellman Update (Core Equation)

$$Q(s, a) \leftarrow Q(s, a) + \alpha \left[ r + \gamma \cdot \max_{a'} Q(s', a') - Q(s, a) \right]$$

Where:
- $Q(s, a)$ = expected cumulative reward for taking action $a$ in state $s$
- $\alpha = 0.1$ = learning rate (how fast new experience overwrites old estimates)
- $\gamma = 0.9$ = discount factor (how much future rewards matter vs. immediate)
- $r$ = immediate reward received after taking action $a$
- $s'$ = next state observed after the action
- $\max_{a'} Q(s', a')$ = best possible future value from the next state

### Hyperparameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Learning Rate ($\alpha$) | 0.1 | Moderate update speed — balances stability and adaptability |
| Discount Factor ($\gamma$) | 0.9 | Strong weight on future rewards — encourages long-term planning |
| Initial Exploration ($\epsilon_0$) | 0.3 | 30% random actions at start — ensures broad state space coverage |
| Minimum Exploration ($\epsilon_{min}$) | 0.05 | 5% floor — always some randomness to avoid local optima |
| Q-Table Persistence | Every 10 steps | Saved to `localStorage` — survives page reloads |

### Action Space

The agent chooses from 6 discrete actions each cycle:

| Action | Effect | Strategic Purpose |
|--------|--------|-------------------|
| **HARVEST** | Water +8, Food +12, Energy +5, Land -8 | Short-term resource extraction |
| **CONSERVE** | All depletion halved (50% reduction) | Defensive stability |
| **TRADE** | Queued for trade matching system | Resource rebalancing via exchange |
| **EXPAND** | Population +10%, all resources -10% | Growth at resource cost |
| **DEFEND** | Resource floor = current level (can't drop) | Protection against shocks |
| **INNOVATE** | Energy -10, future efficiency +5% (cumulative) | Long-term compound returns |

---

## 2. State Encoding & Discretization

### Problem

Continuous resource values (0–100 for each of 4 resources) create an infinite state space. Q-Learning requires a finite tabular state representation.

### Solution: 5-Level Quantization

Each resource is discretized into 5 severity levels:

| Level | Range | Symbol | Interpretation |
|-------|-------|--------|----------------|
| Critical | 0–15 | `C` | Imminent collapse risk |
| Low | 16–30 | `L` | Scarcity — intervention needed |
| Mid | 31–50 | `M` | Sustainable but fragile |
| High | 51–75 | `H` | Comfortable surplus |
| Surplus | 76–100 | `S` | Abundance — tradeable excess |

### State Code Format

```
{water}_{food}_{energy}_{land}_{partners}_{event}

Example: "L_C_H_M_P_E"
→ Water=Low, Food=Critical, Energy=High, Land=Mid, Has Partners, Recent Event
```

### State Space Size

$$|S| = 5^4 \times 2 \times 2 = 625 \times 4 = 2{,}500 \text{ (theoretical max: 5,000)}$$

- 4 resources × 5 levels = $5^4 = 625$ resource combinations
- 2 partnership states: has trade partners (P) or none (N)
- 2 event states: recent event occurred (E) or not (X)

In practice, agents visit ~100–300 unique states within 200 cycles, keeping the Q-table compact and learning efficient.

---

## 3. Epsilon-Greedy Exploration Strategy

### The Exploration–Exploitation Dilemma

The agent must balance:
- **Exploitation**: Pick the action with the highest Q-value (greedy) to maximize known rewards
- **Exploration**: Pick a random action to discover potentially better strategies

### Exponential Decay Schedule

$$\epsilon(t) = \max\left(0.05,\ 0.3 \cdot e^{-0.02t}\right)$$

| Cycle | $\epsilon$ | Exploration % | Behavior |
|-------|------------|---------------|----------|
| 1 | 0.300 | 30% | Heavy exploration — learning the environment |
| 20 | 0.201 | 20% | Balanced — building Q-table |
| 50 | 0.110 | 11% | Mostly exploiting learned policy |
| 100 | 0.041 → 0.05 | 5% | Minimum floor — occasional random probe |
| 200+ | 0.050 | 5% | Steady-state — refined strategy with safety margin |

### Tie-Breaking

When multiple actions have equal Q-values (common early on), the agent **shuffles the action list randomly** before selecting the maximum — this prevents systematic bias toward alphabetically-first actions.

---

## 4. Multi-Component Reward Function

### Design Philosophy

The reward function uses **smooth, continuous gradients** instead of hard step functions. This gives Q-Learning a clean gradient to follow, avoiding "cliff" discontinuities that cause oscillating behavior.

### Reward Components

#### 1. Resource Gradient (Linear)

$$R_{\text{resource}} = \frac{\bar{r} - 40}{10}$$

- $\bar{r}$ = average of all 4 resources
- Centered at 40 (neutral point) — positive above, negative below
- Range: approximately $-4$ to $+6$

#### 2. Critical Resource Penalty (Hyperbolic Tangent)

$$R_{\text{critical}} = \sum_{v < 15} -3 \cdot \left(1 - \tanh\left(\frac{v - 5}{5}\right)\right)$$

- Applied per resource below the critical threshold (15)
- Uses $\tanh$ for a smooth, steep penalty near 0 that gentles near 15
- Prevents agents from ignoring dangerously low resources

#### 3. Population Reward (S-Curve)

$$R_{\text{pop}} = 3 \cdot \tanh\left(\frac{P - 350}{200}\right)$$

- Sigmoid-like curve centered at population = 350
- Rewards growth but with diminishing returns (no incentive to hoard population)

#### 4. Happiness Reward (Linear)

$$R_{\text{happy}} = \frac{H - 50}{25}$$

- Centered at happiness = 50%
- Range: $-2$ to $+2$

#### 5. Trade Reward (Square Root — Diminishing Returns)

$$R_{\text{trade}} = 2 \cdot \sqrt{n_{\text{trades}}}$$

- First trade: +2.0 reward
- Second trade: +2.83 reward (total) — diminishing marginal gain
- Encourages trade without over-incentivizing it

#### 6. Innovation Reward (Linear)

$$R_{\text{innov}} = 2 \cdot I$$

- $I$ = cumulative innovation bonus (0 to 0.5)
- Rewards sustained investment in technology

#### 7. Resource Balance Penalty

$$R_{\text{balance}} = -1.5 \cdot \left(1 - \frac{\min(r_i)}{\max(r_i)}\right)$$

- Penalizes extreme imbalance (e.g., 90 water but 5 food)
- Forces agents to maintain balanced resource profiles

#### 8. Collapse Penalty (Terminal)

$$R_{\text{collapse}} = -100$$

- Immediate, overwhelming negative signal for state death
- Overrides all other components

### Total Reward

$$R = R_{\text{resource}} + R_{\text{critical}} + R_{\text{pop}} + R_{\text{happy}} + R_{\text{trade}} + R_{\text{innov}} + R_{\text{balance}} + R_{\text{collapse}}$$

---

## 5. Resource Consumption & Cross-Dependency Model

### Base Consumption

Each cycle, resources deplete based on population pressure:

$$\Delta r_i = -\left(b_i + \frac{P}{1000} \cdot c_i\right) \cdot (1 - I) \cdot C_d$$

Where:
- $b_i$ = base drain (water: 5, food: 4, energy: 3, land: 0.5)
- $c_i$ = population scaling factor (water: 3, food: 2.5, energy: 2, land: 0.3)
- $P$ = population
- $I$ = innovation bonus (0–0.5) — reduces consumption
- $C_d = 1 + 0.4 \cdot \sigma$ = climate drain multiplier ($\sigma$ = climate stress)

### Cross-Resource Dependencies

Resources are **interconnected** — scarcity in one cascades to others:

| Condition | Penalty | Real-World Analogy |
|-----------|---------|-------------------|
| Water < 30 | Food drain +3 (max) | Irrigation failure → crop loss |
| Energy < 25 | Land drain +1.5 (max) | No mechanized farming → soil degradation |
| Food < 20 | Energy drain +2 (max) | Population forages, diverting from energy production |
| Land < 25 | Water drain +2 (max) | Deforestation → rainfall runoff, aquifer collapse |

Each penalty scales **linearly** with severity:

$$P_{\text{water→food}} = \frac{\max(0, 30 - r_{\text{water}})}{30} \times 3$$

### Natural Regeneration

$$\Delta r_i^{\text{regen}} = \text{base}_i \times \left(0.5 + \frac{r_{\text{land}}}{100}\right) \times W_b \times (1 - 0.3\sigma)$$

- **Land factor**: More land = faster regeneration (ecosystem services)
- **Water boost** ($W_b$): Water > 50 → $\times 1.2$; Water 30–50 → $\times 1.0$; Water < 30 → $\times 0.7$
- **Climate penalty**: Regeneration drops up to 30% at maximum climate stress

---

## 6. Trade Matching Algorithm

### Classical Surplus-Need Matching

```
Algorithm: GreedyComplementaryMatch
Input: Set of states that chose TRADE action
Output: List of executed bilateral trades

1. For each trading state, compute:
   - SURPLUS = resource with highest value (must be > 40)
   - NEED = resource with lowest value (must be < 50)

2. Sort by complementary potential (greedy):
   For each pair (A, B):
     - Check: not blocked, not already matched
     - Complementary if A.surplus == B.need OR B.surplus == A.need

3. Determine trade amount based on trust:
   - Trust 0–3:  base = 10 units
   - Trust 4–6:  base = 15 units
   - Trust 7–10: base = 20 units
   - Alliance bonus: ×1.05 if trust ≥ 7 AND trade count ≥ 5

4. Execute bilateral transfer:
   A.resources[gave] -= amount
   B.resources[gave] += amount
   B.resources[got]  -= amount
   A.resources[got]  += amount

5. Update trust: +1 for both parties
6. Record in trade history (capped at 200 entries)
```

### Complexity

- Matching: $O(n^2)$ pairwise comparison where $n$ = number of trading states (max 8)
- Per cycle: constant time in practice

---

## 7. Multi-Agent Negotiation Protocol

### Overview

Beyond simple matching, states can **propose, evaluate, counter-offer, accept, or reject** trades — even states that didn't choose the TRADE action. This creates emergent diplomacy.

### Phase 1: Proposal Generation

Every alive state generates a trade proposal:

```
For each state S:
  surplus = resource with value > 55
  need    = resource with value < 35
  urgency = max(0.3, 1 - needValue / 35)     // 0.3 to 1.0
  offerAmount = round(8 + urgency × 10)       // 8 to 18 units
  askAmount   = round(6 + urgency × 8)        // 6 to 14 units
```

### Phase 2: Match Scoring

Each proposal is evaluated against all other proposals:

$$\text{Score} = S_{\text{complementary}} + S_{\text{trust}} + S_{\text{trade}}$$

| Component | Formula | Max Value |
|-----------|---------|-----------|
| Complementary | +3 if partner offers what I need; +3 if partner needs what I offer | 6 |
| Trust | $\text{trust} \times 0.5$ | 5 |
| Trade Bonus | +2 if partner chose TRADE action | 2 |

### Phase 3: Accept / Counter / Reject Decision

| Both chose TRADE | Threshold | Outcome |
|------------------|-----------|---------|
| Yes | Score ≥ 2 | Accept |
| One chose TRADE | Score ≥ 3.5 | Accept |
| Neither chose TRADE | Score ≥ 5 | Accept |
| Any | Score ≥ 50% of threshold | Counter-offer (+0.3 trust) |
| Any | Score < 50% of threshold | Reject |

### Phase 4: Amount Negotiation

Accepted trades have amounts adjusted by trust:

$$\text{trustFactor} = \min\left(1, \frac{\text{trust}}{8}\right)$$
$$\text{finalAmount} = \text{round}\left(\text{offerAmount} \times (0.7 + \text{trustFactor} \times 0.3)\right)$$

- Low trust (0): only 70% of proposed amount exchanged
- High trust (8+): full 100% exchanged

---

## 8. Trust Dynamics & Alliance Formation

### Trust as a Numerical Relationship

Trust between any pair of states is a continuous value $T \in [0, 10]$:

| Event | Trust Change |
|-------|-------------|
| Successful direct trade | $T += 1.0$ |
| Successful negotiated trade | $T += 1.5$ |
| Counter-offer (partial agreement) | $T += 0.3$ |
| No trade this cycle (passive decay) | $T -= 0.1$ |
| Betrayal (partner refused trade) | $T -= 0.5$ |
| Trust reaches 0 | Relationship deleted |

### Alliance Formation

An **alliance** forms when two conditions are met simultaneously:

$$\text{Alliance} \iff T_{AB} \geq 7 \quad \text{AND} \quad \text{tradeCount}_{AB} \geq 5$$

Alliance benefits:
- **+5% exchange rate bonus** on all trades between allied states
- Visual indicator on the trade network display

### Betrayal Penalty

When state A chose TRADE but partner B chose a different action (e.g., DEFEND), B is considered to have "betrayed" the partnership:

$$T_{AB} -= 0.5$$

This mechanism prevents free-riding and creates a **Prisoner's Dilemma** dynamic — states must choose between self-interest and cooperative benefit.

### Trade Blocking

States can be **blocked** from trading for $n$ cycles (used by God Mode):
- Block counter decrements by 1 each cycle
- Blocked pairs cannot be matched or negotiate

---

## 9. Climate Change Progression Model

### Stress Curve (Logarithmic Growth)

$$\sigma(t) = \min\left(1,\ 0.02 \cdot \ln(1 + 0.15 \cdot t)\right)$$

- **Slow start**: Climate barely impacts early cycles
- **Accelerating mid-game**: Noticeable degradation around cycle 30–60
- **Asymptotic cap**: Stress maxes at 1.0 (never exceeds)

| Cycle | Climate Stress $\sigma$ | Event Rate | Consumption Multiplier |
|-------|------------------------|------------|----------------------|
| 10 | 0.019 | 0.307 | 1.008 |
| 50 | 0.041 | 0.314 | 1.016 |
| 100 | 0.054 | 0.319 | 1.022 |
| 200 | 0.068 | 0.324 | 1.027 |
| 500 | 0.086 | 0.330 | 1.034 |

### Impact Channels

1. **Event rate amplification**: $P(\text{event}) = 0.30 + 0.35 \cdot \sigma$ (up to 65%)
2. **Consumption multiplier**: All base consumption × $(1 + 0.4\sigma)$ (up to +40%)
3. **Regeneration reduction**: Natural regen × $(1 - 0.3\sigma)$ (up to -30%)
4. **Secondary climate events**: At $\sigma > 0.5$, an additional climate event can trigger with probability $(σ - 0.5) \times 0.4$

### Climate Event Types

| Type | Affected Resources | Severity Scaling |
|------|-------------------|-----------------|
| Drought | Water $-[10, 30]$, Food $-[5, 15]$, Happiness $-[5, 15]$ | Linear with $\sigma$ |
| Flood | Land $-[8, 23]$, Energy $-[5, 15]$, Population $-[10, 40]$ | Linear with $\sigma$ |
| Heatwave | Food $-[8, 23]$, Energy $-[8, 20]$, Happiness $-[8, 18]$ | Linear with $\sigma$ |
| Deforestation | Land $-[10, 25]$, Water $-[5, 13]$ | Linear with $\sigma$ |

---

## 10. GDP Production Function (Cobb-Douglas)

### Formula

$$\text{GDP}_{\text{cycle}} = B \cdot L^{0.5} \cdot R^{0.6} \cdot T \cdot I$$

Where:

| Factor | Formula | Economic Interpretation |
|--------|---------|------------------------|
| $B$ | 50 | Base production constant |
| $L$ (Labor) | $\sqrt{P / 500}$ | Diminishing returns on population |
| $R$ (Resources) | $(\bar{r} / 50)^{0.6}$ | Cobb-Douglas resource factor |
| $T$ (Trade) | $1 + 0.15\sqrt{n}$ | Trade openness multiplier |
| $I$ (Innovation) | $1 + I_{\text{bonus}}$ | Technology multiplier (0–1.5×) |

### GDP Smoothing (Exponential Moving Average)

$$\text{GDP}_{t+1} = 0.8 \cdot \text{GDP}_t + 0.2 \cdot \text{GDP}_{\text{cycle}}$$

- 80% carry-over prevents wild oscillations
- 20% new production reflects current conditions
- This makes GDP a **lagging indicator** — it responds gradually to shocks, mimicking real economic inertia

---

## 11. Population & Happiness Dynamics

### Happiness Function (Weighted Average)

$$H_{t+1} = 0.7 \cdot H_t + 0.3 \cdot \min(100, 1.2 \cdot \bar{r})$$

- 70% inertia from previous happiness (social memory)
- 30% sensitivity to current resource average
- Clamped to [0, 100]

### Population Growth/Decline

| Condition | Change | Interpretation |
|-----------|--------|----------------|
| $H > 60$ AND Food $> 30$ AND Water $> 20$ | $P += 2\%$ | Prosperity → growth |
| $H < 30$ OR Food $< 15$ OR Water $< 10$ | $P -= 3\%$ | Crisis → emigration/death |
| Otherwise | No change | Stable population |

Population floor: $P \geq 10$ (prevents division by zero)

---

## 12. Collapse Detection Algorithm

A state is declared **collapsed** (permanently dead) when:

$$(\text{zeroResources} \geq 2 \text{ AND } P < 150) \quad \text{OR} \quad (\text{zeroResources} \geq 1 \text{ AND } P < 80)$$

Where $\text{zeroResources}$ = count of resources $\leq 0$.

### Collapse Record

When a state collapses, the system records:
- **Cause**: The lowest resource that triggered collapse
- **Cycle**: When it happened
- **Final snapshot**: All resource levels, population at time of death

Collapsed states are removed from all future simulation steps — no trading, no events, no learning.

---

## 13. Simulation Cycle Pipeline

Each tick executes 7 sequential phases:

```
┌─────────────────────────────────────────────────┐
│ STEP 1: CONSUME                                 │
│   Resources deplete based on population          │
│   Cross-dependencies cascade (water→food, etc.) │
│   Natural regeneration (land-scaled)             │
│   Climate stress amplifies drain                 │
├─────────────────────────────────────────────────┤
│ STEP 2: EVENT                                   │
│   Roll for random event (30–65% based on σ)     │
│   Roll for secondary climate event (if σ > 0.5) │
│   Apply effects to target state(s)              │
├─────────────────────────────────────────────────┤
│ STEP 3: AGENT DECISIONS                         │
│   Each agent encodes current state → state code │
│   ε-greedy action selection from Q-table        │
│   Action effects applied to resources            │
├─────────────────────────────────────────────────┤
│ STEP 4: TRADE RESOLUTION                        │
│   Phase A: Generate proposals (all alive states)│
│   Phase B: Negotiate (accept/counter/reject)    │
│   Phase C: Execute negotiated trades            │
│   Phase D: Classic matching (remaining traders) │
│   Phase E: Trust decay + betrayal penalties     │
├─────────────────────────────────────────────────┤
│ STEP 5: WORLD UPDATE                            │
│   Apply DEFEND floors & CONSERVE restorations   │
│   Compute happiness (weighted EMA)              │
│   Update population (growth/decline)            │
│   Calculate GDP (Cobb-Douglas production)       │
├─────────────────────────────────────────────────┤
│ STEP 6: COLLAPSE CHECK                          │
│   Check zero-resource + low-population thresholds│
│   Mark collapsed states as dead                  │
│   Record collapse data for analysis             │
├─────────────────────────────────────────────────┤
│ STEP 7: AGENT LEARNING                          │
│   Calculate multi-component reward              │
│   Q-table Bellman update for each alive agent   │
│   Persist Q-tables to localStorage              │
└─────────────────────────────────────────────────┘
```

---

## 14. Algorithm Complexity Analysis

| Algorithm | Time Complexity | Space Complexity |
|-----------|----------------|-----------------|
| Q-Learning Update | $O(|A|)$ per agent per cycle | $O(|S| \times |A|)$ Q-table per agent |
| State Encoding | $O(1)$ per agent | $O(1)$ |
| Epsilon-Greedy Selection | $O(|A|)$ per agent | $O(1)$ |
| Trade Matching | $O(n^2)$ pairwise | $O(n)$ trades |
| Negotiation Protocol | $O(n^2)$ proposals | $O(n)$ accepted |
| Trust Decay | $O(n^2)$ pairs | $O(n^2)$ trust matrix |
| Climate Event | $O(n)$ alive states | $O(1)$ per event |
| Collapse Check | $O(n)$ alive states | $O(1)$ per check |
| Full Cycle | $O(n^2)$ dominated by trade | $O(n \cdot |S| \cdot |A|)$ |

Where:
- $n = 8$ (states/agents)
- $|A| = 6$ (actions)
- $|S| \approx 200\text{–}300$ (visited states per agent)

### Total Runtime Per Cycle

All operations complete in **< 1ms** on modern browsers — well within the 500ms simulation tick interval, enabling real-time visualization.

---

## Summary of Mathematical Models

| Model | Type | Key Formula |
|-------|------|-------------|
| Q-Learning | Reinforcement Learning | $Q \leftarrow Q + \alpha[r + \gamma \max Q' - Q]$ |
| Exploration | Exponential Decay | $\epsilon = \max(0.05, 0.3 \cdot e^{-0.02t})$ |
| Reward | Multi-Component Continuous | 8 smooth gradient components summed |
| Trade Matching | Greedy Complementary | Surplus-need pairing with trust-scaled amounts |
| Negotiation | Multi-Phase Protocol | Score-based accept/counter/reject with trust adjustment |
| Climate | Logarithmic Progression | $\sigma = 0.02 \ln(1 + 0.15t)$ |
| GDP | Cobb-Douglas Production | $B \cdot L^{0.5} \cdot R^{0.6} \cdot T \cdot I$ |
| Happiness | Exponential Moving Average | $H_{t+1} = 0.7 H_t + 0.3 \cdot f(\bar{r})$ |
| Trust | Incremental + Decay | Event-driven updates with passive decay |
| Collapse | Threshold Detection | Resource depletion + population floor checks |
