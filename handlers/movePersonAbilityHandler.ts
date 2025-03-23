/ handlers/movePersonAbilityHandler.ts
import { AbilityContext, AbilityService } from '@/types/abilities';

export const movePersonAbilityHandler = (context: AbilityContext): void => {
  const { stateSetters } = context;
  
  // Check if there are any people on the board to move
  const hasPeopleOnBoard = true; // This would check if any people exist on board
  
  if (!hasPeopleOnBoard) {
    alert('There are no people to move on either side.');
    AbilityService.cancelAbility();
    return;
  }
  
  // Enter person selection mode
  // This would be implemented to set the selection mode
  
  alert("Select a person to move (you can select your own or your opponent's people).");
  
  // The rest happens in UI interaction
  // When complete, AbilityService.completeAbility will be called
};