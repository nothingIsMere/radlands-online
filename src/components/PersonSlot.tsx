'use client';
import React from 'react';
import { Card, PlayerState } from '@/types/game';
import { hasCardTrait, hasKarliBlazeTrait, hasArgoYeskyTrait } from '@/utils/gameUtils';
import { handleSacrificeEffect } from '@/utils/abilityUtils';
import { updateProtectionStatus } from '@/utils/protectionUtils';
import { useAbility } from '../../src/components/AbilityManager';
import { AbilityService } from '../../services/abilityService';

const isAbilityActive = AbilityService.isAbilityActive.bind(AbilityService);
const completeAbility = AbilityService.completeAbility.bind(AbilityService);

interface PersonSlotProps {
  index: number;
  card: Card | null;
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  punkPlacementMode?: boolean;
  punkCardToPlace?: Card | null;
  setPunkPlacementMode?: (value: boolean) => void;
  setPunkCardToPlace?: (value: Card | null) => void;
  restoreMode?: boolean;
  mimicMode?: boolean;
  restorePlayer?: 'left' | 'right' | null;
  setRestoreMode?: (value: boolean) => void;
  injureMode?: boolean;
  damageColumnMode?: boolean;
  restorePersonReadyMode?: boolean;
  checkAbilityEnabled?: (card: Card) => boolean; // Function to check if an ability can be used
  setInjureMode?: (value: boolean) => void;
  damageMode?: boolean;
  sacrificeMode?: boolean;
  setSacrificeMode?: (value: boolean) => void;
  sacrificePendingDamage?: boolean;
  setSacrificePendingDamage?: (value: boolean) => void;
  setDamageMode?: (value: boolean) => void;
  setDamageValue?: (value: number) => void;
  sniperMode?: boolean;
  returnToHandMode?: boolean;
  setReturnToHandMode?: (value: boolean) => void;
  applyDamage?: (card: Card, slotIndex: number, isRightPlayer: boolean) => void;
  abilityRestoreMode?: boolean;
  applyRestore?: (card: Card, slotIndex: number, isRightPlayer: boolean) => void;
  updateProtectedStatus: (
    personSlots: (Card | null)[],
    campSlots: (Card | null)[]
  ) => { personSlots: (Card | null)[]; campSlots: (Card | null)[] };
  destroyCard: (card: Card, slotIndex: number, isRightPlayer: boolean) => void;
  gameState: GameState;
  player?: 'left' | 'right';
  isInteractable?: (
    element: 'person' | 'event' | 'camp',
    elementPlayer: 'left' | 'right',
    slotIndex: number
  ) => boolean;
  // New props for ability modal
  setSelectedCard?: (card: Card | null) => void;
  setSelectedCardLocation?: (location: { type: 'person' | 'camp'; index: number } | null) => void;
  setIsAbilityModalOpen?: (isOpen: boolean) => void;
  destroyPersonMode?: boolean;
  multiRestoreMode?: boolean;
  sacrificeEffect?: 'draw' | 'water' | 'restore' | null;
  sacrificeSource?: Card | null;
  setSacrificeEffect?: (effect: 'draw' | 'water' | 'restore' | null) => void;
  setSacrificeSource?: (card: Card | null) => void;
  drawDeck?: Card[];
  setDrawDeck?: (updater: (prevDeck: Card[]) => Card[]) => void;
  setRestorePlayer?: (player: 'left' | 'right' | null) => void;
  opponentChoiceDamageMode?: boolean;
  setOpponentChoiceDamageMode?: (mode: boolean) => void;
  opponentChoiceDamageSource?: Card | null;
  setOpponentChoiceDamageSource?: (card: Card | null) => void;
  opponentChoiceDamageValue?: number;
  setOpponentChoiceDamageValue?: (value: number) => void;
  octagonSacrificeMode?: boolean;
  octagonOpponentSacrificeMode?: boolean;
  handleOctagonSacrifice?: (person: Card, slotIndex: number, isRightPlayer: boolean) => void;
  handleOctagonOpponentSacrifice?: (person: Card, slotIndex: number, isRightPlayer: boolean) => void;
  constructionYardSelectingPerson?: boolean;
  constructionYardSelectingDestination?: boolean;
  constructionYardSelectedPerson?: {
    card: Card;
    slotIndex: number;
    player: 'left' | 'right';
  } | null;
  onPersonSelected?: (card: Card, slotIndex: number, player: 'left' | 'right') => void;
  onDestinationSelected?: (slotIndex: number, player: 'left' | 'right') => void;
}

const PersonSlot = ({
  index,
  card,
  playerState,
  setPlayerState,
  punkPlacementMode = false,
  punkCardToPlace = null,
  setPunkPlacementMode,
  setPunkCardToPlace,
  restoreMode = false,
  restorePlayer = null,
  setRestoreMode,
  sacrificeMode = false,
  setSacrificeMode,
  sacrificePendingDamage,
  setSacrificePendingDamage,
  setDamageMode,
  injureMode = false,
  setInjureMode,
  damageMode = false,
  damageColumnMode = false,
  applyDamage,
  checkAbilityEnabled = () => true, // Default to allowing all abilities
  abilityRestoreMode = false,
  applyRestore,
  destroyPersonMode = false,
  sniperMode = false,
  returnToHandMode = false,
  setReturnToHandMode,
  updateProtectedStatus,
  destroyCard,
  gameState,
  player = 'left',
  isInteractable = () => true, // Default to always interactable if not provided
  setSelectedCard,
  setSelectedCardLocation,
  setIsAbilityModalOpen,
  mimicMode = false,
  restorePersonReadyMode = false,
  multiRestoreMode = false,
  sacrificeEffect = null,
  sacrificeSource = null,
  setSacrificeEffect,
  setSacrificeSource,
  drawDeck = [],
  setDrawDeck,
  setRestorePlayer,
  opponentChoiceDamageMode = false,
  setDamageSource,
  setDamageValue,
  setSniperMode,
  anyCardDamageMode,
  setAnyCardDamageMode,
  octagonSacrificeMode,
  octagonOpponentSacrificeMode,
  handleOctagonSacrifice,
  handleOctagonOpponentSacrifice,
  constructionYardSelectingPerson,
  constructionYardSelectingDestination,
  constructionYardSelectedPerson,
  onPersonSelected,
  onDestinationSelected,
}: PersonSlotProps) => {
  const { isAbilityActive, completeAbility } = useAbility();
  React.useEffect(() => {
    if (restoreMode && card?.name === 'Repair Bot') {
      console.log('Repair Bot in restore mode:', {
        index,
        cardName: card.name,
        isDamaged: card.isDamaged,
        player,
        restorePlayer,
        isInteractable: isInteractable('person', player, index),
      });
    }
  }, [restoreMode, card, player, restorePlayer, index, isInteractable]);

  const handlePunkPlacement = () => {
    if (punkPlacementMode && !card && punkCardToPlace) {
      setPlayerState((prev) => {
        const punkShouldBeReady = true; // For testing purposes

        return {
          ...prev,
          personSlots: prev.personSlots.map((slot, i) =>
            i === index
              ? {
                  id: punkCardToPlace.id,
                  name: 'Punk',
                  type: 'person',
                  isPunk: true,
                  isReady: punkShouldBeReady,
                }
              : slot
          ),
          peoplePlayedThisTurn: prev.peoplePlayedThisTurn + 1,
        };
      });

      if (setPunkPlacementMode) setPunkPlacementMode(false);
      if (setPunkCardToPlace) setPunkCardToPlace(null);
      return true;
    }
    return false;
  };

  const handleCardAbilityActivation = () => {
    if (
      gameState.currentPhase === 'actions' &&
      player === gameState.currentTurn &&
      card &&
      card.isReady &&
      card.abilities?.length > 0
    ) {
      // Check if ability can be used
      if (checkAbilityEnabled && !checkAbilityEnabled(card)) {
        return true; // Handled but ability check failed
      }

      // Handle Argo Yesky effect
      let cardToUse = card;
      const hasArgoYeskyEffect = hasArgoYeskyTrait(playerState);

      if (hasArgoYeskyEffect) {
        const argoYeskyAbility = {
          effect: 'Do 1 damage to an unprotected enemy card (via Argo Yesky)',
          cost: 1,
          type: 'damage',
          target: 'any',
          value: 1,
        };

        const newAbilities =
          cardToUse.abilities?.length > 0 ? [...cardToUse.abilities, argoYeskyAbility] : [argoYeskyAbility];

        cardToUse = { ...card, abilities: newAbilities };
      }

      // Open ability modal
      if (setSelectedCard) setSelectedCard(cardToUse);
      if (setSelectedCardLocation) setSelectedCardLocation({ type: 'person', index: index });
      if (setIsAbilityModalOpen) setIsAbilityModalOpen(true);

      return true;
    }
    return false;
  };

  const handleMultiRestore = () => {
    if (multiRestoreMode && card?.isDamaged && player === gameState.currentTurn) {
      if (applyRestore) {
        applyRestore(card, index, player === 'right');
      }
      return true;
    }
    return false;
  };

  const handleConstructionYard = () => {
    // Construction Yard person selection
    if (constructionYardSelectingPerson && card && onPersonSelected) {
      onPersonSelected(card, index, player);
      return true;
    }

    // Construction Yard destination selection
    if (constructionYardSelectingDestination && onDestinationSelected) {
      onDestinationSelected(index, player);
      return true;
    }

    return false;
  };

  const processOctagonSacrifice = () => {
    if (octagonSacrificeMode && handleOctagonSacrifice) {
      handleOctagonSacrifice(card, index, player === 'right');
      return true;
    }

    if (octagonOpponentSacrificeMode && handleOctagonOpponentSacrifice) {
      handleOctagonOpponentSacrifice(card, index, player === 'right');
      return true;
    }

    return false;
  };

  const handleDamageAndTargeting = () => {
    if (opponentChoiceDamageMode && gameState.currentTurn !== player && card) {
      if (applyDamage) {
        applyDamage(card, index, player === 'right');
      }
      return true;
    }

    if (damageMode && card && (sniperMode || !card.isProtected)) {
      applyDamage(card, index, player === 'right');
      return true;
    }

    return false;
  };

  const handleRestoreTargeting = () => {
    console.log('Checking restore targeting conditions:', {
      restoreMode,
      isDamaged: card?.isDamaged,
      player,
      restorePlayer,
      shouldRestore: restoreMode && card?.isDamaged && player === restorePlayer,
    });

    if (restoreMode && card?.isDamaged && player === restorePlayer) {
      console.log(`Restoring ${card.name}`);
    }
    if (restorePersonReadyMode && player === gameState.currentTurn && card?.isDamaged) {
      applyRestore(card, index, player === 'right');
      return true;
    }

    if (abilityRestoreMode && card && card.isDamaged) {
      applyRestore(card, index, player === 'right');
      return true;
    }

    if (restoreMode && card?.isDamaged && player === restorePlayer) {
      setPlayerState((prev) => ({
        ...prev,
        personSlots: prev.personSlots.map((slot, i) =>
          i === index ? { ...slot, isDamaged: false, isReady: false } : slot
        ),
      }));
      if (setRestoreMode) setRestoreMode(false);

      // Reset restore source index
      const gameBoard = document.getElementById('game-board');
      if (gameBoard && (gameBoard as any).setRestoreSourceIndex) {
        (gameBoard as any).setRestoreSourceIndex(undefined);
      }
      return true;
    }

    return false;
  };

  const handleOtherActions = () => {
    if (injureMode && card && !card.isProtected) {
      const isOpponent = player !== gameState.currentTurn;
      // Only proceed if this is an opponent's card
      if (isOpponent) {
        if (card.isPunk || card.isDamaged) {
          alert(`${card.isPunk ? 'Punk' : 'Damaged card'} destroyed!`);
          destroyCard(card, index, player === 'right');
        } else {
          setPlayerState((prev) => ({
            ...prev,
            personSlots: prev.personSlots.map((slot, i) =>
              i === index ? { ...slot, isDamaged: true, isReady: false } : slot
            ),
          }));
        }
      } else {
        console.log('Cannot injure your own card:', card.name);
      }

      // Reset injure mode
      if (setInjureMode) {
        console.log('Setting injureMode to false');
        setInjureMode(false);
      }

      // Make sure the ability is completed
      try {
        console.log('Trying to complete ability using AbilityService');
        // Use the imported AbilityService directly
        if (AbilityService && AbilityService.isAbilityActive && AbilityService.isAbilityActive()) {
          console.log('AbilityService.isAbilityActive() returned true');
          AbilityService.completeAbility();
          console.log('AbilityService.completeAbility() called successfully');
        } else {
          console.log('AbilityService not available or ability not active');
        }
      } catch (error) {
        console.error('Error accessing AbilityService:', error);
      }

      return true;
    }

    if (destroyPersonMode && card && !card.isProtected) {
      alert(`${card.name} was destroyed!`);
      destroyCard(card, index, player === 'right');

      // Reset destroy person mode
      if (typeof window !== 'undefined') {
        const gameBoard = document.getElementById('game-board');
        if (gameBoard && (gameBoard as any).setDestroyPersonMode) {
          (gameBoard as any).setDestroyPersonMode(false);
        }
      }
      return true;
    }

    if (returnToHandMode && card && player === gameState.currentTurn) {
      handleReturnToHand();
      return true;
    }

    if (sacrificeMode && card && player === gameState.currentTurn) {
      handleSacrifice();
      return true;
    }

    if (mimicMode && card) {
      handleMimic();
      return true;
    }

    return false;
  };

  // Helper functions for the above handlers
  const handleReturnToHand = () => {
    setPlayerState((prev) => {
      const updatedHandCards = [...prev.handCards, card];
      const updatedPersonSlots = prev.personSlots.map((slot, i) => (i === index ? null : slot));
      const columnIndex = Math.floor(index / 2);
      const { personSlots, campSlots } = updateProtectedStatus(updatedPersonSlots, prev.campSlots, columnIndex);

      return {
        ...prev,
        handCards: updatedHandCards,
        personSlots,
        campSlots,
      };
    });

    if (setReturnToHandMode) setReturnToHandMode(false);
    alert(`${card.name} returned to your hand!`);
  };

  const handleSacrifice = () => {
    // Destroy the card
    destroyCard(card, index, player === 'right');

    // Handle sacrifice effects
    if (sacrificePendingDamage) {
      setSacrificePendingDamage(false);
      setDamageMode(true);
      setDamageValue(1);
      alert('Now select an enemy card to damage');
    } else if (sacrificeEffect === 'draw') {
      handleSacrificeDrawEffect();
    } else if (sacrificeEffect === 'water') {
      setPlayerState((prev) => ({
        ...prev,
        waterCount: prev.waterCount + 1,
      }));
      alert(`Sacrificed ${card.name} and gained 1 water`);
    } else if (sacrificeEffect === 'restore') {
      if (setRestoreMode) {
        setRestoreMode(true);
        if (setRestorePlayer) {
          setRestorePlayer(player);
        }
        alert(`Sacrificed ${card.name}. Now select a damaged card to restore.`);
      }
    }

    // Reset sacrifice mode
    setSacrificeMode(false);
    if (setSacrificeEffect) setSacrificeEffect(null);
    if (setSacrificeSource) setSacrificeSource(null);
  };

  const handleSacrificeDrawEffect = () => {
    if (drawDeck && drawDeck.length > 0 && setDrawDeck) {
      const drawnCard = drawDeck[drawDeck.length - 1];
      setPlayerState((prev) => ({
        ...prev,
        handCards: [...prev.handCards, drawnCard],
      }));
      setDrawDeck((prev) => prev.slice(0, -1));
      alert(`Sacrificed ${card.name} and drew a card: ${drawnCard.name}`);
    } else {
      alert(`Sacrificed ${card.name}, but couldn't draw a card.`);
    }
  };

  const handleMimic = () => {
    alert(`Mimicking ${card.name}'s ability!`);

    if (card.abilities && card.abilities.length > 0) {
      if (setSelectedCard) setSelectedCard(card);
      if (setSelectedCardLocation) setSelectedCardLocation({ type: 'person', index });
      if (setIsAbilityModalOpen) setIsAbilityModalOpen(true);
    } else {
      alert('This card has no abilities to mimic!');
    }
  };
  return (
    <div
      className={`w-24 h-32 border-2 ${
        ((punkPlacementMode && !card) ||
          (restoreMode && card?.isDamaged && player === restorePlayer) ||
          (restorePersonReadyMode && player === gameState.currentTurn && card?.isDamaged) ||
          (injureMode && card && !card.isProtected) ||
          (multiRestoreMode && player === gameState.currentTurn && card?.isDamaged) ||
          (destroyPersonMode && card) ||
          (damageMode && card) ||
          (sacrificeMode && player === gameState.currentTurn && card) ||
          (damageColumnMode && player !== gameState.currentTurn) ||
          (abilityRestoreMode && card?.isDamaged) ||
          (returnToHandMode && card && player === gameState.currentTurn) ||
          (mimicMode && card) ||
          (damageMode && anyCardDamageMode && card && (sniperMode || !card.isProtected)) ||
          (opponentChoiceDamageMode && gameState.currentTurn !== player && card) ||
          // Construction Yard conditions
          (constructionYardSelectingPerson && card) ||
          (constructionYardSelectingDestination && constructionYardSelectedPerson?.player === player)) &&
        isInteractable('person', player, index)
          ? 'border-purple-400 animate-pulse cursor-pointer'
          : 'border-gray-400'
      } rounded bg-gray-700 mb-4`}
      onClick={() => {
        // Only proceed if interaction is allowed
        if (!isInteractable('person', player, index)) return;

        // Try each handler in sequence, stopping when one succeeds
        if (handleConstructionYard()) return;
        if (handleMultiRestore()) return;
        if (handlePunkPlacement()) return;
        if (processOctagonSacrifice()) return;
        if (handleDamageAndTargeting()) return;
        if (handleRestoreTargeting()) return;
        if (handleOtherActions()) return;
        if (handleCardAbilityActivation()) return;
      }}
      onDragOver={(e) => {
        e.preventDefault();

        // Only show Oasis feedback for empty slots during current player's turn
        if (!card && gameState.currentTurn === player) {
          // Get the column of this slot
          const columnIndex = Math.floor(index / 2);

          // Check for Oasis in this column
          const hasOasis =
            playerState.campSlots[columnIndex] &&
            playerState.campSlots[columnIndex]?.traits?.includes('discount_column');

          // Check if column is empty of people
          const frontRowIndex = columnIndex * 2;
          const backRowIndex = frontRowIndex + 1;
          const columnIsEmpty = !playerState.personSlots[frontRowIndex] && !playerState.personSlots[backRowIndex];

          // If Oasis discount would apply, show visual feedback
          if (hasOasis && columnIsEmpty) {
            e.currentTarget.classList.add('border-green-500');
            e.currentTarget.classList.add('animate-pulse');

            // Add a data attribute for tooltip (optional)
            e.currentTarget.setAttribute('title', 'Oasis discount: -1 water');
          }
        }
      }}
      onDragLeave={(e) => {
        // Remove Oasis discount visual feedback
        e.currentTarget.classList.remove('border-green-500');
        e.currentTarget.classList.remove('animate-pulse');
        e.currentTarget.removeAttribute('title');
      }}
      onDragStart={(e) => {
        // Only allow dragging if in returnToHandMode and the card belongs to current player
        if (card && returnToHandMode && player === gameState.currentTurn) {
          e.dataTransfer.setData('cardId', card.id);
          e.dataTransfer.setData('sourceType', 'personSlot');
          e.dataTransfer.setData('sourceIndex', index.toString());
        } else if (card) {
          // Prevent drag for cards not in returnToHandMode
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }}
      draggable={card && returnToHandMode && player === gameState.currentTurn ? 'true' : 'false'}
      onDrop={(e) => {
        e.preventDefault();
        // Only allow drops if the element is interactable
        if (!isInteractable('person', player, index)) return;

        const cardId = e.dataTransfer.getData('cardId');
        const draggedCard = playerState.handCards.find((card) => card.id === cardId);

        if (draggedCard && draggedCard.type === 'person' && !card) {
          // Get the column index from the slot index
          const columnIndex = Math.floor(index / 2);

          // Check if this card has the free_in_destroyed_camp trait and is being played in a destroyed camp's column
          let playCost = draggedCard.playCost || 0;
          let freePlay = false;

          // Free play in destroyed camp check
          if (draggedCard.traits?.includes('free_in_destroyed_camp')) {
            // Check if the current column has a destroyed camp (null)
            const campDestroyed = playerState.campSlots[columnIndex] === null;

            if (campDestroyed) {
              playCost = 0;
              freePlay = true;
            }
          }

          // Oasis discount logic - apply only if not already free
          if (!freePlay) {
            // Check if there's an Oasis camp in this column
            const hasOasis =
              playerState.campSlots[columnIndex] &&
              playerState.campSlots[columnIndex]?.traits?.includes('discount_column');

            // Check if column is empty of people
            const frontRowIndex = columnIndex * 2;
            const backRowIndex = frontRowIndex + 1;
            const columnIsEmpty = !playerState.personSlots[frontRowIndex] && !playerState.personSlots[backRowIndex];

            // Apply Oasis discount if both conditions are met
            if (hasOasis && columnIsEmpty) {
              // Reduce cost by 1, but never below 0
              playCost = Math.max(0, playCost - 1);
              // Show message about the discount
              setTimeout(() => alert(`Oasis discount applied! Cost reduced by 1 water.`), 100);
            }
          }

          if (playerState.waterCount < playCost) {
            alert(`Not enough water! This card costs ${playCost} water to play.`);
            return;
          }

          setPlayerState((prev) => {
            // Use the new helper function to check for Karli Blaze's trait
            const hasKarliEffect = hasKarliBlazeTrait(prev);

            // Determine if the card should start ready based on traits or Karli Blaze
            const shouldStartReady = hasCardTrait(draggedCard, 'start_ready') || hasKarliEffect;

            const updatedSlots = prev.personSlots.map((slot, i) =>
              i === index ? { ...draggedCard, isReady: shouldStartReady } : slot
            );

            // Calculate the column index from the slot index
            const columnIndex = Math.floor(index / 2);

            // Pass the column index to updateProtectedStatus
            const { personSlots, campSlots } = updateProtectionStatus(updatedSlots, prev.campSlots, columnIndex);

            return {
              ...prev,
              personSlots,
              campSlots,
              waterCount: prev.waterCount - playCost, // Deduct water cost (will be 0 for free plays or fully discounted)
              handCards: prev.handCards.filter((card) => card.id !== cardId),
              peoplePlayedThisTurn: prev.peoplePlayedThisTurn + 1,
            };
          });

          // Handle card entry traits
          if (draggedCard.traits?.includes('gain_punk_on_entry')) {
            // Get a reference to the needed functions and state
            const gameBoard = document.getElementById('game-board');

            if (gameBoard && gameBoard.punkEffect) {
              // Call the punk effect function defined in the gameBoard
              gameBoard.punkEffect(player);
              alert(`${draggedCard.name} entered play: Gain a punk!`);
            }
          }

          if (draggedCard.traits?.includes('restore_on_entry')) {
            // Get a reference to the needed functions and state
            const gameBoard = document.getElementById('game-board');

            if (gameBoard && gameBoard.restoreEffect) {
              // Call the restore effect function defined in the gameBoard with this card's index
              gameBoard.restoreEffect(player, index);
              alert(`${draggedCard.name} entered play: Restore a damaged card!`);
            }
          }

          if (draggedCard.traits?.includes('draw_and_damage_on_entry')) {
            // Get a reference to the needed functions and state
            const gameBoard = document.getElementById('game-board');

            if (gameBoard && gameBoard.drawAndDamageEffect) {
              // Call the draw and damage effect function defined in the gameBoard
              gameBoard.drawAndDamageEffect(player, index);
              alert(`${draggedCard.name} entered play: Draw 1 card and damage this card!`);
            }
          }

          if (draggedCard.traits?.includes('delay_events_on_entry')) {
            // Get a reference to the needed functions and state
            const gameBoard = document.getElementById('game-board');

            if (gameBoard && gameBoard.delayEventsEffect) {
              // Call the delay events effect function defined in the gameBoard
              const opponentPlayer = player === 'left' ? 'right' : 'left';
              gameBoard.delayEventsEffect(opponentPlayer);
              // The alerts will be handled within the delayEventsEffect function
            }
          }
        }
      }}
    >
      {card ? (
        <div
          className={`text-white text-center text-xs mt-4 
    ${
      card.isDamaged
        ? 'border-4 border-red-700 bg-red-900'
        : card.isReady
        ? 'border-2 border-green-500'
        : 'border-2 border-red-500'
    }
    ${
      // Only add pulse if it's NOT a non-damaged Repair Bot in restore mode
      card.name === 'Repair Bot' && !card.isDamaged && restoreMode
        ? '' // No animation for undamaged Repair Bot
        : (card.abilities?.length > 0 ||
            // Add pulse if Argo Yesky is in play (giving all cards damage ability)
            playerState.personSlots.some((slot) => slot?.name === 'Argo Yesky' && !slot.isDamaged)) &&
          card.isReady &&
          gameState.currentPhase === 'actions' &&
          player === gameState.currentTurn
        ? 'animate-pulse cursor-pointer'
        : ''
    }`}
          draggable="true"
        >
          {card.isPunk ? (
            'Punk'
          ) : (
            <>
              {card.name}
              <br />
              {card.type}
              <br />
              {card.id}
              <br />
              {card.isReady ? 'Ready' : 'Not Ready'}
              <br />
              {card.isProtected ? 'Protected' : 'Unprotected'}
              {card.abilities?.length > 0 && (
                <>
                  <br />
                  Has Ability
                </>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="text-white text-center mt-12">Person {index + 1}</div>
      )}
    </div>
  );
};

export default PersonSlot;
