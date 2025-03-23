// handlers/person/destroyDamagedAllHandler.ts
import { AbilityContext } from '../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const destroyDamagedAllAbilityHandler = (context: AbilityContext): void => {
  const { player, stateSetters } = context;
  
  // Determine the opponent
  const enemyPlayer = player === 'left' ? 'right' : 'left';
  const enemyState = player === 'left' ? context.opponentState : context.playerState;
  const setEnemyState = enemyPlayer === 'left' ? stateSetters.setLeftPlayerState : stateSetters.setRightPlayerState;
  
  // Get all damaged enemy person cards
  const damagedPersons = enemyState.personSlots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot && slot.isDamaged);
  
  // Get all damaged enemy camp cards
  const damagedCamps = enemyState.campSlots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot && slot.isDamaged);
  
  if (damagedPersons.length === 0 && damagedCamps.length === 0) {
    alert('No damaged enemy cards to destroy!');
    AbilityService.completeAbility();
    return;
  }
  
  // Destroy all damaged persons
  damagedPersons.forEach(({ slot, index }) => {
    if (slot) {
      alert(`${slot.name || 'Enemy card'} destroyed!`);
      // You'll need a reference to destroyCard here, which might come from context or elsewhere
      // destroyCard(slot, index, enemyPlayer === 'right');
      
      // For now, we'll remove them directly
      setEnemyState(prev => ({
        ...prev,
        personSlots: prev.personSlots.map((card, i) => i === index ? null : card)
      }));
      
      // Add to discard pile
      if (!slot.isPunk) {
        stateSetters.setDiscardPile(prev => [...prev, slot]);
      }
    }
  });
  
  // Destroy all damaged camps
  damagedCamps.forEach(({ slot, index }) => {
    if (slot) {
      alert(`${slot.name || 'Enemy camp'} destroyed!`);
      setEnemyState(prev => ({
        ...prev,
        campSlots: prev.campSlots.map((camp, i) => i === index ? null : camp)
      }));
    }
  });
  
  alert(`All damaged enemy cards destroyed!`);
  AbilityService.completeAbility();
};