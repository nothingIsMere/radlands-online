// handlers/person/drawThenDiscardAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const drawThenDiscardAbilityHandler = (context: AbilityContext): void => {
  const { stateSetters, player, drawDeck } = context;
  const drawCount = 3; // For Zeto Kahn
  
  // Draw cards
  if (drawDeck.length > 0) {
    const cardsToDraw = Math.min(drawCount, drawDeck.length);
    const drawnCards = drawDeck.slice(-cardsToDraw);
    
    // Add to player's hand
    const setPlayerState = player === 'left' ? 
      stateSetters.setLeftPlayerState : 
      stateSetters.setRightPlayerState;
    
    setPlayerState(prev => ({
      ...prev,
      handCards: [...prev.handCards, ...drawnCards]
    }));
    
    // Remove from draw deck
    stateSetters.setDrawDeck(prev => prev.slice(0, prev.length - cardsToDraw));
    
    // Set up discard phase
    stateSetters.setDiscardSelectionCount(drawCount);
    stateSetters.setDiscardSelectionActive(true);
    
    alert(`Drew ${cardsToDraw} cards. Now select ${drawCount} cards to discard.`);
  } else {
    alert('Draw deck is empty!');
    AbilityService.completeAbility();
  }
};