import type { Ability } from "./cards";
import type { GameState } from "./gameState";

/**
 * Basic effect types
 */
export enum EffectType {
  DESTROY = 'destroy',
  DAMAGE = 'damage',
  INJURE = 'injure',
  RESTORE = 'restore',
  DRAW = 'draw',
  GAIN_PUNK = 'gainPunk',
  EXTRA_WATER = 'extraWater',
  RAID = 'raid',
  COMPOSITE = 'composite',  // For effects that combine multiple other effects
  CONDITIONAL = 'conditional', // For effects with conditions
  ABILITY_REFERENCE = 'abilityReference' // For abilities that use other abilities
}

/**
 * Base Effect interface
 */
export interface Effect {
  type: EffectType;
  execute: (gameState: GameState, params: any) => GameState;
  canBeExecuted: (gameState: GameState, params: any) => boolean;
}

/**
 * For simple effects with no special parameters
 */
export interface SimpleEffect extends Effect {
  type: Exclude<EffectType, EffectType.COMPOSITE | EffectType.CONDITIONAL | EffectType.ABILITY_REFERENCE>;
}

/**
 * For composite effects that combine multiple effects
 */
export interface CompositeEffect extends Effect {
  type: EffectType.COMPOSITE;
  effects: Effect[];
}

/**
 * For conditional effects
 */
export interface ConditionalEffect extends Effect {
  type: EffectType.CONDITIONAL;
  condition: (gameState: GameState, params: any) => boolean;
  effect: Effect;
  elseEffect?: Effect; // Optional effect to execute if condition is false
}

/**
 * For abilities that reference other abilities
 */
export interface AbilityReferenceEffect extends Effect {
  type: EffectType.ABILITY_REFERENCE;
  getTargetAbility: (gameState: GameState, params: any) => Ability;
}