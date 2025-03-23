// services/abilityRegistry.ts
import { AbilityContext } from '../types/abilities';
import { AbilityType } from '../types/abilityTypes';

type AbilityHandler = (context: AbilityContext) => void;

export class AbilityRegistry {
  private static handlers: Map<AbilityType, AbilityHandler> = new Map();

  static register(type: AbilityType, handler: AbilityHandler): void {
    this.handlers.set(type, handler);
  }

  static getHandler(type: AbilityType): AbilityHandler | undefined {
    return this.handlers.get(type);
  }

  static hasHandler(type: AbilityType): boolean {
    return this.handlers.has(type);
  }
}