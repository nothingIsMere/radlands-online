// handlers/person/damageConditionalEventAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { createDamageHandler } from '../../src/utils/abilityHandlerUtils';
import { AbilityService } from '../../services/abilityService';

export const damageConditionalEventAbilityHandler = (context: AbilityContext): void => {
  const { player, opponentState } = context;
  const opponentPlayer = player === 'left' ? 'right' : 'left';
  
  // Check if opponent has any events in queue
  const hasEvent = opponentState.eventSlots.some(event => event !== null);
  
  if (hasEvent) {
    const damageValue = context.ability.value || 1;
    createDamageHandler(context, false, false, false, damageValue);
  } else {
    alert('Opponent has no events in queue! Ability cannot be used.');
    AbilityService.completeAbility();
  }
};