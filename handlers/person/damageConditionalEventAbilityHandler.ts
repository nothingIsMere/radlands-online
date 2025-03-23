// handlers/person/damageConditionalEventAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const damageConditionalEventAbilityHandler = (context: AbilityContext): void => {
  const { player, stateSetters, sourceCard, ability, playerState, opponentState } = context;
  
  // Check if opponent has any events in queue
  const opponentEventSlots = opponentState.eventSlots;
  const hasEvent = opponentEventSlots.some(event => event !== null);
  
  if (!hasEvent) {
    // If no events, inform the player and cancel the ability
    alert('Opponent has no events in queue! Ability cannot be used.');
    
    // Refund the water cost since the ability couldn't be used
    const setPlayerState = player === 'left' 
      ? stateSetters.setLeftPlayerState 
      : stateSetters.setRightPlayerState;
    
    setPlayerState(prev => ({
      ...prev,
      waterCount: prev.waterCount + ability.cost
    }));
    
    // Complete the ability (failure case)
    AbilityService.completeAbility();
    return;
  }
  
  // If opponent has events, proceed with the damage targeting mode
  stateSetters.setDamageMode(true);
  stateSetters.setDamageSource(sourceCard);
  stateSetters.setDamageValue(ability.value || 1);
  
  // Notify the player
  alert('Opponent has events in queue. Select an unprotected enemy card to damage.');
  
  // The ability will be completed when the player selects a target
  // This is handled in the UI component after the damage is applied
};