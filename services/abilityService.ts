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
      rese