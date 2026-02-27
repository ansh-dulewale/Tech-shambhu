/**
 * World.js — Simulation Engine
 * Manages 8 Indian states, runs cycles, triggers events, and coordinates agents.
 * 
 * Each cycle: Consume → Event → Agents Decide → Trade → Update → Collapse Check → Learn
 */

import Agent, { ACTIONS } from './Agent.js';
import TradeSystem from './TradeSystem.js';

// Action effects: what each action does to resources
const ACTION_EFFECTS = {
  HARVEST: { water: 8, food: 12, energy: 5, land: -8 },
  CONSERVE: { multiplier: 0.5 }, // halves depletion
  TRADE: {}, // handled by TradeSystem
  EXPAND: { populationBonus: 0.10, resourceDrain: 0.10 },
  DEFEND: { floor: true }, // resources can't drop below current level
  INNOVATE: { energy: -10, efficiencyBonus: 0.05 },
};

class World {
  constructor(statesData) {
    this.originalData = statesData;
    this.cycle = 0;
    this.states = {};
    this.agents = {};
    this.tradeSystem = new TradeSystem();
    this.history = [];
    this.eventLog = [];
    this.collapsedStates = [];
    this.usedEvents = {};  // cooldown tracking
    this.eventRate = 0.30; // configurable for What-If
    this.tradeDisabled = false; // configurable for What-If
    this.innovationBonus = {}; // accumulated per state

    // ═══ Climate Change Progression ═══
    this.climateStress = 0;          // 0→1 over time, drives worsening conditions
    this.baseEventRate = 0.30;       // original rate before climate scaling
    this.climateEvents = [];         // log of climate-driven events

    // ═══ Negotiation state ═══
    this.lastNegotiations = [];      // proposals from last cycle

    this._initFromData(statesData);
  }

  _initFromData(data) {
    const statesArray = data.states || [];
    statesArray.forEach(s => {
      this.states[s.id] = {
        id: s.id,
        name: s.name,
        title: s.title || '',
        resources: { ...s.resources },
        population: s.population,
        happiness: s.happiness || 70,
        gdp: s.gdp || 1000,
        alive: true,
        action: null,
        color: s.color || '#888',
        position: s.position || { x: 0, y: 0 },
        sources: s.sources || {},
        news: s.news || [],
        strategy: {},
        collapseReason: null,
        collapseCycle: null,
      };
      this.agents[s.id] = new Agent(s.id);
      this.innovationBonus[s.id] = 0;
    });
    this.globalEvents = data.globalEvents || [];
  }

  /**
   * Run ONE complete simulation cycle.
   * Returns all data needed for visualization.
   */
  tick() {
    this.cycle++;
    const aliveIds = Object.keys(this.states).filter(id => this.states[id].alive);

    if (aliveIds.length === 0) {
      return this._buildResult(null, [], []);
    }

    // Save old state codes for learning
    const oldStateCodes = {};
    aliveIds.forEach(id => {
      const s = this.states[id];
      const hasPartners = this.tradeSystem.tradeHistory.some(
        t => t.from === id || t.to === id
      );
      oldStateCodes[id] = this.agents[id].encodeState(s.resources, hasPartners, false);
    });

    // ═══ CLIMATE CHANGE PROGRESSION ═══
    // Climate stress grows logarithmically — slow start, accelerating mid-game
    this.climateStress = Math.min(1, 0.02 * Math.log(1 + this.cycle * 0.15));
    // Event rate increases with climate stress: 0.30 → up to 0.65
    this.eventRate = this.baseEventRate + this.climateStress * 0.35;

    // STEP 1: CONSUME — resources deplete based on population
    const conservingStates = new Set();
    const defendingStates = new Set();
    const defendFloors = {};

    aliveIds.forEach(id => {
      const s = this.states[id];
      const popFactor = s.population / 1000;
      const innovBonus = 1 - this.innovationBonus[id];

      // ═══ RESOURCE CROSS-DEPENDENCIES ═══
      // Water scarcity hurts food production (irrigation)
      const waterToFoodPenalty = s.resources.water < 30
        ? (30 - s.resources.water) / 30 * 3  // up to +3 extra food drain
        : 0;
      // Energy scarcity reduces land efficiency (mechanization)
      const energyToLandPenalty = s.resources.energy < 25
        ? (25 - s.resources.energy) / 25 * 1.5  // up to +1.5 extra land drain
        : 0;
      // Low food = population can't sustain, more energy used foraging
      const foodToEnergyPenalty = s.resources.food < 20
        ? (20 - s.resources.food) / 20 * 2  // up to +2 extra energy drain
        : 0;
      // Land degradation accelerates water loss (deforestation → runoff)
      const landToWaterPenalty = s.resources.land < 25
        ? (25 - s.resources.land) / 25 * 2  // up to +2 extra water drain
        : 0;

      // Climate stress increases base consumption
      const climateDrain = 1 + this.climateStress * 0.4; // up to 40% worse

      s.resources.water -= ((5 + popFactor * 3) * innovBonus + landToWaterPenalty) * climateDrain;
      s.resources.food -= ((4 + popFactor * 2.5) * innovBonus + waterToFoodPenalty) * climateDrain;
      s.resources.energy -= ((3 + popFactor * 2) * innovBonus + foodToEnergyPenalty) * climateDrain;
      s.resources.land -= ((0.5 + popFactor * 0.3) * innovBonus + energyToLandPenalty) * climateDrain;

      // Natural regeneration — scales with land AND cross-dependencies
      const landFactor = 0.5 + (s.resources.land / 100) * 1.0;
      // Water helps land regeneration (healthy ecosystems)
      const waterBoost = s.resources.water > 50 ? 1.2 : s.resources.water > 30 ? 1.0 : 0.7;
      // Climate reduces regeneration over time
      const climateRegen = 1 - this.climateStress * 0.3; // regen drops up to 30%

      s.resources.water += 2 * landFactor * climateRegen;
      s.resources.food += 1.5 * landFactor * waterBoost * climateRegen;
      s.resources.energy += 1 * landFactor * climateRegen;
      s.resources.land += 0.3 * waterBoost * climateRegen;

      // Clamp
      this._clampResources(id);
    });

    // STEP 2: TRIGGER EVENT — random news event (climate-amplified)
    let event = null;
    if (Math.random() < this.eventRate) {
      event = this._triggerRandomEvent();
    }
    // Climate can also trigger a SECOND event at high stress
    if (this.climateStress > 0.5 && Math.random() < (this.climateStress - 0.5) * 0.4) {
      const climateEvent = this._triggerClimateEvent(aliveIds);
      if (climateEvent) {
        this.climateEvents.push(climateEvent);
        // If no primary event, use climate event as the main one
        if (!event) event = climateEvent;
      }
    }

    // STEP 3: AGENTS DECIDE — each AI picks an action
    aliveIds.forEach(id => {
      const s = this.states[id];
      const agent = this.agents[id];
      agent.decayExploration(this.cycle);

      const hasPartners = this.tradeSystem.tradeHistory.some(
        t => t.from === id || t.to === id
      );
      const stateCode = agent.encodeState(s.resources, hasPartners, !!event);
      const action = agent.chooseAction(stateCode);
      s.action = action;

      // Apply action effects
      this._applyAction(id, action, conservingStates, defendingStates, defendFloors);
    });

    // STEP 4: RESOLVE TRADES (with negotiation)
    let trades = [];
    this.lastNegotiations = [];
    if (!this.tradeDisabled) {
      const tradingIds = aliveIds.filter(id => this.states[id].action === 'TRADE');
      // Generate proposals from all alive states (not just those who chose TRADE)
      const proposals = this.tradeSystem.generateProposals(aliveIds, this.states);
      // Negotiate: states evaluate incoming proposals and accept/reject/counter
      const negotiationResult = this.tradeSystem.negotiate(proposals, this.states, tradingIds);
      this.lastNegotiations = negotiationResult.log;
      // Execute accepted trades
      trades = this.tradeSystem.executeNegotiated(negotiationResult.accepted, this.states);
      // Also do classic matching for direct TRADE-action pairs
      const classicTrades = this.tradeSystem.matchAndExecute(
        tradingIds.filter(id => !negotiationResult.matched.has(id)),
        this.states
      );
      trades = [...trades, ...classicTrades];
      this.tradeSystem.tickBlocks();
      const tradedPairKeys = trades.map(t => [t.from, t.to].sort().join('_'));
      this.tradeSystem.decayTrust(tradedPairKeys);
      this.tradeSystem.applyBetrayalPenalty(tradingIds, this.states);
    }

    // STEP 5: UPDATE WORLD — happiness, population, GDP
    const collapsed = [];
    aliveIds.forEach(id => {
      const s = this.states[id];

      // Apply DEFEND floors (resources can't go below what they were)
      if (defendingStates.has(id) && defendFloors[id]) {
        const floors = defendFloors[id];
        s.resources.water = Math.max(s.resources.water, floors.water);
        s.resources.food = Math.max(s.resources.food, floors.food);
        s.resources.energy = Math.max(s.resources.energy, floors.energy);
        s.resources.land = Math.max(s.resources.land, floors.land);
      }

      // Apply CONSERVE (restore half of what was consumed)
      if (conservingStates.has(id)) {
        const popFactor = s.population / 1000;
        s.resources.water += (5 + popFactor * 3) * 0.5;
        s.resources.food += (4 + popFactor * 2.5) * 0.5;
        s.resources.energy += (3 + popFactor * 2) * 0.5;
        s.resources.land += (0.5 + popFactor * 0.3) * 0.5;
      }

      this._clampResources(id);

      // Happiness = function of resources above survival threshold
      const avg = (s.resources.water + s.resources.food + s.resources.energy + s.resources.land) / 4;
      const resourceHappiness = Math.min(100, avg * 1.2);
      s.happiness = Math.round(s.happiness * 0.7 + resourceHappiness * 0.3);
      s.happiness = Math.max(0, Math.min(100, s.happiness));

      // Population changes based on happiness and food/water
      if (s.happiness > 60 && s.resources.food > 30 && s.resources.water > 20) {
        s.population += Math.round(s.population * 0.02);
      } else if (s.happiness < 30 || s.resources.food < 15 || s.resources.water < 10) {
        s.population -= Math.round(s.population * 0.03);
      }
      s.population = Math.max(10, s.population);

      // GDP — realistic production function
      const laborFactor = Math.sqrt(s.population / 500);           // diminishing returns on labor
      const resourceFactor = Math.pow(avg / 50, 0.6);             // Cobb-Douglas style
      const myTradeCount = trades.filter(t => t.from === id || t.to === id).length;
      const tradeFactor = 1 + 0.15 * Math.sqrt(myTradeCount);     // trade openness multiplier
      const innovFactor = 1 + (this.innovationBonus[id] || 0);    // tech multiplier
      const baseProduction = 50;                                   // base GDP per cycle
      const cyclicGdp = baseProduction * laborFactor * resourceFactor * tradeFactor * innovFactor;
      // GDP smoothed: 80% carry-over + 20% new production
      s.gdp = Math.max(0, Math.round(s.gdp * 0.8 + cyclicGdp * 0.2));

      // STEP 6: COLLAPSE CHECK
      const zeroResources = Object.values(s.resources).filter(v => v <= 0).length;
      if ((zeroResources >= 2 && s.population < 150) ||
        (zeroResources >= 1 && s.population < 80)) {
        s.alive = false;
        const lowestRes = Object.entries(s.resources).sort((a, b) => a[1] - b[1])[0];
        s.collapseReason = `${lowestRes[0]} depleted (${Math.round(lowestRes[1])})`;
        s.collapseCycle = this.cycle;
        collapsed.push(id);
        this.collapsedStates.push({
          id, name: s.name, cycle: this.cycle,
          reason: s.collapseReason,
          resources: { ...s.resources },
          population: s.population,
        });
      }

      // Update strategy
      s.strategy = this.agents[id].getStrategyBreakdown();
    });

    // STEP 7: AGENTS LEARN
    aliveIds.forEach(id => {
      if (!this.states[id].alive) return;
      const s = this.states[id];
      const agent = this.agents[id];

      const hasPartners = this.tradeSystem.tradeHistory.some(
        t => t.from === id || t.to === id
      );
      const newStateCode = agent.encodeState(s.resources, hasPartners, false);

      // Calculate reward
      const reward = this._calculateReward(id, trades, collapsed);
      agent.learn(oldStateCodes[id], s.action, reward, newStateCode);
    });

    const alliances = this.tradeSystem.getAlliances();
    const result = this._buildResult(event, trades, alliances, collapsed);
    this.history.push(result);
    return result;
  }

  /**
   * Apply an action's effects to a state.
   */
  _applyAction(id, action, conservingStates, defendingStates, defendFloors) {
    const s = this.states[id];

    switch (action) {
      case 'HARVEST':
        s.resources.water += ACTION_EFFECTS.HARVEST.water;
        s.resources.food += ACTION_EFFECTS.HARVEST.food;
        s.resources.energy += ACTION_EFFECTS.HARVEST.energy;
        s.resources.land += ACTION_EFFECTS.HARVEST.land;
        break;

      case 'CONSERVE':
        conservingStates.add(id);
        break;

      case 'TRADE':
        // Handled in step 4
        break;

      case 'EXPAND':
        s.population += Math.round(s.population * 0.10);
        s.resources.water -= s.resources.water * 0.10;
        s.resources.food -= s.resources.food * 0.10;
        s.resources.energy -= s.resources.energy * 0.10;
        s.resources.land -= s.resources.land * 0.10;
        break;

      case 'DEFEND':
        defendingStates.add(id);
        defendFloors[id] = { ...s.resources };
        break;

      case 'INNOVATE':
        s.resources.energy -= 10;
        this.innovationBonus[id] = Math.min(0.5, (this.innovationBonus[id] || 0) + 0.05);
        break;
    }

    this._clampResources(id);
  }

  /**
   * Calculate reward for Q-Learning agent.
   */
  _calculateReward(id, trades, collapsed) {
    const s = this.states[id];

    // Collapse is an immediate terminal penalty
    if (collapsed.includes(id)) return -100;

    const resources = Object.values(s.resources);
    const avg = resources.reduce((a, b) => a + b, 0) / resources.length;

    // Smooth continuous resource reward: linear gradient centered at 40
    const resourceReward = (avg - 40) / 10;  // range: roughly -4 to +6

    // Smooth critical penalty: each resource below 15 adds a tanh penalty
    const criticalPenalty = resources.reduce((sum, v) => {
      if (v < 15) sum -= 3 * (1 - Math.tanh((v - 5) / 5)); // steep near 0, gentle near 15
      return sum;
    }, 0);

    // Smooth population reward: S-curve centered at 350
    const popReward = 3 * Math.tanh((s.population - 350) / 200);

    // Smooth happiness reward: linear centered at 50
    const happinessReward = (s.happiness - 50) / 25;  // range: -2 to +2

    // Trade success: diminishing returns via sqrt
    const myTrades = trades.filter(t => t.from === id || t.to === id);
    const tradeReward = 2 * Math.sqrt(myTrades.length);

    // Innovation bonus: reward sustained investment
    const innovReward = (this.innovationBonus[id] || 0) * 2;

    // Resource balance bonus: penalize extreme imbalance
    const minRes = Math.min(...resources);
    const maxRes = Math.max(...resources);
    const balancePenalty = maxRes > 0 ? -1.5 * (1 - minRes / maxRes) : 0;

    return resourceReward + criticalPenalty + popReward + happinessReward
      + tradeReward + innovReward + balancePenalty;
  }

  /**
   * Trigger a random event from the news pool.
   */
  _triggerRandomEvent() {
    const aliveIds = Object.keys(this.states).filter(id => this.states[id].alive);
    if (aliveIds.length === 0) return null;

    // 70% state-specific event, 30% global event
    if (Math.random() < 0.7 || this.globalEvents.length === 0) {
      // Pick a random alive state
      const stateId = aliveIds[Math.floor(Math.random() * aliveIds.length)];
      const stateNews = this.states[stateId].news;
      if (!stateNews || stateNews.length === 0) return null;

      // Pick a random event (with cooldown check)
      const available = stateNews.filter(n => {
        const key = `${stateId}_${n.headline}`;
        return !this.usedEvents[key] || (this.cycle - this.usedEvents[key]) > 10;
      });
      if (available.length === 0) return null;

      const newsItem = available[Math.floor(Math.random() * available.length)];
      this.usedEvents[`${stateId}_${newsItem.headline}`] = this.cycle;

      // Apply effects
      this._applyEventEffects(stateId, newsItem.effects);

      const event = {
        cycle: this.cycle,
        headline: newsItem.headline,
        source: newsItem.source,
        stateId,
        effects: newsItem.effects,
        type: newsItem.type,
      };
      this.eventLog.push(event);
      return event;

    } else {
      // Global event
      const available = this.globalEvents.filter(n => {
        const key = `global_${n.headline}`;
        return !this.usedEvents[key] || (this.cycle - this.usedEvents[key]) > 15;
      });
      if (available.length === 0) return null;

      const newsItem = available[Math.floor(Math.random() * available.length)];
      this.usedEvents[`global_${newsItem.headline}`] = this.cycle;

      // Apply to all alive states
      aliveIds.forEach(id => {
        this._applyEventEffects(id, newsItem.effects);
      });

      const event = {
        cycle: this.cycle,
        headline: newsItem.headline,
        source: newsItem.source,
        stateId: null, // global
        effects: newsItem.effects,
        type: newsItem.type,
      };
      this.eventLog.push(event);
      return event;
    }
  }

  _applyEventEffects(stateId, effects) {
    const s = this.states[stateId];
    if (!s || !s.alive) return;

    if (effects.water) s.resources.water += effects.water;
    if (effects.food) s.resources.food += effects.food;
    if (effects.energy) s.resources.energy += effects.energy;
    if (effects.land) s.resources.land += effects.land;
    if (effects.population) s.population += effects.population;
    if (effects.happiness) s.happiness += effects.happiness;
    if (effects.gdp) s.gdp += effects.gdp;

    this._clampResources(stateId);
    s.happiness = Math.max(0, Math.min(100, s.happiness));
    s.population = Math.max(10, s.population);
    s.gdp = Math.max(0, s.gdp);
  }

  _clampResources(id) {
    const r = this.states[id].resources;
    r.water = Math.max(0, Math.min(100, r.water));
    r.food = Math.max(0, Math.min(100, r.food));
    r.energy = Math.max(0, Math.min(100, r.energy));
    r.land = Math.max(0, Math.min(100, r.land));
  }

  /**
   * Climate-driven event — progressive deterioration.
   * Generates synthetic drought/flood/heatwave events that worsen over time.
   */
  _triggerClimateEvent(aliveIds) {
    if (aliveIds.length === 0) return null;
    const stateId = aliveIds[Math.floor(Math.random() * aliveIds.length)];
    const severity = this.climateStress; // 0→1

    const climateEventTypes = [
      {
        type: 'drought',
        headline: (s) => `Prolonged drought hits ${s} — rivers at historic lows`,
        effects: () => ({
          water: -Math.round(10 + severity * 20),
          food: -Math.round(5 + severity * 10),
          happiness: -Math.round(5 + severity * 10),
        }),
      },
      {
        type: 'flood',
        headline: (s) => `Extreme monsoon floods devastate ${s} infrastructure`,
        effects: () => ({
          land: -Math.round(8 + severity * 15),
          energy: -Math.round(5 + severity * 10),
          population: -Math.round(10 + severity * 30),
        }),
      },
      {
        type: 'climate',
        headline: (s) => `Record heatwave in ${s} — crops wither, energy grid strained`,
        effects: () => ({
          food: -Math.round(8 + severity * 15),
          energy: -Math.round(8 + severity * 12),
          happiness: -Math.round(8 + severity * 10),
        }),
      },
      {
        type: 'environmental',
        headline: (s) => `Deforestation & soil erosion accelerate in ${s}`,
        effects: () => ({
          land: -Math.round(10 + severity * 15),
          water: -Math.round(5 + severity * 8),
        }),
      },
    ];

    const chosen = climateEventTypes[Math.floor(Math.random() * climateEventTypes.length)];
    const stateName = this.states[stateId].name;
    const effects = chosen.effects();

    this._applyEventEffects(stateId, effects);

    const event = {
      cycle: this.cycle,
      headline: `🌡️ ${chosen.headline(stateName)}`,
      source: `Climate Model (stress: ${Math.round(severity * 100)}%)`,
      stateId,
      effects,
      type: chosen.type,
      isClimate: true,
    };
    this.eventLog.push(event);
    return event;
  }

  _buildResult(event, trades, alliances, collapsed = []) {
    return {
      cycle: this.cycle,
      states: Object.values(this.states).map(s => ({
        id: s.id,
        name: s.name,
        title: s.title,
        resources: { ...s.resources },
        population: s.population,
        happiness: s.happiness,
        gdp: s.gdp,
        alive: s.alive,
        action: s.action,
        color: s.color,
        position: s.position,
        sources: s.sources,
        strategy: s.strategy,
        collapseReason: s.collapseReason,
        collapseCycle: s.collapseCycle,
      })),
      event,
      trades,
      alliances,
      collapsed,
      // New data for UI
      climateStress: this.climateStress,
      negotiations: this.lastNegotiations,
    };
  }

  // --- PUBLIC API ---

  getState() {
    return Object.values(this.states).map(s => ({
      id: s.id,
      name: s.name,
      title: s.title,
      resources: { ...s.resources },
      population: s.population,
      happiness: s.happiness,
      gdp: s.gdp,
      alive: s.alive,
      action: s.action,
      color: s.color,
      position: s.position,
      sources: s.sources,
      strategy: this.agents[s.id] ? this.agents[s.id].getStrategyBreakdown() : {},
      collapseReason: s.collapseReason,
      collapseCycle: s.collapseCycle,
    }));
  }

  /**
   * Get rich explanation data for all alive agents.
   * Includes resources, reasoning, Q-values, strategy breakdown, and context.
   */
  getAgentExplanations() {
    return Object.keys(this.states)
      .filter(id => this.states[id].alive)
      .map(id => {
        const s = this.states[id];
        const agent = this.agents[id];
        const hasPartners = this.tradeSystem.tradeHistory.some(t => t.from === id || t.to === id);
        const recentEvent = this.eventLog.length > 0 && this.eventLog[this.eventLog.length - 1]?.stateId === id;
        const stateCode = agent.encodeState(s.resources, hasPartners, recentEvent);

        // Get Q-values for the current state
        const qValues = {};
        ACTIONS.forEach(a => {
          qValues[a] = agent.qTable[stateCode]?.[a] ?? 0;
        });

        // Find best Q-value action
        let bestAction = ACTIONS[0];
        let bestVal = -Infinity;
        ACTIONS.forEach(a => {
          if (qValues[a] > bestVal) { bestVal = qValues[a]; bestAction = a; }
        });
        const wasExploring = s.action !== bestAction;

        // Identify critical / low resources
        const resourceEntries = Object.entries(s.resources);
        const critical = resourceEntries.filter(([, v]) => v <= 15).map(([k]) => k);
        const low = resourceEntries.filter(([, v]) => v > 15 && v <= 30).map(([k]) => k);
        const surplus = resourceEntries.filter(([, v]) => v > 75).map(([k]) => k);
        const lowestRes = resourceEntries.reduce((a, b) => a[1] < b[1] ? a : b);
        const avgRes = resourceEntries.reduce((sum, [, v]) => sum + v, 0) / 4;

        // Active trades for this state
        const activeTrades = this.tradeSystem.tradeHistory
          .filter(t => (t.from === id || t.to === id) && t.active !== false)
          .slice(-3);

        // Strategy breakdown (historical action %)
        const strategyBreakdown = agent.getStrategyBreakdown();

        // Generate human-readable reasoning
        const reasons = [];

        if (wasExploring) {
          reasons.push(`Randomly explored instead of picking best action (${bestAction}) — epsilon = ${(agent.explorationRate * 100).toFixed(0)}%`);
        }

        // Why the chosen/best action makes sense
        const effectiveAction = wasExploring ? s.action : bestAction;
        switch (effectiveAction) {
          case 'HARVEST':
            if (critical.length > 0) reasons.push(`Critical shortage in ${critical.join(', ')} — harvesting to survive`);
            else if (low.length > 0) reasons.push(`Low ${low.join(', ')} — harvesting to rebuild reserves`);
            else reasons.push('Harvesting to boost resource levels');
            break;
          case 'CONSERVE':
            if (avgRes < 40) reasons.push('Resources declining — conserving to slow depletion');
            else reasons.push('Conserving resources to maintain stability');
            if (critical.length > 0) reasons.push(`Protecting depleting ${critical.join(', ')}`);
            break;
          case 'TRADE':
            if (surplus.length > 0 && (low.length > 0 || critical.length > 0))
              reasons.push(`Has surplus ${surplus.join(', ')} but needs ${[...critical, ...low].join(', ')} — trading to rebalance`);
            else if (hasPartners) reasons.push('Leveraging existing trade partnerships');
            else reasons.push('Seeking trade partners for resource exchange');
            break;
          case 'EXPAND':
            if (avgRes > 50) reasons.push('Resources stable — expanding territory for growth');
            else reasons.push('Expanding despite limited resources — risky growth strategy');
            break;
          case 'DEFEND':
            if (recentEvent) reasons.push('Defending against recent disruptive event');
            else if (critical.length > 0) reasons.push(`Protecting critical ${critical.join(', ')} from further loss`);
            else reasons.push('Fortifying defenses to prevent resource loss');
            break;
          case 'INNOVATE':
            if (avgRes > 40) reasons.push('Investing in innovation for long-term efficiency gains');
            else reasons.push('Innovating despite scarcity — seeking breakthrough solutions');
            break;
        }

        // Add context about overall state
        if (s.happiness < 30) reasons.push(`Population unhappy (${s.happiness}%) — civil unrest risk`);
        if (s.population < 50) reasons.push(`Population declining (${s.population}) — survival pressure`);
        if (critical.length >= 2) reasons.push(`Multiple resources critical — collapse risk HIGH`);

        return {
          id: s.id,
          name: s.name,
          stateCode,
          qValues,
          chosenAction: s.action,
          bestAction,
          wasExploring,
          explorationRate: agent.explorationRate,
          totalReward: agent.totalReward,
          statesVisited: agent.getStateSpaceSize(),
          // Rich context data
          resources: { ...s.resources },
          population: s.population,
          happiness: s.happiness,
          gdp: s.gdp,
          critical,
          low,
          surplus,
          lowestResource: { name: lowestRes[0], value: lowestRes[1] },
          avgResources: Math.round(avgRes),
          hasPartners,
          activeTrades: activeTrades.length,
          strategyBreakdown,
          reasons,
        };
      });
  }

  reset(statesData) {
    const data = statesData || this.originalData;
    this.cycle = 0;
    this.states = {};
    this.agents = {};
    this.tradeSystem = new TradeSystem();
    this.history = [];
    this.eventLog = [];
    this.collapsedStates = [];
    this.usedEvents = {};
    this.eventRate = 0.30;
    this.baseEventRate = 0.30;
    this.tradeDisabled = false;
    this.innovationBonus = {};
    this.climateStress = 0;
    this.climateEvents = [];
    this.lastNegotiations = [];
    this._initFromData(data);
  }

  // --- GOD MODE ---

  forceAction(stateId, action) {
    if (this.agents[stateId] && ACTIONS.includes(action)) {
      this.agents[stateId].forceNextAction(action);
    }
  }

  triggerEvent(stateId, eventType) {
    if (!this.states[stateId]?.alive) return null;

    const stateNews = this.states[stateId].news || [];
    const matching = stateNews.filter(n => n.type === eventType);
    if (matching.length === 0) return null;

    const newsItem = matching[Math.floor(Math.random() * matching.length)];
    this._applyEventEffects(stateId, newsItem.effects);

    const event = {
      cycle: this.cycle,
      headline: `[GOD MODE] ${newsItem.headline}`,
      source: newsItem.source,
      stateId,
      effects: newsItem.effects,
      type: newsItem.type,
    };
    this.eventLog.push(event);
    return event;
  }

  blockTrade(stateId1, stateId2, cycles = 10) {
    this.tradeSystem.blockPair(stateId1, stateId2, cycles);
  }

  giveAid(stateId, resource, amount) {
    if (this.states[stateId]?.alive && this.states[stateId].resources[resource] !== undefined) {
      this.states[stateId].resources[resource] = Math.min(
        100,
        this.states[stateId].resources[resource] + amount
      );
    }
  }

  // --- WHAT-IF ---

  setEventRate(rate) {
    this.eventRate = Math.max(0, Math.min(1, rate));
  }

  setTradeDisabled(disabled) {
    this.tradeDisabled = disabled;
  }

  modifyState(stateId, changes) {
    const s = this.states[stateId];
    if (!s) return;
    if (changes.water !== undefined) s.resources.water = changes.water;
    if (changes.food !== undefined) s.resources.food = changes.food;
    if (changes.energy !== undefined) s.resources.energy = changes.energy;
    if (changes.land !== undefined) s.resources.land = changes.land;
    if (changes.population !== undefined) s.population = changes.population;
    this._clampResources(stateId);
  }
}

export default World;
