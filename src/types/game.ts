// game.ts updated
export type JunkEffect = 'extra_water' | 'draw_card' | 'raid' | 'injure' | 'gain_punk' | 'restore';

/**
 * Possible game phases in order
 */
 export type GamePhase = 'events' | 'replenish' | 'actions' | 'end';

 /**
  * Game turn state definition
  */
 export interface GameTurnState {
   currentTurn: 'left' | 'right';
   currentPhase: GamePhase;
   isFirstTurn: boolean;
 }

// Enhanced Card interface to handle all card types
export interface Card {
  // Common properties
  id: string;
  name: string;
  type: 'person' | 'event' | 'camp' | 'watersilo';
  
  // Game state properties
  isReady?: boolean;
  owner?: 'left' | 'right';
  isDamaged?: boolean;
  isProtected?: boolean;
  isPunk?: boolean;
  
  // Person card properties
  playCost?: number;           // Water cost to play the card
  
  // Camp card properties
  campDraw?: number;           // Initial cards drawn for this camp
  
  // Event card properties
  startingQueuePosition?: number;
  
  // Ability properties
  abilities?: Array<{
    effect: string;            // Effect description 
    cost: number;              // Water cost to use
    type: string;              // Type of ability (damage, restore, etc.)
    target?: string;           // Target type
    value?: number;            // Numeric value if applicable
  }>;
  
  // Trait properties
  traits?: string[];           // Special traits like "start_ready"
  
  // Junk effect property
  junkEffect?: JunkEffect;
  
  // UI properties
  description?: string;        // Display text
}

export interface PlayerState {
  handCards: Card[];            // Updated to match your actual implementation
  personSlots: (Card | null)[];
  eventSlots: (Card | null)[];
  campSlots: (Card | null)[];
  waterSiloInHand: boolean;
  waterCount: number;
  raidersLocation: 'default' | 'event1' | 'event2' | 'event3';
  peoplePlayedThisTurn: number;
}

export type Phase = 'events' | 'replenish' | 'actions';
export type Player = 'left' | 'right';

export interface GameState {
  currentTurn: Player;
  currentPhase: Phase;
  isFirstTurn: boolean;
}

// Additional state types we'll need for ability targeting
export type AbilityMode = null | 'damage' | 'restore' | 'protect' | 'swap' | 'restore_person_ready';
export interface AbilityContext {
  sourceCard: Card | null;
  sourceSlot: number | null;
  abilityType: string | null;
}