// turnUtils.ts
import { Card, PlayerState, GameTurnState, GamePhase } from '@/types/game';

/**
 * Advances to the next game phase
 * @param currentState Current game turn state
 * @returns Updated game turn state with the next phase
 */
export const advanceToNextPhase = (
  currentState: GameTurnState
): GameTurnState => {
  const { currentPhase, currentTurn, isFirstTurn } = currentState;
  
  switch (currentPhase) {
    case 'events':
      return {
        ...currentState,
        currentPhase: 'replenish',
      };
    
    case 'replenish':
      return {
        ...currentState,
        currentPhase: 'actions',
      };
      
    case 'actions':
      return {
        ...currentState,
        currentPhase: 'end',
      };
      
    case 'end':
      // End phase transitions to next player's events phase
      return {
        currentTurn: currentTurn === 'left' ? 'right' : 'left',
        currentPhase: 'events',
        isFirstTurn: false,
      };
      
    default:
      return currentState;
  }
};

/**
 * Processes the current phase for a player
 * @param gameState Current game state
 * @param setGameState Function to update game state
 * @param leftPlayerState Left player's state
 * @param rightPlayerState Right player's state
 * @param setLeftPlayerState Function to update left player state
 * @param setRightPlayerState Function to update right player state
 * @param handlers Additional handlers for phase-specific actions
 */
export const processCurrentPhase = (
  gameState: GameTurnState,
  setGameState: (updater: (prev: GameTurnState) => GameTurnState) => void,
  leftPlayerState: PlayerState,
  rightPlayerState: PlayerState,
  setLeftPlayerState: (updater: (prev: PlayerState) => PlayerState) => void,
  setRightPlayerState: (updater: (prev: PlayerState) => PlayerState) => void,
  handlers: {
    handleEventsPhase?: () => void;
    handleReplenishPhase?: () => void;
    handleEndPhase?: () => void;
  } = {}
) => {
  const { currentPhase } = gameState;
  const currentPlayerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
  const setCurrentPlayerState = gameState.currentTurn === 'left' ? setLeftPlayerState : setRightPlayerState;
  
  switch (currentPhase) {
    case 'events':
      if (handlers.handleEventsPhase) {
        handlers.handleEventsPhase();
      } else {
        // Default events phase handling
        // Process events and advance to next phase
        setTimeout(() => {
          setGameState(advanceToNextPhase);
        }, 100);
      }
      break;
      
    case 'replenish':
      if (handlers.handleReplenishPhase) {
        handlers.handleReplenishPhase();
      } else {
        // Default replenish phase handling
        // Draw a card if available
        if (currentPlayerState.drawDeck && currentPlayerState.drawDeck.length > 0) {
          const topCard = currentPlayerState.drawDeck[currentPlayerState.drawDeck.length - 1];
          setCurrentPlayerState((prev) => ({
            ...prev,
            handCards: [...prev.handCards, topCard],
            drawDeck: prev.drawDeck.slice(0, -1),
          }));
        }
        
        // Reset water count
        setCurrentPlayerState((prev) => ({
          ...prev,
          waterCount: 3, // Standard water replenishment
        }));
        
        // Advance to actions phase
        setTimeout(() => {
          setGameState(advanceToNextPhase);
        }, 100);
      }
      break;
      
    case 'end':
      if (handlers.handleEndPhase) {
        handlers.handleEndPhase();
      } else {
        // Default end phase handling
        // Reset turn-based flags and advance to next player
        if (gameState.currentTurn === 'left') {
          // Reset left player's turn-based flags
        } else {
          // Reset right player's turn-based flags
        }
        
        // Advance to next player's events phase
        setTimeout(() => {
          setGameState(advanceToNextPhase);
        }, 100);
      }
      break;
      
    // Actions phase doesn't need auto-processing - it's player-driven
    default:
      break;
  }
};

/**
 * Ends the current turn and advances to the next player
 * @param gameState Current game state
 * @param setGameState Function to update game state
 * @param resetLeftFlags Function to reset left player's turn-based flags
 * @param resetRightFlags Function to reset right player's turn-based flags
 */
export const endTurn = (
  gameState: GameTurnState,
  setGameState: (updater: (prev: GameTurnState) => GameTurnState) => void,
  resetLeftFlags?: () => void,
  resetRightFlags?: () => void
) => {
  // Reset appropriate player's flags
  if (gameState.currentTurn === 'left' && resetLeftFlags) {
    resetLeftFlags();
  } else if (gameState.currentTurn === 'right' && resetRightFlags) {
    resetRightFlags();
  }
  
  // Advance to next player's events phase
  setGameState((prev) => ({
    currentTurn: prev.currentTurn === 'left' ? 'right' : 'left',
    currentPhase: 'events',
    isFirstTurn: false,
  }));
};
