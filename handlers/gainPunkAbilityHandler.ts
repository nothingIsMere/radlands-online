// handlers/gainPunkAbilityHandler.ts
import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../services/abilityService';

export const gainPunkAbilityHandler = (context: AbilityContext): void => {
  const { stateSetters, drawDeck } = context;
  
  // Check if there are cards in the draw deck
  if (drawDeck.length === 0) {
    alert('Draw deck is empty, cannot gain a punk!');
    AbilityService.completeAbility();
    return;
  }
  
  // Get a punk from the draw deck
  const punkCard = drawDeck[drawDeck.length - 1];
  stateSetters.setPunkCardToPlace(punkCard);
  stateSetters.setPunkPlacementMode(true);
  stateSetters.setDrawDeck(prev => prev.slice(0, prev.length - 1));
  
  alert('Gain a punk! Place it in an empty person slot.');
  
  // The ability will be completed when the punk is placed
  // This is typically handled in the UI component after the punk is placed
};