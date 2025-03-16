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

interface PlayerState {
  handCards: Card[];
  personSlots: (Card | null)[];
  campSlots: (Card | null)[];
  eventSlots: (Card | null)[];
  waterSiloInHand: boolean;
  waterCount: number;
  raidersLocation: 'default' | 'event1' | 'event2' | 'event3';
}

const leftTestCamps: Card[] = [createCamp('base-camp'), createCamp('fortress'), createCamp('outpost')].filter(
  Boolean
) as Card[];

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
  const debugWithAlert = (message) => {
    alert(`DEBUG: ${message}`);
  };

  const isInteractable = (element: 'person' | 'event' | 'camp', elementPlayer: 'left' | 'right', slotIndex: number) => {
    // Default: Players can only interact with their own elements during their turn
    const isCurrentPlayerElement = gameState.currentTurn === elementPlayer;

    // Add this as a new condition in isInteractable
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

        // Bonfire cannot be restored, so exclude it from eligible targets
        if (targetCamp && targetCamp.traits?.includes('cannot_restore')) {
          return false;
        }

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
      // In restore mode, a player can only interact with their own damaged person cards
      // BUT explicitly exclude Repair Bot if it's in restore mode due to its own entry effect
      const playerState = elementPlayer === 'left' ? leftPlayerState : rightPlayerState;
      const card = element === 'person' ? playerState.personSlots[slotIndex] : null;

      if (!card || !card.isDamaged) return false;

      // Special case: if we're in restore mode AND this is a Repair Bot that just entered play
      // AND we're in the entry-triggered restore mode (not an ability-triggered restore)
      if (card.name === 'Repair Bot' && gameState.currentPhase === 'actions') {
        return false; // Exclude the Repair Bot from being a valid target for its own entry effect
      }

      return elementPlayer === restorePlayer;
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
      // In damage mode, similar to injure mode - only opponent's unprotected cards
      const isOpponentElement = gameState.currentTurn !== elementPlayer;

      if (vanguardCounterActive) {
        // During counter phase, target the original player's cards
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

      // Special case for Sniper: can target any card, even protected ones
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

      // Special case for Pyromaniac: can only target camps
      if (campDamageMode) {
        if (element === 'camp') {
          const targetCamp =
            elementPlayer === 'left' ? leftPlayerState.campSlots[slotIndex] : rightPlayerState.campSlots[slotIndex];
          return isOpponentElement && targetCamp && !targetCamp.isProtected;
        }
        return false;
      }

      if (element === 'camp') {
        const card =
          elementPlayer === 'left' ? leftPlayerState.campSlots[slotIndex] : rightPlayerState.campSlots[slotIndex];

        return (
          isCurrentPlayerElement &&
          gameState.currentPhase === 'actions' &&
          card &&
          card.isReady && // Add this check
          card.abilities &&
          card.abilities.length > 0
        );
      }

      // Normal damage logic for other cards
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
        return isCurrentPlayerElement && targetCamp && targetCamp.isDamaged;
      }

      return false;
    }

    if (restorePersonReadyMode) {
      // Only allow targeting damaged person cards
      if (element === 'person') {
        const targetCard =
          elementPlayer === 'left' ? leftPlayerState.personSlots[slotIndex] : rightPlayerState.personSlots[slotIndex];
        return gameState.currentTurn === elementPlayer && targetCard && targetCard.isDamaged;
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

  const leftCamps = [
    { ...createCamp('base-camp'), isDamaged: true }, // First camp is damaged
    null, // Second camp is destroyed
    createCamp('outpost'), // Third camp is normal
  ];

  const [leftPlayerState, setLeftPlayerState] = useState<PlayerState>({
    // Include Holdout, Zeto Kahn, and some event cards
    handCards: [createPerson('sniper')].filter(Boolean) as Card[],
    personSlots: [
      // Create a damaged scout
      // { ...createPerson('scout'), id: 'left-damaged-person-1', isDamaged: true, isReady: false },
      { ...createPerson('scout'), id: 'left-damaged-person-1', isDamaged: true, isReady: false },
      // Create a damaged warrior
      { ...createPerson('assassin'), id: 'left-damaged-person-2', isDamaged: true, isReady: false },
      null,
      {
        id: 'punk-card-test',
        name: 'Punk',
        type: 'person',
        isDamaged: false,
        isProtected: false,
        isPunk: true,
        isReady: false,
      },
      {
        id: 'punk-card-test',
        name: 'Punk',
        type: 'person',
        isDamaged: false,
        isProtected: false,
        isPunk: true,
        isReady: false,
      },
      {
        id: 'punk-card-test',
        name: 'Punk',
        type: 'person',
        isDamaged: false,
        isProtected: false,
        isPunk: true,
        isReady: false,
      },
    ],
    eventSlots: [null, null, null],
    campSlots: [createCamp('command-post'), createCamp('atomic-garden'), createCamp('pillbox')],
    waterSiloInHand: false,
    waterCount: 30,
    raidersLocation: 'default',
  });

  const rightTestPersonSlots: (Card | null)[] = [
    // { ...createPerson('assassin'), id: 'right-person-1', name: 'Guard' }, // Front row, column 1
    null,
    null, // Back row, column 1
    { ...createPerson('assassin'), id: 'right-person-3', name: 'Assassin' }, // Front row, column 2
    // For punk cards, we'll still need a custom definition since they're special
    {
      id: 'right-person-4',
      name: 'Punk Card',
      type: 'person',
      isDamaged: false,
      isProtected: false,
      isPunk: true, // This card is a punk
    },
    null, // Front row, column 3
    { ...createPerson('scout'), id: 'right-person-6', isDamaged: true }, // Back row, column 3
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
    eventSlots: [null, null, null],

    campSlots: initializedRightTestCamps,
    waterSiloInHand: false,
    waterCount: 2,
    raidersLocation: 'default',
  });

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
  const [sacrificeMode, setSacrificeMode] = useState(false);
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
  const [campRaidMode, setCampRaidMode] = useState(false);
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

    // Apply the changes
    setOpponentState((prev) => ({
      ...prev,
      eventSlots: newEvents,
    }));

    alert(`Opponent's events have been delayed in the queue!`);
  };

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

  const [gameState, setGameState] = useState<GameTurnState>({
    currentTurn: 'left', // left player starts
    currentPhase: 'events', // start with events phase
    isFirstTurn: true,
  });

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

  const destroyCard = (card: Card, slotIndex: number, isRightPlayer: boolean) => {
    console.log('Running destroyCard');
    // Get the correct player's state and setter
    const playerState = isRightPlayer ? rightPlayerState : leftPlayerState;
    const setPlayerState = isRightPlayer ? setRightPlayerState : setLeftPlayerState;

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

  const getColumnFromSlotIndex = (slotIndex: number) => {
    return Math.floor(slotIndex / 2);
  };

  const addToDiscardPile = (card: Card) => {
    setDiscardPile((prev) => [...prev, card]);
  };

  const applyDamage = (target: Card, slotIndex: number, isRightPlayer: boolean) => {
    const playerState = isRightPlayer ? rightPlayerState : leftPlayerState;
    const setPlayerState = isRightPlayer ? setRightPlayerState : setLeftPlayerState;
    const currentPlayerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
    const setCurrentPlayerState = gameState.currentTurn === 'left' ? setLeftPlayerState : setRightPlayerState;

    const targetType = target.type;

    // Use our new helper to apply damage
    const wasDestroyed = applyDamageToTarget(
      target,
      slotIndex,
      isRightPlayer,
      setPlayerState,
      destroyCard,
      damageValue
    );

    if (wasDestroyed) {
      alert(`${target.isPunk ? 'Punk' : 'Damaged card'} destroyed!`);
    } else {
      alert(`Applied ${damageValue} damage to ${target.name}`);
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

    // Reset targeting mode
    setDamageMode(false);
    setDamageSource(null);
    setDamageValue(0);
    setSniperMode(false); // Reset sniper mode
    setCampDamageMode(false); // Reset camp damage mode
    setSacrificePendingDamage(false);

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
  };

  const executeJunkEffect = (card: Card) => {
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
        setInjureMode(true);
        break;

      default:
        alert(`Unknown junk effect: ${card.junkEffect}`);
        break;
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
  };

  const executeAbility = (card: Card, ability: any, location: { type: 'person' | 'camp'; index: number }) => {
    const playerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
    const setPlayerState = gameState.currentTurn === 'left' ? setLeftPlayerState : setRightPlayerState;
    const opponentPlayer = gameState.currentTurn === 'left' ? 'right' : 'left';
    const opponentState = opponentPlayer === 'left' ? leftPlayerState : rightPlayerState;
    const setOpponentState = opponentPlayer === 'left' ? setLeftPlayerState : setRightPlayerState;

    let finalWaterCost = ability.cost;

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

    // Check if Vera Vosh's trait is active
    const hasVeraVoshEffect = hasVeraVoshTrait(playerState);

    // Use our helper to mark the card as used
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

      case 'conditional_damage':
        // For cards like Cannon with conditional abilities
        let conditionMet = false;

        if (ability.condition === 'self_undamaged') {
          // For Cannon: "If this card is undamaged, Damage"
          conditionMet = !card.isDamaged;
        }
        // We'll add more conditions later as needed

        if (conditionMet) {
          // Condition is met, proceed with damage effect
          setDamageMode(true);
          setDamageSource(card);
          setDamageValue(ability.value || 1);
          alert(`Select an unprotected enemy card to damage`);
        } else {
          // Condition not met, show message and refund water cost
          alert('Condition not met: This card must be undamaged to use this ability.');

          // Refund the water cost
          const playerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
          const setPlayerState = gameState.currentTurn === 'left' ? setLeftPlayerState : setRightPlayerState;

          setPlayerState((prev) => ({
            ...prev,
            waterCount: prev.waterCount + ability.cost,
          }));
        }
        break;

      case 'restore_person_ready':
        // For Atomic Garden
        setRestorePersonReadyMode(true);
        setRestoreSource(card);
        alert(`Select a damaged person to restore and make them ready`);
        break;

      case 'injure_all':
        // Get the opponent's state and setter
        const opponentPlayer = gameState.currentTurn === 'left' ? 'right' : 'left';
        const opponentState = opponentPlayer === 'left' ? leftPlayerState : rightPlayerState;
        const setOpponentState = opponentPlayer === 'left' ? setLeftPlayerState : setRightPlayerState;

        // Find all unprotected enemy person cards
        const unprotectedPersons = opponentState.personSlots
          .map((slot, index) => ({ slot, index }))
          .filter(({ slot }) => slot && !slot.isProtected);

        if (unprotectedPersons.length === 0) {
          alert('No unprotected enemy persons to injure!');
          break;
        }

        // Process each unprotected person
        unprotectedPersons.forEach(({ slot, index }) => {
          if (slot) {
            if (slot.isDamaged || slot.isPunk) {
              // If already damaged or is a punk, destroy it
              alert(`${slot.name || 'Enemy card'} destroyed!`);
              destroyCard(slot, index, opponentPlayer === 'right');
            } else {
              // Otherwise mark as damaged
              setOpponentState((prev) => ({
                ...prev,
                personSlots: prev.personSlots.map((card, i) =>
                  i === index ? { ...card, isDamaged: true, isReady: false } : card
                ),
              }));
            }
          }
        });

        alert(`Injured all unprotected enemy persons!`);
        break;

      case 'vanguard_damage':
        // Enter damage targeting mode
        setDamageMode(true);
        setDamageSource(card);
        setDamageValue(1);
        setVanguardPendingCounter(true); // Flag to indicate counter-damage is pending
        alert(`Select an unprotected enemy card to damage. Your opponent will then damage one of your cards.`);
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

      case 'punk_damage':
        // Check if player has a punk in play
        const hasPunk = playerState.personSlots.some((card) => card && card.isPunk);

        if (hasPunk) {
          // Enter damage targeting mode
          setDamageMode(true);
          setDamageSource(card);
          setDamageValue(1);
          alert(`Select an unprotected enemy card to damage`);
        } else {
          // If no punk in play, don't allow the ability
          alert('You need a punk in play to use this ability!');

          // Refund the water cost since the ability cannot be used
          setPlayerState((prev) => ({
            ...prev,
            waterCount: prev.waterCount + ability.cost,
          }));

          // Don't mark the card as unready since the ability wasn't used
          if (location.type === 'person') {
            setPlayerState((prev) => ({
              ...prev,
              personSlots: prev.personSlots.map((slot, idx) =>
                idx === location.index ? { ...slot, isReady: true } : slot
              ),
            }));
          }
        }
        break;

      case 'water':
        // Water ability - gain water
        setPlayerState((prev) => ({
          ...prev,
          waterCount: prev.waterCount + (ability.value || 1),
        }));
        alert(`Gained ${ability.value || 1} water!`);
        break;

      case 'draw':
        // Draw ability - draw cards
        if (drawDeck.length > 0) {
          const cardsToDraw = ability.value || 1;
          const cardsDrawn = Math.min(cardsToDraw, drawDeck.length);
          const drawnCards = drawDeck.slice(-cardsDrawn);

          setPlayerState((prev) => ({
            ...prev,
            handCards: [...prev.handCards, ...drawnCards],
          }));
          setDrawDeck((prev) => prev.slice(0, -cardsDrawn));

          alert(`Drew ${cardsDrawn} card${cardsDrawn !== 1 ? 's' : ''}!`);
        } else {
          alert('Draw deck is empty!');
        }
        break;

      case 'damage':
        // Enter damage targeting mode
        setDamageMode(true);
        setDamageSource(card);
        setDamageValue(ability.value || 1);
        // Store the message to show during targeting
        alert(`Select an unprotected enemy card to damage`);
        break;

      case 'restore':
        // Enter restore targeting mode
        setAbilityRestoreMode(true);
        setRestoreSource(card);
        alert(`Select a damaged card to restore`);
        break;

      case 'raid': {
        console.log('Raid ability triggered');

        // Mark that an event is being played
        markEventPlayed(gameState.currentTurn, setLeftPlayedEventThisTurn, setRightPlayedEventThisTurn);

        // Check for Zeto Kahn's immediate effect
        const shouldExecuteImmediately = checkZetoKahnEffect(
          gameState.currentTurn,
          leftPlayerState,
          rightPlayerState,
          leftPlayedEventThisTurn,
          rightPlayedEventThisTurn
        );

        if (shouldExecuteImmediately) {
          console.log("Zeto Kahn's effect applies - executing raid immediately");
          // Execute raid immediately
          executeRaid(gameState.currentTurn);
          return; // Exit early
        }

        // Normal Raiders movement logic
        console.log('Normal Raiders logic executing');

        switch (playerState.raidersLocation) {
          case 'default':
            // Create Raiders card
            const raidersCard = {
              id: 'raiders',
              name: 'Raiders',
              type: 'event',
              startingQueuePosition: 2,
              owner: gameState.currentTurn,
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
              alert('Raiders moved to event slot 2');
            }
            // If slot 2 is occupied, try slot 3 (index 0)
            else if (playerState.eventSlots[0] === null) {
              // Slot 3 is available, place Raiders there
              setPlayerState((prev) => ({
                ...prev,
                eventSlots: [raidersCard, prev.eventSlots[1], prev.eventSlots[2]],
                raidersLocation: 'event3',
              }));
              alert('Raiders moved to event slot 3');
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
              alert('Raiders advanced to event slot 1');
            } else {
              alert('Event slot 1 is occupied. Raiders cannot advance.');
            }
            break;

          case 'event1':
            // Execute raid AND reset Raiders position
            const opponentPlayer = gameState.currentTurn === 'left' ? 'right' : 'left';

            // IMPORTANT: First reset the Raiders card position to default
            setPlayerState((prev) => ({
              ...prev,
              eventSlots: [
                prev.eventSlots[0],
                prev.eventSlots[1],
                null, // Remove Raiders from slot 1
              ],
              raidersLocation: 'default', // Reset to default position
            }));

            // Set up raid mode
            setCampRaidMode(true);
            setRaidingPlayer(gameState.currentTurn);
            setRaidMessage(`${opponentPlayer.toUpperCase()} PLAYER: Choose a camp to damage from the raid!`);
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
              alert('Raiders advanced to event slot 2');
            } else {
              alert('Event slot 2 is occupied. Raiders cannot advance.');
            }
            break;
        }
        break;
      }

      case 'sniper_damage':
        // Enter special sniper damage targeting mode that ignores protection
        setDamageMode(true);
        setDamageSource(card);
        setDamageValue(ability.value || 1);
        setSniperMode(true); // Add a new state to track when sniper ability is active
        alert(`Select any enemy card to damage (protection is ignored)`);
        break;

      case 'damage_camp':
        // Enter camp damage targeting mode - only unprotected camps
        setDamageMode(true);
        setDamageSource(card);
        setDamageValue(ability.value || 1);
        setCampDamageMode(true); // Add a new state for camp-only targeting
        alert(`Select an unprotected enemy camp to damage`);
        break;

      case 'damage_column':
        // Enter column damage targeting mode
        setDamageColumnMode(true);
        setDamageSource(card);
        setDamageValue(1); // Set the damage value to 1
        alert(`Select an enemy column to damage all cards in it`);
        break;

      case 'destroy_person':
        // Enter destroy person targeting mode
        setDestroyPersonMode(true);
        alert(`Select an unprotected enemy person to destroy`);
        break;

      case 'destroy_any_camp':
        // Enter destroy camp targeting mode
        setDestroyCampMode(true);
        alert(`Select any enemy camp to destroy`);
        break;

      case 'destroy_damaged_all': {
        // Using a block scope (notice the curly braces after the case statement)
        // Explicitly define all variables we need within this block
        const currentTurn = gameState.currentTurn;
        const enemyPlayer = currentTurn === 'left' ? 'right' : 'left';
        const enemyState = enemyPlayer === 'left' ? leftPlayerState : rightPlayerState;
        const setEnemyState = enemyPlayer === 'left' ? setLeftPlayerState : setRightPlayerState;

        // Get all damaged enemy person cards
        const damagedPersons = enemyState.personSlots
          .map((slot, index) => ({ slot, index }))
          .filter(({ slot }) => slot && slot.isDamaged);

        // Get all damaged enemy camp cards
        const damagedCamps = enemyState.campSlots
          .map((slot, index) => ({ slot, index }))
          .filter(({ slot }) => slot && slot.isDamaged);

        if (damagedPersons.length === 0 && damagedCamps.length === 0) {
          alert('No damaged enemy cards to destroy!');
          break;
        }

        // Destroy all damaged persons
        damagedPersons.forEach(({ slot, index }) => {
          if (slot) {
            alert(`${slot.name || 'Enemy card'} destroyed!`);
            destroyCard(slot, index, enemyPlayer === 'right');
          }
        });

        // Destroy all damaged camps
        damagedCamps.forEach(({ slot, index }) => {
          if (slot) {
            alert(`${slot.name || 'Enemy camp'} destroyed!`);
            setEnemyState((prev) => ({
              ...prev,
              campSlots: prev.campSlots.map((camp, i) => (i === index ? null : camp)),
            }));
          }
        });

        alert(`All damaged enemy cards destroyed!`);
        break;
      }

      case 'mutant_ability':
        // Open a special modal for choosing Mutant options
        setMutantModalOpen(true);
        setMutantSourceCard(card);
        setMutantSourceLocation(location);
        break;

      case 'sacrifice_then_damage':
        // First step: enter sacrifice mode to select own person to destroy
        setSacrificeMode(true);
        alert(`Select one of your people to sacrifice`);
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

      case 'draw_then_discard':
        // Check if there are cards in the draw deck
        if (drawDeck.length === 0) {
          alert('Draw deck is empty!');
          break;
        }

        // Determine how many cards to draw (up to 3, based on what's available)
        const cardsToDraw = Math.min(3, drawDeck.length);

        // Get the top cards from the draw deck
        const zetoDrawnCards = drawDeck.slice(-cardsToDraw);

        // Add them to the player's hand
        setPlayerState((prev) => ({
          ...prev,
          handCards: [...prev.handCards, ...zetoDrawnCards],
        }));

        // Remove the drawn cards from the draw deck
        setDrawDeck((prev) => prev.slice(0, prev.length - cardsToDraw));

        alert(`Drew ${cardsToDraw} cards. Now select ${cardsToDraw} cards to discard.`);

        // Set the state to track discard selection
        setDiscardSelectionCount(cardsToDraw);
        setDiscardSelectionActive(true);
        break;

      case 'injure':
        // Enter injure targeting mode
        setInjureMode(true);
        alert(`Select an unprotected enemy person to injure`);
        break;

      case 'return_to_hand':
        // Enter return to hand mode
        setReturnToHandMode(true);
        alert(`Select one of your people to return to your hand`);
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
  }, [gameState.currentTurn]);

  return (
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
                    debugWithAlert(`Selected card: ${card.name}, Junk effect: ${card.junkEffect}`);
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

                    // Normal flow for other effects or when ZK conditions aren't met
                    executeJunkEffect(card);

                    // Add all cards to discard pile
                    setDiscardPile((prev) => [...prev, ...scientistCards]);

                    // Clear the scientist cards
                    setScientistCards([]);

                    alert(`Used ${card.name}'s junk effect: ${card.junkEffect}`);
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
              />
              <EventSlot
                index={1}
                card={leftPlayerState.eventSlots[1]}
                playerState={leftPlayerState}
                setPlayerState={setLeftPlayerState}
                player="left"
              />
              <EventSlot
                index={2}
                card={leftPlayerState.eventSlots[2]}
                playerState={leftPlayerState}
                setPlayerState={setLeftPlayerState}
                player="left"
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
                  {leftPlayerState.handCards.map((card) => (
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
                        e.dataTransfer.setData('sourcePlayer', 'left');
                      }}
                      onClick={() => {
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
                        {card.type === 'person' && card.playCost !== undefined ? `Cost: ${card.playCost}` : ''}
                        {card.type === 'person' && card.playCost !== undefined && <br />}
                        {card.startingQueuePosition !== undefined ? `Queue: ${card.startingQueuePosition}` : ''}
                        <br />
                        {card.junkEffect && `Junk: ${card.junkEffect}`}
                        <br />
                        {card.id}
                      </div>
                    </div>
                  ))}
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
                  setSacrificePendingDamage={setSacrificePendingDamage}
                  setDamageMode={setDamageMode}
                  setDamageValue={setDamageValue}
                  mimicMode={mimicMode}
                  restorePersonReadyMode={restorePersonReadyMode}
                  multiRestoreMode={multiRestoreMode}
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
                  setSacrificePendingDamage={setSacrificePendingDamage}
                  setDamageMode={setDamageMode}
                  setDamageValue={setDamageValue}
                  mimicMode={mimicMode}
                  restorePersonReadyMode={restorePersonReadyMode}
                  multiRestoreMode={multiRestoreMode}
                />
                <div
                  className={`w-24 h-32 border-2 rounded
  ${
    leftPlayerState.campSlots[0] === null
      ? 'bg-black'
      : leftPlayerState.campSlots[0]?.isDamaged
      ? 'bg-red-900'
      : 'bg-gray-700'
  }
  ${
    (campRaidMode && raidingPlayer !== 'left' && leftPlayerState.campSlots[0]) ||
    (damageMode &&
      gameState.currentTurn !== 'left' &&
      leftPlayerState.campSlots[0] &&
      (sniperMode || !leftPlayerState.campSlots[0]?.isProtected)) ||
    (destroyCampMode && gameState.currentTurn !== 'left' && leftPlayerState.campSlots[0]) ||
    (abilityRestoreMode && gameState.currentTurn === 'left' && leftPlayerState.campSlots[0]?.isDamaged) ||
    (multiRestoreMode &&
      gameState.currentTurn === 'left' &&
      leftPlayerState.campSlots[0]?.isDamaged &&
      !leftPlayerState.campSlots[0]?.traits?.includes('cannot_restore')) ||
    (restoreMode && restorePlayer === 'left' && leftPlayerState.campSlots[0]?.isDamaged) ||
    (damageColumnMode && gameState.currentTurn !== 'right')
      ? 'border-purple-400 animate-pulse cursor-pointer'
      : leftPlayerState.campSlots[0]?.isDamaged
      ? 'border-red-700'
      : 'border-gray-400'
  }
`}
                  onClick={() => {
                    if (
                      multiRestoreMode &&
                      gameState.currentTurn === 'left' &&
                      leftPlayerState.campSlots[0] &&
                      leftPlayerState.campSlots[0].isDamaged &&
                      !leftPlayerState.campSlots[0].traits?.includes('cannot_restore')
                    ) {
                      // Use applyRestore function
                      applyRestore(leftPlayerState.campSlots[0], 0, false);
                      return; // Exit early to prevent other conditions
                    }
                    if (campRaidMode && raidingPlayer !== 'left' && leftPlayerState.campSlots[0]) {
                      const camp = leftPlayerState.campSlots[0];
                      if (camp.isDamaged) {
                        // If camp is already damaged, destroy it
                        alert('Camp destroyed!');
                        setLeftPlayerState((prev) => ({
                          ...prev,
                          campSlots: prev.campSlots.map((c, i) => (i === 0 ? null : c)),
                        }));
                      } else {
                        // Otherwise, damage it
                        alert('Camp damaged!');
                        setLeftPlayerState((prev) => ({
                          ...prev,
                          campSlots: prev.campSlots.map((c, i) => (i === 0 ? { ...c, isDamaged: true } : c)),
                        }));
                      }
                      // End raid mode
                      setCampRaidMode(false);
                      setRaidingPlayer(null);
                      setRaidMessage('');
                      // Continue to next phase
                      setTimeout(() => {
                        setGameState((prev) => ({
                          ...prev,
                          currentPhase: 'replenish',
                        }));
                      }, 100);
                    } else if (damageColumnMode && gameState.currentTurn !== 'left' && leftPlayerState.campSlots[0]) {
                      // Get the column index (0 for this camp)
                      const columnIndex = 0;

                      // Apply damage to all cards in this column
                      // First, the person cards (indices 0 and 1 for column 0)
                      const frontPerson = leftPlayerState.personSlots[columnIndex * 2];
                      const backPerson = leftPlayerState.personSlots[columnIndex * 2 + 1];

                      // Damage front person if it exists
                      if (frontPerson) {
                        applyDamage(frontPerson, columnIndex * 2, true);
                      }

                      // Damage back person if it exists
                      if (backPerson) {
                        applyDamage(backPerson, columnIndex * 2 + 1, true);
                      }

                      // Damage the camp itself
                      if (leftPlayerState.campSlots[columnIndex]) {
                        applyDamage(leftPlayerState.campSlots[columnIndex], columnIndex, true);
                      }

                      // Reset column damage mode
                      setDamageColumnMode(false);

                      alert(`Damaged all cards in column ${columnIndex + 1}!`);
                    } else if (destroyCampMode && gameState.currentTurn !== 'left' && leftPlayerState.campSlots[0]) {
                      // Handle destroy camp ability
                      alert(`${leftPlayerState.campSlots[0].name} destroyed!`);
                      setLeftPlayerState((prev) => ({
                        ...prev,
                        campSlots: prev.campSlots.map((camp, i) => (i === 0 ? null : camp)),
                      }));
                      // Reset destroy camp mode
                      setDestroyCampMode(false);
                    } else if (
                      damageMode &&
                      gameState.currentTurn !== 'left' &&
                      leftPlayerState.campSlots[0] &&
                      (sniperMode || !leftPlayerState.campSlots[0].isProtected)
                    ) {
                      // Handle damage targeting
                      applyDamage(leftPlayerState.campSlots[0], 0, false);
                    } else if (restoreMode && restorePlayer === 'left' && leftPlayerState.campSlots[0]?.isDamaged) {
                      // Restore the camp
                      setLeftPlayerState((prev) => ({
                        ...prev,
                        campSlots: prev.campSlots.map((camp, i) => (i === 0 ? { ...camp, isDamaged: false } : camp)),
                      }));

                      // Exit restore mode
                      if (setRestoreMode) setRestoreMode(false);
                    } else if (
                      abilityRestoreMode &&
                      gameState.currentTurn === 'left' &&
                      leftPlayerState.campSlots[0]?.isDamaged
                    ) {
                      // Handle restore targeting
                      applyRestore(leftPlayerState.campSlots[0], 0, false);
                    } else if (isInteractable('camp', 'left', 0)) {
                      setSelectedCard(leftPlayerState.campSlots[0]);
                      setSelectedCardLocation({ type: 'camp', index: 0 });
                      setIsAbilityModalOpen(true);
                    }
                  }}
                >
                  <div className="text-white text-center text-xs mt-4">
                    {leftPlayerState.campSlots[0] === null ? (
                      <>
                        Camp 1
                        <br />
                        Destroyed
                      </>
                    ) : (
                      <>
                        {leftPlayerState.campSlots[0]?.name}
                        <br />
                        {leftPlayerState.campSlots[0]?.type}
                        <br />
                        {leftPlayerState.campSlots[0]?.isProtected ? 'Protected' : 'Unprotected'}
                        <br />
                        {leftPlayerState.campSlots[0]?.isDamaged ? 'Damaged (can use abilities)' : 'Not Damaged'}
                        <br />
                        {leftPlayerState.campSlots[0]?.traits?.includes('starts_damaged') ? '(Starts Damaged)' : ''}
                        <br />
                        {leftPlayerState.campSlots[0]?.isReady ? 'Ready' : 'Not Ready'}
                      </>
                    )}
                  </div>
                </div>
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
                  setSacrificePendingDamage={setSacrificePendingDamage}
                  setDamageMode={setDamageMode}
                  setDamageValue={setDamageValue}
                  mimicMode={mimicMode}
                  restorePersonReadyMode={restorePersonReadyMode}
                  multiRestoreMode={multiRestoreMode}
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
                  setSacrificePendingDamage={setSacrificePendingDamage}
                  setDamageMode={setDamageMode}
                  setDamageValue={setDamageValue}
                  mimicMode={mimicMode}
                  restorePersonReadyMode={restorePersonReadyMode}
                  multiRestoreMode={multiRestoreMode}
                />
                <div
                  className={`w-24 h-32 border-2 rounded
  ${
    leftPlayerState.campSlots[1] === null
      ? 'bg-black'
      : leftPlayerState.campSlots[1]?.isDamaged
      ? 'bg-red-900'
      : 'bg-gray-700'
  }
  ${
    (campRaidMode && raidingPlayer !== 'left' && leftPlayerState.campSlots[1]) ||
    (damageMode &&
      gameState.currentTurn !== 'left' &&
      leftPlayerState.campSlots[1] &&
      (sniperMode || !leftPlayerState.campSlots[1]?.isProtected)) ||
    (destroyCampMode && gameState.currentTurn !== 'left' && leftPlayerState.campSlots[1]) ||
    (abilityRestoreMode && gameState.currentTurn === 'left' && leftPlayerState.campSlots[1]?.isDamaged) ||
    (multiRestoreMode &&
      gameState.currentTurn === 'left' &&
      leftPlayerState.campSlots[1]?.isDamaged &&
      !leftPlayerState.campSlots[1]?.traits?.includes('cannot_restore')) ||
    (restoreMode && restorePlayer === 'left' && leftPlayerState.campSlots[1]?.isDamaged) ||
    (damageColumnMode && gameState.currentTurn !== 'right')
      ? 'border-purple-400 animate-pulse cursor-pointer'
      : leftPlayerState.campSlots[1]?.isDamaged
      ? 'border-red-700'
      : 'border-gray-400'
  }
`}
                  onClick={() => {
                    if (
                      multiRestoreMode &&
                      gameState.currentTurn === 'left' &&
                      leftPlayerState.campSlots[1] &&
                      leftPlayerState.campSlots[1].isDamaged &&
                      !leftPlayerState.campSlots[1].traits?.includes('cannot_restore')
                    ) {
                      // Use applyRestore function
                      applyRestore(leftPlayerState.campSlots[0], 0, false);
                      return; // Exit early to prevent other conditions
                    }
                    if (campRaidMode && raidingPlayer !== 'left' && leftPlayerState.campSlots[1]) {
                      const camp = leftPlayerState.campSlots[1];
                      if (camp.isDamaged) {
                        // If camp is already damaged, destroy it
                        alert('Camp destroyed!');
                        setLeftPlayerState((prev) => ({
                          ...prev,
                          campSlots: prev.campSlots.map((c, i) => (i === 1 ? null : c)),
                        }));
                      } else {
                        // Otherwise, damage it
                        alert('Camp damaged!');
                        setLeftPlayerState((prev) => ({
                          ...prev,
                          campSlots: prev.campSlots.map((c, i) => (i === 1 ? { ...c, isDamaged: true } : c)),
                        }));
                      }
                      // End raid mode
                      setCampRaidMode(false);
                      setRaidingPlayer(null);
                      setRaidMessage('');
                      // Continue to next phase
                      setTimeout(() => {
                        setGameState((prev) => ({
                          ...prev,
                          currentPhase: 'replenish',
                        }));
                      }, 100);
                    } else if (damageColumnMode && gameState.currentTurn !== 'left' && leftPlayerState.campSlots[1]) {
                      // Get the column index (0 for this camp)
                      const columnIndex = 1;

                      // Apply damage to all cards in this column
                      // First, the person cards (indices 0 and 1 for column 0)
                      const frontPerson = leftPlayerState.personSlots[columnIndex * 2];
                      const backPerson = leftPlayerState.personSlots[columnIndex * 2 + 1];

                      // Damage front person if it exists
                      if (frontPerson) {
                        applyDamage(frontPerson, columnIndex * 2, true);
                      }

                      // Damage back person if it exists
                      if (backPerson) {
                        applyDamage(backPerson, columnIndex * 2 + 1, true);
                      }

                      // Damage the camp itself
                      if (leftPlayerState.campSlots[columnIndex]) {
                        applyDamage(leftPlayerState.campSlots[columnIndex], columnIndex, true);
                      }

                      // Reset column damage mode
                      setDamageColumnMode(false);

                      alert(`Damaged all cards in column ${columnIndex + 1}!`);
                    } else if (destroyCampMode && gameState.currentTurn !== 'left' && leftPlayerState.campSlots[1]) {
                      // Handle destroy camp ability
                      alert(`${leftPlayerState.campSlots[1].name} destroyed!`);
                      setLeftPlayerState((prev) => ({
                        ...prev,
                        campSlots: prev.campSlots.map((camp, i) => (i === 1 ? null : camp)),
                      }));
                      // Reset destroy camp mode
                      setDestroyCampMode(false);
                    } else if (
                      damageMode &&
                      gameState.currentTurn !== 'left' &&
                      leftPlayerState.campSlots[1] &&
                      (sniperMode || !leftPlayerState.campSlots[1].isProtected)
                    ) {
                      // Handle damage targeting
                      applyDamage(leftPlayerState.campSlots[1], 1, false);
                    } else if (restoreMode && restorePlayer === 'left' && leftPlayerState.campSlots[1]?.isDamaged) {
                      // Restore the camp
                      setLeftPlayerState((prev) => ({
                        ...prev,
                        campSlots: prev.campSlots.map((camp, i) => (i === 1 ? { ...camp, isDamaged: false } : camp)),
                      }));

                      // Exit restore mode
                      if (setRestoreMode) setRestoreMode(false);
                    } else if (
                      abilityRestoreMode &&
                      gameState.currentTurn === 'left' &&
                      leftPlayerState.campSlots[1]?.isDamaged
                    ) {
                      // Handle restore targeting
                      applyRestore(leftPlayerState.campSlots[1], 1, false);
                    } else if (isInteractable('camp', 'left', 1)) {
                      setSelectedCard(leftPlayerState.campSlots[1]);
                      setSelectedCardLocation({ type: 'camp', index: 1 });
                      setIsAbilityModalOpen(true);
                    }
                  }}
                >
                  <div className="text-white text-center text-xs mt-4">
                    {leftPlayerState.campSlots[1] === null ? (
                      <>
                        Camp 2
                        <br />
                        Destroyed
                      </>
                    ) : (
                      <>
                        {leftPlayerState.campSlots[1]?.name}
                        <br />
                        {leftPlayerState.campSlots[1]?.type}
                        <br />
                        {leftPlayerState.campSlots[1]?.isProtected ? 'Protected' : 'Unprotected'}
                        <br />
                        {leftPlayerState.campSlots[1]?.isDamaged ? 'Damaged (can use abilities)' : 'Not Damaged'}
                        <br />
                        {leftPlayerState.campSlots[1]?.traits?.includes('starts_damaged') ? '(Starts Damaged)' : ''}
                        <br />
                        {leftPlayerState.campSlots[1]?.isReady ? 'Ready' : 'Not Ready'}
                      </>
                    )}
                  </div>
                </div>
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
                  setSacrificePendingDamage={setSacrificePendingDamage}
                  setDamageMode={setDamageMode}
                  setDamageValue={setDamageValue}
                  mimicMode={mimicMode}
                  restorePersonReadyMode={restorePersonReadyMode}
                  multiRestoreMode={multiRestoreMode}
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
                  setSacrificePendingDamage={setSacrificePendingDamage}
                  setDamageMode={setDamageMode}
                  setDamageValue={setDamageValue}
                  mimicMode={mimicMode}
                  restorePersonReadyMode={restorePersonReadyMode}
                  multiRestoreMode={multiRestoreMode}
                />
                <div
                  className={`w-24 h-32 border-2 rounded
  ${
    leftPlayerState.campSlots[2] === null
      ? 'bg-black'
      : leftPlayerState.campSlots[2]?.isDamaged
      ? 'bg-red-900'
      : 'bg-gray-700'
  }
  ${
    (campRaidMode && raidingPlayer !== 'left' && leftPlayerState.campSlots[2]) ||
    (damageMode &&
      gameState.currentTurn !== 'left' &&
      leftPlayerState.campSlots[2] &&
      (sniperMode || !leftPlayerState.campSlots[2]?.isProtected)) ||
    (destroyCampMode && gameState.currentTurn !== 'left' && leftPlayerState.campSlots[2]) ||
    (abilityRestoreMode && gameState.currentTurn === 'left' && leftPlayerState.campSlots[2]?.isDamaged) ||
    (multiRestoreMode &&
      gameState.currentTurn === 'left' &&
      leftPlayerState.campSlots[2]?.isDamaged &&
      !leftPlayerState.campSlots[2]?.traits?.includes('cannot_restore')) ||
    (restoreMode && restorePlayer === 'left' && leftPlayerState.campSlots[2]?.isDamaged) ||
    (damageColumnMode && gameState.currentTurn !== 'right')
      ? 'border-purple-400 animate-pulse cursor-pointer'
      : leftPlayerState.campSlots[2]?.isDamaged
      ? 'border-red-700'
      : 'border-gray-400'
  }
`}
                  onClick={() => {
                    if (
                      multiRestoreMode &&
                      gameState.currentTurn === 'left' &&
                      leftPlayerState.campSlots[2] &&
                      leftPlayerState.campSlots[2].isDamaged &&
                      !leftPlayerState.campSlots[2].traits?.includes('cannot_restore')
                    ) {
                      // Use applyRestore function
                      applyRestore(leftPlayerState.campSlots[0], 0, false);
                      return; // Exit early to prevent other conditions
                    }
                    if (campRaidMode && raidingPlayer !== 'left' && leftPlayerState.campSlots[2]) {
                      const camp = leftPlayerState.campSlots[2];
                      if (camp.isDamaged) {
                        // If camp is already damaged, destroy it
                        alert('Camp destroyed!');
                        setLeftPlayerState((prev) => ({
                          ...prev,
                          campSlots: prev.campSlots.map((c, i) => (i === 2 ? null : c)),
                        }));
                      } else {
                        // Otherwise, damage it
                        alert('Camp damaged!');
                        setLeftPlayerState((prev) => ({
                          ...prev,
                          campSlots: prev.campSlots.map((c, i) => (i === 2 ? { ...c, isDamaged: true } : c)),
                        }));
                      }
                      // End raid mode
                      setCampRaidMode(false);
                      setRaidingPlayer(null);
                      setRaidMessage('');
                      // Continue to next phase
                      setTimeout(() => {
                        setGameState((prev) => ({
                          ...prev,
                          currentPhase: 'replenish',
                        }));
                      }, 100);
                    } else if (damageColumnMode && gameState.currentTurn !== 'left' && leftPlayerState.campSlots[2]) {
                      // Get the column index (0 for this camp)
                      const columnIndex = 2;

                      // Apply damage to all cards in this column
                      // First, the person cards (indices 0 and 1 for column 0)
                      const frontPerson = leftPlayerState.personSlots[columnIndex * 2];
                      const backPerson = leftPlayerState.personSlots[columnIndex * 2 + 1];

                      // Damage front person if it exists
                      if (frontPerson) {
                        applyDamage(frontPerson, columnIndex * 2, true);
                      }

                      // Damage back person if it exists
                      if (backPerson) {
                        applyDamage(backPerson, columnIndex * 2 + 1, true);
                      }

                      // Damage the camp itself
                      if (leftPlayerState.campSlots[columnIndex]) {
                        applyDamage(leftPlayerState.campSlots[columnIndex], columnIndex, true);
                      }

                      // Reset column damage mode
                      setDamageColumnMode(false);

                      alert(`Damaged all cards in column ${columnIndex + 1}!`);
                    } else if (destroyCampMode && gameState.currentTurn !== 'left' && leftPlayerState.campSlots[2]) {
                      // Handle destroy camp ability
                      alert(`${leftPlayerState.campSlots[2].name} destroyed!`);
                      setLeftPlayerState((prev) => ({
                        ...prev,
                        campSlots: prev.campSlots.map((camp, i) => (i === 2 ? null : camp)),
                      }));
                      // Reset destroy camp mode
                      setDestroyCampMode(false);
                    } else if (
                      damageMode &&
                      gameState.currentTurn !== 'left' &&
                      leftPlayerState.campSlots[2] &&
                      (sniperMode || !leftPlayerState.campSlots[2].isProtected)
                    ) {
                      // Handle damage targeting
                      applyDamage(leftPlayerState.campSlots[2], 2, false);
                    } else if (restoreMode && restorePlayer === 'left' && leftPlayerState.campSlots[2]?.isDamaged) {
                      // Restore the camp
                      setLeftPlayerState((prev) => ({
                        ...prev,
                        campSlots: prev.campSlots.map((camp, i) => (i === 2 ? { ...camp, isDamaged: false } : camp)),
                      }));

                      // Exit restore mode
                      if (setRestoreMode) setRestoreMode(false);
                    } else if (
                      abilityRestoreMode &&
                      gameState.currentTurn === 'left' &&
                      leftPlayerState.campSlots[2]?.isDamaged
                    ) {
                      // Handle restore targeting
                      applyRestore(leftPlayerState.campSlots[2], 2, false);
                    } else if (isInteractable('camp', 'left', 2)) {
                      setSelectedCard(leftPlayerState.campSlots[2]);
                      setSelectedCardLocation({ type: 'camp', index: 2 });
                      setIsAbilityModalOpen(true);
                    }
                  }}
                >
                  <div className="text-white text-center text-xs mt-4">
                    {leftPlayerState.campSlots[2] === null ? (
                      <>
                        Camp 3
                        <br />
                        Destroyed
                      </>
                    ) : (
                      <>
                        {leftPlayerState.campSlots[2]?.name}
                        <br />
                        {leftPlayerState.campSlots[2]?.type}
                        <br />
                        {leftPlayerState.campSlots[2]?.isProtected ? 'Protected' : 'Unprotected'}
                        <br />
                        {leftPlayerState.campSlots[2]?.isDamaged ? 'Damaged (can use abilities)' : 'Not Damaged'}
                        <br />
                        {leftPlayerState.campSlots[2]?.traits?.includes('starts_damaged') ? '(Starts Damaged)' : ''}
                        <br />
                        {leftPlayerState.campSlots[2]?.isReady ? 'Ready' : 'Not Ready'}
                      </>
                    )}
                  </div>
                </div>
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
                                  handCards: [...prev.handCards.filter((c) => c.id !== cardToDiscard.card.id), topCard],
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
                              const setPlayerState = sourcePlayer === 'left' ? setLeftPlayerState : setRightPlayerState;

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
                <div className="bg-red-700 text-white font-bold py-2 px-4 rounded-lg animate-pulse">{raidMessage}</div>
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
                        },
                        () => {
                          setRightPlayedEventThisTurn(false);
                          setRightCardsUsedAbility([]);
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
              />
              <EventSlot
                index={1}
                card={rightPlayerState.eventSlots[1]}
                playerState={rightPlayerState}
                setPlayerState={setRightPlayerState}
                player="right"
              />
              <EventSlot
                index={2}
                card={rightPlayerState.eventSlots[2]}
                playerState={rightPlayerState}
                setPlayerState={setRightPlayerState}
                player="right"
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
                />
                <div
                  className={`w-24 h-32 border-2 rounded
  ${
    rightPlayerState.campSlots[0] === null
      ? 'bg-black'
      : rightPlayerState.campSlots[0]?.isDamaged
      ? 'bg-red-900'
      : 'bg-gray-700'
  }
  ${
    (campRaidMode && raidingPlayer !== 'right' && rightPlayerState.campSlots[0]) ||
    (damageMode &&
      gameState.currentTurn !== 'right' &&
      rightPlayerState.campSlots[0] &&
      (sniperMode || !rightPlayerState.campSlots[0]?.isProtected)) ||
    (destroyCampMode && gameState.currentTurn !== 'right' && rightPlayerState.campSlots[0]) ||
    (abilityRestoreMode && gameState.currentTurn === 'right' && rightPlayerState.campSlots[0]?.isDamaged) ||
    (multiRestoreMode &&
      gameState.currentTurn === 'right' &&
      rightPlayerState.campSlots[0]?.isDamaged &&
      !rightPlayerState.campSlots[0]?.traits?.includes('cannot_restore')) ||
    (restoreMode && restorePlayer === 'right' && rightPlayerState.campSlots[0]?.isDamaged) ||
    (damageColumnMode && gameState.currentTurn !== 'left')
      ? 'border-purple-400 animate-pulse cursor-pointer'
      : rightPlayerState.campSlots[0]?.isDamaged
      ? 'border-red-700'
      : 'border-gray-400'
  }
`}
                  onClick={() => {
                    if (
                      multiRestoreMode &&
                      gameState.currentTurn === 'right' &&
                      rightPlayerState.campSlots[0] &&
                      rightPlayerState.campSlots[0].isDamaged &&
                      !rightPlayerState.campSlots[0].traits?.includes('cannot_restore')
                    ) {
                      // Use applyRestore function
                      applyRestore(rightPlayerState.campSlots[0], 0, false);
                      return; // Exit early to prevent other conditions
                    }
                    if (campRaidMode && raidingPlayer !== 'right' && rightPlayerState.campSlots[0]) {
                      const camp = rightPlayerState.campSlots[0];
                      if (camp.isDamaged) {
                        // If camp is already damaged, destroy it
                        alert('Camp destroyed!');
                        setRightPlayerState((prev) => ({
                          ...prev,
                          campSlots: prev.campSlots.map((c, i) => (i === 0 ? null : c)),
                        }));
                      } else {
                        // Otherwise, damage it
                        alert('Camp damaged!');
                        setRightPlayerState((prev) => ({
                          ...prev,
                          campSlots: prev.campSlots.map((c, i) => (i === 0 ? { ...c, isDamaged: true } : c)),
                        }));
                      }
                      // End raid mode
                      setCampRaidMode(false);
                      setRaidingPlayer(null);
                      setRaidMessage('');
                      // Continue to next phase
                      setTimeout(() => {
                        setGameState((prev) => ({
                          ...prev,
                          currentPhase: 'replenish',
                        }));
                      }, 100);
                    } else if (damageColumnMode && gameState.currentTurn !== 'right' && rightPlayerState.campSlots[0]) {
                      // Get the column index (0 for this camp)
                      const columnIndex = 0;

                      // Apply damage to all cards in this column
                      // First, the person cards (indices 0 and 1 for column 0)
                      const frontPerson = rightPlayerState.personSlots[columnIndex * 2];
                      const backPerson = rightPlayerState.personSlots[columnIndex * 2 + 1];

                      // Damage front person if it exists
                      if (frontPerson) {
                        applyDamage(frontPerson, columnIndex * 2, true);
                      }

                      // Damage back person if it exists
                      if (backPerson) {
                        applyDamage(backPerson, columnIndex * 2 + 1, true);
                      }

                      // Damage the camp itself
                      if (rightPlayerState.campSlots[columnIndex]) {
                        applyDamage(rightPlayerState.campSlots[columnIndex], columnIndex, true);
                      }

                      // Reset column damage mode
                      setDamageColumnMode(false);

                      alert(`Damaged all cards in column ${columnIndex + 1}!`);
                    } else if (destroyCampMode && gameState.currentTurn !== 'right' && rightPlayerState.campSlots[0]) {
                      // Handle destroy camp ability
                      alert(`${rightPlayerState.campSlots[0].name} destroyed!`);
                      setRightPlayerState((prev) => ({
                        ...prev,
                        campSlots: prev.campSlots.map((camp, i) => (i === 0 ? null : camp)),
                      }));
                      // Reset destroy camp mode
                      setDestroyCampMode(false);
                    } else if (
                      damageMode &&
                      gameState.currentTurn !== 'right' &&
                      rightPlayerState.campSlots[0] &&
                      (sniperMode || !rightPlayerState.campSlots[0].isProtected)
                    ) {
                      // Handle damage targeting
                      applyDamage(rightPlayerState.campSlots[0], 0, true);
                    } else if (restoreMode && restorePlayer === 'right' && rightPlayerState.campSlots[0]?.isDamaged) {
                      // Restore the camp
                      setRightPlayerState((prev) => ({
                        ...prev,
                        campSlots: prev.campSlots.map((camp, i) => (i === 0 ? { ...camp, isDamaged: false } : camp)),
                      }));

                      // Exit restore mode
                      if (setRestoreMode) setRestoreMode(false);
                    } else if (
                      abilityRestoreMode &&
                      gameState.currentTurn === 'right' &&
                      rightPlayerState.campSlots[0]?.isDamaged
                    ) {
                      // Handle restore targeting
                      applyRestore(rightPlayerState.campSlots[0], 0, true);
                    } else if (isInteractable('camp', 'right', 0)) {
                      setSelectedCard(rightPlayerState.campSlots[0]);
                      setSelectedCardLocation({ type: 'camp', index: 0 });
                      setIsAbilityModalOpen(true);
                    }
                  }}
                >
                  <div className="text-white text-center text-xs mt-4">
                    {rightPlayerState.campSlots[0] === null ? (
                      <>
                        Camp 1
                        <br />
                        Destroyed
                      </>
                    ) : (
                      <>
                        {rightPlayerState.campSlots[0]?.name}
                        <br />
                        {rightPlayerState.campSlots[0]?.type}
                        <br />
                        {rightPlayerState.campSlots[0]?.isProtected ? 'Protected' : 'Unprotected'}
                        <br />
                        {rightPlayerState.campSlots[0]?.isDamaged ? 'Damaged (can use abilities)' : 'Not Damaged'}
                        <br />
                        {rightPlayerState.campSlots[0]?.traits?.includes('starts_damaged') ? '(Starts Damaged)' : ''}
                        <br />
                        {rightPlayerState.campSlots[0]?.isReady ? 'Ready' : 'Not Ready'}
                      </>
                    )}
                  </div>
                </div>
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
                />
                <div
                  className={`w-24 h-32 border-2 rounded
  ${
    rightPlayerState.campSlots[1] === null
      ? 'bg-black'
      : rightPlayerState.campSlots[1]?.isDamaged
      ? 'bg-red-900'
      : 'bg-gray-700'
  }
  ${
    (campRaidMode && raidingPlayer !== 'right' && rightPlayerState.campSlots[1]) ||
    (damageMode &&
      gameState.currentTurn !== 'right' &&
      rightPlayerState.campSlots[1] &&
      (sniperMode || !rightPlayerState.campSlots[1]?.isProtected)) ||
    (destroyCampMode && gameState.currentTurn !== 'right' && rightPlayerState.campSlots[1]) ||
    (abilityRestoreMode && gameState.currentTurn === 'right' && rightPlayerState.campSlots[1]?.isDamaged) ||
    (multiRestoreMode &&
      gameState.currentTurn === 'right' &&
      rightPlayerState.campSlots[1]?.isDamaged &&
      !rightPlayerState.campSlots[1]?.traits?.includes('cannot_restore')) ||
    (restoreMode && restorePlayer === 'right' && rightPlayerState.campSlots[1]?.isDamaged) ||
    (damageColumnMode && gameState.currentTurn !== 'left')
      ? 'border-purple-400 animate-pulse cursor-pointer'
      : rightPlayerState.campSlots[1]?.isDamaged
      ? 'border-red-700'
      : 'border-gray-400'
  }
`}
                  onClick={() => {
                    if (
                      multiRestoreMode &&
                      gameState.currentTurn === 'right' &&
                      rightPlayerState.campSlots[1] &&
                      rightPlayerState.campSlots[1].isDamaged &&
                      !rightPlayerState.campSlots[1].traits?.includes('cannot_restore')
                    ) {
                      // Use applyRestore function
                      applyRestore(rightPlayerState.campSlots[1], 1, false);
                      return; // Exit early to prevent other conditions
                    }
                    if (campRaidMode && raidingPlayer !== 'right' && rightPlayerState.campSlots[1]) {
                      const camp = rightPlayerState.campSlots[1];
                      if (camp.isDamaged) {
                        // If camp is already damaged, destroy it
                        alert('Camp destroyed!');
                        setRightPlayerState((prev) => ({
                          ...prev,
                          campSlots: prev.campSlots.map((c, i) => (i === 1 ? null : c)),
                        }));
                      } else {
                        // Otherwise, damage it
                        alert('Camp damaged!');
                        setRightPlayerState((prev) => ({
                          ...prev,
                          campSlots: prev.campSlots.map((c, i) => (i === 1 ? { ...c, isDamaged: true } : c)),
                        }));
                      }
                      // End raid mode
                      setCampRaidMode(false);
                      setRaidingPlayer(null);
                      setRaidMessage('');
                      // Continue to next phase
                      setTimeout(() => {
                        setGameState((prev) => ({
                          ...prev,
                          currentPhase: 'replenish',
                        }));
                      }, 100);
                    } else if (damageColumnMode && gameState.currentTurn !== 'right' && rightPlayerState.campSlots[1]) {
                      // Get the column index (0 for this camp)
                      const columnIndex = 1;

                      // Apply damage to all cards in this column
                      // First, the person cards (indices 0 and 1 for column 0)
                      const frontPerson = rightPlayerState.personSlots[columnIndex * 2];
                      const backPerson = rightPlayerState.personSlots[columnIndex * 2 + 1];

                      // Damage front person if it exists
                      if (frontPerson) {
                        applyDamage(frontPerson, columnIndex * 2, true);
                      }

                      // Damage back person if it exists
                      if (backPerson) {
                        applyDamage(backPerson, columnIndex * 2 + 1, true);
                      }

                      // Damage the camp itself
                      if (rightPlayerState.campSlots[columnIndex]) {
                        applyDamage(rightPlayerState.campSlots[columnIndex], columnIndex, true);
                      }

                      // Reset column damage mode
                      setDamageColumnMode(false);

                      alert(`Damaged all cards in column ${columnIndex + 1}!`);
                    } else if (destroyCampMode && gameState.currentTurn !== 'right' && rightPlayerState.campSlots[1]) {
                      // Handle destroy camp ability
                      alert(`${rightPlayerState.campSlots[1].name} destroyed!`);
                      setRightPlayerState((prev) => ({
                        ...prev,
                        campSlots: prev.campSlots.map((camp, i) => (i === 1 ? null : camp)),
                      }));
                      // Reset destroy camp mode
                      setDestroyCampMode(false);
                    } else if (
                      damageMode &&
                      gameState.currentTurn !== 'right' &&
                      rightPlayerState.campSlots[1] &&
                      (sniperMode || !rightPlayerState.campSlots[1].isProtected)
                    ) {
                      // Handle damage targeting
                      applyDamage(rightPlayerState.campSlots[1], 1, true);
                    } else if (restoreMode && restorePlayer === 'right' && rightPlayerState.campSlots[1]?.isDamaged) {
                      // Restore the camp
                      setRightPlayerState((prev) => ({
                        ...prev,
                        campSlots: prev.campSlots.map((camp, i) => (i === 1 ? { ...camp, isDamaged: false } : camp)),
                      }));

                      // Exit restore mode
                      if (setRestoreMode) setRestoreMode(false);
                    } else if (
                      abilityRestoreMode &&
                      gameState.currentTurn === 'right' &&
                      rightPlayerState.campSlots[1]?.isDamaged
                    ) {
                      // Handle restore targeting
                      applyRestore(rightPlayerState.campSlots[1], 1, true);
                    } else if (isInteractable('camp', 'right', 1)) {
                      setSelectedCard(rightPlayerState.campSlots[1]);
                      setSelectedCardLocation({ type: 'camp', index: 1 });
                      setIsAbilityModalOpen(true);
                    }
                  }}
                >
                  <div className="text-white text-center text-xs mt-4">
                    {rightPlayerState.campSlots[1] === null ? (
                      <>
                        Camp 2
                        <br />
                        Destroyed
                      </>
                    ) : (
                      <>
                        {rightPlayerState.campSlots[1]?.name}
                        <br />
                        {rightPlayerState.campSlots[1]?.type}
                        <br />
                        {rightPlayerState.campSlots[1]?.isProtected ? 'Protected' : 'Unprotected'}
                        <br />
                        {rightPlayerState.campSlots[1]?.isDamaged ? 'Damaged (can use abilities)' : 'Not Damaged'}
                        <br />
                        {rightPlayerState.campSlots[1]?.traits?.includes('starts_damaged') ? '(Starts Damaged)' : ''}
                        <br />
                        {rightPlayerState.campSlots[1]?.isReady ? 'Ready' : 'Not Ready'}
                      </>
                    )}
                  </div>
                </div>
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
                />
                <div
                  className={`w-24 h-32 border-2 rounded
  ${
    rightPlayerState.campSlots[2] === null
      ? 'bg-black'
      : rightPlayerState.campSlots[2]?.isDamaged
      ? 'bg-red-900'
      : 'bg-gray-700'
  }
  ${
    (campRaidMode && raidingPlayer !== 'right' && rightPlayerState.campSlots[2]) ||
    (damageMode &&
      gameState.currentTurn !== 'right' &&
      rightPlayerState.campSlots[2] &&
      (sniperMode || !rightPlayerState.campSlots[2]?.isProtected)) ||
    (destroyCampMode && gameState.currentTurn !== 'right' && rightPlayerState.campSlots[2]) ||
    (abilityRestoreMode && gameState.currentTurn === 'right' && rightPlayerState.campSlots[2]?.isDamaged) ||
    (multiRestoreMode &&
      gameState.currentTurn === 'right' &&
      rightPlayerState.campSlots[2]?.isDamaged &&
      !rightPlayerState.campSlots[2]?.traits?.includes('cannot_restore')) ||
    (restoreMode && restorePlayer === 'right' && rightPlayerState.campSlots[2]?.isDamaged) ||
    (damageColumnMode && gameState.currentTurn !== 'left')
      ? 'border-purple-400 animate-pulse cursor-pointer'
      : rightPlayerState.campSlots[2]?.isDamaged
      ? 'border-red-700'
      : 'border-gray-400'
  }
`}
                  onClick={() => {
                    if (
                      multiRestoreMode &&
                      gameState.currentTurn === 'right' &&
                      rightPlayerState.campSlots[2] &&
                      rightPlayerState.campSlots[2].isDamaged &&
                      !rightPlayerState.campSlots[2].traits?.includes('cannot_restore')
                    ) {
                      // Use applyRestore function
                      applyRestore(rightPlayerState.campSlots[2], 2, false);
                      return; // Exit early to prevent other conditions
                    }
                    if (campRaidMode && raidingPlayer !== 'right' && rightPlayerState.campSlots[2]) {
                      const camp = rightPlayerState.campSlots[2];
                      if (camp.isDamaged) {
                        // If camp is already damaged, destroy it
                        alert('Camp destroyed!');
                        setRightPlayerState((prev) => ({
                          ...prev,
                          campSlots: prev.campSlots.map((c, i) => (i === 2 ? null : c)),
                        }));
                      } else {
                        // Otherwise, damage it
                        alert('Camp damaged!');
                        setRightPlayerState((prev) => ({
                          ...prev,
                          campSlots: prev.campSlots.map((c, i) => (i === 2 ? { ...c, isDamaged: true } : c)),
                        }));
                      }
                      // End raid mode
                      setCampRaidMode(false);
                      setRaidingPlayer(null);
                      setRaidMessage('');
                      // Continue to next phase
                      setTimeout(() => {
                        setGameState((prev) => ({
                          ...prev,
                          currentPhase: 'replenish',
                        }));
                      }, 100);
                    } else if (damageColumnMode && gameState.currentTurn !== 'right' && rightPlayerState.campSlots[2]) {
                      // Get the column index for this camp
                      const columnIndex = 2;

                      // Apply damage to all cards in this column
                      // First, the person cards
                      const frontPerson = rightPlayerState.personSlots[columnIndex * 2];
                      const backPerson = rightPlayerState.personSlots[columnIndex * 2 + 1];

                      // Damage front person if it exists
                      if (frontPerson) {
                        applyDamage(frontPerson, columnIndex * 2, true);
                      }

                      // Damage back person if it exists
                      if (backPerson) {
                        applyDamage(backPerson, columnIndex * 2 + 1, true);
                      }

                      // Damage the camp itself
                      if (rightPlayerState.campSlots[columnIndex]) {
                        applyDamage(rightPlayerState.campSlots[columnIndex], columnIndex, true);
                      }

                      // Reset column damage mode
                      setDamageColumnMode(false);

                      alert(`Damaged all cards in column ${columnIndex + 1}!`);
                    } else if (destroyCampMode && gameState.currentTurn !== 'right' && rightPlayerState.campSlots[2]) {
                      // Handle destroy camp ability
                      alert(`${rightPlayerState.campSlots[2].name} destroyed!`);
                      setRightPlayerState((prev) => ({
                        ...prev,
                        campSlots: prev.campSlots.map((camp, i) => (i === 2 ? null : camp)),
                      }));
                      // Reset destroy camp mode
                      setDestroyCampMode(false);
                    } else if (
                      damageMode &&
                      gameState.currentTurn !== 'right' &&
                      rightPlayerState.campSlots[2] &&
                      (sniperMode || !rightPlayerState.campSlots[2].isProtected)
                    ) {
                      // Handle damage targeting
                      applyDamage(rightPlayerState.campSlots[2], 2, true);
                    } else if (restoreMode && restorePlayer === 'right' && rightPlayerState.campSlots[2]?.isDamaged) {
                      // Restore the camp
                      setRightPlayerState((prev) => ({
                        ...prev,
                        campSlots: prev.campSlots.map((camp, i) => (i === 2 ? { ...camp, isDamaged: false } : camp)),
                      }));

                      // Exit restore mode
                      if (setRestoreMode) setRestoreMode(false);
                    } else if (
                      abilityRestoreMode &&
                      gameState.currentTurn === 'right' &&
                      rightPlayerState.campSlots[2]?.isDamaged
                    ) {
                      // Handle restore targeting
                      applyRestore(rightPlayerState.campSlots[2], 2, true);
                    } else if (isInteractable('camp', 'right', 2)) {
                      setSelectedCard(rightPlayerState.campSlots[2]);
                      setSelectedCardLocation({ type: 'camp', index: 2 });
                      setIsAbilityModalOpen(true);
                    }
                  }}
                >
                  <div className="text-white text-center text-xs mt-4">
                    {rightPlayerState.campSlots[2] === null ? (
                      <>
                        Camp 3
                        <br />
                        Destroyed
                      </>
                    ) : (
                      <>
                        {rightPlayerState.campSlots[2]?.name}
                        <br />
                        {rightPlayerState.campSlots[2]?.type}
                        <br />
                        {rightPlayerState.campSlots[2]?.isProtected ? 'Protected' : 'Unprotected'}
                        <br />
                        {rightPlayerState.campSlots[2]?.isDamaged ? 'Damaged (can use abilities)' : 'Not Damaged'}
                        <br />
                        {rightPlayerState.campSlots[2]?.traits?.includes('starts_damaged') ? '(Starts Damaged)' : ''}
                        <br />
                        {rightPlayerState.campSlots[2]?.isReady ? 'Ready' : 'Not Ready'}
                      </>
                    )}
                  </div>
                </div>
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
  );
};

export default GameBoard;
