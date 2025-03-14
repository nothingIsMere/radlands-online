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
