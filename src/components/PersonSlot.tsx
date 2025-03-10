'use client';
import React from 'react';
import { Card, PlayerState } from '@/types/game';

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
  checkAbilityEnabled?: (card: Card) => boolean; // Function to check if an ability can be used
  setInjureMode?: (value: boolean) => void;
  damageMode?: boolean;
  sacrificeMode?: boolean;
  setSacrificeMode?: (value: boolean) => void;
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
  setSacrificePendingDamage,
  setDamageMode,
  setDamageValue,
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
}: PersonSlotProps) => {
  return (
    <div
      className={`w-24 h-32 border-2 ${
        ((punkPlacementMode && !card) ||
          (restoreMode && card?.isDamaged && player === restorePlayer) ||
          (injureMode && card && !card.isProtected) ||
          (destroyPersonMode && card) || // Add this line for destroy person mode
          (damageMode && card) || // Just check that the card exists for damageMode
          (sacrificeMode && player === gameState.currentTurn && card) ||
          (damageColumnMode && player !== gameState.currentTurn) ||
          (abilityRestoreMode && card?.isDamaged) ||
          (mimicMode && card)) &&
        isInteractable('person', player, index) // This will handle protection checks
          ? 'border-purple-400 animate-pulse cursor-pointer'
          : 'border-gray-400'
      } rounded bg-gray-700 mb-4`}
      onClick={() => {
        console.log('Card clicked!', card);
        console.log('Current phase:', gameState.currentPhase);
        console.log('Current turn:', gameState.currentTurn);
        console.log('Card player:', player);

        // Only allow interaction if the element is interactable
        if (!isInteractable('person', player, index)) return;
        if (punkPlacementMode && !card && punkCardToPlace) {
          setPlayerState((prev) => ({
            ...prev,
            personSlots: prev.personSlots.map((slot, i) =>
              i === index
                ? {
                    id: punkCardToPlace.id,
                    name: 'Punk',
                    type: 'person',
                    isPunk: true,
                    isReady: true,
                  }
                : slot
            ),
          }));

          if (setPunkPlacementMode) setPunkPlacementMode(false);
          if (setPunkCardToPlace) setPunkCardToPlace(null);
        } else if (returnToHandMode && card && player === gameState.currentTurn) {
          // Return the card to the player's hand
          setPlayerState((prev) => {
            // Add the card to hand
            const updatedHandCards = [...prev.handCards, card];

            // Remove the card from its slot
            const updatedPersonSlots = prev.personSlots.map((slot, i) => (i === index ? null : slot));

            const columnIndex = Math.floor(index / 2);
            const { personSlots, campSlots } = updateProtectedStatus(updatedSlots, prev.campSlots, columnIndex);

            return {
              ...prev,
              handCards: updatedHandCards,
              personSlots,
              campSlots,
            };
          });

          // Reset return to hand mode
          setReturnToHandMode(false);
          alert(`${card.name} returned to your hand!`);
        } else if (restoreMode && card?.isDamaged) {
          setPlayerState((prev) => ({
            ...prev,
            personSlots: prev.personSlots.map((slot, i) =>
              i === index ? { ...slot, isDamaged: false, isReady: false } : slot
            ),
          }));
          if (setRestoreMode) setRestoreMode(false);
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
          if (typeof window !== 'undefined' && window.setDestroyPersonMode) {
            window.setDestroyPersonMode(false);
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
        } else if (
          gameState.currentPhase === 'actions' &&
          player === gameState.currentTurn &&
          card &&
          card.isReady &&
          card.abilities?.length > 0
        ) {
          console.log('Opening ability modal for:', card.name);

          // Check if ability can be used
          if (checkAbilityEnabled && !checkAbilityEnabled(card)) {
            return; // Don't open ability modal if ability check fails
          }

          // Open ability modal for this card
          if (typeof setSelectedCard === 'function') {
            console.log('setSelectedCard exists');
            setSelectedCard(card);
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
      }}
      onDragOver={(e) => {
        e.preventDefault();
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

          if (draggedCard.traits?.includes('free_in_destroyed_camp')) {
            // Check if the current column has a destroyed camp (null)
            const campDestroyed = playerState.campSlots[columnIndex] === null;

            if (campDestroyed) {
              playCost = 0;
              freePlay = true;
            }
          }

          if (playerState.waterCount < playCost) {
            alert(`Not enough water! This card costs ${playCost} water to play.`);
            return;
          }

          setPlayerState((prev) => {
            // Determine if the card should start ready based on traits
            const shouldStartReady = draggedCard.traits?.includes('start_ready') || false;

            const updatedSlots = prev.personSlots.map((slot, i) =>
              i === index ? { ...draggedCard, isReady: shouldStartReady } : slot
            );

            // Calculate the column index from the slot index
            const columnIndex = Math.floor(index / 2);

            // Pass the column index to updateProtectedStatus
            const { personSlots, campSlots } = updateProtectedStatus(updatedSlots, prev.campSlots, columnIndex);

            return {
              ...prev,
              personSlots,
              campSlots,
              waterCount: prev.waterCount - playCost, // Deduct water cost (will be 0 for free plays)
              handCards: prev.handCards.filter((card) => card.id !== cardId),
            };
          });

          // Handle card entry traits
          // Check if the played card is Zeto Kahn
          if (draggedCard.name === 'Zeto Kahn') {
            console.log(`${player} player played Zeto Kahn`);
            const gameBoard = document.getElementById('game-board');
            if (gameBoard && gameBoard.setPlayerHasZetoKahn) {
              console.log(`Setting ${player}HasZetoKahn to true`);
              gameBoard.setPlayerHasZetoKahn(player, true);
            }
          }
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
              // Call the restore effect function defined in the gameBoard
              gameBoard.restoreEffect(player);
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
              alert(`${draggedCard.name} entered play: Opponent's events moved back in queue!`);
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
            card.abilities?.length > 0 &&
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
