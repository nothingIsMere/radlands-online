// handlers/person/damageColumnAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const damageColumnAbilityHandler = (context: AbilityContext): void => {
  const { stateSetters, sourceCard } = context;
  
  // Enter column damage targeting mode
  stateSetters.setDamageColumnMode(true);
  stateSetters.setDamageSource(sourceCard);
  stateSetters.setDamageValue(1); // Typically 1 damage per target in the column
  
  // Notify the player
  alert(`Select an enemy column to damage all cards in it`);
  
  // The ability will be completed when the user selects a column
  // This is handled in the UI component after the damage is applied to all cards in the selected column
};