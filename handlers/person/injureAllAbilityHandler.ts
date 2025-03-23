// handlers/person/injureAllAbilityHandler.ts
import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const injureAllAbilityHandler = (context: AbilityContext): void => {
  const { player, leftPlayerState, rightPlayerState, stateSetters } = context;
  
  // Get the opponent's state
  const opponentPlayer = player === 'left' ? 'right' : 'left';
  const opponentState = opponentPlayer === 'left' ? leftPlayerState : rightPlayerState;
  const setOpponentState = opponentPlayer === 'left' ? stateSetters.setLeftPlayerState : stateSetters.setRightPlayerState;
  
  // Find all unprotected enemy person cards
  const unprotectedPersons = opponentState.personSlots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot && !slot.isProtected);
  
  if (unprotectedPersons.length === 0) {
    alert('No unprotected enemy persons to injure!');
    AbilityService.completeAbility();
    return;
  }
  
  // Process each unprotected person
  unprotectedPersons.forEach(({ slot, index }) => {
    if (slot) {
      if (slot.isDamaged || slot.isPunk) {
        // If already damaged or is a punk, destroy it
        alert(`${slot.name || 'Enemy card'} destroyed!`);
        
        // Add to discard pile if not a punk
        if (!slot.isPunk) {
          stateSetters.setDiscardPile(prev => [...prev, slot]);
        }
        
        // Remove from slot
        setOpponentState(prev => ({
          ...prev,
          personSlots: prev.personSlots.map((c, i) => i === index ? null : c)
        }));
      } else {
        // Otherwise mark as damaged
        setOpponentState(prev => ({
          ...prev,
          personSlots: prev.personSlots.map((card, i) => 
            i === index ? { ...card, isDamaged: true, isReady: false } : card
          )
        }));
      }
    }
  });
  
  alert(`Injured all unprotected enemy persons!`);
  AbilityService.completeAbility();
};