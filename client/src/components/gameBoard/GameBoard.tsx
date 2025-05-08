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
  const handleOpenCardModal = () => {
    setShowCardModal(true);
  };
  
  const handleCloseCardModal = () => {
    setShowCardModal(false);
  };
  
  const handlePlayCard = (card: PersonCard | EventCard | WaterSiloCard) => {
    // This would implement the logic to play the card
    console.log('Playing card:', card);
    
    // Close the modal after playing
    setShowCardModal(false);
    
    // This is a placeholder for actual card playing logic
    // In a real implementation, you would update the game state
    // based on the card type and its effects
  };
  
  const handleJunkCard = (card: PersonCard | EventCard | WaterSiloCard) => {
    // This would implement the logic to junk the card
    console.log('Junking card:', card);
    
    // Close the modal after junking
    setShowCardModal(false);
    
    // This is a placeholder for actual card junking logic
    // In a real implementation, you would remove the card from
    // the player's hand and possibly give them water
  };

  return (
    <div className="game-board">
      {showCardModal && (
        <CardModal
          cards={activePlayerCards}
          water={activePlayerWater}
          onClose={handleCloseCardModal}
          onPlayCard={handlePlayCard}
          onJunkCard={handleJunkCard}
        />
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
              <div className="person-slot top-slot">
                {player1.columns[0].people.length > 1 && 
                  <PersonCardComponent person={player1.columns[0].people[1]} />
                }
              </div>
              <div className="person-slot bottom-slot">
                {player1.columns[0].people.length > 0 && 
                  <PersonCardComponent person={player1.columns[0].people[0]} />
                }
              </div>
              <div className="camp-slot">
                <CampCardComponent camp={player1.camps[0]} />
              </div>
            </div>
            
            {/* Column 2 */}
            <div className="column">
              <div className="person-slot top-slot">
                {player1.columns[1].people.length > 1 && 
                  <PersonCardComponent person={player1.columns[1].people[1]} />
                }
              </div>
              <div className="person-slot bottom-slot">
                {player1.columns[1].people.length > 0 && 
                  <PersonCardComponent person={player1.columns[1].people[0]} />
                }
              </div>
              <div className="camp-slot">
                <CampCardComponent camp={player1.camps[1]} />
              </div>
            </div>
            
            {/* Column 3 */}
            <div className="column">
              <div className="person-slot top-slot">
                {player1.columns[2].people.length > 1 && 
                  <PersonCardComponent person={player1.columns[2].people[1]} />
                }
              </div>
              <div className="person-slot bottom-slot">
                {player1.columns[2].people.length > 0 && 
                  <PersonCardComponent person={player1.columns[2].people[0]} />
                }
              </div>
              <div className="camp-slot">
                <CampCardComponent camp={player1.camps[2]} />
              </div>
            </div>
          </div>
          
          <div className="player-hand">
            <div className="slot-label">Hand</div>
            <div className="hand-cards">
              {player1.hand.map(card => (
                <div 
                  key={card.id} 
                  className="hand-card-slot"
                  onClick={isPlayer1Active ? handleOpenCardModal : undefined}
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