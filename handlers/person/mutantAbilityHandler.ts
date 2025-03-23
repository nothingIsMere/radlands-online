// handlers/person/mutantAbilityHandler.ts
import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const mutantAbilityHandler = (context: AbilityContext): void => {
  const { stateSetters, sourceCard, sourceLocation } = context;
  
  // Open the mutant modal for choosing options
  stateSetters.setMutantModalOpen(true);
  stateSetters.setMutantSourceCard(sourceCard);
  stateSetters.setMutantSourceLocation(sourceLocation);
  
  // The ability will be completed after the user makes their choice and the effects are applied
};