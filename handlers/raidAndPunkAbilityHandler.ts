// handlers/raidAndPunkAbilityHandler.ts
import { AbilityContext, AbilityService } from '@/types/abilities';

export const raidAndPunkAbilityHandler = (context: AbilityContext): void => {
  // For Cache card: Raid and Gain a Punk
  const { sourceCard, sourceLocation } = context;
  
  // Show modal to let player choose execution order
  // This would be implemented to show a choice modal
  
  // The modal will call executeCacheAbility with the chosen order
  // For demonstration, we'll just complete the ability
  AbilityService.completeAbility();
};

// This function would be called when the player chooses the order
const executeCacheAbility = (
  card: Card,
  location: { type: 'person' | 'camp'; index: number },
  order: 'punk_first' | 'raid_first',
  context: AbilityContext
) => {
  if (order === 'punk_first') {
    // 1. First gain punk, and set a flag to do the raid after punk placement
    gainPunk(context);
    // Set pending raid flag
  } else {
    // 1. First execute raid
    executeRaid(context);
    
    // 2. Then gain punk
    // Delay this if raid requires interaction
    setTimeout(() => {
      // Only proceed with punk gain if raid is complete
      gainPunk(context);
    }, 100);
  }
  
  // Mark the card as having used an ability (already handled by AbilityService)
};

// Helper function for gaining a punk
const gainPunk = (context: AbilityContext): void => {
  const { drawDeck, stateSetters } = context;
  
  // Check if there are cards in the draw deck
  if (drawDeck.length > 0) {
    const punkCard = drawDeck[drawDeck.length - 1];
    stateSetters.setPunkCardToPlace(punkCard);
    stateSetters.setPunkPlacementMode(true);
    stateSetters.setDrawDeck(prev => prev.slice(0, prev.length - 1));
    alert(`Gain a punk!`);
  } else {
    alert('Draw deck is empty, cannot gain a punk!');
  }
};