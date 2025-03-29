// handlers/person/mimicAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const mimicAbilityHandler = (context: AbilityContext): void => {
  console.log("Mimic ability handler called");
  
  // Just complete the ability - we'll handle mimic behavior in PersonSlot
  window.inMimicMode = true;
  
  // Don't call setPendingAbility
  // AbilityService.setPendingAbility(true);
  
  alert("Select a card to mimic: either your own ready person or any undamaged enemy person");
};