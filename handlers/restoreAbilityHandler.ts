// handlers/restoreAbilityHandler.ts
import { AbilityContext, AbilityService } from '@/types/abilities';

export const restoreAbilityHandler = (context: AbilityContext): void => {
  const { player, stateSetters, sourceLocation } = context;
  
  // Store the source camp location for the "cannot_self_restore" check
  if (sourceLocation.type === 'camp') {
    stateSetters.setRestoreSourceIndex(sourceLocation.index);
  }
  
  // Set restore mode to allow player to select a target
  stateSetters.setRestoreMode(true);
  stateSetters.setRestorePlayer(player);
  
  // When restoration is applied, AbilityService.completeAbility will be called
  // This will be handled in the applyRestore function
};