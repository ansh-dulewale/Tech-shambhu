const ACTIONS = ['HARVEST', 'CONSERVE', 'TRADE', 'EXPAND', 'DEFEND', 'INNOVATE'];

class Agent {
  constructor(stateId) {
    this.stateId = stateId;
    this.qTable = {};
    this.learningRate = 0.1;
    this.discountFactor = 0.9;
    this.explorationRate = 0.3;
    this.actionHistory = [];
    this.totalReward = 0;
    this.forcedAction = null; // God Mode override
  }

  encodeState(resources, hasPartners, recentEvent) {
    const level = (val) => val <= 30 ? 'L' : val <= 60 ? 'M' : 'H';
    return `${level(resources.water)}_${level(resources.food)}_${level(resources.energy)}_${level(resources.land)}_${hasPartners ? 'P' : 'N'}_${recentEvent ? 'E' : 'X'}`;
  }

  chooseAction(stateCode) {
    // God Mode override
    if (this.forcedAction) {
      const action = this.forcedAction;
      this.forcedAction = null;
      this.actionHistory.push(action);
      return action;
    }

    // Initialize Q-values for unseen state
    if (!this.qTable[stateCode]) {
      this.qTable[stateCode] = {};
      ACTIONS.forEach(a => this.qTable[stateCode][a] = 0);
    }

    // Epsilon-greedy: explore or exploit
    if (Math.random() < this.explorationRate) {
      const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
      this.actionHistory.push(action);
      return action;
    }

    // Pick best action (shuffle to break ties)
    const qValues = this.qTable[stateCode];
    let bestAction = ACTIONS[0];
    let bestValue = -Infinity;
    const shuffled = [...ACTIONS].sort(() => Math.random() - 0.5);
    for (const action of shuffled) {
      if ((qValues[action] || 0) > bestValue) {
        bestValue = qValues[action] || 0;
        bestAction = action;
      }
    }
    this.actionHistory.push(bestAction);
    return bestAction;
  }

  learn(oldStateCode, action, reward, newStateCode) {
    if (!this.qTable[oldStateCode]) {
      this.qTable[oldStateCode] = {};
      ACTIONS.forEach(a => this.qTable[oldStateCode][a] = 0);
    }
    if (!this.qTable[newStateCode]) {
      this.qTable[newStateCode] = {};
      ACTIONS.forEach(a => this.qTable[newStateCode][a] = 0);
    }

    const oldQ = this.qTable[oldStateCode][action] || 0;
    const maxFutureQ = Math.max(...ACTIONS.map(a => this.qTable[newStateCode][a] || 0));
    const newQ = oldQ + this.learningRate * (reward + this.discountFactor * maxFutureQ - oldQ);
    this.qTable[oldStateCode][action] = newQ;

    this.totalReward += reward;
  }

  decayExploration(cycle) {
    if (cycle <= 30) this.explorationRate = 0.3;
    else if (cycle <= 70) this.explorationRate = 0.15;
    else this.explorationRate = 0.10;
  }

  getStrategyBreakdown() {
    if (this.actionHistory.length === 0) {
      return ACTIONS.reduce((acc, a) => { acc[a] = 0; return acc; }, {});
    }
    const counts = {};
    ACTIONS.forEach(a => counts[a] = 0);
    this.actionHistory.forEach(a => counts[a] = (counts[a] || 0) + 1);
    const total = this.actionHistory.length;
    const result = {};
    ACTIONS.forEach(a => result[a] = Math.round((counts[a] / total) * 100));
    return result;
  }

  getPrimaryStrategy() {
    const breakdown = this.getStrategyBreakdown();
    let best = ACTIONS[0];
    let bestPct = 0;
    ACTIONS.forEach(a => {
      if (breakdown[a] > bestPct) { bestPct = breakdown[a]; best = a; }
    });
    return best;
  }

  forceNextAction(action) {
    if (ACTIONS.includes(action)) {
      this.forcedAction = action;
    }
  }

  reset() {
    this.qTable = {};
    this.actionHistory = [];
    this.explorationRate = 0.3;
    this.totalReward = 0;
    this.forcedAction = null;
  }
}

export { ACTIONS };
export default Agent;
