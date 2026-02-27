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
          const baseAmount = trust <= 3 ? 10 : trust <= 6 ? 15 : 20;
          // Alliance bonus: +5% exchange rate for allied pairs
          const isAllied = trust >= 7 && this.tradeHistory.filter(t =>
            (t.from === a.id && t.to === b.id) || (t.from === b.id && t.to === a.id)
          ).length >= 5;
          const amount = isAllied ? Math.round(baseAmount * 1.05) : baseAmount;

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

  /**
   * Betrayal: penalize trust when a state COULD trade but chose not to.
   * States that chose DEFEND/HARVEST while a partner wanted to trade lose trust.
   * @param {string[]} tradingIds - states that chose TRADE this cycle
   * @param {object} allStates - all states object
   */
  applyBetrayalPenalty(tradingIds, allStates) {
    const tradingSet = new Set(tradingIds);
    for (const key of Object.keys(this.trustMatrix)) {
      const [s1, s2] = key.split('_');
      // If one partner wanted to trade but the other refused
      const s1Trading = tradingSet.has(s1);
      const s2Trading = tradingSet.has(s2);
      if ((s1Trading && !s2Trading && allStates[s2]?.alive) ||
        (s2Trading && !s1Trading && allStates[s1]?.alive)) {
        // The non-trading partner "betrayed" — trust drops
        this.trustMatrix[key] = Math.max(0, this.trustMatrix[key] - 0.5);
        if (this.trustMatrix[key] <= 0) delete this.trustMatrix[key];
      }
    }
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

  // ═══════════════════════════════════════════════════════════════════
  // ═══ MULTI-AGENT NEGOTIATION SYSTEM ═══════════════════════════════
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Generate trade proposals from all alive states.
   * Each state proposes: "I'll give X of my surplus for Y that I need."
   * States don't have to choose TRADE action — anyone can propose.
   */
  generateProposals(aliveIds, allStates) {
    const proposals = [];
    const resources = ['water', 'food', 'energy', 'land'];

    for (const id of aliveIds) {
      const s = allStates[id];
      if (!s || !s.alive) continue;
      const r = s.resources;

      // Find surplus (>55) and need (<35)
      let surplus = null, surplusVal = 55;
      let need = null, needVal = 35;
      for (const res of resources) {
        if (r[res] > surplusVal) { surplus = res; surplusVal = r[res]; }
        if (r[res] < needVal) { need = res; needVal = r[res]; }
      }

      if (!surplus || !need) continue;

      // How much to offer depends on how desperate the need is
      const urgency = Math.max(0.3, 1 - needVal / 35); // 0.3–1
      const offerAmount = Math.round(8 + urgency * 10); // 8–18
      const askAmount = Math.round(6 + urgency * 8);    // 6–14

      proposals.push({
        from: id,
        offer: { resource: surplus, amount: offerAmount },
        ask: { resource: need, amount: askAmount },
        urgency,
      });
    }
    return proposals;
  }

  /**
   * Negotiate: states evaluate incoming proposals.
   * - Accept: if the proposal gives what I need and takes what I have plenty of
   * - Counter-offer: if the amounts aren't right
   * - Reject: if it takes what I also need
   * States that chose TRADE action are more willing to accept.
   */
  negotiate(proposals, allStates, tradingIds) {
    const tradingSet = new Set(tradingIds);
    const accepted = [];
    const log = [];
    const matched = new Set();

    // For each proposal, find the best receiver
    for (const proposal of proposals) {
      if (matched.has(proposal.from)) continue;

      // Find candidates who have what proposer needs and need what proposer offers
      const candidates = proposals
        .filter(p => {
          if (p.from === proposal.from || matched.has(p.from)) return false;
          if (this.isBlocked(proposal.from, p.from)) return false;
          // Complementary: P1 offers what P2 asks, and P2 offers what P1 asks
          return p.offer.resource === proposal.ask.resource ||
            p.ask.resource === proposal.offer.resource;
        })
        .map(p => {
          const trust = this.getTrust(proposal.from, p.from);
          const isTrusted = trust >= 3;
          const isTrading = tradingSet.has(p.from);

          // Score: how good is this match?
          const complementaryScore =
            (p.offer.resource === proposal.ask.resource ? 3 : 0) +
            (p.ask.resource === proposal.offer.resource ? 3 : 0);
          const trustScore = trust * 0.5;
          const tradeBonus = isTrading ? 2 : 0;

          return { partner: p, score: complementaryScore + trustScore + tradeBonus, isTrusted, isTrading };
        })
        .sort((a, b) => b.score - a.score);

      if (candidates.length === 0) continue;

      const best = candidates[0];
      const partner = best.partner;
      const trust = this.getTrust(proposal.from, partner.from);

      // Acceptance threshold: trading states accept more readily
      const fromTrading = tradingSet.has(proposal.from);
      const partnerTrading = best.isTrading;
      const acceptThreshold = (fromTrading && partnerTrading) ? 2 :
        (fromTrading || partnerTrading) ? 3.5 : 5;

      if (best.score >= acceptThreshold) {
        // ACCEPT — negotiate final amounts
        // Counter-offer: split the difference based on trust
        const trustFactor = Math.min(1, trust / 8); // 0–1
        const finalGiveAmt = Math.round(
          proposal.offer.amount * (0.7 + trustFactor * 0.3)
        );
        const finalGetAmt = Math.round(
          partner.offer.amount * (0.7 + trustFactor * 0.3)
        );

        accepted.push({
          from: proposal.from,
          to: partner.from,
          give: { resource: proposal.offer.resource, amount: finalGiveAmt },
          get: { resource: partner.offer.resource, amount: finalGetAmt },
          trust,
          negotiationType: (fromTrading && partnerTrading) ? 'mutual' :
            (fromTrading || partnerTrading) ? 'initiated' : 'opportunistic',
        });

        matched.add(proposal.from);
        matched.add(partner.from);

        log.push({
          type: 'accepted',
          from: proposal.from,
          to: partner.from,
          giveRes: proposal.offer.resource,
          giveAmt: finalGiveAmt,
          getRes: partner.offer.resource,
          getAmt: finalGetAmt,
          trust,
          cycle: null, // filled by World
        });
      } else if (best.score >= acceptThreshold * 0.5) {
        // COUNTER-OFFER — logged but not executed (builds trust for next cycle)
        this.updateTrust(proposal.from, partner.from, 0.3);

        log.push({
          type: 'counter',
          from: proposal.from,
          to: partner.from,
          reason: `${allStates[partner.from]?.name} counter-offered — wants more ${proposal.offer.resource}`,
        });
      } else {
        // REJECT
        log.push({
          type: 'rejected',
          from: proposal.from,
          to: partner.from,
          reason: 'Terms unfavorable',
        });
      }
    }

    return { accepted, log, matched };
  }

  /**
   * Execute negotiated trades — apply resource transfers.
   */
  executeNegotiated(acceptedTrades, allStates) {
    const trades = [];
    for (const trade of acceptedTrades) {
      const fromState = allStates[trade.from];
      const toState = allStates[trade.to];
      if (!fromState?.alive || !toState?.alive) continue;

      // Transfer: from gives, to receives
      fromState.resources[trade.give.resource] = Math.max(0, fromState.resources[trade.give.resource] - trade.give.amount);
      toState.resources[trade.give.resource] = Math.min(100, toState.resources[trade.give.resource] + trade.give.amount);

      toState.resources[trade.get.resource] = Math.max(0, toState.resources[trade.get.resource] - trade.get.amount);
      fromState.resources[trade.get.resource] = Math.min(100, fromState.resources[trade.get.resource] + trade.get.amount);

      // Trust boost for successful negotiation
      this.updateTrust(trade.from, trade.to, 1.5);

      trades.push({
        from: trade.from,
        to: trade.to,
        gave: trade.give,
        got: trade.get,
        trust: this.getTrust(trade.from, trade.to),
        negotiated: true,
        negotiationType: trade.negotiationType,
      });
    }

    this.tradeHistory.push(...trades);
    if (this.tradeHistory.length > 200) {
      this.tradeHistory = this.tradeHistory.slice(-200);
    }
    return trades;
  }
}

export default TradeSystem;
