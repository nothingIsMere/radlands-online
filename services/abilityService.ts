// services/abilityService.ts

import { AbilityContext } from '../types/abilities';

export class AbilityService {
  private static activeAbility: AbilityContext | null = null;
  
  static startAbility(context: AbilityContext): void {
    this.activeAbility = context;
    console.log(`Starting ability: ${context.ability.type} from ${context.sourceCard.name}`);
  }
  
  static completeAbility(): void {
    if (!this.activeAbility) return;
    
    const context = this.activeAbility;
    this.activeAbility = null;
    
    console.log(`Completing ability: ${context.ability.type} from ${context.sourceCard.name}`);
  }
  
  static isAbilityActive(): boolean {
    return this.activeAbility !== null;
  }
  
  static getActiveAbility(): AbilityContext | null {
    return this.activeAbility;
  }
}