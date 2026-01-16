import type { Game } from 'boardgame.io';
import type { CardInstance, GameState, PlayerState } from './types';
import { createCardInstance, shuffle } from './logic';
import { moves as sharedMoves } from './moves';

export const MyCardGame: Game<GameState> = {
  name: 'my-card-game',

  setup: (ctx, setupData) => {
    const loadUserDeck = (): string[] => {
      if (typeof window === 'undefined') return [];
      try {
        const rawDecks = window.localStorage.getItem('aether-nexus-decks');
        const decks = rawDecks ? JSON.parse(rawDecks) : [];
        const activeDeckId = window.localStorage.getItem('aether-active-deck-id');
        const userDeck = decks.find((deck: any) => deck.id === activeDeckId) || decks[0];

        if (userDeck && userDeck.cards) {
          const cardList: string[] = [];
          Object.entries(userDeck.cards).forEach(([cardId, count]) => {
            for (let i = 0; i < (count as number); i += 1) {
              cardList.push(cardId);
            }
          });
          return cardList;
        }
      } catch (error) {
        console.error('Failed to load user deck', error);
      }
      return [];
    };

    const loadUserTerritories = (): string[] => {
      if (typeof window === 'undefined') return [];
      try {
        const rawDecks = window.localStorage.getItem('aether-nexus-decks');
        const decks = rawDecks ? JSON.parse(rawDecks) : [];
        const activeDeckId = window.localStorage.getItem('aether-active-deck-id');
        const userDeck = decks.find((deck: any) => deck.id === activeDeckId) || decks[0];
        if (userDeck && Array.isArray(userDeck.territories) && userDeck.territories.length === 3) {
          return userDeck.territories;
        }
      } catch (error) {
        console.error('Failed to load user territories', error);
      }
      return [];
    };

    const buildDeck = (ids: string[], copies: number): string[] =>
      ids.flatMap((id) => Array.from({ length: copies }, () => id));

    const defaultDeckIds = buildDeck(
      ['sc001', 'sc002', 'sc003', 'sc004', 'sc005', 'sc006', 'sc007', 'sc008', 'sc009', 'sc010'],
      4
    );

    const playerDeckList = loadUserDeck();
    const finalDeckIds = playerDeckList.length >= 40 ? playerDeckList : defaultDeckIds;
    const defaultTerritoriesP0 = ['t001', 't002', 't003'];
    const defaultTerritoriesP1 = ['t004', 't005', 't006'];
    const savedTerritories = loadUserTerritories();
    const p0Territories =
      setupData?.p0Territories || (savedTerritories.length === 3 ? savedTerritories : defaultTerritoriesP0);
    const p1Territories = setupData?.p1Territories || defaultTerritoriesP1;
    const createTerritoryDeck = (ids: string[], ownerID: string) =>
      ids.map((tid) => {
        const c = createCardInstance(tid, ownerID);
        c.isFaceDown = true;
        return c;
      });

    const createPlayer = (id: string, isSecond: boolean): PlayerState => {
      const deck = shuffle([...finalDeckIds]).map((cid) => createCardInstance(cid, id));
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
      territoryDecks: {
        '0': createTerritoryDeck(p0Territories, '0'),
        '1': createTerritoryDeck(p1Territories, '1')
      },
      activeTerritory: null,
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
    onBegin: ({ G, ctx, events }) => {
      const player = G.players[ctx.currentPlayer];
      if (ctx.currentPlayer === '0') {
        G.turnCount++;
      }
      if (G.turnCount <= 6) {
        const territoryDeck = G.territoryDecks[ctx.currentPlayer];
        const nextTerritory = territoryDeck?.shift();
        if (nextTerritory) {
          nextTerritory.isFaceDown = false;
          G.activeTerritory = nextTerritory;

          if (nextTerritory.id === 't002') {
            const card = player.deck.pop();
            if (card) {
              card.isFaceDown = false;
              player.hand.push(card);
            }
          }

          if (nextTerritory.id === 't004') {
            const opponentID = ctx.currentPlayer === '0' ? '1' : '0';
            const oppBoard = G.players[opponentID].battleZone;
            const validIndices = oppBoard
              .map((c, i) => (c ? i : -1))
              .filter((i) => i !== -1);
            if (validIndices.length > 0) {
              const randIdx = validIndices[Math.floor(Math.random() * validIndices.length)];
              const target = oppBoard[randIdx];
              if (target) {
                const current = target.currentBP ?? target.bp ?? 0;
                target.currentBP = current - 2000;
                if (target.currentBP <= 0) {
                  oppBoard[randIdx] = null;
                  G.players[opponentID].graveyard.push(target);
                }
              }
            }
          }

          if (nextTerritory.id === 't005') {
            const validUnits = player.graveyard.filter((c) => c.type === 'UNIT');
            if (validUnits.length > 0) {
              const randIdx = Math.floor(Math.random() * validUnits.length);
              const recovered = validUnits[randIdx];
              const realIdx = player.graveyard.indexOf(recovered);
              player.graveyard.splice(realIdx, 1);
              player.hand.push(recovered);
            }
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
      if (player.energyZone.length > 0) {
        events?.setActivePlayers({ value: { [ctx.currentPlayer]: 'deployment' } });
      }
    },

    stages: {
      deployment: {
        moves: {
          returnEnergy: sharedMoves.returnEnergy,
          endDeployment: sharedMoves.endDeployment
        }
      },
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
