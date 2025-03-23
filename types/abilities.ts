// types/abilities.ts

import { Card, PlayerState, GameTurnState } from '@/types/game';

export type AbilityType = 'water' | 'damage' | 'restore' | 'draw';
// We'll add more types later as we implement them

export interface Ability {
  type: AbilityType;
  cost: number;
  value?: number;
  effect?: string; // Human-readable description
}

export interface StateSetters {
  setLeftPlayerState: (updater: (prev: PlayerState) => PlayerState) => void;
  setRightPlayerState: (updater: (prev: PlayerState) => PlayerState) => void;
  setDamageMode: (active: boolean) => void;
  setDamageValue: (value: number) => void;
  setDamageSource: (source: Card | null) => void;
  setDrawDeck: (updater: (prev: Card[]) => Card[]) => void;
  setRestoreMode: (active: boolean) => void;
  setRestorePlayer: (player: 'left' | 'right' | null) => void;
  setRestoreSourceIndex: (index: number | undefined) => void;
}

export interface AbilityContext {
  sourceCard: Card;
  sourceLocation: { type: 'person' | 'camp'; index: number };
  player: 'left' | 'right';
  ability: Ability;
  gameState: GameTurnState;
  playerState: PlayerState;
  opponentState: PlayerState;
  stateSetters: StateSetters;
}