// handlers/drawAbilityHandler.ts

import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../services/abilityService';

export const drawAbilityHandler = (context: AbilityContext): void => {
  const { ability, player, stateSetters, drawDeck } = context;
  
  // Get the player's state setter
  const setPlayerState = player === 'left' ? stateSetters.setLeftPlayerState : stateSetters.setRightPlayerState;
  
  // Determine how many cards to draw
  const cardsToDraw = ability.value || 1;
  
  // Check if there are enough cards in the draw deck
  if (drawDeck.length === 0) {
    alert('Draw deck is empty!');
    AbilityService.completeAbility();
    return;
  }
  
  // Draw cards (up to available amount)
  const cardsDrawn = Math.min(cardsToDraw, drawDeck.length);
  const drawnCards = drawDeck.slice(-cardsDrawn);
  
  // Add the cards to the player's hand
  setPlayerState(prev => ({
    ...prev,
    handCards: [...prev.handCards, ...drawnCards]
  }));
  
  // Remove the drawn cards from the draw deck
  stateSetters.setDrawDeck(prev => prev.slice(0, -cardsDrawn));
  
  // Notify the player
  alert(`Drew ${cardsDrawn} card${cardsDrawn !== 1 ? 's' : ''}!`);
  
  // Complete the ability
  AbilityService.completeAbility();
};