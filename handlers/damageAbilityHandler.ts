// handlers/damageAbilityHandler.ts
import { AbilityContext } from '../types/abilities';
import { createDamageHandler } from '../src/utils/abilityHandlerUtils';

export const damageAbilityHandler = (context: AbilityContext): void => {
  // Use the damage handler with standard settings
  const damageValue = context.ability.value || 1;
  createDamageHandler(context, false, false, false, damageValue);
};