// services/damageService.ts
import { Card, PlayerState } from '@/types/game';
import { AbilityService } from '@/types/abilities';
import { updateProtectionStatus } from '@/utils/protectionUtils';

interface DamageOptions {
  value?: number;
  ignoreProtection?: boolean;
  sourceCard?: Card | null;
  isColumnDamage?: boolean;
  afterDamage?: () => void;
}

export const applyDamage = (
  target: Card,
  slotIndex: number,
  player: 'left' | 'right',
  stateSetters: {
    setLeftPlayerState: (updater: (prev: PlayerState) => PlayerState) => void;
    setRightPlayerState: (updater: (prev: PlayerState) => PlayerState) => void;
    setDamageMode: (active: boolean) => void;
    setDamageSource: (source: Card | null) => void;
    setDamageValue: (value: number) => void;
    setSniperMode: (active: boolean) => void;
    setCampDamageMode: (active: boolean) => void;
    setAnyCardDamageMode: (active: boolean) => void;
  },
  leftPlayerState: PlayerState,
  rightPlayerState: PlayerState,
  destroyCard: (card: Card, slotIndex: number, isRightPlayer: boolean) => void,
  setDiscardPile: (updater: (prev: Card[]) => Card[]) => void,
  options: DamageOptions = {}
): boolean {
  // Default options
  const {
    value = 1,
    ignoreProtection = false,
    sourceCard = null,
    isColumnDamage = false,
    afterDamage = undefined
  } = options;
  
  // Get the player's state setter
  const setPlayerState = player === 'left' ? stateSetters.setLeftPlayerState : stateSetters.setRightPlayerState;
  const playerState = player === 'left' ? leftPlayerState : rightPlayerState;
  
  // Check protection if not ignoring it
  if (!ignoreProtection && target.isProtected) {
    alert('This card is protected and cannot be damaged!');
    return false;
  }
  
  // Determine if the card is already damaged or is a punk
  const isDestroyed = target.isDamaged || target.isPunk;
  
  if (isDestroyed) {
    // If already damaged or is a punk, destroy the card
    if (target.type === 'person') {
      destroyCard(target, slotIndex, player === 'right');
      
      // If it's a person, also add to discard pile (unless it's a punk)
      if (!target.isPunk) {
        setDiscardPile(prev => [...prev, target]);
      }
    } else if (target.type === 'camp') {
      // For camps, we remove them from the slot
      setPlayerState(prev => ({
        ...prev,
        campSlots: prev.campSlots.map((camp, i) => 
          i === slotIndex ? null : camp
        )
      }));
      
      // Update the protection status of cards in this column
      setTimeout(() => {
        const columnIndex = slotIndex;
        const personSlots = [...playerState.personSlots];
        const campSlots = [...playerState.campSlots];
        campSlots[columnIndex] = null; // Ensure the camp is marked as destroyed
        
        const { personSlots: updatedPersonSlots, campSlots: updatedCampSlots } = 
          updateProtectionStatus(personSlots, campSlots, columnIndex);
        
        setPlayerState(prev => ({
          ...prev,
          personSlots: updatedPersonSlots,
          campSlots: updatedCampSlots
        }));
      }, 0);
    }
    
    alert(`${target.isPunk ? 'Punk' : target.name} destroyed!`);
  } else {
    // Otherwise, mark the card as damaged
    if (target.type === 'person') {
      setPlayerState(prev => ({
        ...prev,
        personSlots: prev.personSlots.map((card, i) => 
          i === slotIndex ? { ...card, isDamaged: true, isReady: false } : card
        )
      }));
    } else if (target.type === 'camp') {
      setPlayerState(prev => ({
        ...prev,
        campSlots: prev.campSlots.map((camp, i) => 
          i === slotIndex ? { ...camp, isDamaged: true } : camp
        )
      }));
    }
    
    alert(`Applied ${value} damage to ${target.name}`);
  }
  
  // Check for secondary effects based on the damage source
  if (sourceCard && sourceCard.abilities) {
    const ability = sourceCard.abilities.find(a => 
      a.type === 'damage' || a.type === 'conditional_damage'
    );
    
    if (ability && ability.secondaryEffect) {
      const { condition, type, value } = ability.secondaryEffect;
      
      // Check if condition is met
      let conditionMet = false;
      
      if (condition === 'hits_camp' && target.type === 'camp') {
        conditionMet = true;
      }
      
      // Execute secondary effect if condition met
      if (conditionMet) {
        if (type === 'draw') {
          // This would be implemented to draw cards
          alert(`Secondary effect: Draw ${value || 1} card(s)!`);
        }
        // Add other secondary effect types as needed
      }
    }
  }
  
  // Reset all damage modes
  if (!isColumnDamage) {
    stateSetters.setDamageMode(false);
    stateSetters.setDamageSource(null);
    stateSetters.setDamageValue(0);
    stateSetters.setSniperMode(false);
    stateSetters.setCampDamageMode(false);
    stateSetters.setAnyCardDamage
  }

  // Execute after damage callback if provided
  if (afterDamage) {
    afterDamage();
  }
  
  // Complete the ability if an ability is active
  if (AbilityService.isAbilityActive()) {
    AbilityService.completeAbility();
  }
  
  return true;
};