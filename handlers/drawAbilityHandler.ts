// handlers/drawAbilityHandler.ts
import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../services/abilityService';

export const drawAbilityHandler = (context: AbilityContext): void => {
  const { stateSetters, ability, playerState, player } = context;
  const drawCount = ability.value || 1;
  
  // If we have cards in the draw deck, draw them
  if (context.drawDeck && context.drawDeck.length > 0) {
    const cardsToDraw = Math.min(drawCount, context.drawDeck.length);
    const drawnCards = context.drawDeck.slice(-cardsToDraw);
    
    // Add to player's hand
    const setPlayerState = player === 'left' ? stateSetters.setLeftPlayerState : stateSetters.setRightPlayerState;
    setPlayerState((prev) => ({
      ...prev,
      handCards: [...prev.handCards, ...drawnCards],
    }));
    
    // Remove from draw deck
    stateSetters.setDrawDeck((prev) => prev.slice(0, prev.length - cardsToDraw));
    
    alert(`Drew ${cardsToDraw} card${cardsToDraw !== 1 ? 's' : ''}`);
  } else {
    alert('Draw deck is empty!');
  }
  
  // Complete the ability immediately since no user interaction is needed
  AbilityService.completeAbility();
};