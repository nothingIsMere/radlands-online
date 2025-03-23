// handlers/vanguardDamageAbilityHandler.ts
import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const vanguardDamageAbilityHandler = (context: AbilityContext): void => {
  const { stateSetters, sourceCard } = context;
  
  // Enter damage targeting mode
  stateSetters.setDamageMode(true);
  stateSetters.setDamageSource(sourceCard);
  stateSetters.setDamageValue(1);
  stateSetters.setVanguardPendingCounter(true); // Flag to indicate counter-damage is pending
  
  // Notify the player
  alert(`Select an unprotected enemy card to damage. Your opponent will then damage one of your cards.`);
  
  // The ability will be completed after both players have selected their targets
  // This is typically handled in the UI component after both damages are applied
};