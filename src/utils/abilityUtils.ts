// abilityUtils.ts
import { Card, PlayerState } from '@/types/game';

/**
 * Helper functions for consistent ability execution
 */

/**
 * Handles the draw then discard pattern
 * @param drawCount Number of cards to draw
 * @param discardCount Number of cards to discard
 * @param drawDeck Current draw deck
 * @param setDrawDeck Function to update draw deck
 * @param currentPlayer Current player ('left' or 'right')
 * @param leftPlayerState Left player state
 * @param rightPlayerState Right player state
 * @param setLeftPlayerState Function to update left player state
 * @param setRightPlayerState Function to update right player state
 * @param setDiscardPile Function to update discard pile
 * @param onComplete Callback to run when process is complete
 */
export const handleDrawThenDiscard = (
  drawCount: number,
  discardCount: number,
  drawDeck: Card[],
  setDrawDeck: (updater: (prevDeck: Card[]) => Card[]) => void,
  currentPlayer: 'left' | 'right',
  leftPlayerState: PlayerState,
  rightPlayerState: PlayerState,
  setLeftPlayerState: (updater: (prevState: PlayerState) => PlayerState) => void,
  setRightPlayerState: (updater: (prevState: PlayerState) => PlayerState) => void,
  setDiscardPile: (updater: (prevPile: Card[]) => Card[]) => void,
  setSupplyDepotDrawnCards: (cards: Card[]) => void,
  setSupplyDepotDiscardMode: (active: boolean) => void
): boolean => {
  // Check if there are enough cards in the draw deck
  if (drawDeck.length < drawCount) {
    alert(`Not enough cards in the draw deck. Needed ${drawCount}, but only ${drawDeck.length} available.`);
    return false; // Indicate failure
  }
  
  // Draw cards from the top of the deck
  const drawnCards = drawDeck.slice(-drawCount);
  
  // Save these cards for the discard selection
  setSupplyDepotDrawnCards(drawnCards);
  
  // Remove the cards from the draw deck
  setDrawDeck(prev => prev.slice(0, prev.length - drawCount));
  
  // Enter discard mode
  setSupplyDepotDiscardMode(true);
  
  // Show a message
  alert(`Drew ${drawCount} cards. Now select ${discardCount} card(s) to discard.`);
  
  return true; // Indicate success
};

/**
 * Initiates the sacrifice mode for various sacrifice abilities
 * @param sacrificeEffect The effect to apply after sacrifice ('draw', 'water', 'restore')
 * @param card The source card initiating the sacrifice
 * @param location The location of the source card
 * @param setSacrificeMode Function to set sacrifice mode state
 * @param setSacrificeEffect Function to set the effect to apply after sacrifice
 * @param setSacrificeSource Function to set the source card
 */
export const initiateSacrificeMode = (
  sacrificeEffect: 'draw' | 'water' | 'restore',
  card: Card,
  location: { type: 'person' | 'camp'; index: number },
  setSacrificeMode: (active: boolean) => void,
  setSacrificeEffect: (effect: 'draw' | 'water' | 'restore' | null) => void,
  setSacrificeSource: (card: Card | null) => void
): void => {
  // Enter sacrifice mode with the specified effect
  setSacrificeMode(true);
  setSacrificeEffect(sacrificeEffect);
  setSacrificeSource(card);
  
  // Show appropriate message based on effect
  let message = 'Select one of your people to sacrifice';
  if (sacrificeEffect === 'draw') {
    message = 'Select one of your people to sacrifice. You will draw a card.';
  } else if (sacrificeEffect === 'water') {
    message = 'Select one of your people to sacrifice. You will gain 1 water.';
  } else if (sacrificeEffect === 'restore') {
    message = 'Select one of your people to sacrifice. You will be able to restore a card.';
  }
  
  alert(message);
};

/**
 * Handles the completion of a sacrifice based on the chosen effect
 * @param sacrificedCard The card that was sacrificed
 * @param sacrificeEffect The effect to apply ('draw', 'water', 'restore')
 * @param player Current player ('left' or 'right')
 * @param drawDeck Current draw deck
 * @param setDrawDeck Function to update draw deck
 * @param leftPlayerState Left player state
 * @param rightPlayerState Right player state
 * @param setLeftPlayerState Function to update left player state
 * @param setRightPlayerState Function to update right player state
 * @param setSacrificeMode Function to set sacrifice mode state
 * @param setSacrificeEffect Function to set the current sacrifice effect
 * @param setSacrificeSource Function to set the source card
 * @param setRestoreMode Function to enter restore mode
 * @param setRestorePlayer Function to set which player can restore
 */
export const handleSacrificeEffect = (
  sacrificedCard: Card,
  sacrificeEffect: 'draw' | 'water' | 'restore' | null,
  player: 'left' | 'right',
  drawDeck: Card[],
  setDrawDeck: (updater: (prevDeck: Card[]) => Card[]) => void,
  leftPlayerState: PlayerState,
  rightPlayerState: PlayerState,
  setLeftPlayerState: (updater: (prevState: PlayerState) => PlayerState) => void,
  setRightPlayerState: (updater: (prevState: PlayerState) => PlayerState) => void,
  setSacrificeMode: (active: boolean) => void,
  setSacrificeEffect: (effect: 'draw' | 'water' | 'restore' | null) => void,
  setSacrificeSource: (card: Card | null) => void,
  setRestoreMode?: (active: boolean) => void,
  setRestorePlayer?: (player: 'left' | 'right' | null) => void
): void => {
  // Get the correct player state and setter
  const setPlayerState = player === 'left' ? setLeftPlayerState : setRightPlayerState;
  
  // Apply the effect based on the sacrifice type
  switch (sacrificeEffect) {
    case 'draw':
      // Draw a card if available
      if (drawDeck.length > 0) {
        const drawnCard = drawDeck[drawDeck.length - 1];
        
        setPlayerState((prev) => ({
          ...prev,
          handCards: [...prev.handCards, drawnCard]
        }));
        
        setDrawDeck(prev => prev.slice(0, -1));
        alert(`Sacrificed ${sacrificedCard.name} and drew a card: ${drawnCard.name}`);
      } else {
        alert(`Sacrificed ${sacrificedCard.name}, but the draw deck is empty!`);
      }
      break;
      
    case 'water':
      // Gain 1 water
      setPlayerState((prev) => ({
        ...prev,
        waterCount: prev.waterCount + 1
      }));
      alert(`Sacrificed ${sacrificedCard.name} and gained 1 water`);
      break;
      
    case 'restore':
      // Enter restore mode
      if (setRestoreMode && setRestorePlayer) {
        setRestoreMode(true);
        setRestorePlayer(player);
        alert(`Sacrificed ${sacrificedCard.name}. Now select a card to restore.`);
      }
      break;
  }
  
  // Reset sacrifice mode
  setSacrificeMode(false);
  setSacrificeEffect(null);
  setSacrificeSource(null);
};

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
  // Check if card has the cannot_restore trait
  if (target.traits?.includes('cannot_restore')) {
    alert(`${target.name} cannot be restored due to its special trait!`);
    return false;
  }

  // Get the game board element to check for the stored source index
  const gameBoard = document.getElementById('game-board');
  const restoreSourceIndex = gameBoard ? (gameBoard as any).restoreSourceIndex : undefined;

  // Check if this is a camp with cannot_self_restore trait trying to restore itself
  if (
    target.type === 'camp' && 
    target.traits?.includes('cannot_self_restore') &&
    restoreSourceIndex !== undefined && 
    slotIndex === restoreSourceIndex
  ) {
    alert(`${target.name} cannot restore itself due to its special trait!`);
    return false;
  }

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
 * Deducts water cost for an ability, with support for modified costs
 * @param player The current player ('left' or 'right')
 * @param waterCost The base water cost to deduct
 * @param leftPlayerState The left player's state
 * @param rightPlayerState The right player's state
 * @param setLeftPlayerState Function to update left player's state
 * @param setRightPlayerState Function to update right player's state
 * @param modifiedCost Optional modified cost (for abilities with cost modifiers)
 * @returns True if the cost was successfully paid
 */
 export const deductWaterCost = (
  player: 'left' | 'right',
  waterCost: number,
  leftPlayerState: PlayerState,
  rightPlayerState: PlayerState,
  setLeftPlayerState: (updater: (prevState: PlayerState) => PlayerState) => void,
  setRightPlayerState: (updater: (prevState: PlayerState) => PlayerState) => void,
  modifiedCost?: number
): boolean => {
  const playerState = player === 'left' ? leftPlayerState : rightPlayerState;
  const setPlayerState = player === 'left' ? setLeftPlayerState : setRightPlayerState;
  
  // Use modified cost if provided, otherwise use base cost
  const costToDeduct = modifiedCost !== undefined ? modifiedCost : waterCost;
  
  // Check if player has enough water
  if (playerState.waterCount < costToDeduct) {
    return false;
  }
  
  // Deduct water cost
  setPlayerState((prev) => ({
    ...prev,
    waterCount: prev.waterCount - costToDeduct,
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

  console.log('markCardUsedAbility called with:', {
    cardName: card.name,
    cardId: card.id,
    locationType: location.type,
    locationIndex: location.index,
    player,
    hasVeraVoshActive,
    hasKeepReadyTrait: card.traits?.includes('keep_ready_first_ability')
  });


  const playerState = player === 'left' ? leftPlayerState : rightPlayerState;
  const setPlayerState = player === 'left' ? setLeftPlayerState : setRightPlayerState;
  const cardsUsedAbility = player === 'left' ? leftCardsUsedAbility : rightCardsUsedAbility;
  const setCardsUsedAbility = player === 'left' ? setLeftCardsUsedAbility : setRightCardsUsedAbility;
  
  // Check if this card has already used an ability this turn
  const hasCardUsedAbility = cardsUsedAbility.includes(card.id);
  
  if (hasVeraVoshActive && !hasCardUsedAbility) {
    // First ability use with Vera Vosh active - card stays ready
    // Vera Vosh's effect applies to both person and camp cards
    console.log(`${card.name} stays ready due to Vera Vosh's effect`);
    
    // Add card to list of cards that used abilities this turn
    setCardsUsedAbility((prev) => [...prev, card.id]);
  } else {
    // Normal case - mark card as not ready
    if (location.type === 'person') {
      setPlayerState((prev) => ({
        ...prev,
        personSlots: prev.personSlots.map((slot, idx) =>
          idx === location.index ? { ...slot, isReady: false } : slot
        ),
      }));
      
      // Add to list of cards that used abilities this turn
      setCardsUsedAbility((prev) => [...prev, card.id]);
    } 
    // Handle camp cards
    else if (location.type === 'camp') {
      setPlayerState((prev) => ({
        ...prev,
        campSlots: prev.campSlots.map((slot, idx) =>
          idx === location.index ? { ...slot, isReady: false } : slot
        ),
      }));
      
      // Add to list of cards that used abilities this turn
      setCardsUsedAbility((prev) => [...prev, card.id]);
    }
  }
};

// Add this function to a utils file like utils/abilityUtils.ts

/**
 * Resets all ability-related state flags to prevent state leakage between abilities
 */
 export const resetAllAbilityStates = (stateSetters: StateSetters): void => {
  
  // Reset targeting modes
  stateSetters.setDamageMode(false);
  stateSetters.setRestoreMode(false);
  stateSetters.setInjureMode(false);
  stateSetters.setSniperMode(false);
  stateSetters.setCampDamageMode(false);
  stateSetters.setDamageColumnMode(false);
  stateSetters.setDestroyPersonMode(false);
  stateSetters.setDestroyCampMode(false);
  stateSetters.setReturnToHandMode(false);
  stateSetters.setMultiRestoreMode(false);
  stateSetters.setMutantModalOpen(false);
  stateSetters.setSacrificeMode(false);
  stateSetters.setSacrificePendingDamage(false);
  stateSetters.setPunkPlacementMode(false);
  stateSetters.setDiscardSelectionActive(false);
  stateSetters.setCampRaidMode(false);
  stateSetters.setVanguardCounterActive(false);
  stateSetters.setAnyCardDamageMode(false);
  stateSetters.setOpponentChoiceDamageMode(false);
  stateSetters.setRestorePersonReadyMode(false);
  stateSetters.setShowRestoreDoneButton(false);
  
  // Reset source/target references
  stateSetters.setDamageSource(null);
  stateSetters.setDamageValue(0);
  stateSetters.setRestorePlayer(null);
  stateSetters.setRestoreSourceIndex(undefined);
  stateSetters.setRaidingPlayer(null);
  stateSetters.setRaidMessage('');
  stateSetters.setMutantSourceCard(null);
  stateSetters.setMutantSourceLocation(null);
  stateSetters.setMutantPendingAction(null);
  stateSetters.setPunkCardToPlace(null);
  stateSetters.setOpponentChoiceDamageSource(null);
  stateSetters.setOpponentChoiceDamageValue(0);
  stateSetters.setRestoreSource(null);
  stateSetters.setSacrificeEffect(null);
  stateSetters.setSacrificeSource(null);
  stateSetters.setVanguardOriginalPlayer(null);
  stateSetters.setMimicSelectionMode(false);
  stateSetters.setMimicSourceCard(null);
  stateSetters.setMimicSourceLocation(null);
  stateSetters.setMimicTargetCard(null);
};