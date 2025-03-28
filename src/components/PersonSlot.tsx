'use client';
import React from 'react';
import { Card, PlayerState } from '@/types/game';
import { hasCardTrait, hasKarliBlazeTrait, hasArgoYeskyTrait } from '@/utils/gameUtils';
import { handleSacrificeEffect } from '@/utils/abilityUtils';
import { updateProtectionStatus } from '@/utils/protectionUtils';

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
        // Construction Yard person selection (must be before all other card-specific conditions)
        if (constructionYardSelectingPerson && card && isInteractable('person', player, index) && onPersonSelected) {
          onPersonSelected(card, index, player);
          return;
        }

        // Construction Yard destination selection (must handle both empty and occupied slots)
        if (constructionYardSelectingDestination && isInteractable('person', player, index) && onDestinationSelected) {
          onDestinationSelected(index, player);
          return;
        }
        if (multiRestoreMode && card?.isDamaged && player === gameState.currentTurn) {
          // Use the proper applyRestore function that was passed as a prop
          if (applyRestore) {
            applyRestore(card, index, player === 'right');
          }
          return; //
        }
        // Only allow interaction if the element is interactable
        if (!isInteractable('person', player, index)) return;

        if (punkPlacementMode && !card && punkCardToPlace) {
          setPlayerState((prev) => {
            // For testing purposes, always make punks enter Ready regardless of Argo Yesky
            const punkShouldBeReady = true; // Always true for testing

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
        } else if (octagonSacrificeMode && isInteractable('person', player, index) && handleOctagonSacrifice) {
          // Handle the current player sacrificing their person
          handleOctagonSacrifice(card, index, player === 'right');
        } else if (
          octagonOpponentSacrificeMode &&
          isInteractable('person', player, index) &&
          handleOctagonOpponentSacrifice
        ) {
          // Handle the opponent sacrificing their person
          handleOctagonOpponentSacrifice(card, index, player === 'right');
        } else if (opponentChoiceDamageMode && gameState.currentTurn !== player && card) {
          // Apply damage to the card
          if (applyDamage) {
            applyDamage(card, index, player === 'right');
          }

          // Reset the opponent choice mode is handled in applyDamage function
          return;
        } else if (octagonSacrificeMode && isInteractable('person', player, index)) {
          // Handle the current player sacrificing their person
          handleOctagonSacrifice(card, index, player === 'right');
        } else if (octagonOpponentSacrificeMode && isInteractable('person', player, index)) {
          // Handle the opponent sacrificing their person
          handleOctagonOpponentSacrifice(card, index, player === 'right');
        } else if (sacrificeMode && card && player === gameState.currentTurn) {
          // Destroy the card
          destroyCard(card, index, player === 'right');

          // Check if this sacrifice is part of the Catapult ability sequence
          if (sacrificePendingDamage) {
            // Reset the pending damage flag
            setSacrificePendingDamage(false);

            // Reset other targeting modes
            setDamageMode(false);
            setDamageSource(null);
            setDamageValue(0);
            setSniperMode(false);

            alert(`Sacrificed ${card.name}. Catapult ability complete.`);
          }
          // Handle other sacrifice effects
          else if (sacrificeEffect === 'draw') {
            if (drawDeck && drawDeck.length > 0 && setDrawDeck) {
              const drawnCard = drawDeck[drawDeck.length - 1];
              // Add to player's hand
              setPlayerState((prev) => ({
                ...prev,
                handCards: [...prev.handCards, drawnCard],
              }));
              // Remove from draw deck
              setDrawDeck((prev) => prev.slice(0, -1));
              alert(`Sacrificed ${card.name} and drew a card: ${drawnCard.name}`);
            } else {
              alert(`Sacrificed ${card.name}, but couldn't draw a card.`);
            }
          } else if (sacrificeEffect === 'water') {
            // Use the current setPlayerState prop that's already available
            setPlayerState((prev) => ({
              ...prev,
              waterCount: prev.waterCount + 1,
            }));
            alert(`Sacrificed ${card.name} and gained 1 water`);
          } else if (sacrificeEffect === 'restore') {
            // Enter restore mode
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
        } else if (restorePersonReadyMode && player === gameState.currentTurn && card?.isDamaged) {
          applyRestore(card, index, player === 'right');
        } else if (returnToHandMode && card && player === gameState.currentTurn) {
          // Return the card to the player's hand
          setPlayerState((prev) => {
            // Add the card to hand
            const updatedHandCards = [...prev.handCards, card];

            // Remove the card from its slot
            const updatedPersonSlots = prev.personSlots.map((slot, i) => (i === index ? null : slot));

            // Update protection status
            const columnIndex = Math.floor(index / 2);
            const { personSlots, campSlots } = updateProtectedStatus(updatedPersonSlots, prev.campSlots, columnIndex);

            return {
              ...prev,
              handCards: updatedHandCards,
              personSlots,
              campSlots,
            };
          });

          // Reset return to hand mode
          if (setReturnToHandMode) setReturnToHandMode(false);
          alert(`${card.name} returned to your hand!`);
        } else if (restoreMode && card?.isDamaged && player === restorePlayer) {
          setPlayerState((prev) => ({
            ...prev,
            personSlots: prev.personSlots.map((slot, i) =>
              i === index ? { ...slot, isDamaged: false, isReady: false } : slot
            ),
          }));
          if (setRestoreMode) setRestoreMode(false);
          // Reset restore source index when we exit restore mode
          const gameBoard = document.getElementById('game-board');
          if (gameBoard && (gameBoard as any).setRestoreSourceIndex) {
            (gameBoard as any).setRestoreSourceIndex(undefined);
          }
        } else if (injureMode && card && !card.isProtected) {
          if (card.isPunk || card.isDamaged) {
            alert(`${card.isPunk ? 'Punk' : 'Damaged card'} destroyed!`);
            if (destroyCard) {
              // Use the player prop to determine if this is a right player card
              // player will be either 'left' or 'right'
              destroyCard(card, index, player === 'right');
            }
          } else {
            setPlayerState((prev) => ({
              ...prev,
              personSlots: prev.personSlots.map((slot, i) =>
                i === index ? { ...slot, isDamaged: true, isReady: false } : slot
              ),
            }));
          }
          if (setInjureMode) setInjureMode(false);
        } else if (damageMode && card && (sniperMode || !card.isProtected)) {
          // Handle damage targeting - call the applyDamage function
          applyDamage(card, index, player === 'right');
        } else if (abilityRestoreMode && card && card.isDamaged) {
          // Handle restore targeting
          applyRestore(card, index, player === 'right');
        } else if (destroyPersonMode && card && !card.isProtected) {
          // Handle destroy person targeting - directly destroy the card
          alert(`${card.name} was destroyed!`);
          destroyCard(card, index, player === 'right');

          // Reset destroy person mode
          if (typeof window !== 'undefined') {
            // Look for global setDestroyPersonMode function in GameBoard
            const gameBoard = document.getElementById('game-board');
            if (gameBoard && (gameBoard as any).setDestroyPersonMode) {
              (gameBoard as any).setDestroyPersonMode(false);
            }
          }
        } else if (sacrificeMode && card && player === gameState.currentTurn) {
          // Handle sacrificing this card
          alert(`${card.name} sacrificed!`);

          // Destroy the card
          destroyCard(card, index, player === 'right');

          // Reset sacrifice mode and enable damage mode
          setSacrificeMode(false);
          setSacrificePendingDamage(true);
          setDamageMode(true);
          setDamageValue(1);

          alert('Now select an enemy card to damage');
        } else if (mimicMode && card) {
          // Handle mimicking this card's ability
          alert(`Mimicking ${card.name}'s ability!`);

          // Execute the target card's ability
          if (card.abilities && card.abilities.length > 0) {
            // We'll use the first ability of the target card
            const abilityToMimic = card.abilities[0];

            // Open the ability modal to use the ability
            if (setSelectedCard) setSelectedCard(card);
            if (setSelectedCardLocation) setSelectedCardLocation({ type: 'person', index });
            if (setIsAbilityModalOpen) setIsAbilityModalOpen(true);
          } else {
            alert('This card has no abilities to mimic!');
          }
        } else if (gameState.currentPhase === 'actions' && player === gameState.currentTurn && card) {
          // Check if card is ready
          const isCardReady = card.isReady;
          const isPunk = card.isPunk;
          const hasNativeAbilities = card.abilities?.length > 0;

          // Check if player has an undamaged Argo Yesky in play
          const hasArgoYeskyEffect = hasArgoYeskyTrait(playerState);

          // Card can use ability if:
          // 1. It's ready and has native abilities, OR
          // 2. It's ready and Argo Yesky is in play (which grants all cards a damage ability)
          if (isCardReady && (hasNativeAbilities || hasArgoYeskyEffect)) {
            console.log('Opening ability modal for:', card.name);

            // Check if ability can be used
            if (checkAbilityEnabled && !checkAbilityEnabled(card)) {
              return; // Don't open ability modal if ability check fails
            }

            // Prepare the card to use in the ability modal
            let cardToUse = card;

            // If Argo Yesky is in play, add or append the damage ability
            if (hasArgoYeskyEffect) {
              const argoYeskyAbility = {
                effect: 'Do 1 damage to an unprotected enemy card (via Argo Yesky)',
                cost: 1,
                type: 'damage',
                target: 'any',
                value: 1,
              };

              // If card already has abilities, add Argo's ability to the list
              // Otherwise create a new abilities array with just Argo's ability
              const newAbilities =
                cardToUse.abilities?.length > 0 ? [...cardToUse.abilities, argoYeskyAbility] : [argoYeskyAbility];

              cardToUse = {
                ...card,
                abilities: newAbilities,
              };
            }

            // Open ability modal for this card
            if (typeof setSelectedCard === 'function') {
              console.log('setSelectedCard exists');
              setSelectedCard(cardToUse);
            } else {
              console.log('setSelectedCard is not a function');
            }

            if (typeof setSelectedCardLocation === 'function') {
              setSelectedCardLocation({ type: 'person', index: index });
            }

            if (typeof setIsAbilityModalOpen === 'function') {
              console.log('Opening modal');
              setIsAbilityModalOpen(true);
            } else {
              console.log('setIsAbilityModalOpen is not a function');
            }
          }
        }
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
