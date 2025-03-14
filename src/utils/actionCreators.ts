// actionCreators.ts
import { 
  GameAction,
  PlayCardAction,
  UseAbilityAction,
  EndTurnAction,
  AdvancePhaseAction,
  DiscardCardAction,
  DamageCardAction,
  RestoreCardAction
} from '@/types/actionTypes';

/**
 * Creates a play card action
 */
export const createPlayCardAction = (
  playerId: 'left' | 'right',
  cardId: string,
  targetSlot: { type: 'person' | 'event' | 'camp'; index: number }
): PlayCardAction => ({
  type: 'PLAY_CARD',
  playerId,
  cardId,
  targetSlot,
  timestamp: Date.now()
});

/**
 * Creates a use ability action
 */
export const createUseAbilityAction = (
  playerId: 'left' | 'right',
  cardId: string,
  abilityIndex: number,
  targetInfo?: {
    playerId: 'left' | 'right';
    targetType: 'person' | 'camp' | 'event';
    targetIndex: number;
  }
): UseAbilityAction => ({
  type: 'USE_ABILITY',
  playerId,
  cardId,
  abilityIndex,
  targetInfo,
  timestamp: Date.now()
});

/**
 * Creates an end turn action
 */
export const createEndTurnAction = (
  playerId: 'left' | 'right'
): EndTurnAction => ({
  type: 'END_TURN',
  playerId,
  timestamp: Date.now()
});

/**
 * Creates an advance phase action
 */
export const createAdvancePhaseAction = (
  playerId: 'left' | 'right'
): AdvancePhaseAction => ({
  type: 'ADVANCE_PHASE',
  playerId,
  timestamp: Date.now()
});

/**
 * Creates a discard card action
 */
export const createDiscardCardAction = (
  playerId: 'left' | 'right',
  cardId: string,
  useJunkEffect: boolean
): DiscardCardAction => ({
  type: 'DISCARD_CARD',
  playerId,
  cardId,
  useJunkEffect,
  timestamp: Date.now()
});

/**
 * Creates a damage card action
 */
export const createDamageCardAction = (
  playerId: 'left' | 'right',
  targetPlayerId: 'left' | 'right',
  targetSlot: { type: 'person' | 'camp'; index: number },
  sourceCardId?: string
): DamageCardAction => ({
  type: 'DAMAGE_CARD',
  playerId,
  targetPlayerId,
  targetSlot,
  sourceCardId,
  timestamp: Date.now()
});

/**
 * Creates a restore card action
 */
export const createRestoreCardAction = (
  playerId: 'left' | 'right',
  targetPlayerId: 'left' | 'right',
  targetSlot: { type: 'person' | 'camp'; index: number },
  sourceCardId?: string
): RestoreCardAction => ({
  type: 'RESTORE_CARD',
  playerId,
  targetPlayerId,
  targetSlot,
  sourceCardId,
  timestamp: Date.now()
});
