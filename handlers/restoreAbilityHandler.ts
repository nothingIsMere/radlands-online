// handlers/restoreAbilityHandler.ts
import { AbilityContext } from '../types/abilities';
import { createRestoreHandler } from '../src/utils/abilityHandlerUtils';

export const restoreAbilityHandler = (context: AbilityContext): void => {
  createRestoreHandler(context, false, false);
};