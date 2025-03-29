// handlers/raidAbilityHandler.ts
import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../services/abilityService';
import { markEventPlayed, checkZetoKahnEffect } from '../src/utils/gameUtils';

export const raidAbilityHandler = (context: AbilityContext): void => {
  const { player, stateSetters, playerState, opponentState } = context;
  
  console.log("Raid ability handler called for player:", player);
  
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
  const { player, playerState } = context;
  const setPlayerState = player === 'left' ?
    context.stateSetters.setLeftPlayerState :
    context.stateSetters.setRightPlayerState;
  
  console.log("Current raiders location:", playerState.raidersLocation);
  
  // Create Raiders card
  const raidersCard = {
    id: 'raiders',
    name: 'Raiders',
    type: 'event',
    startingQueuePosition: 2,
    owner: player,
  };
  
  // Handle based on current location
  switch (playerState.raidersLocation) {
    case 'default':
      console.log("Raiders in default position, placing in slot 2");
      // Place in slot 2 (index 1) if empty
      if (playerState.eventSlots[1] === null) {
        setPlayerState((prev) => ({
          ...prev,
          eventSlots: [
            prev.eventSlots[0],
            raidersCard,
            prev.eventSlots[2]
          ],
          raidersLocation: 'event2'
        }));
        alert("Raiders card placed in position 2");
      }
      // If slot 2 is occupied, try slot 3 (index 0)
      else if (playerState.eventSlots[0] === null) {
        setPlayerState((prev) => ({
          ...prev,
          eventSlots: [
            raidersCard,
            prev.eventSlots[1],
            prev.eventSlots[2]
          ],
          raidersLocation: 'event3'
        }));
        alert("Raiders card placed in position 3");
      }
      else {
        alert("No valid slot available for Raiders! All slots are occupied.");
      }
      break;
    
    case 'event3':
      console.log("Raiders in position 3, moving to position 2");
      // Move from slot 3 (index 0) to slot 2 (index 1) if empty
      if (playerState.eventSlots[1] === null) {
        setPlayerState((prev) => ({
          ...prev,
          eventSlots: [
            null, // Clear slot 3
            raidersCard,
            prev.eventSlots[2]
          ],
          raidersLocation: 'event2'
        }));
        alert("Raiders advanced from position 3 to position 2");
      } else {
        alert("Cannot advance Raiders from position 3 because position 2 is occupied");
      }
      break;
    
    case 'event2':
      console.log("Raiders in position 2, moving to position 1");
      // Move from slot 2 (index 1) to slot 1 (index 2) if empty
      if (playerState.eventSlots[2] === null) {
        setPlayerState((prev) => ({
          ...prev,
          eventSlots: [
            prev.eventSlots[0],
            null, // Clear slot 2
            raidersCard
          ],
          raidersLocation: 'event1'
        }));
        alert("Raiders advanced from position 2 to position 1");
      } else {
        alert("Cannot advance Raiders from position 2 because position 1 is occupied");
      }
      break;
    
    case 'event1':
      console.log("Raiders in position 1, executing raid");
      // Execute raid from position 1 and reset to default
      setPlayerState((prev) => ({
        ...prev,
        eventSlots: [
          prev.eventSlots[0],
          prev.eventSlots[1],
          null // Clear slot 1
        ],
        raidersLocation: 'default'
      }));
      // Execute the raid
      executeRaid(context);
      break;
    
    default:
      console.error("Unknown raiders location:", playerState.raidersLocation);
      alert("Error: Unknown raiders location");
      break;
  }
};