import { useState, FC, useEffect } from 'react';
import './GameBoard.css';
import { 
  GameState, 
  Player, 
  TurnPhase, 
  GameStatus,
  Column, 
  CampCard, 
  PersonCard, 
  EventCard, 
  WaterSiloCard,
  CardType
} from '../../models';

// Import card rendering components
import CampCardComponent from '../CampCard';
import PersonCardComponent from '../PersonCard';
import EventCardComponent from '../EventCard';
import WaterSiloComponent from '../WaterSilo';
import CardModal from '../CardModal';
import TestControls from '../TestControls';
import GameLog from '../GameLog';

// Initial test game state
const createInitialGameState = (): GameState => {
  // Create some example camp cards
  const playerCamps: CampCard[] = [
    {
      id: 'player-camp-1',
      name: 'Railgun',
      type: CardType.CAMP,
      description: 'A basic camp with a damage ability',
      imageUrl: '/camps/railgun.png',
      traits: [],
      ability: {
        id: 'railgun-ability',
        name: 'Damage',
        description: 'Deal damage to an unprotected enemy card',
        waterCost: 2,
        effect: {
          type: 'damage',
          execute: () => { throw new Error('Not implemented'); },
          canBeExecuted: () => true
        }
      },
      startingCards: 0,
      isDamaged: false,
      isDestroyed: false
    },
    {
      id: 'player-camp-2',
      name: 'Outpost',
      type: CardType.CAMP,
      description: 'A camp with raid and restore abilities',
      imageUrl: '/camps/outpost.png',
      traits: [],
      ability: {
        id: 'outpost-ability',
        name: 'Restore',
        description: 'Restore a damaged card',
        waterCost: 2,
        effect: {
          type: 'restore',
          execute: () => { throw new Error('Not implemented'); },
          canBeExecuted: () => true
        }
      },
      startingCards: 1,
      isDamaged: false,
      isDestroyed: false
    },
    {
      id: 'player-camp-3',
      name: 'Cannon',
      type: CardType.CAMP,
      description: 'A camp that starts damaged but deals damage when restored',
      imageUrl: '/camps/cannon.png',
      traits: [],
      ability: {
        id: 'cannon-ability',
        name: 'Damage',
        description: 'If this camp is undamaged, damage a card',
        waterCost: 2,
        effect: {
          type: 'damage',
          execute: () => { throw new Error('Not implemented'); },
          canBeExecuted: () => true
        }
      },
      startingCards: 2,
      isDamaged: true,
      isDestroyed: false
    }
  ];

  const opponentCamps: CampCard[] = [
    {
      id: 'opponent-camp-1',
      name: 'Supply Depot',
      type: CardType.CAMP,
      description: 'Draw cards and filter your hand',
      imageUrl: '/camps/supply-depot.png',
      traits: [],
      ability: {
        id: 'supply-depot-ability',
        name: 'Draw',
        description: 'Draw 2 cards, then discard 1',
        waterCost: 2,
        effect: {
          type: 'draw',
          execute: () => { throw new Error('Not implemented'); },
          canBeExecuted: () => true
        }
      },
      startingCards: 2,
      isDamaged: false,
      isDestroyed: false
    },
    {
      id: 'opponent-camp-2',
      name: 'Training Camp',
      type: CardType.CAMP,
      description: 'A camp that requires specific column setup',
      imageUrl: '/camps/training-camp.png',
      traits: [],
      ability: {
        id: 'training-camp-ability',
        name: 'Damage',
        description: 'If this column has exactly 2 people, damage a card',
        waterCost: 2,
        effect: {
          type: 'damage',
          execute: () => { throw new Error('Not implemented'); },
          canBeExecuted: () => true
        }
      },
      startingCards: 2,
      isDamaged: false,
      isDestroyed: false
    },
    {
      id: 'opponent-camp-3',
      name: 'Watchtower',
      type: CardType.CAMP,
      description: 'A camp that reacts to events',
      imageUrl: '/camps/watchtower.png',
      traits: [],
      ability: {
        id: 'watchtower-ability',
        name: 'Damage',
        description: 'If any event was resolved this turn, damage a card',
        waterCost: 1,
        effect: {
          type: 'damage',
          execute: () => { throw new Error('Not implemented'); },
          canBeExecuted: () => true
        }
      },
      startingCards: 0,
      isDamaged: false,
      isDestroyed: true
    }
  ];

  // Create some example columns with people
  const playerColumns: Column[] = [
    {
      campId: 'player-camp-1',
      people: [{
        id: 'player-person-1',
        name: 'Vigilante',
        type: CardType.PERSON,
        description: 'A person with an injure ability',
        imageUrl: '/persons/vigilante.png',
        traits: [],
        waterCost: 1,
        ability: {
          id: 'vigilante-ability',
          name: 'Injure',
          description: 'Injure an unprotected enemy person',
          waterCost: 1,
          effect: {
            type: 'injure',
            execute: () => { throw new Error('Not implemented'); },
            canBeExecuted: () => true
          }
        },
        isDamaged: false,
        isReady: true,
        isPunk: false
      }]
    },
    {
      campId: 'player-camp-2',
      people: [{
        id: 'player-person-2',
        name: 'Punk',
        type: CardType.PERSON,
        description: 'A basic punk with no abilities',
        imageUrl: '/persons/punk.png',
        traits: [],
        waterCost: 0,
        ability: {
          id: 'no-ability',
          name: 'None',
          description: 'This card has no ability',
          waterCost: 0,
          effect: {
            type: 'composite',
            effects: [],
            execute: () => { throw new Error('Not implemented'); },
            canBeExecuted: () => false
          }
        },
        isDamaged: false,
        isReady: true,
        isPunk: true
      }]
    },
    {
      campId: 'player-camp-3',
      people: []
    }
  ];

  const opponentColumns: Column[] = [
    {
      campId: 'opponent-camp-1',
      people: []
    },
    {
      campId: 'opponent-camp-2',
      people: [{
        id: 'opponent-person-1',
        name: 'Scout',
        type: CardType.PERSON,
        description: 'A person with a raid ability',
        imageUrl: '/persons/scout.png',
        traits: [],
        waterCost: 1,
        ability: {
          id: 'scout-ability',
          name: 'Raid',
          description: 'Play or advance your Raiders event',
          waterCost: 1,
          effect: {
            type: 'raid',
            execute: () => { throw new Error('Not implemented'); },
            canBeExecuted: () => true
          }
        },
        isDamaged: true,
        isReady: false,
        isPunk: false
      }, {
        id: 'opponent-person-2',
        name: 'Mimic',
        type: CardType.PERSON,
        description: 'A person that can copy abilities',
        imageUrl: '/persons/mimic.png',
        traits: [],
        waterCost: 1,
        ability: {
          id: 'mimic-ability',
          name: 'Mimic',
          description: 'Use an ability from another card',
          waterCost: 1,
          effect: {
            type: 'ability_reference',
            execute: () => { throw new Error('Not implemented'); },
            canBeExecuted: () => true
          }
        },
        isDamaged: false,
        isReady: true,
        isPunk: false
      }]
    },
    {
      campId: 'opponent-camp-3',
      people: []
    }
  ];

  // Create some example hand cards
  const playerHandCards: (PersonCard | EventCard | WaterSiloCard)[] = [
    {
      id: 'player-hand-1',
      name: 'Mutant',
      type: CardType.PERSON,
      description: 'A person with multiple effect options',
      imageUrl: '/persons/mutant.png',
      traits: [],
      waterCost: 1,
      ability: {
        id: 'mutant-ability',
        name: 'Damage/Restore',
        description: 'Damage and/or Restore, then damage this card',
        waterCost: 0,
        effect: {
          type: 'composite',
          effects: [],
          execute: () => { throw new Error('Not implemented'); },
          canBeExecuted: () => true
        }
      },
      isDamaged: false,
      isReady: false,
      isPunk: false
    },
    {
      id: 'player-hand-2',
      name: 'Strafe',
      type: CardType.EVENT,
      description: 'Injure all unprotected enemies',
      imageUrl: '/events/strafe.png',
      traits: [],
      waterCost: 2,
      effect: {
        type: 'injure',
        execute: () => { throw new Error('Not implemented'); },
        canBeExecuted: () => true
      },
      eventNumber: 0
    },
    {
      id: 'water-silo',
      name: 'Water Silo',
      type: 'waterSilo'
    }
  ];

  // Create player objects
  const player1: Player = {
    id: 'player1',
    name: 'Player',
    camps: playerCamps,
    hand: playerHandCards,
    water: 3,
    raiders: null,
    waterSiloInPlayerArea: false, // Currently in hand
    columns: playerColumns,
    eventQueue: {
      slot1: null,
      slot2: null,
      slot3: null
    }
  };

  const player2: Player = {
    id: 'player2',
    name: 'Opponent',
    camps: opponentCamps,
    hand: [], // Opponent's hand is hidden
    water: 2,
    raiders: null,
    waterSiloInPlayerArea: true, // In play area
    columns: opponentColumns,
    eventQueue: {
      slot1: {
        id: 'opponent-event-1',
        name: 'Raiders',
        type: CardType.EVENT,
        description: 'When resolved, opponent damages one of their camps',
        imageUrl: '/events/raiders.png',
        traits: [],
        waterCost: 0,
        effect: {
          type: 'raid',
          execute: () => { throw new Error('Not implemented'); },
          canBeExecuted: () => true
        },
        eventNumber: 1
      },
      slot2: null,
      slot3: null
    }
  };

  // Return the complete game state
  return {
    gameId: 'test-game-1',
    players: [player1, player2],
    currentPlayerIndex: 0, // Player 1 starts
    turnPhase: TurnPhase.ACTIONS, // Start in actions phase
    deck: [], // Not showing the deck for testing
    discardPile: [], // Not showing discard for testing
    gameStatus: GameStatus.IN_PROGRESS,
    turnNumber: 1,
    log: [],
    turnHistory: {
      peoplePlayedThisTurn: [],
      abilitiesUsedThisTurn: []
    }
  };
};

interface GameBoardProps {
  initialState?: GameState;
}

const GameBoard: FC<GameBoardProps> = ({ initialState }) => {
  const [gameState, setGameState] = useState<GameState>(initialState || createInitialGameState());
  const [showCardModal, setShowCardModal] = useState<boolean>(false);
  const [selectedCard, setSelectedCard] = useState<PersonCard | EventCard | WaterSiloCard | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0);
  const [isPlacementMode, setIsPlacementMode] = useState<boolean>(false);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number | null>(null);
  const [isGameLogVisible, setIsGameLogVisible] = useState<boolean>(false);
  const [processingEvents, setProcessingEvents] = useState<boolean>(false);
  // Add debugging and guard flags
  const [eventsPhaseCallCount, setEventsPhaseCallCount] = useState<number>(0);
  const [eventsProcessedThisTurn, setEventsProcessedThisTurn] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<number>(0); // 0: none, 1: processing

  // Fixed player positions - Player 1 on right, Player 2 on left
  const player1 = gameState.players[0]; // Will always be on the right
  const player2 = gameState.players[1]; // Will always be on the left
  
  // Determine which player is active based on the currentPlayerIndex
  const isPlayer1Active = gameState.currentPlayerIndex === 0;
  const isPlayer2Active = gameState.currentPlayerIndex === 1;
  
  // Get active player's cards and water
  const activePlayer = isPlayer1Active ? player1 : player2;
  const activePlayerCards = activePlayer.hand;
  const activePlayerWater = activePlayer.water;

  // Debugging helper to stringify the event queue state
  const logEventQueueState = (player: Player): string => {
    const slot1 = player.eventQueue.slot1 ? `${player.eventQueue.slot1.name} (#${player.eventQueue.slot1.eventNumber})` : 'empty';
    const slot2 = player.eventQueue.slot2 ? `${player.eventQueue.slot2.name} (#${player.eventQueue.slot2.eventNumber})` : 'empty';
    const slot3 = player.eventQueue.slot3 ? `${player.eventQueue.slot3.name} (#${player.eventQueue.slot3.eventNumber})` : 'empty';
    return `[Pos 1: ${slot1}] [Pos 2: ${slot2}] [Pos 3: ${slot3}]`;
  };
  
  // Simplified Events Phase Processing without animations
  const processEventsPhase = () => {
    // First guard: Check if we're already processing events
    if (processingEvents) {
      console.warn(`[${new Date().toLocaleTimeString()}] GUARD TRIGGERED: Already processing events, skipping this call`);
      console.trace('Call stack that tried to process events again:');
      return;
    }
    
    // Second guard: Check if we've already processed events this turn
    if (eventsProcessedThisTurn) {
      console.warn(`[${new Date().toLocaleTimeString()}] GUARD TRIGGERED: Events already processed this turn! Current call count: ${eventsPhaseCallCount}`);
      console.trace('Call stack that tried to process events twice in one turn:');
      return;
    }
    
    // Set both guard flags
    setProcessingEvents(true);
    setEventsProcessedThisTurn(true);
    
    // Increment and log the call counter for debugging
    const newCallCount = eventsPhaseCallCount + 1;
    setEventsPhaseCallCount(newCallCount);
    
    // Save processing start time for debugging
    const startTime = Date.now();
    const startTimeString = new Date().toLocaleTimeString();
    
    console.log(`❗❗❗ [${startTimeString}] STARTING EVENT PROCESSING #${newCallCount} - THIS SHOULD HAPPEN ONCE PER TURN ONLY ❗❗❗`);
    
    // Set step indicator for debugging overlay
    setProcessingStep(1);
    
    // Process events in a single, atomic update
    setGameState(prevState => {
      const currentPlayerIndex = prevState.currentPlayerIndex;
      const currentPlayer = prevState.players[currentPlayerIndex];
      const updatedPlayers = [...prevState.players];
      const updatedPlayer = {...currentPlayer};
      
      // Log detailed initial state
      console.log(`[${new Date().toLocaleTimeString()}] Current player: ${updatedPlayer.name} (index: ${currentPlayerIndex})`);
      console.log(`[${new Date().toLocaleTimeString()}] Current turn: ${prevState.turnNumber}, Phase: ${prevState.turnPhase}`);
      
      const initialEventState = {
        slot1: updatedPlayer.eventQueue.slot1 ? `${updatedPlayer.eventQueue.slot1.name} (#${updatedPlayer.eventQueue.slot1.eventNumber})` : 'empty',
        slot2: updatedPlayer.eventQueue.slot2 ? `${updatedPlayer.eventQueue.slot2.name} (#${updatedPlayer.eventQueue.slot2.eventNumber})` : 'empty',
        slot3: updatedPlayer.eventQueue.slot3 ? `${updatedPlayer.eventQueue.slot3.name} (#${updatedPlayer.eventQueue.slot3.eventNumber})` : 'empty'
      };
      
      console.log(`[${new Date().toLocaleTimeString()}] INITIAL EVENT QUEUE: `, JSON.stringify(initialEventState, null, 2));
      
      // Create log entry for initial state
      const queueStateBeforeMsg = `Event queue before processing: ${logEventQueueState(updatedPlayer)}`;
      const newLogEntries = [...prevState.log, {
        message: `❗ EVENTS PHASE #${newCallCount} START: ${queueStateBeforeMsg}`,
        timestamp: new Date().toISOString()
      }];
      
      // CRITICAL: Create temporary copies of current events
      const event1 = updatedPlayer.eventQueue.slot1 ? {...updatedPlayer.eventQueue.slot1} : null;
      const event2 = updatedPlayer.eventQueue.slot2 ? {...updatedPlayer.eventQueue.slot2} : null;
      const event3 = updatedPlayer.eventQueue.slot3 ? {...updatedPlayer.eventQueue.slot3} : null;
      
      console.log(`[${new Date().toLocaleTimeString()}] COPIED EVENT REFERENCES:`);
      console.log(`  Slot1: ${event1 ? event1.name : 'null'}`);
      console.log(`  Slot2: ${event2 ? event2.name : 'null'}`);
      console.log(`  Slot3: ${event3 ? event3.name : 'null'}`);
      
      // CRITICAL: Clear all slots FIRST - prevents double movement
      console.log(`[${new Date().toLocaleTimeString()}] CLEARING ALL EVENT SLOTS`);
      updatedPlayer.eventQueue = {
        slot1: null,
        slot2: null,
        slot3: null
      };
      
      let updatedDiscardPile = [...prevState.discardPile];
      
      // Process event in position 1 (add to discard)
      if (event1) {
        console.log(`[${new Date().toLocaleTimeString()}] RESOLVING EVENT: ${event1.name} from position 1`);
        
        const resolutionMsg = `${updatedPlayer.name}'s event "${event1.name}" (#${event1.eventNumber}) resolved from position 1. Effect: ${event1.description}`;
        newLogEntries.push({
          message: resolutionMsg,
          timestamp: new Date().toISOString()
        });
        
        // Add to discard pile
        updatedDiscardPile.push(event1);
      } else {
        console.log(`[${new Date().toLocaleTimeString()}] No event in position 1 to resolve`);
        newLogEntries.push({
          message: `No event in position 1 to resolve.`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Move event from position 2 to position 1
      if (event2) {
        console.log(`[${new Date().toLocaleTimeString()}] MOVING EVENT: ${event2.name} from position 2 to position 1`);
        
        const movementMsg = `${updatedPlayer.name}'s event "${event2.name}" (#${event2.eventNumber}) advanced from position 2 to position 1`;
        newLogEntries.push({
          message: movementMsg,
          timestamp: new Date().toISOString()
        });
        
        // Move to slot 1
        updatedPlayer.eventQueue.slot1 = event2;
      } else {
        console.log(`[${new Date().toLocaleTimeString()}] No event in position 2 to move`);
      }
      
      // Move event from position 3 to position 2
      if (event3) {
        console.log(`[${new Date().toLocaleTimeString()}] MOVING EVENT: ${event3.name} from position 3 to position 2`);
        
        const movementMsg = `${updatedPlayer.name}'s event "${event3.name}" (#${event3.eventNumber}) advanced from position 3 to position 2`;
        newLogEntries.push({
          message: movementMsg,
          timestamp: new Date().toISOString()
        });
        
        // Move to slot 2
        updatedPlayer.eventQueue.slot2 = event3;
      } else {
        console.log(`[${new Date().toLocaleTimeString()}] No event in position 3 to move`);
      }
      
      // Update the player in the players array
      updatedPlayers[currentPlayerIndex] = updatedPlayer;
      
      // Log the final state for debugging
      const finalEventState = {
        slot1: updatedPlayer.eventQueue.slot1 ? `${updatedPlayer.eventQueue.slot1.name} (#${updatedPlayer.eventQueue.slot1.eventNumber})` : 'empty',
        slot2: updatedPlayer.eventQueue.slot2 ? `${updatedPlayer.eventQueue.slot2.name} (#${updatedPlayer.eventQueue.slot2.eventNumber})` : 'empty',
        slot3: updatedPlayer.eventQueue.slot3 ? `${updatedPlayer.eventQueue.slot3.name} (#${updatedPlayer.eventQueue.slot3.eventNumber})` : 'empty'
      };
      
      console.log(`[${new Date().toLocaleTimeString()}] FINAL EVENT QUEUE: `, JSON.stringify(finalEventState, null, 2));
      
      // Add a summary to the game log
      const queueStateAfterMsg = `Event queue after processing: ${logEventQueueState(updatedPlayer)}`;
      newLogEntries.push({
        message: `❗ EVENTS PHASE #${newCallCount} COMPLETE: ${queueStateAfterMsg}`,
        timestamp: new Date().toISOString()
      });
      
      // Return the updated state
      return {
        ...prevState,
        players: updatedPlayers,
        discardPile: updatedDiscardPile,
        log: newLogEntries
      };
    });
    
    // CRITICAL: Schedule cleanup with a shorter delay - no animations to wait for
    // This function will ONLY run after event processing is complete
    setTimeout(() => {
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      console.log(`❗❗❗ [${new Date().toLocaleTimeString()}] FINISHED EVENT PROCESSING #${newCallCount} after ${processingTime}ms ❗❗❗`);
      
      // Reset the processing step
      setProcessingStep(0);
      
      // VERY IMPORTANT: Only now do we clear the processing flag
      // This must happen after all state updates are complete
      setProcessingEvents(false);
      
      // The eventsProcessedThisTurn flag will be cleared only at the end of the turn
      console.log(`[${new Date().toLocaleTimeString()}] Processing flags updated: processingEvents=false, eventsProcessedThisTurn=true`);
      
    }, 250); // Shorter timeout since we don't have animations to wait for
  };
  
  // Setup test events
  const setupEventsTest = () => {
    // Reset the event processing flags to ensure they can be processed
    setEventsProcessedThisTurn(false);
    setEventsPhaseCallCount(0);
    setProcessingStep(0);
    
    // Create test events
    const testEvents: EventCard[] = [
      {
        id: 'test-event-1',
        name: 'Test Event 1 (Event #1)',
        type: CardType.EVENT,
        description: 'This would damage an enemy card if implemented',
        imageUrl: '/events/test1.png',
        traits: [],
        waterCost: 1,
        effect: {
          type: 'damage',
          execute: () => { console.log('Event 1 executed'); },
          canBeExecuted: () => true
        },
        eventNumber: 1
      },
      {
        id: 'test-event-2',
        name: 'Test Event 2 (Event #2)',
        type: CardType.EVENT,
        description: 'This would restore a card if implemented',
        imageUrl: '/events/test2.png',
        traits: [],
        waterCost: 2,
        effect: {
          type: 'restore',
          execute: () => { console.log('Event 2 executed'); },
          canBeExecuted: () => true
        },
        eventNumber: 2
      },
      {
        id: 'test-event-3',
        name: 'Test Event 3 (Event #3)',
        type: CardType.EVENT,
        description: 'This would draw cards if implemented',
        imageUrl: '/events/test3.png',
        traits: [],
        waterCost: 1,
        effect: {
          type: 'draw',
          execute: () => { console.log('Event 3 executed'); },
          canBeExecuted: () => true
        },
        eventNumber: 3
      },
      // This event has number 1, so it would normally go into slot 1
      {
        id: 'test-event-4',
        name: 'Test Event 4 (Event #1)',
        type: CardType.EVENT,
        description: 'This would deal damage to all cards if implemented',
        imageUrl: '/events/test4.png',
        traits: [],
        waterCost: 3,
        effect: {
          type: 'damage_all',
          execute: () => { console.log('Event 4 executed'); },
          canBeExecuted: () => true
        },
        eventNumber: 1
      }
    ];
    
    setGameState(prevState => {
      const updatedPlayers = [...prevState.players];
      const updatedLog = [...prevState.log];
      
      // Setup Player 1's event queue - demonstrate proper placement based on event numbers
      // Event #1 goes in slot1, Event #2 goes in slot2, Event #3 goes in slot3
      updatedPlayers[0] = {
        ...updatedPlayers[0],
        eventQueue: {
          slot1: testEvents[0], // Event #1 in slot1
          slot2: testEvents[1], // Event #2 in slot2
          slot3: testEvents[2]  // Event #3 in slot3
        }
      };
      
      updatedLog.push({
        message: 'Player 1 event queue setup: Event #1 in position 1, Event #2 in position 2, Event #3 in position 3',
        timestamp: new Date().toISOString()
      });
      
      // Setup Player 2's event queue - demonstrate event number placement rules
      // Event #1 (test-event-4) would go in slot1, but that's taken, so it goes in slot2
      // Another Event #2 can't be placed because slots 2 and 3 are occupied
      updatedPlayers[1] = {
        ...updatedPlayers[1],
        eventQueue: {
          slot1: { // Event #1 in slot1
            ...testEvents[0],
            id: 'player2-event-1'
          },
          slot2: { // Another Event #1 in slot2 (moved forward because slot1 is taken)
            ...testEvents[3],
            id: 'player2-event-2'
          },
          slot3: { // Event #3 in slot3
            ...testEvents[2],
            id: 'player2-event-3'
          }
        }
      };
      
      updatedLog.push({
        message: 'Player 2 event queue setup: Event #1 in position 1, Event #1 in position 2 (slot1 was occupied), Event #3 in position 3',
        timestamp: new Date().toISOString()
      });
      
      updatedLog.push({
        message: 'Test events setup complete. Both players now have events in their queues according to event number placement rules. Event processing flags have been reset.',
        timestamp: new Date().toISOString()
      });
      
      return {
        ...prevState,
        players: updatedPlayers,
        log: updatedLog,
        turnPhase: TurnPhase.EVENTS // Set to events phase to allow immediate testing
      };
    });
    
    // Show the game log
    setIsGameLogVisible(true);
  };
  
  // Reset the game state
  const resetGameState = () => {
    // Reset all event processing flags
    setEventsProcessedThisTurn(false);
    setEventsPhaseCallCount(0);
    setProcessingStep(0);
    setProcessingEvents(false);
    
    setGameState(createInitialGameState());
    
    // Add a log entry
    const timestamp = new Date().toISOString();
    setGameState(prevState => ({
      ...prevState,
      log: [...prevState.log, {
        message: 'Game state has been reset to initial state. All event processing flags have been reset.',
        timestamp
      }]
    }));
    
    // Show a reminder about the new event processing logic
    console.log('REMINDER: Events processing now follows the correct sequence of clearing all slots first, then moving cards forward.');
  };
  
  // Toggle game log visibility
  const toggleGameLog = () => {
    setIsGameLogVisible(!isGameLogVisible);
  };
  
  // Force the game into Events phase with better debugging
  const forceEventsPhase = () => {
    console.log(`[${new Date().toLocaleTimeString()}] FORCE EVENTS PHASE triggered`);
    
    // Reset all event processing flags to ensure a clean state
    setEventsProcessedThisTurn(false);
    setEventsPhaseCallCount(0);
    setProcessingEvents(false);
    setProcessingStep(0);
    
    console.log(`[${new Date().toLocaleTimeString()}] All event processing flags reset to initial state`);
    
    // First update the game phase
    setGameState(prevState => {
      const timestamp = new Date().toISOString();
      const updatedLog = [...prevState.log, {
        message: '⚠️ Game phase FORCED to EVENTS phase. All event processing flags have been reset.',
        timestamp
      }];
      
      return {
        ...prevState,
        turnPhase: TurnPhase.EVENTS,
        log: updatedLog
      };
    });
    
    // Give state update time to complete before running processEventsPhase
    console.log(`[${new Date().toLocaleTimeString()}] Scheduling event processing to start after state update`);
    
    setTimeout(() => {
      console.log(`[${new Date().toLocaleTimeString()}] Now calling processEventsPhase() after force`);
      processEventsPhase();
    }, 1000);
  };
  
  // Handle end turn button click - fixed to prevent multiple event processing
  const handleEndTurn = () => {
    console.log(`[${new Date().toLocaleTimeString()}] END TURN triggered - starting turn transition`);
    
    // IMPORTANT: Reset the events processed flag for the new turn
    // We must do this before setting the new turn state
    setEventsProcessedThisTurn(false);
    setEventsPhaseCallCount(0);
    
    // First, update the game state to the next player's turn and set phase to EVENTS
    setGameState(prevState => {
      // Switch to the next player
      const newPlayerIndex = prevState.currentPlayerIndex === 0 ? 1 : 0;
      const newTurnNumber = newPlayerIndex === 0 ? prevState.turnNumber + 1 : prevState.turnNumber;
      
      // Reset turn history
      const newTurnHistory = {
        peoplePlayedThisTurn: [],
        abilitiesUsedThisTurn: []
      };
      
      // Replenish water for next player (3 tokens)
      const updatedPlayers = [...prevState.players];
      updatedPlayers[newPlayerIndex] = {
        ...updatedPlayers[newPlayerIndex],
        water: 3
      };
      
      // Add a log entry
      const timestamp = new Date().toISOString();
      const updatedLog = [...prevState.log, {
        message: `Turn ended. Now ${updatedPlayers[newPlayerIndex].name}'s turn (turn ${newTurnNumber}).`,
        timestamp
      }];
      
      console.log(`[${new Date().toLocaleTimeString()}] NEW TURN: Player ${newPlayerIndex + 1} (${updatedPlayers[newPlayerIndex].name}), Turn ${newTurnNumber}`);
      
      return {
        ...prevState,
        currentPlayerIndex: newPlayerIndex,
        turnPhase: TurnPhase.EVENTS, // Start in events phase
        turnNumber: newTurnNumber,
        turnHistory: newTurnHistory,
        players: updatedPlayers,
        log: updatedLog
      };
    });
    
    // CRITICAL: We need a longer delay before processing events to ensure the state update above completes
    console.log(`[${new Date().toLocaleTimeString()}] Scheduling events phase to start after state update completes`);
    
    // Process the events phase after a substantial delay
    setTimeout(() => {
      console.log(`[${new Date().toLocaleTimeString()}] TURN TRANSITION: Now calling processEventsPhase()`);
      processEventsPhase(); // This will only run once due to our guard conditions
      
      // Wait for events processing to complete before changing phases
      // This is a much longer timeout to ensure events processing is completely done
      setTimeout(() => {
        console.log(`[${new Date().toLocaleTimeString()}] TURN TRANSITION: Changing to REPLENISH phase`);
        
        // After processing events, transition to REPLENISH phase
        setGameState(prevState => {
          const timestamp = new Date().toISOString();
          const updatedLog = [...prevState.log, {
            message: `Phase changed to REPLENISH.`,
            timestamp
          }];
          
          return {
            ...prevState,
            turnPhase: TurnPhase.REPLENISH,
            log: updatedLog
          };
        });
        
        // Then transition to ACTIONS phase after another delay
        setTimeout(() => {
          console.log(`[${new Date().toLocaleTimeString()}] TURN TRANSITION: Changing to ACTIONS phase`);
          
          setGameState(prevState => {
            const timestamp = new Date().toISOString();
            const updatedLog = [...prevState.log, {
              message: `Phase changed to ACTIONS.`,
              timestamp
            }];
            
            return {
              ...prevState,
              turnPhase: TurnPhase.ACTIONS,
              log: updatedLog
            };
          });
          
          console.log(`[${new Date().toLocaleTimeString()}] TURN TRANSITION COMPLETE: Now in ACTIONS phase`);
        }, 1500); // Longer delay for better visual separation
        
      }, 4000); // Much longer delay to ensure events processing is complete
      
    }, 1000); // Longer delay to ensure state update completes
  };

  // Get phase display name
  const getPhaseDisplayName = (phase: TurnPhase): string => {
    switch (phase) {
      case TurnPhase.EVENTS:
        return 'Events Phase';
      case TurnPhase.REPLENISH:
        return 'Replenish Phase';
      case TurnPhase.ACTIONS:
        return 'Actions Phase';
      default:
        return 'Unknown Phase';
    }
  };

  // Render water tokens for a player
  const renderWaterTokens = (count: number) => (
    <div className="water-tokens">
      <span className="water-label">Water:</span>
      <div className="water-count">{count}</div>
    </div>
  );
  
  // Card modal handlers
  const handleOpenCardModal = (card?: PersonCard | EventCard | WaterSiloCard) => {
    setShowCardModal(true);
    
    // If a specific card is clicked, find its index in the active player's hand
    if (card) {
      setSelectedCard(card);
      
      // Find the index of the clicked card in the active player's hand
      const cardIndex = activePlayerCards.findIndex(c => c.id === card.id);
      if (cardIndex !== -1) {
        setSelectedCardIndex(cardIndex);
      } else {
        setSelectedCardIndex(0); // Default to first card if not found
      }
    } else {
      setSelectedCardIndex(0); // Default to first card if no card specified
    }
  };
  
  const handleCloseCardModal = () => {
    setShowCardModal(false);
    setSelectedCard(null);
    setIsPlacementMode(false);
    setSelectedColumnIndex(null);
  };
  
  const handlePlayCard = (card: PersonCard | EventCard | WaterSiloCard) => {
    // Set the selected card and enable placement mode
    setSelectedCard(card);
    
    // Close the modal
    setShowCardModal(false);
    
    // Water Silo can't be played directly - it should only be junked
    if ('type' in card && card.type === 'waterSilo') {
      console.warn('Attempted to play Water Silo, which is not allowed by game rules');
      setSelectedCard(null);
      return;
    }
    
    // For a person card, we need to enter placement mode
    if ('type' in card && card.type === CardType.PERSON) {
      setIsPlacementMode(true);
      return;
    }
    
    // For event cards, we can place them immediately
    if ('type' in card && card.type === CardType.EVENT) {
      placeEventCard(card as EventCard);
    }
  };
  
  const placeEventCard = (card: EventCard) => {
    // Implementation for placing an event card in the queue according to its event number
    console.log('Placing event card:', card);
    
    setGameState(prevState => {
      const currentPlayerIndex = prevState.currentPlayerIndex;
      const updatedPlayers = [...prevState.players];
      const updatedPlayer = {...updatedPlayers[currentPlayerIndex]};
      
      // Get the event number (1, 2, or 3)
      const eventNumber = card.eventNumber;
      
      // Determine which slot to place the event in based on its event number
      // Events must go in their numbered slot if available, or the next available slot
      let slotName: 'slot1' | 'slot2' | 'slot3' | null = null;
      
      // Handle event number 1
      if (eventNumber === 1) {
        if (!updatedPlayer.eventQueue.slot1) slotName = 'slot1';
        else if (!updatedPlayer.eventQueue.slot2) slotName = 'slot2';
        else if (!updatedPlayer.eventQueue.slot3) slotName = 'slot3';
      }
      // Handle event number 2
      else if (eventNumber === 2) {
        if (!updatedPlayer.eventQueue.slot2) slotName = 'slot2';
        else if (!updatedPlayer.eventQueue.slot3) slotName = 'slot3';
      }
      // Handle event number 3
      else if (eventNumber === 3) {
        if (!updatedPlayer.eventQueue.slot3) slotName = 'slot3';
      }
      // Handle any other event number (for future expansion)
      else {
        // For any other event number, place in the first available slot
        if (!updatedPlayer.eventQueue.slot1) slotName = 'slot1';
        else if (!updatedPlayer.eventQueue.slot2) slotName = 'slot2';
        else if (!updatedPlayer.eventQueue.slot3) slotName = 'slot3';
      }
      
      // If we found a valid slot, place the card
      if (slotName) {
        // Place the card in the event queue
        updatedPlayer.eventQueue = {
          ...updatedPlayer.eventQueue,
          [slotName]: card
        };
        
        // Add a log entry
        const updatedLog = [...prevState.log, {
          message: `${updatedPlayer.name} played event "${card.name}" (Event #${card.eventNumber}) to ${slotName.replace('slot', 'position ')}.`,
          timestamp: new Date().toISOString()
        }];
        
        // Remove card from hand
        updatedPlayer.hand = updatedPlayer.hand.filter(c => c.id !== card.id);
        
        // Spend water
        updatedPlayer.water -= card.waterCost;
        
        updatedPlayers[currentPlayerIndex] = updatedPlayer;
        
        return {
          ...prevState,
          players: updatedPlayers,
          log: updatedLog
        };
      } else {
        // No valid slot found, add a log entry explaining why
        const updatedLog = [...prevState.log, {
          message: `Cannot play event "${card.name}" (Event #${card.eventNumber}) - no valid slots available.`,
          timestamp: new Date().toISOString()
        }];
        
        return {
          ...prevState,
          log: updatedLog
        };
      }
    });
    
    // Reset placement state
    setSelectedCard(null);
    setIsPlacementMode(false);
  };
  
  const placeWaterSilo = (card: WaterSiloCard) => {
    // Water Silo can't be played directly - it should only be junked
    // This function is here for completeness but should never be called
    // The CardModal has been updated to hide the Play button for Water Silo
    
    console.warn('Attempted to play Water Silo, which is not allowed by game rules');
    
    // Just close the modal instead of placing
    setShowCardModal(false);
    setSelectedCard(null);
    setIsPlacementMode(false);
  };
  
  const handleJunkCard = (card: PersonCard | EventCard | WaterSiloCard) => {
    console.log('Junking card:', card);
    
    // Check if this is the Water Silo which has special junking behavior
    const isWaterSilo = 'type' in card && card.type === 'waterSilo';
    
    setGameState(prevState => {
      const currentPlayerIndex = prevState.currentPlayerIndex;
      const updatedPlayers = [...prevState.players];
      const updatedPlayer = {...updatedPlayers[currentPlayerIndex]};
      
      // Remove card from hand
      updatedPlayer.hand = updatedPlayer.hand.filter(c => c.id !== card.id);
      
      // Gain 1 water
      updatedPlayer.water += 1;
      
      // Special handling for Water Silo
      if (isWaterSilo) {
        // Instead of going to discard, Water Silo returns to its place in the tableau
        updatedPlayer.waterSiloInPlayerArea = true;
        
        // Add to log
        const updatedLog = [...prevState.log, {
          message: `${updatedPlayer.name} junked Water Silo and gained 1 water token. Water Silo returned to tableau.`,
          timestamp: new Date().toISOString()
        }];
        
        updatedPlayers[currentPlayerIndex] = updatedPlayer;
        
        return {
          ...prevState,
          players: updatedPlayers,
          log: updatedLog
        };
      } else {
        // Normal junking flow - add to discard pile
        const updatedDiscardPile = [...prevState.discardPile, card];
        
        // Add to log
        const updatedLog = [...prevState.log, {
          message: `${updatedPlayer.name} junked ${('name' in card) ? card.name : 'a card'} and gained 1 water token.`,
          timestamp: new Date().toISOString()
        }];
        
        updatedPlayers[currentPlayerIndex] = updatedPlayer;
        
        return {
          ...prevState,
          players: updatedPlayers,
          discardPile: updatedDiscardPile,
          log: updatedLog
        };
      }
    });
    
    // Close the modal after junking
    setShowCardModal(false);
    setSelectedCard(null);
  };
  
  // Function to handle the actual card placement after any confirmations
  const handleSlotSelect = (columnIndex: number, slotPosition: 'top' | 'bottom') => {
    // Only process if we're in placement mode and have a person card selected
    if (!isPlacementMode || !selectedCard || !('type' in selectedCard) || selectedCard.type !== CardType.PERSON) {
      return;
    }
    
    const placementType = getPlacementType(columnIndex, slotPosition);
    
    if (placementType === 'invalid') {
      return;
    }
    
    const personCard = selectedCard as PersonCard;
    
    // For replacement, we need to confirm with the user first
    if (placementType === 'replace') {
      const activePlayerColumns = isPlayer1Active ? player1.columns : player2.columns;
      const column = activePlayerColumns[columnIndex];
      const slotIndex = slotPosition === 'bottom' ? 0 : 1;
      const existingCard = column.people[slotIndex];
      
      // Store the replacement data for when the user confirms
      setReplacementData({
        columnIndex,
        slotPosition,
        existingCard
      });
      
      // Show confirmation dialog
      setShowReplaceConfirmation(true);
      return;
    }
    
    // For normal placement or move, proceed with the placement
    placePersonCard(columnIndex, slotPosition, placementType);
  };
  
  // Function to handle the actual placement after confirmation if needed
  const placePersonCard = (columnIndex: number, slotPosition: 'top' | 'bottom', placementType: PlacementType) => {
    if (!selectedCard || !('type' in selectedCard) || selectedCard.type !== CardType.PERSON) {
      return;
    }
    
    const personCard = selectedCard as PersonCard;
    
    // Place the person card in the selected slot
    setGameState(prevState => {
      const currentPlayerIndex = prevState.currentPlayerIndex;
      const updatedPlayers = [...prevState.players];
      const updatedPlayer = {...updatedPlayers[currentPlayerIndex]};
      const updatedColumns = [...updatedPlayer.columns];
      const targetColumn = {...updatedColumns[columnIndex]};
      
      // Get current people in the column
      let currentPeople = [...targetColumn.people];
      let discardedCard = null;
      
      switch (placementType) {
        case 'normal':
          // Simple placement in an empty slot
          if (slotPosition === 'bottom') {
            if (currentPeople.length === 0) {
              currentPeople = [personCard]; // Add to bottom for empty column
            } else {
              currentPeople = [personCard, currentPeople[0]]; // Replace bottom, keep top
            }
          } else { // top slot
            currentPeople.push(personCard); // Add to top position
          }
          break;
          
        case 'move':
          // Move existing card to other slot and place new card in selected slot
          if (slotPosition === 'bottom') {
            // Move the current bottom card to top, place new card at bottom
            const existingPerson = currentPeople[0];
            currentPeople = [personCard, existingPerson];
          } else {
            // This shouldn't happen with our current logic but handle it anyway
            const existingPerson = currentPeople[0];
            currentPeople = [existingPerson, personCard];
          }
          break;
          
        case 'replace':
          // Replace the card in the selected slot
          if (slotPosition === 'bottom') {
            discardedCard = currentPeople[0];
            currentPeople = [personCard, currentPeople[1]]; // Replace bottom, keep top
          } else {
            discardedCard = currentPeople[1];
            currentPeople = [currentPeople[0], personCard]; // Keep bottom, replace top
          }
          break;
      }
      
      // Update the column with new people
      targetColumn.people = currentPeople;
      updatedColumns[columnIndex] = targetColumn;
      
      // Remove card from hand and spend water
      updatedPlayer.hand = updatedPlayer.hand.filter(c => c.id !== personCard.id);
      updatedPlayer.water -= personCard.waterCost;
      updatedPlayer.columns = updatedColumns;
      
      // Add discarded card to discard pile if there was one
      if (discardedCard) {
        const updatedDiscardPile = [...prevState.discardPile, discardedCard];
        
        // Add to log
        const updatedLog = [...prevState.log, {
          message: `${updatedPlayer.name} replaced ${discardedCard.name} with ${personCard.name}`,
          timestamp: new Date().toISOString()
        }];
        
        updatedPlayers[currentPlayerIndex] = updatedPlayer;
        
        return {
          ...prevState,
          players: updatedPlayers,
          discardPile: updatedDiscardPile,
          log: updatedLog
        };
      }
      
      // Add to log
      const updatedLog = [...prevState.log, {
        message: `${updatedPlayer.name} played ${personCard.name} to ${slotPosition} position of column ${columnIndex + 1}`,
        timestamp: new Date().toISOString()
      }];
      
      updatedPlayers[currentPlayerIndex] = updatedPlayer;
      
      return {
        ...prevState,
        players: updatedPlayers,
        log: updatedLog
      };
    });
    
    // Reset placement state
    setSelectedCard(null);
    setIsPlacementMode(false);
    setSelectedColumnIndex(null);
    setShowReplaceConfirmation(false);
    setReplacementData(null);
  };
  
  // Function to handle confirmation of replacement
  const handleConfirmReplacement = () => {
    if (replacementData) {
      placePersonCard(
        replacementData.columnIndex, 
        replacementData.slotPosition, 
        'replace'
      );
    }
  };
  
  // Function to cancel replacement
  const handleCancelReplacement = () => {
    setShowReplaceConfirmation(false);
    setReplacementData(null);
    // Stay in placement mode
  };
  
  // Placement types for visual and functional differentiation
  type PlacementType = 'normal' | 'move' | 'replace' | 'invalid';
  
  // This state will track if we're in the confirmation dialog for replacing a card
  const [showReplaceConfirmation, setShowReplaceConfirmation] = useState<boolean>(false);
  const [replacementData, setReplacementData] = useState<{
    columnIndex: number;
    slotPosition: 'top' | 'bottom';
    existingCard: PersonCard;
  } | null>(null);
  
  // Determine if a slot is a valid placement target and what type of placement it would be
  const getPlacementType = (columnIndex: number, slotPosition: 'top' | 'bottom'): PlacementType => {
    if (!isPlacementMode || !selectedCard || !('type' in selectedCard) || selectedCard.type !== CardType.PERSON) {
      return 'invalid';
    }
    
    const activePlayerColumns = isPlayer1Active ? player1.columns : player2.columns;
    const column = activePlayerColumns[columnIndex];
    
    // Column is empty - can only place in bottom slot
    if (column.people.length === 0) {
      return slotPosition === 'bottom' ? 'normal' : 'invalid';
    }
    
    // Column has 1 person
    if (column.people.length === 1) {
      const existingPersonPosition = 'bottom'; // In Radlands, first person is always in bottom slot
      
      // If clicking on empty slot, it's a normal placement
      if (slotPosition !== existingPersonPosition) {
        return 'normal';
      }
      
      // If clicking on occupied slot, it will move the existing person
      return 'move';
    }
    
    // Column has 2 people - replacing an existing card
    if (column.people.length === 2) {
      const slotIndex = slotPosition === 'bottom' ? 0 : 1;
      if (column.people[slotIndex]) {
        return 'replace';
      }
    }
    
    return 'invalid';
  };
  
  // Determine if a slot is a valid placement target (simplified check for highlighting)
  const isValidPlacementTarget = (columnIndex: number, slotPosition: 'top' | 'bottom'): boolean => {
    const placementType = getPlacementType(columnIndex, slotPosition);
    return placementType !== 'invalid';
  };

  return (
    <div className="game-board">
      {/* Test Controls */}
      <TestControls
        onSetupEventsTest={setupEventsTest}
        onProcessEventsPhase={processEventsPhase}
        onResetGameState={resetGameState}
        onToggleGameLog={toggleGameLog}
        onForceEventsPhase={forceEventsPhase}
        isGameLogVisible={isGameLogVisible}
      />
      
      {/* Game Log */}
      <GameLog 
        entries={gameState.log} 
        isVisible={isGameLogVisible}
      />
      
      {showCardModal && (
        <CardModal
          cards={activePlayerCards}
          water={activePlayerWater}
          initialCardIndex={selectedCardIndex}
          onClose={handleCloseCardModal}
          onPlayCard={handlePlayCard}
          onJunkCard={handleJunkCard}
        />
      )}
      
      {isPlacementMode && selectedCard && 'type' in selectedCard && selectedCard.type === CardType.PERSON && (
        <div className="placement-mode-indicator">
          <div className="placement-message">
            Select a slot to place <strong>{(selectedCard as PersonCard).name}</strong>
          </div>
          <button className="cancel-placement" onClick={handleCloseCardModal}>Cancel</button>
        </div>
      )}
      
      {showReplaceConfirmation && replacementData && (
        <div className="replacement-confirmation-overlay">
          <div className="replacement-confirmation-dialog">
            <h3>Replace Person Card?</h3>
            <p>
              This will destroy <strong>{replacementData.existingCard.name}</strong> and replace it with <strong>{selectedCard?.name}</strong>.
            </p>
            <p>The destroyed card will be sent to the discard pile.</p>
            <div className="replacement-actions">
              <button className="confirm-replacement" onClick={handleConfirmReplacement}>
                Confirm Replacement
              </button>
              <button className="cancel-replacement" onClick={handleCancelReplacement}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Phase Indicator */}
      {processingEvents && (
        <div className="phase-processing-indicator">
          <div className="processing-message">
            Processing Events Phase...
          </div>
        </div>
      )}
      
      {/* Events Processing Debug Overlay - only shown during active events processing or when call count > 0 */}
      {(processingEvents || eventsPhaseCallCount > 0) && (
        <div className="events-processing-debugger">
          <div className="debug-title">Events Phase Debugger</div>
          <div className="debug-entry">
            <span className="debug-label">Call count:</span>
            <span className="debug-value">{eventsPhaseCallCount}</span>
            <span className="debug-counter">{eventsPhaseCallCount}</span>
          </div>
          <div className="debug-entry">
            <span className="debug-label">Processing:</span>
            <span className="debug-value">{processingEvents ? 'Yes' : 'No'}</span>
          </div>
          <div className="debug-entry">
            <span className="debug-label">Processed this turn:</span>
            <span className="debug-value">{eventsProcessedThisTurn ? 'Yes' : 'No'}</span>
          </div>
          <div className="debug-entry">
            <span className="debug-label">Step:</span>
            <span className="debug-value">{processingStep}</span>
          </div>
          {eventsProcessedThisTurn && eventsPhaseCallCount > 1 && (
            <div className="debug-warning">
              WARNING: Events phase was called multiple times in the same turn!
            </div>
          )}
        </div>
      )}
      <div className="game-board-inner">
        {/* Game controls and info */}
        <div className="game-info-panel">
          <div className="phase-indicator">
            {getPhaseDisplayName(gameState.turnPhase)}
          </div>
          <div className="turn-counter">
            Turn {gameState.turnNumber}
          </div>
          <div className="active-player">
            Active: {isPlayer1Active ? player1.name : player2.name}
          </div>
          <button 
            className="end-turn-btn"
            onClick={handleEndTurn}
            disabled={gameState.turnPhase !== TurnPhase.ACTIONS}
          >
            End Turn
          </button>
        </div>
        
        {/* Player 2 area (always left side) */}
        <div className={`player-area opponent ${isPlayer2Active ? 'active-player' : ''}`}>
          <div className="player-header">
            <h2 className="player-name">
              {player2.name}
              {isPlayer2Active && <span className="active-badge">Active Player</span>}
            </h2>
            {renderWaterTokens(player2.water)}
          </div>
          
          <div className="event-queue">
            <div className="slot-label">Event Queue</div>
            <div className="event-slots">
              <div className="event-slot">
                <div className="queue-position">1</div>
                <div className="card-slot event-card-container">
                  {player2.eventQueue.slot1 && <EventCardComponent event={player2.eventQueue.slot1} />}
                </div>
              </div>
              <div className="event-slot">
                <div className="queue-position">2</div>
                <div className="card-slot event-card-container">
                  {player2.eventQueue.slot2 && <EventCardComponent event={player2.eventQueue.slot2} />}
                </div>
              </div>
              <div className="event-slot">
                <div className="queue-position">3</div>
                <div className="card-slot event-card-container">
                  {player2.eventQueue.slot3 && <EventCardComponent event={player2.eventQueue.slot3} />}
                </div>
              </div>
            </div>
          </div>
          
          {/* Player 2's tableau */}
          <div className="player-tableau">
            {/* Column 1 */}
            <div className="column">
              <div className="person-slot top-slot">
                {player2.columns[0].people.length > 1 && 
                  <PersonCardComponent person={player2.columns[0].people[1]} />
                }
              </div>
              <div className="person-slot bottom-slot">
                {player2.columns[0].people.length > 0 && 
                  <PersonCardComponent person={player2.columns[0].people[0]} />
                }
              </div>
              <div className="camp-slot">
                <CampCardComponent camp={player2.camps[0]} />
              </div>
            </div>
            
            {/* Column 2 */}
            <div className="column">
              <div className="person-slot top-slot">
                {player2.columns[1].people.length > 1 && 
                  <PersonCardComponent person={player2.columns[1].people[1]} />
                }
              </div>
              <div className="person-slot bottom-slot">
                {player2.columns[1].people.length > 0 && 
                  <PersonCardComponent person={player2.columns[1].people[0]} />
                }
              </div>
              <div className="camp-slot">
                <CampCardComponent camp={player2.camps[1]} />
              </div>
            </div>
            
            {/* Column 3 */}
            <div className="column">
              <div className="person-slot top-slot">
                {player2.columns[2].people.length > 1 && 
                  <PersonCardComponent person={player2.columns[2].people[1]} />
                }
              </div>
              <div className="person-slot bottom-slot">
                {player2.columns[2].people.length > 0 && 
                  <PersonCardComponent person={player2.columns[2].people[0]} />
                }
              </div>
              <div className="camp-slot">
                <CampCardComponent camp={player2.camps[2]} />
              </div>
            </div>
          </div>
          
          <div className="opponent-hand">
            <div className="slot-label">Hand: {player2.hand.length} cards</div>
          </div>
        </div>

        {/* Shared game area */}
        <div className="shared-area">
          {/* Left side special cards (Player 2) */}
          <div className="left-special-cards">
            <div className="raiders-slot">
              <div className="slot-label">Raiders</div>
              <div className="card-slot">
                {player2.raiders && <EventCardComponent event={player2.raiders} />}
              </div>
            </div>
            <div className="water-silo-slot">
              <div className="slot-label">Water Silo</div>
              <div className="card-slot">
                {player2.waterSiloInPlayerArea && <WaterSiloComponent />}
              </div>
            </div>
          </div>
          
          {/* Central shared elements */}
          <div className="central-elements">
            <div className="draw-pile card-slot">
              <div className="slot-label">Draw</div>
              <div className="card-back"></div>
            </div>
            <div className="discard-pile card-slot">
              <div className="slot-label">Discard</div>
              {gameState.discardPile.length > 0 && (
                <div className="card-top"></div>
              )}
            </div>
          </div>
          
          {/* Right side special cards (Player 1) */}
          <div className="right-special-cards">
            <div className="raiders-slot">
              <div className="slot-label">Raiders</div>
              <div className="card-slot">
                {player1.raiders && <EventCardComponent event={player1.raiders} />}
              </div>
            </div>
            <div className="water-silo-slot">
              <div className="slot-label">Water Silo</div>
              <div className="card-slot">
                {player1.waterSiloInPlayerArea && <WaterSiloComponent />}
              </div>
            </div>
          </div>
        </div>
        
        {/* Player 1 area (always right side) */}
        <div className={`player-area current-player ${isPlayer1Active ? 'active-player' : ''}`}>
          <div className="player-header">
            <h2 className="player-name">
              {player1.name}
              {isPlayer1Active && <span className="active-badge">Active Player</span>}
            </h2>
            {renderWaterTokens(player1.water)}
          </div>

          <div className="event-queue">
            <div className="slot-label">Event Queue</div>
            <div className="event-slots">
              <div className="event-slot">
                <div className="queue-position">1</div>
                <div className="card-slot event-card-container">
                  {player1.eventQueue.slot1 && <EventCardComponent event={player1.eventQueue.slot1} />}
                </div>
              </div>
              <div className="event-slot">
                <div className="queue-position">2</div>
                <div className="card-slot event-card-container">
                  {player1.eventQueue.slot2 && <EventCardComponent event={player1.eventQueue.slot2} />}
                </div>
              </div>
              <div className="event-slot">
                <div className="queue-position">3</div>
                <div className="card-slot event-card-container">
                  {player1.eventQueue.slot3 && <EventCardComponent event={player1.eventQueue.slot3} />}
                </div>
              </div>
            </div>
          </div>
          
          {/* Player 1's tableau */}
          <div className="player-tableau">
            {/* Column 1 */}
            <div className="column">
              <div 
                className={`person-slot top-slot ${isValidPlacementTarget(0, 'top') ? 'valid-target' : ''}`}
                onClick={() => isValidPlacementTarget(0, 'top') && handleSlotSelect(0, 'top')}
                style={
                  isValidPlacementTarget(0, 'top') 
                    ? { 
                        cursor: 'pointer', 
                        boxShadow: `0 0 0 2px ${
                          getPlacementType(0, 'top') === 'normal' ? '#4caf50' : 
                          getPlacementType(0, 'top') === 'move' ? '#2196f3' : 
                          '#f44336'
                        }`,
                        position: 'relative'
                      } 
                    : {}
                }
                title={
                  getPlacementType(0, 'top') === 'normal' ? 'Place person here' :
                  getPlacementType(0, 'top') === 'move' ? 'Place person here and move existing person' :
                  getPlacementType(0, 'top') === 'replace' ? 'Replace existing person (will be destroyed)' : ''
                }
              >
                {player1.columns[0].people.length > 1 && 
                  <PersonCardComponent person={player1.columns[0].people[1]} />
                }
                {isPlacementMode && getPlacementType(0, 'top') === 'move' && (
                  <div className="move-indicator">⤴</div>
                )}
                {isPlacementMode && getPlacementType(0, 'top') === 'replace' && (
                  <div className="replace-indicator">⚠️</div>
                )}
              </div>
              <div 
                className={`person-slot bottom-slot ${isValidPlacementTarget(0, 'bottom') ? 'valid-target' : ''}`}
                onClick={() => isValidPlacementTarget(0, 'bottom') && handleSlotSelect(0, 'bottom')}
                style={
                  isValidPlacementTarget(0, 'bottom') 
                    ? { 
                        cursor: 'pointer', 
                        boxShadow: `0 0 0 2px ${
                          getPlacementType(0, 'bottom') === 'normal' ? '#4caf50' : 
                          getPlacementType(0, 'bottom') === 'move' ? '#2196f3' : 
                          '#f44336'
                        }`,
                        position: 'relative'
                      } 
                    : {}
                }
                title={
                  getPlacementType(0, 'bottom') === 'normal' ? 'Place person here' :
                  getPlacementType(0, 'bottom') === 'move' ? 'Place person here and move existing person' :
                  getPlacementType(0, 'bottom') === 'replace' ? 'Replace existing person (will be destroyed)' : ''
                }
              >
                {player1.columns[0].people.length > 0 && 
                  <PersonCardComponent person={player1.columns[0].people[0]} />
                }
                {isPlacementMode && getPlacementType(0, 'bottom') === 'move' && (
                  <div className="move-indicator">⤴</div>
                )}
                {isPlacementMode && getPlacementType(0, 'bottom') === 'replace' && (
                  <div className="replace-indicator">⚠️</div>
                )}
              </div>
              <div className="camp-slot">
                <CampCardComponent camp={player1.camps[0]} />
              </div>
            </div>
            
            {/* Column 2 */}
            <div className="column">
              <div 
                className={`person-slot top-slot ${isValidPlacementTarget(1, 'top') ? 'valid-target' : ''}`}
                onClick={() => isValidPlacementTarget(1, 'top') && handleSlotSelect(1, 'top')}
                style={
                  isValidPlacementTarget(1, 'top') 
                    ? { 
                        cursor: 'pointer', 
                        boxShadow: `0 0 0 2px ${
                          getPlacementType(1, 'top') === 'normal' ? '#4caf50' : 
                          getPlacementType(1, 'top') === 'move' ? '#2196f3' : 
                          '#f44336'
                        }`,
                        position: 'relative'
                      } 
                    : {}
                }
                title={
                  getPlacementType(1, 'top') === 'normal' ? 'Place person here' :
                  getPlacementType(1, 'top') === 'move' ? 'Place person here and move existing person' :
                  getPlacementType(1, 'top') === 'replace' ? 'Replace existing person (will be destroyed)' : ''
                }
              >
                {player1.columns[1].people.length > 1 && 
                  <PersonCardComponent person={player1.columns[1].people[1]} />
                }
                {isPlacementMode && getPlacementType(1, 'top') === 'move' && (
                  <div className="move-indicator">⤴</div>
                )}
                {isPlacementMode && getPlacementType(1, 'top') === 'replace' && (
                  <div className="replace-indicator">⚠️</div>
                )}
              </div>
              <div 
                className={`person-slot bottom-slot ${isValidPlacementTarget(1, 'bottom') ? 'valid-target' : ''}`}
                onClick={() => isValidPlacementTarget(1, 'bottom') && handleSlotSelect(1, 'bottom')}
                style={
                  isValidPlacementTarget(1, 'bottom') 
                    ? { 
                        cursor: 'pointer', 
                        boxShadow: `0 0 0 2px ${
                          getPlacementType(1, 'bottom') === 'normal' ? '#4caf50' : 
                          getPlacementType(1, 'bottom') === 'move' ? '#2196f3' : 
                          '#f44336'
                        }`,
                        position: 'relative'
                      } 
                    : {}
                }
                title={
                  getPlacementType(1, 'bottom') === 'normal' ? 'Place person here' :
                  getPlacementType(1, 'bottom') === 'move' ? 'Place person here and move existing person' :
                  getPlacementType(1, 'bottom') === 'replace' ? 'Replace existing person (will be destroyed)' : ''
                }
              >
                {player1.columns[1].people.length > 0 && 
                  <PersonCardComponent person={player1.columns[1].people[0]} />
                }
                {isPlacementMode && getPlacementType(1, 'bottom') === 'move' && (
                  <div className="move-indicator">⤴</div>
                )}
                {isPlacementMode && getPlacementType(1, 'bottom') === 'replace' && (
                  <div className="replace-indicator">⚠️</div>
                )}
              </div>
              <div className="camp-slot">
                <CampCardComponent camp={player1.camps[1]} />
              </div>
            </div>
            
            {/* Column 3 */}
            <div className="column">
              <div 
                className={`person-slot top-slot ${isValidPlacementTarget(2, 'top') ? 'valid-target' : ''}`}
                onClick={() => isValidPlacementTarget(2, 'top') && handleSlotSelect(2, 'top')}
                style={
                  isValidPlacementTarget(2, 'top') 
                    ? { 
                        cursor: 'pointer', 
                        boxShadow: `0 0 0 2px ${
                          getPlacementType(2, 'top') === 'normal' ? '#4caf50' : 
                          getPlacementType(2, 'top') === 'move' ? '#2196f3' : 
                          '#f44336'
                        }`,
                        position: 'relative'
                      } 
                    : {}
                }
                title={
                  getPlacementType(2, 'top') === 'normal' ? 'Place person here' :
                  getPlacementType(2, 'top') === 'move' ? 'Place person here and move existing person' :
                  getPlacementType(2, 'top') === 'replace' ? 'Replace existing person (will be destroyed)' : ''
                }
              >
                {player1.columns[2].people.length > 1 && 
                  <PersonCardComponent person={player1.columns[2].people[1]} />
                }
                {isPlacementMode && getPlacementType(2, 'top') === 'move' && (
                  <div className="move-indicator">⤴</div>
                )}
                {isPlacementMode && getPlacementType(2, 'top') === 'replace' && (
                  <div className="replace-indicator">⚠️</div>
                )}
              </div>
              <div 
                className={`person-slot bottom-slot ${isValidPlacementTarget(2, 'bottom') ? 'valid-target' : ''}`}
                onClick={() => isValidPlacementTarget(2, 'bottom') && handleSlotSelect(2, 'bottom')}
                style={
                  isValidPlacementTarget(2, 'bottom') 
                    ? { 
                        cursor: 'pointer', 
                        boxShadow: `0 0 0 2px ${
                          getPlacementType(2, 'bottom') === 'normal' ? '#4caf50' : 
                          getPlacementType(2, 'bottom') === 'move' ? '#2196f3' : 
                          '#f44336'
                        }`,
                        position: 'relative'
                      } 
                    : {}
                }
                title={
                  getPlacementType(2, 'bottom') === 'normal' ? 'Place person here' :
                  getPlacementType(2, 'bottom') === 'move' ? 'Place person here and move existing person' :
                  getPlacementType(2, 'bottom') === 'replace' ? 'Replace existing person (will be destroyed)' : ''
                }
              >
                {player1.columns[2].people.length > 0 && 
                  <PersonCardComponent person={player1.columns[2].people[0]} />
                }
                {isPlacementMode && getPlacementType(2, 'bottom') === 'move' && (
                  <div className="move-indicator">⤴</div>
                )}
                {isPlacementMode && getPlacementType(2, 'bottom') === 'replace' && (
                  <div className="replace-indicator">⚠️</div>
                )}
              </div>
              <div className="camp-slot">
                <CampCardComponent camp={player1.camps[2]} />
              </div>
            </div>
          </div>
          
          <div className="player-hand">
            <div className="slot-label">Hand</div>
            <div className="hand-cards">
              {player1.hand.map((card, index) => (
                <div 
                  key={card.id} 
                  className="hand-card-slot"
                  onClick={isPlayer1Active ? () => handleOpenCardModal(card) : undefined}
                  style={isPlayer1Active ? { cursor: 'pointer' } : {}}
                >
                  {'waterCost' in card ? (
                    card.type === CardType.PERSON ? (
                      <PersonCardComponent person={card as PersonCard} />
                    ) : (
                      <EventCardComponent event={card as EventCard} />
                    )
                  ) : (
                    <WaterSiloComponent />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;