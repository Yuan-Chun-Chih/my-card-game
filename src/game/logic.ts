import type { CardDef, CardInstance, EffectDef, GameState, PlayerID } from './types';
import cardData from '../data/cards.json';

type RawEffect = {
  action: string;
  value?: number;
  amount?: number;
  target?: string;
  trigger?: string;
  filter?: {
    type?: string;
    id?: string;
    nameIncludes?: string;
    keyword?: string;
  };
  shuffle?: boolean;
};

type RawCard = {
  id: string;
  name: string;
  type: string;
  cost: number;
  stats?: { atk: number };
  bp?: number;
  keywords?: string[];
  description: string;
  image: string;
  effects?: RawEffect[];
};

const toEffectDef = (raw: RawEffect): EffectDef => {
  const amount = raw.amount ?? raw.value;
  switch (raw.action) {
    case 'DAMAGE_ENEMY':
      return { action: 'DAMAGE_PLAYER', amount, target: 'OPPONENT', trigger: raw.trigger as EffectDef['trigger'] };
    case 'BUFF_ATK':
      return {
        action: 'BUFF_UNIT_BP',
        amount,
        target: raw.target as EffectDef['target'],
        trigger: raw.trigger as EffectDef['trigger']
      };
    default:
      return {
        action: raw.action as EffectDef['action'],
        amount,
        target: raw.target as EffectDef['target'],
        trigger: raw.trigger as EffectDef['trigger'],
        filter: raw.filter as EffectDef['filter'],
        shuffle: raw.shuffle
      };
  }
};

const normalizeCard = (raw: RawCard): CardDef => ({
  id: raw.id,
  name: raw.name,
  type: raw.type as CardDef['type'],
  cost: raw.cost,
  bp: raw.bp ?? raw.stats?.atk,
  keywords: raw.keywords,
  description: raw.description,
  image: raw.image,
  effects: raw.effects?.map(toEffectDef)
});

const cardsCollection = (cardData as RawCard[]).map(normalizeCard);

export const createCardInstance = (cardId: string, ownerID: PlayerID): CardInstance => {
  const data = cardsCollection.find((c) => c.id === cardId);
  if (!data) throw new Error(`Card ${cardId} not found`);

  return {
    ...data,
    instanceId: Math.random().toString(36).slice(2, 11),
    ownerID,
    currentBP: data.bp,
    isTapped: false,
    isFaceDown: false,
    canAttack: false
  };
};

export const shuffle = <T>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

export const takeDamage = (G: GameState, playerID: PlayerID, amount: number) => {
  const player = G.players[playerID];
  for (let i = 0; i < amount; i += 1) {
    const lifeCard = player.lifeZone.pop();
    if (lifeCard) {
      lifeCard.isFaceDown = false;
      player.hand.push(lifeCard);
    }
  }
};

export const resolveEffect = (
  G: GameState,
  ctx: any,
  playerID: PlayerID,
  effect: EffectDef,
  targetSlot?: number,
  targetPlayerID?: PlayerID
) => {
  const player = G.players[playerID];
  const opponentID = playerID === '0' ? '1' : '0';
  const opponent = G.players[opponentID];
  const amount = effect.amount ?? effect.value ?? 1;

  switch (effect.action) {
    case 'DRAW': {
      for (let i = 0; i < amount; i += 1) {
        const card = player.deck.pop();
        if (card) {
          card.isFaceDown = false;
          player.hand.push(card);
        }
      }
      break;
    }
    case 'HEAL_PLAYER': {
      for (let i = 0; i < amount; i += 1) {
        const card = player.deck.pop();
        if (card) {
          card.isFaceDown = true;
          player.lifeZone.push(card);
        }
      }
      break;
    }
    case 'DAMAGE_ENEMY':
    case 'DAMAGE_PLAYER': {
      const target =
        effect.target === 'SELF'
          ? playerID
          : effect.target === 'OPPONENT'
          ? opponentID
          : opponentID;
      takeDamage(G, target, amount);
      break;
    }
    case 'DESTROY_UNIT': {
      if (typeof targetSlot === 'number') {
        const targetOwner =
          targetPlayerID ??
          (effect.target === 'ALLY_UNIT' ? playerID : effect.target === 'ENEMY_UNIT' ? opponentID : opponentID);
        const targetSide = G.players[targetOwner];
        const targetUnit = targetSide.battleZone[targetSlot];
        if (targetUnit) {
          targetSide.battleZone[targetSlot] = null;
          targetSide.graveyard.push(targetUnit);
        }
      }
      break;
    }
    case 'BOUNCE_UNIT': {
      if (typeof targetSlot === 'number') {
        const targetOwner =
          targetPlayerID ??
          (effect.target === 'ALLY_UNIT' ? playerID : effect.target === 'ENEMY_UNIT' ? opponentID : opponentID);
        const targetSide = G.players[targetOwner];
        const targetUnit = targetSide.battleZone[targetSlot];
        if (targetUnit) {
          targetSide.battleZone[targetSlot] = null;
          targetUnit.isTapped = false;
          targetUnit.canAttack = false;
          targetSide.hand.push(targetUnit);
        }
      }
      break;
    }
    case 'BUFF_ATK':
    case 'BUFF_UNIT_BP': {
      if (typeof targetSlot === 'number') {
        const targetOwner =
          targetPlayerID ??
          (effect.target === 'ALLY_UNIT' ? playerID : effect.target === 'ENEMY_UNIT' ? opponentID : playerID);
        const targetSide = G.players[targetOwner];
        const unit = targetSide.battleZone[targetSlot];
        if (unit && unit.currentBP !== undefined) {
          unit.currentBP += amount;
        }
      } else if (effect.target === 'SELF') {
        player.battleZone.forEach((unit) => {
          if (unit && unit.currentBP !== undefined) unit.currentBP += amount;
        });
      }
      break;
    }
    case 'UNTAP_UNIT': {
      if (typeof targetSlot === 'number') {
        const targetOwner = targetPlayerID ?? playerID;
        const targetSide = G.players[targetOwner];
        const unit = targetSide.battleZone[targetSlot];
        if (unit) unit.isTapped = false;
      }
      break;
    }
    case 'SEARCH_DECK': {
      const filter = effect.filter;
      if (!filter) break;
      const index = player.deck.findIndex((card) => {
        if (filter.id && card.id !== filter.id) return false;
        if (filter.type && card.type !== filter.type) return false;
        if (filter.keyword && !(card.keywords ?? []).includes(filter.keyword)) return false;
        if (filter.nameIncludes && !card.name.toLowerCase().includes(filter.nameIncludes.toLowerCase())) return false;
        return true;
      });
      if (index >= 0) {
        const [card] = player.deck.splice(index, 1);
        if (card) {
          card.isFaceDown = false;
          player.hand.push(card);
        }
      }
      if (effect.shuffle) {
        player.deck = shuffle(player.deck);
      }
      break;
    }
    case 'ACTIVATE':
    default:
      break;
  }
};
