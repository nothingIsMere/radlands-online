// handlers/person/sniperDamageAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { createDamageHandler } from '../../src/utils/abilityHandlerUtils';

export const sniperDamageAbilityHandler = (context: AbilityContext): void => {
  const damageValue = context.ability.value || 1;
  createDamageHandler(context, true, false, false, damageValue);
};