// handlers/person/sacrificeThenDamageAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { createSacrificeHandler } from '../../src/utils/abilityHandlerUtils';

export const sacrificeThenDamageAbilityHandler = (context: AbilityContext): void => {
  createSacrificeHandler(context, 'damage');
};