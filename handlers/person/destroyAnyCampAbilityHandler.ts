// handlers/person/destroyAnyCampAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const destroyAnyCampAbilityHandler = (context: AbilityContext): void => {
  const { stateSetters } = context;
  
  const { setDestroyCampMode } = stateSetters;
  
  // Enable destroy camp mode - this will allow targeting any enemy camp
  // regardless of protection status
  setDestroyCampMode(true);
  
  // Show instruction to player
  alert(`Select any enemy camp to destroy`);
  
  // Mark the ability as pending - will be completed when selection is done
  AbilityService.setPendingAbility(true);
};