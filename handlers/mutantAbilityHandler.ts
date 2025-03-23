// handlers/mutantAbilityHandler.ts
import { AbilityContext, AbilityService } from '@/types/abilities';

export const mutantAbilityHandler = (context: AbilityContext): void => {
  const { stateSetters, sourceCard, sourceLocation } = context;
  
  // Open a special modal for choosing Mutant options
  stateSetters.setMutantModalOpen(true);
  stateSetters.setMutantSourceCard(sourceCard);
  stateSetters.setMutantSourceLocation(sourceLocation);
  
  // The rest of the ability processing happens when the user makes choices in the modal
  // When complete, AbilityService.completeAbility will be called
};