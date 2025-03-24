// handlers/person/mimicAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { createTargetingHandler } from '../../src/utils/abilityHandlerUtils';

export const mimicAbilityHandler = (context: AbilityContext): void => {
  createTargetingHandler(
    context,
    (ctx) => {
      ctx.stateSetters.setMimicMode(true);
      ctx.stateSetters.setMimicSourceCard(ctx.sourceCard);
      ctx.stateSetters.setMimicSourceLocation(ctx.sourceLocation);
      
      alert(`Select one of your ready person cards or an undamaged enemy person card to mimic its ability`);
    },
    true
  );
};
