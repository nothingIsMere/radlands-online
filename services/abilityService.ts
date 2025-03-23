// services/abilityService.ts
import { AbilityContext, Ability } from '../types/abilities';
import { AbilityRegistry } from './abilityRegistry';
import { deductWaterCost, markCardUsedAbility } from '../src/utils/abilityUtils';
import { hasVeraVoshTrait } from '../src/utils/gameUtils';

export class AbilityService {
  private static isActive: boolean = false;
  private static currentContext: AbilityContext | null = null;

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
    // Mark the ability as completed
    this.isActive = false;
    this.currentContext = null;
  }

  static isAbilityActive(): boolean {
    return this.isActive;
  }

  static getCurrentContext(): AbilityContext | null {
    return this.currentContext;
  }
}