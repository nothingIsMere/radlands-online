// services/abilityRegistry.ts

import { Ability, AbilityContext } from '../types/abilities';
import { AbilityService } from './abilityService';

type AbilityHandler = (context: AbilityContext) => void;

export class AbilityRegistry {
  private static handlers: Record<string, AbilityHandler> = {};
  
  static register(abilityType: string, handler: AbilityHandler): void {
    this.handlers[abilityType] = handler;
    console.log(`Registered handler for ability: ${abilityType}`);
  }
  
  static executeAbility(context: AbilityContext): void {
    const handler = this.handlers[context.ability.type];
    if (!handler) {
      console.error(`No handler registered for ability type: ${context.ability.type}`);
      return;
    }
    
    AbilityService.startAbility(context);
    handler(context);
  }
}