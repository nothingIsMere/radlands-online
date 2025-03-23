// handlers/person/damageCampAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const damageCampAbilityHandler = (context: AbilityContext): void => {
  const { stateSetters, sourceCard, ability } = context;
  
  // Enter camp damage targeting mode - only unprotected camps
  stateSetters.setDamageMode(true);
  stateSetters.setDamageSource(sourceCard);
  stateSetters.setDamageValue(ability.value || 1);
  stateSetters.setCampDamageMode(true);
  
  // Notify the player
  alert(`Select an unprotected enemy camp to damage`);
  
  // The ability will be completed when the user selects a target
  // This is handled in the UI component after the damage is applied
};