// services/abilityService.ts
import { AbilityContext, Ability } from '../types/abilities';
import { AbilityRegistry } from './abilityRegistry';
import { deductWaterCost, markCardUsedAbility, resetAllAbilityStates } from '../src/utils/abilityUtils';
import { hasVeraVoshTrait } from '../src/utils/gameUtils';
import { Card } from '../src/types/game';

export class AbilityService {
  private static isActive: boolean = false;
  private static currentContext: AbilityContext | null = null;
  private static isPendingAbility = false;
  private static mimicCardInfo: { 
    card: Card, 
    location: { type: 'person' | 'camp'; index: number },
    player: 'left' | 'right' 
  } | null = null;
  private static mimickedCard: {
    card: Card,
    index: number,
    player: 'left' | 'right'
  } | null = null;

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
      
      // If this was a mimic ability, reset the mimicked card to ready
      if (this.mimickedCard) {
        this.resetMimickedCardToReady();
        this.mimickedCard = null;
      }
      
      // Reset all ability-related states
      resetAllAbilityStates(this.currentContext.stateSetters);
    }
    
    // Clear the ability state
    this.isActive = false;
    this.isPendingAbility = false;
    this.currentContext = null;
    this.mimicCardInfo = null;
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
    this.mimicCardInfo = null;
    this.mimickedCard = null;
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

  static setMimicCardInfo(info: { 
    card: Card, 
    location: { type: 'person' | 'camp'; index: number },
    player: 'left' | 'right' 
  }): void {
    this.mimicCardInfo = info;
  }
  
  static setMimickedCard(info: {
    card: Card,
    index: number,
    player: 'left' | 'right'
  }): void {
    this.mimickedCard = info;
  }
  
  static getMimicCardInfo() {
    return this.mimicCardInfo;
  }
  
  static getMimickedCard() {
    return this.mimickedCard;
  }

  private static markSourceCardNotReady(): void {
    console.log("markSourceCardNotReady called for:", this.currentContext?.sourceCard?.name);
    
    if (!this.currentContext) return;
    
    const { sourceCard, sourceLocation, player, stateSetters, ability } = this.currentContext;
    
    // Skip making target card not ready if this is a mimicked ability but not the Mimic card itself
    if (ability && ability.type === 'mimic_ability' && sourceCard && sourceCard.name !== 'Mimic') {
      console.log("Skipping markSourceCardNotReady for mimicked card:", sourceCard.name);
      return;
    }
    
    // Only handle person cards
    if (sourceLocation.type !== 'person') return;
    
    // Get the correct setState function based on the player
    const setPlayerState = player === 'left' ?
      stateSetters.setLeftPlayerState :
      stateSetters.setRightPlayerState;
    
    // Update the card's ready state
    setPlayerState(prev => ({
      ...prev,
      personSlots: prev.personSlots.map((card, idx) =>
        idx === sourceLocation.index ? { ...card, isReady: false } : card
      )
    }));
  }
  
  private static resetMimickedCardToReady(): void {
    if (!this.mimickedCard || !this.currentContext) return;
    
    const { card, index, player } = this.mimickedCard;
    const { stateSetters } = this.currentContext;
    
    if (card.type === 'person') {
      const setPlayerState = player === 'left' ? 
        stateSetters.setLeftPlayerState : 
        stateSetters.setRightPlayerState;
        
      console.log(`Resetting mimicked card ${card.name} to ready state`);
      
      setPlayerState(prev => ({
        ...prev,
        personSlots: prev.personSlots.map((slot, idx) =>
          idx === index ? { ...slot, isReady: true } : slot
        )
      }));
    }
  }
}