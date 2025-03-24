// handlers/waterAbilityHandler.ts
import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../services/abilityService';

export const waterAbilityHandler = (context: AbilityContext): void => {
  const { player, ability, stateSetters } = context;
  const waterAmount = ability.value || 1;
  
  const setPlayerState = player === 'left' ? 
    stateSetters.setLeftPlayerState : 
    stateSetters.setRightPlayerState;
  
  setPlayerState((prev) => ({
    ...prev,
    waterCount: prev.waterCount + waterAmount
  }));
  
  alert(`Gained ${waterAmount} water!`);
  
  // Complete the ability immediately since no user interaction is needed
  AbilityService.completeAbility();
};