import type { Effect } from "./effects";
import type { GameState } from "./gameState";

/**
 * Enum for card types in Radlands
 */
export enum CardType {
  CAMP = 'camp',
  PERSON = 'person',
  EVENT = 'event'
}

/**
 * Types of trait effects
 */
export enum TraitType {
  ENTRY_EFFECT = 'entryEffect',      // Effect when card enters play
  PERSISTENT_EFFECT = 'persistentEffect', // Continuous effect while in play
  RESTRICTION = 'restriction',       // Limitations on card
  CONDITION_CHANGE = 'conditionChange' // Changes how the card enters play
}

/**
 * Base card interface that all cards implement
 */
export interface BaseCard {
  id: string;           // Unique identifier
  name: string;         // Card name
  type: CardType;       // Camp, Person, or Event
  description: string;  // Card text/effect description
  imageUrl: string;     // Path to card image
  traits: Trait[];      // Card traits
}

/**
 * Trait definition
 */
export interface Trait {
  id: string;
  description: string;
  type: TraitType;
  effect: Effect;           // Uses the Effect interface from effects.ts
  condition?: (gameState: GameState) => boolean; // Optional condition for when trait applies
}

/**
 * Camp card
 */
export interface CampCard extends BaseCard {
  type: CardType.CAMP;
  ability: Ability;        // Camp's special ability
  traits: Trait[];         // Camp traits (active while not destroyed)
  startingCards: number;   // Number of cards granted at start
  isDamaged: boolean;      // Tracks if camp is damaged
  isDestroyed: boolean;    // Tracks if camp is destroyed
}

/**
 * Person card
 */
export interface PersonCard extends BaseCard {
  type: CardType.PERSON;
  waterCost: number;       // Water cost to play
  ability: Ability;        // Person's special ability
  traits: Trait[];         // Person traits (active while not damaged)
  isDamaged: boolean;      // Tracks if person is damaged
  isReady: boolean;        // Tracks if person can use abilities this turn
  isPunk: boolean;         // Whether this card is played as a Punk (face-down)
}

/**
 * Event card
 */
export interface EventCard extends BaseCard {
  type: CardType.EVENT;
  waterCost: number;        // Water cost to play
  effect: Effect;           // Event's effect when triggered
  eventNumber: 0 | 1 | 2 | 3;   // 0 means immediate effect, 1-3 determine starting position in queue
}

/**
 * Water Silo card
 */
export interface WaterSiloCard {
  id: string;
  name: string;
  type: 'waterSilo';
}

/**
 * Card ability definition
 */
export interface Ability {
  id: string;
  name: string;
  description: string;
  waterCost: number;
  effect: Effect;
  targetingRequirements?: TargetingRequirement[];
  isOneTimeUse?: boolean;
  usedThisTurn?: boolean;
  usedThisGame?: boolean;
}

/**
 * Defining what kinds of targets an ability can have
 */
export interface TargetingRequirement {
  type: TargetType;
  count: number;
  filter?: (gameState: GameState, card: any) => boolean;
  optional?: boolean;
}

/**
 * Types of targets for abilities
 */
export enum TargetType {
  CAMP = 'camp',
  PERSON = 'person',
  EVENT = 'event',
  PLAYER = 'player',
  ANY_CARD = 'anyCard'
}