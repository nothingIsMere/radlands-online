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
    // Clean up all ability-related states if we have a context
    if (this.currentContext) {
      resetAllAbilityStates(this.currentContext.stateSetters);
    }

    // Mark the ability as completed
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
}