// handlers/person/mutantAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { createTargetingHandler } from '../../src/utils/abilityHandlerUtils';

export const mutantAbilityHandler = (context: AbilityContext): void => {
  createTargetingHandler(
    context,
    (ctx) => {
      ctx.stateSetters.setMutantModalOpen(true);
      ctx.stateSetters.setMutantSourceCard(ctx.sourceCard);
      ctx.stateSetters.setMutantSourceLocation(ctx.sourceLocation);
    },
    true
  );
};