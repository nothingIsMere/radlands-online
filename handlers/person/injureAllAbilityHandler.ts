// handlers/person/injureAllAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const injureAllAbilityHandler = (context: AbilityContext): void => {
  const { player, opponentState, stateSetters } = context;
  const opponentPlayer = player === 'left' ? 'right' : 'left';
  
  // Get all unprotected enemy persons
  const unprotectedPersons = opponentState.personSlots
    .filter(card => card && !card.isProtected);
  
  if (unprotectedPersons.length === 0) {
    alert('No unprotected enemy persons to injure!');
    AbilityService.completeAbility();
    return;
  }
  
  const setOpponentState = opponentPlayer === 'left' ? 
    stateSetters.setLeftPlayerState : 
    stateSetters.setRightPlayerState;
  
  // Apply injury to all unprotected enemy persons
  setOpponentState(prev => ({
    ...prev,
    personSlots: prev.personSlots.map(card => {
      if (card && !card.isProtected) {
        // If already damaged or a punk, destroy it
        if (card.isDamaged || card.isPunk) {
          // Handle destruction logic
          if (card.isPunk) {
            // Punks go back to draw deck
            stateSetters.setDrawDeck(deck => [card, ...deck]);
          } else {
            // Cards go to discard pile
            stateSetters.setDiscardPile(pile => [...pile, card]);
          }
          return null;
        } else {
          // Otherwise mark as damaged and not ready
          return { ...card, isDamaged: true, isReady: false };
        }
      }
      return card;
    })
  }));
  
  alert(`Injured all unprotected enemy persons!`);
  AbilityService.completeAbility();
};