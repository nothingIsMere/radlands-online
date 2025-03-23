// handlers/conditionalDamageAbilityHandler.ts
import { AbilityContext, AbilityService } from '@/types/abilities';

export const conditionalDamageAbilityHandler = (context: AbilityContext): void => {
  const { ability, stateSetters, playerState, sourceCard, sourceLocation } = context;
  
  // Check the condition based on the specific condition type
  let isConditionSatisfied = false;
  let conditionMessage = '';
  
  if (ability.condition === 'self_undamaged') {
    // For Cannon: "If this card is undamaged, Damage"
    isConditionSatisfied = !sourceCard.isDamaged;
    conditionMessage = isConditionSatisfied ? 
      'This card is undamaged.' : 
      'This card is damaged. Ability cannot be used.';
  } 
  else if (ability.condition === 'two_people_in_column') {
    // For Training Camp: "If you have 2 people in this column, Damage"
    // Determine which column this camp is in
    const campColumnIndex = sourceLocation.index;
    
    // Count people in this column (front and back row)
    const frontRowIndex = campColumnIndex * 2; // Convert column to person slot index
    const backRowIndex = frontRowIndex + 1;
    
    const frontRowPerson = playerState.personSlots[frontRowIndex];
    const backRowPerson = playerState.personSlots[backRowIndex];
    
    // Check if both slots in the column have people (not null and not punks)
    const peopleInColumn = 
      (frontRowPerson && !frontRowPerson.isPunk ? 1 : 0) + 
      (backRowPerson && !backRowPerson.isPunk ? 1 : 0);
    
    isConditionSatisfied = peopleInColumn >= 2;
    conditionMessage = isConditionSatisfied ?
      `You have ${peopleInColumn} people in this column.` :
      `You need 2 people in this column. Current count: ${peopleInColumn}`;
  }
  else if (ability.condition === 'played_two_people') {
    // For Nest of Spies and Transplant Lab: "If you have put 2 or more people into play this turn"
    isConditionSatisfied = playerState.peoplePlayedThisTurn >= 2;
    conditionMessage = isConditionSatisfied ?
      `You've played ${playerState.peoplePlayedThisTurn} people this turn.` :
      `You've only played ${playerState.peoplePlayedThisTurn} people this turn. You need to play at least 2 people.`;
  }
  else if (ability.condition === 'event_resolved') {
    // For Watchtower: "If any event resolved this turn"
    // This would need a state tracker for events resolved this turn
    // For now we'll just use a placeholder
    isConditionSatisfied = true; // Replace with actual condition check
    conditionMessage = isConditionSatisfied ?
      'An event was resolved this turn.' :
      'No events have been resolved this turn.';
  }
  
  // If condition is met, proceed with damage targeting
  if (isConditionSatisfied) {
    // Alert the player that the condition was met
    alert(`Condition met: ${conditionMessage}`);
    
    // Set damage mode to allow player to select a target
    stateSetters.setDamageMode(true);
    stateSetters.setDamageValue(ability.value || 1);
    stateSetters.setDamageSource(context.sourceCard);
    
    // When damage is applied, AbilityService.completeAbility will be called
    // This will be handled in the applyDamage function
  } else {
    // If condition is not met, cancel the ability and refund the cost
    alert(`Condition not met: ${conditionMessage}`);
    
    // Reset the card to ready state since the ability wasn't actually used
    const setPlayerState = context.player === 'left' ? 
      stateSetters.setLeftPlayerState : 
      stateSetters.setRightPlayerState;
    
    if (sourceLocation.type === 'camp') {
      setPlayerState(prev => ({
        ...prev,
        campSlots: prev.campSlots.map((camp, i) => 
          i === sourceLocation.index ? { ...camp, isReady: true } : camp
        ),
        // Refund the water cost
        waterCount: prev.waterCount + ability.cost
      }));
    } else if (sourceLocation.type === 'person') {
      setPlayerState(prev => ({
        ...prev,
        personSlots: prev.personSlots.map((person, i) => 
          i === sourceLocation.index ? { ...person, isReady: true } : person
        ),
        // Refund the water cost
        waterCount: prev.waterCount + ability.cost
      }));
    }
    
    // Cancel the ability
    AbilityService.cancelAbility();
  }
};