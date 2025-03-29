// handlers/person/mimicAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const mimicAbilityHandler = (context: AbilityContext): void => {
  // Just complete the ability - we'll handle the mimic behavior in PersonSlot
  AbilityService.completeAbility();
};