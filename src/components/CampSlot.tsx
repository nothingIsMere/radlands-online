// src/components/CampSlot.tsx
'use client';
import React from 'react';
import { Card, PlayerState } from '@/types/game';
import { AbilityService } from '../../services/abilityService';

interface CampSlotProps {
  index: number;
  card: Card | null;
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  gameState: any;
  player: 'left' | 'right';
  isInteractable: (element: 'person' | 'event' | 'camp', elementPlayer: 'left' | 'right', slotIndex: number) => boolean;

  // Add all the other props you need
  applyDamage?: (card: Card, slotIndex: number, isRightPlayer: boolean) => void;
  campRaidMode?: boolean;
  raidingPlayer?: 'left' | 'right' | null;
  damageMode?: boolean;
  sniperMode?: boolean;
  campDamageMode?: boolean;
  destroyCampMode?: boolean;
  damageColumnMode?: boolean;
  restoreMode?: boolean;
  restorePlayer?: 'left' | 'right' | null;
  abilityRestoreMode?: boolean;
  multiRestoreMode?: boolean;
  applyRestore?: (card: Card, slotIndex: number, isRightPlayer: boolean) => void;
  addToDiscardPile?: (card: Card) => void;

  // Add any other props needed
  setSelectedCard?: (card: Card | null) => void;
  setSelectedCardLocation?: (location: { type: 'person' | 'camp'; index: number } | null) => void;
  setIsAbilityModalOpen?: (isOpen: boolean) => void;
  checkAbilityEnabled?: (card: Card) => boolean;

  // Additional state setters
  setDamageMode?: (value: boolean) => void;
  setDamageSource?: (card: Card | null) => void;
  setDamageValue?: (value: number) => void;
  setCampDamageMode?: (value: boolean) => void;
  setSniperMode?: (value: boolean) => void;
  destroyCamp?: (camp: Card, slotIndex: number, isRightPlayer: boolean) => void;
}

const CampSlot: React.FC<CampSlotProps> = ({
  index,
  card,
  playerState,
  setPlayerState,
  gameState,
  player,
  isInteractable,
  applyDamage,
  campRaidMode,
  raidingPlayer,
  damageMode,
  sniperMode,
  campDamageMode,
  destroyCampMode,
  damageColumnMode,
  restoreMode,
  restorePlayer,
  abilityRestoreMode,
  multiRestoreMode,
  applyRestore,
  setSelectedCard,
  setSelectedCardLocation,
  setIsAbilityModalOpen,
  checkAbilityEnabled,
  setDamageMode,
  setDamageSource,
  setDamageValue,
  setCampDamageMode,
  setSniperMode,
  destroyCamp,
  setDamageColumnMode,
  updateProtectionStatus,
  addToDiscardPile,
}) => {
  const processColumnDiscards = () => {
    const columnIndex = index;
    const frontRowIndex = columnIndex * 2;
    const backRowIndex = frontRowIndex + 1;
    const frontPerson = playerState.personSlots[frontRowIndex];
    const backPerson = playerState.personSlots[backRowIndex];

    // Handle discards for destroyed cards
    if (frontPerson && (frontPerson.isDamaged || frontPerson.isPunk) && addToDiscardPile) {
      addToDiscardPile(frontPerson);
    }

    if (backPerson && (backPerson.isDamaged || backPerson.isPunk) && addToDiscardPile) {
      addToDiscardPile(backPerson);
    }
  };

  const handleClick = () => {
    // Only proceed if interaction is allowed
    if (!isInteractable('camp', player, index)) return;

    // Handle campRaidMode
    if (campRaidMode && raidingPlayer !== player && card) {
      if (card.isDamaged) {
        // If camp is already damaged, destroy it
        alert('Camp destroyed!');
        if (destroyCamp) destroyCamp(card, index, player === 'right');
      } else {
        // Otherwise, damage it
        alert('Camp damaged!');
        setPlayerState((prev) => ({
          ...prev,
          campSlots: prev.campSlots.map((c, i) => (i === index ? { ...c, isDamaged: true } : c)),
        }));
      }
      return;
    }

    // Handle damageColumnMode
    if (damageColumnMode && gameState.currentTurn !== player && card) {
      processColumnDiscards();

      // Get the column index (same as camp index)
      const columnIndex = index;

      // First, get references to all cards in this column
      const frontRowIndex = columnIndex * 2;
      const backRowIndex = frontRowIndex + 1;
      const frontPerson = playerState.personSlots[frontRowIndex];
      const backPerson = playerState.personSlots[backRowIndex];
      const campCard = card;

      // Apply damage to the entire column in a single state update
      if (player === 'left') {
        setPlayerState((prev) => {
          // Create new arrays to avoid direct state mutation
          const newPersonSlots = [...prev.personSlots];
          const newCampSlots = [...prev.campSlots];

          // Process front row person
          if (frontPerson) {
            if (frontPerson.isDamaged || frontPerson.isPunk) {
              // Destroy the person - discard is handled separately by processColumnDiscards
              newPersonSlots[frontRowIndex] = null;
            } else {
              // Just mark as damaged
              newPersonSlots[frontRowIndex] = { ...frontPerson, isDamaged: true, isReady: false };
            }
          }

          // Process back row person
          if (backPerson) {
            if (backPerson.isDamaged || backPerson.isPunk) {
              // Destroy the person - discard is handled separately by processColumnDiscards
              newPersonSlots[backRowIndex] = null;
            } else {
              // Just mark as damaged
              newPersonSlots[backRowIndex] = { ...backPerson, isDamaged: true, isReady: false };
            }
          }

          // Process camp card
          if (campCard) {
            if (campCard.isDamaged) {
              // Destroy the camp
              newCampSlots[columnIndex] = null;
            } else {
              // Just mark as damaged
              newCampSlots[columnIndex] = { ...campCard, isDamaged: true };
            }
          }

          // Update protection status
          const updatedState = updateProtectionStatus
            ? updateProtectionStatus(newPersonSlots, newCampSlots)
            : { personSlots: newPersonSlots, campSlots: newCampSlots };

          return {
            ...prev,
            ...updatedState,
          };
        });
      } else {
        // Similar process for right player
        setPlayerState((prev) => {
          // Create new arrays to avoid direct state mutation
          const newPersonSlots = [...prev.personSlots];
          const newCampSlots = [...prev.campSlots];

          // Process front row person
          if (frontPerson) {
            if (frontPerson.isDamaged || frontPerson.isPunk) {
              // Destroy the person
              newPersonSlots[frontRowIndex] = null;

              // Add to discard pile (handled elsewhere)
              // if (typeof window !== 'undefined' && window.document) {
              //   const gameBoard = document.getElementById('game-board');
              //   if (gameBoard && gameBoard.addToDiscardPile) {
              //     gameBoard.addToDiscardPile(frontPerson);
              //   }
              // }
            } else {
              // Just mark as damaged
              newPersonSlots[frontRowIndex] = { ...frontPerson, isDamaged: true, isReady: false };
            }
          }

          // Process back row person
          if (backPerson) {
            if (backPerson.isDamaged || backPerson.isPunk) {
              // Destroy the person
              newPersonSlots[backRowIndex] = null;

              // Add to discard pile (handled elsewhere)
              // if (typeof window !== 'undefined' && window.document) {
              //   const gameBoard = document.getElementById('game-board');
              //   if (gameBoard && gameBoard.addToDiscardPile) {
              //     gameBoard.addToDiscardPile(backPerson);
              //   }
              // }
            } else {
              // Just mark as damaged
              newPersonSlots[backRowIndex] = { ...backPerson, isDamaged: true, isReady: false };
            }
          }

          // Process camp card
          if (campCard) {
            if (campCard.isDamaged) {
              // Destroy the camp
              newCampSlots[columnIndex] = null;
            } else {
              // Just mark as damaged
              newCampSlots[columnIndex] = { ...campCard, isDamaged: true };
            }
          }

          // Update protection status
          const updatedState = updateProtectionStatus
            ? updateProtectionStatus(newPersonSlots, newCampSlots)
            : { personSlots: newPersonSlots, campSlots: newCampSlots };

          return {
            ...prev,
            ...updatedState,
          };
        });
      }

      // Reset column damage mode
      if (setDamageColumnMode) setDamageColumnMode(false);

      alert(`Damaged all cards in column ${columnIndex + 1}!`);
      console.log('------- Column Damage Completed -------');

      return true;
    }

    // Handle destroyCampMode
    if (destroyCampMode && gameState.currentTurn !== player && card) {
      alert(`${card.name} destroyed!`);
      if (destroyCamp) {
        destroyCamp(card, index, player === 'right');
      }

      // Complete the ability after destroying the camp
      // You might need to import AbilityService at the top of the file
      if (typeof window !== 'undefined' && window.AbilityService && window.AbilityService.isAbilityActive()) {
        window.AbilityService.completeAbility();
      }

      return;
    }

    // Handle damageMode
    if (damageMode && gameState.currentTurn !== player && card && (sniperMode || !card.isProtected)) {
      if (applyDamage) applyDamage(card, index, player === 'right');
      return;
    }

    // Handle campDamageMode
    if (campDamageMode && gameState.currentTurn !== player && card) {
      if (sniperMode || !card.isProtected) {
        if (applyDamage) applyDamage(card, index, player === 'right');

        // Reset targeting modes
        if (setDamageMode) setDamageMode(false);
        if (setDamageSource) setDamageSource(null);
        if (setDamageValue) setDamageValue(0);
        if (setCampDamageMode) setCampDamageMode(false);
        if (setSniperMode) setSniperMode(false);
      } else {
        alert(`${card.name} is protected and cannot be targeted!`);
      }
      return;
    }

    // Handle restoreMode and abilityRestoreMode
    if (
      (restoreMode && restorePlayer === player && card?.isDamaged) ||
      (abilityRestoreMode && gameState.currentTurn === player && card?.isDamaged) ||
      (multiRestoreMode && gameState.currentTurn === player && card?.isDamaged)
    ) {
      if (applyRestore) applyRestore(card, index, player === 'right');
      return;
    }

    // Handle ability activation
    if (isInteractable('camp', player, index) && card && card.abilities && card.abilities.length > 0) {
      // Check if ability can be used
      if (checkAbilityEnabled && !checkAbilityEnabled(card)) {
        return; // Ability check failed
      }

      // Open ability modal
      if (setSelectedCard) setSelectedCard(card);
      if (setSelectedCardLocation) setSelectedCardLocation({ type: 'camp', index });
      if (setIsAbilityModalOpen) setIsAbilityModalOpen(true);
      return;
    }
  };

  return (
    <div
      className={`w-24 h-32 border-2 rounded
        ${card === null ? 'bg-black' : card?.isDamaged ? 'bg-red-900' : 'bg-gray-700'}
        ${
          (campRaidMode && raidingPlayer !== player && card) ||
          (damageMode && gameState.currentTurn !== player && card && (sniperMode || !card?.isProtected)) ||
          (destroyCampMode && gameState.currentTurn !== player && card) ||
          (abilityRestoreMode && gameState.currentTurn === player && card?.isDamaged) ||
          (multiRestoreMode && gameState.currentTurn === player && card?.isDamaged) ||
          (restoreMode && restorePlayer === player && card?.isDamaged) ||
          (damageColumnMode && gameState.currentTurn !== player) ||
          (campDamageMode && gameState.currentTurn !== player && card && (sniperMode || !card?.isProtected))
            ? 'border-purple-400 animate-pulse cursor-pointer'
            : card?.isDamaged
            ? 'border-red-700'
            : 'border-gray-400'
        }
      `}
      onClick={handleClick}
    >
      <div className="text-white text-center text-xs mt-4">
        {card === null ? (
          <>
            Camp {index + 1}
            <br />
            Destroyed
          </>
        ) : (
          <>
            {card?.name}
            <br />
            {card?.type}
            <br />
            {card?.isProtected ? 'Protected' : 'Unprotected'}
            <br />
            {card?.isDamaged ? 'Damaged (can use abilities)' : 'Not Damaged'}
            <br />
            {card?.traits?.includes('starts_damaged') ? '(Starts Damaged)' : ''}
            <br />
            {card?.isReady ? 'Ready' : 'Not Ready'}
          </>
        )}
      </div>
    </div>
  );
};

export default CampSlot;
