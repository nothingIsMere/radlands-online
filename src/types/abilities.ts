// types/abilities.ts
import { Card, PlayerState, GameTurnState } from '@/types/game';
import { AbilityType } from './abilityTypes';

// Define the base Ability interface
export interface Ability {
  type: AbilityType;
  cost: number;
  value?: number;
  effect?: string; // Human-readable description
  costModifier?: 'destroyed_camps' | 'punks_owned';
  secondaryEffect?: {
    condition: string;
    type: string;
    value?: number;
  };
  target?: 'any' | 'own_any' | 'enemy_person' | 'enemy_camp' | 'any_protected';
}

// Define the state setters interface with all the setters needed by ability handlers
export interface StateSetters {
  setLeftPlayerState: (updater: (prev: PlayerState) => PlayerState) => void;
  setRightPlayerState: (updater: (prev: PlayerState) => PlayerState) => void;
  setDamageMode: (active: boolean) => void;
  setDamageValue: (value: number) => void;
  setDamageSource: (source: Card | null) => void;
  setDrawDeck: (updater: (prev: Card[]) => Card[]) => void;
  setDiscardPile: (updater: (prev: Card[]) => Card[]) => void;
  setRestoreMode: (active: boolean) => void;
  setRestorePlayer: (player: 'left' | 'right' | null) => void;
  setRestoreSourceIndex: (index: number | undefined) => void;
  setInjureMode: (active: boolean) => void;
  setSniperMode: (active: boolean) => void;
  setCampDamageMode: (active: boolean) => void;
  setDamageColumnMode: (active: boolean) => void;
  setDestroyPersonMode: (active: boolean) => void;
  setDestroyCampMode: (active: boolean) => void;
  setReturnToHandMode: (active: boolean) => void;
  setMultiRestoreMode: (active: boolean) => void;
  setMutantModalOpen: (open: boolean) => void;
  setMutantSourceCard: (card: Card | null) => void;
  setMutantSourceLocation: (location: { type: 'person' | 'camp'; index: number } | null) => void;
  setMutantPendingAction: (action: 'both' | 'damage_only' | 'restore_only' | 'after_both' | null) => void;
  setSacrificeMode: (active: boolean) => void;
  setSacrificePendingDamage: (pending: boolean) => void;
  setPunkCardToPlace: (card: Card | null) => void;
  setPunkPlacementMode: (active: boolean) => void;
  setDiscardSelectionCount: (count: number) => void;
  setDiscardSelectionActive: (active: boolean) => void;
  setCampRaidMode: (active: boolean) => void;
  setRaidingPlayer: (player: 'left' | 'right' | null) => void;
  setRaidMessage: (message: string) => void;
  setLeftPlayedEventThisTurn: (played: boolean) => void;
  setRightPlayedEventThisTurn: (played: boolean) => void;
  setScientistCards: (cards: Card[]) => void;
  setIsScientistModalOpen: (open: boolean) => void;
  setVanguardPendingCounter: (pending: boolean) => void;
  setVanguardCounterActive: (active: boolean) => void;
  setVanguardOriginalPlayer: (player: 'left' | 'right' | null) => void;
  setAnyCardDamageMode: (active: boolean) => void;
  setOpponentChoiceDamageMode: (active: boolean) => void;
  setOpponentChoiceDamageSource: (source: Card | null) => void;
  setOpponentChoiceDamageValue: (value: number) => void;
  setRestorePersonReadyMode: (active: boolean) => void;
  setRestoreSource: (source: Card | null) => void;
  setShowRestoreDoneButton: (show: boolean) => void;
  setSacrificeEffect: (effect: 'draw' | 'water' | 'restore' | null) => void;
  setSacrificeSource: (source: Card | null) => void;
  
}

// Define the context that will be passed to ability handlers
export interface AbilityContext {
  sourceCard: Card;
  sourceLocation: { type: 'person' | 'camp'; index: number };
  player: 'left' | 'right';
  ability: Ability;
  gameState: GameTurnState;
  playerState: PlayerState;
  opponentState: PlayerState;
  stateSetters: StateSetters;
  drawDeck: Card[];
  
}