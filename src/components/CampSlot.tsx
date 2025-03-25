// src/components/CampSlot.tsx
'use client';
import React from 'react';
import { Card, PlayerState } from '@/types/game';

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
}) => {
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
      console.log('Attempting to damage column with camp:', {
        camp: card.name,
        columnIndex: index,
        isProtected: card.isProtected,
      });

      // Get the column index (same as camp index)
      const columnIndex = index;

      // Apply damage to all cards in this column
      // First, the person cards (indices for front and back row)
      const frontRowIndex = columnIndex * 2;
      const backRowIndex = frontRowIndex + 1;

      const frontPerson = playerState.personSlots[frontRowIndex];
      const backPerson = playerState.personSlots[backRowIndex];

      // Damage front person if it exists
      if (frontPerson && applyDamage) {
        applyDamage(frontPerson, frontRowIndex, player === 'right');
      }

      // Damage back person if it exists
      if (backPerson && applyDamage) {
        applyDamage(backPerson, backRowIndex, player === 'right');
      }

      // Damage the camp itself
      if (card && applyDamage) {
        applyDamage(card, columnIndex, player === 'right');
      }

      // Reset column damage mode
      if (setDamageColumnMode) setDamageColumnMode(false);

      alert(`Damaged all cards in column ${columnIndex + 1}!`);
      return;
    }

    // Handle destroyCampMode
    if (destroyCampMode && gameState.currentTurn !== player && card) {
      alert(`${card.name} destroyed!`);
      if (destroyCamp) destroyCamp(card, index, player === 'right');
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
