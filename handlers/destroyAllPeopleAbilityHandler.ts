// handlers/destroyAllPeopleAbilityHandler.ts
import { AbilityContext, AbilityService } from '@/types/abilities';

export const destroyAllPeopleAbilityHandler = (context: AbilityContext): void => {
  const { sourceLocation, stateSetters, leftPlayerState, rightPlayerState } = context;
  
  // Show confirmation dialog
  const confirmDestruction = window.confirm(
    'Are you sure you want to activate the Reactor? This will destroy the Reactor and ALL people on both sides.'
  );
  
  if (!confirmDestruction) {
    AbilityService.cancelAbility();
    return;
  }
  
  // Process left player's people
  for (let i = 0; i < leftPlayerState.personSlots.length; i++) {
    const person = leftPlayerState.personSlots[i];
    if (person) {
      // Destroy person
      // This would be implemented to handle destroying person cards
    }
  }
  
  // Process right player's people
  for (let i = 0; i < rightPlayerState.personSlots.length; i++) {
    const person = rightPlayerState.personSlots[i];
    if (person) {
      // Destroy person
      // This would be implemented to handle destroying person cards
    }
  }
  
  // Clear all person slots
  stateSetters.setLeftPlayerState(prev => ({
    ...prev,
    personSlots: [null, null, null, null, null, null]
  }));
  
  stateSetters.setRightPlayerState(prev => ({
    ...prev,
    personSlots: [null, null, null, null, null, null]
  }));
  
  // Finally, destroy the Reactor itself
  // This would be implemented to destroy the camp
  
  alert('Nuclear meltdown! The Reactor and all people have been destroyed.');
  
  // Complete the ability
  AbilityService.completeAbility();
};