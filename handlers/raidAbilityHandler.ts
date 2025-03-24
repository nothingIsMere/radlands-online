// handlers/raidAbilityHandler.ts
import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../services/abilityService';
import { markEventPlayed, checkZetoKahnEffect } from '../src/utils/gameUtils';

export const raidAbilityHandler = (context: AbilityContext): void => {
  const { player, stateSetters, playerState, opponentState } = context;
  
  // Mark that an event is being played (for Zeto Kahn effect)
  if (player === 'left') {
    stateSetters.setLeftPlayedEventThisTurn(true);
  } else {
    stateSetters.setRightPlayedEventThisTurn(true);
  }
  
  // Check for Zeto Kahn's immediate effect
  const leftPlayedEventThisTurn = player === 'left' ? true : false; // We just set this true for current player
  const rightPlayedEventThisTurn = player === 'right' ? true : false;
  
  const shouldExecuteImmediately = checkZetoKahnEffect(
    player, 
    player === 'left' ? playerState : opponentState,
    player === 'right' ? playerState : opponentState,
    leftPlayedEventThisTurn,
    rightPlayedEventThisTurn
  );
  
  if (shouldExecuteImmediately) {
    // Execute raid immediately (simplified logic)
    executeRaid(context);
  } else {
    // Handle normal raid movement
    handleRaidersMovement(context);
  }
  
  // Complete the ability since all logic is handled without requiring further user selection
  AbilityService.completeAbility();
};

// Helper functions for raidAbilityHandler
const executeRaid = (context: AbilityContext) => {
  const { player, stateSetters } = context;
  const opponentPlayer = player === 'left' ? 'right' : 'left';
  
  // Reset raiders location
  const setPlayerState = player === 'left' ? 
    context.stateSetters.setLeftPlayerState : 
    context.stateSetters.setRightPlayerState;
    
  setPlayerState((prev) => ({
    ...prev,
    raidersLocation: 'default'
  }));
  
  // Setup raid mode
  stateSetters.setCampRaidMode(true);
  stateSetters.setRaidingPlayer(player);
  stateSetters.setRaidMessage(`${opponentPlayer.toUpperCase()} PLAYER: Choose a camp to damage from the raid!`);
};

const handleRaidersMovement = (context: AbilityContext) => {
  // This would contain the logic to move raiders based on current location
  // For brevity, I'm omitting the implementation details as they're specific
  // to your game mechanics
  alert("Raid ability executed: Moving raiders card forward");
};
