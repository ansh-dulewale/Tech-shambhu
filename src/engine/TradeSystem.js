class TradeSystem {
  constructor() {
    this.trustMatrix = {};
    this.tradeHistory = [];
    this.blockedPairs = {};
  }

  getTrust(id1, id2) {
    const key = [id1, id2].sort().join('_');
    return this.trustMatrix[key] || 0;
  }

  updateTrust(id1, id2, delta) {
    const key = [id1, id2].sort().join('_');
    this.trustMatrix[key] = Math.max(0, Math.min(10, (this.trustMatrix[key] || 0) + delta));
  }

  isBlocked(id1, id2) {
    const key = [id1, id2].sort().join('_');
    return (this.blockedPairs[key] || 0) > 0;
  }

  blockPair(id1, id2, cycles) {
    const key = [id1, id2].sort().join('_');
    this.blockedPairs[key] = cycles;
  }

  tickBlocks() {
    for (const key of Object.keys(this.blockedPairs)) {
      if (this.blockedPairs[key] > 0) this.blockedPairs[key]--;
    }
  }

  /**
   * Decay trust for pairs that didn't trade this cycle.
   * Relationships naturally weaken without active cooperation.
   * @param {string[]} tradedPairKeys - array of sorted 'id1_id2' keys that traded this cycle
   */
  decayTrust(tradedPairKeys = []) {
    const tradedSet = new Set(tradedPairKeys);
    for (const key of Object.keys(this.trustMatrix)) {
      if (!tradedSet.has(key) && this.trustMatrix[key] > 0) {
        this.trustMatrix[key] = Math.max(0, this.trustMatrix[key] - 0.1);
        // Clean up zero-trust entries
        if (this.trustMatrix[key] <= 0) delete this.trustMatrix[key];
      }
    }
  }

  matchAndExecute(tradingStateIds, allStates) {
    const trades = [];
    const matched = new Set();

    // Find surplus and need for each trading state
    const tradingInfo = tradingStateIds.map(id => {
      const state = allStates[id];
      if (!state || !state.alive) return null;
      const r = state.resources;
      const resources = ['water', 'food', 'energy', 'land'];

      // Surplus: highest resource above 40
      let surplus = null, surplusVal = 40;
      for (const res of resources) {
        if (r[res] > surplusVal) { surplus = res; surplusVal = r[res]; }
      }

      // Need: lowest resource below 50
      let need = null, needVal = 50;
      for (const res of resources) {
        if (r[res] < needVal) { need = res; needVal = r[res]; }
      }

      return { id, surplus, need };
    }).filter(x => x && x.surplus && x.need);

    // Match complementary pairs
    for (let i = 0; i < tradingInfo.length; i++) {
      if (matched.has(tradingInfo[i].id)) continue;
      for (let j = i + 1; j < tradingInfo.length; j++) {
        if (matched.has(tradingInfo[j].id)) continue;

        const a = tradingInfo[i];
        const b = tradingInfo[j];

        // Check if blocked
        if (this.isBlocked(a.id, b.id)) continue;

        // Check complementary: A has what B needs, B has what A needs
        const complementary = (a.surplus === b.need && b.surplus === a.need) ||
          (a.surplus === b.need) || (b.surplus === a.need);

        if (complementary) {
          const trust = this.getTrust(a.id, b.id);
          const amount = trust <= 3 ? 10 : trust <= 6 ? 15 : 20;

          const gaveRes = a.surplus;
          const gotRes = b.surplus || b.need === a.surplus ? Object.keys(allStates[b.id].resources)
            .filter(r => r !== a.surplus)
            .sort((x, y) => allStates[b.id].resources[y] - allStates[b.id].resources[x])[0] : b.surplus;

          // Execute trade
          allStates[a.id].resources[gaveRes] = Math.max(0, allStates[a.id].resources[gaveRes] - amount);
          allStates[b.id].resources[gaveRes] = Math.min(100, allStates[b.id].resources[gaveRes] + amount);

          allStates[b.id].resources[gotRes] = Math.max(0, allStates[b.id].resources[gotRes] - amount);
          allStates[a.id].resources[gotRes] = Math.min(100, allStates[a.id].resources[gotRes] + amount);

          // Update trust
          this.updateTrust(a.id, b.id, 1);

          trades.push({
            from: a.id,
            to: b.id,
            gave: { resource: gaveRes, amount },
            got: { resource: gotRes, amount },
            trust: this.getTrust(a.id, b.id)
          });

          matched.add(a.id);
          matched.add(b.id);
          break;
        }
      }
    }

    this.tradeHistory.push(...trades);
    // Cap history to prevent unbounded memory growth
    if (this.tradeHistory.length > 200) {
      this.tradeHistory = this.tradeHistory.slice(-200);
    }
    return trades;
  }

  getAlliances() {
    const alliances = [];
    for (const [key, trust] of Object.entries(this.trustMatrix)) {
      if (trust >= 7) {
        const [s1, s2] = key.split('_');
        const tradeCount = this.tradeHistory.filter(t =>
          (t.from === s1 && t.to === s2) || (t.from === s2 && t.to === s1)
        ).length;
        if (tradeCount >= 5) {
          alliances.push({ states: [s1, s2], trust, trades: tradeCount });
        }
      }
    }
    return alliances;
  }

  reset() {
    this.trustMatrix = {};
    this.tradeHistory = [];
    this.blockedPairs = {};
  }
}

export default TradeSystem;
