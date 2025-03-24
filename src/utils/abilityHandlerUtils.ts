// utils/abilityHandlerUtils.ts
import { AbilityContext } from '../../types/abilities';
import { AbilityService } from '../../services/abilityService';

/**
 * Base handler for abilities that require targeting
 * @param context The ability context
 * @param setupFn Function to set up the targeting mode
 * @param requiresUserInput Whether this ability requires user to select a target
 */
export const createTargetingHandler = (
  context: AbilityContext,
  setupFn: (context: AbilityContext) => void,
  requiresUserInput: boolean = true
): void => {
  // Execute the setup function that configures targeting states
  setupFn(context);
  
  // If user input is required, mark the ability as pending
  if (requiresUserInput) {
    AbilityService.setPendingAbility(true);
  } else {
    // Otherwise complete the ability immediately
    AbilityService.completeAbility();
  }
};

/**
 * Helper for damage-based ability handlers
 */
export const createDamageHandler = (
  context: AbilityContext,
  targetProtectedCards: boolean = false,
  targetCampsOnly: boolean = false,
  targetAnyCard: boolean = false,
  damageValue: number = 1
): void => {
  const { stateSetters, sourceCard } = context;
  
  // Set up standard damage targeting mode
  stateSetters.setDamageMode(true);
  stateSetters.setDamageSource(sourceCard);
  stateSetters.setDamageValue(damageValue);
  
  // Configure targeting options
  if (targetProtectedCards) {
    stateSetters.setSniperMode(true);
  }
  
  if (targetCampsOnly) {
    stateSetters.setCampDamageMode(true);
  }
  
  if (targetAnyCard) {
    stateSetters.setAnyCardDamageMode(true);
  }
  
  // Mark as pending user selection
  AbilityService.setPendingAbility(true);
};

/**
 * Helper for restore-based ability handlers
 */
export const createRestoreHandler = (
  context: AbilityContext,
  multipleTargets: boolean = false,
  makeTargetReady: boolean = false
): void => {
  const { stateSetters, player, sourceCard } = context;
  
  if (multipleTargets) {
    stateSetters.setMultiRestoreMode(true);
    stateSetters.setShowRestoreDoneButton(true);
  } else if (makeTargetReady) {
    stateSetters.setRestorePersonReadyMode(true);
    stateSetters.setRestoreSource(sourceCard);
  } else {
    stateSetters.setAbilityRestoreMode(true);
    stateSetters.setRestoreSource(sourceCard);
  }
  
  // Mark as pending user selection
  AbilityService.setPendingAbility(true);
};

/**
 * Helper for destroy-based ability handlers
 */
export const createDestroyHandler = (
  context: AbilityContext, 
  targetType: 'person' | 'camp' | 'damaged_all' = 'person',
  ignoreProtection: boolean = false
): void => {
  const { stateSetters } = context;
  
  if (targetType === 'person') {
    stateSetters.setDestroyPersonMode(true);
  } else if (targetType === 'camp') {
    stateSetters.setDestroyCampMode(true);
  } else if (targetType === 'damaged_all') {
    // For abilities like Exterminator that destroy all damaged enemy cards
    stateSetters.setDestroyDamagedAllMode(true);
  }
  
  // Mark as pending user selection if needed
  if (targetType !== 'damaged_all') {
    AbilityService.setPendingAbility(true);
  }
};

/**
 * Helper for card movement ability handlers (return to hand, etc.)
 */
export const createCardMovementHandler = (
  context: AbilityContext,
  movementType: 'return_to_hand' | 'column_movement' = 'return_to_hand'
): void => {
  const { stateSetters } = context;
  
  if (movementType === 'return_to_hand') {
    stateSetters.setReturnToHandMode(true);
  } else if (movementType === 'column_movement') {
    stateSetters.setColumnMovementMode(true);
  }
  
  // Mark as pending user selection
  AbilityService.setPendingAbility(true);
};

/**
 * Helper for sacrifice-based ability handlers
 */
export const createSacrificeHandler = (
  context: AbilityContext,
  effectAfterSacrifice: 'draw' | 'water' | 'restore' | 'damage' | null = null
): void => {
  const { stateSetters, sourceCard } = context;
  
  stateSetters.setSacrificeMode(true);
  
  if (effectAfterSacrifice) {
    if (effectAfterSacrifice === 'damage') {
      stateSetters.setSacrificePendingDamage(true);
    } else {
      stateSetters.setSacrificeEffect(effectAfterSacrifice);
      stateSetters.setSacrificeSource(sourceCard);
    }
  }
  
  // Mark as pending user selection
  AbilityService.setPendingAbility(true);
};
