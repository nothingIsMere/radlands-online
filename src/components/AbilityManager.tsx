// components/AbilityManager.tsx

'use client';

import { Card, PlayerState, GameTurnState } from '../src/types/game';
import { Ability, AbilityContext, StateSetters } from '../types/abilities';
import { AbilityRegistry } from '../../services/abilityRegistry';
import { AbilityService } from '../../services/abilityService';
import { initializeAbilitySystem } from '../../src/utils/abilityExecutor';
import React, { useEffect, createContext, useContext, useState } from 'react';

// Create context for ability system
interface AbilityContextType {
  executeAbility: (card: Card, ability: Ability, location: { type: 'person' | 'camp'; index: number }) => void;
  isAbilityActive: () => boolean;
  completeAbility: () => void;
}

const AbilityContext = createContext<AbilityContextType>({
  executeAbility: () => {},
  isAbilityActive: () => false,
  completeAbility: () => {},
});

// Custom hook to use ability context
export const useAbility = () => useContext(AbilityContext);

// AbilityProvider component
interface AbilityProviderProps {
  children: React.ReactNode;
  leftPlayerState: PlayerState;
  rightPlayerState: PlayerState;
  gameState: GameTurnState;
  stateSetters: StateSetters;
  drawDeck: Card[];
}

export const AbilityProvider: React.FC<AbilityProviderProps> = ({
  children,
  leftPlayerState,
  rightPlayerState,
  gameState,
  stateSetters,
  drawDeck,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize ability system once
  useEffect(() => {
    if (!isInitialized) {
      initializeAbilitySystem();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Execute an ability
  const executeAbility = (card: Card, ability: Ability, location: { type: 'person' | 'camp'; index: number }) => {
    const player = gameState.currentTurn;
    const playerState = player === 'left' ? leftPlayerState : rightPlayerState;
    const opponentState = player === 'left' ? rightPlayerState : leftPlayerState;

    // Check if the ability can be afforded
    if (playerState.waterCount < ability.cost) {
      alert(`Not enough water to use this ability. Cost: ${ability.cost}, Available: ${playerState.waterCount}`);
      return;
    }

    // Deduct ability cost
    const setPlayerState = player === 'left' ? stateSetters.setLeftPlayerState : stateSetters.setRightPlayerState;
    setPlayerState((prev) => ({
      ...prev,
      waterCount: prev.waterCount - ability.cost,
    }));

    // Mark the card as not ready (used)
    if (location.type === 'person') {
      setPlayerState((prev) => ({
        ...prev,
        personSlots: prev.personSlots.map((slot, idx) => (idx === location.index ? { ...slot, isReady: false } : slot)),
      }));
    } else if (location.type === 'camp') {
      setPlayerState((prev) => ({
        ...prev,
        campSlots: prev.campSlots.map((slot, idx) => (idx === location.index ? { ...slot, isReady: false } : slot)),
      }));
    }

    const context: AbilityContext = {
      sourceCard: card,
      sourceLocation: location,
      player,
      ability,
      gameState,
      playerState,
      opponentState,
      drawDeck,
      stateSetters,
    };

    // Execute the ability
    AbilityRegistry.executeAbility(context);
  };

  return (
    <AbilityContext.Provider
      value={{
        executeAbility,
        isAbilityActive: AbilityService.isAbilityActive,
        completeAbility: AbilityService.completeAbility,
      }}
    >
      {children}
    </AbilityContext.Provider>
  );
};
