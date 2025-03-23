// handlers/person/returnToHandHandler.ts
import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const returnToHandAbilityHandler = (context: AbilityContext): void => {
  const { player, stateSetters } = context;
  
  // Enter return to hand mode
  stateSetters.setReturnToHandMode(true);
  
  // Notify the player
  alert(`Select one of your people to return to your hand`);
  
  // The ability will be completed when the user selects a target
};