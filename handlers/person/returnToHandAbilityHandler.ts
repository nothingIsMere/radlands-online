// handlers/person/returnToHandAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { createCardMovementHandler } from '../../src/utils/abilityHandlerUtils';

export const returnToHandAbilityHandler = (context: AbilityContext): void => {
  createCardMovementHandler(context, 'return_to_hand');
};