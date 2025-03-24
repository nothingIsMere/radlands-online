// handlers/person/damageColumnAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { createTargetingHandler } from '../../src/utils/abilityHandlerUtils';

export const damageColumnAbilityHandler = (context: AbilityContext): void => {
  createTargetingHandler(
    context,
    (ctx) => {
      ctx.stateSetters.setDamageColumnMode(true);
      alert(`Select an enemy column to damage all cards in it`);
    },
    true
  );
};