// actionTypes.ts
import { Card } from './game';

/**
 * Base interface for all game actions
 */
export interface GameAction {
  type: string;
  playerId: 'left' | 'right';
  timestamp?: number;
}

/**
 * Action for playing a card from hand to board
 */
export interface PlayCardAction extends GameAction {
  type: 'PLAY_CARD';
  cardId: string;
  targetSlot: {
    type: 'person' | 'event' | 'camp';
    index: number;
  };
}

/**
 * Action for using a card ability
 */
export interface UseAbilityAction extends GameAction {
  type: 'USE_ABILITY';
  cardId: string;
  abilityIndex: number;
  targetInfo?: {
    playerId: 'left' | 'right';
    targetType: 'person' | 'camp' | 'event';
    targetIndex: number;
  };
}

/**
 * Action for ending a turn
 */
export interface EndTurnAction extends GameAction {
  type: 'END_TURN';
}

/**
 * Action for advancing the phase
 */
export interface AdvancePhaseAction extends GameAction {
  type: 'ADVANCE_PHASE';
}

/**
 * Action for discarding a card
 */
export interface DiscardCardAction extends GameAction {
  type: 'DISCARD_CARD';
  cardId: string;
  useJunkEffect: boolean;
}

/**
 * Action for damaging a card
 */
export interface DamageCardAction extends GameAction {
  type: 'DAMAGE_CARD';
  targetPlayerId: 'left' | 'right';
  targetSlot: {
    type: 'person' | 'camp';
    index: number;
  };
  sourceCardId?: string;
}

/**
 * Action for restoring a card
 */
export interface RestoreCardAction extends GameAction {
  type: 'RESTORE_CARD';
  targetPlayerId: 'left' | 'right';
  targetSlot: {
    type: 'person' | 'camp';
    index: number;
  };
  sourceCardId?: string;
}

// Union type of all possible actions
export type GameActionType = 
  | PlayCardAction
  | UseAbilityAction
  | EndTurnAction
  | AdvancePhaseAction
  | DiscardCardAction
  | DamageCardAction
  | RestoreCardAction;
