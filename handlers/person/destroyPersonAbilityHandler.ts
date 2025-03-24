// handlers/person/destroyPersonAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { createDestroyHandler } from '../../src/utils/abilityHandlerUtils';

export const destroyPersonAbilityHandler = (context: AbilityContext): void => {
  createDestroyHandler(context, 'person', false);
};