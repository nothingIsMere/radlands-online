// services/restoreService.ts
import { Card, PlayerState } from '@/types/game';
import { AbilityService } from '@/types/abilities';

interface RestoreOptions {
  makeReady?: boolean;
  afterRestore?: () => void;
}

export const applyRestore = (
  target: Card,
  slotIndex: number,
  player: 'left' | 'right',
  stateSetters: {
    setLeftPlayerState: (updater: (prev: PlayerState) => PlayerState) => void;
    setRightPlayerState: (updater: (prev: PlayerState) => PlayerState) => void;
    setRestoreMode: (active: boolean) => void;
    setRestorePlayer: (player: 'left' | 'right' | null) => void;
    setRestoreSourceIndex: (index: number | undefined) => void;
    setMultiRestoreMode: (active: boolean) => void;
  },
  leftPlayerState: PlayerState,
  rightPlayerState: PlayerState,
  options: RestoreOptions = {}
): boolean {
  // Default options
  const {
    makeReady = false,
    afterRestore = undefined
  } = options;
  
  // Get the player's state setter
  const setPlayerState = player === 'left' ? stateSetters.setLeftPlayerState : stateSetters.setRightPlayerState;
  
  // Check if card has the cannot_restore trait
  if (target.traits?.includes('cannot_restore')) {
    alert(`${target.name} cannot be restored due to its special trait!`);
    return false;
  }
  
  // Check if this is a camp with cannot_self_restore trait trying to restore itself
  if (
    target.type === 'camp' && 
    target.traits?.includes('cannot_self_restore') &&
    stateSetters.setRestoreSourceIndex !== undefined
  ) {
    const restoreSourceIndex = leftPlayerState.campSlots.findIndex(camp => 
      camp && camp.traits?.includes('cannot_self_restore')
    );
    
    if (restoreSourceIndex === slotIndex) {
      alert(`${target.name} cannot restore itself due to its special trait!`);
      return false;
    }
  }
  
  // Check if the card is damaged
  if (!target.isDamaged) {
    alert(`${target.name} is not damaged!`);
    return false;
  }
  
  // Restore the card
  if (target.type === 'person') {
    setPlayerState(prev => ({
      ...prev,
      personSlots: prev.personSlots.map((card, i) => 
        i === slotIndex ? { 
          ...card, 
          isDamaged: false, 
          isReady: makeReady // Only make ready if specified in options
        } : card
      )
    }));
  } else if (target.type === 'camp') {
    setPlayerState(prev => ({
      ...prev,
      campSlots: prev.campSlots.map((camp, i) => 
        i === slotIndex ? { ...camp, isDamaged: false } : camp
      )
    }));
  }
  
  alert(`Restored ${target.name}${makeReady ? ' and made it ready' : ''}`);
  
  // If not in multi-restore mode, reset targeting mode
  if (!stateSetters.setMultiRestoreMode) {
    stateSetters.setRestoreMode(false);
    stateSetters.setRestorePlayer(null);
    
    // Clear the source index
    if (stateSetters.setRestoreSourceIndex) {
      stateSetters.setRestoreSourceIndex(undefined);
    }
  }
  
  // Execute after restore callback if provided
  if (afterRestore) {
    afterRestore();
  }
  
  // Complete the ability if an ability is active and not in multi-restore mode
  if (AbilityService.isAbilityActive() && !stateSetters.setMultiRestoreMode) {
    AbilityService.completeAbility();
  }
  
  return true;
};