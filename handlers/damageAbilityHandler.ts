// handlers/damageAbilityHandler.ts

import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const damageAbilityHandler = (context: AbilityContext): void => {
  const { ability, stateSetters } = context;
  
  // Set damage mode to allow player to select a target
  stateSetters.setDamageMode(true);
  stateSetters.setDamageValue(ability.value || 1);
  stateSetters.setDamageSource(context.sourceCard);
  
  // When damage is applied, AbilityService.completeAbility will be called
  // This will be handled in the applyDamage function
};