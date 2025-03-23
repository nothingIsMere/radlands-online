// handlers/person/scientistAbilityHandler.ts
import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const scientistAbilityHandler = (context: AbilityContext): void => {
  const { stateSetters, drawDeck } = context;
  
  // Check if there are at least 3 cards in the draw deck
  if (drawDeck.length < 3) {
    alert(`Not enough cards in the draw deck. Needed 3, but only ${drawDeck.length} available.`);
    AbilityService.completeAbility();
    return;
  }
  
  // Take 3 cards from the top of the draw deck
  const drawnCards = drawDeck.slice(-3);
  stateSetters.setScientistCards(drawnCards);
  
  // Remove these cards from the draw deck
  stateSetters.setDrawDeck(prev => prev.slice(0, prev.length - 3));
  
  // Open the modal to choose a junk effect
  stateSetters.setIsScientistModalOpen(true);
  
  // The ability will be completed after the user selects a card and executes the junk effect
};