// handlers/person/punkDamageAbilityHandler.ts
import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const punkDamageAbilityHandler = (context: AbilityContext): void => {
  const { player, playerState, stateSetters, sourceCard } = context;
  
  // Check if player has a punk in play
  const hasPunk = playerState.personSlots.some(card => card && card.isPunk);
  
  if (hasPunk) {
    // Enter damage targeting mode
    stateSetters.setDamageMode(true);
    stateSetters.setDamageSource(sourceCard);
    stateSetters.setDamageValue(1);
    
    // Notify the player
    alert(`Select an unprotected enemy card to damage`);
    
    // The ability will be completed when the user selects a target
    // This is typically handled in the UI component after the damage is applied
  } else {
    // If no punk in play, don't allow the ability
    alert('You need a punk in play to use this ability!');
    
    // Refund the water cost since the ability cannot be used
    stateSetters.setPlayerState(prev => ({
      ...prev,
      waterCount: prev.waterCount + context.ability.cost
    }));
    
    // Complete the ability (failure case)
    AbilityService.completeAbility();
  }
};