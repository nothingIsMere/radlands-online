// handlers/person/sniperDamageAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const sniperDamageAbilityHandler = (context: AbilityContext): void => {
  const { stateSetters, sourceCard, ability } = context;
  
  // Enter special sniper damage targeting mode that ignores protection
  stateSetters.setDamageMode(true);
  stateSetters.setDamageSource(sourceCard);
  stateSetters.setDamageValue(ability.value || 1);
  stateSetters.setSniperMode(true); // This is the key difference - ignores protection
  
  // Notify the player
  alert(`Select any enemy card to damage (protection is ignored)`);
  
  // The ability will be completed when the user selects a target
  // This is handled in the UI component after the damage is applied
};