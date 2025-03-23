// handlers/waterAbilityHandler.ts

import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../services/abilityService';

export const waterAbilityHandler = (context: AbilityContext): void => {
  const { ability, player, stateSetters } = context;
  
  // Get the player's state setter
  const setPlayerState = player === 'left' ? stateSetters.setLeftPlayerState : stateSetters.setRightPlayerState;
  
  // Determine how much water to gain
  const waterToGain = ability.value || 1;
  
  // Add water to the player's supply
  setPlayerState(prev => ({
    ...prev,
    waterCount: prev.waterCount + waterToGain
  }));
  
  // Notify the player
  alert(`Gained ${waterToGain} water!`);
  
  // Complete the ability
  AbilityService.completeAbility();
};