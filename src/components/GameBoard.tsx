'use client';

import { Card } from '@/types/game';
import React, { useState, useRef } from 'react';
import PersonSlot from '@/components/PersonSlot';
import EventSlot from '@/components/EventSlot';
import { useEffect } from 'react';
import { createPerson } from '@/cards/personCards';
import { createCamp } from '@/cards/campCards';
import { createEvent } from '@/cards/eventCards';
import {
  handleDrawThenDiscard,
  initiateSacrificeMode,
  handleSacrificeEffect,
  applyDamageToTarget,
  restoreCard,
  deductWaterCost,
  markCardUsedAbility,
  restorePersonAndMakeReady,
} from '@/utils/abilityUtils';
import { markEventPlayed, checkZetoKahnEffect, hasVeraVoshTrait } from '@/utils/gameUtils';
import { updateProtectionStatus } from '@/utils/protectionUtils';
import { advanceEventQueue, canPlaceEventInSlot, placeEventInFirstValidSlot, processEvents } from '@/utils/eventUtils';
import { Card, PlayerState, GameTurnState } from '@/types/game';
import { advanceToNextPhase, processCurrentPhase, endTurn } from '@/utils/turnUtils';
import { gameLogger } from '@/utils/actionLogger';
import { createEndTurnAction } from '@/utils/actionCreators';
import { AbilityProvider } from '../../src/components/AbilityManager';
import { AbilityModal } from '../../src/components/AbilityModal';
import { initializeAbilitySystem } from '@/utils/abilityExecutor';
import { AbilityService } from '../../services/abilityService';
import CampSlot from '@/components/CampSlot';

interface PlayerState {
  handCards: Card[];
  personSlots: (Card | null)[];
  campSlots: (Card | null)[];
  eventSlots: (Card | null)[];
  waterSiloInHand: boolean;
  waterCount: number;
  raidersLocation: 'default' | 'event1' | 'event2' | 'event3';
}

const testCards: Card[] = [
  createPerson('wounded-soldier'),
  createPerson('vigilante'),
  createPerson('holdout'),
  createPerson('karli-blaze'),
  createPerson('argo-yesky'),
  createPerson('sniper'),
  createPerson('pyromaniac'),
  createPerson('muse'),
  createPerson('assassin'),
  createPerson('gunner'),
  createPerson('scout'),
  createPerson('repair-bot'),
  createPerson('looter'),
  createPerson('doomsayer'),
  createPerson('exterminator'),
  createPerson('rescue-team'),
  createPerson('molgur-stang'),
  createPerson('magnus-karv'),
  createPerson('mutant'),
  createPerson('cult-leader'),
  createPerson('scientist'),
  createPerson('zeto-kahn'),
  createPerson('rabble-rouser'),
  createPerson('vanguard'),
  createPerson('mimic'),
  createPerson('vera-vosh'),
].filter(Boolean) as Card[];

const rightTestCards: Card[] = [
  // Create card instances from our definitions and modify properties as needed
  { ...createPerson('muse'), id: 'right-1', name: 'Medic', isDamaged: true },
  { ...createPerson('assassin'), id: 'right-2', name: 'Defender' },
  { ...createPerson('pyromaniac'), id: 'right-3', name: 'Bomber' },
].filter(Boolean) as Card[];

const testEventCards: Card[] = [createEvent('ambush'), createEvent('attack')].filter(Boolean) as Card[];

const drawDeckCards: Card[] = [
  createPerson('scout'),
  createPerson('assassin'),
  createPerson('muse'),
  createPerson('vigilante'),
  createPerson('holdout'),
  createEvent('assault'),
].filter(Boolean) as Card[];

const leftWaterSiloCard: Card = {
  id: 'watersilo-left',
  name: 'Water Silo',
  type: 'watersilo',
  owner: 'left',
};

const rightWaterSiloCard: Card = {
  id: 'watersilo-right',
  name: 'Water Silo',
  type: 'watersilo',
  owner: 'right',
};

const GameBoard = () => {
  const executeCacheAbility = (
    card: Card,
    location: { type: 'person' | 'camp'; index: number } | null,
    order: 'punk_first' | 'raid_first'
  ) => {
    if (!location) return;

    const playerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
    const setPlayerState = gameState.currentTurn === 'left' ? setLeftPlayerState : setRightPlayerState;

    // Execute abilities in the specified order
    if (order === 'punk_first') {
      // 1. First gain punk, and set a flag to do the raid Eer punk placement
      gainPunk(gameState.currentTurn);
      setPendingRaidAfterPunk(true);
      // The raid will be executed after punk placement by a useEffect
    } else {
      // 1. First execute raid
      executeRaidEffect(gameState.currentTurn);

      // 2. Then gain punk
      // Note: We'll need to delay this if raid requires interaction
      setTimeout(() => {
        // Only proceed with punk gain if raid is complete
        if (!campRaidMode) {
          gainPunk(gameState.currentTurn);
        } else {
          // Store that we need to gain a punk after raid completes
          setPendingPunkGain(true);
        }
      }, 100);
    }

    // Mark the card as having used an ability
    markCardUsedAbility(
      card,
      location,
      gameState.currentTurn,
      leftPlayerState,
      rightPlayerState,
      setLeftPlayerState,
      setRightPlayerState,
      leftCardsUsedAbility,
      rightCardsUsedAbility,
      setLeftCardsUsedAbility,
      setRightCardsUsedAbility,
      hasVeraVoshTrait(playerState)
    );
  };

  // Handle when player sacrifices their person
  const handleOctagonSacrifice = (person: Card, slotIndex: number, isRightPlayer: boolean) => {
    // Destroy the selected person
    destroyCard(person, slotIndex, isRightPlayer);

    // Exit sacrifice mode
    setOctagonSacrificeMode(false);

    // Enter opponent sacrifice mode
    setOctagonOpponentSacrificeMode(true);

    // Show alert to opponent
    const opponentPlayer = gameState.currentTurn === 'left' ? 'RIGHT' : 'LEFT';
    alert(`${opponentPlayer} PLAYER: You must sacrifice one of your people.`);
  };

  // Handle when opponent sacrifices their person
  const handleOctagonOpponentSacrifice = (person: Card, slotIndex: number, isRightPlayer: boolean) => {
    // Destroy the selected person
    destroyCard(person, slotIndex, isRightPlayer);

    // Exit opponent sacrifice mode
    setOctagonOpponentSacrificeMode(false);
    setOctagonSourceCard(null);

    alert(`Opponent sacrificed ${person.name}.`);
  };

  // Handle a card being selected for discard from hand
  const handleScavengerCampDiscard = (card: Card) => {
    if (card.type === 'watersilo') {
      alert('You cannot discard Water Silo for this ability.');
      return;
    }

    // Remove card from hand
    const playerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
    const setPlayerState = gameState.currentTurn === 'left' ? setLeftPlayerState : setRightPlayerState;

    setPlayerState((prev) => ({
      ...prev,
      handCards: prev.handCards.filter((c) => c.id !== card.id),
    }));

    // Add to discard pile
    setDiscardPile((prev) => [...prev, card]);

    // Move to reward selection
    setScavengerCampSelectingCard(false);
    setScavengerCampSelectingReward(true);

    // Show choice modal
    showScavengerCampChoiceModal();
  };

  // Show modal for choosing between punk and water
  const showScavengerCampChoiceModal = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'scavenger-camp-modal';
    modal.innerHTML = `
    <div class="bg-gray-800 p-4 rounded-lg max-w-md w-full">
      <h2 class="text-white text-xl mb-4">Scavenger Camp</h2>
      <p class="text-white mb-4">Choose your reward:</p>
      <div class="flex gap-4">
        <button id="btn-punk" class="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded flex-1">
          Gain a Punk
        </button>
        <button id="btn-water" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex-1">
          Gain Water
        </button>
      </div>
    </div>
  `;

    document.body.appendChild(modal);

    // Add click handlers
    document.getElementById('btn-punk')?.addEventListener('click', () => {
      handleScavengerCampReward('punk');
      document.body.removeChild(modal);
    });

    document.getElementById('btn-water')?.addEventListener('click', () => {
      handleScavengerCampReward('water');
      document.body.removeChild(modal);
    });
  };

  // Handle reward selection
  const handleScavengerCampReward = (reward: 'punk' | 'water') => {
    const playerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
    const setPlayerState = gameState.currentTurn === 'left' ? setLeftPlayerState : setRightPlayerState;

    if (reward === 'punk') {
      // Gain a punk from the draw deck
      if (drawDeck.length > 0) {
        const punkCard = drawDeck[drawDeck.length - 1];
        setPunkCardToPlace(punkCard);
        setPunkPlacementMode(true);
        setDrawDeck((prev) => prev.slice(0, prev.length - 1));
        alert('You gained a punk! Place it in an empty person slot.');
      } else {
        alert('Draw deck is empty, cannot gain a punk!');
      }
    } else {
      // Gain 1 water
      setPlayerState((prev) => ({
        ...prev,
        waterCount: prev.waterCount + 1,
      }));
      alert('You gained 1 water!');
    }

    // Reset Scavenger Camp state
    setScavengerCampActive(false);
    setScavengerCampSelectingCard(false);
    setScavengerCampSelectingReward(false);
    setScavengerCampLocation(null);
  };

  // Helper function for gaining a punk
  const gainPunk = (playerSide: 'left' | 'right') => {
    // Check if there are cards in the draw deck
    if (drawDeck.length > 0) {
      const punkCard = drawDeck[drawDeck.length - 1];
      setPunkCardToPlace(punkCard);
      setPunkPlacementMode(true);
      setDrawDeck((prev) => prev.slice(0, prev.length - 1));
      alert(`Gain a punk!`);
    } else {
      alert('Draw deck is empty, cannot gain a punk!');
    }
  };

  // Helper function for executing raid
  const executeRaidEffect = (playerSide: 'left' | 'right') => {
    // Mark that an event is being played (for Zeto Kahn effect)
    markEventPlayed(playerSide, setLeftPlayedEventThisTurn, setRightPlayedEventThisTurn);

    // Check for Zeto Kahn's immediate effect
    const shouldExecuteImmediately = checkZetoKahnEffect(
      playerSide,
      leftPlayerState,
      rightPlayerState,
      leftPlayedEventThisTurn,
      rightPlayedEventThisTurn
    );

    if (shouldExecuteImmediately) {
      // Execute raid immediately
      executeRaid(playerSide);
    } else {
      // Normal Raiders movement logic
      const playerState = playerSide === 'left' ? leftPlayerState : rightPlayerState;
      const setPlayerState = playerSide === 'left' ? setLeftPlayerState : setRightPlayerState;

      // Handle Raiders movement based on current location
      handleRaidersMovement(playerSide, playerState, setPlayerState);
    }
  };

  // Handle Raiders movement based on current location
  const handleRaidersMovement = (
    playerSide: 'left' | 'right',
    playerState: PlayerState,
    setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>
  ) => {
    switch (playerState.raidersLocation) {
      case 'default':
        // Create Raiders card
        const raidersCard = {
          id: 'raiders',
          name: 'Raiders',
          type: 'event',
          startingQueuePosition: 2,
          owner: playerSide,
        };

        // Simple logic to manually place Raiders in the right slot
        // First try slot 2 (index 1)
        if (playerState.eventSlots[1] === null) {
          // Slot 2 is available, place Raiders there
          setPlayerState((prev) => ({
            ...prev,
            eventSlots: [prev.eventSlots[0], raidersCard, prev.eventSlots[2]],
            raidersLocation: 'event2',
          }));
        }
        // If slot 2 is occupied, try slot 3 (index 0)
        else if (playerState.eventSlots[0] === null) {
          // Slot 3 is available, place Raiders there
          setPlayerState((prev) => ({
            ...prev,
            eventSlots: [raidersCard, prev.eventSlots[1], prev.eventSlots[2]],
            raidersLocation: 'event3',
          }));
        }
        // If both slots are occupied
        else {
          alert('No valid slot available for Raiders!');
        }
        break;

      case 'event2':
        // Move to slot 1 if empty
        if (!playerState.eventSlots[2]) {
          setPlayerState((prev) => ({
            ...prev,
            eventSlots: [
              prev.eventSlots[0],
              null,
              { id: 'raiders', name: 'Raiders', type: 'event', startingQueuePosition: 1 },
            ],
            raidersLocation: 'event1',
          }));
        } else {
          alert('Event slot 1 occupied - cannot advance');
        }
        break;

      case 'event1':
        // Execute raid from slot 1
        executeRaid(playerSide);
        break;

      case 'event3':
        // Move from slot 3 to slot 2 if empty
        if (!playerState.eventSlots[1]) {
          setPlayerState((prev) => ({
            ...prev,
            eventSlots: [
              null, // Clear slot 3
              { id: 'raiders', name: 'Raiders', type: 'event', startingQueuePosition: 2 },
              prev.eventSlots[2],
            ],
            raidersLocation: 'event2',
          }));
        } else {
          alert('Event slot 2 is occupied. Raiders cannot advance.');
        }
        break;
    }
  };

  const isInteractable = (element: 'person' | 'event' | 'camp', elementPlayer: 'left' | 'right', slotIndex: number) => {
    // Default: Players can only interact with their own elements during their turn
    const isCurrentPlayerElement = gameState.currentTurn === elementPlayer;

    if (constructionYardSelectingPerson) {
      // When selecting a person to move, allow clicking on any person
      if (element === 'person') {
        const playerState = elementPlayer === 'left' ? leftPlayerState : rightPlayerState;
        const personCard = playerState.personSlots[slotIndex];
        return personCard !== null && canPersonBeMoved(personCard, slotIndex, elementPlayer);
      }
      return false;
    }

    if (constructionYardSelectingDestination && constructionYardSelectedPerson) {
      // When selecting a destination, we need to handle both empty and occupied slots
      if (element === 'person') {
        return isValidDestination(slotIndex, elementPlayer, constructionYardSelectedPerson);
      }
      return false;
    }

    if (omenClockActive) {
      // Only allow selecting events that can be advanced
      if (element === 'event') {
        const playerState = elementPlayer === 'left' ? leftPlayerState : rightPlayerState;
        const event = playerState.eventSlots[slotIndex];
        return event !== null && canEventBeAdvanced(event, slotIndex, elementPlayer);
      }
      return false;
    }

    if (opponentChoiceDamageMode) {
      // Allow the opponent to select their own UNPROTECTED cards
      const isOpponentElement = gameState.currentTurn !== elementPlayer;

      if (element === 'person') {
        const targetCard =
          elementPlayer === 'left' ? leftPlayerState.personSlots[slotIndex] : rightPlayerState.personSlots[slotIndex];
        return isOpponentElement && targetCard && !targetCard.isProtected;
      }

      if (element === 'camp') {
        const targetCamp =
          elementPlayer === 'left' ? leftPlayerState.campSlots[slotIndex] : rightPlayerState.campSlots[slotIndex];
        return isOpponentElement && targetCamp && !targetCamp.isProtected;
      }

      return false;
    }

    if (octagonSacrificeMode) {
      // The current player can select any of their people (including punks)
      if (element === 'person') {
        const targetCard =
          elementPlayer === 'left' ? leftPlayerState.personSlots[slotIndex] : rightPlayerState.personSlots[slotIndex];
        return elementPlayer === gameState.currentTurn && targetCard;
      }
      return false;
    }

    if (octagonOpponentSacrificeMode) {
      // The opponent must select one of their own people (including punks)
      if (element === 'person') {
        const targetCard =
          elementPlayer === 'left' ? leftPlayerState.personSlots[slotIndex] : rightPlayerState.personSlots[slotIndex];
        return elementPlayer !== gameState.currentTurn && targetCard;
      }
      return false;
    }

    if (multiRestoreMode) {
      // In multi-restore mode, player can target their own damaged cards (person or camp)
      const isCurrentPlayerElement = gameState.currentTurn === elementPlayer;

      if (element === 'person') {
        const targetCard =
          elementPlayer === 'left' ? leftPlayerState.personSlots[slotIndex] : rightPlayerState.personSlots[slotIndex];
        return isCurrentPlayerElement && targetCard && targetCard.isDamaged;
      }

      if (element === 'camp') {
        const targetCamp =
          elementPlayer === 'left' ? leftPlayerState.campSlots[slotIndex] : rightPlayerState.campSlots[slotIndex];

        return isCurrentPlayerElement && targetCamp && targetCamp.isDamaged;
      }

      return false;
    }

    if (mimicMode) {
      // In mimic mode, a player can interact with either:
      // 1. Their own ready person cards with abilities, or
      // 2. Undamaged enemy person cards with abilities
      if (element === 'person') {
        const targetCard =
          elementPlayer === 'left' ? leftPlayerState.personSlots[slotIndex] : rightPlayerState.personSlots[slotIndex];

        // First check if card exists and has abilities (applies to both own and enemy cards)
        if (!targetCard || targetCard.isPunk || !targetCard.abilities || targetCard.abilities.length === 0) {
          return false; // No abilities to mimic
        }

        if (elementPlayer === gameState.currentTurn) {
          // Own person cards - must be ready
          return targetCard.isReady && targetCard.id !== mimicSourceCard?.id;
        } else {
          // Enemy person cards - must be undamaged
          return !targetCard.isDamaged;
        }
      }
      return false;
    }

    if (restoreMode) {
      // For restore mode, a card is interactable if:
      // 1. It belongs to the restore player
      // 2. It is damaged
      if (element === 'person' || element === 'camp') {
        // Get the correct player state
        const elementPlayerState = elementPlayer === 'left' ? leftPlayerState : rightPlayerState;

        // Get the correct card based on element type
        const card =
          element === 'person' ? elementPlayerState.personSlots[slotIndex] : elementPlayerState.campSlots[slotIndex];

        // Get the source index from the game board element if available
        const gameBoard = document.getElementById('game-board');
        const restoreSourceIndex = gameBoard ? (gameBoard as any).restoreSourceIndex : undefined;

        // Special case for Repair Bot - can't target itself during its own restore effect
        const isRepairBotSource =
          card && card.name === 'Repair Bot' && element === 'person' && slotIndex === restoreSourceIndex;

        // Return true if card is damaged, belongs to restore player, and isn't the source Repair Bot
        return elementPlayer === restorePlayer && card && card.isDamaged && !isRepairBotSource;
      }
      return false; // Not a person or camp
    }

    if (sacrificeMode) {
      // In sacrifice mode, a player can only select their own people (including the Cult Leader itself)
      if (element === 'person') {
        const personCard =
          elementPlayer === 'left' ? leftPlayerState.personSlots[slotIndex] : rightPlayerState.personSlots[slotIndex];

        // Can select any of your own people, including the Cult Leader itself
        return elementPlayer === gameState.currentTurn && personCard;
      }
      return false;
    }

    if (damageColumnMode) {
      // In column damage mode, player can select any opponent column
      const isOpponentElement = gameState.currentTurn !== elementPlayer;

      // Only camps can be selected to represent a column
      if (element === 'camp') {
        return isOpponentElement;
      }

      return false;
    }

    if (destroyCampMode) {
      // In destroy camp mode, a player can target any enemy camp, regardless of protection
      const isOpponentElement = gameState.currentTurn !== elementPlayer;
      if (element === 'camp') {
        const targetCamp =
          elementPlayer === 'left' ? leftPlayerState.campSlots[slotIndex] : rightPlayerState.campSlots[slotIndex];
        return isOpponentElement && targetCamp; // No protection check for Molgur Stang
      }
      return false;
    }

    if (returnToHandMode) {
      // In return to hand mode, a player can only target their own person cards
      if (element === 'person') {
        return (
          elementPlayer === gameState.currentTurn &&
          (elementPlayer === 'left'
            ? leftPlayerState.personSlots[slotIndex] !== null
            : rightPlayerState.personSlots[slotIndex] !== null)
        );
      }
      return false;
    }

    if (injureMode) {
      // In injure mode, a player can only interact with opponent's unprotected person cards
      const isOpponentElement = gameState.currentTurn !== elementPlayer;
      if (element === 'person') {
        const targetCard =
          elementPlayer === 'left' ? leftPlayerState.personSlots[slotIndex] : rightPlayerState.personSlots[slotIndex];
        return isOpponentElement && targetCard && !targetCard.isProtected;
      }
      return false;
    }

    if (destroyPersonMode) {
      // In destroy person mode, a player can only target unprotected enemy person cards
      const isOpponentElement = gameState.currentTurn !== elementPlayer;
      if (element === 'person') {
        const targetCard =
          elementPlayer === 'left' ? leftPlayerState.personSlots[slotIndex] : rightPlayerState.personSlots[slotIndex];
        return isOpponentElement && targetCard && !targetCard.isProtected;
      }
      return false;
    }

    if (damageMode) {
      const isOpponentElement = gameState.currentTurn !== elementPlayer;

      // During Vanguard counter phase, target the original player's cards
      if (vanguardCounterActive) {
        const shouldTargetOriginalPlayer = elementPlayer === vanguardOriginalPlayer;

        if (element === 'person') {
          const targetCard =
            elementPlayer === 'left' ? leftPlayerState.personSlots[slotIndex] : rightPlayerState.personSlots[slotIndex];
          return shouldTargetOriginalPlayer && targetCard && !targetCard.isProtected;
        }
        if (element === 'camp') {
          const targetCamp =
            elementPlayer === 'left' ? leftPlayerState.campSlots[slotIndex] : rightPlayerState.campSlots[slotIndex];
          return shouldTargetOriginalPlayer && targetCamp && !targetCamp.isProtected;
        }
        return false;
      }

      // For Catapult - can target ANY card (own or opponent's)
      if (anyCardDamageMode) {
        if (element === 'person') {
          const targetCard =
            elementPlayer === 'left' ? leftPlayerState.personSlots[slotIndex] : rightPlayerState.personSlots[slotIndex];
          return targetCard && (sniperMode || !targetCard.isProtected);
        }
        if (element === 'camp') {
          const targetCamp =
            elementPlayer === 'left' ? leftPlayerState.campSlots[slotIndex] : rightPlayerState.campSlots[slotIndex];
          return targetCamp && (sniperMode || !targetCamp.isProtected);
        }
        return false;
      }

      // Special case for Sniper: can target any opponent card, even protected ones
      if (sniperMode) {
        if (element === 'person') {
          const targetCard =
            elementPlayer === 'left' ? leftPlayerState.personSlots[slotIndex] : rightPlayerState.personSlots[slotIndex];
          return isOpponentElement && targetCard; // No protection check for sniper
        }
        if (element === 'camp') {
          const targetCamp =
            elementPlayer === 'left' ? leftPlayerState.campSlots[slotIndex] : rightPlayerState.campSlots[slotIndex];
          return isOpponentElement && targetCamp; // No protection check for sniper
        }
        return false;
      }

      // Special case for Pyromaniac or Mercenary Camp: can only target camps
      if (campDamageMode) {
        // In camp damage mode, a player can only target unprotected enemy camps
        if (element === 'camp') {
          const targetCamp =
            elementPlayer === 'left' ? leftPlayerState.campSlots[slotIndex] : rightPlayerState.campSlots[slotIndex];

          // Check if this is an enemy camp AND it's not protected
          const isEnemyCamp = elementPlayer !== gameState.currentTurn;
          const isUnprotected = targetCamp && !targetCamp.isProtected;

          console.log('Camp targeting check:', {
            camp: targetCamp?.name,
            isEnemy: isEnemyCamp,
            isUnprotected,
            sniperMode, // Log if sniper mode is active
          });

          // Only allow targeting if it's an enemy camp AND either it's unprotected OR sniper mode is active
          return isEnemyCamp && targetCamp && (sniperMode || !targetCamp.isProtected);
        }
        return false;
      }

      // Normal damage logic for other cards - only opponent's unprotected cards
      if (element === 'person') {
        const targetCard =
          elementPlayer === 'left' ? leftPlayerState.personSlots[slotIndex] : rightPlayerState.personSlots[slotIndex];
        return isOpponentElement && targetCard && !targetCard.isProtected;
      }
      if (element === 'camp') {
        // Camps can also be damaged if unprotected
        const targetCamp =
          elementPlayer === 'left' ? leftPlayerState.campSlots[slotIndex] : rightPlayerState.campSlots[slotIndex];
        return isOpponentElement && targetCamp && !targetCamp.isProtected;
      }

      return false;
    }

    if (abilityRestoreMode) {
      // In restore mode, player can only target their own damaged cards
      const isCurrentPlayerElement = gameState.currentTurn === elementPlayer;

      if (element === 'person') {
        const targetCard =
          elementPlayer === 'left' ? leftPlayerState.personSlots[slotIndex] : rightPlayerState.personSlots[slotIndex];
        return isCurrentPlayerElement && targetCard && targetCard.isDamaged;
      }

      if (element === 'camp') {
        const targetCamp =
          elementPlayer === 'left' ? leftPlayerState.campSlots[slotIndex] : rightPlayerState.campSlots[slotIndex];

        // Add check for cannot_self_restore trait (this is the missing part!)
        if (targetCamp && targetCamp.traits?.includes('cannot_self_restore')) {
          // Check if this camp is the source of the restore effect
          const gameBoard = document.getElementById('game-board');
          const restoreSourceIndex = gameBoard && (gameBoard as any).restoreSourceIndex;

          // If this is the same camp that activated the restore, it can't target itself
          if (restoreSourceIndex !== undefined && restoreSourceIndex === slotIndex) {
            return false;
          }
        }

        return isCurrentPlayerElement && targetCamp && targetCamp.isDamaged;
      }

      return false;
    }

    if (restorePersonReadyMode) {
      // Only allow targeting damaged person cards
      if (element === 'camp') {
        const targetCamp =
          elementPlayer === 'left' ? leftPlayerState.campSlots[slotIndex] : rightPlayerState.campSlots[slotIndex];
      }

      // Camps are not valid targets for Atomic Garden
      return false;
    }

    if (punkPlacementMode) {
      // In punk placement mode, a player can only place on their own empty person slots
      return (
        elementPlayer === gameState.currentTurn &&
        element === 'person' &&
        (elementPlayer === 'left' ? !leftPlayerState.personSlots[slotIndex] : !rightPlayerState.personSlots[slotIndex])
      );
    }

    // Special case for camp raid mode
    if (campRaidMode && element === 'camp') {
      // During raid, only the opponent's camps are interactable
      return elementPlayer !== raidingPlayer;
    }

    // Default behavior - players can interact with their own elements during their turn
    if (element === 'camp') {
      const card =
        elementPlayer === 'left' ? leftPlayerState.campSlots[slotIndex] : rightPlayerState.campSlots[slotIndex];

      return (
        isCurrentPlayerElement &&
        gameState.currentPhase === 'actions' &&
        card &&
        card.abilities &&
        card.abilities.length > 0
      );
    }

    return isCurrentPlayerElement && gameState.currentPhase === 'actions';
  };

  const checkZetoKahnImmediateEffect = (playerSide: 'left' | 'right') => {
    // Get the current player state
    const playerState = playerSide === 'left' ? leftPlayerState : rightPlayerState;

    // Check for undamaged Zeto Kahn
    const hasUndamagedZetoKahn = playerState.personSlots.some((slot) => slot?.name === 'Zeto Kahn' && !slot.isDamaged);

    // Check if this is the first event played this turn
    const isFirstEventThisTurn = playerSide === 'left' ? !leftPlayedEventThisTurn : !rightPlayedEventThisTurn;

    // Log for debugging
    console.log(`Zeto Kahn check for ${playerSide}:`, {
      hasUndamagedZetoKahn,
      isFirstEventThisTurn,
      raidersLocation: playerState.raidersLocation,
    });

    // Return true if Zeto Kahn's effect should trigger (undamaged ZK + first event + raiders in default position)
    return hasUndamagedZetoKahn && isFirstEventThisTurn && playerState.raidersLocation === 'default';
  };

  // const testEventInSlot1: Card = {
  //   id: 'test-event-slot1',
  //   name: 'Test Event 1',
  //   type: 'event',
  //   startingQueuePosition: 1,
  //   owner: 'left',
  // };

  // const testEventInSlot2: Card = {
  //   id: 'test-event-slot2',
  //   name: 'Test Event 2',
  //   type: 'event',
  //   startingQueuePosition: 2,
  //   owner: 'left',
  // };

  // const testEventInSlot3: Card = {
  //   id: 'test-event-slot3',
  //   name: 'Test Event 3',
  //   type: 'event',
  //   startingQueuePosition: 3,
  //   owner: 'left',
  // };

  const checkAbilityEnabled = (card: Card) => {
    // Get the current player's used ability cards
    const usedAbilities = gameState.currentTurn === 'left' ? leftCardsUsedAbility : rightCardsUsedAbility;

    // First check: If Resonator has been used this turn, no other abilities can be used
    if (resonatorUsedThisTurn && card.name !== 'Resonator') {
      alert('You cannot use any other abilities this turn because you used Resonator.');
      return false;
    }

    // Second check: If any other ability has been used this turn, Resonator cannot be used
    if (card.name === 'Resonator' && usedAbilities.length > 0) {
      alert('You cannot use Resonator this turn because you have already used another ability.');
      return false;
    }
    // For Resonator itself
    if (card.name === 'Resonator' && card.abilities && card.abilities[0]?.type === 'exclusive_damage') {
      // This check is redundant with the above, but keeping for clarity
      if (usedAbilities.length > 0) {
        alert('You cannot use Resonator this turn because you have already used another ability.');
        return false;
      }
    }
    if (card.name === 'Catapult' && card.abilities && card.abilities[0]?.type === 'damage_then_sacrifice') {
      // Check if player has at least one person in play
      const playerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
      const hasPerson = playerState.personSlots.some((slot) => slot !== null && !slot.isPunk);

      if (!hasPerson) {
        alert('You need at least one person in play to use this ability!');
        return false; // Ability cannot be used
      }
    }

    if (card.name === 'Warehouse' && card.abilities && card.abilities[0]?.type === 'conditional_restore') {
      // Get the opponent player
      const opponentPlayer = gameState.currentTurn === 'left' ? 'right' : 'left';
      const opponentState = opponentPlayer === 'left' ? leftPlayerState : rightPlayerState;

      // Check if opponent has any unprotected camps
      const hasUnprotectedCamp = opponentState.campSlots.some((camp) => camp !== null && !camp.isProtected);

      if (!hasUnprotectedCamp) {
        alert('Opponent has no unprotected camps. Ability cannot be used.');
        return false; // Ability cannot be used
      }

      // Also check if the player has any damaged cards to restore
      const playerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
      const hasDamagedCard = [...playerState.personSlots, ...playerState.campSlots].some(
        (slot) => slot && slot.isDamaged && (!card.traits?.includes('cannot_self_restore') || slot.id !== card.id)
      );

      if (!hasDamagedCard) {
        alert('No damaged cards to restore!');
        return false; // Ability cannot be used
      }
    }

    if (card.name === 'Mercenary Camp' && card.abilities && card.abilities[0]?.type === 'conditional_damage_camp') {
      // Get the current player state
      const playerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;

      // Count how many people the player has (excluding punks)
      const peopleCount = playerState.personSlots.filter((card) => card !== null && !card.isPunk).length;

      // Check if the player has 4 or more people
      if (peopleCount < 4) {
        alert(`You only have ${peopleCount} people. You need at least 4 people to use this ability.`);
        return false; // Ability cannot be used
      }

      // Check if there are any enemy camps to target
      const opponentPlayer = gameState.currentTurn === 'left' ? 'right' : 'left';
      const opponentState = opponentPlayer === 'left' ? leftPlayerState : rightPlayerState;
      const hasCamps = opponentState.campSlots.some((camp) => camp !== null);

      if (!hasCamps) {
        alert('No enemy camps to target!');
        return false; // Ability cannot be used
      }
    }

    if (card.name === 'Training Camp' && card.abilities && card.abilities[0]?.type === 'conditional_damage') {
      // Check the column condition
      const playerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;

      // Determine which column this camp is in
      const campColumnIndex =
        card.type === 'camp' ? playerState.campSlots.findIndex((camp) => camp && camp.id === card.id) : -1;

      if (campColumnIndex >= 0) {
        // Count people in this column
        const frontRowIndex = campColumnIndex * 2;
        const backRowIndex = frontRowIndex + 1;

        const frontRowPerson = playerState.personSlots[frontRowIndex];
        const backRowPerson = playerState.personSlots[backRowIndex];

        const peopleInColumn =
          (frontRowPerson && !frontRowPerson.isPunk ? 1 : 0) + (backRowPerson && !backRowPerson.isPunk ? 1 : 0);

        if (peopleInColumn < 2) {
          alert(`You need 2 people in this column to use this ability. Current count: ${peopleInColumn}`);
          return false;
        }
      }
    }

    if (card.name === 'Transplant Lab' && card.abilities && card.abilities[0]?.type === 'conditional_restore') {
      // Get the current player state
      const playerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;

      // Check if player has played 2 or more people this turn
      const conditionMet = playerState.peoplePlayedThisTurn >= 2;

      if (!conditionMet) {
        alert(
          `You've only played ${playerState.peoplePlayedThisTurn} people this turn. You need to play at least 2 people to use this ability.`
        );
        return false; // Ability cannot be used
      }

      // Check if there are any damaged cards to restore (excluding self if cannot_self_restore trait exists)
      const hasDamagedCard = [...playerState.personSlots, ...playerState.campSlots].some(
        (slot) => slot && slot.isDamaged && (!card.traits?.includes('cannot_self_restore') || slot.id !== card.id)
      );

      if (!hasDamagedCard) {
        alert('No valid damaged cards to restore!');
        return false; // Ability cannot be used
      }
    }
    if (card.name === 'Arcade' && card.abilities && card.abilities[0]?.type === 'conditional_gain_punk') {
      // Get the current player state
      const playerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;

      // Count how many people the player has (excluding punks)
      const peopleCount = playerState.personSlots.filter((card) => card !== null && !card.isPunk).length;

      // Check if the player has 0 or 1 people
      const conditionMet = peopleCount <= 1;

      if (!conditionMet) {
        alert(`You have ${peopleCount} people. You need 0 or 1 people to use this ability.`);
        return false; // Ability cannot be used
      }
    }
    if (card.name === 'Exterminator' && card.abilities && card.abilities[0]?.type === 'destroy_damaged_all') {
      // Check if opponent has any damaged cards
      const opponentPlayer = gameState.currentTurn === 'left' ? 'right' : 'left';
      const opponentState = opponentPlayer === 'left' ? leftPlayerState : rightPlayerState;

      // Check if any person or camp is damaged
      const hasDamagedPerson = opponentState.personSlots.some((card) => card && card.isDamaged);
      const hasDamagedCamp = opponentState.campSlots.some((camp) => camp && camp.isDamaged);

      if (!hasDamagedPerson && !hasDamagedCamp) {
        alert('No damaged enemy cards to destroy!');
        return false; // Ability cannot be used
      }
    }

    // Check for Rabble Rouser's punk damage ability
    if (card.name === 'Rabble Rouser') {
      // Only disable if the specific ability being checked is punk_damage
      if (card.abilities && card.abilities.length > 1) {
        // The card has multiple abilities, don't disable the entire card
        // We'll check individual abilities in the modal
        return true;
      }
    }
    if (card.name === 'Pyromaniac' && card.abilities && card.abilities[0]?.type === 'damage_camp') {
      // Check if there are any unprotected enemy camps
      const opponentPlayer = gameState.currentTurn === 'left' ? 'right' : 'left';
      const opponentState = opponentPlayer === 'left' ? leftPlayerState : rightPlayerState;

      // Find any unprotected camps
      const unprotectedCamps = opponentState.campSlots.filter((camp) => camp && !camp.isProtected);

      if (unprotectedCamps.length === 0) {
        alert('No unprotected enemy camps to target!');
        return false; // Ability cannot be used
      }
    }

    if (card.name === 'Mulcher' && card.abilities && card.abilities[0]?.type === 'sacrifice_for_draw') {
      // Check if player has any people
      const playerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
      const hasPeople = playerState.personSlots.some((slot) => slot !== null);

      if (!hasPeople) {
        alert('You need a person to use this ability!');
        return false; // Ability cannot be used
      }
    }

    if (card.name === 'Doomsayer' && card.abilities && card.abilities[0]?.type === 'damage_conditional_event') {
      // Check if opponent has any event in queue
      const opponentPlayer = gameState.currentTurn === 'left' ? 'right' : 'left';
      const opponentState = opponentPlayer === 'left' ? leftPlayerState : rightPlayerState;

      // Check if any event slots are filled
      const hasEvent = opponentState.eventSlots.some((event) => event !== null);

      if (!hasEvent) {
        alert('Opponent has no events in queue! Ability cannot be used.');
        return false; // Ability cannot be used
      }
    }

    return true; // Default to allowing the ability
  };

  const handleEventsPhase = () => {
    const currentPlayerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
    const setCurrentPlayerState = gameState.currentTurn === 'left' ? setLeftPlayerState : setRightPlayerState;
    const opponentPlayer = gameState.currentTurn === 'left' ? 'right' : 'left';

    // Use the executeRaid function to trigger a raid
    const executeRaidEffect = (player: 'left' | 'right') => {
      // Return Raiders card to default position
      setCurrentPlayerState((prev) => ({
        ...prev,
        raidersLocation: 'default',
      }));

      // Set raid mode and message
      setCampRaidMode(true);
      setRaidingPlayer(player);
      setRaidMessage(`${opponentPlayer.toUpperCase()} PLAYER: Choose a camp to damage from the raid!`);
    };

    // Process any events in slot 1
    const eventProcessed = processEvents(
      currentPlayerState,
      setCurrentPlayerState,
      (card) => setDiscardPile((prev) => [...prev, card]),
      executeRaidEffect
    );

    // If it was a Raiders card, don't advance to next phase yet
    if (eventProcessed && currentPlayerState.eventSlots[2]?.id === 'raiders') {
      return;
    }

    // If no event in slot 1 or it wasn't Raiders, just advance the queue
    // This is done inside processEvents if there was an event, but if there wasn't,
    // we still need to advance the remaining events
    if (!eventProcessed) {
      setCurrentPlayerState((prev) => ({
        ...prev,
        eventSlots: advanceEventQueue(prev),
      }));
    }

    // After events are processed, move to Replenish phase
    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        currentPhase: 'replenish',
      }));
    }, 100);
  };

  const [leftPlayerState, setLeftPlayerState] = useState<PlayerState>({
    // Hand cards: several random people plus two with "gain_punk" junk effect
    handCards: [
      createPerson('magnus-karv'),
      createPerson('karli-blaze'),
      createPerson('vera-vosh'),
      createPerson('zeto-kahn'),
      createPerson('molgur-stang'),
      createPerson('argo-yesky'),
    ],

    // No people in person slots
    personSlots: [null, null, null, null, null, null],

    // Camp slots with Nest of Spies for testing
    campSlots: [createCamp('omen-clock'), createCamp('construction-yard'), { ...createCamp('oasis'), isDamaged: true }],

    // Other properties
    eventSlots: [null, null, null],
    waterSiloInHand: false,
    waterCount: 10, // Plenty of water for testing
    raidersLocation: 'default',
    peoplePlayedThisTurn: 0, // Initialize counter
  });

  const rightTestPersonSlots: (Card | null)[] = [
    { ...createPerson('vigilante'), isDamaged: true }, // Front row, column 1 - Added a Vigilante here
    null, // Back row, column 1
    createPerson('muse'), // Front row, column 2 - Added a Muse here
    null, // Back row, column 2
    null, // Front row, column 3
    null, // Back row, column 3
  ];

  // Initialize protected status for right player's slots
  const rightTestCamps: (Card | null)[] = [createCamp('outpost'), createCamp('resonator'), createCamp('cache')].filter(
    Boolean
  ) as Card[];

  const { personSlots: initializedRightTestPersonSlots, campSlots: initializedRightTestCamps } = updateProtectionStatus(
    rightTestPersonSlots,
    rightTestCamps
  );

  const [rightPlayerState, setRightPlayerState] = useState<PlayerState>({
    handCards: [...rightTestCards],
    personSlots: initializedRightTestPersonSlots,
    eventSlots: [createEvent('attack'), null, null],

    campSlots: initializedRightTestCamps,
    waterSiloInHand: false,
    waterCount: 2,
    raidersLocation: 'default',
    peoplePlayedThisTurn: 0,
  });

  // Run this in a useEffect or a button click handler to damage existing cards
  const addDamagedPersons = () => {
    setLeftPlayerState((prev) => ({
      ...prev,
      personSlots: [
        { ...createPerson('scout'), id: 'left-damaged-person-1', isDamaged: true, isReady: false },
        { ...createPerson('assassin'), id: 'left-damaged-person-2', isDamaged: true, isReady: false },
        { ...createPerson('gunner'), id: 'left-damaged-person-3', isDamaged: true, isReady: false },
        ...prev.personSlots.slice(3), // Keep any existing cards in the last three slots
      ],
    }));
  };

  // Call this function when needed
  // addDamagedPersons();

  const [drawDeck, setDrawDeck] = useState<Card[]>(drawDeckCards);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [cardToDiscard, setCardToDiscard] = useState<{ card: Card; sourcePlayer: string } | null>(null);
  const [punkPlacementMode, setPunkPlacementMode] = useState(false);
  const [punkCardToPlace, setPunkCardToPlace] = useState<Card | null>(null);
  const [restoreMode, setRestoreMode] = useState(false);
  const [restorePlayer, setRestorePlayer] = useState<'left' | 'right' | null>(null);
  const [restoreSourceIndex, setRestoreSourceIndex] = useState<number | undefined>(undefined);
  const [injureMode, setInjureMode] = useState(false);
  // Raid ability state
  const [abilityRaidMode, setAbilityRaidMode] = useState(false);
  const [raidSource, setRaidSource] = useState<Card | null>(null);
  const [destroyCampMode, setDestroyCampMode] = useState(false);
  const [isMutantModalOpen, setMutantModalOpen] = useState(false);
  const [mutantSourceCard, setMutantSourceCard] = useState<Card | null>(null);
  const [mutantSourceLocation, setMutantSourceLocation] = useState<{ type: 'person' | 'camp'; index: number } | null>(
    null
  );
  const [mutantDamageChosen, setMutantDamageChosen] = useState(false);
  const [mutantRestoreChosen, setMutantRestoreChosen] = useState(false);
  const [mutantPendingAction, setMutantPendingAction] = useState<'damage' | 'restore' | null>(null);

  const [sacrificePendingDamage, setSacrificePendingDamage] = useState(false);

  // Ability modal state
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedCardLocation, setSelectedCardLocation] = useState<{ type: 'person' | 'camp'; index: number } | null>(
    null
  );
  // Damage ability targeting state
  const [damageMode, setDamageMode] = useState(false);
  const [damageSource, setDamageSource] = useState<Card | null>(null);
  const [damageValue, setDamageValue] = useState(0);
  const [destroyPersonMode, setDestroyPersonMode] = useState(false);
  // Restore ability targeting state
  const [abilityRestoreMode, setAbilityRestoreMode] = useState(false);
  const [restoreSource, setRestoreSource] = useState<Card | null>(null);
  const [isAbilityModalOpen, setIsAbilityModalOpen] = useState(false);
  const [sniperMode, setSniperMode] = useState(false);
  const [campDamageMode, setCampDamageMode] = useState(false);
  const [raidingPlayer, setRaidingPlayer] = useState<'left' | 'right' | null>(null);
  const [raidMessage, setRaidMessage] = useState('');
  const [returnToHandMode, setReturnToHandMode] = useState(false);
  const [damageColumnMode, setDamageColumnMode] = useState(false);
  const [scientistCards, setScientistCards] = useState<Card[]>([]);
  const [isScientistModalOpen, setIsScientistModalOpen] = useState(false);
  const [discardSelectionCount, setDiscardSelectionCount] = useState<number>(0);
  const [discardSelectionActive, setDiscardSelectionActive] = useState<boolean>(false);
  const [vanguardPendingCounter, setVanguardPendingCounter] = useState(false);
  const [vanguardCounterActive, setVanguardCounterActive] = useState(false);
  const [vanguardOriginalPlayer, setVanguardOriginalPlayer] = useState<'left' | 'right' | null>(null);
  // Mimic ability states
  const [mimicMode, setMimicMode] = useState(false);
  const [mimicSourceCard, setMimicSourceCard] = useState<Card | null>(null);
  const [mimicSourceLocation, setMimicSourceLocation] = useState<{ type: 'person' | 'camp'; index: number } | null>(
    null
  );

  const [leftPlayedEventThisTurn, setLeftPlayedEventThisTurn] = useState(false);
  const [rightPlayedEventThisTurn, setRightPlayedEventThisTurn] = useState(false);
  const [leftCardsUsedAbility, setLeftCardsUsedAbility] = useState<string[]>([]);
  const [rightCardsUsedAbility, setRightCardsUsedAbility] = useState<string[]>([]);
  const [restorePersonReadyMode, setRestorePersonReadyMode] = useState(false);
  const [multiRestoreMode, setMultiRestoreMode] = useState(false);
  const [restoreModeCount, setRestoreModeCount] = useState(0);
  const [showRestoreDoneButton, setShowRestoreDoneButton] = useState(false);
  const [sacrificeMode, setSacrificeMode] = useState(false);
  const [sacrificeEffect, setSacrificeEffect] = useState<'draw' | 'water' | 'restore' | null>(null);
  const [sacrificeSource, setSacrificeSource] = useState<Card | null>(null);
  const [supplyDepotDrawnCards, setSupplyDepotDrawnCards] = useState<Card[]>([]);
  const [supplyDepotDiscardMode, setSupplyDepotDiscardMode] = useState(false);
  const [showCacheModal, setShowCacheModal] = useState(false);
  const [cacheCard, setCacheCard] = useState<Card | null>(null);
  const [cacheLocation, setCacheLocation] = useState<{ type: 'person' | 'camp'; index: number } | null>(null);
  const [campRaidMode, setCampRaidMode] = useState(false);
  const [pendingPunkGain, setPendingPunkGain] = useState(false);
  const [pendingRaidAfterPunk, setPendingRaidAfterPunk] = useState(false);
  const [opponentChoiceDamageMode, setOpponentChoiceDamageMode] = useState(false);
  const [opponentChoiceDamageValue, setOpponentChoiceDamageValue] = useState(0);
  const [opponentChoiceDamageSource, setOpponentChoiceDamageSource] = useState<Card | null>(null);
  const [anyCardDamageMode, setAnyCardDamageMode] = useState(false);
  const [octagonSacrificeMode, setOctagonSacrificeMode] = useState(false);
  const [octagonOpponentSacrificeMode, setOctagonOpponentSacrificeMode] = useState(false);
  const [octagonSourceCard, setOctagonSourceCard] = useState<Card | null>(null);
  const [scavengerCampActive, setScavengerCampActive] = useState(false);
  const [scavengerCampSelectingCard, setScavengerCampSelectingCard] = useState(false);
  const [scavengerCampSelectingReward, setScavengerCampSelectingReward] = useState(false);
  const [scavengerCampLocation, setScavengerCampLocation] = useState<{ type: 'camp'; index: number } | null>(null);
  const [resonatorUsedThisTurn, setResonatorUsedThisTurn] = useState<boolean>(false);
  const [omenClockActive, setOmenClockActive] = useState(false);
  const [omenClockLocation, setOmenClockLocation] = useState<{ type: 'camp'; index: number } | null>(null);
  const [constructionYardActive, setConstructionYardActive] = useState(false);
  const [constructionYardSelectingPerson, setConstructionYardSelectingPerson] = useState(false);
  const [constructionYardSelectingDestination, setConstructionYardSelectingDestination] = useState(false);
  const [constructionYardSelectedPerson, setConstructionYardSelectedPerson] = useState<{
    card: Card;
    slotIndex: number;
    player: 'left' | 'right';
  } | null>(null);

  const gameBoardRef = useRef(null);

  // Function to handle gaining a punk
  const punkEffect = (playerSide: 'left' | 'right') => {
    console.log(`Punk effect triggered for ${playerSide} player`);

    // Get the player state and setter based on the player side
    const playerState = playerSide === 'left' ? leftPlayerState : rightPlayerState;
    const setPlayerState = playerSide === 'left' ? setLeftPlayerState : setRightPlayerState;

    // Check if there are cards in the draw deck
    if (drawDeck.length > 0) {
      const punkCard = drawDeck[drawDeck.length - 1];
      setPunkCardToPlace(punkCard);
      setPunkPlacementMode(true);
      setDrawDeck((prev) => prev.slice(0, prev.length - 1));
    } else {
      alert('Draw deck is empty, cannot gain a punk!');
    }
  };

  const restoreEffect = (playerSide: 'left' | 'right', sourceIndex?: number) => {
    console.log(`Restore effect triggered for ${playerSide} player, source index:`, sourceIndex);

    // Enter restore mode
    setRestoreMode(true);
    setRestorePlayer(playerSide);
    setRestoreSourceIndex(sourceIndex);

    alert('Select a damaged card to restore');
  };

  // Function to handle drawing a card and damaging the Wounded Soldier
  const drawAndDamageEffect = (playerSide: 'left' | 'right', slotIndex: number) => {
    console.log(`Draw and damage effect triggered for ${playerSide} player at slot ${slotIndex}`);

    // Get the player state and setter
    const playerState = playerSide === 'left' ? leftPlayerState : rightPlayerState;
    const setPlayerState = playerSide === 'left' ? setLeftPlayerState : setRightPlayerState;

    // 1. Draw a card if available
    if (drawDeck.length > 0) {
      const topCard = drawDeck[drawDeck.length - 1];

      setPlayerState((prev) => ({
        ...prev,
        handCards: [...prev.handCards, topCard],
      }));

      setDrawDeck((prev) => prev.slice(0, -1));

      // 2. Damage the Wounded Soldier
      setPlayerState((prev) => ({
        ...prev,
        personSlots: prev.personSlots.map((slot, i) =>
          i === slotIndex ? { ...slot, isDamaged: true, isReady: false } : slot
        ),
      }));

      console.log(`${playerSide} player drew a card and damaged slot ${slotIndex}`);
    } else {
      alert('Draw deck is empty! Still damaging the Wounded Soldier.');

      // Still damage the card even if draw deck is empty
      setPlayerState((prev) => ({
        ...prev,
        personSlots: prev.personSlots.map((slot, i) =>
          i === slotIndex ? { ...slot, isDamaged: true, isReady: false } : slot
        ),
      }));
    }
  };

  const delayEventsEffect = (opponentSide: 'left' | 'right') => {
    console.log(`Attempting to delay ${opponentSide} player's events`);

    // Get the opponent state and setter
    const opponentState = opponentSide === 'left' ? leftPlayerState : rightPlayerState;
    const setOpponentState = opponentSide === 'left' ? setLeftPlayerState : setRightPlayerState;

    // In our eventSlots array:
    // eventSlots[0] = slot 3 (leftmost/furthest from activation)
    // eventSlots[1] = slot 2 (middle)
    // eventSlots[2] = slot 1 (rightmost/closest to activation)

    // Get the current events
    const events = [...opponentState.eventSlots];
    console.log('Initial event slots:', events);

    // Create a new array for the moved events
    const newEvents = [...events];
    let anyEventsMoved = false;

    // First, try to move an event from slot 2 to slot 3
    if (events[1] !== null && events[0] === null) {
      console.log('Moving event from slot 2 to slot 3');
      newEvents[0] = events[1]; // Move to slot 3
      newEvents[1] = null; // Clear slot 2
      anyEventsMoved = true;
    }

    // Now slot 2 might be empty, so try to move an event from slot 1 to slot 2
    // CRITICAL: We check newEvents[1] here, not events[1], to account for the previous move
    if (events[2] !== null && newEvents[1] === null) {
      console.log('Moving event from slot 1 to slot 2');
      newEvents[1] = events[2]; // Move to slot 2
      newEvents[2] = null; // Clear slot 1
      anyEventsMoved = true;
    }

    // If no events were moved, show a message
    if (!anyEventsMoved) {
      alert("No events can be moved back - either there are no events or there's no room to move them.");
      return;
    }

    console.log('Final event arrangement:', newEvents);

    // Ask user if they want to delay events
    const confirmDelay = window.confirm(
      "Do you want to delay opponent's events? This will move eligible events back one position in the queue."
    );

    if (!confirmDelay) {
      return; // User canceled
    }

    setOpponentState((prev) => ({
      ...prev,
      eventSlots: newEvents,
    }));

    alert(`Opponent's events have been delayed in the queue!`);
  };

  const stateSetters = {
    setLeftPlayerState,
    setRightPlayerState,
    setDamageMode,
    setDamageValue,
    setDamageSource,
    setDrawDeck,
    setRestoreMode,
    setRestorePlayer,
    setRestoreSourceIndex: (index: number | undefined) => {
      if (gameBoardRef.current) {
        (gameBoardRef.current as any).restoreSourceIndex = index;
      }
    },
    setInjureMode,
    setSniperMode,
    setCampDamageMode,
    setDamageColumnMode,
    setDestroyPersonMode,
    setDestroyCampMode,
    setReturnToHandMode,
    setMultiRestoreMode,
    setMutantModalOpen,
    setMutantSourceCard,
    setMutantSourceLocation,
    setMutantPendingAction,
    setSacrificeMode,
    setSacrificePendingDamage,
    setVanguardPendingCounter,
    setPunkCardToPlace,
    setPunkPlacementMode,
    setDiscardSelectionCount,
    setDiscardSelectionActive,
    setCampRaidMode,
    setRaidingPlayer,
    setRaidMessage,
    setLeftPlayedEventThisTurn,
    setRightPlayedEventThisTurn,
    setDiscardPile,
    setScientistCards,
    setIsScientistModalOpen,
    setConstructionYardActive,
    setConstructionYardSelectingPerson,
    setConstructionYardSelectingDestination,
    setConstructionYardSelectedPerson,
    setVanguardCounterActive,
    setAnyCardDamageMode,
    setOpponentChoiceDamageMode,
    setRestorePersonReadyMode,
    setShowRestoreDoneButton,
    setOpponentChoiceDamageSource,
  };

  useEffect(() => {
    return () => {
      // Clean up on unmount
      const modal = document.getElementById('scavenger-camp-modal');
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    };
  }, []);

  useEffect(() => {
    console.log('campDamageMode changed:', campDamageMode);
  }, [campDamageMode]);

  useEffect(() => {
    console.log(
      'Discard pile contents:',
      discardPile.map((card) => `${card.name} (${card.id})`)
    );
  }, [discardPile]);

  useEffect(() => {
    // Check if punk placement is complete and we need to execute a raid
    if (!punkPlacementMode && pendingRaidAfterPunk) {
      executeRaidEffect(gameState.currentTurn);
      setPendingRaidAfterPunk(false);
    }
  }, [punkPlacementMode, pendingRaidAfterPunk]);

  // Handle the pending punk gain after raid completes
  useEffect(() => {
    if (pendingPunkGain && !campRaidMode) {
      // Raid has completed, now gain the punk
      gainPunk(gameState.currentTurn);
      setPendingPunkGain(false);
    }
  }, [campRaidMode, pendingPunkGain]);

  useEffect(() => {
    if (gameBoardRef.current) {
      // Game mechanics functions
      (gameBoardRef.current as any).punkEffect = punkEffect;
      (gameBoardRef.current as any).restoreEffect = restoreEffect;
      (gameBoardRef.current as any).drawAndDamageEffect = drawAndDamageEffect;
      (gameBoardRef.current as any).delayEventsEffect = delayEventsEffect;
      (gameBoardRef.current as any).setDestroyPersonMode = setDestroyPersonMode;
      (gameBoardRef.current as any).currentTurn = gameState.currentTurn;
      (gameBoardRef.current as any).leftPlayedEventThisTurn = leftPlayedEventThisTurn;
      (gameBoardRef.current as any).rightPlayedEventThisTurn = rightPlayedEventThisTurn;
      (gameBoardRef.current as any).setLeftPlayedEventThisTurn = setLeftPlayedEventThisTurn;
      (gameBoardRef.current as any).setRightPlayedEventThisTurn = setRightPlayedEventThisTurn;
      (gameBoardRef.current as any).addToDiscardPile = addToDiscardPile;
    }
  }, []); // Remove dependencies to avoid re-assigning on every state change

  useEffect(() => {
    // Initialize the ability system when the component mounts
    try {
      initializeAbilitySystem();
      console.log('Ability system initialized successfully');
    } catch (error) {
      console.error('Error initializing ability system:', error);
    }
  }, []);

  const [gameState, setGameState] = useState<GameTurnState>({
    currentTurn: 'left', // left player starts
    currentPhase: 'events', // start with events phase
    isFirstTurn: true,
  });

  // Add this new function
  const triggerEventImmediately = (event: Card, player: 'left' | 'right') => {
    // Mark that an event was played
    if (player === 'left') {
      setLeftPlayedEventThisTurn(true);
    } else {
      setRightPlayedEventThisTurn(true);
    }

    // Handle different event types
    if (event.id.includes('ambush') || event.id.includes('attack') || event.id.includes('assault')) {
      // For these common events, they typically cause a raid

      // Set up raid mode for the appropriate player
      const opponentPlayer = player === 'left' ? 'right' : 'left';
      setCampRaidMode(true);
      setRaidingPlayer(player);
      setRaidMessage(`${opponentPlayer.toUpperCase()} PLAYER: Choose a camp to damage from the ${event.name}!`);
    } else if (event.id.includes('raiders')) {
      // If it's the Raiders event
      executeRaid(player);
    } else {
      // For other event types, add specific handling as needed
      alert(`Event ${event.name} triggered but no specific action defined.`);
    }

    // Add the event to the discard pile
    addToDiscardPile(event);
  };

  // Check if a person can be moved (all people are movable with Construction Yard)
  const canPersonBeMoved = (card: Card, slotIndex: number, player: 'left' | 'right'): boolean => {
    // All person cards can be moved, regardless of protection
    return card && card.type === 'person';
  };

  // Check if a slot is a valid destination for a person
  const isValidDestination = (
    destinationIndex: number,
    destinationPlayer: 'left' | 'right',
    selectedPerson: { card: Card; slotIndex: number; player: 'left' | 'right' }
  ): boolean => {
    // Can only move to the same player's side
    if (destinationPlayer !== selectedPerson.player) {
      return false;
    }

    // Can't move to the same slot
    if (destinationIndex === selectedPerson.slotIndex) {
      return false;
    }

    // Get player state
    const playerState = destinationPlayer === 'left' ? leftPlayerState : rightPlayerState;

    // If destination slot is empty, it's valid
    if (playerState.personSlots[destinationIndex] === null) {
      return true;
    }

    // If destination slot has a card, check if we can push it
    // Determine which column this is
    const column = Math.floor(destinationIndex / 2);

    // Determine if this is front or back row
    const isFrontRow = destinationIndex % 2 === 0;

    // Calculate the other slot index in the same column
    const otherSlotIndex = isFrontRow ? destinationIndex + 1 : destinationIndex - 1;

    // Check if the other slot in the column is empty
    if (playerState.personSlots[otherSlotIndex] === null) {
      // One more check: make sure we're not trying to push the card we originally selected
      return otherSlotIndex !== selectedPerson.slotIndex;
    }

    return false;
  };

  // Handle when a person is selected to be moved
  const handlePersonSelected = (card: Card, slotIndex: number, player: 'left' | 'right') => {
    // Store selected person
    setConstructionYardSelectedPerson({ card, slotIndex, player });

    // Switch to destination selection mode
    setConstructionYardSelectingPerson(false);
    setConstructionYardSelectingDestination(true);

    alert(
      `Selected ${card.name}. Now select an eligible slot on the same side to move this person to. You can push a card if there is room in the column.`
    );
  };

  // Handle when a destination is selected
  // Update this function to handle pushing
  const handleDestinationSelected = (destinationIndex: number, destinationPlayer: 'left' | 'right') => {
    if (!constructionYardSelectedPerson) return;

    const { card, slotIndex, player } = constructionYardSelectedPerson;

    // Get player states and setters
    const sourcePlayerState = player === 'left' ? leftPlayerState : rightPlayerState;
    const sourceSetPlayerState = player === 'left' ? setLeftPlayerState : setRightPlayerState;

    // Check if destination has a card (push case)
    const destinationCard = sourcePlayerState.personSlots[destinationIndex];

    // If destination has a card, we need to push it
    if (destinationCard) {
      // Determine which column this is
      const column = Math.floor(destinationIndex / 2);

      // Determine if this is front or back row
      const isFrontRow = destinationIndex % 2 === 0;

      // Calculate the other slot index in the same column
      const otherSlotIndex = isFrontRow ? destinationIndex + 1 : destinationIndex - 1;

      // Move card to destination, push existing card to other slot
      sourceSetPlayerState((prev) => {
        // Create new arrays to avoid direct state mutation
        const newPersonSlots = [...prev.personSlots];

        // Remove selected card from original position
        newPersonSlots[slotIndex] = null;

        // Push existing card to the empty slot in same column
        newPersonSlots[otherSlotIndex] = destinationCard;

        // Place selected card in the destination slot
        newPersonSlots[destinationIndex] = card;

        // Update protection status
        const { personSlots, campSlots } = updateProtectionStatus(newPersonSlots, prev.campSlots);

        return {
          ...prev,
          personSlots,
          campSlots,
        };
      });

      alert(
        `Moved ${card.name} to the new position, pushing ${destinationCard.name} to ${
          isFrontRow ? 'back' : 'front'
        } row.`
      );
    } else {
      // Normal move without pushing (destination is empty)
      sourceSetPlayerState((prev) => {
        // Create new arrays to avoid direct state mutation
        const newPersonSlots = [...prev.personSlots];

        // Remove from original position
        newPersonSlots[slotIndex] = null;

        // Add to new position
        newPersonSlots[destinationIndex] = card;

        // Update protection status
        const { personSlots, campSlots } = updateProtectionStatus(newPersonSlots, prev.campSlots);

        return {
          ...prev,
          personSlots,
          campSlots,
        };
      });

      alert(`Moved ${card.name} to the new position.`);
    }

    // Reset Construction Yard mode
    setConstructionYardActive(false);
    setConstructionYardSelectingPerson(false);
    setConstructionYardSelectingDestination(false);
    setConstructionYardSelectedPerson(null);
  };

  // Check if a person card should get the Oasis discount
  const getOasisDiscount = (slotIndex: number, player: 'left' | 'right'): number => {
    // Get the player state
    const playerState = player === 'left' ? leftPlayerState : rightPlayerState;

    // Get the column where this person is being played
    const column = Math.floor(slotIndex / 2);

    // Check if there's an Oasis camp in this column
    const hasCampWithDiscountTrait =
      playerState.campSlots[column] && playerState.campSlots[column]?.traits?.includes('discount_column');

    // If no Oasis in this column, no discount
    if (!hasCampWithDiscountTrait) {
      return 0;
    }

    // Check if column is empty of people
    const frontRowIndex = column * 2;
    const backRowIndex = frontRowIndex + 1;
    const columnIsEmpty = !playerState.personSlots[frontRowIndex] && !playerState.personSlots[backRowIndex];

    // Apply discount only if column is empty
    return columnIsEmpty ? 1 : 0;
  };

  // Calculate the displayed cost of a card with Oasis discount
  const getDisplayCost = (card: Card): number => {
    if (!card || card.type !== 'person' || !card.playCost) {
      return 0;
    }

    // For person cards in hand, show potential discount when dragging
    const baseWaterCost = card.playCost || 0;
    const oasisDiscount = getOasisDiscount(index, player);

    // Never reduce cost below 0
    return Math.max(0, baseWaterCost - oasisDiscount);
  };

  const handleReplenishPhase = () => {
    const currentPlayerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
    const setCurrentPlayerState = gameState.currentTurn === 'left' ? setLeftPlayerState : setRightPlayerState;

    // Draw top card from draw deck if available
    if (drawDeck.length > 0) {
      const topCard = drawDeck[drawDeck.length - 1];
      setCurrentPlayerState((prev) => ({
        ...prev,
        handCards: [...prev.handCards, topCard],
      }));
      setDrawDeck((prev) => prev.slice(0, -1));
    }

    // Reset water count to 3
    // setCurrentPlayerState((prev) => ({
    //   ...prev,
    //   waterCount: 3,
    // }));

    // After replenish is complete, move to Actions phase
    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        currentPhase: 'actions',
      }));
    }, 100);
  };

  // Check if an event can be advanced (has an empty space ahead)
  const canEventBeAdvanced = (event: Card, slotIndex: number, player: 'left' | 'right'): boolean => {
    const playerState = player === 'left' ? leftPlayerState : rightPlayerState;

    // Event in slot 3 (index 0) can advance to slot 2 (index 1) if slot 2 is empty
    if (slotIndex === 0 && playerState.eventSlots[1] === null) {
      return true;
    }

    // Event in slot 2 (index 1) can advance to slot 1 (index 2) if slot 1 is empty
    if (slotIndex === 1 && playerState.eventSlots[2] === null) {
      return true;
    }

    //Event in slot 1 (index 2) can be triggered immediately
    if (slotIndex === 2) {
      return true;
    }

    return false;
  };

  // Update this function
  const advanceEventByOne = (event: Card, slotIndex: number, player: 'left' | 'right') => {
    const setPlayerState = player === 'left' ? setLeftPlayerState : setRightPlayerState;
    const playerState = player === 'left' ? leftPlayerState : rightPlayerState;

    // Create a copy of the event slots
    const newEventSlots = [...playerState.eventSlots];

    // Handle moving from slot 3 (index 0) to slot 2 (index 1)
    if (slotIndex === 0 && newEventSlots[1] === null) {
      newEventSlots[1] = event; // Move to slot 2
      newEventSlots[0] = null; // Clear slot 3

      // Update the player state
      setPlayerState((prev) => ({
        ...prev,
        eventSlots: newEventSlots,
      }));

      alert(`Advanced ${event.name} forward by one queue position.`);
    }

    // Handle moving from slot 2 (index 1) to slot 1 (index 2)
    else if (slotIndex === 1 && newEventSlots[2] === null) {
      newEventSlots[2] = event; // Move to slot 1
      newEventSlots[1] = null; // Clear slot 2

      // Update the player state
      setPlayerState((prev) => ({
        ...prev,
        eventSlots: newEventSlots,
      }));

      alert(`Advanced ${event.name} forward by one queue position.`);
    }

    // NEW: Handle triggering event from slot 1 (index 2) immediately
    else if (slotIndex === 2) {
      // Remove the event from slot 1
      newEventSlots[2] = null;

      // Update the player state to remove the event
      setPlayerState((prev) => ({
        ...prev,
        eventSlots: newEventSlots,
      }));

      // Process the event effect based on its type
      triggerEventImmediately(event, player);

      alert(`Triggered ${event.name} immediately!`);
    }

    // Exit Omen Clock mode
    setOmenClockActive(false);
    setOmenClockLocation(null);
  };

  const destroyCard = (card: Card, slotIndex: number, isRightPlayer: boolean) => {
    console.log(
      `destroyCard called for: ${card.name} (${card.id}), slotIndex: ${slotIndex}, isRightPlayer: ${isRightPlayer}`
    );
    // Get the correct player's state and setter
    const playerState = isRightPlayer ? rightPlayerState : leftPlayerState;
    const setPlayerState = isRightPlayer ? setRightPlayerState : setLeftPlayerState;

    if (card.type === 'camp') {
      return; // Exit early
    }

    if (card.isPunk) {
      // Punks go back to the draw deck
      console.log('Punk destroyed, returning to top of draw deck');
      // Create a cleaned card version to put back in the draw deck
      const cleanedCard = {
        id: card.id,
        name: card.name || 'Unknown Card', // Ensure name is set
        type: 'person',
        // Remove punk-specific properties
      };
      setDrawDeck((prev) => [cleanedCard, ...prev]);
      console.log('Draw deck updated, new length:', drawDeck.length + 1);
    } else {
      // Regular cards go to discard pile
      setDiscardPile((prev) => [...prev, card]);
      console.log('Card added to discard pile, new length:', discardPile.length + 1);
    }

    // Remove card from slot and update protection status
    setPlayerState((prev) => {
      const updatedSlots = prev.personSlots.map((slot, i) => (i === slotIndex ? null : slot));
      const { personSlots, campSlots } = updateProtectionStatus(updatedSlots, prev.campSlots);

      return {
        ...prev,
        personSlots,
        campSlots,
      };
    });
  };

  const destroyCamp = (camp: Card, slotIndex: number, isRightPlayer: boolean) => {
    const setPlayerState = isRightPlayer ? setRightPlayerState : setLeftPlayerState;

    // Simply set the camp slot to null
    setPlayerState((prev) => ({
      ...prev,
      campSlots: prev.campSlots.map((c, i) => (i === slotIndex ? null : c)),
    }));

    console.log(`Camp "${camp.name}" destroyed in slot ${slotIndex}`);
  };

  const getColumnFromSlotIndex = (slotIndex: number) => {
    return Math.floor(slotIndex / 2);
  };

  const checkAbilityCondition = (
    condition: string,
    card: Card,
    location: { type: 'person' | 'camp'; index: number },
    playerState: PlayerState
  ): { satisfied: boolean; message?: string } => {
    switch (condition) {
      case 'self_undamaged':
        return {
          satisfied: !card.isDamaged,
          message: card.isDamaged ? 'This card must be undamaged to use this ability.' : undefined,
        };

      case 'two_people_in_column':
        // Determine which column this camp is in
        const campColumnIndex = location.index; // Camp slots align with columns

        // Count people in this column (front and back row)
        const frontRowIndex = campColumnIndex * 2; // Convert column to person slot index
        const backRowIndex = frontRowIndex + 1;

        const frontRowPerson = playerState.personSlots[frontRowIndex];
        const backRowPerson = playerState.personSlots[backRowIndex];

        // Check if both slots in the column have people (not null and not punks)
        const peopleInColumn =
          (frontRowPerson && !frontRowPerson.isPunk ? 1 : 0) + (backRowPerson && !backRowPerson.isPunk ? 1 : 0);

        return {
          satisfied: peopleInColumn >= 2,
          message: `You need 2 people in this column. Current count: ${peopleInColumn}`,
        };

      // Add more conditions as needed

      default:
        return { satisfied: false, message: 'Unknown condition' };
    }
  };

  const addToDiscardPile = (card: Card) => {
    console.log(`GameBoard: addToDiscardPile called for: ${card.name} (${card.id})`);
    console.log(
      'GameBoard: Current discard pile:',
      discardPile.map((c) => c.name)
    );
    setDiscardPile((prev) => {
      console.log('GameBoard: Setting discard pile, current length:', prev.length);
      return [...prev, card];
    });
    console.log('GameBoard: setDiscardPile called');
  };

  const applyDamage = (target: Card, slotIndex: number, isRightPlayer: boolean) => {
    const playerState = isRightPlayer ? rightPlayerState : leftPlayerState;
    const setPlayerState = isRightPlayer ? setRightPlayerState : setLeftPlayerState;
    const currentPlayerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
    const setCurrentPlayerState = gameState.currentTurn === 'left' ? setLeftPlayerState : setRightPlayerState;

    const targetType = target.type;

    // Use the correct damage value based on the active mode
    const damageValueToApply = opponentChoiceDamageMode ? opponentChoiceDamageValue : damageValue;

    const wasDestroyed = applyDamageToTarget(
      target,
      slotIndex,
      isRightPlayer,
      setPlayerState,
      destroyCard,
      damageValueToApply
    );

    // Show appropriate message based on result
    if (wasDestroyed) {
      alert(`${target.isPunk ? 'Punk' : 'Damaged card'} destroyed!`);
    }

    // Check for secondary effects based on the damage source
    if (damageSource && damageSource.abilities) {
      const ability = damageSource.abilities.find((a) => a.type === 'damage');
      if (ability && ability.secondaryEffect) {
        const { condition, type, value } = ability.secondaryEffect;

        // Check if condition is met
        let conditionMet = false;

        if (condition === 'hits_camp' && targetType === 'camp') {
          conditionMet = true;
        }

        // Execute secondary effect if condition met
        if (conditionMet) {
          switch (type) {
            case 'draw':
              // Draw cards
              if (drawDeck.length > 0) {
                const cardsToDraw = value || 1;
                const cardsDrawn = Math.min(cardsToDraw, drawDeck.length);
                const drawnCards = drawDeck.slice(-cardsDrawn);

                setCurrentPlayerState((prev) => ({
                  ...prev,
                  handCards: [...prev.handCards, ...drawnCards],
                }));
                setDrawDeck((prev) => prev.slice(0, -cardsDrawn));

                alert(`Secondary effect: Drew ${cardsDrawn} card${cardsDrawn !== 1 ? 's' : ''}!`);
              }
              break;

            // Handle other secondary effect types here
          }
        }
      }
    }

    // Check if this is part of the Catapult ability (damage then sacrifice)
    // This needs to be checked BEFORE resetting modes
    if (sacrificePendingDamage) {
      // Don't reset sacrifice mode or related flags
      // Only reset damage-specific modes
      setDamageMode(false);
      setDamageSource(null);
      setDamageValue(0);
      setSniperMode(false);
      setCampDamageMode(false);
      setOpponentChoiceDamageMode(false);
      setAnyCardDamageMode(false);
      setOpponentChoiceDamageSource(null);
      setOpponentChoiceDamageValue(0);

      // Now enter sacrifice mode
      setSacrificeMode(true);

      alert(`Now select one of your people to sacrifice.`);
      return; // Don't reset any more targeting modes
    }

    // Check if this is part of Vanguard's ability
    if (vanguardPendingCounter) {
      setVanguardPendingCounter(false);
      setVanguardCounterActive(true);
      setVanguardOriginalPlayer(gameState.currentTurn);

      // Show a message for the counter-damage phase
      alert(
        `${gameState.currentTurn === 'left' ? 'RIGHT' : 'LEFT'} PLAYER: Select one of your opponent's cards to damage!`
      );

      // Temporarily "switch" turns for targeting
      // We don't actually change currentTurn, we just enable opponent targeting
      setDamageMode(true);
      setDamageValue(1);
      return; // Don't reset targeting mode yet
    }

    // If none of the special cases above, reset all targeting modes
    setDamageMode(false);
    setDamageSource(null);
    setDamageValue(0);
    setSniperMode(false);
    setCampDamageMode(false);
    setSacrificePendingDamage(false);
    setOpponentChoiceDamageMode(false);
    setAnyCardDamageMode(false);
    setOpponentChoiceDamageSource(null);
    setOpponentChoiceDamageValue(0);

    // If this is the counter-damage for Vanguard, reset all Vanguard states
    if (vanguardCounterActive) {
      setVanguardCounterActive(false);
      setVanguardOriginalPlayer(null);
    }

    // After damage is applied:
    // Check if this is part of the Mutant ability
    if (mutantPendingAction === 'both') {
      // First action (damage) completed, now proceed to restore
      setDamageMode(false);
      setAbilityRestoreMode(true);
      setRestoreSource(mutantSourceCard);
      setMutantPendingAction('after_both'); // Mark that we're in the second phase
    } else if (mutantPendingAction === 'damage_only') {
      // Only damage was chosen, apply damage to Mutant
      applyDamageToMutant();
    }

    if (AbilityService.isAbilityActive()) {
      AbilityService.completeAbility();
    }
  };

  const executeJunkEffect = (card: Card) => {
    console.log('executeJunkEffect called', {
      cardName: card.name,
      junkEffect: card.junkEffect,
    });
    // Use the current turn to determine the player
    const currentPlayer = gameState.currentTurn;
    const playerState = currentPlayer === 'left' ? leftPlayerState : rightPlayerState;
    const setPlayerState = currentPlayer === 'left' ? setLeftPlayerState : setRightPlayerState;

    switch (card.junkEffect) {
      case 'draw_card':
        // Draw a card
        if (drawDeck.length > 0) {
          const drawnCard = drawDeck[drawDeck.length - 1];

          setPlayerState((prev) => ({
            ...prev,
            handCards: [...prev.handCards, drawnCard],
          }));

          setDrawDeck((prev) => prev.slice(0, prev.length - 1));
          alert(`Drew ${drawnCard.name}`);
        } else {
          alert('Draw deck is empty!');
        }
        break;

      case 'extra_water':
        // Add 1 water
        setPlayerState((prev) => ({
          ...prev,
          waterCount: prev.waterCount + 1,
        }));
        alert('Gained 1 water');
        break;

      case 'restore':
        // Enter restore mode
        setRestoreMode(true);
        setRestorePlayer(currentPlayer);
        break;

      case 'raid': {
        alert('RAID JUNK EFFECT TRIGGERED');

        // Check for Zeto Kahn's immediate event effect
        const shouldExecuteImmediately = checkZetoKahnImmediateEffect(currentPlayer);

        if (shouldExecuteImmediately) {
          alert('ZETO KAHN EFFECT ACTIVATED - RAIDING IMMEDIATELY');
          executeRaid(currentPlayer);
          return; // Exit the function completely
        }

        // Normal case - handle Raiders movement based on current location
        alert('NORMAL RAID BEHAVIOR');

        switch (playerState.raidersLocation) {
          case 'default':
            alert('Moving Raiders to slot 2');
            setPlayerState((prev) => ({
              ...prev,
              eventSlots: [
                prev.eventSlots[0],
                { id: 'raiders', name: 'Raiders', type: 'event', startingQueuePosition: 2 },
                prev.eventSlots[2],
              ],
              raidersLocation: 'event2',
            }));
            break;

          case 'event2':
            if (!playerState.eventSlots[2]) {
              alert('Moving Raiders to slot 1');
              setPlayerState((prev) => ({
                ...prev,
                eventSlots: [
                  prev.eventSlots[0],
                  null,
                  { id: 'raiders', name: 'Raiders', type: 'event', startingQueuePosition: 1 },
                ],
                raidersLocation: 'event1',
              }));
            } else {
              alert('Event slot 1 occupied - cannot advance');
            }
            break;

          case 'event1':
            alert('Executing raid from slot 1');
            executeRaid(currentPlayer);
            break;
        }
        break;
      }

      case 'gain_punk':
        // Get a punk from the draw deck
        if (drawDeck.length > 0) {
          const punkCard = drawDeck[drawDeck.length - 1];
          setPunkCardToPlace(punkCard);
          setPunkPlacementMode(true);
          setDrawDeck((prev) => prev.slice(0, prev.length - 1));
        } else {
          alert('Draw deck is empty!');
        }
        break;

      case 'injure':
        // First, ensure any other targeting modes are reset
        stateSetters.setDamageMode(false);
        stateSetters.setRestoreMode(false);
        // other targeting modes...

        // Now set injure mode
        console.log('About to set injureMode to true');
        setInjureMode(true);
        console.log('injureMode set to true');

        // Here's the important part - set the ability to pending
        AbilityService.setPendingAbility(true);

        // You might need to store the current context in the AbilityService
        AbilityService.storeContext({
          ability: { type: 'injure' },
          player: currentPlayer,
          // other necessary context
        });

        alert('Select an unprotected enemy person to injure');
        return; // Important to return early
    }
  };

  const executeRaid = (playerSide: 'left' | 'right') => {
    console.log(`Executing raid for ${playerSide} player`);

    // Determine the opponent
    const opponentPlayer = playerSide === 'left' ? 'right' : 'left';

    // Get the player state and setter
    const playerState = playerSide === 'left' ? leftPlayerState : rightPlayerState;
    const setPlayerState = playerSide === 'left' ? setLeftPlayerState : setRightPlayerState;

    // Set Raiders back to default position
    setPlayerState((prev) => ({
      ...prev,
      raidersLocation: 'default',
    }));

    // Set up raid mode
    setCampRaidMode(true);
    setRaidingPlayer(playerSide);
    setRaidMessage(`${opponentPlayer.toUpperCase()} PLAYER: Choose a camp to damage from the raid!`);

    // Mark that an event was played this turn
    if (playerSide === 'left') {
      setLeftPlayedEventThisTurn(true);
    } else {
      setRightPlayedEventThisTurn(true);
    }
  };

  // Add near other helper functions like applyDamage
  const applyDamageToMutant = () => {
    if (mutantSourceCard && mutantSourceLocation) {
      // Get the player and slot index
      const isRightPlayer = gameState.currentTurn === 'right';
      const setPlayerState = isRightPlayer ? setRightPlayerState : setLeftPlayerState;
      const playerState = isRightPlayer ? rightPlayerState : leftPlayerState;

      if (mutantSourceLocation.type === 'person') {
        const slotIndex = mutantSourceLocation.index;
        const card = playerState.personSlots[slotIndex];

        if (card && card.id === mutantSourceCard.id) {
          if (card.isDamaged) {
            // If Mutant is already damaged, destroy it
            alert(`Mutant destroyed!`);
            destroyCard(card, slotIndex, isRightPlayer);
          } else {
            // Otherwise, mark as damaged
            alert(`Mutant damaged!`);
            setPlayerState((prev) => ({
              ...prev,
              personSlots: prev.personSlots.map((slot, i) => (i === slotIndex ? { ...slot, isDamaged: true } : slot)),
            }));
          }
        }
      }

      // Reset Mutant states
      setMutantSourceCard(null);
      setMutantSourceLocation(null);
      setMutantPendingAction(null);
    }
  };

  const applyRestore = (target: Card, slotIndex: number, isRightPlayer: boolean) => {
    // Get the game board element to check for the stored source index
    const gameBoard = document.getElementById('game-board');
    const restoreSourceIndex = gameBoard ? (gameBoard as any).restoreSourceIndex : undefined;

    // Check if this is a camp with cannot_self_restore trait trying to restore itself
    if (
      target.type === 'camp' &&
      target.traits?.includes('cannot_self_restore') &&
      restoreSourceIndex !== undefined &&
      slotIndex === restoreSourceIndex
    ) {
      alert(`${target.name} cannot restore itself due to its special trait!`);
      return;
    }

    if (multiRestoreMode) {
      // When in multi-restore mode, just restore the card without exiting the mode
      const wasRestored = restoreCard(
        target,
        slotIndex,
        isRightPlayer,
        isRightPlayer ? setRightPlayerState : setLeftPlayerState
      );

      if (wasRestored) {
        alert(`Restored ${target.name}`);
      } else {
        alert('This card is not damaged!');
      }

      // Don't reset targeting mode - continue in multi-restore
      return;
    }
    // At the beginning of applyRestore function
    if (restorePersonReadyMode && target.type === 'person') {
      const wasRestored = restorePersonAndMakeReady(
        target,
        slotIndex,
        isRightPlayer,
        isRightPlayer ? setRightPlayerState : setLeftPlayerState
      );

      if (wasRestored) {
        alert(`Restored ${target.name} and made it ready!`);
      } else {
        alert('This card is not damaged or is not a person!');
      }

      // Reset targeting mode
      setRestorePersonReadyMode(false);
      setRestoreSource(null);
      return;
    }

    // Rest of the original applyRestore function...
    // Check if this is a restore_person_ready ability
    if (restoreSource?.abilities?.some((a) => a.type === 'restore_person_ready') && target.type === 'person') {
      // Use our special function that both restores and makes ready
      const wasRestored = restorePersonAndMakeReady(
        target,
        slotIndex,
        isRightPlayer,
        isRightPlayer ? setRightPlayerState : setLeftPlayerState
      );

      if (wasRestored) {
        alert(`Restored ${target.name} and made it ready`);
      } else {
        alert('This card is not damaged or is not a person!');
      }
    } else {
      // Normal restore
      const wasRestored = restoreCard(
        target,
        slotIndex,
        isRightPlayer,
        isRightPlayer ? setRightPlayerState : setLeftPlayerState
      );

      if (wasRestored) {
        alert(`Restored ${target.name}`);
      } else {
        alert('This card is not damaged!');
      }
    }
    // Use our helper function to restore the card
    const wasRestored = restoreCard(
      target,
      slotIndex,
      isRightPlayer,
      isRightPlayer ? setRightPlayerState : setLeftPlayerState
    );

    if (wasRestored) {
      alert(`Restored ${target.name}`);
    } else {
      alert('This card is not damaged!');
    }

    // Reset targeting mode
    setAbilityRestoreMode(false);
    setRestoreSource(null);

    // Check if this is part of the Mutant ability
    if (mutantPendingAction === 'after_both' || mutantPendingAction === 'restore_only') {
      // Restore action completed, now damage the Mutant
      applyDamageToMutant();
    }
    // Clear the source index when we're done with restoration
    const gameBoardElement = document.getElementById('game-board');
    if (gameBoardElement) {
      (gameBoardElement as any).restoreSourceIndex = undefined;
    }
    if (AbilityService.isAbilityActive()) {
      AbilityService.completeAbility();
    }
  };

  const executeAbility = (card: Card, ability: any, location: { type: 'person' | 'camp'; index: number }) => {
    const playerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
    const setPlayerState = gameState.currentTurn === 'left' ? setLeftPlayerState : setRightPlayerState;
    const opponentPlayer = gameState.currentTurn === 'left' ? 'right' : 'left';
    const opponentState = opponentPlayer === 'left' ? leftPlayerState : rightPlayerState;
    const setOpponentState = opponentPlayer === 'left' ? setLeftPlayerState : setRightPlayerState;

    let finalWaterCost = ability.cost;
    if (location.type === 'camp') {
      // Update the player state directly
      if (gameState.currentTurn === 'left') {
        setLeftPlayerState((prev) => ({
          ...prev,
          campSlots: prev.campSlots.map((camp, idx) => (idx === location.index ? { ...camp, isReady: false } : camp)),
        }));
      } else {
        setRightPlayerState((prev) => ({
          ...prev,
          campSlots: prev.campSlots.map((camp, idx) => (idx === location.index ? { ...camp, isReady: false } : camp)),
        }));
      }
    }

    // Apply cost modifiers if any
    if (ability.costModifier === 'destroyed_camps') {
      // For Pillbox: cost reduced by number of destroyed camps
      const playerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
      // Count destroyed camps (null slots in campSlots)
      const destroyedCamps = playerState.campSlots.filter((camp) => camp === null).length;
      // Reduce cost, but never below 0
      finalWaterCost = Math.max(0, ability.cost - destroyedCamps);
    } else if (ability.costModifier === 'punks_owned') {
      // For Command Post: cost reduced by number of punks in play
      const playerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
      // Count punks in play
      const punksInPlay = playerState.personSlots.filter((person) => person && person.isPunk).length;
      // Reduce cost, but never below 0
      finalWaterCost = Math.max(0, ability.cost - punksInPlay);
    }

    // Use our helper to deduct water cost
    deductWaterCost(
      gameState.currentTurn,
      finalWaterCost,
      leftPlayerState,
      rightPlayerState,
      setLeftPlayerState,
      setRightPlayerState
    );

    // Add to list of cards that used abilities this turn
    if (gameState.currentTurn === 'left') {
      setLeftCardsUsedAbility((prev) => [...prev, card.id]);
    } else {
      setRightCardsUsedAbility((prev) => [...prev, card.id]);
    }

    // Check if Vera Vosh's trait is active
    const hasVeraVoshEffect = hasVeraVoshTrait(playerState);

    markCardUsedAbility(
      card,
      location,
      gameState.currentTurn,
      leftPlayerState,
      rightPlayerState,
      setLeftPlayerState,
      setRightPlayerState,
      leftCardsUsedAbility,
      rightCardsUsedAbility,
      setLeftCardsUsedAbility,
      setRightCardsUsedAbility,
      hasVeraVoshEffect
    );

    // Handle ability effects based on type
    switch (ability.type) {
      case 'exclusive_damage':
        // Set the state to indicate Resonator has been used
        setResonatorUsedThisTurn(true);

        // Then proceed with normal damage ability
        setDamageMode(true);
        setDamageSource(card);
        setDamageValue(ability.value || 1);
        alert(`Select an unprotected enemy card to damage. No other abilities can be used this turn.`);
        break;
      case 'discard_for_punk_or_water':
        // Check if player has any cards in hand (excluding Water Silo)
        const hasValidCardsToDiscard = playerState.handCards.some((card) => card.type !== 'watersilo');

        if (!hasValidCardsToDiscard) {
          alert('You have no valid cards to discard (Water Silo cannot be discarded for this ability).');

          // Don't mark the camp as unready since the ability wasn't used
          if (location.type === 'camp') {
            setPlayerState((prev) => ({
              ...prev,
              campSlots: prev.campSlots.map((camp, idx) =>
                idx === location.index ? { ...camp, isReady: true } : camp
              ),
            }));
          }
          return;
        }

        // Set Scavenger Camp as active
        setScavengerCampActive(true);
        setScavengerCampSelectingCard(true);
        setScavengerCampLocation(location);

        alert('Select a card from your hand to discard (Water Silo cannot be selected).');
        break;

      case 'damage_then_sacrifice':
        // First step: Enter damage targeting mode with ability to hit any card
        setDamageMode(true);
        setDamageSource(card);
        setDamageValue(ability.value || 1);
        setSniperMode(true); // Allow targeting protected cards
        setAnyCardDamageMode(true); // Allow targeting own cards

        // Store that we need to sacrifice after damaging
        setSacrificePendingDamage(true);

        alert(`Select ANY card to damage (including your own). Then you will need to sacrifice one of your people.`);
        break;

      case 'conditional_damage_camp':
        // Get the current player state
        const mercenaryPlayerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;

        // Count how many people the player has (excluding punks)
        const playerPeopleCount = mercenaryPlayerState.personSlots.filter(
          (card) => card !== null && !card.isPunk
        ).length;

        // Check if the player has 4 or more people
        const hasFourOrMorePeople = playerPeopleCount >= 4;

        if (hasFourOrMorePeople) {
          // If condition is met, enter camp damage mode and sniper mode to ignore protection
          setCampDamageMode(true);
          setSniperMode(true); // This will allow targeting protected camps
          setDamageSource(card);
          setDamageValue(ability.value || 1);
          alert(
            `Condition met: You have ${playerPeopleCount} people. Select any enemy camp to damage (protection is ignored).`
          );
        } else {
          // Condition not met, show message and refund water cost
          alert(`Condition not met: You have ${playerPeopleCount} people. You need at least 4 people.`);

          // Refund the water cost
          setPlayerState((prev) => ({
            ...prev,
            waterCount: prev.waterCount + ability.cost,
          }));

          // Don't mark the card as used since the ability couldn't be activated
          if (location.type === 'camp') {
            setPlayerState((prev) => ({
              ...prev,
              campSlots: prev.campSlots.map((camp, idx) =>
                idx === location.index ? { ...camp, isReady: true } : camp
              ),
            }));
          }

          return; // Exit without executing ability
        }
        break;

      case 'opponent_choice_damage':
        // Determine the opponent player
        const opponentPlayerForChoice = gameState.currentTurn === 'left' ? 'right' : 'left';

        // Enter opponent choice damage targeting mode
        setOpponentChoiceDamageMode(true);
        setOpponentChoiceDamageSource(card);
        setOpponentChoiceDamageValue(ability.value || 1);

        // Show message to instruct both players
        alert(
          `${opponentPlayerForChoice.toUpperCase()} PLAYER: Select one of your UNPROTECTED cards to receive damage!`
        );
        break;

      case 'conditional_restore':
        // Get the current player state
        const restorePlayerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;

        // Check the condition based on the specific condition type
        let restoreConditionMet = false;
        let conditionMessage = '';

        if (card.type === 'camp' && card.traits?.includes('cannot_self_restore')) {
          const gameBoard = document.getElementById('game-board');
          if (gameBoard) {
            (gameBoard as any).restoreSourceIndex = location.index;
          }
        }

        if (ability.condition === 'played_two_people') {
          // Check if player has played 2 or more people this turn
          restoreConditionMet = restorePlayerState.peoplePlayedThisTurn >= 2;
          conditionMessage = restoreConditionMet
            ? `You've played ${restorePlayerState.peoplePlayedThisTurn} people this turn.`
            : `You've only played ${restorePlayerState.peoplePlayedThisTurn} people this turn. You need to play at least 2 people.`;
        } else if (ability.condition === 'opponent_has_unprotected_camp') {
          // Get the opponent player
          const opponentPlayer = gameState.currentTurn === 'left' ? 'right' : 'left';
          const opponentState = opponentPlayer === 'left' ? leftPlayerState : rightPlayerState;

          // Check if opponent has any unprotected camps
          restoreConditionMet = opponentState.campSlots.some((camp) => camp !== null && !camp.isProtected);
          conditionMessage = restoreConditionMet
            ? `Opponent has an unprotected camp.`
            : `Opponent has no unprotected camps.`;
        }
        // Add other conditions as needed

        if (restoreConditionMet) {
          // Check if there are any damaged cards to restore
          const hasDamagedCard = [...restorePlayerState.personSlots, ...restorePlayerState.campSlots].some(
            (slot) => slot && slot.isDamaged && (!card.traits?.includes('cannot_self_restore') || slot.id !== card.id)
          );

          if (!hasDamagedCard) {
            alert('No valid damaged cards to restore!');

            // Refund the water cost
            setPlayerState((prev) => ({
              ...prev,
              waterCount: prev.waterCount + ability.cost,
            }));

            // Don't mark the card as used
            if (location.type === 'camp') {
              setPlayerState((prev) => ({
                ...prev,
                campSlots: prev.campSlots.map((camp, idx) =>
                  idx === location.index ? { ...camp, isReady: true } : camp
                ),
              }));
            }

            return; // Exit without entering restore mode
          }

          // Store the source camp location for the "cannot_self_restore" check
          if (card.type === 'camp') {
            const gameBoard = document.getElementById('game-board');
            if (gameBoard) {
              (gameBoard as any).restoreSourceIndex = location.index;
            }
          }

          // If condition is met and there are damaged cards, enter restore mode
          setAbilityRestoreMode(true);
          setRestoreSource(card);
          alert(`Condition met: ${conditionMessage} Select a damaged card to restore.`);
        } else {
          // Condition not met, show message and refund water cost
          alert(`Condition not met: ${conditionMessage}`);

          // Refund the water cost
          setPlayerState((prev) => ({
            ...prev,
            waterCount: prev.waterCount + ability.cost,
          }));

          // Don't mark the card as used
          if (location.type === 'camp') {
            setPlayerState((prev) => ({
              ...prev,
              campSlots: prev.campSlots.map((camp, idx) =>
                idx === location.index ? { ...camp, isReady: true } : camp
              ),
            }));
          }

          return; // Exit without executing ability
        }
        break;

      case 'conditional_gain_punk':
        // Get the current player state
        const arcadePlayerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;

        // Count how many people the player has (excluding punks)
        const peopleCount = arcadePlayerState.personSlots.filter((card) => card !== null && !card.isPunk).length;

        // Check if the player has 0 or 1 people
        const conditionMet = peopleCount <= 1;

        if (conditionMet) {
          // If condition is met, gain a punk
          if (drawDeck.length > 0) {
            const punkCard = drawDeck[drawDeck.length - 1];
            setPunkCardToPlace(punkCard);
            setPunkPlacementMode(true);
            setDrawDeck((prev) => prev.slice(0, prev.length - 1));
            alert(`Condition met: You have ${peopleCount} people. Gain a punk!`);
          } else {
            alert('Draw deck is empty, cannot gain a punk!');
          }
        } else {
          // Condition not met, show message and refund water cost
          alert(`Condition not met: You have ${peopleCount} people. You need 0 or 1 people.`);

          // Refund the water cost
          setPlayerState((prev) => ({
            ...prev,
            waterCount: prev.waterCount + ability.cost,
          }));

          // Don't mark the card as used since the ability couldn't be activated
          if (location.type === 'camp') {
            setPlayerState((prev) => ({
              ...prev,
              campSlots: prev.campSlots.map((camp, idx) =>
                idx === location.index ? { ...camp, isReady: true } : camp
              ),
            }));
          }

          return; // Exit without executing ability
        }
        break;

      case 'sacrifice_for_restore':
        // Get the current player's state
        const sacrificeRestorePlayerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;

        // Check if the player has any people in their tableau
        const hasPeopleForRestoreSacrifice = sacrificeRestorePlayerState.personSlots.some((slot) => slot !== null);

        if (!hasPeopleForRestoreSacrifice) {
          alert('You need a person to use this ability!');
          return; // Exit the function early
        }

        // Store the source camp location for the "cannot_self_restore" check
        if (card.type === 'camp') {
          const gameBoard = document.getElementById('game-board');
          if (gameBoard) {
            (gameBoard as any).restoreSourceIndex = location.index;
          }
        }

        // If we have people, proceed with the sacrifice mode
        initiateSacrificeMode('restore', card, location, setSacrificeMode, setSacrificeEffect, setSacrificeSource);
        break;

        // If we have people, proceed with the sacrifice mode
        initiateSacrificeMode('restore', card, location, setSacrificeMode, setSacrificeEffect, setSacrificeSource);
        break;

      case 'sacrifice_for_water':
        // Get the current player's state
        const currentPlayerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;

        // Check if the player has any people in their tableau
        const hasPeople = currentPlayerState.personSlots.some((slot) => slot !== null);

        if (!hasPeople) {
          alert('You need a person to use this ability!');
          return; // Exit the function early
        }

        // If we have people, proceed with the sacrifice mode
        initiateSacrificeMode('water', card, location, setSacrificeMode, setSacrificeEffect, setSacrificeSource);
        break;

      case 'sacrifice_for_draw':
        // Get the current player's state
        const sacrificePlayerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;

        // Check if the player has any people in their tableau
        const hasPeopleForSacrifice = sacrificePlayerState.personSlots.some((slot) => slot !== null);

        if (!hasPeopleForSacrifice) {
          alert('You need a person to use this ability!');

          // Refund the water cost since the ability cannot be used
          setPlayerState((prev) => ({
            ...prev,
            waterCount: prev.waterCount + ability.cost,
          }));

          // Don't mark the camp as unready since the ability wasn't used
          if (location.type === 'camp') {
            setPlayerState((prev) => ({
              ...prev,
              campSlots: prev.campSlots.map((camp, idx) =>
                idx === location.index ? { ...camp, isReady: true } : camp
              ),
            }));
          }

          return; // Exit the function early
        }

        // If we have people, proceed with the sacrifice mode
        initiateSacrificeMode('draw', card, location, setSacrificeMode, setSacrificeEffect, setSacrificeSource);
        break;

      case 'self_damage_then_restore_any':
        // For Bonfire: "Damage this card, then Restore any number of cards"

        // First, damage the card itself using our proper damage utility
        const bonfire = playerState.campSlots[location.index];
        if (bonfire) {
          // If camp is already damaged, this will destroy it
          const wasDestroyed = applyDamageToTarget(
            bonfire,
            location.index,
            gameState.currentTurn === 'right', // correct isRightPlayer value
            setPlayerState,
            (card, slotIndex, isRightPlayer) => {
              // This is the 'discard' callback, but for camps we just set to null
              setPlayerState((prev) => ({
                ...prev,
                campSlots: prev.campSlots.map((c, i) => (i === slotIndex ? null : c)),
              }));
            },
            1 // damage value
          );

          if (wasDestroyed) {
            alert(`${bonfire.name} was destroyed, but its restoration effect still occurs!`);
            // DON'T exit early - continue with restore effect even if source is destroyed
          }
        }

        // Always continue with multi-restore mode, even if the camp was destroyed
        setMultiRestoreMode(true);
        setRestoreSource(card);
        alert(`Select any number of your damaged cards to restore. Click 'Done' when finished.`);

        // Add a 'Done' button to exit multi-restore mode
        setShowRestoreDoneButton(true);
        break;

      case 'restore_person_ready':
        // For Atomic Garden
        // First check if there are any damaged person cards
        const hasDamagedPerson = playerState.personSlots.some((card) => card && card.isDamaged);

        if (!hasDamagedPerson) {
          alert('No damaged person cards to restore!');

          // Refund the water cost
          setPlayerState((prev) => ({
            ...prev,
            waterCount: prev.waterCount + ability.cost,
          }));

          // Mark the camp as ready again since the ability wasn't actually used
          if (location.type === 'camp') {
            setPlayerState((prev) => ({
              ...prev,
              campSlots: prev.campSlots.map((camp, idx) =>
                idx === location.index ? { ...camp, isReady: true } : camp
              ),
            }));
          }

          return; // Exit without entering restore mode
        }

        // If we have damaged persons, proceed as normal
        setRestorePersonReadyMode(true);
        setRestoreSource(card);
        alert(`Select a damaged person to restore and make them ready`);
        break;

      case 'mimic_ability':
        // Enter mimic mode to select a card whose ability to copy
        setMimicMode(true);
        setMimicSourceCard(card);
        setMimicSourceLocation(location);
        alert('Select one of your ready person cards or an undamaged enemy person card to mimic its ability');
        break;

      case 'gain_punk_ability':
        // Get a punk from the draw deck
        if (drawDeck.length > 0) {
          const punkCard = drawDeck[drawDeck.length - 1];
          setPunkCardToPlace(punkCard);
          setPunkPlacementMode(true);
          setDrawDeck((prev) => prev.slice(0, prev.length - 1));
        } else {
          alert('Draw deck is empty!');
        }
        break;

      case 'destroy_any_camp':
        // Enter destroy camp targeting mode
        setDestroyCampMode(true);
        alert(`Select any enemy camp to destroy`);
        break;

      case 'scientist_ability':
        // Check if there are at least 3 cards in the draw deck
        if (drawDeck.length < 3) {
          alert(`Not enough cards in the draw deck. Needed 3, but only ${drawDeck.length} available.`);
          break;
        }

        // IMPORTANT: Add this debug alert
        debugWithAlert('Processing scientist ability');

        // Take 3 cards from the top of the draw deck
        const drawnCards = drawDeck.slice(-3);
        setScientistCards(drawnCards);

        // Remove these cards from the draw deck
        setDrawDeck((prev) => prev.slice(0, prev.length - 3));

        // Open the modal to choose a junk effect
        setIsScientistModalOpen(true);
        break;

      case 'damage_conditional_event': {
        // First check if opponent has any events in queue
        const currentTurn = gameState.currentTurn;
        const enemyPlayer = currentTurn === 'left' ? 'right' : 'left';
        const enemyState = enemyPlayer === 'left' ? leftPlayerState : rightPlayerState;

        // Check if any event slots are filled
        const hasEvent = enemyState.eventSlots.some((event) => event !== null);

        if (!hasEvent) {
          alert('Opponent has no events in queue! Ability cannot be used.');

          // Refund the water cost
          setPlayerState((prev) => ({
            ...prev,
            waterCount: prev.waterCount + ability.cost,
          }));

          // Don't mark the card as unready if the ability can't be used
          if (location.type === 'person') {
            setPlayerState((prev) => ({
              ...prev,
              personSlots: prev.personSlots.map((slot, idx) =>
                idx === location.index ? { ...slot, isReady: true } : slot
              ),
            }));
          }

          return; // Exit without entering damage mode
        }

        // If opponent has events, proceed with damage as normal
        setDamageMode(true);
        setDamageSource(card);
        setDamageValue(ability.value || 1);
        alert(`Select an unprotected enemy card to damage`);
        break;
      }

      default:
        // Placeholder for other ability types
        alert(`Used ability: ${ability.effect}`);
        break;
    }
  };

  useEffect(() => {
    if (gameBoardRef.current) {
      // This will ensure the current values are always exposed
      (gameBoardRef.current as any).leftPlayedEventThisTurn = leftPlayedEventThisTurn;
      (gameBoardRef.current as any).rightPlayedEventThisTurn = rightPlayedEventThisTurn;
    }
  }, [leftPlayedEventThisTurn, rightPlayedEventThisTurn]);

  // Add somewhere in your GameBoard.tsx component
  useEffect(() => {
    console.log('injureMode state changed:', injureMode);
  }, [injureMode]);

  useEffect(() => {
    if (gameState.currentPhase === 'events') {
      handleEventsPhase();
    } else if (gameState.currentPhase === 'replenish') {
      handleReplenishPhase();
    }
  }, [gameState.currentPhase, gameState.currentTurn]);

  useEffect(() => {
    setLeftPlayedEventThisTurn(false);
    setRightPlayedEventThisTurn(false);
    setLeftCardsUsedAbility([]);
    setRightCardsUsedAbility([]);
    setLeftPlayerState((prev) => ({ ...prev, peoplePlayedThisTurn: 0 }));
    setRightPlayerState((prev) => ({ ...prev, peoplePlayedThisTurn: 0 }));
  }, [gameState.currentTurn]);

  return (
    <AbilityProvider
      leftPlayerState={leftPlayerState}
      rightPlayerState={rightPlayerState}
      gameState={gameState}
      stateSetters={stateSetters}
      drawDeck={drawDeck}
    >
      <div
        id="game-board"
        className="w-full h-screen p-4"
        style={{
          backgroundColor: '#340454',
        }}
        ref={gameBoardRef}
      >
        {/* Ability Modal */}
        {isAbilityModalOpen && selectedCard && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            style={{ height: '100vh', width: '100vw' }}
          >
            <div
              className="bg-gray-800 p-4 rounded-lg border-2 border-gray-600 shadow-xl"
              style={{
                maxWidth: '90%',
                width: '400px',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Add this check for camp cards that are not ready */}
              {selectedCardLocation && selectedCardLocation.type === 'camp' && !selectedCard.isReady ? (
                <div>
                  <div className="text-white mb-4 text-center">
                    <h3 className="text-xl font-bold mb-2 text-red-400">Camp Already Used</h3>
                    <p>This camp has already used its ability this turn and cannot be used again until next turn.</p>
                  </div>
                  <button
                    className="mt-4 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded w-full"
                    onClick={() => setIsAbilityModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              ) : (
                /* Regular ability display for ready cards */
                <>
                  {selectedCard.abilities?.map((ability, index) => {
                    const playerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
                    // Calculate modified cost if applicable
                    let displayCost = ability.cost;
                    if (ability.costModifier === 'destroyed_camps') {
                      const destroyedCamps = playerState.campSlots.filter((camp) => camp === null).length;
                      displayCost = Math.max(0, ability.cost - destroyedCamps);
                    } else if (ability.costModifier === 'punks_owned') {
                      const punksInPlay = playerState.personSlots.filter((person) => person && person.isPunk).length;
                      displayCost = Math.max(0, ability.cost - punksInPlay);
                    }
                    const hasEnoughWater = playerState.waterCount >= displayCost;
                    return (
                      <div key={index} className="mb-4 p-2 border border-gray-600 rounded">
                        <div className="text-white mb-2">{ability.effect}</div>
                        <div className="text-blue-300 mb-2">
                          Cost: {displayCost} water
                          {displayCost !== ability.cost && ` (reduced from ${ability.cost})`}
                        </div>
                        <button
                          className={`bg-purple-600 text-white px-4 py-2 rounded w-full
                  ${!hasEnoughWater ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500'}`}
                          disabled={!hasEnoughWater}
                          title={!hasEnoughWater ? 'Not enough water' : ''}
                          onClick={() => {
                            if (selectedCardLocation) {
                              executeAbility(selectedCard, ability, selectedCardLocation);
                            }
                            setIsAbilityModalOpen(false);
                          }}
                        >
                          Use Ability {!hasEnoughWater && `(Not enough water)`}
                        </button>
                      </div>
                    );
                  })}
                  <button
                    className="mt-4 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded w-full"
                    onClick={() => setIsAbilityModalOpen(false)}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Scientist Ability Modal */}
        {isScientistModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-4 rounded-lg max-w-md w-full">
              <h2 className="text-white text-xl mb-4">Scientist Ability</h2>
              <p className="text-white mb-4">Select a card to use its junk effect:</p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {scientistCards.map((card, index) => (
                  <div
                    key={index}
                    className="bg-gray-700 border border-gray-600 rounded p-2 cursor-pointer hover:bg-gray-600"
                    onClick={() => {
                      console.log('Card clicked in Scientist modal', {
                        cardName: card.name,
                        junkEffect: card.junkEffect,
                      });
                      // Close the modal
                      setIsScientistModalOpen(false);

                      // Special debug for raid junk effect
                      if (card.junkEffect === 'raid') {
                        console.log('SCIENTIST RAID SELECTED');
                        const currentPlayer = gameState.currentTurn;

                        // Use our helper function to check Zeto Kahn conditions
                        const shouldExecuteImmediately = checkZetoKahnImmediateEffect(currentPlayer);
                        console.log('Should execute immediately:', shouldExecuteImmediately);

                        if (shouldExecuteImmediately) {
                          console.log('Zeto Kahn immediate execution triggered');
                          // Mark that an event was played
                          if (currentPlayer === 'left') {
                            setLeftPlayedEventThisTurn(true);
                          } else {
                            setRightPlayedEventThisTurn(true);
                          }

                          // Add cards to discard pile
                          setDiscardPile((prev) => [...prev, ...scientistCards]);

                          // Clear the scientist cards
                          setScientistCards([]);

                          // Execute raid immediately
                          executeRaid(currentPlayer);

                          alert(`RAID EXECUTED IMMEDIATELY DUE TO ZETO KAHN`);
                          return;
                        }
                      }

                      console.log('About to execute junk effect');
                      // Normal flow for other effects or when ZK conditions aren't met
                      executeJunkEffect(card);
                      console.log('Junk effect executed');

                      // Add all cards to discard pile
                      setDiscardPile((prev) => [...prev, ...scientistCards]);

                      // Clear the scientist cards
                      setScientistCards([]);

                      alert(`Used ${card.name}'s junk effect: ${card.junkEffect}`);

                      AbilityService.completeAbility();
                    }}
                  >
                    <div className="text-white text-center text-xs">
                      <strong>{card.name}</strong>
                      <br />
                      {card.type}
                      <br />
                      <span className="text-yellow-300">Junk: {card.junkEffect}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mutant Ability Modal */}
        {isMutantModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-4 rounded-lg max-w-md w-full">
              <h2 className="text-white text-xl mb-4">Mutant Ability</h2>
              <p className="text-white mb-4">Choose one or both actions:</p>

              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="mutant-damage"
                    className="h-5 w-5"
                    checked={mutantDamageChosen}
                    onChange={() => setMutantDamageChosen(!mutantDamageChosen)}
                  />
                  <label htmlFor="mutant-damage" className="text-white">
                    Do 1 Damage
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="mutant-restore"
                    className="h-5 w-5"
                    checked={mutantRestoreChosen}
                    onChange={() => setMutantRestoreChosen(!mutantRestoreChosen)}
                  />
                  <label htmlFor="mutant-restore" className="text-white">
                    Restore
                  </label>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded flex-1"
                    disabled={!mutantDamageChosen && !mutantRestoreChosen}
                    onClick={() => {
                      setMutantModalOpen(false);

                      if (mutantDamageChosen && mutantRestoreChosen) {
                        // Both actions chosen, proceed with the first (damage)
                        setMutantPendingAction('both');
                        setDamageMode(true);
                        setDamageSource(mutantSourceCard);
                        setDamageValue(1);
                      } else if (mutantDamageChosen) {
                        // Only damage chosen
                        setMutantPendingAction('damage_only');
                        setDamageMode(true);
                        setDamageSource(mutantSourceCard);
                        setDamageValue(1);
                      } else if (mutantRestoreChosen) {
                        // Only restore chosen
                        setMutantPendingAction('restore_only');
                        setAbilityRestoreMode(true);
                        setRestoreSource(mutantSourceCard);
                      }
                    }}
                  >
                    Confirm
                  </button>

                  <button
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded flex-1"
                    onClick={() => {
                      setMutantModalOpen(false);
                      setMutantDamageChosen(false);
                      setMutantRestoreChosen(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="w-full h-full flex justify-between">
          {/* Left Player Area */}
          <div
            className={`w-1/3 h-full p-2 relative border-2 
          ${
            gameState.currentTurn === 'left'
              ? 'border-3 border-pink-500 shadow-[0_0_5px_rgba(255,105,180,0.7),0_0_10px_rgba(255,105,180,0.5),0_0_45px_rgba(255,105,180,0.3)] brightness-110'
              : 'border-2 border-gray-600'
          }`}
          >
            <div
              style={{
                marginTop: '50px',
              }}
            >
              {/* Event Queue */}
              <div className="flex justify-start gap-2 mb-8 ml-4">
                <EventSlot
                  index={0}
                  card={leftPlayerState.eventSlots[0]}
                  playerState={leftPlayerState}
                  setPlayerState={setLeftPlayerState}
                  player="left"
                  omenClockActive={omenClockActive}
                  canEventBeAdvanced={canEventBeAdvanced}
                  onEventAdvance={advanceEventByOne}
                />
                <EventSlot
                  index={1}
                  card={leftPlayerState.eventSlots[1]}
                  playerState={leftPlayerState}
                  setPlayerState={setLeftPlayerState}
                  player="left"
                  omenClockActive={omenClockActive}
                  canEventBeAdvanced={canEventBeAdvanced}
                  onEventAdvance={advanceEventByOne}
                />
                <EventSlot
                  index={2}
                  card={leftPlayerState.eventSlots[2]}
                  playerState={leftPlayerState}
                  setPlayerState={setLeftPlayerState}
                  player="left"
                  omenClockActive={omenClockActive}
                  canEventBeAdvanced={canEventBeAdvanced}
                  onEventAdvance={advanceEventByOne}
                />
              </div>

              {/* Hand Area */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="border-2 border-gray-400 rounded bg-gray-700 p-4 min-h-32">
                  <div
                    className="flex flex-wrap gap-2"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const cardId = e.dataTransfer.getData('cardId');
                      const sourceType = e.dataTransfer.getData('sourceType');
                      const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'));

                      if (sourceType === 'personSlot') {
                        const card = leftPlayerState.personSlots[sourceIndex];
                        if (card) {
                          setLeftPlayerState((prev) => {
                            const updatedSlots = prev.personSlots.map((slot, i) => (i === sourceIndex ? null : slot));
                            const { personSlots, campSlots } = updateProtectionStatus(updatedSlots, prev.campSlots);
                            return {
                              ...prev,
                              handCards: [...prev.handCards, card],
                              personSlots,
                              campSlots,
                            };
                          });
                        }
                      }
                    }}
                  >
                    {leftPlayerState.handCards.map((card) => {
                      // Calculate Oasis discount for person cards
                      let oasisDiscountText = '';
                      if (card.type === 'person' && card.playCost !== undefined) {
                        const columns = [0, 1, 2];
                        const eligibleColumns = columns.filter((columnIndex) => {
                          const hasOasis =
                            leftPlayerState.campSlots[columnIndex] &&
                            leftPlayerState.campSlots[columnIndex]?.traits?.includes('discount_column');
                          const frontRowIndex = columnIndex * 2;
                          const backRowIndex = frontRowIndex + 1;
                          const columnIsEmpty =
                            !leftPlayerState.personSlots[frontRowIndex] && !leftPlayerState.personSlots[backRowIndex];
                          return hasOasis && columnIsEmpty;
                        });
                        if (eligibleColumns.length > 0) {
                          oasisDiscountText = `Discount in column(s): ${eligibleColumns
                            .map((col) => col + 1)
                            .join(', ')}`;
                        }
                      }

                      return (
                        <div
                          key={card.id}
                          className={`w-16 h-24 border border-gray-400 rounded relative ${
                            card.id === leftWaterSiloCard.id ? 'cursor-pointer hover:brightness-110' : ''
                          } ${
                            discardSelectionActive && gameState.currentTurn === 'left' && card.type !== 'watersilo'
                              ? 'border-purple-400 animate-pulse cursor-pointer'
                              : ''
                          } ${
                            card.type === 'person' && card.playCost > leftPlayerState.waterCount
                              ? 'bg-gray-800 opacity-60'
                              : 'bg-gray-600'
                          } ${oasisDiscountText ? 'border-green-300' : ''}`}
                          draggable="true"
                          title={oasisDiscountText}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('cardId', card.id);
                            e.dataTransfer.setData('sourcePlayer', 'left');
                          }}
                          onClick={() => {
                            if (scavengerCampSelectingCard) {
                              handleScavengerCampDiscard(card);
                              return;
                            }
                            if (card.id === leftWaterSiloCard.id) {
                              setLeftPlayerState((prev) => ({
                                ...prev,
                                waterSiloInHand: false,
                                waterCount: prev.waterCount + 1,
                                handCards: prev.handCards.filter((c) => c.id !== leftWaterSiloCard.id),
                              }));
                            } else if (
                              discardSelectionActive &&
                              gameState.currentTurn === 'left' &&
                              card.type !== 'watersilo'
                            ) {
                              // Handle discard selection
                              setLeftPlayerState((prev) => ({
                                ...prev,
                                handCards: prev.handCards.filter((c) => c.id !== card.id),
                              }));
                              setDiscardPile((prev) => [...prev, card]);
                              setDiscardSelectionCount((prev) => prev - 1);
                              // Check if we've discarded enough cards
                              if (discardSelectionCount <= 1) {
                                setDiscardSelectionActive(false);
                                alert('Discard complete!');
                              }
                            }
                          }}
                        >
                          <div className="text-white text-center text-xs mt-4">
                            {card.name}
                            <br />
                            {card.type}
                            <br />
                            {card.type === 'person' && card.playCost !== undefined ? (
                              <>
                                Cost: {card.playCost}
                                {oasisDiscountText && <span className="text-green-300"> (-1)</span>}
                              </>
                            ) : (
                              ''
                            )}
                            {card.type === 'person' && card.playCost !== undefined && <br />}
                            {card.startingQueuePosition !== undefined ? `Queue: ${card.startingQueuePosition}` : ''}
                            <br />
                            {card.junkEffect && `Junk: ${card.junkEffect}`}
                            <br />
                            {card.id}
                          </div>
                          {oasisDiscountText && (
                            <div className="absolute top-0 right-0 bg-green-600 text-white text-xs px-1 rounded-bl">
                              -1
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Three columns of cards */}
              <div className="flex justify-between">
                {/* Column 1 */}
                <div className="flex flex-col">
                  <PersonSlot
                    index={0}
                    card={leftPlayerState.personSlots[0]}
                    playerState={leftPlayerState}
                    setPlayerState={setLeftPlayerState}
                    punkPlacementMode={punkPlacementMode}
                    punkCardToPlace={punkCardToPlace}
                    setPunkPlacementMode={setPunkPlacementMode}
                    setPunkCardToPlace={setPunkCardToPlace}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    setRestoreMode={setRestoreMode}
                    injureMode={injureMode}
                    setInjureMode={setInjureMode}
                    damageMode={damageMode}
                    applyDamage={applyDamage}
                    updateProtectedStatus={updateProtectionStatus}
                    destroyCard={destroyCard}
                    gameState={gameState}
                    player="left"
                    isInteractable={isInteractable}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    abilityRestoreMode={abilityRestoreMode}
                    applyRestore={applyRestore}
                    destroyPersonMode={destroyPersonMode}
                    checkAbilityEnabled={checkAbilityEnabled}
                    returnToHandMode={returnToHandMode}
                    setReturnToHandMode={setReturnToHandMode}
                    damageColumnMode={damageColumnMode}
                    sacrificeMode={sacrificeMode}
                    setSacrificeMode={setSacrificeMode}
                    sacrificePendingDamage={sacrificePendingDamage}
                    setSacrificePendingDamage={setSacrificePendingDamage}
                    setDamageMode={setDamageMode}
                    setDamageValue={setDamageValue}
                    mimicMode={mimicMode}
                    restorePersonReadyMode={restorePersonReadyMode}
                    multiRestoreMode={multiRestoreMode}
                    sacrificeEffect={sacrificeEffect}
                    sacrificeSource={sacrificeSource}
                    setSacrificeEffect={setSacrificeEffect}
                    setSacrificeSource={setSacrificeSource}
                    drawDeck={drawDeck}
                    setDrawDeck={setDrawDeck}
                    leftPlayerState={leftPlayerState}
                    rightPlayerState={rightPlayerState}
                    setLeftPlayerState={setLeftPlayerState}
                    setRightPlayerState={setRightPlayerState}
                    setRestorePlayer={setRestorePlayer}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setOpponentChoiceDamageMode={setOpponentChoiceDamageMode}
                    opponentChoiceDamageSource={opponentChoiceDamageSource}
                    setOpponentChoiceDamageSource={setOpponentChoiceDamageSource}
                    opponentChoiceDamageValue={opponentChoiceDamageValue}
                    setOpponentChoiceDamageValue={setOpponentChoiceDamageValue}
                    setSniperMode={setSniperMode}
                    setDamageSource={setDamageSource}
                    octagonSacrificeMode={octagonSacrificeMode}
                    octagonOpponentSacrificeMode={octagonOpponentSacrificeMode}
                    handleOctagonSacrifice={handleOctagonSacrifice}
                    handleOctagonOpponentSacrifice={handleOctagonOpponentSacrifice}
                    constructionYardSelectingPerson={constructionYardSelectingPerson}
                    constructionYardSelectingDestination={constructionYardSelectingDestination}
                    constructionYardSelectedPerson={constructionYardSelectedPerson}
                    onPersonSelected={handlePersonSelected}
                    onDestinationSelected={handleDestinationSelected}
                  />
                  <PersonSlot
                    index={1}
                    card={leftPlayerState.personSlots[1]}
                    playerState={leftPlayerState}
                    setPlayerState={setLeftPlayerState}
                    punkPlacementMode={punkPlacementMode}
                    punkCardToPlace={punkCardToPlace}
                    setPunkPlacementMode={setPunkPlacementMode}
                    setPunkCardToPlace={setPunkCardToPlace}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    setRestoreMode={setRestoreMode}
                    injureMode={injureMode}
                    setInjureMode={setInjureMode}
                    damageMode={damageMode}
                    applyDamage={applyDamage}
                    updateProtectedStatus={updateProtectionStatus}
                    destroyCard={destroyCard}
                    gameState={gameState}
                    player="left"
                    isInteractable={isInteractable}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    abilityRestoreMode={abilityRestoreMode}
                    applyRestore={applyRestore}
                    destroyPersonMode={destroyPersonMode}
                    checkAbilityEnabled={checkAbilityEnabled}
                    returnToHandMode={returnToHandMode}
                    setReturnToHandMode={setReturnToHandMode}
                    damageColumnMode={damageColumnMode}
                    sacrificeMode={sacrificeMode}
                    setSacrificeMode={setSacrificeMode}
                    sacrificePendingDamage={sacrificePendingDamage}
                    setSacrificePendingDamage={setSacrificePendingDamage}
                    setDamageMode={setDamageMode}
                    setDamageValue={setDamageValue}
                    mimicMode={mimicMode}
                    restorePersonReadyMode={restorePersonReadyMode}
                    multiRestoreMode={multiRestoreMode}
                    sacrificeEffect={sacrificeEffect}
                    sacrificeSource={sacrificeSource}
                    setSacrificeEffect={setSacrificeEffect}
                    setSacrificeSource={setSacrificeSource}
                    drawDeck={drawDeck}
                    setDrawDeck={setDrawDeck}
                    leftPlayerState={leftPlayerState}
                    rightPlayerState={rightPlayerState}
                    setLeftPlayerState={setLeftPlayerState}
                    setRightPlayerState={setRightPlayerState}
                    setRestorePlayer={setRestorePlayer}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setOpponentChoiceDamageMode={setOpponentChoiceDamageMode}
                    opponentChoiceDamageSource={opponentChoiceDamageSource}
                    setOpponentChoiceDamageSource={setOpponentChoiceDamageSource}
                    opponentChoiceDamageValue={opponentChoiceDamageValue}
                    setOpponentChoiceDamageValue={setOpponentChoiceDamageValue}
                    setSniperMode={setSniperMode}
                    setDamageSource={setDamageSource}
                    octagonSacrificeMode={octagonSacrificeMode}
                    octagonOpponentSacrificeMode={octagonOpponentSacrificeMode}
                    handleOctagonSacrifice={handleOctagonSacrifice}
                    handleOctagonOpponentSacrifice={handleOctagonOpponentSacrifice}
                    constructionYardSelectingPerson={constructionYardSelectingPerson}
                    constructionYardSelectingDestination={constructionYardSelectingDestination}
                    constructionYardSelectedPerson={constructionYardSelectedPerson}
                    onPersonSelected={handlePersonSelected}
                    onDestinationSelected={handleDestinationSelected}
                  />
                  <CampSlot
                    index={0}
                    card={leftPlayerState.campSlots[0]}
                    playerState={leftPlayerState}
                    setPlayerState={setLeftPlayerState}
                    gameState={gameState}
                    player="left"
                    isInteractable={isInteractable}
                    applyDamage={applyDamage}
                    campRaidMode={campRaidMode}
                    raidingPlayer={raidingPlayer}
                    damageMode={damageMode}
                    sniperMode={sniperMode}
                    campDamageMode={campDamageMode}
                    destroyCampMode={destroyCampMode}
                    damageColumnMode={damageColumnMode}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    abilityRestoreMode={abilityRestoreMode}
                    multiRestoreMode={multiRestoreMode}
                    applyRestore={applyRestore}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    checkAbilityEnabled={checkAbilityEnabled}
                    setDamageMode={setDamageMode}
                    setDamageSource={setDamageSource}
                    setDamageValue={setDamageValue}
                    setCampDamageMode={setCampDamageMode}
                    setSniperMode={setSniperMode}
                    destroyCamp={destroyCamp}
                    restoreCard={restoreCard}
                    setRestoreMode={setRestoreMode}
                    restoreSourceIndex={restoreSourceIndex}
                    setDamageColumnMode={setDamageColumnMode}
                    setCampRaidMode={setCampRaidMode}
                    setRaidingPlayer={setRaidingPlayer}
                    setRaidMessage={setRaidMessage}
                    setGameState={setGameState}
                    anyCardDamageMode={anyCardDamageMode}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setDestroyCampMode={setDestroyCampMode}
                    updateProtectionStatus={updateProtectionStatus}
                    addToDiscardPile={addToDiscardPile}
                  />
                </div>
                {/* Column 2 */}
                <div className="flex flex-col">
                  <PersonSlot
                    index={2}
                    card={leftPlayerState.personSlots[2]}
                    playerState={leftPlayerState}
                    setPlayerState={setLeftPlayerState}
                    punkPlacementMode={punkPlacementMode}
                    punkCardToPlace={punkCardToPlace}
                    setPunkPlacementMode={setPunkPlacementMode}
                    setPunkCardToPlace={setPunkCardToPlace}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    setRestoreMode={setRestoreMode}
                    injureMode={injureMode}
                    setInjureMode={setInjureMode}
                    damageMode={damageMode}
                    applyDamage={applyDamage}
                    updateProtectedStatus={updateProtectionStatus}
                    destroyCard={destroyCard}
                    gameState={gameState}
                    player="left"
                    isInteractable={isInteractable}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    abilityRestoreMode={abilityRestoreMode}
                    applyRestore={applyRestore}
                    destroyPersonMode={destroyPersonMode}
                    checkAbilityEnabled={checkAbilityEnabled}
                    returnToHandMode={returnToHandMode}
                    setReturnToHandMode={setReturnToHandMode}
                    damageColumnMode={damageColumnMode}
                    sacrificeMode={sacrificeMode}
                    setSacrificeMode={setSacrificeMode}
                    sacrificePendingDamage={sacrificePendingDamage}
                    setSacrificePendingDamage={setSacrificePendingDamage}
                    setDamageMode={setDamageMode}
                    setDamageValue={setDamageValue}
                    mimicMode={mimicMode}
                    restorePersonReadyMode={restorePersonReadyMode}
                    multiRestoreMode={multiRestoreMode}
                    sacrificeEffect={sacrificeEffect}
                    sacrificeSource={sacrificeSource}
                    setSacrificeEffect={setSacrificeEffect}
                    setSacrificeSource={setSacrificeSource}
                    drawDeck={drawDeck}
                    setDrawDeck={setDrawDeck}
                    leftPlayerState={leftPlayerState}
                    rightPlayerState={rightPlayerState}
                    setLeftPlayerState={setLeftPlayerState}
                    setRightPlayerState={setRightPlayerState}
                    setRestorePlayer={setRestorePlayer}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setOpponentChoiceDamageMode={setOpponentChoiceDamageMode}
                    opponentChoiceDamageSource={opponentChoiceDamageSource}
                    setOpponentChoiceDamageSource={setOpponentChoiceDamageSource}
                    opponentChoiceDamageValue={opponentChoiceDamageValue}
                    setOpponentChoiceDamageValue={setOpponentChoiceDamageValue}
                    setSniperMode={setSniperMode}
                    setDamageSource={setDamageSource}
                    octagonSacrificeMode={octagonSacrificeMode}
                    octagonOpponentSacrificeMode={octagonOpponentSacrificeMode}
                    handleOctagonSacrifice={handleOctagonSacrifice}
                    handleOctagonOpponentSacrifice={handleOctagonOpponentSacrifice}
                    constructionYardSelectingPerson={constructionYardSelectingPerson}
                    constructionYardSelectingDestination={constructionYardSelectingDestination}
                    constructionYardSelectedPerson={constructionYardSelectedPerson}
                    onPersonSelected={handlePersonSelected}
                    onDestinationSelected={handleDestinationSelected}
                  />
                  <PersonSlot
                    index={3}
                    card={leftPlayerState.personSlots[3]}
                    playerState={leftPlayerState}
                    setPlayerState={setLeftPlayerState}
                    punkPlacementMode={punkPlacementMode}
                    punkCardToPlace={punkCardToPlace}
                    setPunkPlacementMode={setPunkPlacementMode}
                    setPunkCardToPlace={setPunkCardToPlace}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    setRestoreMode={setRestoreMode}
                    injureMode={injureMode}
                    setInjureMode={setInjureMode}
                    damageMode={damageMode}
                    applyDamage={applyDamage}
                    updateProtectedStatus={updateProtectionStatus}
                    destroyCard={destroyCard}
                    gameState={gameState}
                    player="left"
                    isInteractable={isInteractable}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    abilityRestoreMode={abilityRestoreMode}
                    applyRestore={applyRestore}
                    destroyPersonMode={destroyPersonMode}
                    checkAbilityEnabled={checkAbilityEnabled}
                    returnToHandMode={returnToHandMode}
                    setReturnToHandMode={setReturnToHandMode}
                    damageColumnMode={damageColumnMode}
                    sacrificeMode={sacrificeMode}
                    setSacrificeMode={setSacrificeMode}
                    sacrificePendingDamage={sacrificePendingDamage}
                    setSacrificePendingDamage={setSacrificePendingDamage}
                    setDamageMode={setDamageMode}
                    setDamageValue={setDamageValue}
                    mimicMode={mimicMode}
                    restorePersonReadyMode={restorePersonReadyMode}
                    multiRestoreMode={multiRestoreMode}
                    sacrificeEffect={sacrificeEffect}
                    sacrificeSource={sacrificeSource}
                    setSacrificeEffect={setSacrificeEffect}
                    setSacrificeSource={setSacrificeSource}
                    drawDeck={drawDeck}
                    setDrawDeck={setDrawDeck}
                    leftPlayerState={leftPlayerState}
                    rightPlayerState={rightPlayerState}
                    setLeftPlayerState={setLeftPlayerState}
                    setRightPlayerState={setRightPlayerState}
                    setRestorePlayer={setRestorePlayer}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setOpponentChoiceDamageMode={setOpponentChoiceDamageMode}
                    opponentChoiceDamageSource={opponentChoiceDamageSource}
                    setOpponentChoiceDamageSource={setOpponentChoiceDamageSource}
                    opponentChoiceDamageValue={opponentChoiceDamageValue}
                    setOpponentChoiceDamageValue={setOpponentChoiceDamageValue}
                    setSniperMode={setSniperMode}
                    setDamageSource={setDamageSource}
                    octagonSacrificeMode={octagonSacrificeMode}
                    octagonOpponentSacrificeMode={octagonOpponentSacrificeMode}
                    handleOctagonSacrifice={handleOctagonSacrifice}
                    handleOctagonOpponentSacrifice={handleOctagonOpponentSacrifice}
                    constructionYardSelectingPerson={constructionYardSelectingPerson}
                    constructionYardSelectingDestination={constructionYardSelectingDestination}
                    constructionYardSelectedPerson={constructionYardSelectedPerson}
                    onPersonSelected={handlePersonSelected}
                    onDestinationSelected={handleDestinationSelected}
                  />
                  <CampSlot
                    index={1}
                    card={leftPlayerState.campSlots[1]}
                    playerState={leftPlayerState}
                    setPlayerState={setLeftPlayerState}
                    gameState={gameState}
                    player="left"
                    isInteractable={isInteractable}
                    applyDamage={applyDamage}
                    campRaidMode={campRaidMode}
                    raidingPlayer={raidingPlayer}
                    damageMode={damageMode}
                    sniperMode={sniperMode}
                    campDamageMode={campDamageMode}
                    destroyCampMode={destroyCampMode}
                    damageColumnMode={damageColumnMode}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    abilityRestoreMode={abilityRestoreMode}
                    multiRestoreMode={multiRestoreMode}
                    applyRestore={applyRestore}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    checkAbilityEnabled={checkAbilityEnabled}
                    setDamageMode={setDamageMode}
                    setDamageSource={setDamageSource}
                    setDamageValue={setDamageValue}
                    setCampDamageMode={setCampDamageMode}
                    setSniperMode={setSniperMode}
                    destroyCamp={destroyCamp}
                    restoreCard={restoreCard}
                    setRestoreMode={setRestoreMode}
                    restoreSourceIndex={restoreSourceIndex}
                    setDamageColumnMode={setDamageColumnMode}
                    setCampRaidMode={setCampRaidMode}
                    setRaidingPlayer={setRaidingPlayer}
                    setRaidMessage={setRaidMessage}
                    setGameState={setGameState}
                    anyCardDamageMode={anyCardDamageMode}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setDestroyCampMode={setDestroyCampMode}
                    updateProtectionStatus={updateProtectionStatus}
                    addToDiscardPile={addToDiscardPile}
                  />
                </div>
                {/* Column 3 */}
                <div className="flex flex-col">
                  <PersonSlot
                    index={4}
                    card={leftPlayerState.personSlots[4]}
                    playerState={leftPlayerState}
                    setPlayerState={setLeftPlayerState}
                    punkPlacementMode={punkPlacementMode}
                    punkCardToPlace={punkCardToPlace}
                    setPunkPlacementMode={setPunkPlacementMode}
                    setPunkCardToPlace={setPunkCardToPlace}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    setRestoreMode={setRestoreMode}
                    injureMode={injureMode}
                    setInjureMode={setInjureMode}
                    damageMode={damageMode}
                    applyDamage={applyDamage}
                    updateProtectedStatus={updateProtectionStatus}
                    destroyCard={destroyCard}
                    gameState={gameState}
                    player="left"
                    isInteractable={isInteractable}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    abilityRestoreMode={abilityRestoreMode}
                    applyRestore={applyRestore}
                    destroyPersonMode={destroyPersonMode}
                    checkAbilityEnabled={checkAbilityEnabled}
                    returnToHandMode={returnToHandMode}
                    setReturnToHandMode={setReturnToHandMode}
                    damageColumnMode={damageColumnMode}
                    sacrificeMode={sacrificeMode}
                    setSacrificeMode={setSacrificeMode}
                    sacrificePendingDamage={sacrificePendingDamage}
                    setSacrificePendingDamage={setSacrificePendingDamage}
                    setDamageMode={setDamageMode}
                    setDamageValue={setDamageValue}
                    mimicMode={mimicMode}
                    restorePersonReadyMode={restorePersonReadyMode}
                    multiRestoreMode={multiRestoreMode}
                    sacrificeEffect={sacrificeEffect}
                    sacrificeSource={sacrificeSource}
                    setSacrificeEffect={setSacrificeEffect}
                    setSacrificeSource={setSacrificeSource}
                    drawDeck={drawDeck}
                    setDrawDeck={setDrawDeck}
                    leftPlayerState={leftPlayerState}
                    rightPlayerState={rightPlayerState}
                    setLeftPlayerState={setLeftPlayerState}
                    setRightPlayerState={setRightPlayerState}
                    setRestorePlayer={setRestorePlayer}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setOpponentChoiceDamageMode={setOpponentChoiceDamageMode}
                    opponentChoiceDamageSource={opponentChoiceDamageSource}
                    setOpponentChoiceDamageSource={setOpponentChoiceDamageSource}
                    opponentChoiceDamageValue={opponentChoiceDamageValue}
                    setOpponentChoiceDamageValue={setOpponentChoiceDamageValue}
                    setSniperMode={setSniperMode}
                    setDamageSource={setDamageSource}
                    octagonSacrificeMode={octagonSacrificeMode}
                    octagonOpponentSacrificeMode={octagonOpponentSacrificeMode}
                    handleOctagonSacrifice={handleOctagonSacrifice}
                    handleOctagonOpponentSacrifice={handleOctagonOpponentSacrifice}
                    constructionYardSelectingPerson={constructionYardSelectingPerson}
                    constructionYardSelectingDestination={constructionYardSelectingDestination}
                    constructionYardSelectedPerson={constructionYardSelectedPerson}
                    onPersonSelected={handlePersonSelected}
                    onDestinationSelected={handleDestinationSelected}
                  />
                  <PersonSlot
                    index={5}
                    card={leftPlayerState.personSlots[5]}
                    playerState={leftPlayerState}
                    setPlayerState={setLeftPlayerState}
                    punkPlacementMode={punkPlacementMode}
                    punkCardToPlace={punkCardToPlace}
                    setPunkPlacementMode={setPunkPlacementMode}
                    setPunkCardToPlace={setPunkCardToPlace}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    setRestoreMode={setRestoreMode}
                    injureMode={injureMode}
                    setInjureMode={setInjureMode}
                    damageMode={damageMode}
                    applyDamage={applyDamage}
                    updateProtectedStatus={updateProtectionStatus}
                    destroyCard={destroyCard}
                    gameState={gameState}
                    player="left"
                    isInteractable={isInteractable}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    abilityRestoreMode={abilityRestoreMode}
                    applyRestore={applyRestore}
                    destroyPersonMode={destroyPersonMode}
                    checkAbilityEnabled={checkAbilityEnabled}
                    returnToHandMode={returnToHandMode}
                    setReturnToHandMode={setReturnToHandMode}
                    damageColumnMode={damageColumnMode}
                    sacrificeMode={sacrificeMode}
                    setSacrificeMode={setSacrificeMode}
                    sacrificePendingDamage={sacrificePendingDamage}
                    setSacrificePendingDamage={setSacrificePendingDamage}
                    setDamageMode={setDamageMode}
                    setDamageValue={setDamageValue}
                    mimicMode={mimicMode}
                    restorePersonReadyMode={restorePersonReadyMode}
                    multiRestoreMode={multiRestoreMode}
                    sacrificeEffect={sacrificeEffect}
                    sacrificeSource={sacrificeSource}
                    setSacrificeEffect={setSacrificeEffect}
                    setSacrificeSource={setSacrificeSource}
                    drawDeck={drawDeck}
                    setDrawDeck={setDrawDeck}
                    leftPlayerState={leftPlayerState}
                    rightPlayerState={rightPlayerState}
                    setLeftPlayerState={setLeftPlayerState}
                    setRightPlayerState={setRightPlayerState}
                    setRestorePlayer={setRestorePlayer}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setOpponentChoiceDamageMode={setOpponentChoiceDamageMode}
                    opponentChoiceDamageSource={opponentChoiceDamageSource}
                    setOpponentChoiceDamageSource={setOpponentChoiceDamageSource}
                    opponentChoiceDamageValue={opponentChoiceDamageValue}
                    setOpponentChoiceDamageValue={setOpponentChoiceDamageValue}
                    setSniperMode={setSniperMode}
                    setDamageSource={setDamageSource}
                    octagonSacrificeMode={octagonSacrificeMode}
                    octagonOpponentSacrificeMode={octagonOpponentSacrificeMode}
                    handleOctagonSacrifice={handleOctagonSacrifice}
                    handleOctagonOpponentSacrifice={handleOctagonOpponentSacrifice}
                    constructionYardSelectingPerson={constructionYardSelectingPerson}
                    constructionYardSelectingDestination={constructionYardSelectingDestination}
                    constructionYardSelectedPerson={constructionYardSelectedPerson}
                    onPersonSelected={handlePersonSelected}
                    onDestinationSelected={handleDestinationSelected}
                  />
                  <CampSlot
                    index={2}
                    card={leftPlayerState.campSlots[2]}
                    playerState={leftPlayerState}
                    setPlayerState={setLeftPlayerState}
                    gameState={gameState}
                    player="left"
                    isInteractable={isInteractable}
                    applyDamage={applyDamage}
                    campRaidMode={campRaidMode}
                    raidingPlayer={raidingPlayer}
                    damageMode={damageMode}
                    sniperMode={sniperMode}
                    campDamageMode={campDamageMode}
                    destroyCampMode={destroyCampMode}
                    damageColumnMode={damageColumnMode}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    abilityRestoreMode={abilityRestoreMode}
                    multiRestoreMode={multiRestoreMode}
                    applyRestore={applyRestore}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    checkAbilityEnabled={checkAbilityEnabled}
                    setDamageMode={setDamageMode}
                    setDamageSource={setDamageSource}
                    setDamageValue={setDamageValue}
                    setCampDamageMode={setCampDamageMode}
                    setSniperMode={setSniperMode}
                    destroyCamp={destroyCamp}
                    restoreCard={restoreCard}
                    setRestoreMode={setRestoreMode}
                    restoreSourceIndex={restoreSourceIndex}
                    setDamageColumnMode={setDamageColumnMode}
                    setCampRaidMode={setCampRaidMode}
                    setRaidingPlayer={setRaidingPlayer}
                    setRaidMessage={setRaidMessage}
                    setGameState={setGameState}
                    anyCardDamageMode={anyCardDamageMode}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setDestroyCampMode={setDestroyCampMode}
                    updateProtectionStatus={updateProtectionStatus}
                    addToDiscardPile={addToDiscardPile}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Center Area */}
          <div className="w-1/3 h-full border border-gray-600 p-2">
            <div className="h-full flex flex-col justify-between">
              {/* Top section with deck and discard */}
              <div className="flex flex-col items-center mt-8">
                <div
                  className={`w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-8 
    ${drawDeck.length > 0 ? 'cursor-pointer' : 'opacity-50'}`}
                  onClick={() => {
                    if (drawDeck.length > 0) {
                      const drawnCard = drawDeck[0];
                      setDrawDeck(drawDeck.slice(1));
                      setLeftPlayerState((prev) => ({
                        ...prev,
                        handCards: [...prev.handCards, drawnCard],
                      }));
                    }
                  }}
                >
                  <div className="text-white text-center mt-12">
                    {drawDeck.length > 0 ? (
                      <>
                        Draw Deck
                        <br />({drawDeck.length} cards)
                      </>
                    ) : (
                      'Empty Deck'
                    )}
                  </div>
                </div>
                <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={addDamagedPersons}>
                  Add Damaged Persons
                </button>

                {opponentChoiceDamageMode && (
                  <div className="fixed top-1/4 left-0 right-0 text-center z-50">
                    <div className="inline-block bg-red-600 text-white font-bold py-2 px-4 rounded-lg animate-pulse">
                      {`${
                        gameState.currentTurn === 'left' ? 'RIGHT' : 'LEFT'
                      } PLAYER: Choose one of your cards to receive damage!`}
                    </div>
                  </div>
                )}

                {/* Add this somewhere in your UI */}
                {constructionYardSelectingPerson && (
                  <div className="fixed top-1/4 left-0 right-0 text-center z-50">
                    <div className="inline-block bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg animate-pulse">
                      Select a person to move (yours or opponent's)
                    </div>
                  </div>
                )}

                {constructionYardSelectingDestination && (
                  <div className="fixed top-1/4 left-0 right-0 text-center z-50">
                    <div className="inline-block bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg animate-pulse">
                      Select any eligible slot to move the person to (can push existing cards if there's space in the
                      column)
                    </div>
                  </div>
                )}

                {/* Add this somewhere visible during gameplay, like in the center area */}
                {showRestoreDoneButton && (
                  <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2">
                    <button
                      className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded"
                      onClick={() => {
                        setMultiRestoreMode(false);
                        setShowRestoreDoneButton(false);
                        setRestoreSource(null);
                        alert('Restore completed');
                      }}
                    >
                      Done Restoring
                    </button>
                  </div>
                )}
                {scavengerCampSelectingCard && (
                  <div className="fixed top-1/4 left-0 right-0 text-center z-50">
                    <div className="inline-block bg-orange-600 text-white font-bold py-2 px-4 rounded-lg animate-pulse">
                      Select a card from your hand to discard (not Water Silo)
                    </div>
                  </div>
                )}
                {octagonSacrificeMode && (
                  <div className="fixed top-1/4 left-0 right-0 text-center z-50">
                    <div className="inline-block bg-red-600 text-white font-bold py-2 px-4 rounded-lg animate-pulse">
                      Select one of your people to sacrifice
                    </div>
                  </div>
                )}

                {octagonOpponentSacrificeMode && (
                  <div className="fixed top-1/4 left-0 right-0 text-center z-50">
                    <div className="inline-block bg-red-600 text-white font-bold py-2 px-4 rounded-lg animate-pulse">
                      {gameState.currentTurn === 'left' ? 'RIGHT' : 'LEFT'} PLAYER: Select one of your people to
                      sacrifice
                    </div>
                  </div>
                )}
                {/* Cache Ability Order Modal */}
                {showCacheModal && cacheCard && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-4 rounded-lg max-w-md w-full">
                      <h2 className="text-white text-xl mb-4">Cache Ability Order</h2>
                      <p className="text-white mb-4">Choose the order to execute abilities:</p>

                      <div className="flex flex-col gap-4">
                        <button
                          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded"
                          onClick={() => {
                            setShowCacheModal(false);
                            // First gain punk, then raid
                            executeCacheAbility(cacheCard, cacheLocation, 'punk_first');
                          }}
                        >
                          1. Gain Punk → 2. Raid
                        </button>

                        <button
                          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded"
                          onClick={() => {
                            setShowCacheModal(false);
                            // First raid, then gain punk
                            executeCacheAbility(cacheCard, cacheLocation, 'raid_first');
                          }}
                        >
                          1. Raid → 2. Gain Punk
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Supply Depot Discard Modal */}
                {supplyDepotDiscardMode && supplyDepotDrawnCards.length > 0 && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    style={{ height: '100vh', width: '100vw' }}
                  >
                    <div
                      className="bg-gray-800 p-4 rounded-lg border-2 border-gray-600 shadow-xl"
                      style={{
                        maxWidth: '90%',
                        width: '400px',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <h2 className="text-white text-xl font-bold mb-4">Supply Depot</h2>
                      <p className="text-white mb-4">
                        Select one card to discard. The other card will be added to your hand.
                      </p>

                      <div className="flex justify-center gap-4 mb-4">
                        {supplyDepotDrawnCards.map((card, index) => (
                          <div
                            key={index}
                            className="w-24 h-36 border border-gray-400 rounded bg-gray-700 hover:border-purple-400 hover:bg-gray-600 cursor-pointer"
                            onClick={() => {
                              // Discard this card
                              setDiscardPile((prev) => [...prev, card]);

                              // Add the other card to hand
                              const otherCard = supplyDepotDrawnCards.find((c) => c.id !== card.id);
                              if (otherCard) {
                                // Use the correct setState based on current player
                                if (gameState.currentTurn === 'left') {
                                  setLeftPlayerState((prev) => ({
                                    ...prev,
                                    handCards: [...prev.handCards, otherCard],
                                  }));
                                } else {
                                  setRightPlayerState((prev) => ({
                                    ...prev,
                                    handCards: [...prev.handCards, otherCard],
                                  }));
                                }
                              }

                              // Clear state and exit discard mode
                              setSupplyDepotDrawnCards([]);
                              setSupplyDepotDiscardMode(false);

                              alert(`Discarded ${card.name}. Added ${otherCard?.name} to your hand.`);
                            }}
                          >
                            <div className="text-white text-center text-xs mt-4">
                              {card.name}
                              <br />
                              {card.type}
                              <br />
                              {card.type === 'person' && card.playCost !== undefined ? `Cost: ${card.playCost}` : ''}
                              <br />
                              {card.junkEffect && `Junk: ${card.junkEffect}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {/* Discard Modal */}
                {showDiscardModal && cardToDiscard && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-4 rounded-lg border-2 border-gray-600">
                      <div className="text-white mb-4">What would you like to do with this card?</div>
                      <div className="flex gap-4">
                        {cardToDiscard.card.junkEffect && (
                          <button
                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded"
                            onClick={() => {
                              if (cardToDiscard.card.junkEffect === 'extra_water') {
                                const setPlayerState =
                                  cardToDiscard.sourcePlayer === 'left' ? setLeftPlayerState : setRightPlayerState;
                                setPlayerState((prev) => ({
                                  ...prev,
                                  waterCount: prev.waterCount + 1,
                                  handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                }));
                              } else if (cardToDiscard.card.junkEffect === 'draw_card') {
                                const setPlayerState =
                                  cardToDiscard.sourcePlayer === 'left' ? setLeftPlayerState : setRightPlayerState;
                                const playerState =
                                  cardToDiscard.sourcePlayer === 'left' ? leftPlayerState : rightPlayerState;

                                if (drawDeck.length > 0) {
                                  const topCard = drawDeck[drawDeck.length - 1];
                                  setPlayerState((prev) => ({
                                    ...prev,
                                    handCards: [
                                      ...prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                      topCard,
                                    ],
                                  }));
                                  setDrawDeck((prev) => prev.slice(0, -1));
                                }
                              } else if (cardToDiscard.card.junkEffect === 'gain_punk') {
                                if (drawDeck.length > 0) {
                                  const topCard = drawDeck[drawDeck.length - 1];
                                  setPunkCardToPlace(topCard);
                                  setPunkPlacementMode(true);
                                  setDrawDeck((prev) => prev.slice(0, -1));
                                  // Remove the junked card from hand
                                  const setPlayerState =
                                    cardToDiscard.sourcePlayer === 'left' ? setLeftPlayerState : setRightPlayerState;
                                  setPlayerState((prev) => ({
                                    ...prev,
                                    handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                  }));
                                }
                              } else if (cardToDiscard.card.junkEffect === 'raid') {
                                const sourcePlayer = cardToDiscard.sourcePlayer;
                                const playerState = sourcePlayer === 'left' ? leftPlayerState : rightPlayerState;
                                const setPlayerState =
                                  sourcePlayer === 'left' ? setLeftPlayerState : setRightPlayerState;

                                // Use the new helper function to mark event as played
                                markEventPlayed(
                                  sourcePlayer as 'left' | 'right',
                                  setLeftPlayedEventThisTurn,
                                  setRightPlayedEventThisTurn
                                );

                                // Use the new helper function to check Zeto Kahn effect
                                const shouldExecuteImmediately = checkZetoKahnEffect(
                                  sourcePlayer as 'left' | 'right',
                                  leftPlayerState,
                                  rightPlayerState,
                                  leftPlayedEventThisTurn,
                                  rightPlayedEventThisTurn
                                );

                                // If Zeto Kahn's conditions are met, execute raid immediately
                                if (shouldExecuteImmediately) {
                                  // Remove the card from hand
                                  setPlayerState((prev) => ({
                                    ...prev,
                                    handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                  }));

                                  // Add to discard pile
                                  setDiscardPile((prev) => [...prev, cardToDiscard.card]);

                                  // Set up raid immediately
                                  const opponentPlayer = sourcePlayer === 'left' ? 'right' : 'left';
                                  setCampRaidMode(true);
                                  setRaidingPlayer(sourcePlayer);
                                  setRaidMessage(
                                    `${opponentPlayer.toUpperCase()} PLAYER: Choose a camp to damage from the raid!`
                                  );

                                  // Close the modal
                                  setShowDiscardModal(false);
                                  setCardToDiscard(null);
                                  return; // Exit early
                                }

                                // Normal raid handling if Zeto Kahn's conditions aren't met
                                // Handle Raiders movement based on current location
                                switch (playerState.raidersLocation) {
                                  case 'default':
                                    // Create Raiders card
                                    const raidersCard = {
                                      id: 'raiders',
                                      name: 'Raiders',
                                      type: 'event',
                                      startingQueuePosition: 2,
                                      owner: sourcePlayer,
                                    };

                                    // Simple logic to manually place Raiders in the right slot
                                    // First try slot 2 (index 1)
                                    if (playerState.eventSlots[1] === null) {
                                      // Slot 2 is available, place Raiders there
                                      setPlayerState((prev) => ({
                                        ...prev,
                                        eventSlots: [prev.eventSlots[0], raidersCard, prev.eventSlots[2]],
                                        raidersLocation: 'event2',
                                        handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                      }));
                                    }
                                    // If slot 2 is occupied, try slot 3 (index 0)
                                    else if (playerState.eventSlots[0] === null) {
                                      // Slot 3 is available, place Raiders there
                                      setPlayerState((prev) => ({
                                        ...prev,
                                        eventSlots: [raidersCard, prev.eventSlots[1], prev.eventSlots[2]],
                                        raidersLocation: 'event3',
                                        handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                      }));
                                    }
                                    // If both slots are occupied
                                    else {
                                      alert('No valid slot available for Raiders!');
                                      // Still remove the card even if placement fails
                                      setPlayerState((prev) => ({
                                        ...prev,
                                        handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                      }));
                                      setDiscardPile((prev) => [...prev, cardToDiscard.card]);
                                    }
                                    break;

                                  case 'event3':
                                    // Move from slot 3 to slot 2 if empty
                                    if (!playerState.eventSlots[1]) {
                                      setPlayerState((prev) => ({
                                        ...prev,
                                        eventSlots: [
                                          null, // Clear slot 3
                                          { id: 'raiders', name: 'Raiders', type: 'event', startingQueuePosition: 2 },
                                          prev.eventSlots[2],
                                        ],
                                        raidersLocation: 'event2',
                                        handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                      }));
                                    }
                                    break;

                                  case 'event2':
                                    // Move from slot 2 to slot 1 if empty
                                    if (!playerState.eventSlots[2]) {
                                      setPlayerState((prev) => ({
                                        ...prev,
                                        eventSlots: [
                                          prev.eventSlots[0],
                                          null, // Clear slot 2
                                          { id: 'raiders', name: 'Raiders', type: 'event', startingQueuePosition: 2 },
                                        ],
                                        raidersLocation: 'event1',
                                        handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                      }));
                                    }
                                    break;

                                  case 'event1':
                                    // Execute raid immediately
                                    const opponentPlayer = cardToDiscard.sourcePlayer === 'left' ? 'right' : 'left';

                                    // Remove Raiders from event slot 1 and return to default
                                    setPlayerState((prev) => ({
                                      ...prev,
                                      eventSlots: [
                                        prev.eventSlots[0],
                                        prev.eventSlots[1],
                                        null, // Clear slot 1
                                      ],
                                      raidersLocation: 'default',
                                      handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                    }));

                                    // Set raid mode to let opponent choose a camp
                                    setCampRaidMode(true);
                                    setRaidingPlayer(cardToDiscard.sourcePlayer === 'left' ? 'left' : 'right');
                                    setRaidMessage(
                                      `${opponentPlayer.toUpperCase()} PLAYER: Choose a camp to damage from the raid!`
                                    );
                                    break;
                                }
                              } else if (cardToDiscard.card.junkEffect === 'restore') {
                                const setPlayerState =
                                  cardToDiscard.sourcePlayer === 'left' ? setLeftPlayerState : setRightPlayerState;
                                // Remove the junked card from hand first
                                setPlayerState((prev) => ({
                                  ...prev,
                                  handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                }));
                                // Add to discard pile
                                setDiscardPile((prev) => [...prev, cardToDiscard.card]);
                                // Enter restore mode to let player choose a damaged card
                                setRestoreMode(true);
                                // Set which player's cards can be restored
                                setRestorePlayer(cardToDiscard.sourcePlayer as 'left' | 'right');
                              } else if (cardToDiscard.card.junkEffect === 'injure') {
                                const setPlayerState =
                                  cardToDiscard.sourcePlayer === 'left' ? setLeftPlayerState : setRightPlayerState;
                                // Remove the junked card from hand first
                                setPlayerState((prev) => ({
                                  ...prev,
                                  handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                }));
                                // Add to discard pile
                                setDiscardPile((prev) => [...prev, cardToDiscard.card]);
                                // Enter injure mode to let player choose an unprotected enemy card
                                setInjureMode(true);
                              } else {
                                // Only add to discard pile for effects that don't already do it
                                setDiscardPile((prev) => [...prev, cardToDiscard.card]);
                              }
                              // Add card to discard pile if not already done in the specific junk effect
                              // Some junk effects like 'restore' already handle this, so we'll only add it
                              // if it's not one of those
                              if (!['restore', 'injure'].includes(cardToDiscard.card.junkEffect)) {
                                setDiscardPile((prev) => [...prev, cardToDiscard.card]);
                              }
                              setShowDiscardModal(false);
                              setCardToDiscard(null);
                            }}
                          >
                            Junk
                          </button>
                        )}
                        <button
                          className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
                          onClick={() => {
                            const setPlayerState =
                              cardToDiscard.sourcePlayer === 'left' ? setLeftPlayerState : setRightPlayerState;
                            setPlayerState((prev) => ({
                              ...prev,
                              handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                            }));
                            setDiscardPile((prev) => [...prev, cardToDiscard.card]);
                            setShowDiscardModal(false);
                            setCardToDiscard(null);
                          }}
                        >
                          Discard
                        </button>
                        <button
                          className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded"
                          onClick={() => {
                            setShowDiscardModal(false);
                            setCardToDiscard(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div
                  className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const cardId = e.dataTransfer.getData('cardId');
                    const sourcePlayer = e.dataTransfer.getData('sourcePlayer');
                    const playerState = sourcePlayer === 'left' ? leftPlayerState : rightPlayerState;

                    const discardedCard = playerState.handCards.find((card) => card.id === cardId);

                    if (discardedCard) {
                      setCardToDiscard({ card: discardedCard, sourcePlayer });
                      setShowDiscardModal(true);
                    }
                  }}
                >
                  <div className="text-white text-center mt-12">
                    Discard Pile
                    <br />({discardPile.length} cards)
                  </div>
                </div>
              </div>

              {/* Raid Message */}
              {campRaidMode && (
                <div className="flex justify-center mb-4">
                  <div className="bg-red-700 text-white font-bold py-2 px-4 rounded-lg animate-pulse">
                    {raidMessage}
                  </div>
                </div>
              )}
              {/* Phase Tracker */}
              <div className="flex justify-center mb-8">
                <div className="flex space-x-8">
                  <div
                    className={`text-lg ${
                      gameState.currentPhase === 'events' ? 'text-purple-300 font-bold' : 'text-gray-400'
                    }`}
                  >
                    Events
                  </div>
                  <div
                    className={`text-lg ${
                      gameState.currentPhase === 'replenish' ? 'text-purple-300 font-bold' : 'text-gray-400'
                    }`}
                  >
                    Replenish
                  </div>
                  <div
                    className={`text-lg ${
                      gameState.currentPhase === 'actions' ? 'text-purple-300 font-bold' : 'text-gray-400'
                    }`}
                  >
                    Actions
                  </div>
                </div>
              </div>
              {/* Discard Selection Message */}
              {discardSelectionActive && (
                <div className="flex justify-center mb-4">
                  <div className="bg-red-700 text-white font-bold py-2 px-4 rounded-lg animate-pulse">
                    Select {discardSelectionCount} cards to discard
                  </div>
                </div>
              )}
              {/* Bottom section with water counters and special cards */}
              <div className="flex justify-between mb-8">
                {/* Left player section */}
                <div className="relative">
                  {gameState.currentTurn === 'left' && (
                    <button
                      className="absolute -top-20 left-0 right-0 bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
                      onClick={() => {
                        // Log the end turn action
                        gameLogger.logAction(createEndTurnAction(gameState.currentTurn));

                        // Then proceed with normal end turn handling
                        endTurn(
                          gameState,
                          setGameState,
                          () => {
                            setLeftPlayedEventThisTurn(false);
                            setLeftCardsUsedAbility([]);
                            setResonatorUsedThisTurn(false);
                            setOmenClockActive(false);
                            setOmenClockLocation(null);
                            setConstructionYardActive(false);
                            setConstructionYardSelectingPerson(false);
                            setConstructionYardSelectingDestination(false);
                            setConstructionYardSelectedPerson(null);
                            setLeftPlayerState((prev) => ({
                              ...prev,
                              campSlots: prev.campSlots.map((camp) => (camp ? { ...camp, isReady: true } : null)),
                            }));
                          },
                          () => {
                            setRightPlayedEventThisTurn(false);
                            setRightCardsUsedAbility([]);
                            // Add this line to reset right player's camps to ready state
                            setRightPlayerState((prev) => ({
                              ...prev,
                              campSlots: prev.campSlots.map((camp) => (camp ? { ...camp, isReady: true } : null)),
                            }));
                          }
                        );
                      }}
                    >
                      Done
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-16 h-20 border border-gray-400 rounded bg-blue-800
    ${
      !leftPlayerState.waterSiloInHand && leftPlayerState.waterCount >= 1 && gameState.currentTurn === 'left'
        ? 'cursor-pointer hover:brightness-110'
        : 'opacity-50'
    }`}
                      onClick={() => {
                        if (
                          !leftPlayerState.waterSiloInHand &&
                          leftPlayerState.waterCount >= 1 &&
                          gameState.currentTurn === 'left'
                        ) {
                          setLeftPlayerState((prev) => ({
                            ...prev,
                            waterSiloInHand: true,
                            waterCount: prev.waterCount - 1,
                            handCards: [...prev.handCards, leftWaterSiloCard],
                          }));
                        }
                      }}
                    >
                      <div className="text-white text-center text-xs mt-6">
                        Water Silo
                        {!leftPlayerState.waterSiloInHand ? (
                          <>
                            <br />
                            (1 water)
                          </>
                        ) : (
                          <>
                            <br />
                            (in hand)
                          </>
                        )}
                      </div>
                    </div>
                    <div
                      className={`w-16 h-20 border border-gray-400 rounded bg-red-800 ${
                        leftPlayerState.raidersLocation !== 'default' ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="text-white text-center text-xs mt-6">
                        Raiders
                        <br />
                        {leftPlayerState.raidersLocation === 'default' ? '(ready)' : '(in queue)'}
                      </div>
                    </div>
                    <div className="bg-blue-600 rounded-full p-4 text-white font-bold text-xl">
                      💧 {leftPlayerState.waterCount}
                    </div>
                  </div>
                </div>

                {/* Right player section */}
                <div className="relative">
                  {gameState.currentTurn === 'right' && (
                    <button
                      className="absolute -top-20 left-0 right-0 bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
                      onClick={() => {
                        setGameState((prev) => ({
                          ...prev,
                          currentTurn: prev.currentTurn === 'left' ? 'right' : 'left',
                          currentPhase: 'events',
                        }));
                      }}
                    >
                      Done
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-600 rounded-full p-4 text-white font-bold text-xl">
                      💧 {rightPlayerState.waterCount}
                    </div>
                    <div
                      className={`w-16 h-20 border border-gray-400 rounded bg-blue-800
    ${
      !rightPlayerState.waterSiloInHand && rightPlayerState.waterCount >= 1 && gameState.currentTurn === 'right'
        ? 'cursor-pointer hover:brightness-110'
        : 'opacity-50'
    }`}
                      onClick={() => {
                        if (
                          !rightPlayerState.waterSiloInHand &&
                          rightPlayerState.waterCount >= 1 &&
                          gameState.currentTurn === 'right'
                        ) {
                          setRightPlayerState((prev) => ({
                            ...prev,
                            waterSiloInHand: true,
                            waterCount: prev.waterCount - 1,
                            handCards: [...prev.handCards, rightWaterSiloCard],
                          }));
                        }
                      }}
                    >
                      <div className="text-white text-center text-xs mt-6">
                        Water Silo
                        {!rightPlayerState.waterSiloInHand ? (
                          <>
                            <br />
                            (1 water)
                          </>
                        ) : (
                          <>
                            <br />
                            (in hand)
                          </>
                        )}
                      </div>
                    </div>
                    <div className="w-16 h-20 border border-gray-400 rounded bg-red-800">
                      <div className="text-white text-center text-xs mt-6">Raiders</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Player Area */}
          <div
            className={`w-1/3 h-full p-2 relative border-2
          ${
            gameState.currentTurn === 'right'
              ? 'border-3 border-pink-500 shadow-[0_0_5px_rgba(255,105,180,0.7),0_0_10px_rgba(255,105,180,0.5),0_0_45px_rgba(255,105,180,0.3)] brightness-110'
              : 'border-2 border-gray-600'
          }`}
          >
            <div
              style={{
                marginTop: '50px',
              }}
            >
              {/* Event Queue */}
              <div className="flex justify-end gap-2 mb-8 mr-4">
                <EventSlot
                  index={0}
                  card={rightPlayerState.eventSlots[0]}
                  playerState={rightPlayerState}
                  setPlayerState={setRightPlayerState}
                  player="right"
                  omenClockActive={omenClockActive}
                  canEventBeAdvanced={canEventBeAdvanced}
                  onEventAdvance={advanceEventByOne}
                />
                <EventSlot
                  index={1}
                  card={rightPlayerState.eventSlots[1]}
                  playerState={rightPlayerState}
                  setPlayerState={setRightPlayerState}
                  player="right"
                  omenClockActive={omenClockActive}
                  canEventBeAdvanced={canEventBeAdvanced}
                  onEventAdvance={advanceEventByOne}
                />
                <EventSlot
                  index={2}
                  card={rightPlayerState.eventSlots[2]}
                  playerState={rightPlayerState}
                  setPlayerState={setRightPlayerState}
                  player="right"
                  omenClockActive={omenClockActive}
                  canEventBeAdvanced={canEventBeAdvanced}
                  onEventAdvance={advanceEventByOne}
                />
              </div>
              {/* Three columns of cards */}
              <div className="flex justify-between">
                {/* Column 1 */}
                <div className="flex flex-col">
                  <PersonSlot
                    index={0}
                    card={rightPlayerState.personSlots[0]}
                    playerState={rightPlayerState}
                    setPlayerState={setRightPlayerState}
                    punkPlacementMode={punkPlacementMode}
                    punkCardToPlace={punkCardToPlace}
                    setPunkPlacementMode={setPunkPlacementMode}
                    setPunkCardToPlace={setPunkCardToPlace}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    setRestoreMode={setRestoreMode}
                    injureMode={injureMode}
                    setInjureMode={setInjureMode}
                    damageMode={damageMode}
                    applyDamage={applyDamage}
                    updateProtectedStatus={updateProtectionStatus}
                    destroyCard={destroyCard}
                    gameState={gameState}
                    player="right"
                    isInteractable={isInteractable}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    abilityRestoreMode={abilityRestoreMode}
                    applyRestore={applyRestore}
                    sniperMode={sniperMode}
                    destroyPersonMode={destroyPersonMode}
                    checkAbilityEnabled={checkAbilityEnabled}
                    returnToHandMode={returnToHandMode}
                    setReturnToHandMode={setReturnToHandMode}
                    damageColumnMode={damageColumnMode}
                    sacrificeMode={sacrificeMode}
                    mimicMode={mimicMode}
                    restorePersonReadyMode={restorePersonReadyMode}
                    multiRestoreMode={multiRestoreMode}
                    sacrificeEffect={sacrificeEffect}
                    sacrificeSource={sacrificeSource}
                    setSacrificeEffect={setSacrificeEffect}
                    setSacrificeSource={setSacrificeSource}
                    drawDeck={drawDeck}
                    setDrawDeck={setDrawDeck}
                    leftPlayerState={leftPlayerState}
                    rightPlayerState={rightPlayerState}
                    setLeftPlayerState={setLeftPlayerState}
                    setRightPlayerState={setRightPlayerState}
                    setRestorePlayer={setRestorePlayer}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setOpponentChoiceDamageMode={setOpponentChoiceDamageMode}
                    opponentChoiceDamageSource={opponentChoiceDamageSource}
                    setOpponentChoiceDamageSource={setOpponentChoiceDamageSource}
                    opponentChoiceDamageValue={opponentChoiceDamageValue}
                    setOpponentChoiceDamageValue={setOpponentChoiceDamageValue}
                    setSniperMode={setSniperMode}
                    setDamageSource={setDamageSource}
                    octagonSacrificeMode={octagonSacrificeMode}
                    octagonOpponentSacrificeMode={octagonOpponentSacrificeMode}
                    handleOctagonSacrifice={handleOctagonSacrifice}
                    handleOctagonOpponentSacrifice={handleOctagonOpponentSacrifice}
                    constructionYardSelectingPerson={constructionYardSelectingPerson}
                    constructionYardSelectingDestination={constructionYardSelectingDestination}
                    constructionYardSelectedPerson={constructionYardSelectedPerson}
                    onPersonSelected={handlePersonSelected}
                    onDestinationSelected={handleDestinationSelected}
                  />
                  <PersonSlot
                    index={1}
                    card={rightPlayerState.personSlots[1]}
                    playerState={rightPlayerState}
                    setPlayerState={setRightPlayerState}
                    punkPlacementMode={punkPlacementMode}
                    punkCardToPlace={punkCardToPlace}
                    setPunkPlacementMode={setPunkPlacementMode}
                    setPunkCardToPlace={setPunkCardToPlace}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    setRestoreMode={setRestoreMode}
                    injureMode={injureMode}
                    setInjureMode={setInjureMode}
                    damageMode={damageMode}
                    applyDamage={applyDamage}
                    updateProtectedStatus={updateProtectionStatus}
                    destroyCard={destroyCard}
                    gameState={gameState}
                    player="right"
                    isInteractable={isInteractable}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    abilityRestoreMode={abilityRestoreMode}
                    applyRestore={applyRestore}
                    sniperMode={sniperMode}
                    destroyPersonMode={destroyPersonMode}
                    checkAbilityEnabled={checkAbilityEnabled}
                    returnToHandMode={returnToHandMode}
                    setReturnToHandMode={setReturnToHandMode}
                    damageColumnMode={damageColumnMode}
                    sacrificeMode={sacrificeMode}
                    mimicMode={mimicMode}
                    restorePersonReadyMode={restorePersonReadyMode}
                    multiRestoreMode={multiRestoreMode}
                    sacrificeEffect={sacrificeEffect}
                    sacrificeSource={sacrificeSource}
                    setSacrificeEffect={setSacrificeEffect}
                    setSacrificeSource={setSacrificeSource}
                    drawDeck={drawDeck}
                    setDrawDeck={setDrawDeck}
                    leftPlayerState={leftPlayerState}
                    rightPlayerState={rightPlayerState}
                    setLeftPlayerState={setLeftPlayerState}
                    setRightPlayerState={setRightPlayerState}
                    setRestorePlayer={setRestorePlayer}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setOpponentChoiceDamageMode={setOpponentChoiceDamageMode}
                    opponentChoiceDamageSource={opponentChoiceDamageSource}
                    setOpponentChoiceDamageSource={setOpponentChoiceDamageSource}
                    opponentChoiceDamageValue={opponentChoiceDamageValue}
                    setOpponentChoiceDamageValue={setOpponentChoiceDamageValue}
                    setSniperMode={setSniperMode}
                    setDamageSource={setDamageSource}
                    octagonSacrificeMode={octagonSacrificeMode}
                    octagonOpponentSacrificeMode={octagonOpponentSacrificeMode}
                    handleOctagonSacrifice={handleOctagonSacrifice}
                    handleOctagonOpponentSacrifice={handleOctagonOpponentSacrifice}
                    constructionYardSelectingPerson={constructionYardSelectingPerson}
                    constructionYardSelectingDestination={constructionYardSelectingDestination}
                    constructionYardSelectedPerson={constructionYardSelectedPerson}
                    onPersonSelected={handlePersonSelected}
                    onDestinationSelected={handleDestinationSelected}
                  />
                  <CampSlot
                    index={0}
                    card={rightPlayerState.campSlots[0]}
                    playerState={rightPlayerState}
                    setPlayerState={setRightPlayerState}
                    gameState={gameState}
                    player="right"
                    isInteractable={isInteractable}
                    applyDamage={applyDamage}
                    campRaidMode={campRaidMode}
                    raidingPlayer={raidingPlayer}
                    damageMode={damageMode}
                    sniperMode={sniperMode}
                    campDamageMode={campDamageMode}
                    destroyCampMode={destroyCampMode}
                    damageColumnMode={damageColumnMode}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    abilityRestoreMode={abilityRestoreMode}
                    multiRestoreMode={multiRestoreMode}
                    applyRestore={applyRestore}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    checkAbilityEnabled={checkAbilityEnabled}
                    setDamageMode={setDamageMode}
                    setDamageSource={setDamageSource}
                    setDamageValue={setDamageValue}
                    setCampDamageMode={setCampDamageMode}
                    setSniperMode={setSniperMode}
                    destroyCamp={destroyCamp}
                    restoreCard={restoreCard}
                    setRestoreMode={setRestoreMode}
                    restoreSourceIndex={restoreSourceIndex}
                    setDamageColumnMode={setDamageColumnMode}
                    setCampRaidMode={setCampRaidMode}
                    setRaidingPlayer={setRaidingPlayer}
                    setRaidMessage={setRaidMessage}
                    setGameState={setGameState}
                    anyCardDamageMode={anyCardDamageMode}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setDestroyCampMode={setDestroyCampMode}
                    updateProtectionStatus={updateProtectionStatus}
                    addToDiscardPile={addToDiscardPile}
                  />
                </div>
                {/* Column 2 */}
                <div className="flex flex-col">
                  <PersonSlot
                    index={2}
                    card={rightPlayerState.personSlots[2]}
                    playerState={rightPlayerState}
                    setPlayerState={setRightPlayerState}
                    punkPlacementMode={punkPlacementMode}
                    punkCardToPlace={punkCardToPlace}
                    setPunkPlacementMode={setPunkPlacementMode}
                    setPunkCardToPlace={setPunkCardToPlace}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    setRestoreMode={setRestoreMode}
                    injureMode={injureMode}
                    setInjureMode={setInjureMode}
                    damageMode={damageMode}
                    applyDamage={applyDamage}
                    updateProtectedStatus={updateProtectionStatus}
                    destroyCard={destroyCard}
                    gameState={gameState}
                    player="right"
                    isInteractable={isInteractable}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    abilityRestoreMode={abilityRestoreMode}
                    applyRestore={applyRestore}
                    sniperMode={sniperMode}
                    destroyPersonMode={destroyPersonMode}
                    checkAbilityEnabled={checkAbilityEnabled}
                    returnToHandMode={returnToHandMode}
                    setReturnToHandMode={setReturnToHandMode}
                    damageColumnMode={damageColumnMode}
                    sacrificeMode={sacrificeMode}
                    mimicMode={mimicMode}
                    restorePersonReadyMode={restorePersonReadyMode}
                    multiRestoreMode={multiRestoreMode}
                    sacrificeEffect={sacrificeEffect}
                    sacrificeSource={sacrificeSource}
                    setSacrificeEffect={setSacrificeEffect}
                    setSacrificeSource={setSacrificeSource}
                    drawDeck={drawDeck}
                    setDrawDeck={setDrawDeck}
                    leftPlayerState={leftPlayerState}
                    rightPlayerState={rightPlayerState}
                    setLeftPlayerState={setLeftPlayerState}
                    setRightPlayerState={setRightPlayerState}
                    setRestorePlayer={setRestorePlayer}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setOpponentChoiceDamageMode={setOpponentChoiceDamageMode}
                    opponentChoiceDamageSource={opponentChoiceDamageSource}
                    setOpponentChoiceDamageSource={setOpponentChoiceDamageSource}
                    opponentChoiceDamageValue={opponentChoiceDamageValue}
                    setOpponentChoiceDamageValue={setOpponentChoiceDamageValue}
                    setSniperMode={setSniperMode}
                    setDamageSource={setDamageSource}
                    octagonSacrificeMode={octagonSacrificeMode}
                    octagonOpponentSacrificeMode={octagonOpponentSacrificeMode}
                    handleOctagonSacrifice={handleOctagonSacrifice}
                    handleOctagonOpponentSacrifice={handleOctagonOpponentSacrifice}
                    constructionYardSelectingPerson={constructionYardSelectingPerson}
                    constructionYardSelectingDestination={constructionYardSelectingDestination}
                    constructionYardSelectedPerson={constructionYardSelectedPerson}
                    onPersonSelected={handlePersonSelected}
                    onDestinationSelected={handleDestinationSelected}
                  />
                  <PersonSlot
                    index={3}
                    card={rightPlayerState.personSlots[3]}
                    playerState={rightPlayerState}
                    setPlayerState={setRightPlayerState}
                    punkPlacementMode={punkPlacementMode}
                    punkCardToPlace={punkCardToPlace}
                    setPunkPlacementMode={setPunkPlacementMode}
                    setPunkCardToPlace={setPunkCardToPlace}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    setRestoreMode={setRestoreMode}
                    injureMode={injureMode}
                    setInjureMode={setInjureMode}
                    damageMode={damageMode}
                    applyDamage={applyDamage}
                    updateProtectedStatus={updateProtectionStatus}
                    destroyCard={destroyCard}
                    gameState={gameState}
                    player="right"
                    isInteractable={isInteractable}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    abilityRestoreMode={abilityRestoreMode}
                    applyRestore={applyRestore}
                    sniperMode={sniperMode}
                    destroyPersonMode={destroyPersonMode}
                    checkAbilityEnabled={checkAbilityEnabled}
                    returnToHandMode={returnToHandMode}
                    setReturnToHandMode={setReturnToHandMode}
                    damageColumnMode={damageColumnMode}
                    sacrificeMode={sacrificeMode}
                    mimicMode={mimicMode}
                    restorePersonReadyMode={restorePersonReadyMode}
                    multiRestoreMode={multiRestoreMode}
                    sacrificeEffect={sacrificeEffect}
                    sacrificeSource={sacrificeSource}
                    setSacrificeEffect={setSacrificeEffect}
                    setSacrificeSource={setSacrificeSource}
                    drawDeck={drawDeck}
                    setDrawDeck={setDrawDeck}
                    leftPlayerState={leftPlayerState}
                    rightPlayerState={rightPlayerState}
                    setLeftPlayerState={setLeftPlayerState}
                    setRightPlayerState={setRightPlayerState}
                    setRestorePlayer={setRestorePlayer}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setOpponentChoiceDamageMode={setOpponentChoiceDamageMode}
                    opponentChoiceDamageSource={opponentChoiceDamageSource}
                    setOpponentChoiceDamageSource={setOpponentChoiceDamageSource}
                    opponentChoiceDamageValue={opponentChoiceDamageValue}
                    setOpponentChoiceDamageValue={setOpponentChoiceDamageValue}
                    setSniperMode={setSniperMode}
                    setDamageSource={setDamageSource}
                    octagonSacrificeMode={octagonSacrificeMode}
                    octagonOpponentSacrificeMode={octagonOpponentSacrificeMode}
                    handleOctagonSacrifice={handleOctagonSacrifice}
                    handleOctagonOpponentSacrifice={handleOctagonOpponentSacrifice}
                    constructionYardSelectingPerson={constructionYardSelectingPerson}
                    constructionYardSelectingDestination={constructionYardSelectingDestination}
                    constructionYardSelectedPerson={constructionYardSelectedPerson}
                    onPersonSelected={handlePersonSelected}
                    onDestinationSelected={handleDestinationSelected}
                  />
                  <CampSlot
                    index={1}
                    card={rightPlayerState.campSlots[1]}
                    playerState={rightPlayerState}
                    setPlayerState={setRightPlayerState}
                    gameState={gameState}
                    player="right"
                    isInteractable={isInteractable}
                    applyDamage={applyDamage}
                    campRaidMode={campRaidMode}
                    raidingPlayer={raidingPlayer}
                    damageMode={damageMode}
                    sniperMode={sniperMode}
                    campDamageMode={campDamageMode}
                    destroyCampMode={destroyCampMode}
                    damageColumnMode={damageColumnMode}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    abilityRestoreMode={abilityRestoreMode}
                    multiRestoreMode={multiRestoreMode}
                    applyRestore={applyRestore}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    checkAbilityEnabled={checkAbilityEnabled}
                    setDamageMode={setDamageMode}
                    setDamageSource={setDamageSource}
                    setDamageValue={setDamageValue}
                    setCampDamageMode={setCampDamageMode}
                    setSniperMode={setSniperMode}
                    destroyCamp={destroyCamp}
                    restoreCard={restoreCard}
                    setRestoreMode={setRestoreMode}
                    restoreSourceIndex={restoreSourceIndex}
                    setDamageColumnMode={setDamageColumnMode}
                    setCampRaidMode={setCampRaidMode}
                    setRaidingPlayer={setRaidingPlayer}
                    setRaidMessage={setRaidMessage}
                    setGameState={setGameState}
                    anyCardDamageMode={anyCardDamageMode}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setDestroyCampMode={setDestroyCampMode}
                    updateProtectionStatus={updateProtectionStatus}
                    addToDiscardPile={addToDiscardPile}
                  />
                </div>
                {/* Column 3 */}
                <div className="flex flex-col">
                  <PersonSlot
                    index={4}
                    card={rightPlayerState.personSlots[4]}
                    playerState={rightPlayerState}
                    setPlayerState={setRightPlayerState}
                    punkPlacementMode={punkPlacementMode}
                    punkCardToPlace={punkCardToPlace}
                    setPunkPlacementMode={setPunkPlacementMode}
                    setPunkCardToPlace={setPunkCardToPlace}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    setRestoreMode={setRestoreMode}
                    injureMode={injureMode}
                    setInjureMode={setInjureMode}
                    damageMode={damageMode}
                    applyDamage={applyDamage}
                    updateProtectedStatus={updateProtectionStatus}
                    destroyCard={destroyCard}
                    gameState={gameState}
                    player="right"
                    isInteractable={isInteractable}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    abilityRestoreMode={abilityRestoreMode}
                    applyRestore={applyRestore}
                    sniperMode={sniperMode}
                    destroyPersonMode={destroyPersonMode}
                    checkAbilityEnabled={checkAbilityEnabled}
                    returnToHandMode={returnToHandMode}
                    setReturnToHandMode={setReturnToHandMode}
                    damageColumnMode={damageColumnMode}
                    sacrificeMode={sacrificeMode}
                    mimicMode={mimicMode}
                    restorePersonReadyMode={restorePersonReadyMode}
                    multiRestoreMode={multiRestoreMode}
                    sacrificeEffect={sacrificeEffect}
                    sacrificeSource={sacrificeSource}
                    setSacrificeEffect={setSacrificeEffect}
                    setSacrificeSource={setSacrificeSource}
                    drawDeck={drawDeck}
                    setDrawDeck={setDrawDeck}
                    leftPlayerState={leftPlayerState}
                    rightPlayerState={rightPlayerState}
                    setLeftPlayerState={setLeftPlayerState}
                    setRightPlayerState={setRightPlayerState}
                    setRestorePlayer={setRestorePlayer}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setOpponentChoiceDamageMode={setOpponentChoiceDamageMode}
                    opponentChoiceDamageSource={opponentChoiceDamageSource}
                    setOpponentChoiceDamageSource={setOpponentChoiceDamageSource}
                    opponentChoiceDamageValue={opponentChoiceDamageValue}
                    setOpponentChoiceDamageValue={setOpponentChoiceDamageValue}
                    setSniperMode={setSniperMode}
                    setDamageSource={setDamageSource}
                    octagonSacrificeMode={octagonSacrificeMode}
                    octagonOpponentSacrificeMode={octagonOpponentSacrificeMode}
                    handleOctagonSacrifice={handleOctagonSacrifice}
                    handleOctagonOpponentSacrifice={handleOctagonOpponentSacrifice}
                    constructionYardSelectingPerson={constructionYardSelectingPerson}
                    constructionYardSelectingDestination={constructionYardSelectingDestination}
                    constructionYardSelectedPerson={constructionYardSelectedPerson}
                    onPersonSelected={handlePersonSelected}
                    onDestinationSelected={handleDestinationSelected}
                  />
                  <PersonSlot
                    index={5}
                    card={rightPlayerState.personSlots[5]}
                    playerState={rightPlayerState}
                    setPlayerState={setRightPlayerState}
                    punkPlacementMode={punkPlacementMode}
                    punkCardToPlace={punkCardToPlace}
                    setPunkPlacementMode={setPunkPlacementMode}
                    setPunkCardToPlace={setPunkCardToPlace}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    setRestoreMode={setRestoreMode}
                    injureMode={injureMode}
                    setInjureMode={setInjureMode}
                    damageMode={damageMode}
                    applyDamage={applyDamage}
                    updateProtectedStatus={updateProtectionStatus}
                    destroyCard={destroyCard}
                    gameState={gameState}
                    player="right"
                    isInteractable={isInteractable}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    abilityRestoreMode={abilityRestoreMode}
                    applyRestore={applyRestore}
                    sniperMode={sniperMode}
                    destroyPersonMode={destroyPersonMode}
                    checkAbilityEnabled={checkAbilityEnabled}
                    returnToHandMode={returnToHandMode}
                    setReturnToHandMode={setReturnToHandMode}
                    damageColumnMode={damageColumnMode}
                    sacrificeMode={sacrificeMode}
                    mimicMode={mimicMode}
                    restorePersonReadyMode={restorePersonReadyMode}
                    multiRestoreMode={multiRestoreMode}
                    sacrificeEffect={sacrificeEffect}
                    sacrificeSource={sacrificeSource}
                    setSacrificeEffect={setSacrificeEffect}
                    setSacrificeSource={setSacrificeSource}
                    drawDeck={drawDeck}
                    setDrawDeck={setDrawDeck}
                    leftPlayerState={leftPlayerState}
                    rightPlayerState={rightPlayerState}
                    setLeftPlayerState={setLeftPlayerState}
                    setRightPlayerState={setRightPlayerState}
                    setRestorePlayer={setRestorePlayer}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setOpponentChoiceDamageMode={setOpponentChoiceDamageMode}
                    opponentChoiceDamageSource={opponentChoiceDamageSource}
                    setOpponentChoiceDamageSource={setOpponentChoiceDamageSource}
                    opponentChoiceDamageValue={opponentChoiceDamageValue}
                    setOpponentChoiceDamageValue={setOpponentChoiceDamageValue}
                    setSniperMode={setSniperMode}
                    setDamageSource={setDamageSource}
                    octagonSacrificeMode={octagonSacrificeMode}
                    octagonOpponentSacrificeMode={octagonOpponentSacrificeMode}
                    handleOctagonSacrifice={handleOctagonSacrifice}
                    handleOctagonOpponentSacrifice={handleOctagonOpponentSacrifice}
                    constructionYardSelectingPerson={constructionYardSelectingPerson}
                    constructionYardSelectingDestination={constructionYardSelectingDestination}
                    constructionYardSelectedPerson={constructionYardSelectedPerson}
                    onPersonSelected={handlePersonSelected}
                    onDestinationSelected={handleDestinationSelected}
                  />
                  <CampSlot
                    index={2}
                    card={rightPlayerState.campSlots[2]}
                    playerState={rightPlayerState}
                    setPlayerState={setRightPlayerState}
                    gameState={gameState}
                    player="right"
                    isInteractable={isInteractable}
                    applyDamage={applyDamage}
                    campRaidMode={campRaidMode}
                    raidingPlayer={raidingPlayer}
                    damageMode={damageMode}
                    sniperMode={sniperMode}
                    campDamageMode={campDamageMode}
                    destroyCampMode={destroyCampMode}
                    damageColumnMode={damageColumnMode}
                    restoreMode={restoreMode}
                    restorePlayer={restorePlayer}
                    abilityRestoreMode={abilityRestoreMode}
                    multiRestoreMode={multiRestoreMode}
                    applyRestore={applyRestore}
                    setSelectedCard={setSelectedCard}
                    setSelectedCardLocation={setSelectedCardLocation}
                    setIsAbilityModalOpen={setIsAbilityModalOpen}
                    checkAbilityEnabled={checkAbilityEnabled}
                    setDamageMode={setDamageMode}
                    setDamageSource={setDamageSource}
                    setDamageValue={setDamageValue}
                    setCampDamageMode={setCampDamageMode}
                    setSniperMode={setSniperMode}
                    destroyCamp={destroyCamp}
                    restoreCard={restoreCard}
                    setRestoreMode={setRestoreMode}
                    restoreSourceIndex={restoreSourceIndex}
                    setDamageColumnMode={setDamageColumnMode}
                    setCampRaidMode={setCampRaidMode}
                    setRaidingPlayer={setRaidingPlayer}
                    setRaidMessage={setRaidMessage}
                    setGameState={setGameState}
                    anyCardDamageMode={anyCardDamageMode}
                    opponentChoiceDamageMode={opponentChoiceDamageMode}
                    setDestroyCampMode={setDestroyCampMode}
                    updateProtectionStatus={updateProtectionStatus}
                    addToDiscardPile={addToDiscardPile}
                  />
                </div>
              </div>
            </div>

            {/*Hand Area*/}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="border-2 border-gray-400 rounded bg-gray-700 p-4 min-h-32">
                <div
                  className="flex flex-wrap gap-2"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const cardId = e.dataTransfer.getData('cardId');
                    const sourceType = e.dataTransfer.getData('sourceType');
                    const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'));

                    if (sourceType === 'personSlot') {
                      const card = leftPlayerState.personSlots[sourceIndex];
                      if (card) {
                        setLeftPlayerState((prev) => {
                          const updatedSlots = prev.personSlots.map((slot, i) => (i === sourceIndex ? null : slot));
                          return {
                            ...prev,
                            handCards: [...prev.handCards, card],
                            personSlots: updateProtectionStatus(updatedSlots),
                          };
                        });
                      }
                    }
                  }}
                >
                  {rightPlayerState.handCards.map((card) => (
                    <div
                      key={card.id}
                      className={`w-16 h-24 border border-gray-400 rounded ${
                        card.id === leftWaterSiloCard.id ? 'cursor-pointer hover:brightness-110' : ''
                      } ${
                        discardSelectionActive && gameState.currentTurn === 'left' && card.type !== 'watersilo'
                          ? 'border-purple-400 animate-pulse cursor-pointer'
                          : ''
                      } ${
                        card.type === 'person' && card.playCost > leftPlayerState.waterCount
                          ? 'bg-gray-800 opacity-60'
                          : 'bg-gray-600'
                      }`}
                      draggable="true"
                      onDragStart={(e) => {
                        e.dataTransfer.setData('cardId', card.id);
                        e.dataTransfer.setData('sourcePlayer', 'right');
                      }}
                      onClick={() => {
                        if (scavengerCampSelectingCard) {
                          handleScavengerCampDiscard(card);
                          return;
                        }
                        if (card.id === rightWaterSiloCard.id) {
                          setRightPlayerState((prev) => ({
                            ...prev,
                            waterSiloInHand: false,
                            waterCount: prev.waterCount + 1,
                            handCards: prev.handCards.filter((c) => c.id !== rightWaterSiloCard.id),
                          }));
                        } else if (
                          discardSelectionActive &&
                          gameState.currentTurn === 'right' &&
                          card.type !== 'watersilo'
                        ) {
                          // Handle discard selection
                          setRightPlayerState((prev) => ({
                            ...prev,
                            handCards: prev.handCards.filter((c) => c.id !== card.id),
                          }));
                          setDiscardPile((prev) => [...prev, card]);
                          setDiscardSelectionCount((prev) => prev - 1);

                          // Check if we've discarded enough cards
                          if (discardSelectionCount <= 1) {
                            setDiscardSelectionActive(false);
                            alert('Discard complete!');
                          }
                        }
                      }}
                    >
                      <div className="text-white text-center text-xs mt-4">
                        {card.name}
                        <br />
                        {card.type}
                        <br />
                        {card.startingQueuePosition !== undefined ? `Queue: ${card.startingQueuePosition}` : ''}
                        <br />
                        {card.id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AbilityModal
        isOpen={isAbilityModalOpen}
        onClose={() => setIsAbilityModalOpen(false)}
        card={selectedCard}
        location={selectedCardLocation}
        gameState={gameState}
        leftPlayerState={leftPlayerState}
        rightPlayerState={rightPlayerState}
        stateSetters={stateSetters}
        drawDeck={drawDeck}
      />
    </AbilityProvider>
  );
};

export default GameBoard;
