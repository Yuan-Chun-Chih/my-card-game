export type PlayerID = string;

export type CardType = 'UNIT' | 'SPELL' | 'SPELL_INSTANT' | 'TERRITORY';

export type EffectAction =
  | 'DRAW'
  | 'DAMAGE_PLAYER'
  | 'HEAL_PLAYER'
  | 'DESTROY_UNIT'
  | 'BUFF_UNIT_BP'
  | 'UNTAP_UNIT'
  | 'DAMAGE_ENEMY'
  | 'BUFF_ATK'
  | 'ACTIVATE'
  | 'SEARCH_DECK'
  | 'BOUNCE_UNIT';

export type EffectTrigger = 'ENTER' | 'ACTIVATE';

export interface EffectFilter {
  type?: CardType;
  id?: string;
  nameIncludes?: string;
  keyword?: string;
}

export type EffectTarget =
  | 'NONE'
  | 'SELF'
  | 'OPPONENT'
  | 'ALLY_UNIT'
  | 'ENEMY_UNIT'
  | 'ANY_UNIT';

export interface EffectDef {
  action: EffectAction;
  amount?: number;
  value?: number;
  target?: EffectTarget;
  trigger?: EffectTrigger;
  filter?: EffectFilter;
  shuffle?: boolean;
}

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  bp?: number;
  keywords?: string[];
  description: string;
  image: string;
  effects?: EffectDef[];
}

export interface CardInstance extends CardDef {
  instanceId: string;
  ownerID: PlayerID;
  currentBP?: number;
  isTapped: boolean;
  isFaceDown: boolean;
  canAttack: boolean;
}

export interface PlayerState {
  id: PlayerID;
  lifeZone: CardInstance[];
  hand: CardInstance[];
  deck: CardInstance[];
  energyZone: CardInstance[];
  battleZone: (CardInstance | null)[];
  graveyard: CardInstance[];
  hasPlayedEnergy: boolean;
}

export type ZoneType =
  | 'HAND'
  | 'DECK'
  | 'LIFE'
  | 'ENERGY'
  | 'BATTLE'
  | 'GRAVEYARD'
  | 'SHARED';

export interface TargetRef {
  zone: ZoneType;
  index: number;
  playerID?: PlayerID;
}

export interface CombatState {
  attackerPlayerID: PlayerID;
  attackerIndex: number;
  blockerIndex?: number;
}

export interface PendingEffect {
  source: 'SPELL' | 'UNIT_EFFECT';
  playerID: PlayerID;
  card: CardInstance;
  effects: EffectDef[];
  targetSlot?: number;
  targetPlayerID?: PlayerID;
}

export interface PendingAttack {
  attackerPlayerID: PlayerID;
  attackerIndex: number;
}

export interface GameState {
  players: Record<PlayerID, PlayerState>;
  territoryDecks: Record<PlayerID, CardInstance[]>;
  activeTerritory: CardInstance | null;
  turnCount: number;
  era: number;
  combatState: CombatState | null;
  pendingEffect: PendingEffect | null;
  pendingAttack: PendingAttack | null;
}

export interface MoveContext {
  G: GameState;
  ctx: any;
  events?: any;
  playerID: PlayerID;
}
