import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../services/abilityService';

export const injureAbilityHandler = (context: AbilityContext): void => {
  const { stateSetters } = context;
  
  // Set injure mode to allow player to select a target
  stateSetters.setInjureMode(true);
  
  // When injure is applied, AbilityService.completeAbility will be called
  // This will be handled in the handleInjure function or equivalent
};


