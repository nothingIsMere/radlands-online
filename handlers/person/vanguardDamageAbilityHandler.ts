// handlers/person/vanguardDamageAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { createTargetingHandler } from '../../src/utils/abilityHandlerUtils';

export const vanguardDamageAbilityHandler = (context: AbilityContext): void => {
  createTargetingHandler(
    context,
    (ctx) => {
      // First set up regular damage targeting
      ctx.stateSetters.setDamageMode(true);
      ctx.stateSetters.setDamageSource(ctx.sourceCard);
      ctx.stateSetters.setDamageValue(1);
      
      // Also set flag that counter-damage will be needed
      ctx.stateSetters.setVanguardPendingCounter(true);
      ctx.stateSetters.setVanguardOriginalPlayer(ctx.player);
      
      alert(`Select an unprotected enemy card to damage. Opponent will get to counter-damage afterward.`);
    },
    true
  );
};