// handlers/person/damageCampAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { createDamageHandler } from '../../src/utils/abilityHandlerUtils';

export const damageCampAbilityHandler = (context: AbilityContext): void => {
  // Use the damage handler with camps-only targeting
  const damageValue = context.ability.value || 1;
  createDamageHandler(context, false, true, false, damageValue);
};