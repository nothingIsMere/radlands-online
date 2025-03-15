// abilityUtils.ts
import { Card, PlayerState } from '@/types/game';

/**
 * Helper functions for consistent ability execution
 */

/**
 * Applies damage to a target card
 * @param target The target card to damage
 * @param slotIndex The index of the target card's slot
 * @param isRightPlayer Whether the target belongs to the right player
 * @param setPlayerState Function to update the target player's state
 * @param discardCard Function to discard a card
 * @param damageValue Optional damage value (default: 1)
 * @returns True if the card was destroyed, false if it was just damaged
 */
export const applyDamageToTarget = (
  target: Card,
  slotIndex: number,
  isRightPlayer: boolean,
  setPlayerState: (updater: (prevState: PlayerState) => PlayerState) => void,
  discardCard: (card: Card, slotIndex: number, isRightPlayer: boolean) => void,
  damageValue: number = 1
): boolean => {
  // If target is already damaged or is a punk, destroy it
  if (target.isPunk || target.isDamaged) {
    // For person cards
    if (target.type === 'person') {
      discardCard(target, slotIndex, isRightPlayer);
    } 
    // For camp cards
    else if (target.type === 'camp') {
      setPlayerState((prev) => ({
        ...prev,
        campSlots: prev.campSlots.map((camp, i) => (i === slotIndex ? null : camp)),
      }));
    }
    return true; // Card was destroyed
  } 
  // Otherwise, mark as damaged
  else {
    if (target.type === 'person') {
      setPlayerState((prev) => ({
        ...prev,
        personSlots: prev.personSlots.map((slot, i) =>
          i === slotIndex ? { ...slot, isDamaged: true, isReady: false } : slot
        ),
      }));
    } else if (target.type === 'camp') {
      setPlayerState((prev) => ({
        ...prev,
        campSlots: prev.campSlots.map((slot, i) => 
          i === slotIndex ? { ...slot, isDamaged: true } : slot
        ),
      }));
    }
    return false; // Card was only damaged
  }
};

/**
 * Restores a damaged card
 * @param target The target card to restore
 * @param slotIndex The index of the target card's slot
 * @param isRightPlayer Whether the target belongs to the right player
 * @param setPlayerState Function to update the target player's state
 * @returns True if the card was successfully restored
 */
export const restoreCard = (
  target: Card,
  slotIndex: number,
  isRightPlayer: boolean,
  setPlayerState: (updater: (prevState: PlayerState) => PlayerState) => void
): boolean => {
  if (!target.isDamaged) {
    return false; // Card wasn't damaged, so couldn't be restored
  }

  if (target.type === 'person') {
    setPlayerState((prev) => ({
      ...prev,
      personSlots: prev.personSlots.map((slot, i) =>
        i === slotIndex ? { ...slot, isDamaged: false, isReady: false } : slot
      ),
    }));
  } else if (target.type === 'camp') {
    setPlayerState((prev) => ({
      ...prev,
      campSlots: prev.campSlots.map((slot, i) => 
        i === slotIndex ? { ...slot, isDamaged: false } : slot
      ),
    }));
  }
  
  return true; // Card was restored
};

/**
 * Restores a damaged person card and makes it ready
 * @param target The target person card to restore
 * @param slotIndex The index of the target card's slot
 * @param isRightPlayer Whether the target belongs to the right player
 * @param setPlayerState Function to update the target player's state
 * @returns True if the card was successfully restored
 */
 export const restorePersonAndMakeReady = (
  target: Card,
  slotIndex: number,
  isRightPlayer: boolean,
  setPlayerState: (updater: (prevState: PlayerState) => PlayerState) => void
): boolean => {
  if (!target.isDamaged || target.type !== 'person') {
    return false; // Card wasn't damaged or isn't a person
  }

  setPlayerState((prev) => ({
    ...prev,
    personSlots: prev.personSlots.map((slot, i) =>
      i === slotIndex ? { ...slot, isDamaged: false, isReady: true } : slot
    ),
  }));
  
  return true; // Card was restored and made ready
};

/**
 * Deducts water cost for an ability
 * @param player The current player ('left' or 'right')
 * @param waterCost The water cost to deduct
 * @param leftPlayerState The left player's state
 * @param rightPlayerState The right player's state
 * @param setLeftPlayerState Function to update left player's state
 * @param setRightPlayerState Function to update right player's state
 * @returns True if the cost was successfully paid
 */
export const deductWaterCost = (
  player: 'left' | 'right',
  waterCost: number,
  leftPlayerState: PlayerState,
  rightPlayerState: PlayerState,
  setLeftPlayerState: (updater: (prevState: PlayerState) => PlayerState) => void,
  setRightPlayerState: (updater: (prevState: PlayerState) => PlayerState) => void
): boolean => {
  const playerState = player === 'left' ? leftPlayerState : rightPlayerState;
  const setPlayerState = player === 'left' ? setLeftPlayerState : setRightPlayerState;
  
  // Check if player has enough water
  if (playerState.waterCount < waterCost) {
    return false;
  }
  
  // Deduct water cost
  setPlayerState((prev) => ({
    ...prev,
    waterCount: prev.waterCount - waterCost,
  }));
  
  return true;
};

/**
 * Makes a card not ready after using an ability (unless Vera Vosh prevents it)
 * @param card The card that used the ability
 * @param location The card's location (type and index)
 * @param player The current player ('left' or 'right')
 * @param leftPlayerState The left player's state
 * @param rightPlayerState The right player's state
 * @param setLeftPlayerState Function to update left player's state
 * @param setRightPlayerState Function to update right player's state
 * @param leftCardsUsedAbility Array of left player's cards that used abilities this turn
 * @param rightCardsUsedAbility Array of right player's cards that used abilities this turn
 * @param setLeftCardsUsedAbility Function to update left player's used abilities array
 * @param setRightCardsUsedAbility Function to update right player's used abilities array
 * @param hasVeraVoshActive Whether Vera Vosh's trait is active
 */
export const markCardUsedAbility = (
  card: Card,
  location: { type: 'person' | 'camp'; index: number },
  player: 'left' | 'right',
  leftPlayerState: PlayerState,
  rightPlayerState: PlayerState,
  setLeftPlayerState: (updater: (prevState: PlayerState) => PlayerState) => void,
  setRightPlayerState: (updater: (prevState: PlayerState) => PlayerState) => void,
  leftCardsUsedAbility: string[],
  rightCardsUsedAbility: string[],
  setLeftCardsUsedAbility: (updater: (prev: string[]) => string[]) => void,
  setRightCardsUsedAbility: (updater: (prev: string[]) => string[]) => void,
  hasVeraVoshActive: boolean
) => {
  const playerState = player === 'left' ? leftPlayerState : rightPlayerState;
  const setPlayerState = player === 'left' ? setLeftPlayerState : setRightPlayerState;
  const cardsUsedAbility = player === 'left' ? leftCardsUsedAbility : rightCardsUsedAbility;
  const setCardsUsedAbility = player === 'left' ? setLeftCardsUsedAbility : setRightCardsUsedAbility;
  
  // Check if this card has already used an ability this turn
  const hasCardUsedAbility = cardsUsedAbility.includes(card.id);
  
  if (hasVeraVoshActive && !hasCardUsedAbility) {
    // First ability use with Vera Vosh active - card stays ready
    console.log(`${card.name} stays ready due to Vera Vosh's effect`);
    
    // Add card to list of cards that used abilities this turn
    setCardsUsedAbility([...cardsUsedAbility, card.id]);
  } else {
    // Normal case - mark card as not ready
    if (location.type === 'person') {
      setPlayerState((prev) => ({
        ...prev,
        personSlots: prev.personSlots.map((slot, idx) =>
          idx === location.index ? { ...slot, isReady: false } : slot
        ),
      }));
    }
    // If we later add camp abilities, we'd handle that here
  }

  // If it's a camp card that used an ability
    if (location.type === 'camp') {
  // Add camp to list of cards that used abilities this turn
  setCardsUsedAbility([...cardsUsedAbility, card.id]);
  
  // Note: Camp cards don't have a "ready" state, so we don't need to mark them as not ready
  // But we do track that they used an ability this turn
}
};
