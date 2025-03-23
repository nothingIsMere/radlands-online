// handlers/person/drawThenDiscardAbilityHandler.ts
import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const drawThenDiscardAbilityHandler = (context: AbilityContext): void => {
  const { player, stateSetters, drawDeck } = context;
  
  // Check if there are cards in the draw deck
  if (drawDeck.length === 0) {
    alert('Draw deck is empty!');
    AbilityService.completeAbility();
    return;
  }
  
  // Determine how many cards to draw (up to 3, based on what's available)
  const cardsToDraw = Math.min(3, drawDeck.length);
  
  // Get the player's state setter
  const setPlayerState = player === 'left' ? stateSetters.setLeftPlayerState : stateSetters.setRightPlayerState;
  
  // Get the top cards from the draw deck
  const drawnCards = drawDeck.slice(-cardsToDraw);
  
  // Add them to the player's hand
  setPlayerState(prev => ({
    ...prev,
    handCards: [...prev.handCards, ...drawnCards]
  }));
  
  // Remove the drawn cards from the draw deck
  stateSetters.setDrawDeck(prev => prev.slice(0, prev.length - cardsToDraw));
  
  alert(`Drew ${cardsToDraw} cards. Now select ${cardsToDraw} cards to discard.`);
  
  // Set the state to track discard selection
  stateSetters.setDiscardSelectionCount(cardsToDraw);
  stateSetters.setDiscardSelectionActive(true);
  
  // The ability will be completed when the user selects cards to discard
  // This is typically handled in the UI component after the discard is complete
};