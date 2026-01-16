import type { Game } from 'boardgame.io';
import type { CardInstance, GameState, PlayerState } from './types';
import { createCardInstance, shuffle } from './logic';
import { moves as sharedMoves } from './moves';

export const MyCardGame: Game<GameState> = {
  name: 'my-card-game',

  setup: () => {
    const territoryIds = ['t001', 't002', 't003', 't004', 't005'];
    const sharedDeck = territoryIds.map((tid) => {
      const c = createCardInstance(tid, 'neutral');
      c.isFaceDown = true;
      return c;
    });

    const createPlayer = (id: string, isSecond: boolean): PlayerState => {
      const deckIds = [
        'u001', 'u001', 'u001', 'u002', 'u002', 'u002',
        'u003', 'u003', 'u003', 'u004', 'u004', 'u005',
        'u006', 'u006', 'u007', 'u007',
        's001', 's001', 's002', 's002', 's003', 's003'
      ];

      const deck = shuffle(deckIds).map((cid) => createCardInstance(cid, id));
      const lifeCards = deck.splice(0, 6).map((c) => {
        c.isFaceDown = true;
        return c;
      });
      const handCards = deck.splice(0, 5);
      const energyCards: CardInstance[] = [];

      if (isSecond) {
        const bonusCard = deck.shift();
        if (bonusCard) energyCards.push(bonusCard);
      }

      return {
        id,
        lifeZone: lifeCards,
        hand: handCards,
        deck,
        energyZone: energyCards,
        battleZone: Array(5).fill(null),
        graveyard: [],
        hasPlayedEnergy: false
      };
    };

    return {
      players: { '0': createPlayer('0', false), '1': createPlayer('1', true) },
      sharedDeck,
      sharedRevealed: [],
      turnCount: 0,
      era: 1,
      combatState: null,
      pendingEffect: null,
      pendingAttack: null
    };
  },

  phases: {
    main: {
      start: true,
      moves: {
        drawCard: sharedMoves.drawCard,
        playCardAsEnergy: sharedMoves.playCardAsEnergy,
        playUnit: sharedMoves.playUnit,
        playSpell: sharedMoves.playSpell,
        useUnitEffect: sharedMoves.useUnitEffect,
        declareAttack: sharedMoves.declareAttack,
        playInstant: sharedMoves.playInstant,
        passResponse: sharedMoves.passResponse,
        endTurn: ({ events }) => {
          events.endTurn();
        }
      }
    }
  },

  turn: {
    onBegin: ({ G, ctx }) => {
      const player = G.players[ctx.currentPlayer];
      if (ctx.currentPlayer === '0') {
        G.turnCount++;
        if (G.turnCount <= 5) {
          const revealed = G.sharedDeck.shift();
          if (revealed) {
            revealed.isFaceDown = false;
            G.sharedRevealed.push(revealed);
          }
        }
      }
      player.hasPlayedEnergy = false;
      if (player.deck.length > 0) {
        const card = player.deck.pop();
        if (card) {
          card.isFaceDown = false;
          player.hand.push(card);
        }
      }
    },

    stages: {
      response: {
        moves: {
          playInstant: sharedMoves.playInstant,
          passResponse: sharedMoves.passResponse
        }
      },
      blocking: {
        moves: {
          playInstant: sharedMoves.playInstant,
          skipBlock: sharedMoves.skipBlock,
          block: sharedMoves.block
        }
      },
      waiting: {
        moves: {}
      }
    },
    onEnd: ({ G, ctx }) => {
      const player = G.players[ctx.currentPlayer];
      player.battleZone.forEach((c) => {
        if (c) {
          c.isTapped = false;
          c.canAttack = true;
        }
      });
      player.energyZone.forEach((c) => {
        c.isTapped = false;
      });
    }
  },

  endIf: ({ G }) => {
    if (G.players['0'].lifeZone.length <= 0) return { winner: '1', reason: 'life' };
    if (G.players['1'].lifeZone.length <= 0) return { winner: '0', reason: 'life' };
    if (G.players['0'].deck.length <= 0) return { winner: '1', reason: 'deckout' };
    if (G.players['1'].deck.length <= 0) return { winner: '0', reason: 'deckout' };
    return undefined;
  }
};
