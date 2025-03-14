// gameUtils.ts
import { PlayerState } from '@/types/game';

/**
 * Helper functions for consistent game state management
 */

/**
 * Marks that a player has played an event this turn
 * @param player The player who played the event ('left' or 'right')
 * @param setLeftPlayedEventThisTurn Function to update left player's event played state
 * @param setRightPlayedEventThisTurn Function to update right player's event played state
 */
export const markEventPlayed = (
  player: 'left' | 'right',
  setLeftPlayedEventThisTurn: (value: boolean) => void,
  setRightPlayedEventThisTurn: (value: boolean) => void
) => {
  if (player === 'left') {
    setLeftPlayedEventThisTurn(true);
  } else {
    setRightPlayedEventThisTurn(true);
  }
};

/**
 * Checks if a player has Zeto Kahn in play and if his trait should activate
 * @param player The player to check ('left' or 'right')
 * @param leftPlayerState The left player's state
 * @param rightPlayerState The right player's state
 * @param leftPlayedEventThisTurn Whether left player has played an event this turn
 * @param rightPlayedEventThisTurn Whether right player has played an event this turn
 * @returns True if Zeto Kahn's trait should trigger
 */
export const checkZetoKahnEffect = (
  player: 'left' | 'right',
  leftPlayerState: PlayerState,
  rightPlayerState: PlayerState,
  leftPlayedEventThisTurn: boolean,
  rightPlayedEventThisTurn: boolean
): boolean => {
  const playerState = player === 'left' ? leftPlayerState : rightPlayerState;
  
  // Check for undamaged Zeto Kahn
  const hasUndamagedZetoKahn = playerState.personSlots.some(
    (slot) => slot?.name === 'Zeto Kahn' && !slot.isDamaged
  );
  
  // Check if this is the first event played this turn
  const isFirstEventThisTurn = player === 'left' ? !leftPlayedEventThisTurn : !rightPlayedEventThisTurn;
  
  // Raiders must be in default position
  const raidersInDefaultPosition = playerState.raidersLocation === 'default';
  
  return hasUndamagedZetoKahn && isFirstEventThisTurn && raidersInDefaultPosition;
};

/**
 * Checks if a card has a specific trait
 * @param card The card to check
 * @param trait The trait to check for
 * @returns True if the card has the specified trait
 */
 export const hasCardTrait = (card: Card | null, trait: string): boolean => {
  if (!card || !card.traits) return false;
  return card.traits.includes(trait);
};

/**
 * Checks if a player has a card with a specific trait in play and active
 * @param playerState The player's state
 * @param trait The trait to check for
 * @param requireUndamaged Whether the card must be undamaged to have an active trait
 * @returns True if the player has an active card with the specified trait
 */
export const hasActiveTraitInPlay = (
  playerState: PlayerState,
  trait: string,
  requireUndamaged: boolean = true
): boolean => {
  return playerState.personSlots.some(card => 
    card && 
    hasCardTrait(card, trait) && 
    (!requireUndamaged || !card.isDamaged)
  );
};

/**
 * Checks if Karli Blaze's trait is active for a player
 * Cards enter play ready with Karli Blaze in play
 * @param playerState The player's state
 * @returns True if Karli Blaze's trait is active
 */
 export const hasKarliBlazeTrait = (playerState: PlayerState): boolean => {
  // Check directly for undamaged Karli Blaze by name, not by trait
  return playerState.personSlots.some(
    slot => slot?.name === 'Karli Blaze' && !slot.isDamaged
  );
};

/**
 * Checks if Argo Yesky's trait is active for a player
 * All cards gain a damage ability with Argo Yesky in play
 * @param playerState The player's state
 * @returns True if Argo Yesky's trait is active
 */
export const hasArgoYeskyTrait = (playerState: PlayerState): boolean => {
  return playerState.personSlots.some(
    slot => slot?.name === 'Argo Yesky' && !slot.isDamaged
  );
};

/**
 * Checks if Vera Vosh's trait is active for a player
 * Cards stay ready after first ability use with Vera Vosh in play
 * @param playerState The player's state
 * @returns True if Vera Vosh's trait is active
 */
export const hasVeraVoshTrait = (playerState: PlayerState): boolean => {
  return playerState.personSlots.some(
    slot => slot?.name === 'Vera Vosh' && !slot.isDamaged
  );
};
