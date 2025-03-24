// handlers/person/destroyDamagedAllAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const destroyDamagedAllAbilityHandler = (context: AbilityContext): void => {
  const { player, opponentState, stateSetters } = context;
  const opponentPlayer = player === 'left' ? 'right' : 'left';
  
  // Count damaged cards
  const damagedPersons = opponentState.personSlots.filter(card => card && card.isDamaged);
  const damagedCamps = opponentState.campSlots.filter(camp => camp && camp.isDamaged);
  
  if (damagedPersons.length === 0 && damagedCamps.length === 0) {
    alert('No damaged enemy cards to destroy!');
    AbilityService.completeAbility();
    return;
  }
  
  // Destroy all damaged enemy cards
  const setOpponentState = opponentPlayer === 'left' ? 
    stateSetters.setLeftPlayerState : 
    stateSetters.setRightPlayerState;
  
  // Destroy damaged persons
  damagedPersons.forEach(person => {
    if (person) {
      const index = opponentState.personSlots.findIndex(p => p && p.id === person.id);
      if (index !== -1) {
        if (person.isPunk) {
          // Punks go back to the draw deck
          stateSetters.setDrawDeck(prev => [person, ...prev]);
        } else {
          // Cards go to discard pile
          stateSetters.setDiscardPile(prev => [...prev, person]);
        }
      }
    }
  });
  
  // Update opponent state
  setOpponentState(prev => ({
    ...prev,
    personSlots: prev.personSlots.map(card => card?.isDamaged ? null : card),
    campSlots: prev.campSlots.map(camp => camp?.isDamaged ? null : camp)
  }));
  
  alert(`Destroyed all damaged enemy cards!`);
  AbilityService.completeAbility();
};