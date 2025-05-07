import type { CampCard, PersonCard, EventCard, WaterSiloCard } from "./cards";

/**
 * Game turn phases
 */
export enum TurnPhase {
  EVENTS = 'events',
  REPLENISH = 'replenish',
  ACTIONS = 'actions'
}

/**
 * Current game status
 */
export enum GameStatus {
  WAITING_FOR_PLAYERS = 'waitingForPlayers',
  CAMP_SELECTION = 'campSelection',
  IN_PROGRESS = 'inProgress',
  FINISHED = 'finished'
}

/**
 * Represents a column in the game board containing a camp and people protecting it
 */
export interface Column {
  campId: string;           // ID of the camp in this column
  people: PersonCard[];     // Array of people in front of the camp (max 2)
}

/**
 * Player model
 */
export interface Player {
  id: string;                   // Unique identifier
  name: string;                 // Player name
  camps: CampCard[];            // Array of three camp cards
  hand: (PersonCard | EventCard | WaterSiloCard)[];  // Cards in hand (may include Water Silo)
  water: number;                // Available water tokens
  raiders: EventCard | null;    // Player's raider event card
  waterSiloInPlayerArea: boolean; // Whether Water Silo is in its default slot
  columns: Column[];            // Player's columns (camps with people)
  eventQueue: {                 // Events in player's queue
    slot1: EventCard | null,
    slot2: EventCard | null,
    slot3: EventCard | null
  };
}

/**
 * Game event for tracking actions in the game
 */
export interface GameEvent {
  type: string;                 // Type of event
  playerIndex: 0 | 1;           // Index of player who triggered event
  timestamp: number;            // When the event occurred
  data: any;                    // Event-specific data
}

/**
 * Game state model
 */
export interface GameState {
  gameId: string;               // Unique game identifier
  players: [Player, Player];    // Two players (always exactly two)
  currentPlayerIndex: 0 | 1;    // Index of current player (0 or 1)
  turnPhase: TurnPhase;         // Current phase of the turn
  deck: (PersonCard | EventCard)[]; // Main deck
  discardPile: (PersonCard | EventCard)[]; // Discard pile
  gameStatus: GameStatus;       // Current game status
  turnNumber: number;           // Current turn number
  log: GameEvent[];             // Game event log
  
  // Turn tracking
  turnHistory: {
    peoplePlayedThisTurn: PersonCard[];
    abilitiesUsedThisTurn: string[]; // IDs of abilities used
    // Additional tracking will be added based on card requirements
  };
}

/**
 * Interaction state for handling player actions
 */
export enum InteractionType {
  NORMAL_TURN = 'normalTurn',    // Regular turn actions
  TARGET_SELECTION = 'targetSelection',  // Selecting targets for an ability
  RAID_RESPONSE = 'raidResponse', // Opponent choosing a camp for raid damage
  ABILITY_RESPONSE = 'abilityResponse', // Response to opponent's ability
  CAMP_SELECTION = 'campSelection' // Initial camp selection
}

/**
 * State for tracking current interaction
 */
export interface InteractionState {
  activePlayerIndex: 0 | 1;      // Which player can currently interact
  interactionType: InteractionType;  // What type of interaction is expected
  validTargets: string[];        // IDs of elements that can be interacted with
  waitingForResponse: boolean;   // Indicates system is waiting for player input
  pendingEffect?: any;           // Effect that will be applied after interaction
  timeoutDuration?: number;      // Optional timeout for interactions
}