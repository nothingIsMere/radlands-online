// eventUtils.ts
import { Card, PlayerState } from '@/types/game';

/**
 * Helper functions for the event queue system
 */

/**
 * Advances the events in a player's event queue by one position
 * @param playerState The player's current state
 * @returns Updated event slots after advancement
 */
export const advanceEventQueue = (playerState: PlayerState): (Card | null)[] => {
  // Determine if there's an event in slot 1 (index 2) to process
  const eventInSlot1 = playerState.eventSlots[2];
  const processedEvent = eventInSlot1 ? [eventInSlot1] : [];
  
  // Return the new event slots with events advanced
  return [
    null, // Slot 3 becomes empty
    playerState.eventSlots[0], // Slot 3's card moves to Slot 2
    playerState.eventSlots[1], // Slot 2's card moves to Slot 1
  ];
};

/**
 * Checks if an event can be placed in a specific event slot
 * @param eventCard The event card to place
 * @param playerState The player's current state
 * @param slotIndex The index in the event slots (0-2)
 * @returns True if the event can be placed in this slot
 */
export const canPlaceEventInSlot = (
  eventCard: Card,
  playerState: PlayerState,
  slotIndex: number
): boolean => {
  // Convert slot index to slot number (3, 2, 1)
  const slotNumber = 3 - slotIndex;
  
  // Check starting position constraint
  const startPos = eventCard.startingQueuePosition || 3;
  
  // Basic check: slot must be empty and match or exceed start position
  if (playerState.eventSlots[slotIndex] !== null || slotNumber < startPos) {
    return false;
  }
  
  // Check earlier slots if this isn't the earliest valid slot
  if (slotNumber > startPos) {
    for (let i = startPos; i < slotNumber; i++) {
      // Convert back to index (3->0, 2->1, 1->2)
      const earlierSlotIndex = 3 - i;
      if (!playerState.eventSlots[earlierSlotIndex]) {
        // If any earlier valid slot is empty, can't place here
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Places an event card in the first valid slot
 * @param eventCard The event card to place
 * @param playerState The player's current state
 * @returns Object with updated player state and boolean indicating if placement was successful
 */
export const placeEventInFirstValidSlot = (
  eventCard: Card,
  playerState: PlayerState
): { updatedEventSlots: (Card | null)[]; successful: boolean } => {
  // Get the starting position (3, 2, or 1)
  const startPos = eventCard.startingQueuePosition || 3;
  
  // Convert to index (3->0, 2->1, 1->2)
  const startIndex = 3 - startPos;
  
  // Try to place in the first valid slot
  for (let i = startIndex; i < 3; i++) {
    if (playerState.eventSlots[i] === null) {
      const updatedEventSlots = [...playerState.eventSlots];
      updatedEventSlots[i] = eventCard;
      return { updatedEventSlots, successful: true };
    }
  }
  
  // If no valid slots found
  return { updatedEventSlots: playerState.eventSlots, successful: false };
};

/**
 * Processes any event in slot 1 (index 2)
 * @param currentPlayerState The current player's state
 * @param setCurrentPlayerState Function to update player state
 * @param addToDiscardPile Function to add processed events to discard pile
 * @param executeRaidEffect Optional function to execute raid effect for Raiders card
 * @returns Boolean indicating if an event was processed
 */
export const processEvents = (
  currentPlayerState: PlayerState,
  setCurrentPlayerState: (updater: (prevState: PlayerState) => PlayerState) => void,
  addToDiscardPile: (card: Card) => void,
  executeRaidEffect?: (player: 'left' | 'right') => void
): boolean => {
  const eventInSlot1 = currentPlayerState.eventSlots[2];
  
  if (eventInSlot1) {
    // Special handling for Raiders card
    if (eventInSlot1.id === 'raiders' && executeRaidEffect) {
      executeRaidEffect(currentPlayerState.owner as 'left' | 'right');
    } else {
      // Normal event handling - add to discard pile
      addToDiscardPile(eventInSlot1);
    }
    
    // Advance the queue
    setCurrentPlayerState((prev) => ({
      ...prev,
      eventSlots: advanceEventQueue(prev),
    }));
    
    return true; // Event was processed
  }
  
  return false; // No event to process
};
