// handlers/person/mimicAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const mimicAbilityHandler = (context: AbilityContext): void => {
  const { ability } = context;
  
  console.log("Mimic ability handler called");
  
  // Just complete the ability right away - the actual mimicking logic 
  // is already handled in PersonSlot.tsx
  AbilityService.completeAbility();
};
