import { useState, FC } from 'react';
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

  // Handle end turn button click
  const handleEndTurn = () => {
    setGameState(prevState => {
      // Switch to Events phase for the next player
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
      
      return {
        ...prevState,
        currentPlayerIndex: newPlayerIndex,
        turnPhase: TurnPhase.EVENTS,
        turnNumber: newTurnNumber,
        turnHistory: newTurnHistory,
        players: updatedPlayers
      };
    });

    // Simulate events phase completion after a short delay
    setTimeout(() => {
      setGameState(prevState => ({
        ...prevState,
        turnPhase: TurnPhase.REPLENISH
      }));
      
      // Simulate replenish phase completion after another short delay
      setTimeout(() => {
        setGameState(prevState => ({
          ...prevState,
          turnPhase: TurnPhase.ACTIONS
        }));
      }, 1000);
    }, 1000);
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
    // Implementation for placing an event card in the queue
    console.log('Placing event card:', card);
    
    setGameState(prevState => {
      const currentPlayerIndex = prevState.currentPlayerIndex;
      const updatedPlayers = [...prevState.players];
      const updatedPlayer = {...updatedPlayers[currentPlayerIndex]};
      
      // Find the first empty slot in the event queue
      let slotName: 'slot1' | 'slot2' | 'slot3' | null = null;
      if (!updatedPlayer.eventQueue.slot1) slotName = 'slot1';
      else if (!updatedPlayer.eventQueue.slot2) slotName = 'slot2';
      else if (!updatedPlayer.eventQueue.slot3) slotName = 'slot3';
      
      if (slotName) {
        // Place the card in the event queue
        updatedPlayer.eventQueue = {
          ...updatedPlayer.eventQueue,
          [slotName]: card
        };
        
        // Remove card from hand
        updatedPlayer.hand = updatedPlayer.hand.filter(c => c.id !== card.id);
        
        // Spend water
        updatedPlayer.water -= card.waterCost;
        
        updatedPlayers[currentPlayerIndex] = updatedPlayer;
        
        return {
          ...prevState,
          players: updatedPlayers
        };
      }
      
      return prevState;
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
                <div className="card-slot">
                  {player2.eventQueue.slot1 && <EventCardComponent event={player2.eventQueue.slot1} />}
                </div>
              </div>
              <div className="event-slot">
                <div className="queue-position">2</div>
                <div className="card-slot">
                  {player2.eventQueue.slot2 && <EventCardComponent event={player2.eventQueue.slot2} />}
                </div>
              </div>
              <div className="event-slot">
                <div className="queue-position">3</div>
                <div className="card-slot">
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
                <div className="card-slot">
                  {player1.eventQueue.slot1 && <EventCardComponent event={player1.eventQueue.slot1} />}
                </div>
              </div>
              <div className="event-slot">
                <div className="queue-position">2</div>
                <div className="card-slot">
                  {player1.eventQueue.slot2 && <EventCardComponent event={player1.eventQueue.slot2} />}
                </div>
              </div>
              <div className="event-slot">
                <div className="queue-position">3</div>
                <div className="card-slot">
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