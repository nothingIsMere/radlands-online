// handlers/person/sacrificeThenDamageHandler.ts
import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const sacrificeThenDamageAbilityHandler = (context: AbilityContext): void => {
  const { player, stateSetters } = context;
  
  // First step: enter sacrifice mode to select own person to destroy
  stateSetters.setSacrificeMode(true);
  
  // Notify the player
  alert(`Select one of your people to sacrifice`);
  
  // The ability will be completed when the sacrifice and damage are both done
};