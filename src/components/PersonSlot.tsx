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
  setRestoreMode?: (value: boolean) => void;
  updateProtectedStatus: (slots: (Card | null)[]) => (Card | null)[];
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
  setRestoreMode,
  updateProtectedStatus,
}: PersonSlotProps) => {
  return (
    <div
      className={`w-24 h-32 border-2 ${
        (punkPlacementMode && !card) || (restoreMode && card?.isDamaged)
          ? 'border-purple-400 animate-pulse cursor-pointer'
          : 'border-gray-400'
      } rounded bg-gray-700 mb-4`}
      onClick={() => {
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
        } else if (restoreMode && card?.isDamaged) {
          alert('Attempting to restore card');
          setPlayerState((prev) => ({
            ...prev,
            personSlots: prev.personSlots.map((slot, i) =>
              i === index ? { ...slot, isDamaged: false, isReady: false } : slot
            ),
          }));
          if (setRestoreMode) setRestoreMode(false);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDragStart={(e) => {
        if (card) {
          e.dataTransfer.setData('cardId', card.id);
          e.dataTransfer.setData('sourceType', 'personSlot');
          e.dataTransfer.setData('sourceIndex', index.toString());
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('cardId');
        const draggedCard = playerState.handCards.find((card) => card.id === cardId);

        if (draggedCard && draggedCard.type === 'person' && !card) {
          setPlayerState((prev) => {
            const updatedSlots = prev.personSlots.map((slot, i) =>
              i === index ? { ...draggedCard, isReady: false } : slot
            );
            return {
              ...prev,
              personSlots: updateProtectedStatus(updatedSlots),
              handCards: prev.handCards.filter((card) => card.id !== cardId),
            };
          });
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
