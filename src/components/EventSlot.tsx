'use client';

import React from 'react';
import { Card, PlayerState } from '@/types/game';

interface EventSlotProps {
  index: number;
  card: Card | null;
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
}

const EventSlot = ({ index, card, playerState, setPlayerState }: EventSlotProps) => {
  return (
    <div
      className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700"
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('cardId');
        const draggedCard = playerState.handCards.find((card) => card.id === cardId);

        if (!draggedCard || draggedCard.type !== 'event' || !draggedCard.startingQueuePosition || card) {
          return;
        }

        const slotNumber = 3 - index; // Convert index to slot number
        const startPos = draggedCard.startingQueuePosition;

        // Check if this is a valid slot and if any earlier valid slots are empty
        if (slotNumber >= startPos) {
          for (let i = startPos; i < slotNumber; i++) {
            if (!playerState.eventSlots[3 - i]) {
              // if any earlier valid slot is empty
              return; // can't place here, must use earlier slot
            }
          }

          setPlayerState((prev) => ({
            ...prev,
            eventSlots: prev.eventSlots.map((slot, i) => (i === index ? draggedCard : slot)),
            handCards: prev.handCards.filter((card) => card.id !== cardId),
          }));
        }
      }}
    >
      {card ? (
        <div className="text-white text-center text-xs mt-4">
          {card.name}
          <br />
          {card.type}
          <br />
          {card.id}
        </div>
      ) : (
        <div className="text-white text-center mt-12">Event {3 - index}</div>
      )}
    </div>
  );
};

export default EventSlot;
