import { INVALID_MOVE } from 'boardgame.io/core';
import type { MoveContext, PlayerID } from './types';
import { resolveEffect, takeDamage } from './logic';

const getOpponentID = (playerID: PlayerID): PlayerID => (playerID === '0' ? '1' : '0');

export const moves = {
  drawCard: ({ G, playerID }: MoveContext) => {
    const player = G.players[playerID];
    const card = player.deck.pop();
    if (card) {
      card.isFaceDown = false;
      player.hand.push(card);
    }
  },

  playCardAsEnergy: ({ G, playerID }: MoveContext, handIndex: number) => {
    const player = G.players[playerID];
    if (player.hasPlayedEnergy) return INVALID_MOVE;
    if (player.energyZone.length >= 5) return INVALID_MOVE;

    const card = player.hand[handIndex];
    if (!card) return INVALID_MOVE;
    player.hand.splice(handIndex, 1);
    card.isTapped = false;
    player.energyZone.push(card);
    player.hasPlayedEnergy = true;
  },

  playUnit: ({ G, ctx, playerID }: MoveContext, handIndex: number) => {
    const player = G.players[playerID];
    const card = player.hand[handIndex];
    if (!card || card.type !== 'UNIT') return INVALID_MOVE;
    if (player.energyZone.length < card.cost) return INVALID_MOVE;

    const slotIdx = player.battleZone.findIndex((s) => s === null);
    if (slotIdx === -1) return INVALID_MOVE;

    player.hand.splice(handIndex, 1);
    card.isTapped = true;
    card.canAttack = false;
    player.battleZone[slotIdx] = card;

    card.effects?.forEach((eff) => resolveEffect(G, ctx, playerID, eff));
  },

  playSpell: (
    { G, ctx, events, playerID }: MoveContext,
    handIndex: number,
    targetSlot?: number,
    targetPlayerID?: PlayerID
  ) => {
    const player = G.players[playerID];
    const card = player.hand[handIndex];
    if (!card || (card.type !== 'SPELL' && card.type !== 'SPELL_INSTANT')) return INVALID_MOVE;
    if (player.energyZone.length < card.cost) return INVALID_MOVE;
    if (card.type === 'SPELL' && ctx.phase !== 'main') return INVALID_MOVE;

    player.hand.splice(handIndex, 1);
    player.graveyard.push(card);
    if (card.effects && card.effects.length > 0) {
      G.pendingEffect = { source: 'SPELL', playerID, card, targetSlot, targetPlayerID };
      const opponentID = getOpponentID(playerID);
      events?.setActivePlayers({ value: { [opponentID]: 'response', [playerID]: 'waiting' } });
    }
  },

  playInstant: (
    { G, ctx, playerID, events }: MoveContext,
    handIndex: number,
    targetSlot?: number,
    targetPlayerID?: PlayerID
  ) => {
    const player = G.players[playerID];
    const card = player.hand[handIndex];
    if (!card || card.type !== 'SPELL_INSTANT') return INVALID_MOVE;
    if (player.energyZone.length < card.cost) return INVALID_MOVE;

    player.hand.splice(handIndex, 1);
    player.graveyard.push(card);
    if (G.pendingEffect || G.pendingAttack) {
      card.effects?.forEach((eff) => resolveEffect(G, ctx, playerID, eff, targetSlot, targetPlayerID));
      return;
    }

    if (card.effects && card.effects.length > 0) {
      G.pendingEffect = { source: 'SPELL', playerID, card, targetSlot, targetPlayerID };
      const opponentID = getOpponentID(playerID);
      events?.setActivePlayers({ value: { [opponentID]: 'response', [playerID]: 'waiting' } });
    }
  },

  declareAttack: ({ G, ctx, events, playerID }: MoveContext, attackerSlotIndex: number) => {
    const player = G.players[playerID];
    const attacker = player.battleZone[attackerSlotIndex];
    const opponentID = getOpponentID(playerID);
    const opponent = G.players[opponentID];

    if (!attacker || attacker.isTapped || !attacker.canAttack) return INVALID_MOVE;

    attacker.isTapped = true;
    G.pendingAttack = { attackerPlayerID: playerID, attackerIndex: attackerSlotIndex };
    if (opponent) {
      events?.setActivePlayers({ value: { [opponentID]: 'response', [playerID]: 'waiting' } });
    }
  },

  useUnitEffect: (
    { G, ctx, events, playerID }: MoveContext,
    slotIndex: number,
    targetSlot?: number,
    targetPlayerID?: PlayerID
  ) => {
    const player = G.players[playerID];
    const unit = player.battleZone[slotIndex];
    if (!unit || unit.isTapped) return INVALID_MOVE;

    unit.isTapped = true;
    unit.effects
      ?.filter((eff) => eff.action === 'ACTIVATE')
      .forEach(() => {
        G.pendingEffect = { source: 'UNIT_EFFECT', playerID, card: unit, targetSlot, targetPlayerID };
        const opponentID = getOpponentID(playerID);
        events?.setActivePlayers({ value: { [opponentID]: 'response', [playerID]: 'waiting' } });
      });
  },

  passResponse: ({ G, ctx, events, playerID }: MoveContext) => {
    if (ctx.activePlayers?.[playerID] !== 'response') return INVALID_MOVE;

    if (G.pendingEffect) {
      const pending = G.pendingEffect;
      G.pendingEffect = null;
      pending.card.effects?.forEach((eff) =>
        resolveEffect(G, ctx, pending.playerID, eff, pending.targetSlot, pending.targetPlayerID)
      );
      events?.setActivePlayers?.({});
      return;
    }

    if (G.pendingAttack) {
      const pending = G.pendingAttack;
      G.pendingAttack = null;
      const attacker = G.players[pending.attackerPlayerID].battleZone[pending.attackerIndex];
      const opponentID = getOpponentID(pending.attackerPlayerID);
      const opponent = G.players[opponentID];
      if (!attacker) {
        events?.setActivePlayers?.({});
        return;
      }
      const canBlock = opponent.battleZone.some((c) => c !== null && !c.isTapped);
      if (canBlock) {
        G.combatState = { attackerPlayerID: pending.attackerPlayerID, attackerIndex: pending.attackerIndex };
        events?.setActivePlayers({ value: { [opponentID]: 'blocking', [pending.attackerPlayerID]: 'waiting' } });
      } else {
        takeDamage(G, opponentID, 1);
        events?.setActivePlayers?.({});
      }
      return;
    }

    events?.setActivePlayers?.({});
  },

  skipBlock: ({ G, events, playerID }: MoveContext) => {
    const combat = G.combatState;
    if (!combat) return INVALID_MOVE;

    takeDamage(G, playerID, 1);
    G.combatState = null;
    events?.endStage();
    events?.setActivePlayers?.({});
  },

  block: ({ G, events, playerID }: MoveContext, blockerSlotIndex: number) => {
    const combat = G.combatState;
    if (!combat) return INVALID_MOVE;

    const attackerID = combat.attackerPlayerID;
    const defenderID = playerID;

    const attacker = G.players[attackerID].battleZone[combat.attackerIndex];
    const blocker = G.players[defenderID].battleZone[blockerSlotIndex];

    if (!attacker || !blocker || blocker.isTapped) return INVALID_MOVE;

    blocker.isTapped = true;
    const atkBP = attacker.currentBP ?? attacker.bp ?? 0;
    const blkBP = blocker.currentBP ?? blocker.bp ?? 0;

    if (atkBP >= blkBP) {
      G.players[defenderID].battleZone[blockerSlotIndex] = null;
      G.players[defenderID].graveyard.push(blocker);
    }

    G.combatState = null;
    events?.endStage();
    events?.setActivePlayers?.({});
  }
};
