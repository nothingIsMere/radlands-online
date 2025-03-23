// services/placementService.ts
import { Card, PlayerState } from '@/types/game';
import { updateProtectionStatus } from '@/utils/protectionUtils';
import { hasKarliBlazeTrait, hasCardTrait } from '@/utils/gameUtils';

interface PlacementOptions {
  makeReady?: boolean;
  skipEntranceEffects?: boolean;
  oasisDiscount?: boolean;
  afterPlacement?: (placedCard: Card) => void;
}

interface StateSetters {
  setLeftPlayerState: (updater: (prev: PlayerState) => PlayerState) => void;
  setRightPlayerState: (updater: (prev: PlayerState) => PlayerState) => void;
  setDrawDeck: (updater: (prev: Card[]) => Card[]) => void;
  setRestoreMode: (active: boolean) => void;
  setRestorePlayer: (player: 'left' | 'right' | null) => void;
  setPunkPlacementMode: (active: boolean) => void;
  setPunkCardToPlace: (card: Card | null) => void;
}

export const placeCardInSlot = (
  card: Card,
  slotIndex: number,
  player: 'left' | 'right',
  stateSetters: StateSetters,
  leftPlayerState: PlayerState,
  rightPlayerState: PlayerState,
  options: PlacementOptions = {}
): void => {
  // Default options
  const {
    makeReady = false,
    skipEntranceEffects = false,
    oasisDiscount = false,
    afterPlacement = undefined
  } = options;
  
  // Get the player's state setter and state
  const setPlayerState = player === 'left' ? stateSetters.setLeftPlayerState : stateSetters.setRightPlayerState;
  const playerState = player === 'left' ? leftPlayerState : rightPlayerState;
  
  // Check if Karli Blaze's trait is active (if person card should start ready)
  const hasKarliEffect = hasKarliBlazeTrait(playerState);
  
  // Determine if the card should start ready based on traits or Karli Blaze
  const shouldStartReady = makeReady || hasCardTrait(card, 'start_ready') || hasKarliEffect;
  
  // Place the card in the slot
  if (card.type === 'person') {
    setPlayerState(prev => {
      // First update the person slots
      const updatedPersonSlots = prev.personSlots.map((slot, i) => 
        i === slotIndex ? { ...card, isReady: shouldStartReady } : slot
      );
      
      // Calculate the column index from the slot index
      const columnIndex = Math.floor(slotIndex / 2);
      
      // Update protection status for the affected column
      const { personSlots, campSlots } = updateProtectionStatus(
        updatedPersonSlots, 
        prev.campSlots, 
        columnIndex
      );
      
      return {
        ...prev,
        personSlots,
        campSlots,
        peoplePlayedThisTurn: prev.peoplePlayedThisTurn + 1
      };
    });
  } else if (card.type === 'camp') {
    setPlayerState(prev => {
      // Place the camp card
      const updatedCampSlots = prev.campSlots.map((slot, i) => 
        i === slotIndex ? { ...card, isReady: true } : slot
      );
      
      return {
        ...prev,
        campSlots: updatedCampSlots
      };
    });
  }
  
  // Apply entry effects if not skipped
  if (!skipEntranceEffects && card.type === 'person') {
    applyEntryEffects(card, slotIndex, player, stateSetters, leftPlayerState, rightPlayerState);
  }
  
  // Execute after placement callback if provided
  if (afterPlacement) {
    afterPlacement(card);
  }
};

// Helper function to apply entry effects
const applyEntryEffects = (
  card: Card,
  slotIndex: number,
  player: 'left' | 'right',
  stateSetters: StateSetters,
  leftPlayerState: PlayerState,
  rightPlayerState: PlayerState
): void => {
  // Check for traits that trigger effects on entry
  if (card.traits) {
    // Gain punk on entry
    if (card.traits.includes('gain_punk_on_entry')) {
      // Check if there are cards in the draw deck
      if (stateSetters.setDrawDeck) {
        // Get a punk from the draw deck
        const punkCard = {
          id: `punk-${Math.random().toString(36).substring(2, 9)}`,
          name: 'Punk',
          type: 'person',
          isPunk: true,
          isReady: true // Punks always enter ready
        };
        
        stateSetters.setPunkCardToPlace(punkCard);
        stateSetters.setPunkPlacementMode(true);
        
        alert(`${card.name} entered play: Gain a punk!`);
      }
    }
    
    // Restore on entry
    if (card.traits.includes('restore_on_entry')) {
      stateSetters.setRestoreMode(true);
      stateSetters.setRestorePlayer(player);
      
      alert(`${card.name} entered play: Restore a damaged card!`);
    }
    
    // Draw and damage on entry (Wounded Soldier)
    if (card.traits.includes('draw_and_damage_on_entry')) {
      // 1. Draw a card if available
      // 2. Damage the card itself
      
      // Get the player's state setter
      const setPlayerState = player === 'left' ? stateSetters.setLeftPlayerState : stateSetters.setRightPlayerState;
      
      // Draw a card
      // This would be implemented to draw from draw deck
      
      // Damage the card
      setPlayerState(prev => ({
        ...prev,
        personSlots: prev.personSlots.map((slot, i) => 
          i === slotIndex ? { ...slot, isDamaged: true, isReady: false } : slot
        )
      }));
      
      alert(`${card.name} entered play: Drew a card and was damaged!`);
    }
    
    // Delay events on entry
    if (card.traits.includes('delay_events_on_entry')) {
      // This would be implemented to delay opponent's events
      
      alert(`${card.name} entered play: Opponent's events have been delayed!`);
    }
  }
};