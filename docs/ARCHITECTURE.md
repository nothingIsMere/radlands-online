# Radlands Online - Technical Architecture

## Data Models

### Card Models

#### Base Card
interface BaseCard {
  id: string;           // Unique identifier
  name: string;         // Card name
  type: CardType;       // Camp, Person, or Event
  description: string;  // Card text/effect description
  imageUrl: string;     // Path to card image
  traits: Trait[];      // Card traits
}

enum CardType {
  CAMP = 'camp',
  PERSON = 'person',
  EVENT = 'event'
}

// Types of trait effects
enum TraitType {
  ENTRY_EFFECT = 'entryEffect',      // Effect when card enters play
  PERSISTENT_EFFECT = 'persistentEffect', // Continuous effect while in play
  RESTRICTION = 'restriction',       // Limitations on card
  CONDITION_CHANGE = 'conditionChange' // Changes how the card enters play
}

// Trait definition
interface Trait {
  id: string;
  description: string;
  type: TraitType;
  effect: Effect;           // Uses the Effect interface we defined earlier
  condition?: (gameState: GameState) => boolean; // Optional condition for when trait applies
}

#### Camp Card
interface CampCard extends BaseCard {
  type: CardType.CAMP;
  ability: Ability;        // Camp's special ability
  traits: Trait[];         // Camp traits (active while not destroyed)
  startingCards: number;   // Number of cards granted at start
  isDamaged: boolean;      // Tracks if camp is damaged
  isDestroyed: boolean;    // Tracks if camp is destroyed
}

#### Person Card
interface PersonCard extends BaseCard {
  type: CardType.PERSON;
  waterCost: number;       // Water cost to play
  ability: Ability;        // Person's special ability
  traits: Trait[];         // Person traits (active while not damaged)
  isDamaged: boolean;      // Tracks if person is damaged
  isReady: boolean;        // Tracks if person can use abilities this turn
  isPunk: boolean;         // Whether this card is played as a Punk (face-down)
}

#### Event Card
interface EventCard extends BaseCard {
  type: CardType.EVENT;
  waterCost: number;        // Water cost to play
  effect: Effect;           // Event's effect when triggered
  eventNumber: 0 | 1 | 2 | 3;   // 0 means immediate effect, 1-3 determine starting position in queue
}

#### Water Silo Card
interface WaterSiloCard {
  id: string;
  name: string;
  type: 'waterSilo';
}

### Abilities and Effects

#### Effect System
// Base Effect interface
interface Effect {
  type: EffectType;
  execute: (gameState: GameState, params: any) => GameState;
  canBeExecuted: (gameState: GameState, params: any) => boolean;
}

// Basic effect types
enum EffectType {
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

// For simple effects with no special parameters
interface SimpleEffect extends Effect {
  type: Exclude<EffectType, EffectType.COMPOSITE | EffectType.CONDITIONAL | EffectType.ABILITY_REFERENCE>;
}

// For composite effects that combine multiple effects
interface CompositeEffect extends Effect {
  type: EffectType.COMPOSITE;
  effects: Effect[];
}

// For conditional effects
interface ConditionalEffect extends Effect {
  type: EffectType.CONDITIONAL;
  condition: (gameState: GameState, params: any) => boolean;
  effect: Effect;
  elseEffect?: Effect; // Optional effect to execute if condition is false
}

// For abilities that reference other abilities
interface AbilityReferenceEffect extends Effect {
  type: EffectType.ABILITY_REFERENCE;
  getTargetAbility: (gameState: GameState, params: any) => Ability;
}

#### Ability System
// Card ability definition
interface Ability {
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

// Defining what kinds of targets an ability can have
interface TargetingRequirement {
  type: TargetType;
  count: number;
  filter?: (gameState: GameState, card: any) => boolean;
  optional?: boolean;
}

enum TargetType {
  CAMP = 'camp',
  PERSON = 'person',
  EVENT = 'event',
  PLAYER = 'player',
  ANY_CARD = 'anyCard'
}

interface Column {
  campId: string;           // ID of the camp in this column
  people: PersonCard[];     // Array of people in front of the camp (max 2)
}

### Player Model
interface Player {
  id: string;                   // Unique identifier
  name: string;                 // Player name
  camps: CampCard[];            // Array of three camp cards
  hand: (PersonCard | EventCard | WaterSiloCard)[];  // Cards in hand (may include Water Silo)
  water: number;                // Available water tokens
  raiders: EventCard | null;    // Player's raider event card
  waterSiloInPlayerArea: boolean; // Whether Water Silo is in its default slot
  eventQueue: EventCard[];      // Events in player's queue
  columns: Column[];
  eventQueue: {
    slot1: EventCard | null,
    slot2: EventCard | null,
    slot3: EventCard | null
  };
}

### Game State Model (Preliminary)
interface GameState {
  gameId: string;               // Unique game identifier
  players: [Player, Player];    // Two players (always exactly two)
  currentPlayerIndex: 0 | 1;    // Index of current player (0 or 1)
  turnPhase: TurnPhase;         // Current phase of the turn
  deck: (PersonCard | EventCard)[]; // Main deck
  discardPile: (PersonCard | EventCard)[]; // Discard pile
  gameStatus: GameStatus;       // Current game status
  turnNumber: number;           // Current turn number
  log: GameEvent[];             // Game event log
  
  // Turn tracking (to be expanded based on card analysis)
  turnHistory: {
    peoplePlayedThisTurn: PersonCard[];
    abilitiesUsedThisTurn: string[]; // IDs of abilities used
    // Additional tracking will be added based on card requirements
  };
}

enum TurnPhase {
  EVENTS = 'events',
  REPLENISH = 'replenish',
  ACTIONS = 'actions'
}

enum GameStatus {
  WAITING_FOR_PLAYERS = 'waitingForPlayers',
  CAMP_SELECTION = 'campSelection',
  IN_PROGRESS = 'inProgress',
  FINISHED = 'finished'
}

interface GameEvent {
  type: string;                 // Type of event
  playerIndex: 0 | 1;           // Index of player who triggered event
  timestamp: number;            // When the event occurred
  data: any;                    // Event-specific data
}

## UI Model

### Component Hierarchy
- GameBoard
  |- PlayerArea (Current Player)
  |  |- Hand
  |  |  |- Card
  |  |- Resources
  |  |  |- WaterTokens
  |  |  |- WaterSilo
  |  |  |- Raiders
  |  |- Camps
  |  |  |- Camp
  |  |  |- People (protecting camp)
  |  |- EventQueue
  |
  |- PlayerArea (Opponent)
  |  |- Hand (face down)
  |  |- Resources
  |  |  |- WaterTokens
  |  |  |- WaterSilo
  |  |  |- Raiders
  |  |- Camps
  |  |  |- Camp
  |  |  |- People (protecting camp)
  |  |- EventQueue
  |
  |- GameControls
  |  |- PhaseIndicator
  |  |- EndTurnButton
  |  |- UndoButton
  |
  |- GameLog
  |- DeckAndDiscard

## Player Interactions

interface InteractionState {
  activePlayerIndex: 0 | 1;      // Which player can currently interact
  interactionType: InteractionType;  // What type of interaction is expected
  validTargets: string[];        // IDs of elements that can be interacted with
  waitingForResponse: boolean;   // Indicates system is waiting for player input
  pendingEffect?: Effect;        // Effect that will be applied after interaction
  timeoutDuration?: number;      // Optional timeout for interactions
}

enum InteractionType {
  NORMAL_TURN = 'normalTurn',    // Regular turn actions
  TARGET_SELECTION = 'targetSelection',  // Selecting targets for an ability
  RAID_RESPONSE = 'raidResponse', // Opponent choosing a camp for raid damage
  ABILITY_RESPONSE = 'abilityResponse', // Response to opponent's ability
  CAMP_SELECTION = 'campSelection' // Initial camp selection
}

### Card Interaction Methods

- **Card Modal Interface**:
  - Clicking on any card opens a centered modal with large card view
  - Modal includes context-appropriate action buttons based on card type and location
  - For hand cards, horizontal scrolling allows viewing all cards in hand
    - **Two-Step Card Placement**:
    - When player selects "Play" on a person card in the modal
    - Modal minimizes but remains partially visible
    - Game board highlights valid placement locations
    - Player clicks on a valid column slot to complete the placement
    - Similar approach for abilities that require targeting
- **Ability Activation**: 
  - Click on a card with an available ability
  - System highlights ability if enough water and card is ready
  - If targeting required, valid targets are highlighted
- **Junking Cards**: Right-click on a card in hand to view junk options

### Game Flow Control
- **Phase Transitions**: 
  - Events phase runs automatically showing event progression
  - Replenish phase automatically draws a card for the player and updates water tokens to 3
  - Actions phase activates all interactive elements
- **Turn End**: 
  - "End Turn" button becomes active when actions are available
  - Confirmation dialog appears if player has unused water 
- **Undo Requests** (optional):
  - Player can request to undo their most recent action
  - Opponent receives notification and must approve the request
  - If not approved within 30 seconds, request is automatically denied

### Visual Feedback
- **State Indicators**: The following card states must be visually distinguishable:
  - Damaged vs. undamaged cards
  - Ready vs. not ready person cards
  - Protected vs. unprotected cards
  - Destroyed vs. undestroyed camps
  - Regular person cards vs. Punks (which show a generic back instead of card face)
- **Valid Targets**: When an action requires targeting, valid targets are highlighted

### Card Detail Views
- **Card Modal Interface**:
  - Clicking on any card (in hand or on board) opens a centered modal with large card view
  - Modal includes context-appropriate action buttons based on card type and location:
    - Hand cards: Play, Junk, Close
    - Person cards in play: Use Ability, Close
    - Camp cards: Use Ability, Close
    - Event cards in queue: Close (informational only)
  - When viewing hand cards, arrow buttons or horizontal swiping allows scrolling through all hand cards without closing the modal
  - For board cards, the modal shows only the selected card

### Contextual Help
- **Rules Reference**: Accessible reference showing relevant game rules

## Game Flow

### Game Setup
- Create game and initialize decks
- Players join and are assigned positions
- Deal 6 camp cards to each player
- Players select 3 camps each
- Calculate starting hand size based on camps
- Deal appropriate cards to each player
- Set up Water Silo and Raiders cards
- Randomly determine first player (digital equivalent of flipping a water token)
- Begin first turn with special water token rule (first player gets 1 water)

### Turn Sequence
1. **Events Phase**
   - Resolve events in position 1
   - Move all other events forward
   
2. **Replenish Phase**
   - Draw a card
   - Replenish water tokens (1 for first player on first turn, 3 otherwise)
   
3. **Actions Phase**
   - Players can take any number of actions while they have resources
   - Actions include playing cards, using abilities, and junking cards
   
4. **End Turn**
   - Pass turn to opponent
   - If both players have taken a turn, advance turn counter

## Application Flow

### App Launch & Main Menu
- Splash Screen
  - Animated logo
  - Transition to main menu
- Main Menu
  - New Game option
  - Join Game option (via code)
  - Rules
  - Settings (volume, animation speed)
  - Exit button
- New Game Flow
  - Game code generation
  - Waiting screen with shareable link
  - Opponent join notification

### Game Setup Sequence
- Connection confirmation screen
- Camp selection interface
  - Each player selects 3 camps from their 6 options
  - When both players have selected, camps are revealed to both players
- First player determination animation (water token flip)
- Transition to game board
  - Initial hand dealt based on camp values
  - First player starts with 1 water token

### Game End Flow
- Victory/Defeat Screen
  - Dynamic announcement
  - Victory animation
  - Game statistics display
- Post-Game Options
  - Play Again button
  - Return to Main Menu button
  - Exit Game button

### State Transitions
enum ApplicationState {
  SPLASH_SCREEN,
  MAIN_MENU,
  WAITING_FOR_OPPONENT,
  CAMP_SELECTION,
  GAME_IN_PROGRESS,
  GAME_OVER
}

## Next Steps

1. Card Analysis: Go through each card to identify specific game state tracking requirements
2. Game Flow Implementation: Define turn phases and player actions in detail
3. UI Design: Create wireframes for the game interface
4. Network Protocol: Define client-server communication for multiplayer
