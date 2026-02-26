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

    // STEP 1: CONSUME — resources deplete based on population
    const conservingStates = new Set();
    const defendingStates = new Set();
    const defendFloors = {};

    aliveIds.forEach(id => {
      const s = this.states[id];
      const popFactor = s.population / 1000;
      const innovBonus = 1 - this.innovationBonus[id];

      s.resources.water -= (5 + popFactor * 3) * innovBonus;
      s.resources.food -= (4 + popFactor * 2.5) * innovBonus;
      s.resources.energy -= (3 + popFactor * 2) * innovBonus;
      s.resources.land -= (0.5 + popFactor * 0.3) * innovBonus;

      // Natural regeneration — scales with land (more land = better regen)
      const landFactor = 0.5 + (s.resources.land / 100) * 1.0; // 0.5x at land=0, 1.5x at land=100
      s.resources.water += 2 * landFactor;
      s.resources.food += 1.5 * landFactor;
      s.resources.energy += 1 * landFactor;
      s.resources.land += 0.3;

      // Clamp
      this._clampResources(id);
    });

    // STEP 2: TRIGGER EVENT — random news event
    let event = null;
    if (Math.random() < this.eventRate) {
      event = this._triggerRandomEvent();
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

    // STEP 4: RESOLVE TRADES
    let trades = [];
    if (!this.tradeDisabled) {
      const tradingIds = aliveIds.filter(id => this.states[id].action === 'TRADE');
      trades = this.tradeSystem.matchAndExecute(tradingIds, this.states);
      this.tradeSystem.tickBlocks();
      // Decay trust for pairs that didn't trade this cycle
      const tradedPairKeys = trades.map(t => [t.from, t.to].sort().join('_'));
      this.tradeSystem.decayTrust(tradedPairKeys);
      // Betrayal penalty: trust drops when a partner refuses to trade
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

      // GDP
      const tradeBonus = trades.filter(t => t.from === id || t.to === id).length * 20;
      const surplusBonus = avg > 50 ? 10 : avg < 20 ? -15 : 0;
      s.gdp += tradeBonus + surplusBonus;
      s.gdp = Math.max(0, s.gdp);

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
    let reward = 0;

    // Resource stability: penalty for any resource below 15
    const resources = Object.values(s.resources);
    const criticalCount = resources.filter(v => v < 15).length;
    reward -= criticalCount * 5;

    // Resource health bonus
    const avg = resources.reduce((a, b) => a + b, 0) / resources.length;
    if (avg > 60) reward += 3;
    else if (avg > 40) reward += 1;
    else if (avg < 20) reward -= 5;

    // Population change
    if (s.population > 500) reward += 2;
    else if (s.population < 200) reward -= 3;

    // Happiness
    if (s.happiness > 70) reward += 2;
    else if (s.happiness < 30) reward -= 3;

    // Trade success
    const myTrades = trades.filter(t => t.from === id || t.to === id);
    reward += myTrades.length * 3;

    // Collapse penalty
    if (collapsed.includes(id)) reward -= 100;

    return reward;
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
    this.tradeDisabled = false;
    this.innovationBonus = {};
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
