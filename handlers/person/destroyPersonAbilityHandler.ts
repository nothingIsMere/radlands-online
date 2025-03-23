// handlers/person/destroyPersonAbilityHandler.ts
import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../services/abilityService';

export const destroyPersonAbilityHandler = (context: AbilityContext): void => {
  const { stateSetters } = context;
  
  // Enter destroy person targeting mode
  stateSetters.setDestroyPersonMode(true);
  
  // Notify the player
  alert(`Select an unprotected enemy person to destroy`);
  
  // The ability will be completed when the user selects a target
  // and the destroyCard function is called
};