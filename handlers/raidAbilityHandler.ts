// handlers/raidAbilityHandler.ts
import { AbilityContext, AbilityService } from '@/types/abilities';
import { checkZetoKahnEffect } from '@/utils/gameUtils';

export const raidAbilityHandler = (context: AbilityContext): void => {
  const { player, playerState, stateSetters, opponentState } = context;
  
  // Mark that an event is being played
  if (player === 'left') {
    // Set left player event played flag
  } else {
    // Set right player event played flag
  }
  
  // Check for Zeto Kahn's immediate effect
  const leftPlayedEventThisTurn = false; // This would come from game state
  const rightPlayedEventThisTurn = false; // This would come from game state
  
  const shouldExecuteImmediately = checkZetoKahnEffect(
    player,
    { ...context.playerState, playedEventThisTurn: player === 'left' ? leftPlayedEventThisTurn : rightPlayedEventThisTurn },
    { ...context.opponentState, playedEventThisTurn: player !== 'left' ? leftPlayedEventThisTurn : rightPlayedEventThisTurn }
  );
  
  if (shouldExecuteImmediately) {
    // Execute raid immediately
    executeRaid(context);
    return;
  }
  
  // Normal Raiders movement logic
  handleRaidersMovement(context);
};

// Helper function to handle Raiders movement
const handleRaidersMovement = (context: AbilityContext): void => {
  const { player, playerState, stateSetters } = context;
  const setPlayerState = player === 'left' ? stateSetters.setLeftPlayerState : stateSetters.setRightPlayerState;
  
  switch (playerState.raidersLocation) {
    case 'default':
      // Create Raiders card
      const raidersCard = {
        id: 'raiders',
        name: 'Raiders',
        type: 'event',
        startingQueuePosition: 2,
        owner: player
      };
      
      // Simple logic to manually place Raiders in the right slot
      // First try slot 2 (index 1)
      if (playerState.eventSlots[1] === null) {
        // Slot 2 is available, place Raiders there
        setPlayerState(prev => ({
          ...prev,
          eventSlots: [prev.eventSlots[0], raidersCard, prev.eventSlots[2]],
          raidersLocation: 'event2'
        }));
      }
      // If slot 2 is occupied, try slot 3 (index 0)
      else if (playerState.eventSlots[0] === null) {
        // Slot 3 is available, place Raiders there
        setPlayerState(prev => ({
          ...prev,
          eventSlots: [raidersCard, prev.eventSlots[1], prev.eventSlots[2]],
          raidersLocation: 'event3'
        }));
      }
      // If both slots are occupied
      else {
        alert('No valid slot available for Raiders!');
      }
      break;
      
    case 'event2':
      // Move to slot 1 if empty
      if (!playerState.eventSlots[2]) {
        setPlayerState(prev => ({
          ...prev,
          eventSlots: [
            prev.eventSlots[0],
            null, // Clear slot 2
            { id: 'raiders', name: 'Raiders', type: 'event', startingQueuePosition: 1 }
          ],
          raidersLocation: 'event1'
        }));
      } else {
        alert('Event slot 1 occupied - cannot advance');
      }
      break;
      
    case 'event1':
      // Execute raid from slot 1
      executeRaid(context);
      break;
      
    case 'event3':
      // Move from slot 3 to slot 2 if empty
      if (!playerState.eventSlots[1]) {
        setPlayerState(prev => ({
          ...prev,
          eventSlots: [
            null, // Clear slot 3
            { id: 'raiders', name: 'Raiders', type: 'event', startingQueuePosition: 2 },
            prev.eventSlots[2]
          ],
          raidersLocation: 'event2'
        }));
      } else {
        alert('Event slot 2 is occupied. Raiders cannot advance.');
      }
      break;
  }
  
  // Complete the ability
  AbilityService.completeAbility();
};

// Helper function to execute a raid
const executeRaid = (context: AbilityContext): void => {
  const { player, stateSetters } = context;
  const setPlayerState = player === 'left' ? stateSetters.setLeftPlayerState : stateSetters.setRightPlayerState;
  const opponentPlayer = player === 'left' ? 'right' : 'left';
  
  // Reset Raiders position
  setPlayerState(prev => ({
    ...prev,
    raidersLocation: 'default'
  }));
  
  // Set up raid mode
  // This would be implemented to enter camp raid mode and set the raiding player
  
  // Message to guide the opponent
  alert(`${opponentPlayer.toUpperCase()} PLAYER: Choose a camp to damage from the raid!`);
  
  // Complete the ability - the rest happens in the UI interaction
  AbilityService.completeAbility();
};