// services/abilityService.ts
import { AbilityContext, Ability } from '../types/abilities';
import { AbilityRegistry } from './abilityRegistry';
import { deductWaterCost, markCardUsedAbility, resetAllAbilityStates } from '../src/utils/abilityUtils';
import { hasVeraVoshTrait } from '../src/utils/gameUtils';

export class AbilityService {
  private static isActive: boolean = false;
  private static currentContext: AbilityContext | null = null;
  private static isPendingAbility = false;

  static executeAbility(context: AbilityContext): void {
    const {
      sourceCard,
      sourceLocation,
      player,
      ability,
      gameState,
      playerState,
      stateSetters,
      opponentState
    } = context;

    // Mark the ability as active
    this.isActive = true;
    this.currentContext = context;

    // Deduct water cost
    deductWaterCost(
      player,
      ability.cost,
      player === 'left' ? playerState : opponentState,
      player === 'right' ? playerState : opponentState,
      stateSetters.setLeftPlayerState,
      stateSetters.setRightPlayerState
    );

    // Mark the card as having used an ability
    const hasVeraVoshEffect = hasVeraVoshTrait(playerState);

    // Call the appropriate handler
    const handler = AbilityRegistry.getHandler(ability.type);
    if (handler) {
      // Execute the ability handler
      handler(context);
    } else {
      console.error(`No handler registered for ability type: ${ability.type}`);
      this.completeAbility();
    }
  }

  static completeAbility(): void {
    if (this.currentContext) {
      // Mark the source card as not ready
      this.markSourceCardNotReady();
      
      // Reset all ability-related states
      resetAllAbilityStates(this.currentContext.stateSetters);
    }
    
  
    
    // Clear the ability state
    this.isActive = false;
    this.isPendingAbility = false;
    this.currentContext = null;
  }

  static cancelAbility(): void {
    // Clean up all ability-related states if we have a context
    if (this.currentContext) {
      resetAllAbilityStates(this.currentContext.stateSetters);
    }

    // Mark the ability as canceled
    this.isActive = false;
    this.isPendingAbility = false;
    this.currentContext = null;
  }

  static isAbilityActive(): boolean {
    return this.isActive;
  }

  static setPendingAbility(isPending: boolean): void {
    this.isPendingAbility = isPending;
  }

  static getCurrentContext(): AbilityContext | null {
    return this.currentContext;
  }

  static setCurrentContext(context: AbilityContext): void {
    this.currentContext = context;
  }

  private static markSourceCardNotReady(): void {
    console.log("markSourceCardNotReady called for:", this.currentContext?.sourceCard?.name);
    console.log("Card traits:", this.currentContext?.sourceCard?.traits);
    if (!this.currentContext) return;
    
    
    // Only handle person cards
    if (sourceLocation.type !== 'person') return;
    
    // Get the correct setState function based on the player
    const setPlayerState = player === 'left' ? 
      this.currentContext.stateSetters.setLeftPlayerState : 
      this.currentContext.stateSetters.setRightPlayerState;
    
    // Update the card's ready state
    setPlayerState(prev => ({
      ...prev,
      personSlots: prev.personSlots.map((card, idx) => 
        idx === sourceLocation.index ? { ...card, isReady: false } : card
      )
    }));
  }