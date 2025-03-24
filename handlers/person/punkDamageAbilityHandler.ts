// handlers/person/punkDamageAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { createDamageHandler } from '../../src/utils/abilityHandlerUtils';
import { AbilityService } from '../../services/abilityService';

export const punkDamageAbilityHandler = (context: AbilityContext): void => {
  const { player, playerState } = context;
  
  // Check if player has a punk in play
  const hasPunk = playerState.personSlots.some(card => card && card.isPunk);
  
  if (hasPunk) {
    // Allow damage if player has a punk
    const damageValue = 1;
    createDamageHandler(context, false, false, false, damageValue);
  } else {
    alert('You need a punk in play to use this ability!');
    AbilityService.completeAbility();
  }
};